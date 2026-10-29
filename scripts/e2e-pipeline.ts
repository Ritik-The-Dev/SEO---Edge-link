import 'dotenv/config'
import { Worker } from 'bullmq'
import { prisma } from '../src/lib/db'
import { AUDIT_QUEUE_NAME, createRedisConnection } from '../src/queue'
import { runAuditPipeline } from '../src/server/pipeline/run-audit'
import { createAuditForWebsite } from '../src/server/audits'
import { reportStorage } from '../src/report/storage'
import { analysisSchema } from '../src/server/ai/schema'

/**
 * End-to-end verification:
 * create website → enqueue audit → real BullMQ worker → live crawl →
 * mocked integrations → validated analysis → Postgres persistence →
 * PDF report → notification records → completion.
 *
 * Requires Postgres and Redis to be reachable (docker compose / local services).
 * Run with: npm run test:e2e
 */
const TIMEOUT_MS = 150_000

async function main() {
  const connection = createRedisConnection()
  const workerConnection = createRedisConnection()
  const worker = new Worker(
    AUDIT_QUEUE_NAME,
    async (job) => {
      const { auditId } = job.data as { auditId: string }
      await runAuditPipeline(auditId)
    },
    { connection: workerConnection, concurrency: 1 },
  )

  const client = await prisma.client.findFirst({ where: { websites: { some: { url: 'https://example.com/' } } } })
  if (!client) throw new Error('Seed data missing — run npm run db:seed first')

  const website = await prisma.website.findUnique({ where: { clientId_url: { clientId: client.id, url: 'https://example.com/' } } })
  if (!website) throw new Error('Test website not found — run npm run db:seed first')

  const { audit, deduplicated } = await createAuditForWebsite({ websiteId: website.id, trigger: 'MANUAL' })
  console.log(JSON.stringify({ step: 'queued', auditId: audit.id, status: audit.status, deduplicated, jobId: audit.jobId }))

  const startedAt = Date.now()
  let finished = false

  while (Date.now() - startedAt < TIMEOUT_MS) {
    const current = await prisma.audit.findUnique({
      where: { id: audit.id },
      include: { report: true, notifications: true, events: { orderBy: { createdAt: 'asc' } } },
    })
    if (!current) throw new Error('Audit disappeared')

    if (current.status === 'COMPLETED' || current.status === 'FAILED') {
      finished = true
      console.log(
        JSON.stringify({
          step: 'finished',
          status: current.status,
          stage: current.stage,
          progress: current.progress,
          score: current.overallScore,
          aiSource: current.aiSource,
          aiModel: current.aiModel,
          durationMs: current.durationMs,
          error: current.error,
          events: current.events.map((event) => `${event.stage}: ${event.message}`),
        }),
      )

      if (current.status !== 'COMPLETED') {
        throw new Error(`Audit failed: ${current.error}`)
      }

      if (!current.signals) throw new Error('Signals were not persisted')
      const analysis = analysisSchema.safeParse(current.aiResult)
      if (!analysis.success) throw new Error('Persisted AI result does not match the versioned schema')

      const crawl = (current.signals as Record<string, unknown>).crawl as Record<string, unknown>
      if (!crawl?.finalUrl) throw new Error('Crawl signal missing finalUrl')

      if (!current.report) throw new Error('Report row was not created')
      const pdf = await reportStorage().get(current.report.storageKey)
      if (pdf.byteLength < 10_000) throw new Error(`PDF looks too small (${pdf.byteLength} bytes)`)
      if (pdf.subarray(0, 4).toString() !== '%PDF') throw new Error('Report is not a valid PDF')

      const channels = current.notifications.map((n) => `${n.channel}:${n.status}`)
      if (!channels.some((c) => c.startsWith('WHATSAPP:'))) throw new Error('WhatsApp attempt was not recorded')
      if (!channels.some((c) => c.startsWith('EMAIL:'))) throw new Error('Email attempt was not recorded')

      console.log(
        JSON.stringify({
          step: 'verified',
          crawl: {
            finalUrl: crawl.finalUrl,
            status: crawl.status,
            title: crawl.title,
            checks: Array.isArray((current.signals as Record<string, unknown>).checks)
              ? ((current.signals as Record<string, unknown>).checks as unknown[]).length
              : 0,
          },
          report: { filename: current.report.filename, bytes: pdf.byteLength },
          notifications: channels,
          analysis: {
            overall_score: analysis.data.overall_score,
            recommendations: analysis.data.recommendations.length,
          },
        }),
      )
      break
    }

    await new Promise((resolve) => setTimeout(resolve, 1200))
  }

  if (!finished) throw new Error('Timed out waiting for the audit to finish')

  await worker.close()
  await workerConnection.quit()
  await connection.quit()
  await prisma.$disconnect()
  process.exit(0)
}

main().catch(async (error) => {
  console.error(JSON.stringify({ step: 'error', error: error instanceof Error ? error.message : String(error) }))
  await prisma.$disconnect()
  process.exit(1)
})
