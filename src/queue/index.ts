import { Queue } from 'bullmq'
import IORedis from 'ioredis'
import { env } from '@/lib/env'

export const AUDIT_QUEUE_NAME = 'seo-audit-jobs'

/**
 * Redis connection factory.
 * `maxRetriesPerRequest: null` is required by BullMQ workers; Upstash needs the
 * same settings over a rediss:// URL.
 */
export function createRedisConnection() {
  const url = env().REDIS_URL
  return new IORedis(url, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    connectionName: 'edgelink',
    ...(url.startsWith('rediss://') ? { tls: { rejectUnauthorized: true } } : {}),
  })
}

const globalForQueue = globalThis as unknown as {
  auditQueue?: Queue
  auditQueueConnection?: ReturnType<typeof createRedisConnection>
}

export function getAuditQueue(): Queue {
  if (!globalForQueue.auditQueue) {
    globalForQueue.auditQueueConnection = createRedisConnection()
    globalForQueue.auditQueue = new Queue(AUDIT_QUEUE_NAME, {
      connection: globalForQueue.auditQueueConnection,
      defaultJobOptions: {
        attempts: 2,
        backoff: { type: 'exponential', delay: 8000 },
        removeOnComplete: { age: 24 * 3600, count: 500 },
        removeOnFail: { age: 7 * 24 * 3600, count: 500 },
      },
    })
  }
  return globalForQueue.auditQueue
}

/** Job id is stable per audit attempt so retries cannot duplicate work. */
export function jobIdFor(auditId: string, attempt: number): string {
  return `${auditId}-a${attempt}`
}

export async function enqueueAuditJob(auditId: string, attempt: number): Promise<string> {
  const queue = getAuditQueue()
  const jobId = jobIdFor(auditId, attempt)
  await queue.add(
    'audit',
    { auditId, attempt },
    { jobId },
  )
  return jobId
}

export async function queueHealth(): Promise<{
  name: string
  counts: Record<string, number>
  reachable: boolean
  error?: string
}> {
  try {
    const queue = getAuditQueue()
    const counts = await queue.getJobCounts('waiting', 'active', 'completed', 'failed', 'delayed')
    return { name: AUDIT_QUEUE_NAME, counts, reachable: true }
  } catch (error) {
    return {
      name: AUDIT_QUEUE_NAME,
      counts: {},
      reachable: false,
      error: error instanceof Error ? error.message : 'Redis unreachable',
    }
  }
}
