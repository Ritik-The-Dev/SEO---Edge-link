import { prisma } from '@/lib/db'
import { forbidden, ok, parseBody, route } from '@/lib/api'
import { requireUser } from '@/lib/auth'
import { createWebsite } from '@/server/websites'
import { websiteCreateSchema } from '@/validation/schemas'

export const GET = route(async () => {
  const user = await requireUser()
  const websites = await prisma.website.findMany({
    where: user.role === 'ADMIN' ? {} : { clientId: user.clientId ?? '__none__' },
    orderBy: { createdAt: 'desc' },
    include: {
      client: { select: { id: true, name: true, company: true } },
      audits: {
        select: { id: true, status: true, overallScore: true, createdAt: true, completedAt: true },
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
      schedule: { select: { id: true, isEnabled: true, nextRunAt: true } },
    },
  })
  return ok({ websites })
})

export const POST = route(async (request) => {
  const user = await requireUser()
  if (user.role !== 'ADMIN') throw forbidden('Administrator access is required')
  const body = await parseBody(request, websiteCreateSchema)
  const website = await createWebsite(body)
  return ok({ website }, 201)
})
