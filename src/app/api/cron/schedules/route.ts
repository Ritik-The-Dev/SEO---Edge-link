import { timingSafeEqual } from 'node:crypto'
import { env } from '@/lib/env'
import { HttpError, ok, route } from '@/lib/api'
import { logger } from '@/lib/logger'
import { processDueSchedules } from '@/server/schedules'
import { reconcileStuckAudits } from '@/server/reconciliation'

function assertCronAuthorized(request: Request) {
  const secret = env().CRON_SECRET
  const header = request.headers.get('authorization') ?? ''
  const bearer = header.startsWith('Bearer ') ? header.slice(7).trim() : ''
  const querySecret = new URL(request.url).searchParams.get('secret') ?? ''
  const provided = bearer || querySecret

  const a = Buffer.from(provided)
  const b = Buffer.from(secret)
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    throw new HttpError(401, 'Invalid cron credentials', 'UNAUTHORIZED')
  }
}

/**
 * Triggered by cron-job.org (e.g. hourly). Protected by CRON_SECRET and
 * idempotent: overlapping invocations cannot create duplicate monthly audits
 * because each schedule is claimed with a conditional update on nextRunAt.
 */
const handler = route(async (request) => {
  assertCronAuthorized(request)
  const started = Date.now()

  const reconciliation = await reconcileStuckAudits()
  const schedules = await processDueSchedules()

  logger.info('Cron run completed', {
    enqueued: schedules.enqueued,
    skipped: schedules.skipped,
    reconciled: reconciliation.failed,
    durationMs: Date.now() - started,
  })

  return ok({
    reconciliation,
    schedules,
    ranAt: new Date().toISOString(),
    durationMs: Date.now() - started,
  })
})

export const GET = handler
export const POST = handler
export const dynamic = 'force-dynamic'
export const maxDuration = 60
