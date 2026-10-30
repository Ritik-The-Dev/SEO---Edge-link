'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  CircleAlert,
  Globe2,
  RotateCcw,
  Sparkles,
  TriangleAlert,
} from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Instant audit playground.
 *
 * A deterministic, entirely client-side preview: the same hostname always
 * produces the same score and findings, so it can be demonstrated and tested
 * reliably. It is NOT a crawl and says so — it exists to let a visitor feel the
 * shape of an audit before creating an account. The real 26-check audit runs in
 * the worker behind authentication.
 */

const STAGES = [
  { key: 'resolve', label: 'Resolving host', detail: 'DNS · TLS · redirect chain' },
  { key: 'fetch', label: 'Reading the document', detail: 'status · title · meta' },
  { key: 'structure', label: 'Mapping structure', detail: 'headings · links · canonical' },
  { key: 'crawl-rules', label: 'Checking crawl rules', detail: 'robots.txt · sitemap.xml' },
  { key: 'vitals', label: 'Measuring vitals', detail: 'LCP · CLS · INP' },
  { key: 'schema', label: 'Reading structured data', detail: 'JSON-LD · LocalBusiness' },
  { key: 'prioritise', label: 'Prioritising fixes', detail: 'impact · effort' },
] as const

type Severity = 'critical' | 'warning' | 'opportunity'

type Finding = {
  title: string
  detail: string
  severity: Severity
  fix: string
}

const FINDINGS: Finding[] = [
  {
    title: 'Mobile LCP is above the 2.5 s threshold',
    detail: 'The hero image is served at full resolution and blocks first paint.',
    severity: 'critical',
    fix: 'Preload a compressed hero, then re-measure.',
  },
  {
    title: 'No LocalBusiness structured data',
    detail: 'Rich-result eligibility for a local business depends on it.',
    severity: 'warning',
    fix: 'Add one JSON-LD block with NAP details.',
  },
  {
    title: 'Canonical points at a 301 redirect',
    detail: 'The canonical URL resolves through one hop before it settles.',
    severity: 'critical',
    fix: 'Point the canonical at the final 200 URL.',
  },
  {
    title: 'Meta description is missing',
    detail: 'Search engines will invent a snippet for the service page.',
    severity: 'opportunity',
    fix: 'Write a 150-character description per service.',
  },
  {
    title: 'Image alt coverage is 71%',
    detail: 'Nine of the thirty-one images on the page have no alt text.',
    severity: 'warning',
    fix: 'Describe content images; empty the decorative ones.',
  },
  {
    title: 'Three indexed URLs are missing from the sitemap',
    detail: 'Eligible pages are being discovered without a declaration.',
    severity: 'opportunity',
    fix: 'Regenerate the sitemap from the route table.',
  },
  {
    title: 'Title tag runs past the 60-character cut',
    detail: 'The brand suffix is truncated in the result snippet.',
    severity: 'opportunity',
    fix: 'Shorten the suffix and lead with the service.',
  },
  {
    title: 'Render-blocking script in the head',
    detail: 'One analytics bundle delays first render by roughly 400 ms.',
    severity: 'critical',
    fix: 'Load it deferred after the main content.',
  },
]

const SEVERITY_STYLE: Record<Severity, { label: string; className: string; icon: typeof CircleAlert }> = {
  critical: {
    label: 'critical',
    className: 'border-critical/35 bg-critical/10 text-critical',
    icon: TriangleAlert,
  },
  warning: {
    label: 'warning',
    className: 'border-warn/35 bg-warn/10 text-warn',
    icon: CircleAlert,
  },
  opportunity: {
    label: 'quick win',
    className: 'border-accent/35 bg-accent/10 text-accent',
    icon: Sparkles,
  },
}

function hash(input: string): number {
  let value = 2166136261
  for (let index = 0; index < input.length; index += 1) {
    value ^= input.charCodeAt(index)
    value = Math.imul(value, 16777619)
  }
  return value >>> 0
}

function normalise(raw: string): { host: string; url: string } | null {
  const trimmed = raw.trim().replace(/^https?:\/\//i, '').replace(/\/+$/, '')
  if (!trimmed || /\s/.test(trimmed)) return null
  const host = trimmed.split('/')[0]?.toLowerCase() ?? ''
  if (!/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(host)) return null
  return { host, url: `https://${trimmed}` }
}

function resultFor(host: string) {
  const seed = hash(host)
  const score = 48 + (seed % 44)
  const count = 2 + (seed % 3)
  const findings: Finding[] = []
  for (let step = 0; step < 8 && findings.length < count; step += 1) {
    const candidate = FINDINGS[(seed >>> (step + 1)) % FINDINGS.length]
    if (candidate && !findings.includes(candidate)) findings.push(candidate)
  }
  const critical = findings.filter((item) => item.severity === 'critical').length
  return { score, findings, critical }
}

export function AuditPlayground({ className }: { className?: string }) {
  const [value, setValue] = useState('')
  const [phase, setPhase] = useState<'idle' | 'scanning' | 'done'>('idle')
  const [stage, setStage] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState<{ host: string; url: string } | null>(null)
  const [displayScore, setDisplayScore] = useState(0)

  const panelRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<number | null>(null)
  const scoreTimerRef = useRef<number | null>(null)

  const result = submitted ? resultFor(submitted.host) : null

  const clearTimers = useCallback(() => {
    if (timerRef.current) window.clearInterval(timerRef.current)
    if (scoreTimerRef.current) window.clearInterval(scoreTimerRef.current)
    timerRef.current = null
    scoreTimerRef.current = null
  }, [])

  useEffect(() => () => clearTimers(), [clearTimers])

  const start = useCallback(
    (raw: string) => {
      const parsed = normalise(raw)
      if (!parsed) {
        setError('Enter a domain like example.com — no paths needed.')
        return
      }
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        setSubmitted(parsed)
        setDisplayScore(resultFor(parsed.host).score)
        setPhase('done')
        return
      }
      clearTimers()
      setError(null)
      setValue(parsed.host)
      setSubmitted(parsed)
      setDisplayScore(0)
      setStage(0)
      setPhase('scanning')

      let current = 0
      timerRef.current = window.setInterval(() => {
        current += 1
        setStage(current)
        if (current >= STAGES.length) {
          if (timerRef.current) window.clearInterval(timerRef.current)
          timerRef.current = null
          const target = resultFor(parsed.host).score
          setPhase('done')
          const startedAt = performance.now()
          scoreTimerRef.current = window.setInterval(() => {
            const progress = Math.min(1, (performance.now() - startedAt) / 900)
            const eased = 1 - Math.pow(1 - progress, 3)
            setDisplayScore(Math.round(eased * target))
            if (progress >= 1 && scoreTimerRef.current) {
              window.clearInterval(scoreTimerRef.current)
              scoreTimerRef.current = null
            }
          }, 24)
        }
      }, 340)
    },
    [clearTimers],
  )

  const reset = () => {
    clearTimers()
    setPhase('idle')
    setStage(0)
    setSubmitted(null)
    setDisplayScore(0)
    setError(null)
    setValue('')
  }

  const onPointer = (event: React.PointerEvent<HTMLDivElement>) => {
    const element = panelRef.current
    if (!element || event.pointerType !== 'mouse') return
    const rect = element.getBoundingClientRect()
    element.style.setProperty('--mx', `${event.clientX - rect.left}px`)
    element.style.setProperty('--my', `${event.clientY - rect.top}px`)
  }

  const scanning = phase === 'scanning'
  const done = phase === 'done' && result

  return (
    <div
      ref={panelRef}
      onPointerMove={onPointer}
      className={cn(
        'group/panel relative overflow-hidden rounded-[26px] border border-line/80 bg-surface/90 backdrop-blur-xl',
        'shadow-[0_40px_120px_-60px_hsl(0_0%_0%/0.95)]',
        className,
      )}
      style={{ ['--mx' as string]: '50%', ['--my' as string]: '20%' }}
    >
      {/* pointer spotlight */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-60 transition-opacity duration-500 group-hover/panel:opacity-100"
        style={{
          background:
            'radial-gradient(420px circle at var(--mx) var(--my), hsl(var(--accent) / 0.10), transparent 62%)',
        }}
      />
      <div aria-hidden className="pointer-events-none absolute inset-0 grid-lines opacity-[0.16]" />

      <div className="relative flex items-center justify-between gap-3 border-b border-line/70 px-5 py-3.5 sm:px-6">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2 w-2">
            <span className="absolute inset-0 rounded-full bg-accent pulse-dot" />
          </span>
          <span className="font-mono text-[0.58rem] uppercase tracking-[0.2em] text-ink">
            Instant audit
          </span>
        </div>
        <span className="rounded-full border border-line/80 bg-canvas/70 px-2.5 py-1 font-mono text-[0.5rem] uppercase tracking-[0.16em] text-faint">
          sample engine
        </span>
      </div>

      <div className="relative p-5 sm:p-6">
        <form
          onSubmit={(event) => {
            event.preventDefault()
            start(value)
          }}
          className="flex flex-col gap-2.5"
        >
          <label htmlFor="playground-url" className="sr-only">
            Website address to preview
          </label>
          <div
            className={cn(
              'flex items-center gap-2 rounded-2xl border bg-canvas/80 p-1.5 pl-3.5 transition-colors duration-200',
              error ? 'border-critical/60' : 'border-line focus-within:border-accent/70',
            )}
          >
            <Globe2 className="h-4 w-4 shrink-0 text-faint" aria-hidden />
            <input
              id="playground-url"
              name="url"
              value={value}
              onChange={(event) => {
                setValue(event.target.value)
                if (error) setError(null)
              }}
              placeholder="yourdomain.com"
              autoComplete="url"
              inputMode="url"
              spellCheck={false}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? 'playground-error' : undefined}
              className="h-10 min-w-0 flex-1 bg-transparent font-mono text-sm text-ink outline-none placeholder:text-faint/80"
            />
            <button
              type="submit"
              disabled={scanning}
              className="inline-flex h-10 shrink-0 items-center gap-2 rounded-xl bg-accent px-4 text-sm font-semibold text-[hsl(var(--accent-ink))] transition-transform duration-200 hover:-translate-y-0.5 active:translate-y-0 disabled:cursor-wait disabled:opacity-80"
            >
              {scanning ? 'Scanning' : 'Scan site'}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </button>
          </div>
          {error ? (
            <p id="playground-error" role="alert" className="pl-1 font-mono text-[0.6rem] text-critical">
              {error}
            </p>
          ) : (
            <p className="pl-1 font-mono text-[0.58rem] uppercase tracking-[0.14em] text-faint">
              No account · deterministic preview · 26 checks in the real audit
            </p>
          )}
        </form>

        <div className="relative mt-5 min-h-[268px]">
          {phase === 'idle' ? (
            <div className="animate-fade-up">
              <div className="grid gap-5 sm:grid-cols-[1.1fr_0.9fr] sm:items-center">
                <div>
                  <p className="max-w-sm text-sm leading-relaxed text-muted">
                    Type a domain and watch the instrument work. This is a deterministic preview of the
                    real pipeline — same stages, same severity model, no crawl.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                {['example-dental-clinic.com', 'northstar.dental', 'edgelink.dev'].map((sample) => (
                  <button
                    key={sample}
                    type="button"
                    onClick={() => {
                      setValue(sample)
                      start(sample)
                    }}
                    className="group/chip inline-flex items-center gap-1.5 rounded-full border border-line/80 bg-canvas/60 px-3 py-1.5 font-mono text-[0.58rem] text-muted transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/50 hover:text-ink"
                  >
                    {sample}
                    <ArrowUpRight className="h-3 w-3 text-accent/70 transition-transform group-hover/chip:-translate-y-0.5 group-hover/chip:translate-x-0.5" />
                  </button>
                ))}
                  </div>
                </div>

                {/* Ghost of the instrument: shows the shape of the result before you run it. */}
                <div className="relative hidden overflow-hidden rounded-xl border border-dashed border-line/70 bg-canvas/30 p-4 sm:block">
                  <div className="flex items-center justify-between font-mono text-[0.5rem] uppercase tracking-[0.16em] text-faint">
                    <span>preview appears here</span>
                    <span className="text-accent/70">idle</span>
                  </div>
                  <div className="mt-4 flex items-center gap-4">
                    <svg viewBox="0 0 64 64" className="h-16 w-16 shrink-0 -rotate-90 opacity-70">
                      <circle cx="32" cy="32" r="27" fill="none" stroke="hsl(var(--line))" strokeWidth="3" />
                      <circle
                        cx="32"
                        cy="32"
                        r="27"
                        fill="none"
                        stroke="hsl(var(--accent) / 0.5)"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeDasharray="170"
                        strokeDashoffset="118"
                      />
                    </svg>
                    <div className="min-w-0 flex-1 space-y-2">
                      {[72, 54, 38].map((width, index) => (
                        <div key={width} className="flex items-center gap-2">
                          <span
                            className={cn(
                              'h-1 w-1 shrink-0 rounded-full',
                              index === 0 ? 'bg-critical/70' : index === 1 ? 'bg-warn/70' : 'bg-accent/70',
                            )}
                          />
                          <span className="h-1 rounded-full bg-line/70" style={{ width: `${width}%` }} />
                        </div>
                      ))}
                      <div className="pt-1 font-mono text-[0.46rem] uppercase tracking-[0.14em] text-faint">
                        score · findings · fixes
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line/70 bg-line/40">
                {[
                  ['Crawl', 'fetch · cheerio'],
                  ['Measure', 'LCP · CLS · INP'],
                  ['Analyse', 'schema-validated'],
                  ['Report', 'A4 · PDF'],
                ].map(([label, detail]) => (
                  <div key={label} className="bg-surface/90 px-3 py-2.5">
                    <div className="font-mono text-[0.56rem] uppercase tracking-[0.16em] text-ink">
                      {label}
                    </div>
                    <div className="mt-0.5 font-mono text-[0.52rem] text-faint">{detail}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {scanning ? (
            <div>
              <div className="flex items-center justify-between font-mono text-[0.55rem] uppercase tracking-[0.16em] text-faint">
                <span>scanning {submitted?.host}</span>
                <span className="tabular-nums text-accent">
                  {Math.round((Math.min(stage, STAGES.length) / STAGES.length) * 100)}%
                </span>
              </div>
              <div className="mt-2 h-1 overflow-hidden rounded-full bg-line/60">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-accent to-[hsl(var(--gradient-2))] transition-[width] duration-500 ease-out"
                  style={{ width: `${(Math.min(stage, STAGES.length) / STAGES.length) * 100}%` }}
                />
              </div>
              <ul className="mt-4 space-y-1.5" aria-live="polite">
                {STAGES.map((item, index) => {
                  const complete = index < stage
                  const active = index === stage
                  return (
                    <li
                      key={item.key}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-2 py-1.5 transition-all duration-300',
                        active ? 'bg-accent/[0.06]' : 'opacity-60',
                      )}
                    >
                      <span
                        className={cn(
                          'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors',
                          complete
                            ? 'border-accent bg-accent text-[hsl(var(--accent-ink))]'
                            : active
                              ? 'border-accent/60 text-accent'
                              : 'border-line text-faint',
                        )}
                      >
                        {complete ? (
                          <Check className="h-3 w-3" aria-hidden />
                        ) : (
                          <span
                            className={cn(
                              'h-1.5 w-1.5 rounded-full',
                              active ? 'animate-pulse bg-accent' : 'bg-line',
                            )}
                          />
                        )}
                      </span>
                      <span
                        className={cn(
                          'font-mono text-[0.6rem] uppercase tracking-[0.14em]',
                          active ? 'text-ink' : 'text-muted',
                        )}
                      >
                        {item.label}
                      </span>
                      <span className="ml-auto hidden font-mono text-[0.52rem] text-faint sm:block">
                        {item.detail}
                      </span>
                    </li>
                  )
                })}
              </ul>
            </div>
          ) : null}

          {done ? (
            <div className="animate-fade-up">
              <div className="flex items-start gap-4">
                <ScoreDial score={displayScore} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-mono text-xs text-ink">{submitted?.host}</span>
                    <span className="rounded-full border border-accent/30 bg-accent/10 px-2 py-0.5 font-mono text-[0.48rem] uppercase tracking-[0.14em] text-accent">
                      preview
                    </span>
                  </div>
                  <p className="mt-1 text-[0.72rem] leading-relaxed text-muted">
                    {done.findings.length} priority findings
                    {done.critical > 0 ? ` · ${done.critical} critical` : ''} across technical,
                    on-page and vitals signals.
                  </p>
                  <div className="mt-2 flex flex-wrap gap-3 font-mono text-[0.52rem] uppercase tracking-[0.14em] text-faint">
                    <span>26 checks</span>
                    <span>·</span>
                    <span>AI priorities</span>
                    <span>·</span>
                    <span>PDF ready</span>
                  </div>
                </div>
              </div>

              <ul className="mt-4 space-y-1.5">
                {done.findings.slice(0, 3).map((finding, index) => {
                  const style = SEVERITY_STYLE[finding.severity]
                  const Icon = style.icon
                  return (
                    <li
                      key={finding.title}
                      className="stage-line flex items-start gap-2.5 rounded-xl border border-line/70 bg-canvas/50 px-3 py-2"
                      style={{ animationDelay: `${index * 80}ms` }}
                    >
                      <Icon className={cn('mt-0.5 h-3.5 w-3.5 shrink-0', style.className.split(' ').pop())} aria-hidden />
                      <div className="min-w-0">
                        <p className="truncate text-[0.7rem] font-medium text-ink">{finding.title}</p>
                        <p className="mt-0.5 truncate font-mono text-[0.55rem] text-faint">
                          Fix: {finding.fix}
                        </p>
                      </div>
                      <span
                        className={cn(
                          'ml-auto shrink-0 rounded-full border px-1.5 py-0.5 font-mono text-[0.44rem] uppercase tracking-[0.12em]',
                          style.className,
                        )}
                      >
                        {style.label}
                      </span>
                    </li>
                  )
                })}
              </ul>

              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <Link
                  href="/app/audits/new"
                  className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-accent text-sm font-semibold text-[hsl(var(--accent-ink))] transition-transform hover:-translate-y-0.5"
                >
                  Run the full audit
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
                <button
                  type="button"
                  onClick={reset}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-line px-4 text-xs font-medium text-muted transition-colors hover:border-accent/40 hover:text-ink"
                >
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden />
                  Scan another
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="relative flex items-center justify-between border-t border-line/70 px-5 py-2.5 font-mono text-[0.48rem] uppercase tracking-[0.16em] text-faint sm:px-6">
        <span>preview only · not a live crawl</span>
        <span className="hidden sm:inline">edgelink / instrument 01</span>
      </div>
    </div>
  )
}

function ScoreDial({ score }: { score: number }) {
  const size = 92
  const stroke = 6
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const tone = score >= 80 ? 'hsl(var(--success))' : score >= 65 ? 'hsl(var(--warn))' : 'hsl(var(--critical))'

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--line) / 0.7)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={tone}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - score / 100)}
          style={{ filter: `drop-shadow(0 0 10px ${tone})` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-2xl leading-none tabular-nums text-ink">{score}</span>
        <span className="mt-1 font-mono text-[0.46rem] uppercase tracking-[0.16em] text-faint">
          / 100
        </span>
      </div>
    </div>
  )
}
