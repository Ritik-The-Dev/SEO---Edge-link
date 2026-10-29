import { prisma } from '@/lib/db'
import { ok, route } from '@/lib/api'
import { requireAdmin } from '@/lib/auth'
import { queueHealth } from '@/queue'
import { resolveChromePath } from '@/report/render'
import { env } from '@/lib/env'

export const GET = route(async () => {
  const user = await requireAdmin()
  const queue = await queueHealth()
  const config = env()

  const [auditCounts, clientCount, websiteCount, scheduleCount] = await Promise.all([
    prisma.audit.groupBy({ by: ['status'], _count: { _all: true } }),
    prisma.client.count(),
    prisma.website.count(),
    prisma.auditSchedule.count({ where: { isEnabled: true } }),
  ])

  return ok({
    user: { name: user.name, email: user.email, role: user.role },
    environment: {
      appUrl: config.APP_URL,
      nodeEnv: config.NODE_ENV,
      useMocks: config.USE_MOCKS,
      aiUseMocks: config.AI_USE_MOCKS,
      aiModel: config.ANTHROPIC_MODEL,
      anthropicConfigured: Boolean(config.ANTHROPIC_API_KEY),
      pageSpeedConfigured: Boolean(config.PAGESPEED_API_KEY),
      emailTransport: config.USE_MOCKS ? 'mock' : config.EMAIL_TRANSPORT,
      reportStorage: config.REPORT_STORAGE,
      reportDir: config.REPORT_DIR,
      reportRendererAvailable: Boolean(resolveChromePath()),
      workerConcurrency: config.WORKER_CONCURRENCY,
      cronConfigured: Boolean(config.CRON_SECRET),
    },
    queue: { name: queue.name, reachable: queue.reachable, counts: queue.counts, error: queue.error },
    totals: {
      clients: clientCount,
      websites: websiteCount,
      activeSchedules: scheduleCount,
      audits: Object.fromEntries(auditCounts.map((row) => [row.status, row._count._all])),
    },
  })
})
