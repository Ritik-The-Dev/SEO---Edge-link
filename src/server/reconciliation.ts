import { prisma } from '@/lib/db'
import { logger } from '@/lib/logger'

const QUEUED_STALE_MS = 15 * 60 * 1000
const RUNNING_STALE_MS = 45 * 60 * 1000

/**
 * Recovery for jobs that never reached the worker, or whose worker died.
 *
 * The API writes the audit row before submitting the BullMQ job; if the process
 * dies in between, or Redis loses the job, the audit would otherwise sit at
 * "queued" forever. This sweep marks such audits FAILED so the UI offers a
 * retry, and is safe to run repeatedly (idempotent conditional updates).
 */
export async function reconcileStuckAudits(now: Date = new Date()): Promise<{ failed: number }> {
  const queuedCutoff = new Date(now.getTime() - QUEUED_STALE_MS)
  const runningCutoff = new Date(now.getTime() - RUNNING_STALE_MS)

  const stuck = await prisma.audit.findMany({
    where: {
      OR: [
        { status: 'QUEUED', queuedAt: { lt: queuedCutoff } },
        { status: 'RUNNING', updatedAt: { lt: runningCutoff } },
      ],
    },
    select: { id: true, status: true },
    take: 50,
  })

  let failed = 0
  for (const audit of stuck) {
    const message =
      audit.status === 'QUEUED'
        ? 'The audit job was not picked up by a worker within 15 minutes. Redis or the worker may be down.'
        : 'The worker stopped reporting progress for 45 minutes. The audit was marked failed so it can be retried.'

    const updated = await prisma.audit.updateMany({
      where: { id: audit.id, status: audit.status },
      data: { status: 'FAILED', stage: 'failed', error: message, completedAt: now },
    })
    if (updated.count === 0) continue
    failed += 1
    await prisma.auditEvent.create({
      data: { auditId: audit.id, stage: 'failed', status: 'error', message },
    })
  }

  if (failed) logger.warn('Reconciled stale audits', { count: failed })
  return { failed }
}
