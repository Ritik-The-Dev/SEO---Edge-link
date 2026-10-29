import Link from 'next/link'
import { redirect } from 'next/navigation'
import { CalendarClock, Download, Globe } from 'lucide-react'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { PageHeader } from '@/components/dashboard/app-shell'
import { AuditTable } from '@/components/dashboard/audit-table'
import { Badge, ScorePill, StatusPill } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Panel, PanelBody, PanelHeader, Stat } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty'
import { ScoreRing } from '@/components/ui/score'
import { formatDate, hostFromUrl, relativeTime } from '@/lib/utils'

export const metadata = { title: 'Client overview' }

export default async function ClientOverviewPage() {
  const user = await getCurrentUser()
  if (!user || user.role !== 'CLIENT') redirect('/login')

  if (!user.clientId) {
    return (
      <>
        <PageHeader eyebrow="Client portal" title={`Hello, ${user.name.split(' ')[0]}`} />
        <Panel>
          <EmptyState
            icon={<Globe className="h-4 w-4" />}
            title="No website is linked to your account yet"
            description="Your agency needs to associate a website with this account before audits and reports appear here."
          />
        </Panel>
      </>
    )
  }

  const client = await prisma.client.findUnique({
    where: { id: user.clientId },
    include: {
      websites: {
        include: {
          audits: {
            orderBy: { createdAt: 'desc' },
            take: 3,
            select: { id: true, status: true, overallScore: true, createdAt: true, completedAt: true },
          },
          schedule: true,
        },
      },
      audits: {
        orderBy: { createdAt: 'desc' },
        take: 8,
        include: {
          website: { select: { url: true, label: true } },
          client: { select: { name: true, company: true } },
        },
      },
    },
  })
  if (!client) redirect('/login')

  const completed = client.audits.filter((audit) => audit.status === 'COMPLETED' && audit.overallScore !== null)
  const latestScore = completed[0]?.overallScore ?? null
  const schedules = client.websites.map((site) => site.schedule).filter(Boolean)
  const nextSchedule = schedules
    .filter((schedule) => schedule?.isEnabled)
    .sort((a, b) => (a!.nextRunAt.getTime() > b!.nextRunAt.getTime() ? 1 : -1))[0]

  return (
    <>
      <PageHeader
        eyebrow="Client portal"
        title={client.company || client.name}
        description="Your website health, audit history and downloadable reports. Read-only access scoped to your account."
        actions={
          <Badge tone="accent" mono>
            {client.websites.length} website{client.websites.length === 1 ? '' : 's'}
          </Badge>
        }
      />

      <div className="grid grid-cols-2 divide-line overflow-hidden rounded-md border border-line bg-surface md:grid-cols-4 md:divide-x">
        <Stat label="Websites" value={client.websites.length} hint="monitored by your agency" />
        <Stat label="Audits" value={client.audits.length} hint="most recent 8 shown below" />
        <Stat
          label="Latest score"
          value={latestScore ?? '—'}
          hint={completed[0] ? relativeTime(completed[0].completedAt ?? completed[0].createdAt) : 'no completed audit yet'}
          tone={latestScore && latestScore >= 70 ? 'accent' : undefined}
        />
        <Stat
          label="Next scheduled"
          value={nextSchedule ? formatDate(nextSchedule.nextRunAt) : '—'}
          hint={nextSchedule ? 'monthly technical audit' : 'no schedule configured'}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Panel>
            <PanelHeader title="Your websites" description="Latest audit state for each site." />
            {client.websites.length === 0 ? (
              <EmptyState
                icon={<Globe className="h-4 w-4" />}
                title="No websites yet"
                description="Your agency has not registered a website for this account."
              />
            ) : (
              <ul className="divide-y divide-line">
                {client.websites.map((website) => {
                  const latest = website.audits[0]
                  return (
                    <li key={website.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm text-ink">{website.label || hostFromUrl(website.url)}</span>
                          {latest ? <StatusPill status={latest.status} /> : null}
                        </div>
                        <p className="mt-0.5 font-mono text-[0.62rem] text-faint">
                          {hostFromUrl(website.url)} · {website.businessType}
                        </p>
                        {website.schedule ? (
                          <p className="mt-1.5 flex items-center gap-1.5 text-2xs text-faint">
                            <CalendarClock className="h-3 w-3" />
                            {website.schedule.isEnabled
                              ? `next audit ${formatDate(website.schedule.nextRunAt)}`
                              : 'scheduled audits paused'}
                          </p>
                        ) : null}
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        {latest ? <ScorePill score={latest.overallScore} /> : <span className="text-2xs text-faint">no audits</span>}
                        {latest?.status === 'COMPLETED' ? (
                          <Button asChild size="sm" variant="secondary">
                            <Link href={`/client/audits/${latest.id}`}>View audit</Link>
                          </Button>
                        ) : null}
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </Panel>

          <Panel>
            <PanelHeader
              title="Recent audits"
              description="Your audit history, newest first."
              actions={
                <Button asChild variant="ghost" size="sm">
                  <Link href="/client/audits">View all</Link>
                </Button>
              }
            />
            <div className="px-5 py-1">
              <AuditTable
                audits={client.audits}
                basePath="/client/audits"
                showClient={false}
                emptyTitle="No audits yet"
                emptyDescription="Your agency will run the first technical audit shortly. It will appear here with progress and a report."
              />
            </div>
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel>
            <PanelHeader title="Latest score" description="AI-assisted technical assessment." />
            <PanelBody className="flex flex-col items-center gap-3 py-6">
              <ScoreRing score={latestScore} size={148} stroke={8} />
              {completed[0] ? (
                <>
                  <p className="text-xs text-muted">
                    {completed[0].website?.url ?? ''}
                  </p>
                  <Button asChild size="sm" variant="secondary">
                    <Link href={`/client/audits/${completed[0].id}`}>Open audit</Link>
                  </Button>
                </>
              ) : (
                <p className="text-xs text-faint">No completed audit yet.</p>
              )}
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHeader title="Reports" description="Download the PDF reports from completed audits." />
            <PanelBody className="space-y-2">
              {completed.length === 0 ? (
                <p className="text-xs text-faint">Reports appear after the first completed audit.</p>
              ) : (
                completed.slice(0, 4).map((audit) => (
                  <a
                    key={audit.id}
                    href={`/api/reports/${audit.id}/download`}
                    className="flex items-center justify-between gap-3 rounded-sm border border-line px-3 py-2.5 text-xs transition-colors hover:border-muted hover:bg-raised"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-ink">{hostFromUrl(audit.website.url)}</span>
                      <span className="mt-0.5 block font-mono text-[0.58rem] text-faint">
                        {formatDate(audit.completedAt ?? audit.createdAt)}
                      </span>
                    </span>
                    <Download className="h-3.5 w-3.5 shrink-0 text-faint" />
                  </a>
                ))
              )}
              <Button asChild size="sm" variant="ghost" className="w-full">
                <Link href="/client/reports">All reports</Link>
              </Button>
            </PanelBody>
          </Panel>
        </div>
      </div>
    </>
  )
}
