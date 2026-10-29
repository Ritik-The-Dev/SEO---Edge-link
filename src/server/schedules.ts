import { prisma } from '@/lib/db'
import { badRequest, notFound } from '@/lib/api'
import { logger } from '@/lib/logger'
import { createAuditForWebsite } from '@/server/audits'

export interface ScheduleInput {
  websiteId: string
  dayOfMonth: number
  hourUtc: number
  isEnabled: boolean
  createdById?: string | null
}

/**
 * Next UTC occurrence of a monthly schedule.
 * Days are clamped to 1–28 so the cadence is stable in February; the API
 * validates the same range.
 */
export function nextMonthlyRun(dayOfMonth: number, hourUtc: number, from: Date = new Date()): Date {
  const day = Math.min(Math.max(1, Math.trunc(dayOfMonth)), 28)
  const hour = Math.min(Math.max(0, Math.trunc(hourUtc)), 23)

  const candidate = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), day, hour, 0, 0, 0))
  if (candidate.getTime() > from.getTime()) return candidate
  return new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth() + 1, day, hour, 0, 0, 0))
}

export async function upsertSchedule(input: ScheduleInput) {
  const website = await prisma.website.findUnique({ where: { id: input.websiteId }, include: { client: true } })
  if (!website) throw notFound('Website not found')
  if (website.status === 'ARCHIVED') throw badRequest('Archived websites cannot be scheduled')

  const nextRunAt = nextMonthlyRun(input.dayOfMonth, input.hourUtc)

  return prisma.auditSchedule.upsert({
    where: { websiteId: input.websiteId },
    create: {
      websiteId: input.websiteId,
      dayOfMonth: input.dayOfMonth,
      hourUtc: input.hourUtc,
      isEnabled: input.isEnabled,
      nextRunAt,
      createdById: input.createdById ?? null,
    },
    update: {
      dayOfMonth: input.dayOfMonth,
      hourUtc: input.hourUtc,
      isEnabled: input.isEnabled,
      nextRunAt,
    },
    include: { website: { include: { client: true } } },
  })
}

export async function deleteSchedule(scheduleId: string) {
  return prisma.auditSchedule.delete({ where: { id: scheduleId } })
}

export async function listSchedules() {
  return prisma.auditSchedule.findMany({
    orderBy: [{ isEnabled: 'desc' }, { nextRunAt: 'asc' }],
    include: {
      website: { include: { client: true } },
      lastAudit: { select: { id: true, status: true, overallScore: true, completedAt: true } },
    },
  })
}

export interface DueScheduleResult {
  scanned: number
  enqueued: number
  skipped: number
  errors: Array<{ scheduleId: string; error: string }>
}

/**
 * Claims due schedules and enqueues audits.
 *
 * Concurrency safety: each schedule is claimed with a conditional updateMany on
 * its exact nextRunAt, so overlapping cron invocations cannot create duplicate
 * monthly audits. Errors are isolated per schedule and surfaced in the result.
 */
export async function processDueSchedules(now: Date = new Date()): Promise<DueScheduleResult> {
  const due = await prisma.auditSchedule.findMany({
    where: { isEnabled: true, nextRunAt: { lte: now } },
    orderBy: { nextRunAt: 'asc' },
    take: 25,
  })

  const result: DueScheduleResult = { scanned: due.length, enqueued: 0, skipped: 0, errors: [] }

  for (const schedule of due) {
    const claimed = await prisma.auditSchedule.updateMany({
      where: { id: schedule.id, isEnabled: true, nextRunAt: schedule.nextRunAt },
      data: {
        lastRunAt: now,
        nextRunAt: nextMonthlyRun(schedule.dayOfMonth, schedule.hourUtc, now),
      },
    })
    if (claimed.count === 0) {
      result.skipped += 1
      continue
    }

    try {
      const { audit, deduplicated } = await createAuditForWebsite({
        websiteId: schedule.websiteId,
        trigger: 'SCHEDULED',
      })
      await prisma.auditSchedule.update({
        where: { id: schedule.id },
        data: { lastAuditId: audit.id },
      })
      if (deduplicated) result.skipped += 1
      else result.enqueued += 1
      logger.info('Scheduled audit processed', {
        scheduleId: schedule.id,
        auditId: audit.id,
        deduplicated,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not enqueue scheduled audit'
      result.errors.push({ scheduleId: schedule.id, error: message })
      logger.error('Scheduled audit failed to enqueue', { scheduleId: schedule.id, error: message })
    }
  }

  return result
}
