import { ok, route } from '@/lib/api'
import { requireAdmin } from '@/lib/auth'
import { retryAudit } from '@/server/audits'

type Context = { params: { id: string } }

export const POST = route<Context>(async (_request, { params }) => {
  await requireAdmin()
  const audit = await retryAudit(params.id)
  return ok({
    audit: {
      id: audit.id,
      status: audit.status,
      stage: audit.stage,
      progress: audit.progress,
      attempt: audit.attempt,
    },
  })
})
