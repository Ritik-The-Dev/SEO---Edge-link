import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Globe } from 'lucide-react'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { PageHeader } from '@/components/dashboard/app-shell'
import { RunAuditButton } from '@/components/dashboard/audit-actions'
import { Badge, ScorePill, StatusPill } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Panel } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty'
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table'
import { formatDate, hostFromUrl } from '@/lib/utils'

export const metadata = { title: 'Websites' }

export default async function WebsitesPage() {
  const user = await getCurrentUser()
  if (!user || user.role !== 'ADMIN') redirect('/login')

  const websites = await prisma.website.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      client: { select: { id: true, name: true, company: true } },
      audits: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: { id: true, status: true, overallScore: true, createdAt: true },
      },
      schedule: { select: { isEnabled: true, nextRunAt: true, dayOfMonth: true } },
      _count: { select: { audits: true } },
    },
  })

  return (
    <>
      <PageHeader
        eyebrow="Inventory"
        title="Websites"
        description="Every monitored website with its latest audit state and recurring schedule."
        actions={
          <Button asChild size="sm" variant="secondary">
            <Link href="/app/clients">Manage via clients</Link>
          </Button>
        }
      />

      <Panel>
        {websites.length === 0 ? (
          <EmptyState
            icon={<Globe className="h-4 w-4" />}
            title="No websites registered"
            description="Websites belong to clients. Create a client and add their first website to start auditing."
            action={
              <Button asChild size="sm">
                <Link href="/app/clients/new">Create a client</Link>
              </Button>
            }
          />
        ) : (
          <div className="px-5 py-1">
            <Table>
              <THead>
                <TH>Website</TH>
                <TH>Client</TH>
                <TH>Business</TH>
                <TH>Latest audit</TH>
                <TH>Score</TH>
                <TH>Schedule</TH>
                <TH className="text-right">Action</TH>
              </THead>
              <TBody>
                {websites.map((website) => {
                  const latest = website.audits[0]
                  return (
                    <TR key={website.id}>
                      <TD>
                        <Link href={`/app/clients/${website.clientId}`} className="group block">
                          <span className="block text-[0.82rem] text-ink group-hover:text-accent">
                            {website.label || hostFromUrl(website.url)}
                          </span>
                          <span className="mt-0.5 block font-mono text-[0.6rem] text-faint">{hostFromUrl(website.url)}</span>
                        </Link>
                      </TD>
                      <TD className="text-muted">{website.client.company || website.client.name}</TD>
                      <TD className="text-2xs text-muted">
                        {website.businessType}
                        <span className="block text-faint">
                          {website.city}, {website.state}
                        </span>
                      </TD>
                      <TD>
                        {latest ? (
                          <Link href={`/app/audits/${latest.id}`} className="flex flex-col gap-1">
                            <StatusPill status={latest.status} />
                            <span className="font-mono text-[0.58rem] text-faint">{formatDate(latest.createdAt)}</span>
                          </Link>
                        ) : (
                          <span className="text-2xs text-faint">never audited</span>
                        )}
                      </TD>
                      <TD>
                        <ScorePill score={latest?.overallScore ?? null} size="sm" />
                      </TD>
                      <TD>
                        {website.schedule ? (
                          <Badge tone={website.schedule.isEnabled ? 'accent' : 'outline'} mono>
                            {website.schedule.isEnabled ? `day ${website.schedule.dayOfMonth}` : 'paused'}
                          </Badge>
                        ) : (
                          <span className="text-2xs text-faint">none</span>
                        )}
                      </TD>
                      <TD className="text-right">
                        <RunAuditButton websiteId={website.id} />
                      </TD>
                    </TR>
                  )
                })}
              </TBody>
            </Table>
          </div>
        )}
      </Panel>
    </>
  )
}
