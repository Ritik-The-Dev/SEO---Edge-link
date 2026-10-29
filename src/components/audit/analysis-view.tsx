import { AlertTriangle, Check, FileWarning, Zap } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Panel, PanelBody, PanelHeader } from '@/components/ui/card'
import { ScoreBreakdown, ScoreRing } from '@/components/ui/score'
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table'
import type { AiAnalysis, AiRecommendation } from '@/server/ai/schema'
import type { AuditSignals } from '@/types/audit'
import { formatNumber } from '@/lib/utils'

const priorityTone = (priority: string) =>
  priority === 'CRITICAL' ? 'critical' : priority === 'HIGH' ? 'warn' : priority === 'MEDIUM' ? 'info' : 'neutral'

function statusTone(status: string) {
  return status === 'pass' ? 'accent' : status === 'fail' ? 'critical' : status === 'warn' ? 'warn' : 'outline'
}

export function AnalysisSummary({
  analysis,
  aiSource,
  aiModel,
  aiLatencyMs,
}: {
  analysis: AiAnalysis
  aiSource: string | null
  aiModel: string | null
  aiLatencyMs: number | null
}) {
  return (
    <Panel>
      <div className="grid gap-6 p-5 sm:grid-cols-[auto_1fr] sm:items-center sm:gap-8 sm:p-6">
        <div className="flex items-center gap-5">
          <ScoreRing score={analysis.overall_score} size={126} stroke={7} label="Overall audit" />
          <div className="sm:hidden">
            <ScoreBreakdown breakdown={analysis.score_breakdown} />
          </div>
        </div>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="mono-label">AI-assisted assessment</span>
            <Badge tone={aiSource === 'CLAUDE' ? 'accent' : 'warn'} mono>
              {aiSource === 'CLAUDE' ? `claude · ${aiModel ?? 'model'}` : 'deterministic AI fixture'}
            </Badge>
            {aiLatencyMs ? <Badge tone="outline" mono>{aiLatencyMs} ms</Badge> : null}
          </div>
          <p className="mt-3 max-w-3xl font-display text-[1.35rem] leading-[1.35] text-ink">
            {analysis.executive_summary}
          </p>
          <p className="mt-3 text-2xs leading-relaxed text-faint">
            This score is an AI-assisted technical assessment weighted across five categories. It is not a Google
            ranking metric, and no ranking or traffic outcome is guaranteed.
          </p>
          <div className="mt-5 hidden sm:block">
            <ScoreBreakdown breakdown={analysis.score_breakdown} />
          </div>
        </div>
      </div>
    </Panel>
  )
}

export function IssuesGrid({ analysis }: { analysis: AiAnalysis }) {
  return (
    <div className="grid gap-px overflow-hidden rounded-md border border-line bg-line md:grid-cols-2">
      <div className="bg-surface p-5">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-3.5 w-3.5 text-critical" />
          <span className="mono-label">Critical issues</span>
        </div>
        {analysis.critical_issues.length ? (
          <ul className="mt-4 space-y-3">
            {analysis.critical_issues.map((issue, index) => (
              <li key={`${issue.title}-${index}`} className="border-t border-line pt-3 first:border-0 first:pt-0">
                <p className="text-xs font-medium text-ink">{issue.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted">{issue.detail}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-xs text-faint">No critical issues identified.</p>
        )}
      </div>

      <div className="bg-surface p-5">
        <div className="flex items-center gap-2">
          <FileWarning className="h-3.5 w-3.5 text-warn" />
          <span className="mono-label">Important issues</span>
        </div>
        {analysis.important_issues.length ? (
          <ul className="mt-4 space-y-3">
            {analysis.important_issues.slice(0, 5).map((issue, index) => (
              <li key={`${issue.title}-${index}`} className="border-t border-line pt-3 first:border-0 first:pt-0">
                <p className="text-xs font-medium text-ink">{issue.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted">{issue.detail}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-xs text-faint">No important issues identified.</p>
        )}
      </div>

      <div className="bg-surface p-5 md:col-span-2">
        <div className="flex items-center gap-2">
          <Zap className="h-3.5 w-3.5 text-accent" />
          <span className="mono-label">Quick wins · two hours or less</span>
        </div>
        {analysis.quick_wins.length ? (
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {analysis.quick_wins.map((win, index) => (
              <li key={`${win.title}-${index}`} className="rounded-sm border border-line bg-canvas p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-2xs font-medium text-ink">{win.title}</span>
                  <Badge tone="accent" mono>
                    {win.effort_hours}h
                  </Badge>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-muted">{win.action}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-xs text-faint">No sub-two-hour fixes were identified.</p>
        )}
      </div>
    </div>
  )
}

export function RecommendationsList({ recommendations }: { recommendations: AiRecommendation[] }) {
  return (
    <Panel>
      <PanelHeader
        title="Prioritised recommendations"
        description="Every item carries a finding, a fix, an impact estimate, effort and a verification step."
        actions={<Badge tone="outline" mono>{recommendations.length} items</Badge>}
      />
      <ul className="divide-y divide-line">
        {recommendations.map((rec, index) => (
          <li key={`${rec.finding.slice(0, 24)}-${index}`} className="px-5 py-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-display text-lg leading-none text-accent">{String(index + 1).padStart(2, '0')}</span>
              <Badge tone={priorityTone(rec.priority)} mono>
                {rec.priority}
              </Badge>
              <Badge tone="outline">{rec.category}</Badge>
              <Badge tone="outline">Impact {rec.estimated_impact}</Badge>
              <Badge tone="outline">
                {rec.effort}
                {rec.effort_hours ? ` · ${rec.effort_hours}h` : ''}
              </Badge>
            </div>
            <div className="mt-3 grid gap-3 lg:grid-cols-2">
              <div>
                <div className="mono-label">Finding</div>
                <p className="mt-1 text-xs leading-relaxed text-ink">{rec.finding}</p>
              </div>
              <div>
                <div className="mono-label">Fix</div>
                <p className="mt-1 text-xs leading-relaxed text-muted">{rec.fix}</p>
              </div>
            </div>
            <div className="mt-3 flex gap-2 border-t border-dashed border-line pt-2.5">
              <Check className="mt-0.5 h-3 w-3 shrink-0 text-accent" />
              <p className="text-2xs leading-relaxed text-accent/90">{rec.falsifiability_check}</p>
            </div>
          </li>
        ))}
      </ul>
    </Panel>
  )
}

export function CheckRegister({ signals }: { signals: AuditSignals }) {
  const checks = signals.checks
  const counts = {
    pass: checks.filter((check) => check.status === 'pass').length,
    warn: checks.filter((check) => check.status === 'warn').length,
    fail: checks.filter((check) => check.status === 'fail').length,
    info: checks.filter((check) => check.status === 'info').length,
  }

  return (
    <Panel>
      <PanelHeader
        title="Check register"
        description={`${checks.length} deterministic checks over the crawled page and integration signals.`}
        actions={
          <div className="flex gap-1.5">
            <Badge tone="accent" mono>{counts.pass} pass</Badge>
            <Badge tone="warn" mono>{counts.warn} warn</Badge>
            <Badge tone="critical" mono>{counts.fail} fail</Badge>
          </div>
        }
      />
      <div className="px-5 py-3">
        <Table>
          <THead>
            <TH>Check</TH>
            <TH>Status</TH>
            <TH>Observation</TH>
          </THead>
          <TBody>
            {checks.map((check) => (
              <TR key={check.id}>
                <TD className="whitespace-nowrap font-medium">
                  {check.label}
                  <span className="ml-2 font-mono text-[0.55rem] uppercase tracking-[0.1em] text-faint">{check.category}</span>
                </TD>
                <TD>
                  <Badge tone={statusTone(check.status)} mono>
                    {check.status}
                  </Badge>
                </TD>
                <TD className="text-muted">{check.detail}</TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </div>
    </Panel>
  )
}

export function MeasuredSignals({ signals }: { signals: AuditSignals }) {
  const { crawl, pageSpeed, gsc, dataForSeo, schemaOrg, robots, sitemap } = signals

  return (
    <div className="space-y-6">
      <Panel>
        <PanelHeader
          title="Crawled page signals"
          description={`Fetched ${new Date(crawl.fetchedAt).toLocaleString('en-GB')} · HTTP ${crawl.status} · ${crawl.durationMs} ms`}
          actions={<Badge tone="outline" mono>{signals.meta.pageLimit} page</Badge>}
        />
        <PanelBody>
          <dl className="grid gap-x-8 gap-y-3 text-xs sm:grid-cols-2">
            {[
              ['Final URL', crawl.finalUrl],
              ['Title', crawl.title ?? 'Missing'],
              ['Title length', `${crawl.titleLength} characters`],
              ['Meta description', crawl.metaDescription ?? 'Missing'],
              ['Meta description length', `${crawl.metaDescriptionLength} characters`],
              ['Canonical', crawl.canonical ?? 'Missing'],
              ['Robots meta', crawl.robotsMeta ?? crawl.xRobotsTag ?? 'None'],
              ['Viewport', crawl.viewport ?? 'Missing'],
              ['H1 count', `${crawl.headings.h1Count} — ${crawl.headings.h1.join(' · ') || 'none'}`],
              ['H2 / H3 count', `${crawl.headings.h2Count} / ${crawl.headings.h3Count}`],
              ['Images', `${crawl.images.total} total · ${crawl.images.missingAlt} missing alt`],
              ['Links', `${crawl.links.internal} internal · ${crawl.links.external} external · ${crawl.links.nofollow} nofollow`],
              ['Structured data', `${crawl.structuredData.blocks} blocks · ${schemaOrg.types.join(', ') || 'none'}`],
              ['Word count', `${crawl.wordCount} words`],
              ['robots.txt', robots.exists ? `${robots.status} · ${robots.sitemapUrls.length} sitemaps declared` : 'Not found'],
              ['Sitemap', sitemap.exists ? `${sitemap.urlCount} URLs${sitemap.isIndex ? ' (index)' : ''}` : 'Not found'],
              ['Detected stack', crawl.cmsHints.join(', ') || 'not identified'],
              ['Analytics', crawl.analytics.join(', ') || 'not detected'],
            ].map(([label, value]) => (
              <div key={label} className="grid grid-cols-[9rem_1fr] gap-3 border-b border-line/70 pb-2">
                <dt className="text-faint">{label}</dt>
                <dd className="break-words text-ink">{value}</dd>
              </div>
            ))}
          </dl>
          {crawl.notes.length ? (
            <ul className="mt-4 space-y-1">
              {crawl.notes.map((note) => (
                <li key={note} className="text-2xs text-faint">
                  · {note}
                </li>
              ))}
            </ul>
          ) : null}
        </PanelBody>
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel>
          <PanelHeader
            title="Core Web Vitals"
            description="Mobile lab data from PageSpeed Insights."
            actions={<Badge tone={pageSpeed.source === 'mock' ? 'warn' : 'accent'} mono>{pageSpeed.source}</Badge>}
          />
          <PanelBody>
            <dl className="grid grid-cols-2 gap-4 text-xs">
              {[
                ['LCP', pageSpeed.metrics.largestContentfulPaint, '≤ 2.5 s'],
                ['CLS', String(pageSpeed.metrics.cumulativeLayoutShift), '≤ 0.1'],
                ['INP', pageSpeed.metrics.interactionToNextPaint, '≤ 200 ms'],
                ['Performance', Math.round(pageSpeed.scores.performance * 100), '90+'],
                ['Accessibility', Math.round(pageSpeed.scores.accessibility * 100), '90+'],
                ['Render-blocking', pageSpeed.diagnostics.renderBlockingResources, '0'],
                ['Unused JS', pageSpeed.diagnostics.unusedJavascript, '< 100 KiB'],
                ['SEO score', Math.round(pageSpeed.scores.seo * 100), '90+'],
              ].map(([label, value, target]) => (
                <div key={label}>
                  <dt className="font-mono text-[0.58rem] uppercase tracking-[0.12em] text-faint">{label}</dt>
                  <dd className="mt-1 text-sm text-ink">{value}</dd>
                  <dd className="mt-0.5 font-mono text-[0.55rem] text-faint">target {target}</dd>
                </div>
              ))}
            </dl>
          </PanelBody>
        </Panel>

        <Panel>
          <PanelHeader
            title="Rank snapshot"
            description={`${dataForSeo.keyword} · ${formatNumber(dataForSeo.searchVolume)} searches/month`}
            actions={<Badge tone={dataForSeo.source === 'mock' ? 'warn' : 'accent'} mono>{dataForSeo.source}</Badge>}
          />
          <div className="px-5 py-3">
            <Table>
              <THead>
                <TH>Domain</TH>
                <TH className="text-right">Organic</TH>
                <TH className="text-right">Absolute</TH>
              </THead>
              <TBody>
                {dataForSeo.results.map((row) => (
                  <TR key={row.domain} className={row.isClient ? 'bg-accent-soft/40' : undefined}>
                    <TD className={row.isClient ? 'font-medium text-ink' : 'text-muted'}>
                      {row.domain}
                      {row.isClient ? (
                        <Badge tone="accent" mono className="ml-2 px-1 py-0">
                          client
                        </Badge>
                      ) : null}
                    </TD>
                    <TD className="text-right font-mono">{row.position}</TD>
                    <TD className="text-right font-mono">{row.absolutePosition}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
            <p className="mt-3 font-mono text-[0.6rem] uppercase tracking-[0.12em] text-faint">
              rank group · {dataForSeo.rankGroup}
            </p>
          </div>
        </Panel>
      </div>

      <Panel>
        <PanelHeader
          title="Search Console queries"
          description={`${formatNumber(gsc.totals.clicks)} clicks · ${formatNumber(gsc.totals.impressions)} impressions · ${gsc.indexCoverageErrors} coverage errors`}
          actions={<Badge tone={gsc.source === 'mock' ? 'warn' : 'accent'} mono>{gsc.source}</Badge>}
        />
        <div className="px-5 py-3">
          <Table>
            <THead>
              <TH>Query</TH>
              <TH className="text-right">Clicks</TH>
              <TH className="text-right">Impressions</TH>
              <TH className="text-right">CTR</TH>
              <TH className="text-right">Position</TH>
            </THead>
            <TBody>
              {gsc.queries.map((row) => (
                <TR key={row.query}>
                  <TD>{row.query}</TD>
                  <TD className="text-right font-mono">{row.clicks}</TD>
                  <TD className="text-right font-mono">{row.impressions}</TD>
                  <TD className="text-right font-mono">{(row.ctr * 100).toFixed(1)}%</TD>
                  <TD className="text-right font-mono">{row.position.toFixed(1)}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </div>
      </Panel>
    </div>
  )
}

const SOURCE_LABELS: Record<string, string> = {
  pagespeed: 'PageSpeed',
  searchConsole: 'Search Console',
  dataForSeo: 'DataForSEO',
  whatsapp: 'WhatsApp',
}

export function ProvenanceStrip({ signals }: { signals: AuditSignals }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge tone={signals.meta.useMocks ? 'warn' : 'accent'} mono>
        {signals.meta.useMocks ? 'mock integrations' : 'live integrations'}
      </Badge>
      {Object.entries(signals.meta.integrations).map(([name, mode]) => (
        <Badge key={name} tone="outline" mono>
          {SOURCE_LABELS[name] ?? name} · {mode}
        </Badge>
      ))}
    </div>
  )
}
