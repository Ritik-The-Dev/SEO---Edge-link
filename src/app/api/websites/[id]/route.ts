import { prisma } from '@/lib/db'
import { forbidden, notFound, ok, parseBody, route } from '@/lib/api'
import { assertClientScope, requireUser } from '@/lib/auth'
import { updateWebsite } from '@/server/websites'
import { websiteUpdateSchema } from '@/validation/schemas'

type Context = { params: { id: string } }

export const GET = route<Context>(async (_request, { params }) => {
  const user = await requireUser()
  const website = await prisma.website.findUnique({
    where: { id: params.id },
    include: {
      client: true,
      audits: {
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: {
          id: true,
          status: true,
          overallScore: true,
          createdAt: true,
          completedAt: true,
          stage: true,
          progress: true,
        },
      },
      schedule: true,
    },
  })
  if (!website) throw notFound('Website not found')
  assertClientScope(user, website.clientId)
  return ok({ website })
})

export const PATCH = route<Context>(async (request, { params }) => {
  const user = await requireUser()
  if (user.role !== 'ADMIN') throw forbidden('Administrator access is required')
  const body = await parseBody(request, websiteUpdateSchema)
  const website = await updateWebsite(params.id, body)
  return ok({ website })
})
