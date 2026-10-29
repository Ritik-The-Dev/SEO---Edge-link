import { redirect } from 'next/navigation'
import { CheckCircle2, CircleSlash, Database, ServerCog, Terminal } from 'lucide-react'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { env } from '@/lib/env'
import { queueHealth } from '@/queue'
import { resolveChromePath } from '@/report/render'
import { PageHeader } from '@/components/dashboard/app-shell'
import { Badge } from '@/components/ui/badge'
import { Panel, PanelBody, PanelHeader } from '@/components/ui/card'
import { SignOutButton } from '@/components/dashboard/sign-out-button'

export const metadata = { title: 'Settings' }

function StatusLine({ ok, label, detail }: { ok: boolean; label: string; detail: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-line py-3 last:border-0">
      <div className="flex items-start gap-2.5">
        {ok ? (
          <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
        ) : (
          <CircleSlash className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warn" />
        )}
        <div>
          <p className="text-xs text-ink">{label}</p>
          <p className="mt-0.5 font-mono text-[0.62rem] leading-relaxed text-faint">{detail}</p>
        </div>
      </div>
      <Badge tone={ok ? 'accent' : 'warn'} mono>
        {ok ? 'ready' : 'check'}
      </Badge>
    </div>
  )
}

export default async function SettingsPage() {
  const user = await getCurrentUser()
  if (!user || user.role !== 'ADMIN') redirect('/login')

  const config = env()
  const queue = await queueHealth()
  const chromePath = resolveChromePath()

  let databaseOk = true
  let counts: Record<string, number> = {}
  try {
    await prisma.$queryRaw`SELECT 1`
    const groups = await prisma.audit.groupBy({ by: ['status'], _count: { _all: true } })
    counts = Object.fromEntries(groups.map((group) => [group.status, group._count._all]))
  } catch {
    databaseOk = false
  }

  return (
    <>
      <PageHeader
        eyebrow="Configuration"
        title="Settings"
        description="Account, integrations and runtime diagnostics. Values come from the server environment — secrets are never rendered."
        actions={<SignOutButton />}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel>
          <PanelHeader title="Account" description="The signed-in administrator." />
          <PanelBody>
            <dl className="space-y-3 text-xs">
              <div className="flex items-baseline justify-between gap-3 border-b border-line pb-2">
                <dt className="text-faint">Name</dt>
                <dd className="text-ink">{user.name}</dd>
              </div>
              <div className="flex items-baseline justify-between gap-3 border-b border-line pb-2">
                <dt className="text-faint">Email</dt>
                <dd className="font-mono text-ink">{user.email}</dd>
              </div>
              <div className="flex items-baseline justify-between gap-3 border-b border-line pb-2">
                <dt className="text-faint">Role</dt>
                <dd>
                  <Badge tone="accent" mono>
                    {user.role.toLowerCase()}
                  </Badge>
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-faint">Session</dt>
                <dd className="text-muted">HttpOnly JWT · 8 h · server-verified</dd>
              </div>
            </dl>
          </PanelBody>
        </Panel>

        <Panel>
          <PanelHeader
            title="Runtime"
            description="Infrastructure the pipeline depends on."
            actions={
              <Badge tone={databaseOk && queue.reachable ? 'accent' : 'critical'} mono>
                {databaseOk && queue.reachable ? 'healthy' : 'degraded'}
              </Badge>
            }
          />
          <PanelBody className="-my-1">
            <StatusLine ok={databaseOk} label="PostgreSQL (Prisma)" detail={databaseOk ? 'connected · queries scoped by client ownership' : 'unreachable — check DATABASE_URL'} />
            <StatusLine
              ok={queue.reachable}
              label={`BullMQ queue · ${queue.name}`}
              detail={
                queue.reachable
                  ? `waiting ${queue.counts.waiting ?? 0} · active ${queue.counts.active ?? 0} · failed ${queue.counts.failed ?? 0}`
                  : queue.error ?? 'Redis unreachable'
              }
            />
            <StatusLine
              ok={Boolean(chromePath)}
              label="Puppeteer report renderer"
              detail={chromePath ?? 'no Chrome/Chromium found — set PUPPETEER_EXECUTABLE_PATH'}
            />
            <StatusLine
              ok={config.REPORT_STORAGE === 'local' ? true : false}
              label="Report storage"
              detail={`${config.REPORT_STORAGE} · ${config.REPORT_DIR}`}
            />
          </PanelBody>
        </Panel>

        <Panel>
          <PanelHeader title="Integrations" description="Mock and live modes are explicit and stored with each audit." />
          <PanelBody>
            <dl className="space-y-3 text-xs">
              {[
                ['PageSpeed Insights', config.USE_MOCKS ? 'mock fixture' : config.PAGESPEED_API_KEY ? 'live (PSI v5)' : 'live mode — key missing'],
                ['Search Console', config.USE_MOCKS ? 'mock fixture' : 'live — not configured (fails explicitly)'],
                ['DataForSEO', config.USE_MOCKS ? 'mock fixture' : 'live — not configured (fails explicitly)'],
                ['WhatsApp (Twilio)', config.USE_MOCKS ? 'mock (mock_sent)' : 'live Twilio API'],
                ['Email', config.USE_MOCKS ? 'mock (recorded as MOCKED)' : config.EMAIL_TRANSPORT],
                ['AI analysis', config.AI_USE_MOCKS ? 'deterministic fixture' : `Claude · ${config.ANTHROPIC_MODEL}`],
              ].map(([label, value]) => (
                <div key={label} className="flex items-baseline justify-between gap-3 border-b border-line pb-2 last:border-0 last:pb-0">
                  <dt className="text-faint">{label}</dt>
                  <dd className="text-right font-mono text-[0.65rem] text-muted">{value}</dd>
                </div>
              ))}
            </dl>
          </PanelBody>
        </Panel>

        <Panel>
          <PanelHeader title="Deployment" description="Web app and worker are separate processes." />
          <PanelBody>
            <dl className="space-y-3 text-xs">
              {[
                ['App URL', config.APP_URL],
                ['Environment', config.NODE_ENV],
                ['Worker concurrency', String(config.WORKER_CONCURRENCY)],
                ['Cron secret', config.CRON_SECRET ? 'configured' : 'missing'],
                ['AI model', config.ANTHROPIC_MODEL],
                ['Use mocks', String(config.USE_MOCKS)],
              ].map(([label, value]) => (
                <div key={label} className="flex items-baseline justify-between gap-3 border-b border-line pb-2 last:border-0 last:pb-0">
                  <dt className="text-faint">{label}</dt>
                  <dd className="max-w-[60%] break-all text-right font-mono text-[0.65rem] text-muted">{value}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-4 flex gap-2.5 border-t border-line pt-3">
              <Terminal className="mt-0.5 h-3.5 w-3.5 shrink-0 text-faint" />
              <p className="text-2xs leading-relaxed text-faint">
                Start the worker with <span className="font-mono text-muted">npm run worker</span>. On Vercel, the web
                app runs serverless while the worker must live on a persistent host sharing the same database and
                Redis.
              </p>
            </div>
          </PanelBody>
        </Panel>

        <Panel>
          <PanelHeader title="Pipeline state" description="Audits by status." />
          <PanelBody>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {[
                ['Queued', counts.QUEUED ?? 0],
                ['Running', counts.RUNNING ?? 0],
                ['Completed', counts.COMPLETED ?? 0],
                ['Failed', counts.FAILED ?? 0],
                ['Cancelled', counts.CANCELLED ?? 0],
              ].map(([label, value]) => (
                <div key={label} className="rounded-sm border border-line p-3">
                  <div className="mono-label">{label}</div>
                  <div className="mt-1.5 font-display text-2xl">{value}</div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex gap-2.5 border-t border-line pt-3">
              <Database className="mt-0.5 h-3.5 w-3.5 shrink-0 text-faint" />
              <p className="text-2xs leading-relaxed text-faint">
                Stale queued/running audits are reconciled by the cron endpoint and at worker startup, so failures
                always become retryable.
              </p>
            </div>
          </PanelBody>
        </Panel>

        <Panel>
          <PanelHeader title="Known limitations" description="Stated plainly rather than hidden." />
          <PanelBody>
            <ul className="space-y-2.5 text-2xs leading-relaxed text-muted">
              {[
                'Single-page technical crawl by design; this is not a full-site search-engine crawl.',
                'External integrations are mocked unless USE_MOCKS=false with credentials configured.',
                'The overall score is an AI-assisted assessment, not a ranking metric or traffic forecast.',
                'Local report storage is not durable on serverless hosts — use a persistent worker volume or an object-store adapter.',
                'Rate limiting is per process; a Redis-backed limiter is required for strict multi-instance limits.',
              ].map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-faint" />
                  {item}
                </li>
              ))}
            </ul>
          </PanelBody>
        </Panel>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2 text-2xs text-faint">
        <ServerCog className="h-3.5 w-3.5" />
        Health endpoint: <span className="font-mono text-muted">/api/health</span> · diagnostics API:{' '}
        <span className="font-mono text-muted">/api/settings</span>
      </div>
    </>
  )
}
