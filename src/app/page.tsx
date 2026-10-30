import Link from 'next/link'
import {
  ArrowRight,
  ArrowUpRight,
  Braces,
  CalendarClock,
  Check,
  FileText,
  Gauge,
  KeyRound,
  Link2,
  Radar,
  ScanLine,
  ShieldCheck,
  Sparkles,
  Terminal,
} from 'lucide-react'
import { SiteHeader } from '@/components/marketing/site-header'
import { SiteFooter } from '@/components/marketing/site-footer'
import { AuditPlayground } from '@/components/marketing/audit-playground'
import { SignalAssembly } from '@/components/marketing/signal-assembly'
import { SeoCompanion } from '@/components/marketing/seo-companion'
import { Magnetic } from '@/components/marketing/magnetic'
import { KineticHeadline } from '@/components/marketing/kinetic-headline'
import { LivingField } from '@/components/marketing/living-field'
import { CursorReticle } from '@/components/marketing/cursor-reticle'
import { SignalMarquee } from '@/components/marketing/signal-marquee'
import { SignalObservatory } from '@/components/marketing/signal-observatory'
import { SignalAtlas } from '@/components/marketing/signal-atlas'
import { SignalJourney } from '@/components/marketing/signal-journey'
import { ProductConsole } from '@/components/marketing/product-console'
import { ReportPreview } from '@/components/marketing/report-preview'
import { SignalTicker } from '@/components/marketing/signal-ticker'
import { TiltFrame } from '@/components/marketing/tilt-frame'
import { InView } from '@/components/marketing/in-view'
import { Reveal } from '@/components/marketing/reveal'
import { Button } from '@/components/ui/button'
import { getCurrentUser } from '@/lib/auth'

const SIGNALS = [
  'HTTP status',
  'Titles',
  'Meta',
  'Canonical',
  'Robots',
  'Sitemap',
  'JSON-LD',
  'Headings',
  'Internal links',
  'Image alt',
  'LCP',
  'CLS',
  'INP',
  'Search Console',
  'SERP position',
  'AI analysis',
  'PDF report',
]

const CAPABILITIES = [
  {
    icon: ScanLine,
    title: 'Technical checks',
    body: 'Status, canonical, robots directives, heading structure, internal links and alt coverage — plus robots.txt and sitemap validation.',
    fact: '26 deterministic checks',
  },
  {
    icon: Gauge,
    title: 'Performance',
    body: 'Core Web Vitals are compared to published thresholds and attributed to render-blocking and unused script weight.',
    fact: 'LCP · CLS · INP',
  },
  {
    icon: Braces,
    title: 'AI prioritisation',
    body: 'Claude returns a schema-validated breakdown: critical issues, quick wins and fixes ordered by impact and effort.',
    fact: 'versioned JSON contract',
  },
  {
    icon: FileText,
    title: 'Client reporting',
    body: 'A branded A4 report rendered from the stored audit, downloadable behind authentication and delivered by notification.',
    fact: 'PDF + delivery log',
  },
]

const PATH = [
  {
    step: '01',
    kicker: 'Curious',
    title: 'Play with the instrument',
    body: 'Type any domain into the instant audit. No account, no email — just the stages, a score and the findings the real audit would surface.',
    cta: { href: '#top', label: 'Try the preview' },
    icon: Sparkles,
  },
  {
    step: '02',
    kicker: 'Convinced',
    title: 'Run the full audit',
    body: 'Sign in and the same URL goes through the real worker: live crawl, 26 checks, measured signals, Claude analysis and a stored result.',
    cta: { href: '/app/audits/new', label: 'Run a full audit' },
    icon: Radar,
  },
  {
    step: '03',
    kicker: 'Committed',
    title: 'Make it monthly',
    body: 'Attach clients and sites, schedule the audit, and every cycle produces a new report with a recorded delivery attempt for each channel.',
    cta: { href: '/app/schedules', label: 'See schedules' },
    icon: CalendarClock,
  },
]

const SECURITY = [
  {
    icon: ShieldCheck,
    title: 'Crawler locked down',
    body: 'Only http(s), no embedded credentials, private and metadata addresses blocked, DNS answers checked, every redirect re-validated.',
  },
  {
    icon: KeyRound,
    title: 'Server-side authorization',
    body: 'Every route re-checks the signed session. Client users are scoped by ownership in the query, never by hiding navigation.',
  },
  {
    icon: Link2,
    title: 'Protected automation',
    body: 'Cron routes require a dedicated secret compared in constant time; due schedules are claimed with a conditional update.',
  },
]

export default async function LandingPage() {
  const user = await getCurrentUser()
  const signedIn = Boolean(user)

  return (
    <div className="relative isolate overflow-x-clip bg-canvas">
      <LivingField />
      <CursorReticle />
      <SeoCompanion />

      <div className="relative z-10">
        <SiteHeader signedIn={signedIn} />

        <main id="top">
          {/* ── Hero: the shattered signals assemble into a ranked page ──── */}
          <section data-companion="hero" className="relative overflow-hidden">
            <div
              aria-hidden
              className="pointer-events-none absolute -left-40 top-10 h-[34rem] w-[34rem] rounded-full bg-accent/[0.07] blur-[120px]"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute -right-24 top-40 h-[26rem] w-[26rem] rounded-full bg-[hsl(var(--gradient-3))]/[0.08] blur-[120px]"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 grid-lines opacity-[0.14] [mask-image:radial-gradient(ellipse_at_50%_10%,black,transparent_72%)]"
            />

            <div className="relative mx-auto w-full max-w-[1320px] px-5 pb-14 pt-12 lg:px-8 lg:pb-24 lg:pt-16">
              <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-10">
                <div className="min-w-0">
                  <Reveal>
                    <div className="mb-6 inline-flex items-center gap-2.5 rounded-full border border-line/80 bg-surface/60 px-3 py-1.5 backdrop-blur">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="absolute inset-0 rounded-full bg-accent pulse-dot" />
                      </span>
                      <span className="font-mono text-[0.56rem] uppercase tracking-[0.2em] text-accent">
                        SEO intelligence
                      </span>
                      <span className="h-3 w-px bg-line" aria-hidden />
                      <span className="font-mono text-[0.56rem] uppercase tracking-[0.2em] text-faint">
                        Edgelink Technology
                      </span>
                    </div>
                  </Reveal>

                  <Reveal delay={0.05}>
                    <KineticHeadline />
                  </Reveal>

                  <Reveal delay={0.14}>
                    <p className="mt-6 max-w-[30rem] text-[0.98rem] leading-relaxed text-muted">
                      Technical SEO intelligence, automated audits and actionable recommendations — one
                      connected workflow from crawl to client-ready report. No ranking promises, just the
                      signals that actually decide whether you get found.
                    </p>
                  </Reveal>

                  <Reveal delay={0.2}>
                    <div className="mt-8 flex flex-wrap items-center gap-3">
                      <Magnetic strength={0.22}>
                        <Button asChild size="lg" className="group rounded-full px-6">
                          <Link href={signedIn ? '/app' : '/app/audits/new'}>
                            {signedIn ? 'Open the workspace' : 'Run a full audit'}
                            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                          </Link>
                        </Button>
                      </Magnetic>
                      <Magnetic strength={0.16}>
                        <Button asChild size="lg" variant="outline" className="rounded-full px-6">
                          <a href="#audit">
                            <Radar className="h-4 w-4 text-accent" />
                            Watch it work
                          </a>
                        </Button>
                      </Magnetic>
                    </div>
                  </Reveal>

                  <Reveal delay={0.26}>
                    <SignalTicker className="mt-7 max-w-[30rem] rounded-xl" />
                  </Reveal>

                  <Reveal delay={0.32}>
                    <dl className="mt-7 flex max-w-[30rem] flex-wrap gap-x-8 gap-y-3 border-t border-line/70 pt-5">
                      {[
                        ['26', 'checks per audit'],
                        ['5', 'score dimensions'],
                        ['1', 'PDF per cycle'],
                      ].map(([value, label]) => (
                        <div key={label} className="flex items-baseline gap-2">
                          <dt className="font-display text-2xl leading-none text-ink">{value}</dt>
                          <dd className="font-mono text-[0.55rem] uppercase tracking-[0.16em] text-faint">
                            {label}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </Reveal>
                </div>

                <div className="relative min-w-0">
                  <div
                    aria-hidden
                    className="absolute left-1/2 top-0 z-20 hidden -translate-x-1/2 rotate-[-4deg] rounded-full border border-accent/40 bg-canvas/90 px-3 py-1 font-mono text-[0.5rem] uppercase tracking-[0.18em] text-accent shadow-lg backdrop-blur sm:block"
                  >
                    assembling · 8 signals
                  </div>
                  <SignalAssembly className="mt-6 sm:mt-2" />
                  <div className="relative z-20 mt-3 flex items-center justify-center gap-2 font-mono text-[0.5rem] uppercase tracking-[0.18em] text-faint">
                    <span className="h-px w-8 bg-line" aria-hidden />
                    scattered → assembled → indexed
                    <span className="h-px w-8 bg-line" aria-hidden />
                  </div>
                  <p className="sr-only">
                    An illustration of eight technical SEO signals — largest contentful paint, heading
                    structure, canonical, structured data, sitemap, image alt text, robots directives and
                    layout shift — assembling into a single indexed page.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <SignalMarquee items={SIGNALS} duration={54} />

          {/* ── The instrument: instant audit playground ─────────────────── */}
          <section id="audit" data-companion="audit" className="relative overflow-hidden border-b border-line/60 bg-surface/25">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 grid-lines opacity-[0.12] [mask-image:radial-gradient(ellipse_at_50%_0%,black,transparent_70%)]"
            />
            <div className="relative mx-auto w-full max-w-[1320px] px-5 py-16 lg:px-8 lg:py-24">
              <div className="grid gap-8 lg:grid-cols-12 lg:items-end lg:gap-12">
                <div className="lg:col-span-6">
                  <Reveal>
                    <div className="mono-label">01 — Play first, sign up later</div>
                    <h2 className="mt-4 font-display text-4xl leading-[0.98] tracking-[-0.02em] sm:text-5xl lg:text-[3.3rem]">
                      Type a domain.
                      <br />
                      <em className="italic text-accent">Watch it think.</em>
                    </h2>
                  </Reveal>
                </div>
                <div className="lg:col-span-6">
                  <Reveal delay={0.06}>
                    <p className="max-w-lg text-sm leading-relaxed text-muted">
                      This is a deterministic preview running in your browser — the same stage names, the same
                      severity language and the same fix format the worker produces. It requires no account
                      and stores nothing. When you are ready for measured data, the button inside hands you
                      over to the real crawl.
                    </p>
                  </Reveal>
                </div>
              </div>

              <Reveal delay={0.08} className="mt-10">
                <div className="relative">
                  <div
                    aria-hidden
                    className="absolute -top-3 left-4 z-20 hidden rotate-[-3deg] rounded-full border border-accent/40 bg-canvas px-3 py-1 font-mono text-[0.5rem] uppercase tracking-[0.18em] text-accent shadow-lg sm:block"
                  >
                    live preview · no signup
                  </div>
                  <AuditPlayground />
                </div>
              </Reveal>
            </div>
          </section>

          {/* ── Workspace ────────────────────────────────────────────────── */}
          <section id="platform" className="relative border-b border-line/60">
            <div className="mx-auto w-full max-w-[1320px] px-5 py-20 lg:px-8 lg:py-28">
              <div className="mb-10 grid gap-6 lg:grid-cols-12 lg:items-end">
                <div className="lg:col-span-7">
                  <Reveal>
                    <div className="mono-label">02 — The workspace</div>
                    <h2 className="mt-4 max-w-2xl font-display text-4xl leading-[0.98] tracking-[-0.02em] sm:text-5xl lg:text-[3.6rem]">
                      The audit is the product.{' '}
                      <em className="italic text-accent">Not a summary of one.</em>
                    </h2>
                  </Reveal>
                </div>
                <div className="lg:col-span-5">
                  <Reveal delay={0.05}>
                    <p className="max-w-md text-sm leading-relaxed text-muted">
                      Score, severity, measured evidence and the exact verification step — on one screen,
                      generated from the stored audit rather than a marketing mock-up. Everything below is
                      rendered by the same components the admin portal uses.
                    </p>
                  </Reveal>
                </div>
              </div>

              <InView threshold={0.1}>
                <TiltFrame max={1.4}>
                  <div className="relative overflow-hidden rounded-[26px] border border-line/70 bg-surface/60 shadow-lift">
                    <div
                      aria-hidden
                      className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/60 to-transparent"
                    />
                    <ProductConsole />
                  </div>
                </TiltFrame>
              </InView>

              <div className="mt-14 grid gap-x-10 border-t border-line/70 sm:grid-cols-2">
                {CAPABILITIES.map((item, index) => (
                  <Reveal key={item.title} delay={index * 0.04}>
                    <div className="group flex gap-4 border-b border-line/70 py-5">
                      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-line bg-canvas text-accent transition-all duration-300 group-hover:-rotate-6 group-hover:border-accent/50">
                        <item.icon className="h-4 w-4" aria-hidden />
                      </span>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-baseline gap-x-3">
                          <h3 className="text-sm font-semibold text-ink">{item.title}</h3>
                          <span className="font-mono text-[0.5rem] uppercase tracking-[0.16em] text-faint">
                            {item.fact}
                          </span>
                        </div>
                        <p className="mt-1.5 max-w-md text-xs leading-relaxed text-muted">{item.body}</p>
                      </div>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          </section>

          {/* ── The instrument ───────────────────────────────────────────── */}
          <section id="how" className="relative border-b border-line/60 bg-surface/25">
            <div className="mx-auto w-full max-w-[1320px] px-5 py-20 lg:px-8 lg:py-28">
              <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
                <div className="lg:col-span-5">
                  <Reveal>
                    <div className="mono-label">03 — Inside the instrument</div>
                    <h2 className="mt-4 font-display text-4xl leading-[1.0] tracking-[-0.02em] sm:text-5xl">
                      Signals first.
                      <br />
                      <em className="italic text-accent">Opinions never.</em>
                    </h2>
                    <p className="mt-5 max-w-md text-sm leading-relaxed text-muted">
                      Every finding is tied to something observed: a header, a tag, a measured threshold.
                      Move your cursor over the instrument — it registers the pointer, the same way the
                      crawler registers a page.
                    </p>
                    <ul className="mt-6 space-y-2.5">
                      {[
                        'Crawl rules before content',
                        'Vitals against published thresholds',
                        'Structured data and eligibility',
                        'Demand that already exists',
                      ].map((item) => (
                        <li key={item} className="flex items-center gap-2.5 text-xs text-muted">
                          <span className="flex h-4 w-4 items-center justify-center rounded-full border border-accent/40 bg-accent/10">
                            <Check className="h-2.5 w-2.5 text-accent" aria-hidden />
                          </span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </Reveal>
                </div>
                <div className="lg:col-span-7">
                  <Reveal delay={0.05}>
                    <TiltFrame max={2.2}>
                      <div className="relative overflow-hidden rounded-[26px] border border-line/70 bg-canvas/80">
                        <SignalObservatory className="relative aspect-[5/4] w-full" />
                        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-canvas to-transparent px-5 pb-4 pt-10 font-mono text-[0.5rem] uppercase tracking-[0.18em] text-faint">
                          <span>instrument 02 / live signals</span>
                          <span>pointer-reactive</span>
                        </div>
                      </div>
                    </TiltFrame>
                  </Reveal>
                </div>
              </div>

              <div className="mt-16">
                <Reveal>
                  <SignalAtlas />
                </Reveal>
              </div>
            </div>
          </section>

          {/* ── Pipeline ─────────────────────────────────────────────────── */}
          <section id="journey" data-companion="pipeline" className="relative border-b border-line/60">
            <div className="mx-auto w-full max-w-[1320px] px-5 pt-20 lg:hidden lg:px-8 lg:pt-28">
              <Reveal>
                <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <div className="mono-label">04 — The pipeline</div>
                    <h2 className="mt-4 max-w-xl font-display text-4xl leading-[1.0] tracking-[-0.02em] sm:text-5xl">
                      From a URL to a report, <em className="italic text-accent">verifiably.</em>
                    </h2>
                  </div>
                  <p className="max-w-xs text-xs leading-relaxed text-muted">
                    Scroll the job. Each stage writes an event, so the progress bar in the product is
                    database state — not a decorative animation.
                  </p>
                </div>
              </Reveal>
            </div>
            <SignalJourney />
          </section>

          {/* ── Reports ──────────────────────────────────────────────────── */}
          <section id="reports" data-companion="proof" className="paper-band relative border-b border-[#d9d2c2]">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-40 [background-image:linear-gradient(#c9c1b0_1px,transparent_1px),linear-gradient(90deg,#c9c1b0_1px,transparent_1px)] [background-size:72px_72px] [mask-image:radial-gradient(ellipse_at_70%_30%,black,transparent_75%)]"
            />
            <div className="relative mx-auto w-full max-w-[1320px] px-5 py-20 lg:px-8 lg:py-28">
              <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
                <div className="lg:col-span-5">
                  <Reveal>
                    <div className="mono-label text-[#5c665f]">05 — Client reporting</div>
                    <h2 className="mt-4 font-display text-[2.4rem] leading-[1.0] tracking-[-0.02em] text-[#141917] sm:text-[3rem]">
                      Reports a client can <em className="italic text-[#4d7c0f]">act on</em>.
                    </h2>
                    <p className="mt-5 max-w-md text-sm leading-relaxed text-[#4b554e]">
                      The PDF is generated from the stored audit — the same values the dashboard shows. Long
                      URLs wrap, recommendation cards avoid page breaks, and every page is numbered.
                    </p>

                    <dl className="mt-8 space-y-4 border-t border-[#c9c1b0] pt-6">
                      {[
                        ['Cover & score', 'Website, business context, audit id, date and the AI-assisted score.'],
                        ['Findings', 'Critical and important issues, quick wins and the full check register.'],
                        ['Recommendations', 'Finding, fix, impact, effort and the verification step for each.'],
                        ['Disclosure', 'Which integrations were mocked and whether analysis came from Claude.'],
                      ].map(([title, body]) => (
                        <div key={title} className="grid gap-1 sm:grid-cols-[9rem_1fr] sm:gap-4">
                          <dt className="text-xs font-semibold text-[#141917]">{title}</dt>
                          <dd className="text-xs leading-relaxed text-[#4b554e]">{body}</dd>
                        </div>
                      ))}
                    </dl>

                    <div className="mt-8 flex flex-wrap gap-3">
                      <Button asChild size="lg" className="rounded-full">
                        <Link href="/login">
                          Open a sample report <ArrowUpRight className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        asChild
                        variant="outline"
                        size="lg"
                        className="rounded-full border-[#bdb5a4] text-[#141917]"
                      >
                        <a href="#security">Read the disclosure</a>
                      </Button>
                    </div>
                  </Reveal>
                </div>

                <div className="lg:col-span-7">
                  <Reveal delay={0.05}>
                    <TiltFrame max={2}>
                      <ReportPreview />
                    </TiltFrame>
                  </Reveal>
                </div>
              </div>
            </div>
          </section>

          {/* ── Path to a paying client ──────────────────────────────────── */}
          <section id="plans" data-companion="convert" className="relative border-b border-line/60">
            <div className="mx-auto w-full max-w-[1320px] px-5 py-20 lg:px-8 lg:py-28">
              <Reveal>
                <div className="mb-10 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <div className="mono-label">06 — From curiosity to client</div>
                    <h2 className="mt-4 max-w-2xl font-display text-4xl leading-[1.0] tracking-[-0.02em] sm:text-5xl">
                      Three moves. <em className="italic text-accent">One habit.</em>
                    </h2>
                  </div>
                  <p className="max-w-xs text-xs leading-relaxed text-muted">
                    Each step turns a visitor into someone with a stored, comparable result — which is what
                    actually makes a retainer defensible.
                  </p>
                </div>
              </Reveal>

              <div className="grid gap-4 lg:grid-cols-3">
                {PATH.map((item, index) => (
                  <Reveal key={item.step} delay={index * 0.05}>
                    <div className="group relative flex h-full flex-col overflow-hidden rounded-[22px] border border-line/70 bg-surface/70 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-accent/40 hover:bg-surface">
                      <div
                        aria-hidden
                        className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-accent/[0.07] blur-2xl transition-opacity group-hover:opacity-100"
                      />
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[0.55rem] uppercase tracking-[0.2em] text-faint">
                          {item.step} / {item.kicker}
                        </span>
                        <item.icon className="h-4 w-4 text-accent/80 transition-transform duration-500 group-hover:rotate-12" aria-hidden />
                      </div>
                      <h3 className="mt-5 font-display text-2xl leading-tight text-ink">{item.title}</h3>
                      <p className="mt-2 flex-1 text-xs leading-relaxed text-muted">{item.body}</p>
                      <Link
                        href={item.cta.href}
                        className="mt-5 inline-flex items-center gap-1.5 text-xs font-medium text-ink transition-colors hover:text-accent"
                      >
                        {item.cta.label}
                        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" aria-hidden />
                      </Link>
                    </div>
                  </Reveal>
                ))}
              </div>

              <Reveal delay={0.08}>
                <div className="mt-6 flex flex-col items-start justify-between gap-4 rounded-[22px] border border-accent/25 bg-accent/[0.06] px-6 py-5 sm:flex-row sm:items-center">
                  <p className="max-w-xl text-xs leading-relaxed text-muted">
                    <span className="font-semibold text-ink">Already have a client list?</span> Attach a
                    client, add their site and the monthly schedule produces the next report without anyone
                    remembering to run it.
                  </p>
                  <Button asChild variant="outline" size="sm" className="shrink-0 rounded-full">
                    <Link href="/login">
                      Sign in to the workspace <ArrowUpRight className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </div>
              </Reveal>
            </div>
          </section>

          {/* ── Security ─────────────────────────────────────────────────── */}
          <section id="security" className="relative overflow-hidden border-b border-line/60 bg-surface/25">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 grid-lines opacity-[0.12] [mask-image:radial-gradient(ellipse_at_80%_20%,black,transparent_70%)]"
            />
            <div className="relative mx-auto w-full max-w-[1320px] px-5 py-20 lg:px-8 lg:py-24">
              <div className="grid gap-10 lg:grid-cols-12">
                <div className="lg:col-span-4">
                  <Reveal>
                    <div className="mono-label">07 — Security &amp; privacy</div>
                    <h2 className="mt-4 font-display text-[2.3rem] leading-[1.0] tracking-[-0.02em] sm:text-[2.8rem]">
                      Built to be audited, <em className="italic text-accent">not just trusted.</em>
                    </h2>
                    <p className="mt-5 max-w-sm text-sm leading-relaxed text-muted">
                      These are implementation facts from this build, not certifications. No compliance
                      standard is claimed and no security guarantee is made.
                    </p>
                    <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-line bg-canvas px-3 py-1.5 font-mono text-[0.5rem] uppercase tracking-[0.16em] text-faint">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="absolute inset-0 rounded-full bg-accent pulse-dot" />
                      </span>
                      session · httpOnly · sameSite lax
                    </div>
                  </Reveal>
                </div>
                <div className="lg:col-span-8">
                  <InView threshold={0.1}>
                    <div className="grid gap-x-10 border-t border-line sm:grid-cols-2">
                      {[
                        ...SECURITY,
                        {
                          icon: Braces,
                          title: 'Typed trust boundaries',
                          body: 'Every request body is validated with Zod on the server. AI output is schema-validated before storage — invalid output fails the audit.',
                        },
                        {
                          icon: Terminal,
                          title: 'Secrets stay server-side',
                          body: 'Database, Redis, Anthropic and notification credentials live in environment variables and are never bundled into client code.',
                        },
                      ].map((item, index) => (
                        <div
                          key={item.title}
                          className="rise group flex gap-4 border-b border-line py-5"
                          style={{ '--rise-delay': `${index * 70}ms` } as React.CSSProperties}
                        >
                          <item.icon className="mt-0.5 h-4 w-4 shrink-0 text-accent/80 transition-transform duration-500 group-hover:rotate-6" aria-hidden />
                          <div>
                            <h3 className="text-sm font-medium text-ink">{item.title}</h3>
                            <p className="mt-1.5 text-xs leading-relaxed text-muted">{item.body}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </InView>
                </div>
              </div>
            </div>
          </section>

          {/* ── Final CTA ────────────────────────────────────────────────── */}
          <section className="relative overflow-hidden border-b border-line/60">
            <div aria-hidden className="pointer-events-none absolute inset-0 gradient-bg opacity-40" />
            <div
              aria-hidden
              className="pointer-events-none absolute left-1/2 top-1/2 h-[42rem] w-[42rem] -translate-x-1/2 -translate-y-1/2"
            >
              <div className="orbit-slow absolute inset-0 rounded-full border border-accent/10" />
              <div className="orbit-reverse absolute inset-[12%] rounded-full border border-dashed border-line/40" />
              <div className="absolute inset-[30%] rounded-full border border-accent/10" />
            </div>

            <div className="relative mx-auto w-full max-w-[1320px] px-5 py-24 text-center lg:px-8 lg:py-32">
              <InView threshold={0.2}>
                <div className="mono-label text-sm">Ready when your next client is</div>
                <h2 className="mx-auto mt-5 max-w-3xl font-display text-[2.9rem] leading-[0.94] tracking-[-0.03em] sm:text-6xl lg:text-7xl">
                  Run the audit.
                  <br />
                  See the <em className="italic text-accent">signals.</em>
                </h2>
                <p className="mx-auto mt-6 max-w-lg text-sm leading-relaxed text-muted">
                  Start with a single-page technical audit, inspect the measured evidence, and deliver a
                  report with the fixes ordered by impact and effort.
                </p>
                <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
                  <Button asChild size="lg" className="group rounded-full px-7">
                    <Link href="/app/audits/new">
                      Run an SEO audit
                      <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="rounded-full px-7">
                    <Link href="/login">Sign in</Link>
                  </Button>
                </div>
                <p className="mt-8 font-mono text-[0.55rem] uppercase tracking-[0.2em] text-faint">
                  mock mode by default · live Claude opt-in · auth-gated reports
                </p>
              </InView>
            </div>
          </section>
        </main>

        <SiteFooter />
      </div>
    </div>
  )
}
