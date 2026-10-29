import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Plus, Users } from 'lucide-react'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { PageHeader } from '@/components/dashboard/app-shell'
import { Badge, ScorePill } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Panel } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty'
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table'
import { formatDate, hostFromUrl, relativeTime } from '@/lib/utils'

export const metadata = { title: 'Clients' }

export default async function ClientsPage() {
  const user = await getCurrentUser()
  if (!user || user.role !== 'ADMIN') redirect('/login')

  const clients = await prisma.client.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      websites: {
        select: {
          id: true,
          url: true,
          audits: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: { id: true, status: true, overallScore: true, createdAt: true },
          },
        },
      },
      _count: { select: { users: true, audits: true } },
    },
  })

  return (
    <>
      <PageHeader
        eyebrow="Portfolio"
        title="Clients"
        description="Every agency client, their websites and the state of their most recent audit."
        actions={
          <Button asChild size="sm">
            <Link href="/app/clients/new">
              <Plus className="h-3.5 w-3.5" /> New client
            </Link>
          </Button>
        }
      />

      <Panel>
        {clients.length === 0 ? (
          <EmptyState
            icon={<Users className="h-4 w-4" />}
            title="No clients yet"
            description="Create your first client, add their website, then run a technical audit."
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
                <TH>Client</TH>
                <TH>Websites</TH>
                <TH>Last audit</TH>
                <TH>Score</TH>
                <TH>Portal</TH>
                <TH className="text-right">Created</TH>
              </THead>
              <TBody>
                {clients.map((client) => {
                  const latest = client.websites.flatMap((site) => site.audits)[0]
                  return (
                    <TR key={client.id}>
                      <TD>
                        <Link href={`/app/clients/${client.id}`} className="group block">
                          <span className="block text-[0.82rem] text-ink group-hover:text-accent">
                            {client.company || client.name}
                          </span>
                          <span className="mt-0.5 block text-2xs text-faint">
                            {client.contactEmail ?? 'no contact email'}
                          </span>
                        </Link>
                      </TD>
                      <TD>
                        {client.websites.length === 0 ? (
                          <span className="text-2xs text-faint">none</span>
                        ) : (
                          <div className="flex flex-col gap-0.5">
                            {client.websites.slice(0, 2).map((site) => (
                              <span key={site.id} className="font-mono text-[0.65rem] text-muted">
                                {hostFromUrl(site.url)}
                              </span>
                            ))}
                            {client.websites.length > 2 ? (
                              <span className="text-2xs text-faint">+{client.websites.length - 2} more</span>
                            ) : null}
                          </div>
                        )}
                      </TD>
                      <TD>
                        {latest ? (
                          <span className="flex items-center gap-2">
                            <Badge
                              tone={
                                latest.status === 'COMPLETED'
                                  ? 'accent'
                                  : latest.status === 'FAILED'
                                    ? 'critical'
                                    : 'info'
                              }
                              mono
                            >
                              {latest.status.toLowerCase()}
                            </Badge>
                            <span className="font-mono text-[0.6rem] text-faint">{relativeTime(latest.createdAt)}</span>
                          </span>
                        ) : (
                          <span className="text-2xs text-faint">no audits</span>
                        )}
                      </TD>
                      <TD>
                        <ScorePill score={latest?.overallScore ?? null} size="sm" />
                      </TD>
                      <TD>
                        <span className="text-2xs text-muted">
                          {client._count.users ? `${client._count.users} user(s)` : 'no access'}
                        </span>
                      </TD>
                      <TD className="text-right font-mono text-[0.6rem] text-faint">{formatDate(client.createdAt)}</TD>
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
