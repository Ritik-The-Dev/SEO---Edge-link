import { prisma } from '@/lib/db'
import { forbidden, notFound, ok, parseBody, route } from '@/lib/api'
import { assertClientScope, requireAdmin, requireUser } from '@/lib/auth'
import { clientUpdateSchema } from '@/validation/schemas'

type Context = { params: { id: string } }

export const GET = route<Context>(async (_request, { params }) => {
  const user = await requireUser()
  assertClientScope(user, params.id)

  const client = await prisma.client.findUnique({
    where: { id: params.id },
    include: {
      websites: {
        include: {
          audits: {
            select: { id: true, status: true, overallScore: true, createdAt: true, completedAt: true },
            orderBy: { createdAt: 'desc' },
            take: 5,
          },
          schedule: { select: { id: true, isEnabled: true, nextRunAt: true, dayOfMonth: true } },
        },
      },
      users: { select: { id: true, email: true, name: true, lastLoginAt: true } },
      _count: { select: { audits: true } },
    },
  })
  if (!client) throw notFound('Client not found')
  if (user.role !== 'ADMIN') {
    // Client users do not need the staff-facing user list.
    return ok({ client: { ...client, users: [] } })
  }
  return ok({ client })
})

export const PATCH = route<Context>(async (request, { params }) => {
  const user = await requireUser()
  if (user.role !== 'ADMIN') throw forbidden('Administrator access is required')
  const body = await parseBody(request, clientUpdateSchema)

  const existing = await prisma.client.findUnique({ where: { id: params.id } })
  if (!existing) throw notFound('Client not found')

  const client = await prisma.client.update({
    where: { id: params.id },
    data: {
      ...(body.name !== undefined ? { name: body.name } : {}),
      ...(body.company !== undefined ? { company: body.company ?? null } : {}),
      ...(body.contactEmail !== undefined ? { contactEmail: body.contactEmail ?? null } : {}),
      ...(body.phone !== undefined ? { phone: body.phone ?? null } : {}),
      ...(body.notes !== undefined ? { notes: body.notes ?? null } : {}),
      ...(body.isActive !== undefined ? { isActive: body.isActive } : {}),
    },
  })
  return ok({ client })
})
