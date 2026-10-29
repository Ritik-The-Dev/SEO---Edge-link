import { prisma } from '@/lib/db'
import { ok, parseBody, route } from '@/lib/api'
import { hashPassword, requireAdmin } from '@/lib/auth'
import { clientCreateSchema } from '@/validation/schemas'

export const GET = route(async () => {
  await requireAdmin()
  const clients = await prisma.client.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      websites: {
        select: {
          id: true,
          url: true,
          label: true,
          status: true,
          audits: {
            select: { id: true, status: true, overallScore: true, completedAt: true },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      },
      _count: { select: { audits: true, users: true } },
    },
  })
  return ok({ clients })
})

export const POST = route(async (request) => {
  await requireAdmin()
  const body = await parseBody(request, clientCreateSchema)

  const client = await prisma.$transaction(async (tx) => {
    const created = await tx.client.create({
      data: {
        name: body.name,
        company: body.company ?? null,
        contactEmail: body.contactEmail ?? null,
        phone: body.phone ?? null,
        notes: body.notes ?? null,
      },
    })
    if (body.portal) {
      const passwordHash = await hashPassword(body.portal.password)
      await tx.user.create({
        data: {
          email: body.portal.email,
          name: body.portal.name,
          passwordHash,
          role: 'CLIENT',
          clientId: created.id,
        },
      })
    }
    return created
  })

  return ok({ client }, 201)
})
