import Link from 'next/link'
import { ArrowUpRight, Check, FileText, Sparkles } from 'lucide-react'
import { Badge, StatusPill } from '@/components/ui/badge'
import { ScoreBreakdown, ScoreRing } from '@/components/ui/score'

const BREAKDOWN = {
  technical: 68,
  on_page: 82,
  content: 75,
  core_web_vitals: 60,
  schema: 80,
}

const FINDINGS = [
  {
    severity: 'Critical',
    tone: 'critical' as const,
    check: 'Heading structure',
    observation: 'No H1 element was found on the audited page.',
  },
  {
    severity: 'Critical',
    tone: 'critical' as const,
    check: 'Structured data',
    observation: 'No JSON-LD block is present, so no rich result is eligible.',
  },
  {
    severity: 'High',
    tone: 'warn' as const,
    check: 'Largest Contentful Paint',
    observation: 'Mobile LCP is 4.2 s against a 2.5 s good threshold.',
  },
]

const METRICS = [
  { label: 'LCP', value: '4.2 s', target: '≤ 2.5 s', pct: 42, tone: 'critical' },
  { label: 'CLS', value: '0.08', target: '≤ 0.1', pct: 80, tone: 'good' },
  { label: 'INP', value: '280 ms', target: '≤ 200 ms', pct: 55, tone: 'warn' },
  { label: 'PSI', value: '61', target: '90+', pct: 61, tone: 'warn' },
] as const

const WINS = [
  'Add a self-referencing canonical using the final https URL.',
  'Reduce the hero image weight and preload it from the same origin.',
]

/**
 * Sample audit console used on the marketing page. It deliberately reuses the
 * same score, badge and table primitives as the real audit screen so the
 * preview cannot drift from the product; every value is fixture data and is
 * labelled as such.
 */
export function ProductConsole() {
  return (
    <div className="panel relative overflow-hidden shadow-lift">
      <div className="pointer-events-none absolute inset-0 grid-lines opacity-20" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/50 to-transparent" />

      {/* Record header */}
      <div className="relative flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3 sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <span className="hidden h-7 w-7 items-center justify-center rounded-[3px] border border-line bg-canvas sm:flex">
            <FileText className="h-3.5 w-3.5 text-accent" aria-hidden />
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[0.58rem] uppercase tracking-[0.16em] text-faint">
                Audit record
              </span>
              <span className="h-2.5 w-px bg-line" aria-hidden />
              <span className="font-mono text-[0.58rem] text-faint">29 Oct 2026 · 11:23 UTC</span>
            </div>
            <div className="mt-0.5 truncate text-xs text-ink">
              example-dental-clinic.com <span className="text-faint">/ single-page technical audit</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone="outline" mono>
            sample data
          </Badge>
          <StatusPill status="COMPLETED" />
        </div>
      </div>

      <div className="relative grid lg:grid-cols-12">
        {/* Score */}
        <div className="border-b border-line p-4 sm:p-5 lg:col-span-4 lg:border-b-0 lg:border-r">
          <div className="flex items-start justify-between">
            <div>
              <div className="mono-label">AI-assisted score</div>
              <p className="mt-1 text-2xs leading-relaxed text-faint">Weighted across five categories</p>
            </div>
            <span className="font-mono text-[0.55rem] uppercase tracking-[0.14em] text-accent/80">live</span>
          </div>

          <div className="mt-5 flex items-center gap-4">
            <ScoreRing score={61} size={104} stroke={6} />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-2xs text-muted">
                <span className="h-1.5 w-1.5 rounded-full bg-warn" aria-hidden />
                Needs work
              </div>
              <p className="mt-1.5 text-2xs leading-relaxed text-faint">
                4 failed · 6 warning checks
                <br />
                12 prioritised fixes
              </p>
            </div>
          </div>

          <ScoreBreakdown breakdown={BREAKDOWN} className="mt-6 [&_.grid]:grid-cols-[6.5rem_1fr_1.75rem]" />

          <div className="mt-5 flex flex-wrap gap-1.5 border-t border-line pt-4">
            <Badge tone="accent" mono>
              mock integrations
            </Badge>
            <Badge tone="outline" mono>
              ai fixture
            </Badge>
          </div>
        </div>

        {/* Findings + quick wins */}
        <div className="border-b border-line lg:col-span-5 lg:border-b-0 lg:border-r">
          <div className="flex items-center justify-between border-b border-line px-4 py-2.5 sm:px-5">
            <span className="mono-label">Critical findings</span>
            <span className="font-mono text-[0.58rem] text-faint">03 shown of 12</span>
          </div>
          <ul className="divide-y divide-line">
            {FINDINGS.map((finding) => (
              <li key={finding.check} className="px-4 py-3 sm:px-5">
                <div className="flex items-center gap-2">
                  <Badge tone={finding.tone} mono>
                    {finding.severity}
                  </Badge>
                  <span className="truncate text-xs text-ink">{finding.check}</span>
                </div>
                <p className="mt-1.5 text-2xs leading-relaxed text-muted">{finding.observation}</p>
              </li>
            ))}
          </ul>

          <div className="border-t border-line px-4 py-3 sm:px-5">
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-3 w-3 text-accent" aria-hidden />
              <span className="mono-label">Quick wins · under two hours</span>
            </div>
            <ul className="mt-2 space-y-1.5">
              {WINS.map((win) => (
                <li key={win} className="flex gap-2 text-2xs leading-relaxed text-muted">
                  <Check className="mt-0.5 h-3 w-3 shrink-0 text-accent/80" aria-hidden />
                  {win}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Metrics */}
        <div className="lg:col-span-3">
          <div className="border-b border-line px-4 py-2.5 sm:px-5">
            <span className="mono-label">Measured signals</span>
          </div>
          <dl className="divide-y divide-line">
            {METRICS.map((metric) => (
              <div key={metric.label} className="px-4 py-2.5 sm:px-5">
                <div className="flex items-baseline justify-between gap-2">
                  <dt className="font-mono text-[0.58rem] uppercase tracking-[0.12em] text-faint">{metric.label}</dt>
                  <dd className="font-mono text-xs tabular-nums text-ink">{metric.value}</dd>
                </div>
                <div className="mt-1.5 h-0.5 w-full overflow-hidden rounded-full bg-line/70">
                  <div
                    className={
                      metric.tone === 'good'
                        ? 'h-full rounded-full bg-accent'
                        : metric.tone === 'warn'
                          ? 'h-full rounded-full bg-warn'
                          : 'h-full rounded-full bg-critical'
                    }
                    style={{ width: `${metric.pct}%` }}
                  />
                </div>
                <div className="mt-1 font-mono text-[0.52rem] uppercase tracking-[0.1em] text-faint">
                  target {metric.target}
                </div>
              </div>
            ))}
          </dl>

          <div className="px-4 py-3 sm:px-5">
            <div className="rounded-[3px] border border-line bg-canvas p-2.5">
              <div className="mono-label">Report</div>
              <p className="mt-1 break-all font-mono text-[0.52rem] leading-relaxed text-faint">
                edgelink-seo-audit-example-dental-clinic-2026-10-29.pdf
              </p>
              <div className="mt-2 flex items-center justify-between font-mono text-[0.55rem] text-faint">
                <span>6 pages · 232 KB</span>
                <span className="text-accent/80">ready</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="relative flex flex-wrap items-center justify-between gap-3 border-t border-line bg-surface/60 px-4 py-3 sm:px-5">
        <p className="max-w-md text-2xs leading-relaxed text-faint">
          Every value above is an assessment fixture, labelled in the UI and PDF. The working product replaces it
          with the persisted result of a real crawl.
        </p>
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="link-underline inline-flex items-center gap-1 text-2xs text-ink transition-colors hover:text-accent"
          >
            Open the workspace <ArrowUpRight className="h-3 w-3" />
          </Link>
          <a
            href="#reports"
            className="link-underline inline-flex items-center gap-1 text-2xs text-muted transition-colors hover:text-ink"
          >
            See the report
          </a>
        </div>
      </div>
    </div>
  )
}
