import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ArrowLeft, Download, FileText, Repeat } from 'lucide-react'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { analysisSchema } from '@/server/ai/schema'
import { PageHeader } from '@/components/dashboard/app-shell'
import { AuditProgress } from '@/components/dashboard/audit-progress'
import { RetryAuditButton, RunAuditButton } from '@/components/dashboard/audit-actions'
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
import { formatBytes, formatDateTime, hostFromUrl, relativeTime } from '@/lib/utils'
import type { AuditSignals } from '@/types/audit'

export const metadata = { title: 'Audit detail' }

export default async function AuditDetailPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'ADMIN') redirect('/login')

  const audit = await prisma.audit.findUnique({
    where: { id: params.id },
    include: {
      website: { include: { client: true } },
      client: true,
      report: true,
      events: { orderBy: { createdAt: 'desc' }, take: 60 },
      notifications: { orderBy: { createdAt: 'desc' } },
    },
  })
  if (!audit) notFound()

  const signals = audit.signals ? (audit.signals as unknown as AuditSignals) : null
  const parsed = audit.aiResult ? analysisSchema.safeParse(audit.aiResult) : null
  const analysis = parsed?.success ? parsed.data : null
  const running = audit.status === 'QUEUED' || audit.status === 'RUNNING'

  const eventsForProgress = audit.events
    .slice(0, 12)
    .map((event) => ({
      id: event.id,
      stage: event.stage,
      message: event.message,
      status: event.status,
      createdAt: event.createdAt.toISOString(),
    }))

  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-3">
        <Link href="/app/audits" className="inline-flex items-center gap-1.5 text-2xs text-faint transition-colors hover:text-ink">
          <ArrowLeft className="h-3 w-3" /> Back to audits
        </Link>
        <span className="font-mono text-[0.58rem] uppercase tracking-[0.14em] text-faint">audit {audit.id.slice(-8)}</span>
      </div>

      <PageHeader
        eyebrow={`${audit.client.company || audit.client.name} · ${audit.trigger.toLowerCase()} audit`}
        title={audit.website.label || hostFromUrl(audit.website.url)}
        description={
          <>
            {audit.website.url} · {audit.website.businessType} · {audit.website.city}, {audit.website.state}
          </>
        }
        actions={
          <>
            {audit.report ? (
              <>
                <Button asChild variant="secondary" size="sm">
                  <Link href={`/app/reports/${audit.id}`}>
                    <FileText className="h-3.5 w-3.5" /> Preview report
                  </Link>
                </Button>
                <Button asChild size="sm">
                  <a href={`/api/reports/${audit.id}/download`}>
                    <Download className="h-3.5 w-3.5" /> Download PDF
                  </a>
                </Button>
              </>
            ) : null}
            {audit.status === 'FAILED' ? <RetryAuditButton auditId={audit.id} /> : null}
            <RunAuditButton websiteId={audit.websiteId} label="Run again" size="sm" variant={audit.report ? 'secondary' : 'primary'} />
          </>
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
          attempt {audit.attempt}
        </Badge>
        <Badge tone="outline" mono>
          queued {relativeTime(audit.queuedAt)}
        </Badge>
        {audit.durationMs ? (
          <Badge tone="outline" mono>
            {(audit.durationMs / 1000).toFixed(1)}s
          </Badge>
        ) : null}
        {audit.aiSource ? (
          <Badge tone={audit.aiSource === 'CLAUDE' ? 'accent' : 'warn'} mono>
            {audit.aiSource === 'CLAUDE' ? `claude ${audit.aiModel ?? ''}` : 'ai fixture'}
          </Badge>
        ) : null}
        {audit.report ? (
          <Badge tone="outline" mono>
            pdf {formatBytes(audit.report.sizeBytes)}
          </Badge>
        ) : null}
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
              events: eventsForProgress,
            }}
          />
        ) : null}

        {audit.status === 'FAILED' ? (
          <Panel className="border-critical/30">
            <PanelHeader
              title="This audit failed"
              description="The failure is stored with the audit. Retrying reuses the same record and does not create duplicate reports."
              actions={<RetryAuditButton auditId={audit.id} />}
            />
            <PanelBody>
              <p className="rounded-sm border border-critical/30 bg-critical/10 px-3 py-2 font-mono text-xs leading-relaxed text-critical">
                {audit.error ?? 'No error detail was recorded.'}
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

        {!analysis && audit.status === 'COMPLETED' ? (
          <Panel className="border-warn/40">
            <PanelHeader title="Stored analysis failed validation" />
            <PanelBody>
              <p className="text-xs leading-relaxed text-muted">
                The persisted AI result does not satisfy the current schema (audit_version v1.0). It has not been
                rendered. Re-run the audit to regenerate analysis.
              </p>
            </PanelBody>
          </Panel>
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

        <div className="grid gap-6 lg:grid-cols-2">
          <Panel>
            <PanelHeader title="Delivery attempts" description="WhatsApp and email, recorded per attempt." />
            {audit.notifications.length === 0 ? (
              <PanelBody>
                <p className="text-xs text-faint">No delivery attempts recorded yet.</p>
              </PanelBody>
            ) : (
              <ul className="divide-y divide-line">
                {audit.notifications.map((notification) => (
                  <li key={notification.id} className="px-5 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Badge tone="outline" mono>
                          {notification.channel.toLowerCase()}
                        </Badge>
                        <Badge
                          tone={
                            notification.status === 'SENT'
                              ? 'accent'
                              : notification.status === 'MOCKED'
                                ? 'warn'
                                : 'critical'
                          }
                          mono
                        >
                          {notification.status.toLowerCase()}
                        </Badge>
                      </div>
                      <span className="font-mono text-[0.58rem] text-faint">
                        {relativeTime(notification.createdAt)}
                      </span>
                    </div>
                    <p className="mt-1.5 truncate font-mono text-[0.62rem] text-muted">
                      to {notification.recipient ?? 'unset'} · id {notification.providerId ?? '—'}
                    </p>
                    {notification.error ? (
                      <p className="mt-1 text-2xs leading-relaxed text-critical">{notification.error}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel>
            <PanelHeader title="Audit events" description="Persisted stage transitions for this run." />
            <PanelBody>
              <ol className="space-y-2">
                {audit.events.map((event) => (
                  <li key={event.id} className="flex items-baseline justify-between gap-3 border-b border-line/70 pb-1.5 text-2xs last:border-0">
                    <span className="flex min-w-0 items-baseline gap-2">
                      <span className="font-mono uppercase tracking-[0.1em] text-faint">{event.stage}</span>
                      <span className="truncate text-muted">{event.message}</span>
                    </span>
                    <span className="shrink-0 font-mono text-faint">{formatDateTime(event.createdAt)}</span>
                  </li>
                ))}
              </ol>
            </PanelBody>
          </Panel>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4 text-2xs text-faint">
          <span className="flex items-center gap-1.5 font-mono">
            <Repeat className="h-3 w-3" /> report {audit.report ? audit.report.filename : 'not generated'}
          </span>
          <span className="font-mono">audit id {audit.id}</span>
        </div>
      </div>
    </>
  )
}
