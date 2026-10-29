import { prisma } from '@/lib/db'
import { HttpError, forbidden, ok, parseBody, route } from '@/lib/api'
import { requireUser } from '@/lib/auth'
import { checkRateLimit, clientKey } from '@/lib/rate-limit'
import { createAuditForWebsite } from '@/server/audits'
import { auditCreateSchema } from '@/validation/schemas'
import type { AuditStatus } from '@prisma/client'

// Vercel (Node.js runtime) execution budget for enqueue + dedupe queries.
export const maxDuration = 60
export const dynamic = 'force-dynamic'

export const GET = route(async (request) => {
  const user = await requireUser()
  const url = new URL(request.url)
  const websiteId = url.searchParams.get('websiteId') ?? undefined
  const statusParam = url.searchParams.get('status')
  const status = statusParam && ['QUEUED', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED'].includes(statusParam)
    ? (statusParam as AuditStatus)
    : undefined
  const take = Math.min(Number(url.searchParams.get('take') ?? 50) || 50, 100)

  const audits = await prisma.audit.findMany({
    where: {
      ...(user.role === 'ADMIN' ? {} : { clientId: user.clientId ?? '__none__' }),
      ...(websiteId ? { websiteId } : {}),
      ...(status ? { status } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take,
    include: {
      website: { select: { id: true, url: true, label: true, businessType: true } },
      client: { select: { id: true, name: true, company: true } },
      report: { select: { id: true, filename: true, sizeBytes: true, generatedAt: true } },
    },
  })
  return ok({ audits })
})

export const POST = route(async (request) => {
  const user = await requireUser()
  if (user.role !== 'ADMIN') throw forbidden('Administrator access is required')

  const limit = checkRateLimit(clientKey(request, 'audit-create'), 12, 60 * 1000)
  if (!limit.allowed) {
    throw new HttpError(429, `Too many audits requested. Try again in ${limit.retryAfterSeconds}s.`, 'RATE_LIMITED')
  }

  const body = await parseBody(request, auditCreateSchema)
  const { audit, deduplicated } = await createAuditForWebsite({
    websiteId: body.websiteId,
    requestedById: user.id,
    trigger: 'MANUAL',
  })

  return ok(
    {
      audit: {
        id: audit.id,
        status: audit.status,
        stage: audit.stage,
        progress: audit.progress,
        websiteId: audit.websiteId,
        createdAt: audit.createdAt,
      },
      deduplicated,
      progressUrl: `/api/audits/${audit.id}`,
    },
    deduplicated ? 200 : 201,
  )
})
