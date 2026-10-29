import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowRight, CalendarClock, Database, Plus, ScanLine, ServerCog } from 'lucide-react'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { queueHealth } from '@/queue'
import { env } from '@/lib/env'
import { PageHeader } from '@/components/dashboard/app-shell'
import { AuditTable } from '@/components/dashboard/audit-table'
import { RankedBars, Sparkline } from '@/components/dashboard/charts'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Panel, PanelBody, PanelHeader, Stat } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty'
import { formatDateTime, formatNumber, hostFromUrl, relativeTime } from '@/lib/utils'
import type { AuditSignals } from '@/types/audit'

export const metadata = { title: 'Overview' }

function topFailingChecks(signalsList: Array<unknown>) {
  const counts = new Map<string, number>()
  for (const raw of signalsList) {
    const signals = raw as AuditSignals | null
    if (!signals?.checks) continue
    for (const check of signals.checks) {
      if (check.status === 'fail' || check.status === 'warn') {
        counts.set(check.label, (counts.get(check.label) ?? 0) + 1)
      }
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([label, value]) => ({ label, value, tone: 'warn' as const }))
}

export default async function AdminOverviewPage() {
  const user = await getCurrentUser()
  if (!user || user.role !== 'ADMIN') redirect('/login')

  const [clientCount, websiteCount, statusGroups, recentAudits, completedScores, schedules, queue] =
    await Promise.all([
      prisma.client.count({ where: { isActive: true } }),
      prisma.website.count({ where: { status: { not: 'ARCHIVED' } } }),
      prisma.audit.groupBy({ by: ['status'], _count: { _all: true } }),
      prisma.audit.findMany({
        orderBy: { createdAt: 'desc' },
        take: 8,
        include: {
          website: { select: { url: true, label: true } },
          client: { select: { name: true, company: true } },
        },
      }),
      prisma.audit.findMany({
        where: { status: 'COMPLETED' },
        orderBy: { completedAt: 'desc' },
        take: 8,
        select: { id: true, overallScore: true, completedAt: true, createdAt: true, websiteId: true, signals: true },
      }),
      prisma.auditSchedule.findMany({
        where: { isEnabled: true },
        orderBy: { nextRunAt: 'asc' },
        take: 3,
        include: { website: { include: { client: { select: { name: true, company: true } } } } },
      }),
      queueHealth(),
    ])

  const counts = Object.fromEntries(statusGroups.map((group) => [group.status, group._count._all]))
  const completedCount = counts.COMPLETED ?? 0
  const activeCount = (counts.QUEUED ?? 0) + (counts.RUNNING ?? 0)
  const failedCount = counts.FAILED ?? 0
  const scores = completedScores
    .map((audit) => audit.overallScore)
    .filter((score): score is number => typeof score === 'number')
    .reverse()
  const averageScore = scores.length ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : null
  const watchlist = topFailingChecks(completedScores.map((audit) => audit.signals))
  const config = env()

  return (
    <>
      <PageHeader
        eyebrow="Workspace"
        title="Overview"
        description="Signal coverage across every client website — live job state, recent audits and the checks that keep failing."
        actions={
          <>
            <Button asChild variant="secondary" size="sm">
              <Link href="/app/clients/new">
                <Plus className="h-3.5 w-3.5" /> Add client
              </Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/app/audits/new">
                <ScanLine className="h-3.5 w-3.5" /> Run audit
              </Link>
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 divide-line overflow-hidden rounded-md border border-line bg-surface md:grid-cols-4 md:divide-x">
        <Stat label="Active clients" value={formatNumber(clientCount)} hint={`${websiteCount} websites monitored`} />
        <Stat
          label="Audits"
          value={formatNumber(completedCount + activeCount + failedCount)}
          hint={`${activeCount} in flight`}
          tone={activeCount ? 'accent' : undefined}
        />
        <Stat
          label="Average score"
          value={averageScore ?? '—'}
          hint={scores.length ? `across the last ${scores.length} completed audits` : 'no completed audits yet'}
          tone={averageScore && averageScore >= 70 ? 'accent' : undefined}
        />
        <Stat
          label="Failed audits"
          value={formatNumber(failedCount)}
          hint={failedCount ? 'retry available on each audit' : 'nothing to retry'}
          tone={failedCount ? 'critical' : undefined}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Panel>
            <PanelHeader
              title="Recent audits"
              description="Queued, running and completed jobs, newest first."
              actions={
                <Button asChild variant="ghost" size="sm">
                  <Link href="/app/audits">
                    View all <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              }
            />
            <div className="px-5 py-1">
              <AuditTable
                audits={recentAudits.map((audit) => ({
                  ...audit,
                  website: audit.website,
                  client: audit.client,
                }))}
                emptyAction={
                  <Button asChild size="sm">
                    <Link href="/app/audits/new">Run the first audit</Link>
                  </Button>
                }
              />
            </div>
          </Panel>

          <Panel>
            <PanelHeader
              title="Signal watchlist"
              description="Most frequent failing or warning checks across the eight most recent completed audits."
              actions={<Badge tone="outline" mono>{watchlist.length} checks</Badge>}
            />
            <PanelBody>
              <RankedBars
                items={watchlist}
                emptyLabel="No failed checks recorded yet — completed audits will populate this watchlist."
              />
            </PanelBody>
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel>
            <PanelHeader
              title="Pipeline health"
              description="BullMQ queue and worker configuration."
              actions={
                <Badge tone={queue.reachable ? 'accent' : 'critical'} mono>
                  {queue.reachable ? 'redis up' : 'redis down'}
                </Badge>
              }
            />
            <PanelBody className="space-y-4">
              <div className="flex items-start gap-3">
                <ServerCog className="mt-0.5 h-4 w-4 text-faint" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[0.7rem] text-ink">{queue.name}</span>
                    <span className="font-mono text-[0.6rem] uppercase tracking-[0.12em] text-faint">
                      concurrency {config.WORKER_CONCURRENCY}
                    </span>
                  </div>
                  <dl className="mt-2 grid grid-cols-2 gap-2 text-2xs">
                    {['waiting', 'active', 'completed', 'failed'].map((key) => (
                      <div key={key} className="flex items-baseline justify-between rounded-[3px] border border-line px-2 py-1.5">
                        <dt className="text-faint">{key}</dt>
                        <dd className="font-mono tabular-nums text-ink">{queue.counts[key] ?? 0}</dd>
                      </div>
                    ))}
                  </dl>
                  {queue.error ? <p className="mt-2 text-2xs text-critical">{queue.error}</p> : null}
                </div>
              </div>

              <div className="flex items-start gap-3 border-t border-line pt-3">
                <Database className="mt-0.5 h-4 w-4 text-faint" />
                <div className="text-2xs leading-relaxed text-muted">
                  PostgreSQL via Prisma · {config.USE_MOCKS ? 'mock integrations' : 'live integrations'} ·{' '}
                  {config.AI_USE_MOCKS ? 'AI fixture' : `Claude ${config.ANTHROPIC_MODEL}`}
                </div>
              </div>
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHeader
              title="Upcoming schedules"
              description="Monthly audits claimed by the cron endpoint."
              actions={
                <Button asChild variant="ghost" size="sm">
                  <Link href="/app/schedules">Manage</Link>
                </Button>
              }
            />
            {schedules.length === 0 ? (
              <EmptyState
                icon={<CalendarClock className="h-4 w-4" />}
                title="No schedules yet"
                description="Add a monthly schedule so each website gets audited without manual work."
                action={
                  <Button asChild size="sm" variant="secondary">
                    <Link href="/app/schedules">Create a schedule</Link>
                  </Button>
                }
              />
            ) : (
              <ul className="divide-y divide-line">
                {schedules.map((schedule) => (
                  <li key={schedule.id} className="px-5 py-3.5">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="truncate text-xs text-ink">
                        {schedule.website.label || hostFromUrl(schedule.website.url)}
                      </span>
                      <span className="shrink-0 font-mono text-[0.6rem] text-faint">
                        {relativeTime(schedule.nextRunAt)}
                      </span>
                    </div>
                    <div className="mt-1 text-2xs text-faint">
                      {schedule.website.client.company || schedule.website.client.name} ·{' '}
                      {formatDateTime(schedule.nextRunAt)}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel>
            <PanelHeader title="Score trend" description="Completed audits, oldest to newest." />
            <PanelBody>
              <Sparkline values={scores} />
              <div className="mt-3 flex items-center justify-between font-mono text-[0.6rem] text-faint">
                <span>{scores.length ? `${scores[0]}` : '—'}</span>
                <span>latest {scores.length ? scores[scores.length - 1] : '—'}</span>
              </div>
            </PanelBody>
          </Panel>
        </div>
      </div>
    </>
  )
}
