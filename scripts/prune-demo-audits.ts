/**
 * Prunes duplicate demo audits left behind by repeated E2E/verification runs.
 *
 * Keeps the newest completed audit per website, plus the newest failed audit
 * (so the Retry affordance is demonstrable), and the newest audit per trigger
 * so the "scheduled" badge still appears in the UI. Everything else is removed
 * together with its events, reports and notification attempts (cascade).
 *
 * Usage: npx tsx scripts/prune-demo-audits.ts          (dry run)
 *        npx tsx scripts/prune-demo-audits.ts --apply
 */
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const apply = process.argv.includes('--apply')

async function main() {
  const audits = await prisma.audit.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      status: true,
      trigger: true,
      overallScore: true,
      createdAt: true,
      website: { select: { id: true, url: true } },
    },
  })

  const keep = new Set<string>()
  const newestCompletedPerSite = new Set<string>()
  let newestFailed: string | null = null
  let newestScheduled: string | null = null

  for (const audit of audits) {
    if (audit.status === 'COMPLETED' && !newestCompletedPerSite.has(audit.website.id)) {
      newestCompletedPerSite.add(audit.website.id)
      keep.add(audit.id)
    }
    if (audit.status === 'FAILED' && !newestFailed) {
      newestFailed = audit.id
      keep.add(audit.id)
    }
    if (audit.trigger === 'SCHEDULED' && !newestScheduled) {
      newestScheduled = audit.id
      keep.add(audit.id)
    }
  }

  const remove = audits.filter((audit) => !keep.has(audit.id))
  console.table(
    audits.map((audit) => ({
      createdAt: audit.createdAt.toISOString(),
      status: audit.status,
      trigger: audit.trigger,
      score: audit.overallScore,
      website: audit.website.url,
      keep: keep.has(audit.id),
    })),
  )

  console.log(`${audits.length} audits, keeping ${keep.size}, removing ${remove.length}`)
  if (!apply || remove.length === 0) {
    console.log(apply ? 'Nothing to remove.' : 'Dry run — pass --apply to delete.')
    return
  }

  const result = await prisma.audit.deleteMany({ where: { id: { in: remove.map((a) => a.id) } } })
  console.log(`Deleted ${result.count} audits.`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
