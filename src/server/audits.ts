import { prisma } from '@/lib/db'
import { HttpError, badRequest, notFound } from '@/lib/api'
import { logger } from '@/lib/logger'
import { enqueueAuditJob } from '@/queue'
import type { Audit, AuditTrigger } from '@prisma/client'

/** Two identical requests within this window reuse the same audit. */
export const DEDUPE_WINDOW_MS = 10 * 60 * 1000

export interface CreateAuditResult {
  audit: Audit
  deduplicated: boolean
}

/**
 * Creates the audit record, then submits the BullMQ job.
 *
 * Database + queue cannot be atomic across systems. The record is written first
 * and marked FAILED (with an event) if queue submission fails, so no phantom
 * "queued" audit is ever shown. `reconcileStuckAudits` cleans up the opposite
 * case: a job that never gets picked up.
 */
export async function createAuditForWebsite(input: {
  websiteId: string
  requestedById?: string | null
  trigger?: AuditTrigger
}): Promise<CreateAuditResult> {
  const website = await prisma.website.findUnique({
    where: { id: input.websiteId },
    include: { client: true },
  })
  if (!website) throw notFound('Website not found')
  if (website.status === 'ARCHIVED') throw badRequest('Archived websites cannot be audited')
  if (!website.client.isActive) throw badRequest('This client is inactive')

  const existing = await prisma.audit.findFirst({
    where: {
      websiteId: website.id,
      status: { in: ['QUEUED', 'RUNNING'] },
      queuedAt: { gte: new Date(Date.now() - DEDUPE_WINDOW_MS) },
    },
    orderBy: { queuedAt: 'desc' },
  })
  if (existing) return { audit: existing, deduplicated: true }

  let audit = await prisma.audit.create({
    data: {
      websiteId: website.id,
      clientId: website.clientId,
      trigger: input.trigger ?? 'MANUAL',
      requestedById: input.requestedById ?? null,
      status: 'QUEUED',
      stage: 'queued',
      progress: 0,
    },
  })

  await prisma.auditEvent.create({
    data: {
      auditId: audit.id,
      stage: 'queued',
      status: 'info',
      message: `Queued ${(input.trigger ?? 'MANUAL').toLowerCase()} audit for ${website.url}`,
    },
  })

  try {
    const jobId = await enqueueAuditJob(audit.id, audit.attempt)
    audit = await prisma.audit.update({ where: { id: audit.id }, data: { jobId } })
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Queue unavailable'
    logger.error('Queue submission failed', { auditId: audit.id, error: detail })
    await prisma.audit.update({
      where: { id: audit.id },
      data: {
        status: 'FAILED',
        stage: 'failed',
        error: `Could not queue the audit job: ${detail}`.slice(0, 900),
        completedAt: new Date(),
      },
    })
    await prisma.auditEvent.create({
      data: {
        auditId: audit.id,
        stage: 'failed',
        status: 'error',
        message: 'BullMQ queue submission failed — audit recorded as FAILED',
      },
    })
    throw new HttpError(
      503,
      'The audit queue is unavailable. The audit was recorded as failed and can be retried once Redis is reachable.',
      'QUEUE_UNAVAILABLE',
    )
  }

  logger.info('Audit queued', { auditId: audit.id, websiteId: website.id, trigger: audit.trigger, jobId: audit.jobId })
  return { audit, deduplicated: false }
}

/** Re-queues a failed audit. Multiple concurrent retries are rejected. */
export async function retryAudit(auditId: string): Promise<Audit> {
  const existing = await prisma.audit.findUnique({ where: { id: auditId } })
  if (!existing) throw notFound('Audit not found')
  if (existing.status !== 'FAILED') {
    throw new HttpError(409, 'Only failed audits can be retried', 'INVALID_STATE')
  }

  const claimed = await prisma.audit.updateMany({
    where: { id: auditId, status: 'FAILED' },
    data: {
      status: 'QUEUED',
      stage: 'queued',
      progress: 0,
      error: null,
      startedAt: null,
      completedAt: null,
      durationMs: null,
      queuedAt: new Date(),
      attempt: { increment: 1 },
    },
  })
  if (claimed.count === 0) {
    throw new HttpError(409, 'This audit was already retried', 'INVALID_STATE')
  }

  const fresh = await prisma.audit.findUnique({ where: { id: auditId } })
  if (!fresh) throw notFound('Audit not found')

  try {
    const jobId = await enqueueAuditJob(fresh.id, fresh.attempt)
    await prisma.audit.update({ where: { id: fresh.id }, data: { jobId } })
    await prisma.auditEvent.create({
      data: {
        auditId: fresh.id,
        stage: 'queued',
        status: 'info',
        message: `Retry requested (attempt ${fresh.attempt})`,
      },
    })
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Queue unavailable'
    await prisma.audit.update({
      where: { id: fresh.id },
      data: { status: 'FAILED', stage: 'failed', error: `Retry could not be queued: ${detail}`.slice(0, 900) },
    })
    throw new HttpError(503, 'The audit queue is unavailable. Try again shortly.', 'QUEUE_UNAVAILABLE')
  }

  return (await prisma.audit.findUnique({ where: { id: auditId } })) ?? fresh
}
