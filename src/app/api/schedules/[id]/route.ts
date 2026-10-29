import { prisma } from '@/lib/db'
import { notFound, ok, parseBody, route } from '@/lib/api'
import { requireAdmin } from '@/lib/auth'
import { nextMonthlyRun } from '@/server/schedules'
import { scheduleUpdateSchema } from '@/validation/schemas'

type Context = { params: { id: string } }

export const PATCH = route<Context>(async (request, { params }) => {
  await requireAdmin()
  const body = await parseBody(request, scheduleUpdateSchema)
  const existing = await prisma.auditSchedule.findUnique({ where: { id: params.id } })
  if (!existing) throw notFound('Schedule not found')

  const dayOfMonth = body.dayOfMonth ?? existing.dayOfMonth
  const hourUtc = body.hourUtc ?? existing.hourUtc
  const timingChanged = dayOfMonth !== existing.dayOfMonth || hourUtc !== existing.hourUtc
  const isEnabled = body.isEnabled ?? existing.isEnabled

  const schedule = await prisma.auditSchedule.update({
    where: { id: params.id },
    data: {
      dayOfMonth,
      hourUtc,
      isEnabled,
      ...(timingChanged || (!existing.isEnabled && isEnabled)
        ? { nextRunAt: nextMonthlyRun(dayOfMonth, hourUtc) }
        : {}),
    },
    include: { website: { include: { client: true } } },
  })
  return ok({ schedule })
})

export const DELETE = route<Context>(async (_request, { params }) => {
  await requireAdmin()
  const existing = await prisma.auditSchedule.findUnique({ where: { id: params.id } })
  if (!existing) throw notFound('Schedule not found')
  await prisma.auditSchedule.delete({ where: { id: params.id } })
  return ok({ deleted: true })
})
