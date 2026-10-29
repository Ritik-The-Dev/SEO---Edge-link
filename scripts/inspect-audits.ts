import 'dotenv/config'
import { prisma } from '../src/lib/db'

async function main() {
  const audits = await prisma.audit.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: { events: { orderBy: { createdAt: 'asc' } }, report: true, notifications: true },
  })

  for (const audit of audits) {
    console.log(
      JSON.stringify(
        {
          id: audit.id,
          websiteId: audit.websiteId,
          status: audit.status,
          stage: audit.stage,
          progress: audit.progress,
          error: audit.error,
          score: audit.overallScore,
          report: audit.report ? { key: audit.report.storageKey, bytes: audit.report.sizeBytes } : null,
          notifications: audit.notifications.map((n) => `${n.channel}:${n.status}`),
          events: audit.events.map((event) => `${event.createdAt.toISOString()} ${event.stage}: ${event.message}`),
        },
        null,
        2,
      ),
    )
  }
  await prisma.$disconnect()
}

main()
