import { prisma } from '@/lib/db'
import { notFound, ok, route } from '@/lib/api'
import { assertClientScope, requireUser } from '@/lib/auth'

type Context = { params: { id: string } }

export const GET = route<Context>(async (_request, { params }) => {
  const user = await requireUser()
  const audit = await prisma.audit.findUnique({
    where: { id: params.id },
    include: {
      website: {
        select: {
          id: true,
          url: true,
          label: true,
          businessType: true,
          city: true,
          state: true,
          clientId: true,
        },
      },
      client: { select: { id: true, name: true, company: true, contactEmail: true } },
      report: { select: { id: true, filename: true, sizeBytes: true, generatedAt: true } },
      events: { orderBy: { createdAt: 'desc' }, take: 40 },
      notifications: { orderBy: { createdAt: 'desc' } },
    },
  })
  if (!audit) throw notFound('Audit not found')
  assertClientScope(user, audit.clientId)

  return ok({
    audit: {
      id: audit.id,
      status: audit.status,
      stage: audit.stage,
      progress: audit.progress,
      trigger: audit.trigger,
      attempt: audit.attempt,
      error: audit.error,
      queuedAt: audit.queuedAt,
      startedAt: audit.startedAt,
      completedAt: audit.completedAt,
      durationMs: audit.durationMs,
      overallScore: audit.overallScore,
      scoreBreakdown: audit.scoreBreakdown,
      aiSource: audit.aiSource,
      aiModel: audit.aiModel,
      aiLatencyMs: audit.aiLatencyMs,
      signalSources: audit.signalSources,
      aiResult: audit.aiResult,
      signals: audit.signals,
      website: audit.website,
      client: audit.client,
      report: audit.report,
      events: audit.events,
      notifications: audit.notifications,
    },
  })
})
