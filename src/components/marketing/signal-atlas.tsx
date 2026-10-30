'use client'

import { useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

const ROWS = [
  {
    n: '01',
    title: 'Crawlability and indexability',
    tagline: 'Can a search engine get in?',
    body: 'A page can be fast, beautiful and completely uncrawlable. Status codes, canonical targets, robots directives, sitemap declarations and redirect chains are checked before content is discussed.',
    facts: ['robots.txt', 'sitemap.xml', 'canonical', 'noindex'],
  },
  {
    n: '02',
    title: 'Performance that users feel',
    tagline: 'Where does the wait live?',
    body: 'Lab performance is not an opinion. Largest Contentful Paint, layout shift and interaction latency are compared to published thresholds, then attributed to render-blocking and unused script weight.',
    facts: ['LCP 4.2 s', 'CLS 0.08', 'INP 280 ms'],
  },
  {
    n: '03',
    title: 'Structure that engines read',
    tagline: 'Does the page explain itself?',
    body: 'Heading order, metadata, internal links and JSON-LD decide how confidently a page can be understood. Local businesses without LocalBusiness markup lose rich-result eligibility entirely.',
    facts: ['H1 missing', 'meta', 'JSON-LD', 'LocalBusiness'],
  },
  {
    n: '04',
    title: 'Demand that already exists',
    tagline: 'Is anyone searching for this?',
    body: 'Query-level clicks, impressions, CTR and position sit beside a SERP snapshot for the target keyword, so content work is aimed at demand that already exists rather than invented personas.',
    facts: ['167 clicks', '4,560 impressions', 'position 4'],
  },
] as const

function AtlasVisual({ index }: { index: number }) {
  if (index === 0) {
    return (
      <div className="relative flex h-full items-center justify-center p-6">
        <svg viewBox="0 0 320 240" className="w-full max-w-[320px]" role="img" aria-label="Crawl map with indexability nodes">
          <circle cx="160" cy="120" r="92" fill="none" stroke="hsl(var(--line))" />
          <circle cx="160" cy="120" r="62" fill="none" stroke="hsl(var(--line))" strokeDasharray="3 5" />
          <circle cx="160" cy="120" r="32" fill="none" stroke="hsl(var(--accent) / 0.5)" />
          <circle cx="160" cy="120" r="3" fill="hsl(var(--accent))" />
          <line x1="68" y1="120" x2="252" y2="120" stroke="hsl(var(--line))" />
          <line x1="160" y1="28" x2="160" y2="212" stroke="hsl(var(--line))" />
          {[
            { x: 226, y: 62, label: 'robots', tone: 'accent' },
            { x: 96, y: 74, label: 'canonical', tone: 'warn' },
            { x: 214, y: 174, label: 'sitemap', tone: 'accent' },
            { x: 88, y: 168, label: 'noindex', tone: 'critical' },
          ].map((node, i) => (
            <g key={node.label} className="stage-line" style={{ animationDelay: `${120 + i * 110}ms` }}>
              <circle
                cx={node.x}
                cy={node.y}
                r="4"
                fill={
                  node.tone === 'accent'
                    ? 'hsl(var(--accent))'
                    : node.tone === 'warn'
                      ? 'hsl(var(--warn))'
                      : 'hsl(var(--critical))'
                }
              />
              <line x1={node.x} y1={node.y} x2="160" y2="120" stroke="hsl(var(--accent) / 0.2)" strokeDasharray="2 4" />
              <text x={node.x + 8} y={node.y + 3} fill="hsl(var(--muted-ink))" fontSize="8" fontFamily="monospace">
                {node.label}
              </text>
            </g>
          ))}
          <text x="160" y="118" textAnchor="middle" fill="hsl(var(--faint-ink))" fontSize="7" fontFamily="monospace">
            entry
          </text>
        </svg>
        <div className="absolute bottom-5 left-6 font-mono text-[0.5rem] uppercase tracking-[0.16em] text-faint">
          26 checks · 5 crawl rules
        </div>
      </div>
    )
  }

  if (index === 1) {
    return (
      <div className="flex h-full flex-col justify-center gap-4 p-6 sm:p-8">
        {[
          { label: 'LCP', value: 4.2, max: 6, target: '2.5 s', tone: 'critical', display: '4.2 s' },
          { label: 'CLS', value: 0.08, max: 0.25, target: '0.10', tone: 'accent', display: '0.08' },
          { label: 'INP', value: 280, max: 500, target: '200 ms', tone: 'warn', display: '280 ms' },
        ].map((metric, i) => (
          <div key={metric.label} className="stage-line" style={{ animationDelay: `${120 + i * 120}ms` }}>
            <div className="flex items-baseline justify-between font-mono text-[0.58rem] uppercase tracking-[0.14em]">
              <span className="text-faint">{metric.label}</span>
              <span className="text-ink">{metric.display}</span>
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden bg-line/60">
              <div
                className={cn(
                  'h-full bar-grow',
                  metric.tone === 'accent' ? 'bg-accent' : metric.tone === 'warn' ? 'bg-warn' : 'bg-critical',
                )}
                style={{
                  width: `${(metric.value / metric.max) * 100}%`,
                  '--bar-delay': `${200 + i * 120}ms`,
                } as React.CSSProperties}
              />
            </div>
            <div className="mt-1 text-right font-mono text-[0.48rem] uppercase tracking-[0.12em] text-faint">
              good ≤ {metric.target}
            </div>
          </div>
        ))}
        <div className="mt-2 border-t border-line pt-3 font-mono text-[0.52rem] uppercase tracking-[0.14em] text-faint">
          page weight 1.8 MB · 3 render-blocking requests
        </div>
      </div>
    )
  }

  if (index === 2) {
    return (
      <div className="flex h-full flex-col justify-center gap-5 p-6 sm:p-8">
        <div className="space-y-2">
          {[
            { tag: 'h1', text: 'missing', depth: 0, tone: 'critical' },
            { tag: 'h2', text: 'Services', depth: 1, tone: 'accent' },
            { tag: 'h2', text: 'Why Northstar', depth: 1, tone: 'accent' },
            { tag: 'h3', text: 'Book a consultation', depth: 2, tone: 'accent' },
          ].map((row, i) => (
            <div
              key={row.text}
              className="stage-line flex items-center gap-2 font-mono text-[0.6rem]"
              style={{ animationDelay: `${120 + i * 100}ms`, paddingLeft: `${row.depth * 18}px` }}
            >
              <span className={cn('w-6', row.tone === 'critical' ? 'text-critical' : 'text-accent/70')}>{row.tag}</span>
              <span className="h-px w-4 bg-line" aria-hidden />
              <span className={row.tone === 'critical' ? 'text-critical/90' : 'text-muted'}>{row.text}</span>
            </div>
          ))}
        </div>
        <div className="border border-dashed border-warn/40 bg-warn/5 p-3">
          <div className="font-mono text-[0.5rem] uppercase tracking-[0.16em] text-warn">application/ld+json</div>
          <pre className="mt-1.5 font-mono text-[0.55rem] leading-relaxed text-muted">
{`{
  "@type": "LocalBusiness",
  "status": "not found"
}`}
          </pre>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col justify-center gap-3 p-6 sm:p-8">
      <div className="grid grid-cols-[1.4fr_0.7fr_0.7fr_0.5fr] gap-2 border-b border-line pb-2 font-mono text-[0.45rem] uppercase tracking-[0.14em] text-faint">
        <span>query</span>
        <span className="text-right">clicks</span>
        <span className="text-right">impr.</span>
        <span className="text-right">pos</span>
      </div>
      {[
        ['dental clinic pune', '64', '1,920', '4'],
        ['emergency dentist pune', '41', '1,180', '6'],
        ['teeth whitening pune', '28', '860', '9'],
        ['northstar dental', '34', '600', '1'],
      ].map(([query, clicks, impressions, position], i) => (
        <div
          key={query}
          className="stage-line grid grid-cols-[1.4fr_0.7fr_0.7fr_0.5fr] items-baseline gap-2 border-b border-line/60 pb-2 font-mono text-[0.58rem]"
          style={{ animationDelay: `${120 + i * 100}ms` }}
        >
          <span className="truncate text-muted">{query}</span>
          <span className="text-right tabular-nums text-ink">{clicks}</span>
          <span className="text-right tabular-nums text-muted">{impressions}</span>
          <span className={cn('text-right tabular-nums', i === 0 ? 'text-accent' : 'text-muted')}>{position}</span>
        </div>
      ))}
      <div className="font-mono text-[0.48rem] uppercase tracking-[0.12em] text-faint">
        mock search console fixture · 28-day window
      </div>
    </div>
  )
}

/**
 * The signal atlas: an interactive ledger where each technical domain
 * reconfigures the specimen plate. Hover or keyboard-focus a row; click pins
 * it. All values are the deterministic assessment fixtures and are labelled.
 */
export function SignalAtlas() {
  const [active, setActive] = useState(0)

  return (
    <div className="grid gap-8 lg:grid-cols-12 lg:gap-12">
      <div className="lg:col-span-6">
        <div className="border-t border-line">
          {ROWS.map((row, index) => (
            <button
              key={row.n}
              type="button"
              onMouseEnter={() => setActive(index)}
              onFocus={() => setActive(index)}
              onClick={() => setActive(index)}
              aria-pressed={index === active}
              className={cn(
                'group block w-full border-b border-line px-1 py-5 text-left transition-colors duration-300 sm:px-2 sm:py-6',
                index === active ? 'bg-surface/40' : 'hover:bg-surface/20',
              )}
            >
              <div className="flex items-baseline gap-4">
                <span
                  className={cn(
                    'font-mono text-[0.58rem] tabular-nums transition-colors',
                    index === active ? 'text-accent' : 'text-faint',
                  )}
                >
                  {row.n}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-sm font-medium tracking-[-0.01em] text-ink sm:text-base">{row.title}</h3>
                    <ChevronRight
                      className={cn(
                        'h-3.5 w-3.5 shrink-0 transition-all duration-300',
                        index === active ? 'translate-x-0 text-accent' : '-translate-x-1 text-faint opacity-0 group-hover:opacity-100',
                      )}
                      aria-hidden
                    />
                  </div>
                  <p
                    className={cn(
                      'mt-1.5 text-xs leading-relaxed text-muted transition-all duration-500',
                      index === active ? 'max-h-32 opacity-100' : 'max-h-0 overflow-hidden opacity-0 lg:max-h-0',
                    )}
                  >
                    {row.body}
                  </p>
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {row.facts.map((fact) => (
                      <span
                        key={fact}
                        className={cn(
                          'border px-1.5 py-0.5 font-mono text-[0.46rem] uppercase tracking-[0.12em] transition-colors',
                          index === active
                            ? 'border-accent/30 bg-accent-soft/30 text-accent/90'
                            : 'border-line text-faint',
                        )}
                      >
                        {fact}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
        <p className="mt-4 font-mono text-[0.5rem] uppercase tracking-[0.16em] text-faint">
          hover a row to reconfigure the plate
        </p>
      </div>

      <div className="lg:col-span-6">
        <div className="sticky top-24 overflow-hidden border border-line bg-surface/50">
          <div className="pointer-events-none absolute inset-0 grid-lines opacity-20" />
          <div className="relative flex items-center justify-between border-b border-line px-4 py-2.5">
            <span className="mono-label">Specimen · {ROWS[active]?.tagline}</span>
            <span className="flex items-center gap-1.5 font-mono text-[0.48rem] uppercase tracking-[0.14em] text-faint">
              <span className="h-1.5 w-1.5 rounded-full bg-accent/70" /> live view
            </span>
          </div>
          <div className="relative min-h-[360px]">
            <div key={active} className="stage-visual h-full">
              <AtlasVisual index={active} />
            </div>
          </div>
          <div className="relative flex items-center justify-between border-t border-line px-4 py-2.5 font-mono text-[0.48rem] uppercase tracking-[0.14em] text-faint">
            <span>sample fixture</span>
            <span>rev 2026.10</span>
          </div>
        </div>
      </div>
    </div>
  )
}
