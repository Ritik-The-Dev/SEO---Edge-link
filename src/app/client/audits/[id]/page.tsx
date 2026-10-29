import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ArrowLeft, Download } from 'lucide-react'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { analysisSchema } from '@/server/ai/schema'
import { PageHeader } from '@/components/dashboard/app-shell'
import { AuditProgress } from '@/components/dashboard/audit-progress'
import {
  AnalysisSummary,
  CheckRegister,
  IssuesGrid,
  MeasuredSignals,
  ProvenanceStrip,
  RecommendationsList,
} from '@/components/audit/analysis-view'
import { Badge, StatusPill } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Panel, PanelBody, PanelHeader } from '@/components/ui/card'
import { formatDateTime, hostFromUrl, relativeTime } from '@/lib/utils'
import type { AuditSignals } from '@/types/audit'

export const metadata = { title: 'Audit' }

export default async function ClientAuditDetailPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'CLIENT') redirect('/login')

  const audit = await prisma.audit.findUnique({
    where: { id: params.id },
    include: {
      website: true,
      report: true,
      events: { orderBy: { createdAt: 'desc' }, take: 30 },
    },
  })
  if (!audit) notFound()
  // Ownership is enforced server-side; a client can never read another client's audit by id.
  if (!user.clientId || audit.clientId !== user.clientId) notFound()

  const signals = audit.signals ? (audit.signals as unknown as AuditSignals) : null
  const parsed = audit.aiResult ? analysisSchema.safeParse(audit.aiResult) : null
  const analysis = parsed?.success ? parsed.data : null
  const running = audit.status === 'QUEUED' || audit.status === 'RUNNING'

  return (
    <>
      <div className="mb-4">
        <Link href="/client/audits" className="inline-flex items-center gap-1.5 text-2xs text-faint transition-colors hover:text-ink">
          <ArrowLeft className="h-3 w-3" /> Back to audits
        </Link>
      </div>

      <PageHeader
        eyebrow="Technical audit"
        title={audit.website.label || hostFromUrl(audit.website.url)}
        description={`${hostFromUrl(audit.website.url)} · ${audit.website.businessType} · ${formatDateTime(audit.createdAt)}`}
        actions={
          audit.report ? (
            <Button asChild size="sm">
              <a href={`/api/reports/${audit.id}/download`}>
                <Download className="h-3.5 w-3.5" /> Download PDF
              </a>
            </Button>
          ) : undefined
        }
      />

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <StatusPill status={audit.status} />
        {audit.overallScore !== null ? (
          <Badge tone="accent" mono>
            score {audit.overallScore}/100
          </Badge>
        ) : null}
        <Badge tone="outline" mono>
          {audit.trigger.toLowerCase()}
        </Badge>
      </div>

      <div className="space-y-6">
        {running ? (
          <AuditProgress
            auditId={audit.id}
            initial={{
              status: audit.status,
              stage: audit.stage,
              progress: audit.progress,
              error: audit.error,
              events: audit.events.map((event) => ({
                id: event.id,
                stage: event.stage,
                message: event.message,
                status: event.status,
                createdAt: event.createdAt.toISOString(),
              })),
            }}
          />
        ) : null}

        {audit.status === 'FAILED' ? (
          <Panel className="border-critical/30">
            <PanelHeader title="This audit could not be completed" description="Your agency has been notified through the workspace." />
            <PanelBody>
              <p className="text-xs leading-relaxed text-muted">
                A technical error interrupted the analysis. No partial or estimated report is published in its place.
                Please contact your account manager to re-run the audit.
              </p>
            </PanelBody>
          </Panel>
        ) : null}

        {analysis ? (
          <>
            <AnalysisSummary
              analysis={analysis}
              aiSource={audit.aiSource}
              aiModel={audit.aiModel}
              aiLatencyMs={audit.aiLatencyMs}
            />
            <IssuesGrid analysis={analysis} />
            <RecommendationsList recommendations={analysis.recommendations} />
          </>
        ) : null}

        {signals ? (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="mono-label">Evidence</span>
              <ProvenanceStrip signals={signals} />
            </div>
            <CheckRegister signals={signals} />
            <MeasuredSignals signals={signals} />
          </>
        ) : null}

        <Panel>
          <PanelHeader title="Audit log" description="Stage transitions recorded for this run." />
          <PanelBody>
            <ol className="space-y-2">
              {audit.events.map((event) => (
                <li key={event.id} className="flex items-baseline justify-between gap-3 border-b border-line/70 pb-1.5 text-2xs last:border-0">
                  <span className="flex min-w-0 items-baseline gap-2">
                    <span className="font-mono uppercase tracking-[0.1em] text-faint">{event.stage}</span>
                    <span className="truncate text-muted">{event.message}</span>
                  </span>
                  <span className="shrink-0 font-mono text-faint">{relativeTime(event.createdAt)}</span>
                </li>
              ))}
            </ol>
          </PanelBody>
        </Panel>
      </div>
    </>
  )
}
