import { prisma } from '@/lib/db'
import { queueHealth } from '@/queue'
import { ok, route } from '@/lib/api'
import { resolveChromePath } from '@/report/render'
import { env } from '@/lib/env'
import { reportStorage } from '@/report/storage'

export const dynamic = 'force-dynamic'

export const GET = route(async () => {
  let database = false
  try {
    await prisma.$queryRaw`SELECT 1`
    database = true
  } catch {
    database = false
  }

  const queue = await queueHealth()
  const chrome = Boolean(resolveChromePath())
  const config = env()

  let storage = 'misconfigured'
  try {
    storage = reportStorage().kind
  } catch {
    storage = 'misconfigured'
  }

  return ok(
    {
      status: database && queue.reachable && storage !== 'misconfigured' ? 'ok' : 'degraded',
      checks: {
        database,
        redis: queue.reachable,
        reportRenderer: chrome,
        storage,
      },
      queue: { name: queue.name, counts: queue.counts },
      modes: {
        integrations: config.USE_MOCKS ? 'mock' : 'live',
        ai: config.AI_USE_MOCKS ? 'mock' : 'claude',
      },
      timestamp: new Date().toISOString(),
    },
    database && queue.reachable ? 200 : 503,
  )
})
