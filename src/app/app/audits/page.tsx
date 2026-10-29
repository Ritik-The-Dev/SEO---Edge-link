import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ScanLine } from 'lucide-react'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { PageHeader } from '@/components/dashboard/app-shell'
import { AuditTable } from '@/components/dashboard/audit-table'
import { Button } from '@/components/ui/button'
import { Panel } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { AuditStatus } from '@prisma/client'

export const metadata = { title: 'Audits' }

const FILTERS: Array<{ key: string; label: string }> = [
  { key: '', label: 'All' },
  { key: 'RUNNING', label: 'Running' },
  { key: 'QUEUED', label: 'Queued' },
  { key: 'COMPLETED', label: 'Completed' },
  { key: 'FAILED', label: 'Failed' },
]

export default async function AuditsPage({ searchParams }: { searchParams: { status?: string } }) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'ADMIN') redirect('/login')

  const statusParam = searchParams.status
  const validStatuses: AuditStatus[] = ['QUEUED', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED']
  const status = validStatuses.includes(statusParam as AuditStatus) ? (statusParam as AuditStatus) : undefined

  const [audits, groups] = await Promise.all([
    prisma.audit.findMany({
      where: status ? { status } : {},
      orderBy: { createdAt: 'desc' },
      take: 60,
      include: {
        website: { select: { url: true, label: true } },
        client: { select: { name: true, company: true } },
      },
    }),
    prisma.audit.groupBy({ by: ['status'], _count: { _all: true } }),
  ])

  const counts = Object.fromEntries(groups.map((group) => [group.status, group._count._all]))
  const total = groups.reduce((sum, group) => sum + group._count._all, 0)

  return (
    <>
      <PageHeader
        eyebrow="History"
        title="Audits"
        description="Every audit run, its persisted stage and its report. Failed jobs can be retried without duplicating reports."
        actions={
          <Button asChild size="sm">
            <Link href="/app/audits/new">
              <ScanLine className="h-3.5 w-3.5" /> Run audit
            </Link>
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-1">
        {FILTERS.map((filter) => {
          const active = (filter.key || undefined) === status
          const count = filter.key ? counts[filter.key] ?? 0 : total
          return (
            <Link
              key={filter.label}
              href={filter.key ? `/app/audits?status=${filter.key}` : '/app/audits'}
              className={cn(
                'rounded-sm border px-3 py-1.5 text-2xs transition-colors',
                active
                  ? 'border-accent/40 bg-accent-soft text-accent'
                  : 'border-line bg-surface text-muted hover:border-muted hover:text-ink',
              )}
            >
              {filter.label}
              <span className="ml-2 font-mono text-faint">{count}</span>
            </Link>
          )
        })}
      </div>

      <Panel>
        <div className="px-5 py-1">
          <AuditTable
            audits={audits}
            emptyTitle={status ? `No ${status.toLowerCase()} audits` : 'No audits yet'}
            emptyDescription={
              status
                ? 'Try another status filter, or run a new audit.'
                : 'Queue the first audit to see live stage progress, findings and the generated report.'
            }
            emptyAction={
              <Button asChild size="sm">
                <Link href="/app/audits/new">Run an audit</Link>
              </Button>
            }
          />
        </div>
      </Panel>
    </>
  )
}
