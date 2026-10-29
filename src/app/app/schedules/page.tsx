import { redirect } from 'next/navigation'
import { CalendarClock, Terminal } from 'lucide-react'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { env } from '@/lib/env'
import { PageHeader } from '@/components/dashboard/app-shell'
import { ScheduleManager, type ScheduleRow, type WebsiteOption } from '@/components/dashboard/schedule-manager'
import { Badge } from '@/components/ui/badge'
import { Panel, PanelBody, PanelHeader } from '@/components/ui/card'

export const metadata = { title: 'Schedules' }

export default async function SchedulesPage() {
  const user = await getCurrentUser()
  if (!user || user.role !== 'ADMIN') redirect('/login')

  const [schedules, websites] = await Promise.all([
    prisma.auditSchedule.findMany({
      orderBy: [{ isEnabled: 'desc' }, { nextRunAt: 'asc' }],
      include: {
        website: { include: { client: { select: { name: true, company: true } } } },
        lastAudit: { select: { id: true, status: true, overallScore: true } },
      },
    }),
    prisma.website.findMany({
      where: { status: { not: 'ARCHIVED' } },
      orderBy: { createdAt: 'asc' },
      include: { client: { select: { name: true, company: true } } },
    }),
  ])

  const config = env()
  const rows: ScheduleRow[] = schedules.map((schedule) => ({
    id: schedule.id,
    websiteId: schedule.websiteId,
    dayOfMonth: schedule.dayOfMonth,
    hourUtc: schedule.hourUtc,
    isEnabled: schedule.isEnabled,
    nextRunAt: schedule.nextRunAt.toISOString(),
    lastRunAt: schedule.lastRunAt ? schedule.lastRunAt.toISOString() : null,
    website: {
      id: schedule.website.id,
      url: schedule.website.url,
      label: schedule.website.label,
      clientName: schedule.website.client.company || schedule.website.client.name,
    },
    lastAudit: schedule.lastAudit
      ? {
          id: schedule.lastAudit.id,
          status: schedule.lastAudit.status,
          overallScore: schedule.lastAudit.overallScore,
        }
      : null,
  }))

  const options: WebsiteOption[] = websites.map((website) => ({
    id: website.id,
    url: website.url,
    label: website.label,
    clientName: website.client.company || website.client.name,
  }))

  return (
    <>
      <PageHeader
        eyebrow="Automation"
        title="Schedules"
        description="Recurring monthly audits, claimed atomically by a secret-protected cron endpoint. Overlapping triggers cannot double-run a month."
        actions={<Badge tone="outline" mono>{rows.filter((row) => row.isEnabled).length} active</Badge>}
      />

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div>
          <ScheduleManager schedules={rows} websites={options} />
        </div>

        <div className="space-y-6">
          <Panel>
            <PanelHeader
              title="cron-job.org trigger"
              description="Call the endpoint hourly; due schedules are claimed and enqueued."
              actions={<Badge tone={config.CRON_SECRET ? 'accent' : 'critical'} mono>{config.CRON_SECRET ? 'secret set' : 'no secret'}</Badge>}
            />
            <PanelBody className="space-y-4">
              <div>
                <div className="mono-label">Endpoint</div>
                <code className="mt-1.5 block break-all rounded-sm border border-line bg-canvas px-3 py-2 font-mono text-[0.65rem] text-ink">
                  POST {config.APP_URL}/api/cron/schedules
                </code>
              </div>
              <div>
                <div className="mono-label">Header</div>
                <code className="mt-1.5 block break-all rounded-sm border border-line bg-canvas px-3 py-2 font-mono text-[0.65rem] text-ink">
                  Authorization: Bearer &lt;CRON_SECRET&gt;
                </code>
              </div>
              <div className="flex gap-2.5 text-2xs leading-relaxed text-muted">
                <Terminal className="mt-0.5 h-3.5 w-3.5 shrink-0 text-faint" />
                <p>
                  The endpoint also reconciles audits stranded in queued or running states. It never runs the audit
                  itself — it only enqueues BullMQ jobs, so the request returns quickly.
                </p>
              </div>
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHeader title="Setup checklist" />
            <PanelBody>
              <ol className="space-y-2.5 text-2xs leading-relaxed text-muted">
                {[
                  'Deploy the web app and the persistent worker with the same DATABASE_URL and REDIS_URL.',
                  'Create the cron job in cron-job.org with the endpoint above and an Authorization header.',
                  'Schedule it hourly; the endpoint is idempotent, so a missed or repeated trigger is safe.',
                  'Verify a run in the audit history — scheduled audits carry the SCHEDULED trigger badge.',
                ].map((step, index) => (
                  <li key={step} className="flex gap-2.5">
                    <span className="font-mono text-[0.58rem] text-accent">{String(index + 1).padStart(2, '0')}</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </PanelBody>
          </Panel>

          <Panel>
            <PanelBody>
              <div className="flex gap-2.5">
                <CalendarClock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-faint" />
                <p className="text-2xs leading-relaxed text-faint">
                  Days are limited to 1–28 so every month has the same cadence. Runs are enqueued at the configured
                  hour in UTC; adjust for your client&apos;s local time.
                </p>
              </div>
            </PanelBody>
          </Panel>
        </div>
      </div>
    </>
  )
}
