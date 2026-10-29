import { ok, parseBody, route } from '@/lib/api'
import { requireAdmin } from '@/lib/auth'
import { listSchedules, upsertSchedule } from '@/server/schedules'
import { scheduleSchema } from '@/validation/schemas'

export const GET = route(async () => {
  await requireAdmin()
  const schedules = await listSchedules()
  return ok({ schedules })
})

export const POST = route(async (request) => {
  const admin = await requireAdmin()
  const body = await parseBody(request, scheduleSchema)
  const schedule = await upsertSchedule({
    websiteId: body.websiteId,
    dayOfMonth: body.dayOfMonth,
    hourUtc: body.hourUtc,
    isEnabled: body.isEnabled,
    createdById: admin.id,
  })
  return ok({ schedule }, 201)
})
