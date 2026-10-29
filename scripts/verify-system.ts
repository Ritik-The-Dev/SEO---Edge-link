/**
 * Integration verification against the running system (Postgres + worker + web).
 *
 * Checks that unit tests cannot:
 *  - duplicate audit requests inside the dedupe window collapse into one audit
 *  - a due schedule is claimed exactly once even if the cron handler runs twice
 *  - the cron endpoint rejects unauthenticated calls and accepts the secret
 *
 * Run: npx tsx scripts/verify-system.ts
 */
import 'dotenv/config'
import { prisma } from '../src/lib/db'
import { createAuditForWebsite } from '../src/server/audits'
import { processDueSchedules, upsertSchedule } from '../src/server/schedules'
import { env } from '../src/lib/env'

let failures = 0
function check(label: string, ok: boolean, detail = '') {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? ` — ${detail}` : ''}`)
  if (!ok) failures += 1
}

async function main() {
  const websites = await prisma.website.findMany({
    where: { status: 'ACTIVE', client: { isActive: true } },
    include: { client: true },
    take: 4,
  })
  if (websites.length < 2) throw new Error('Need at least two active websites; run prisma db seed first')
  const [dedupeSite, scheduleSite] = websites

  // 1. Dedupe window
  const first = await createAuditForWebsite({ websiteId: dedupeSite!.id, trigger: 'MANUAL' })
  const second = await createAuditForWebsite({ websiteId: dedupeSite!.id, trigger: 'MANUAL' })
  check(
    'duplicate audit request inside the dedupe window reuses the open audit',
    second.deduplicated && second.audit.id === first.audit.id,
    `audit=${first.audit.id}`,
  )

  // 2. Schedule claim idempotency
  const schedule = await upsertSchedule({
    websiteId: scheduleSite!.id,
    dayOfMonth: 1,
    hourUtc: 3,
    isEnabled: true,
  })
  await prisma.auditSchedule.update({ where: { id: schedule.id }, data: { nextRunAt: new Date(Date.now() - 60_000) } })

  const runA = await processDueSchedules()
  const runB = await processDueSchedules()
  check('due schedule is enqueued exactly once', runA.enqueued === 1, JSON.stringify(runA))
  check('second cron run finds nothing left to claim', runB.scanned === 0 || runB.enqueued === 0, JSON.stringify(runB))

  const scheduledAudits = await prisma.audit.count({
    where: { websiteId: scheduleSite!.id, trigger: 'SCHEDULED', queuedAt: { gte: new Date(Date.now() - 120_000) } },
  })
  check('only one scheduled audit row exists for the run', scheduledAudits === 1, `count=${scheduledAudits}`)

  const bumped = await prisma.auditSchedule.findUnique({ where: { id: schedule.id } })
  check('schedule advanced to its next monthly run', (bumped?.nextRunAt.getTime() ?? 0) > Date.now(), bumped?.nextRunAt.toISOString())

  await prisma.auditSchedule.delete({ where: { id: schedule.id } })

  // 3. Cron endpoint authentication
  const base = 'http://localhost:3000/api/cron/schedules'
  const unauthorized = await fetch(base, { headers: { authorization: 'Bearer wrong-secret' } })
  check('cron rejects a wrong bearer token', unauthorized.status === 401, `status=${unauthorized.status}`)

  const authorized = await fetch(base, { headers: { authorization: `Bearer ${env().CRON_SECRET}` } })
  const body = (await authorized.json().catch(() => null)) as { data?: unknown } | null
  check('cron accepts the configured secret', authorized.ok, `status=${authorized.status} body=${JSON.stringify(body)?.slice(0, 160)}`)

  console.log(`\n${failures === 0 ? 'All integration checks passed.' : `${failures} integration check(s) failed.`}`)
  await prisma.$disconnect()
  process.exit(failures === 0 ? 0 : 1)
}

main().catch(async (error) => {
  console.error(error)
  await prisma.$disconnect()
  process.exit(1)
})
