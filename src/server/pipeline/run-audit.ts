import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { logger, errorMessage } from '@/lib/logger'
import { collectSignals } from '@/server/signals'
import { crawlWebsite } from '@/server/crawl'
import { analyzeAudit } from '@/server/ai/analyze'
import { buildReportHtml } from '@/report/template'
import { renderReportPdf } from '@/report/render'
import { stampPageNumbers } from '@/report/page-numbers'
import { downloadFilenameFor, reportKeyFor, reportStorage } from '@/report/storage'
import { deliverNotifications } from '@/server/notifications'
import { progressFor, type StageKey } from './stages'
import type { AiAnalysis } from '@/server/ai/schema'
import type { AuditSignals, AuditTarget } from '@/types/audit'

export interface PipelineDeps {
  /** Injectable crawler for integration tests without network access. */
  crawl?: typeof crawlWebsite
}

/**
 * The audit pipeline:
 * crawl → integrations → deterministic checks → AI analysis → persistence →
 * PDF report → notifications → completion.
 *
 * Idempotent: re-running a completed audit returns immediately, the report row
 * is upserted and notifications deduplicate completed attempts.
 */
export async function runAuditPipeline(auditId: string, deps: PipelineDeps = {}): Promise<void> {
  const audit = await prisma.audit.findUnique({
    where: { id: auditId },
    include: { website: { include: { client: true } } },
  })
  if (!audit) throw new Error(`Audit ${auditId} was not found`)

  const runLog = logger.child({ auditId, websiteId: audit.websiteId, attempt: audit.attempt })

  if (audit.status === 'COMPLETED') {
    runLog.info('Audit already completed; skipping duplicate pipeline run')
    return
  }

  const startedAt = audit.startedAt ?? new Date()
  const target: AuditTarget = {
    url: audit.website.url,
    businessType: audit.website.businessType,
    city: audit.website.city,
    state: audit.website.state,
    clientName: audit.website.client.company || audit.website.client.name,
  }

  const stage = async (key: StageKey, message: string, meta?: Record<string, unknown>) => {
    await prisma.audit.update({
      where: { id: auditId },
      data: { stage: key, progress: progressFor(key) },
    })
    await prisma.auditEvent.create({
      data: {
        auditId,
        stage: key,
        status: key === 'completed' ? 'success' : 'info',
        message,
        ...(meta ? { meta: meta as Prisma.InputJsonValue } : {}),
      },
    })
    runLog.info(message, { stage: key, meta })
  }

  try {
    await prisma.audit.update({
      where: { id: auditId },
      data: { status: 'RUNNING', stage: 'crawling', progress: progressFor('crawling'), startedAt, error: null },
    })

    const signals = await collectSignals(target, {
      crawl: deps.crawl,
      onStage: async (key, detail) => {
        if (key === 'crawling' || key === 'technical-checks') {
          await stage(key as StageKey, detail ?? 'Collecting signals')
        }
      },
    })

    await prisma.audit.update({
      where: { id: auditId },
      data: {
        signals: signals as unknown as Prisma.InputJsonValue,
        signalSources: signals.meta.integrations as Prisma.InputJsonValue,
      },
    })

    const fails = signals.checks.filter((check) => check.status === 'fail').length
    const warns = signals.checks.filter((check) => check.status === 'warn').length
    await stage(
      'on-page-analysis',
      `${signals.checks.length} checks evaluated · ${fails} failing · ${warns} warnings`,
    )

    await stage('ai-analysis', 'Requesting prioritised analysis')
    const { analysis, provenance } = await analyzeAudit(target, signals)

    await prisma.audit.update({
      where: { id: auditId },
      data: {
        aiResult: analysis as unknown as Prisma.InputJsonValue,
        aiSource: provenance.source,
        aiModel: provenance.model,
        aiLatencyMs: provenance.latencyMs,
        overallScore: analysis.overall_score,
        scoreBreakdown: analysis.score_breakdown as Prisma.InputJsonValue,
      },
    })
    await stage('persistence', `Analysis validated and stored (source: ${provenance.source})`, {
      source: provenance.source,
      repaired: provenance.repaired,
    })

    await stage('report', 'Rendering the PDF report')
    const generatedAt = new Date()
    const html = buildReportHtml({
      auditId,
      generatedAt,
      completedAt: generatedAt,
      createdAt: audit.createdAt,
      aiSource: provenance.source,
      aiModel: provenance.model,
      analysis,
      signals,
      website: {
        url: audit.website.url,
        label: audit.website.label,
        businessType: audit.website.businessType,
        city: audit.website.city,
        state: audit.website.state,
      },
      client: { name: audit.website.client.name, company: audit.website.client.company },
    })

    const pdf = await stampPageNumbers(await renderReportPdf(html))
    const storageKey = reportKeyFor(audit.clientId, auditId)
    const stored = await reportStorage().put(storageKey, pdf)

    await prisma.report.upsert({
      where: { auditId },
      create: {
        auditId,
        storageKey: stored.key,
        filename: downloadFilenameFor(audit.website.url, auditId, generatedAt),
        mimeType: 'application/pdf',
        sizeBytes: stored.size,
        generatedAt,
      },
      update: {
        storageKey: stored.key,
        filename: downloadFilenameFor(audit.website.url, auditId, generatedAt),
        sizeBytes: stored.size,
        generatedAt,
      },
    })

    await stage('notifications', 'Delivering client notifications')
    await deliverNotifications({
      auditId,
      client: {
        id: audit.clientId,
        name: audit.website.client.name,
        company: audit.website.client.company,
        contactEmail: audit.website.client.contactEmail,
        phone: audit.website.client.phone,
      },
      siteUrl: audit.website.url,
      score: analysis.overall_score,
      reportKey: storageKey,
      generatedAt,
    })

    const completedAt = new Date()
    await prisma.audit.update({
      where: { id: auditId },
      data: {
        status: 'COMPLETED',
        stage: 'completed',
        progress: 100,
        completedAt,
        durationMs: completedAt.getTime() - startedAt.getTime(),
        error: null,
      },
    })
    await prisma.auditEvent.create({
      data: {
        auditId,
        stage: 'completed',
        status: 'success',
        message: `Audit completed — overall score ${analysis.overall_score}/100`,
      },
    })
    runLog.info('Audit pipeline completed', {
      score: analysis.overall_score,
      durationMs: completedAt.getTime() - startedAt.getTime(),
      aiSource: provenance.source,
    })
  } catch (error) {
    const message = errorMessage(error)
    runLog.error('Audit pipeline failed', { error: message })
    await prisma.audit
      .update({
        where: { id: auditId },
        data: {
          status: 'FAILED',
          stage: 'failed',
          error: message.slice(0, 900),
          completedAt: new Date(),
          durationMs: Date.now() - startedAt.getTime(),
        },
      })
      .catch(() => undefined)
    await prisma.auditEvent
      .create({
        data: { auditId, stage: 'failed', status: 'error', message: message.slice(0, 900) },
      })
      .catch(() => undefined)
    throw error
  }
}

export type { AuditSignals, AiAnalysis }
