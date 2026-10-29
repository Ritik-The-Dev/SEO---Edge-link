import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { CalendarClock, Globe, KeyRound, Plus } from 'lucide-react'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { PageHeader } from '@/components/dashboard/app-shell'
import { AuditTable } from '@/components/dashboard/audit-table'
import { AddWebsiteForm } from '@/components/dashboard/forms'
import { ClientEditor, WebsiteEditor } from '@/components/dashboard/editors'
import { RunAuditButton } from '@/components/dashboard/audit-actions'
import { Badge, ScorePill, StatusPill } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Panel, PanelBody, PanelHeader } from '@/components/ui/card'
import { formatDate, hostFromUrl, relativeTime } from '@/lib/utils'

export const metadata = { title: 'Client' }

export default async function ClientDetailPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'ADMIN') redirect('/login')

  const client = await prisma.client.findUnique({
    where: { id: params.id },
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
        orderBy: { createdAt: 'asc' },
      },
      users: { orderBy: { createdAt: 'asc' } },
      audits: {
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: {
          website: { select: { url: true, label: true } },
          client: { select: { name: true, company: true } },
        },
      },
    },
  })
  if (!client) notFound()

  return (
    <>
      <PageHeader
        eyebrow={`Client · ${client.isActive ? 'active' : 'inactive'}`}
        title={client.company || client.name}
        description={
          <>
            {client.contactEmail ?? 'No contact email on file'} · {client.phone ?? 'no phone'} · created{' '}
            {formatDate(client.createdAt)}
          </>
        }
        actions={
          <>
            <ClientEditor
              client={{
                id: client.id,
                name: client.name,
                company: client.company,
                contactEmail: client.contactEmail,
                phone: client.phone,
                notes: client.notes,
                isActive: client.isActive,
              }}
            />
            {client.websites[0] ? <RunAuditButton websiteId={client.websites[0].id} label="Run audit" variant="primary" /> : null}
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Panel>
            <PanelHeader
              title="Websites"
              description="Each website carries the business context used by the audit prompt."
              actions={<Badge tone="outline" mono>{client.websites.length}</Badge>}
            />
            {client.websites.length === 0 ? (
              <PanelBody>
                <p className="text-xs text-muted">No websites yet. Add the first one below to begin auditing.</p>
              </PanelBody>
            ) : (
              <ul className="divide-y divide-line">
                {client.websites.map((website) => {
                  const latest = website.audits[0]
                  return (
                    <li key={website.id} className="px-5 py-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm text-ink">{website.label || hostFromUrl(website.url)}</span>
                            <Badge tone={website.status === 'ACTIVE' ? 'accent' : 'outline'} mono>
                              {website.status.toLowerCase()}
                            </Badge>
                          </div>
                          <a
                            href={website.url}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="mt-0.5 block truncate font-mono text-[0.65rem] text-faint hover:text-accent"
                          >
                            {website.url}
                          </a>
                          <p className="mt-1.5 text-2xs text-muted">
                            {website.businessType} · {website.city}, {website.state}
                          </p>
                          <div className="mt-2.5 flex flex-wrap items-center gap-2">
                            {latest ? (
                              <>
                                <StatusPill status={latest.status} />
                                <ScorePill score={latest.overallScore} size="sm" />
                                <span className="font-mono text-[0.6rem] text-faint">
                                  {relativeTime(latest.createdAt)}
                                </span>
                                <Link href={`/app/audits/${latest.id}`} className="text-2xs text-muted underline-offset-2 hover:text-accent hover:underline">
                                  open audit
                                </Link>
                              </>
                            ) : (
                              <span className="text-2xs text-faint">no audits yet</span>
                            )}
                          </div>
                          {website.schedule ? (
                            <p className="mt-2 flex items-center gap-1.5 text-2xs text-faint">
                              <CalendarClock className="h-3 w-3" />
                              monthly on day {website.schedule.dayOfMonth} ·{' '}
                              {website.schedule.isEnabled ? `next ${formatDate(website.schedule.nextRunAt)}` : 'paused'}
                            </p>
                          ) : null}
                        </div>

                        <div className="flex shrink-0 items-center gap-1">
                          <WebsiteEditor
                            website={{
                              id: website.id,
                              url: website.url,
                              label: website.label,
                              businessType: website.businessType,
                              city: website.city,
                              state: website.state,
                              status: website.status,
                            }}
                          />
                          <RunAuditButton websiteId={website.id} />
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </Panel>

          <Panel>
            <PanelHeader title="Audit history" description="The 20 most recent audits for this client." />
            <div className="px-5 py-1">
              <AuditTable audits={client.audits} showClient={false} emptyDescription="Run an audit from a website above." />
            </div>
          </Panel>

          <Panel>
            <PanelHeader
              title="Add a website"
              description="URLs are normalised and validated server-side. Local and private hosts are rejected."
            />
            <PanelBody>
              <AddWebsiteForm clientId={client.id} />
            </PanelBody>
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel>
            <PanelHeader title="Portal access" description="Client users scoped to this account." />
            <PanelBody className="space-y-3">
              {client.users.length === 0 ? (
                <div className="flex gap-2.5 text-xs text-muted">
                  <KeyRound className="mt-0.5 h-3.5 w-3.5 shrink-0 text-faint" />
                  No portal users yet. Create one when adding a new client, or ask an administrator to provision access.
                </div>
              ) : (
                client.users.map((member) => (
                  <div key={member.id} className="flex items-center justify-between gap-3 border-b border-line pb-2 last:border-0 last:pb-0">
                    <div className="min-w-0">
                      <p className="truncate text-xs text-ink">{member.name}</p>
                      <p className="truncate font-mono text-[0.6rem] text-faint">{member.email}</p>
                    </div>
                    <span className="shrink-0 font-mono text-[0.58rem] text-faint">
                      {member.lastLoginAt ? relativeTime(member.lastLoginAt) : 'never signed in'}
                    </span>
                  </div>
                ))
              )}
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHeader title="Client summary" />
            <PanelBody>
              <dl className="space-y-3 text-xs">
                <div className="flex items-baseline justify-between gap-3 border-b border-line pb-2">
                  <dt className="text-faint">Websites</dt>
                  <dd className="font-mono">{client.websites.length}</dd>
                </div>
                <div className="flex items-baseline justify-between gap-3 border-b border-line pb-2">
                  <dt className="text-faint">Audits</dt>
                  <dd className="font-mono">{client.audits.length}</dd>
                </div>
                <div className="flex items-baseline justify-between gap-3 border-b border-line pb-2">
                  <dt className="text-faint">Latest score</dt>
                  <dd>
                    <ScorePill score={client.audits.find((audit) => audit.overallScore !== null)?.overallScore ?? null} size="sm" />
                  </dd>
                </div>
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="text-faint">Schedules</dt>
                  <dd className="font-mono">{client.websites.filter((site) => site.schedule).length}</dd>
                </div>
              </dl>
              <div className="mt-4 flex flex-col gap-2">
                <Button asChild variant="secondary" size="sm">
                  <Link href="/app/schedules">
                    <CalendarClock className="h-3.5 w-3.5" /> Manage schedules
                  </Link>
                </Button>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/app/websites">
                    <Globe className="h-3.5 w-3.5" /> All websites
                  </Link>
                </Button>
              </div>
            </PanelBody>
          </Panel>

          {client.notes ? (
            <Panel>
              <PanelHeader title="Internal notes" />
              <PanelBody>
                <p className="whitespace-pre-line text-xs leading-relaxed text-muted">{client.notes}</p>
              </PanelBody>
            </Panel>
          ) : null}
        </div>
      </div>
    </>
  )
}
