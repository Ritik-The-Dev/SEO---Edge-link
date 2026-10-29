import Link from 'next/link'
import { FileText } from 'lucide-react'
import { StatusPill, ScorePill, Badge } from '@/components/ui/badge'
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table'
import { EmptyState } from '@/components/ui/empty'
import { formatDateTime, hostFromUrl, relativeTime } from '@/lib/utils'
import { ScanLine } from 'lucide-react'

export interface AuditRowData {
  id: string
  status: string
  stage: string
  progress: number
  overallScore: number | null
  createdAt: string | Date
  completedAt: string | Date | null
  trigger?: string
  website: { url: string; label: string | null }
  client?: { name: string; company: string | null }
}

interface AuditTableProps {
  audits: AuditRowData[]
  basePath?: string
  showClient?: boolean
  emptyTitle?: string
  emptyDescription?: string
  emptyAction?: React.ReactNode
}

export function AuditTable({
  audits,
  basePath = '/app/audits',
  showClient = true,
  emptyTitle = 'No audits yet',
  emptyDescription = 'Queue an audit for a client website to see progress, findings and reports here.',
  emptyAction,
}: AuditTableProps) {
  if (audits.length === 0) {
    return (
      <EmptyState
        icon={<ScanLine className="h-4 w-4" />}
        title={emptyTitle}
        description={emptyDescription}
        action={emptyAction}
      />
    )
  }

  return (
    <Table>
      <THead>
        <TH>Website</TH>
        {showClient ? <TH>Client</TH> : null}
        <TH>Status</TH>
        <TH>Score</TH>
        <TH>Report</TH>
        <TH className="text-right">When</TH>
      </THead>
      <TBody>
        {audits.map((audit) => (
          <TR key={audit.id}>
            <TD>
              <Link href={`${basePath}/${audit.id}`} className="group block min-w-0">
                <span className="block truncate text-[0.82rem] text-ink group-hover:text-accent">
                  {audit.website.label || hostFromUrl(audit.website.url)}
                </span>
                <span className="mt-0.5 flex items-center gap-2 font-mono text-[0.6rem] text-faint">
                  {audit.trigger && audit.trigger !== 'MANUAL' ? (
                    <Badge tone="outline" mono className="px-1 py-0">
                      {audit.trigger.toLowerCase()}
                    </Badge>
                  ) : null}
                  {hostFromUrl(audit.website.url)}
                </span>
              </Link>
            </TD>
            {showClient ? (
              <TD className="text-muted">{audit.client?.company || audit.client?.name || '—'}</TD>
            ) : null}
            <TD>
              <div className="flex flex-col gap-1">
                <StatusPill status={audit.status} />
                {audit.status === 'RUNNING' ? (
                  <span className="font-mono text-[0.55rem] uppercase tracking-[0.1em] text-faint">
                    {audit.stage.replaceAll('-', ' ')} · {audit.progress}%
                  </span>
                ) : null}
              </div>
            </TD>
            <TD>
              <ScorePill score={audit.overallScore} size="sm" />
            </TD>
            <TD>
              {audit.status === 'COMPLETED' ? (
                <a
                  href={`/api/reports/${audit.id}/download`}
                  className="inline-flex items-center gap-1.5 text-2xs text-muted transition-colors hover:text-accent"
                >
                  <FileText className="h-3.5 w-3.5" /> PDF
                </a>
              ) : (
                <span className="text-2xs text-faint">—</span>
              )}
            </TD>
            <TD className="text-right">
              <span className="whitespace-nowrap font-mono text-[0.6rem] text-faint" title={formatDateTime(audit.createdAt)}>
                {relativeTime(audit.createdAt)}
              </span>
            </TD>
          </TR>
        ))}
      </TBody>
    </Table>
  )
}
