'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowDown, Braces, FileText, Gauge, Radar, Rows3 } from 'lucide-react'
import { cn } from '@/lib/utils'

const STAGES = [
  {
    key: 'queue',
    label: 'Queue',
    icon: Rows3,
    kicker: '00:00',
    title: 'A URL enters the queue.',
    body: 'The audit row is written first, then the BullMQ job is submitted with a stable id per attempt. Nothing is queued that the database cannot explain.',
    meta: ['status QUEUED', 'attempt 1', 'job · a1'],
  },
  {
    key: 'crawl',
    label: 'Crawl',
    icon: Radar,
    kicker: '00:02',
    title: 'The page is read like a crawler.',
    body: 'Fetch and Cheerio extract status, title, meta, canonical, robots directives, headings, links and JSON-LD — with every redirect re-validated against SSRF rules.',
    meta: ['HTTP 200', 'robots.txt', 'sitemap.xml'],
  },
  {
    key: 'measure',
    label: 'Measure',
    icon: Gauge,
    kicker: '00:04',
    title: 'External signals attach.',
    body: 'PageSpeed, Search Console and rank data arrive through one adapter switch. In mock mode the deterministic fixtures are used and labelled in the UI and the PDF.',
    meta: ['LCP 4.2 s', 'CLS 0.08', 'INP 280 ms'],
  },
  {
    key: 'analyse',
    label: 'Analyse',
    icon: Braces,
    kicker: '00:07',
    title: '26 checks become priorities.',
    body: 'Deterministic findings and a schema-validated Claude analysis are merged. Invalid output fails the audit; it never becomes a successful-looking report.',
    meta: ['9 failing', '10 warnings', '12 fixes'],
  },
  {
    key: 'report',
    label: 'Report',
    icon: FileText,
    kicker: '00:11',
    title: 'A report leaves the building.',
    body: 'Puppeteer renders the branded A4 report from the stored audit, page numbers are stamped, and every WhatsApp and email attempt is recorded.',
    meta: ['6 pages', '232 KB', 'MOCKED'],
  },
] as const

function StageVisual({ index }: { index: number }) {
  if (index === 0) {
    return (
      <div className="flex h-full flex-col justify-center gap-6 p-6 sm:p-9">
        <div className="font-mono text-[0.55rem] uppercase tracking-[0.2em] text-faint">request</div>
        <div className="flex items-center gap-3 border border-line bg-canvas px-4 py-3">
          <span className="flex h-6 w-6 items-center justify-center border border-accent/30 bg-accent-soft/40 font-mono text-[0.55rem] text-accent">
            ↗
          </span>
          <span className="truncate font-mono text-xs text-ink">example-dental-clinic.com</span>
          <span className="ml-auto flex items-center gap-1.5 font-mono text-[0.55rem] uppercase tracking-[0.16em] text-accent">
            <span className="relative inline-flex h-1.5 w-1.5">
              <span className="absolute inset-0 rounded-full bg-accent pulse-dot" />
            </span>
            queued
          </span>
        </div>
        <div className="space-y-2 font-mono text-[0.62rem] text-muted">
          <p className="stage-line" style={{ animationDelay: '80ms' }}>
            <span className="text-accent/70">→</span> audit.create · status QUEUED
          </p>
          <p className="stage-line" style={{ animationDelay: '260ms' }}>
            <span className="text-accent/70">→</span> queue.add(&quot;seo-audit-jobs&quot;, &#123; attempt: 1 &#125;)
          </p>
          <p className="stage-line" style={{ animationDelay: '440ms' }}>
            <span className="text-accent/70">→</span> worker.pickup · waiting
          </p>
        </div>
        <div className="mt-auto flex items-center gap-2 border-t border-line pt-4 font-mono text-[0.52rem] uppercase tracking-[0.16em] text-faint">
          <ArrowDown className="h-3 w-3 text-accent/70" /> scroll to advance the pipeline
        </div>
      </div>
    )
  }

  if (index === 1) {
    return (
      <div className="flex h-full flex-col justify-center gap-5 p-6 sm:p-9">
        <div className="flex items-center justify-between font-mono text-[0.55rem] uppercase tracking-[0.18em] text-faint">
          <span>crawl · page source</span>
          <span className="text-accent">200 OK</span>
        </div>
        <div className="relative overflow-hidden border border-line bg-canvas p-4">
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(hsl(var(--line)/0.45)_1px,transparent_1px)] [background-size:100%_18px]" />
          <div className="relative space-y-2.5">
            {[
              ['<title>', 'Northstar Dental · Pune'],
              ['<meta name="description">', '…'],
              ['<link rel="canonical">', '/services'],
              ['<h1>', 'missing'],
              ['<script type="application/ld+json">', 'missing'],
            ].map(([tag, value], row) => (
              <div
                key={tag}
                className="stage-line flex items-baseline gap-2 font-mono text-[0.6rem]"
                style={{ animationDelay: `${140 + row * 120}ms` }}
              >
                <span className="shrink-0 text-accent/70">{tag}</span>
                <span className={value === 'missing' ? 'text-critical/90' : 'text-muted'}>{value}</span>
              </div>
            ))}
          </div>
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-accent/60 shadow-[0_0_18px_2px_hsl(var(--accent)/0.35)] [animation:sweep_3.6s_var(--ease-out-quint)_infinite]" />
        </div>
        <div className="grid grid-cols-3 gap-px bg-line">
          {[
            ['title', 'ok'],
            ['canonical', '301'],
            ['json-ld', '0'],
          ].map(([label, state]) => (
            <div key={label} className="bg-surface px-3 py-2">
              <div className="font-mono text-[0.5rem] uppercase tracking-[0.14em] text-faint">{label}</div>
              <div
                className={cn(
                  'mt-0.5 font-mono text-[0.62rem]',
                  state === 'ok' ? 'text-accent' : 'text-critical',
                )}
              >
                {state}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (index === 2) {
    return (
      <div className="flex h-full flex-col justify-center gap-5 p-6 sm:p-9">
        <div className="flex items-center justify-between font-mono text-[0.55rem] uppercase tracking-[0.18em] text-faint">
          <span>field measurements · mobile</span>
          <span className="border border-line px-1.5 py-0.5 text-[0.48rem]">fixture</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            { label: 'LCP', value: '4.2', unit: 's', target: '≤ 2.5 s', pct: 42, tone: 'critical' },
            { label: 'CLS', value: '0.08', unit: '', target: '≤ 0.1', pct: 80, tone: 'accent' },
            { label: 'INP', value: '280', unit: 'ms', target: '≤ 200 ms', pct: 55, tone: 'warn' },
            { label: 'PSI', value: '61', unit: '', target: '90+', pct: 61, tone: 'warn' },
          ].map((metric, row) => (
            <div
              key={metric.label}
              className="stage-line border border-line bg-canvas p-3.5"
              style={{ animationDelay: `${120 + row * 110}ms` }}
            >
              <div className="flex items-baseline justify-between">
                <span className="font-mono text-[0.55rem] uppercase tracking-[0.16em] text-faint">{metric.label}</span>
                <span className="font-display text-2xl leading-none tracking-[-0.02em]">
                  {metric.value}
                  <span className="ml-0.5 text-[0.6rem] text-faint">{metric.unit}</span>
                </span>
              </div>
              <div className="mt-3 h-1 w-full overflow-hidden bg-line/60">
                <div
                  className={cn(
                    'h-full bar-grow',
                    metric.tone === 'accent' ? 'bg-accent' : metric.tone === 'warn' ? 'bg-warn' : 'bg-critical',
                  )}
                  style={{ width: `${metric.pct}%`, '--bar-delay': `${300 + row * 120}ms` } as React.CSSProperties}
                />
              </div>
              <div className="mt-2 font-mono text-[0.5rem] uppercase tracking-[0.14em] text-faint">
                target {metric.target}
              </div>
            </div>
          ))}
        </div>
        <p className="font-mono text-[0.55rem] leading-relaxed text-faint">
          measured against published thresholds · provenance stored with the audit
        </p>
      </div>
    )
  }

  if (index === 3) {
    return (
      <div className="flex h-full flex-col justify-center gap-5 p-6 sm:p-9">
        <div className="flex items-center justify-between font-mono text-[0.55rem] uppercase tracking-[0.18em] text-faint">
          <span>deterministic checks → analysis</span>
          <span className="text-accent">schema v1.0</span>
        </div>
        <div className="grid grid-cols-[repeat(13,minmax(0,1fr))] gap-1.5">
          {Array.from({ length: 26 }, (_, cell) => {
            const tone = cell < 9 ? 'critical' : cell < 19 ? 'warn' : 'accent'
            return (
              <span
                key={cell}
                className={cn(
                  'h-4 w-full stage-cell',
                  tone === 'critical' ? 'bg-critical/80' : tone === 'warn' ? 'bg-warn/70' : 'bg-accent/70',
                )}
                style={{ animationDelay: `${cell * 28}ms` }}
              />
            )
          })}
        </div>
        <div className="grid grid-cols-3 gap-px bg-line">
          {[
            ['9', 'failing', 'text-critical'],
            ['10', 'warnings', 'text-warn'],
            ['7', 'passing', 'text-accent'],
          ].map(([value, label, tone]) => (
            <div key={label} className="bg-surface px-3 py-2.5">
              <div className={cn('font-display text-2xl leading-none', tone)}>{value}</div>
              <div className="mt-1 font-mono text-[0.5rem] uppercase tracking-[0.14em] text-faint">{label}</div>
            </div>
          ))}
        </div>
        <div className="border-l border-accent/50 pl-3 font-mono text-[0.58rem] leading-relaxed text-muted">
          12 prioritised recommendations
          <br />
          <span className="text-faint">each with impact, effort and a verification step</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col justify-center gap-6 p-6 sm:p-9">
      <div className="flex items-center justify-between font-mono text-[0.55rem] uppercase tracking-[0.18em] text-faint">
        <span>puppeteer · A4</span>
        <span className="text-accent">ready</span>
      </div>
      <div className="relative mx-auto w-full max-w-[280px]">
        <div className="absolute inset-x-4 -bottom-2 h-full rotate-[2.2deg] border border-line bg-surface/50" aria-hidden />
        <div className="absolute inset-x-2 -bottom-1 h-full rotate-[1deg] border border-line bg-surface/80" aria-hidden />
        <div className="relative border border-line bg-[#f2ede2] p-5 text-[#141917] shadow-lift">
          <div className="flex items-center justify-between">
            <span className="text-[0.55rem] font-semibold tracking-[0.2em]">
              EDGE<span className="text-[#0f7a5f]">LINK</span>
            </span>
            <span className="font-mono text-[0.42rem] uppercase tracking-[0.16em] text-[#5c665f]">technical audit</span>
          </div>
          <div className="mt-6">
            <div className="font-mono text-[0.42rem] uppercase tracking-[0.18em] text-[#5c665f]">website health report</div>
            <div className="mt-1 font-display text-lg leading-tight">example-dental-clinic.com</div>
          </div>
          <div className="mt-5 flex items-end justify-between">
            <span className="font-display text-5xl leading-none">61</span>
            <span className="mb-1 font-mono text-[0.45rem] uppercase tracking-[0.16em] text-[#5c665f]">/ 100</span>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 border-t border-[#d8d2c4] pt-3 font-mono text-[0.4rem] uppercase tracking-[0.12em] text-[#5c665f]">
            <span>6 pages</span>
            <span className="text-center">A4</span>
            <span className="text-right">29 oct 2026</span>
          </div>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {['WHATSAPP · MOCKED', 'EMAIL · MOCKED', 'AUTH-GATED DOWNLOAD'].map((chip, row) => (
          <span
            key={chip}
            className="stage-line border border-line bg-canvas px-2 py-1 font-mono text-[0.48rem] uppercase tracking-[0.14em] text-faint"
            style={{ animationDelay: `${180 + row * 120}ms` }}
          >
            {chip}
          </span>
        ))}
      </div>
    </div>
  )
}

export function SignalJourney() {
  const trackRef = useRef<HTMLDivElement>(null)
  const railRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)

  useEffect(() => {
    const track = trackRef.current
    if (!track) return
    let raf = 0

    const update = () => {
      raf = 0
      const rect = track.getBoundingClientRect()
      const travel = rect.height - window.innerHeight
      if (travel <= 0) return
      const raw = Math.min(1, Math.max(0, -rect.top / travel))
      const index = Math.min(STAGES.length - 1, Math.floor(raw * STAGES.length))
      setActive(index)
      if (railRef.current) railRef.current.style.transform = `scaleY(${Math.max(0.04, raw).toFixed(4)})`
    }

    const onScroll = () => {
      if (raf) return
      raf = requestAnimationFrame(update)
    }

    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  const stage = STAGES[active] ?? STAGES[0]

  return (
    <div>
      {/* Desktop: sticky cinematic track */}
      <div ref={trackRef} className="relative hidden lg:block" style={{ height: '390vh' }}>
        <div className="sticky top-16 flex h-[calc(100vh-4rem)] items-center">
          <div className="mx-auto grid w-full max-w-[1280px] grid-cols-12 gap-12 px-8">
            <div className="col-span-4 flex flex-col justify-center">
              <div className="mono-label">04 — The pipeline</div>
              <h2 className="mt-4 font-display text-[2.6rem] leading-[0.98] tracking-[-0.02em]">
                From a URL
                <br />
                to a <em className="italic text-accent">verdict</em>.
              </h2>
              <ol className="relative mt-9 space-y-1 border-l border-line pl-6">
                <div
                  ref={railRef}
                  className="absolute left-0 top-0 h-full w-px origin-top scale-y-[0.04] bg-accent transition-transform duration-300"
                  aria-hidden
                />
                {STAGES.map((item, index) => (
                  <li key={item.key}>
                    <button
                      type="button"
                      onClick={() => {
                        const track = trackRef.current
                        if (!track) return
                        const top = track.offsetTop
                        const travel = track.offsetHeight - window.innerHeight
                        window.scrollTo({ top: top + travel * ((index + 0.4) / STAGES.length), behavior: 'smooth' })
                      }}
                      aria-current={index === active ? 'step' : undefined}
                      className={cn(
                        'group flex w-full items-center gap-3 py-2.5 text-left transition-colors duration-300',
                        index === active ? 'text-ink' : 'text-faint hover:text-muted',
                      )}
                    >
                      <span
                        className={cn(
                          'font-mono text-[0.55rem] tabular-nums transition-colors',
                          index === active ? 'text-accent' : 'text-faint',
                        )}
                      >
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <span className="text-sm font-medium">{item.label}</span>
                      <span
                        className={cn(
                          'ml-auto h-1 w-1 rounded-full transition-all duration-500',
                          index === active ? 'scale-150 bg-accent' : 'bg-line group-hover:bg-faint',
                        )}
                        aria-hidden
                      />
                    </button>
                  </li>
                ))}
              </ol>
              <p className="mt-7 max-w-xs text-2xs leading-relaxed text-faint">
                The page follows the audit. Every stage writes an event, so progress in the product is database
                state — not a decorative animation.
              </p>
            </div>

            <div className="col-span-8">
              <div className="relative overflow-hidden border border-line bg-surface/70 shadow-lift backdrop-blur-sm">
                <div className="pointer-events-none absolute inset-0 grid-lines opacity-25" />
                <div className="relative flex items-center justify-between border-b border-line px-5 py-3">
                  <div className="flex items-center gap-2.5">
                    <stage.icon className="h-3.5 w-3.5 text-accent" aria-hidden />
                    <span className="mono-label">
                      Stage {String(active + 1).padStart(2, '0')} — {stage.label}
                    </span>
                  </div>
                  <span className="font-mono text-[0.55rem] uppercase tracking-[0.16em] text-faint">
                    {stage.kicker} elapsed
                  </span>
                </div>
                <div className="relative min-h-[430px]">
                  <div key={stage.key} className="stage-visual h-full">
                    <StageVisual index={active} />
                  </div>
                </div>
                <div className="relative border-t border-line px-5 py-4">
                  <h3 className="font-display text-xl leading-tight tracking-[-0.01em]">{stage.title}</h3>
                  <p className="mt-1.5 max-w-xl text-xs leading-relaxed text-muted">{stage.body}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {stage.meta.map((item) => (
                      <span
                        key={item}
                        className="border border-line bg-canvas px-1.5 py-0.5 font-mono text-[0.48rem] uppercase tracking-[0.12em] text-faint"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile: compact, fully readable stack */}
      <div className="divide-y divide-line lg:hidden">
        {STAGES.map((item, index) => (
          <div key={item.key} className="px-5 py-8">
            <div className="flex items-center justify-between">
              <span className="mono-label">
                {String(index + 1).padStart(2, '0')} — {item.label}
              </span>
              <item.icon className="h-3.5 w-3.5 text-accent/80" aria-hidden />
            </div>
            <h3 className="mt-3 font-display text-xl leading-tight">{item.title}</h3>
            <p className="mt-1.5 text-xs leading-relaxed text-muted">{item.body}</p>
            <div className="mt-4 border border-line bg-surface/60">
              <div className="min-h-[300px]">
                <StageVisual index={index} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
