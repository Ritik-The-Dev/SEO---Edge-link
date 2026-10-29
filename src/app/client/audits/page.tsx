import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { PageHeader } from '@/components/dashboard/app-shell'
import { AuditTable } from '@/components/dashboard/audit-table'
import { Panel } from '@/components/ui/card'

export const metadata = { title: 'Your audits' }

export default async function ClientAuditsPage() {
  const user = await getCurrentUser()
  if (!user || user.role !== 'CLIENT') redirect('/login')

  const audits = user.clientId
    ? await prisma.audit.findMany({
        where: { clientId: user.clientId },
        orderBy: { createdAt: 'desc' },
        take: 60,
        include: {
          website: { select: { url: true, label: true } },
          client: { select: { name: true, company: true } },
        },
      })
    : []

  return (
    <>
      <PageHeader
        eyebrow="Audit history"
        title="Audits"
        description="Every technical audit your agency has run, with its score and downloadable report."
      />
      <Panel>
        <div className="px-5 py-1">
          <AuditTable
            audits={audits}
            basePath="/client/audits"
            showClient={false}
            emptyTitle="No audits yet"
            emptyDescription="When your agency runs an audit for your website, its progress and findings appear here."
          />
        </div>
      </Panel>
    </>
  )
}
