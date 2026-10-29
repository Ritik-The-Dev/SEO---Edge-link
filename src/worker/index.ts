import 'dotenv/config'
import { Worker } from 'bullmq'
import { AUDIT_QUEUE_NAME, createRedisConnection } from '@/queue'
import { runAuditPipeline } from '@/server/pipeline/run-audit'
import { reconcileStuckAudits } from '@/server/reconciliation'
import { env } from '@/lib/env'
import { logger } from '@/lib/logger'

/**
 * Dedicated BullMQ worker process.
 *
 * This must run on a persistent host (VPS / container / Railway / Fly), not as
 * a short-lived serverless function: BullMQ needs long-lived Redis connections
 * and the pipeline (browser rendering, PDF) exceeds serverless time limits.
 */
const connection = createRedisConnection()
const concurrency = env().WORKER_CONCURRENCY

const worker = new Worker(
  AUDIT_QUEUE_NAME,
  async (job) => {
    const data = job.data as { auditId?: string; attempt?: number }
    if (!data.auditId) throw new Error('Job payload is missing auditId')
    const log = logger.child({ jobId: job.id, auditId: data.auditId, attempt: data.attempt ?? 1 })
    log.info('Worker picked up audit job')
    await job.updateProgress(10)
    await runAuditPipeline(data.auditId)
    await job.updateProgress(100)
  },
  {
    connection,
    concurrency,
    lockDuration: 120_000,
    stalledInterval: 30_000,
  },
)

worker.on('completed', (job) => {
  logger.info('Job completed', { jobId: job.id, queue: AUDIT_QUEUE_NAME })
})

worker.on('failed', (job, error) => {
  logger.error('Job failed', {
    jobId: job?.id,
    auditId: job?.data?.auditId,
    attemptsMade: job?.attemptsMade,
    error: error.message,
  })
})

worker.on('error', (error) => {
  logger.error('Worker error', { error: error.message })
})

logger.info('EdgeLink audit worker started', {
  queue: AUDIT_QUEUE_NAME,
  concurrency,
  redis: env().REDIS_URL.replace(/\/\/[^@]*@/, '//***@'),
  useMocks: env().USE_MOCKS,
  aiUseMocks: env().AI_USE_MOCKS,
})

reconcileStuckAudits()
  .then((result) => {
    if (result.failed > 0) logger.warn('Reconciled stale audits at startup', result)
  })
  .catch((error) => logger.error('Startup reconciliation failed', { error: String(error) }))

const shutdown = async (signal: string) => {
  logger.info('Worker shutting down', { signal })
  try {
    await worker.close()
    await connection.quit()
    process.exit(0)
  } catch (error) {
    logger.error('Error during shutdown', { error: String(error) })
    process.exit(1)
  }
}

process.on('SIGTERM', () => void shutdown('SIGTERM'))
process.on('SIGINT', () => void shutdown('SIGINT'))
