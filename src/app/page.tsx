import Link from 'next/link'
import {
  ArrowRight,
  Braces,
  CalendarClock,
  ChartNoAxesColumn,
  FileText,
  Gauge,
  KeyRound,
  Link2,
  ScanLine,
  ShieldCheck,
  Terminal,
  Waypoints,
} from 'lucide-react'
import { SiteHeader } from '@/components/marketing/site-header'
import { SiteFooter } from '@/components/marketing/site-footer'
import { SignalObservatory } from '@/components/marketing/signal-observatory'
import { AuditWalkthrough } from '@/components/marketing/audit-walkthrough'
import { ReportPreview } from '@/components/marketing/report-preview'
import { Reveal } from '@/components/marketing/reveal'
import { Button } from '@/components/ui/button'
import { Badge, StatusPill } from '@/components/ui/badge'
import { ScoreBreakdown, ScoreRing } from '@/components/ui/score'
import { getCurrentUser } from '@/lib/auth'

const SAMPLE_BREAKDOWN = {
  technical: 68,
  on_page: 82,
  content: 75,
  core_web_vitals: 60,
  schema: 80,
}

const SIGNALS = [
  'Crawl',
  'HTTP status',
  'Titles',
  'Meta',
  'Canonical',
  'Robots',
  'Sitemap',
  'JSON-LD',
  'LCP',
  'CLS',
  'INP',
  'Search Console',
  'SERP position',
  'AI analysis',
  'PDF report',
]

const FEATURES = [
  {
    icon: ScanLine,
    title: 'Technical SEO checks',
    body: 'Fetch and Cheerio extract the signals that decide indexability — status, canonical, robots directives, heading structure, internal links and image alt coverage — plus robots.txt and sitemap validation.',
    fact: '26 deterministic checks per audit',
  },
  {
    icon: Gauge,
    title: 'Performance analysis',
    body: 'Core Web Vitals and lab performance are evaluated against published thresholds, with render-blocking resources and unused JavaScript attributed to specific fixes.',
    fact: 'LCP · CLS · INP thresholds',
  },
  {
    icon: ChartNoAxesColumn,
    title: 'Search & keyword intelligence',
    body: 'Query-level clicks, impressions, CTR and position sit beside a SERP snapshot for the target keyword, so content work is aimed at demand that already exists.',
    fact: 'Query + SERP signals',
  },
  {
    icon: Braces,
    title: 'AI recommendations',
    body: 'Claude receives the measured signals and returns a schema-validated analysis: scored breakdown, critical issues, quick wins and prioritised fixes with effort and a verification step.',
    fact: 'Versioned JSON contract',
  },
  {
    icon: FileText,
    title: 'Client reporting',
    body: 'Puppeteer renders a branded A4 report from the persisted audit — cover, score breakdown, issues, recommendations, measured data and disclosure of sample sources.',
    fact: 'Download behind auth',
  },
  {
    icon: CalendarClock,
    title: 'Scheduled audits',
    body: 'Monthly schedules are claimed atomically by a secret-protected cron endpoint, so overlapping triggers cannot produce duplicate audits or duplicate reports.',
    fact: 'Idempotent cron claims',
  },
]

const WORKFLOW = [
  {
    step: '01',
    title: 'Start an audit',
    body: 'Choose a client website, confirm the business context, and queue the job. The audit record is created before the BullMQ job is submitted.',
    icon: Waypoints,
  },
  {
    step: '02',
    title: 'Collect signals',
    body: 'The worker crawls the page, reads robots.txt and the sitemap, then attaches performance, search and ranking signals through mock or live adapters.',
    icon: ScanLine,
  },
  {
    step: '03',
    title: 'Analyse',
    body: 'Deterministic checks and AI analysis are combined, validated against a strict schema, and persisted with provenance for every external source.',
    icon: Terminal,
  },
  {
    step: '04',
    title: 'Save & report',
    body: 'The result is stored, the PDF is generated from it, and delivery attempts are recorded for both WhatsApp and email.',
    icon: FileText,
  },
]

const SECURITY = [
  {
    icon: ShieldCheck,
    title: 'Crawler locked down',
    body: 'Only http(s), no embedded credentials, private/loopback/link-local/metadata addresses blocked, DNS answers checked, and every redirect re-validated before it is followed.',
  },
  {
    icon: KeyRound,
    title: 'Server-side authorization',
    body: 'Every route re-checks the signed session against the database. Client users are scoped by client ownership on the server, never by hiding navigation.',
  },
  {
    icon: Link2,
    title: 'Protected automation',
    body: 'Cron endpoints require a dedicated secret compared in constant time, and due schedules are claimed with a conditional update to prevent duplicates.',
  },
]

export default async function LandingPage() {
  const user = await getCurrentUser()

  return (
    <div className="bg-canvas">
      <SiteHeader signedIn={Boolean(user)} />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-line">
        <div className="pointer-events-none absolute inset-0 grid-lines opacity-[0.4] [mask-image:radial-gradient(ellipse_at_50%_0%,black,transparent_72%)]" />
        <div className="pointer-events-none absolute inset-0 bg-radial-accent opacity-60" />

        <div className="relative mx-auto w-full max-w-[1280px] px-5 pb-16 pt-14 lg:px-8 lg:pb-24 lg:pt-20">
          <div className="grid items-center gap-14 lg:grid-cols-12 lg:gap-10">
            <div className="lg:col-span-5">
              <Reveal>
                <div className="mb-6 flex items-center gap-3">
                  <span className="mono-label">Edgelink · SEO intelligence</span>
                  <span className="h-px flex-1 bg-line" />
                </div>
              </Reveal>

              <Reveal delay={0.05}>
                <h1 className="font-display text-[2.9rem] leading-[0.96] tracking-[-0.015em] sm:text-[3.8rem] lg:text-[4.1rem]">
                  Know what is
                  <br />
                  <em className="italic text-accent">holding</em> your
                  <br />
                  website back.
                </h1>
              </Reveal>

              <Reveal delay={0.1}>
                <p className="mt-6 max-w-md text-sm leading-relaxed text-muted">
                  Technical SEO intelligence, automated audits and actionable recommendations — one connected
                  workflow from crawl to a client-ready report. No ranking promises, just the signals that are
                  actually measurable.
                </p>
              </Reveal>

              <Reveal delay={0.15}>
                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <Button asChild size="lg">
                    <Link href="/app/audits/new">
                      Run an SEO audit <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild variant="secondary" size="lg">
                    <a href="#platform">Explore the platform</a>
                  </Button>
                </div>
              </Reveal>

              <Reveal delay={0.2}>
                <div className="mt-9 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-line pt-5 font-mono text-[0.6rem] uppercase tracking-[0.14em] text-faint">
                  <span>Fetch + Cheerio crawl</span>
                  <span className="text-line">/</span>
                  <span>Claude analysis</span>
                  <span className="text-line">/</span>
                  <span>Puppeteer reports</span>
                </div>
              </Reveal>
            </div>

            <div className="lg:col-span-7">
              <Reveal delay={0.1}>
                <div className="relative">
                  <div className="panel overflow-hidden">
                    <div className="pointer-events-none absolute inset-0 grid-lines opacity-40" />
                    <SignalObservatory className="relative aspect-[5/4] w-full" />
                  </div>

                  <div className="relative z-10 mx-3 -mt-10 rounded-md border border-line bg-surface/95 p-4 shadow-lift backdrop-blur sm:mx-6">
                    <div className="flex items-center justify-between gap-3">
                      <span className="mono-label">Audit result · sample</span>
                      <StatusPill status="COMPLETED" />
                    </div>
                    <div className="mt-4 flex items-center gap-5">
                      <ScoreRing score={61} size={92} stroke={6} />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                          <span className="text-xs text-ink">example-dental-clinic.com</span>
                          <span className="font-mono text-[0.6rem] text-faint">12 recommendations</span>
                        </div>
                        <ScoreBreakdown breakdown={SAMPLE_BREAKDOWN} className="mt-3 hidden sm:block" />
                        <p className="mt-2 text-[0.65rem] leading-relaxed text-faint sm:hidden">
                          Technical 68 · On-page 82 · CWV 60 · Schema 80
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* Signal ribbon */}
      <div className="overflow-hidden border-b border-line bg-surface/40">
        <div className="mx-auto flex w-full max-w-[1280px] flex-wrap items-center gap-x-5 gap-y-2 px-5 py-3.5 font-mono text-[0.58rem] uppercase tracking-[0.16em] text-faint lg:px-8">
          {SIGNALS.map((signal, index) => (
            <span key={signal} className="flex items-center gap-2">
              {index > 0 ? <span className="h-1 w-1 rounded-full bg-line" aria-hidden /> : null}
              {signal}
            </span>
          ))}
        </div>
      </div>

      {/* Platform / problem */}
      <section id="platform" className="border-b border-line">
        <div className="mx-auto w-full max-w-[1280px] px-5 py-20 lg:px-8 lg:py-28">
          <div className="grid gap-12 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <Reveal>
                <div className="mono-label">01 — The platform</div>
                <h2 className="mt-4 font-display text-[2.2rem] leading-[1.02] tracking-[-0.01em] sm:text-[2.8rem]">
                  Most SEO problems are
                  <em className="italic text-accent"> invisible</em> from the outside.
                </h2>
                <p className="mt-5 max-w-sm text-sm leading-relaxed text-muted">
                  EdgeLink reads the same surface a search engine does, then explains what is missing, what it
                  costs you, and what to do first. Every finding is tied to an observed signal.
                </p>
              </Reveal>
            </div>

            <div className="lg:col-span-8">
              <Reveal delay={0.05}>
                <div className="divide-y divide-line border-y border-line">
                  {[
                    {
                      n: '01',
                      title: 'Crawlability and indexability',
                      body: 'A page can be fast, beautiful and completely uncrawlable. We check status codes, canonical targets, robots directives, sitemap declarations and redirect chains before talking about content.',
                      tags: ['robots.txt', 'sitemap.xml', 'canonical', 'noindex'],
                    },
                    {
                      n: '02',
                      title: 'Performance that users feel',
                      body: 'Lab performance is not an opinion. Largest Contentful Paint, layout shift and interaction latency are compared to the published thresholds, then attributed to render-blocking and unused script weight.',
                      tags: ['LCP 4.2s', 'CLS 0.08', 'INP 280ms'],
                    },
                    {
                      n: '03',
                      title: 'Structure that search engines read',
                      body: 'Heading order, metadata, internal links and JSON-LD decide how confidently a page can be understood. Local businesses without LocalBusiness markup lose rich-result eligibility entirely.',
                      tags: ['H1', 'meta description', 'JSON-LD', 'LocalBusiness'],
                    },
                  ].map((row) => (
                    <div key={row.n} className="grid gap-4 py-7 sm:grid-cols-[3rem_1fr] sm:gap-6">
                      <span className="font-mono text-[0.65rem] text-faint">{row.n}</span>
                      <div>
                        <h3 className="text-base font-medium tracking-[-0.01em] text-ink">{row.title}</h3>
                        <p className="mt-2 max-w-2xl text-xs leading-relaxed text-muted sm:text-[0.8rem]">{row.body}</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {row.tags.map((tag) => (
                            <Badge key={tag} tone="outline" mono>
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* Walkthrough */}
      <section id="workflow" className="border-b border-line bg-surface/25">
        <div className="mx-auto w-full max-w-[1280px] px-5 py-20 lg:px-8 lg:py-28">
          <Reveal>
            <div className="mb-12 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="mono-label">02 — Inside the pipeline</div>
                <h2 className="mt-4 max-w-xl font-display text-[2.2rem] leading-[1.04] tracking-[-0.01em] sm:text-[2.8rem]">
                  From a URL to a report, <em className="italic text-accent">verifiably</em>.
                </h2>
              </div>
              <p className="max-w-xs text-xs leading-relaxed text-muted">
                Every stage writes an audit event. Progress in the product is the database state of the job, not a
                decorative animation.
              </p>
            </div>
          </Reveal>
          <Reveal delay={0.05}>
            <AuditWalkthrough />
          </Reveal>
        </div>
      </section>

      {/* Features */}
      <section className="border-b border-line">
        <div className="mx-auto w-full max-w-[1280px] px-5 py-20 lg:px-8 lg:py-28">
          <Reveal>
            <div className="mb-10 max-w-2xl">
              <div className="mono-label">03 — What you get</div>
              <h2 className="mt-4 font-display text-[2.2rem] leading-[1.04] tracking-[-0.01em] sm:text-[2.8rem]">
                A research department, not a dashboard theme.
              </h2>
            </div>
          </Reveal>

          <Reveal delay={0.05}>
            <div className="grid gap-px overflow-hidden rounded-md border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((feature) => (
                <div key={feature.title} className="bg-canvas p-6">
                  <feature.icon className="h-4 w-4 text-accent" aria-hidden />
                  <h3 className="mt-4 text-sm font-medium text-ink">{feature.title}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-muted">{feature.body}</p>
                  <div className="mt-4 border-t border-line pt-3 font-mono text-[0.58rem] uppercase tracking-[0.14em] text-faint">
                    {feature.fact}
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* Reports */}
      <section id="reports" className="border-b border-line bg-surface/25">
        <div className="mx-auto w-full max-w-[1280px] px-5 py-20 lg:px-8 lg:py-28">
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-5">
              <Reveal>
                <div className="mono-label">04 — Client reporting</div>
                <h2 className="mt-4 font-display text-[2.2rem] leading-[1.04] tracking-[-0.01em] sm:text-[2.8rem]">
                  Reports a client can <em className="italic text-accent">act on</em>.
                </h2>
                <p className="mt-5 max-w-md text-sm leading-relaxed text-muted">
                  The PDF is generated from the stored audit — the same values the dashboard shows. Long URLs wrap,
                  recommendation cards avoid page breaks, and every page is numbered.
                </p>

                <dl className="mt-8 space-y-4 border-t border-line pt-6">
                  {[
                    ['Cover & score', 'Website, business context, audit id, date and the AI-assisted score.'],
                    ['Findings', 'Critical and important issues, quick wins under two hours, and a full check register.'],
                    ['Recommendations', 'Finding, fix, impact, effort and the exact verification step for each.'],
                    ['Disclosure', 'Which integrations were mocked, and whether analysis came from Claude or the fixture.'],
                  ].map(([title, body]) => (
                    <div key={title} className="grid gap-1 sm:grid-cols-[9rem_1fr] sm:gap-4">
                      <dt className="text-xs font-medium text-ink">{title}</dt>
                      <dd className="text-xs leading-relaxed text-muted">{body}</dd>
                    </div>
                  ))}
                </dl>

                <p className="mt-8 max-w-md border-l border-accent/40 pl-4 text-2xs leading-relaxed text-faint">
                  Methodology: the headline score is an AI-assisted technical assessment weighted across five
                  categories. It is not a Google ranking metric, and no ranking or revenue outcome is guaranteed.
                </p>
              </Reveal>
            </div>

            <div className="lg:col-span-7">
              <Reveal delay={0.05}>
                <ReportPreview />
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* Workflow steps */}
      <section className="border-b border-line">
        <div className="mx-auto w-full max-w-[1280px] px-5 py-20 lg:px-8 lg:py-24">
          <Reveal>
            <div className="mb-10 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="mono-label">05 — Operating rhythm</div>
                <h2 className="mt-4 font-display text-[2.2rem] leading-[1.04] tracking-[-0.01em] sm:text-[2.6rem]">
                  Four steps, every month.
                </h2>
              </div>
              <Button asChild variant="secondary" size="sm">
                <Link href="/app/schedules">Configure a schedule</Link>
              </Button>
            </div>
          </Reveal>

          <div className="grid gap-px overflow-hidden rounded-md border border-line bg-line md:grid-cols-4">
            {WORKFLOW.map((item, index) => (
              <div key={item.step} className="relative bg-canvas p-6">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[0.6rem] uppercase tracking-[0.18em] text-faint">{item.step}</span>
                  <item.icon className="h-3.5 w-3.5 text-accent/80" aria-hidden />
                </div>
                <h3 className="mt-5 text-sm font-medium text-ink">{item.title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-muted">{item.body}</p>
                {index < WORKFLOW.length - 1 ? (
                  <ArrowRight className="absolute -right-2 top-1/2 hidden h-3.5 w-3.5 -translate-y-1/2 text-line md:block" aria-hidden />
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security */}
      <section id="security" className="border-b border-line bg-surface/25">
        <div className="mx-auto w-full max-w-[1280px] px-5 py-20 lg:px-8 lg:py-28">
          <div className="grid gap-12 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <Reveal>
                <div className="mono-label">06 — Security &amp; privacy</div>
                <h2 className="mt-4 font-display text-[2.2rem] leading-[1.04] tracking-[-0.01em] sm:text-[2.6rem]">
                  Built to be audited, not just trusted.
                </h2>
                <p className="mt-5 max-w-sm text-sm leading-relaxed text-muted">
                  These are implementation facts from this build, not certifications. No compliance standard is
                  claimed and no security guarantee is made.
                </p>
              </Reveal>
            </div>
            <div className="lg:col-span-8">
              <div className="grid gap-px overflow-hidden rounded-md border border-line bg-line sm:grid-cols-2">
                {SECURITY.map((item) => (
                  <div key={item.title} className="bg-canvas p-6">
                    <item.icon className="h-4 w-4 text-accent" aria-hidden />
                    <h3 className="mt-4 text-sm font-medium text-ink">{item.title}</h3>
                    <p className="mt-2 text-xs leading-relaxed text-muted">{item.body}</p>
                  </div>
                ))}
                <div className="bg-canvas p-6">
                  <Braces className="h-4 w-4 text-accent" aria-hidden />
                  <h3 className="mt-4 text-sm font-medium text-ink">Typed trust boundaries</h3>
                  <p className="mt-2 text-xs leading-relaxed text-muted">
                    Every request body is validated with Zod on the server. AI responses are validated against a
                    versioned schema before storage — invalid output fails the audit instead of being published.
                  </p>
                </div>
                <div className="bg-canvas p-6">
                  <Terminal className="h-4 w-4 text-accent" aria-hidden />
                  <h3 className="mt-4 text-sm font-medium text-ink">Secrets stay server-side</h3>
                  <p className="mt-2 text-xs leading-relaxed text-muted">
                    Database, Redis, Anthropic and notification credentials live in environment variables and are
                    never bundled into client code. Sessions are signed, HttpOnly cookies.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative overflow-hidden border-b border-line">
        <div className="pointer-events-none absolute inset-0 bg-radial-accent opacity-70" />
        <div className="pointer-events-none absolute inset-0 grid-lines opacity-20 [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />
        <div className="relative mx-auto w-full max-w-[1280px] px-5 py-24 text-center lg:px-8 lg:py-32">
          <Reveal>
            <div className="mono-label">Ready when your next client is</div>
            <h2 className="mx-auto mt-5 max-w-2xl font-display text-[2.6rem] leading-[1] tracking-[-0.015em] sm:text-[3.6rem]">
              Run the audit. See the <em className="italic text-accent">signals</em>.
            </h2>
            <p className="mx-auto mt-5 max-w-lg text-sm leading-relaxed text-muted">
              Start with a single-page technical audit, inspect the measured evidence, and deliver a report with the
              fixes ordered by impact and effort.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button asChild size="lg">
                <Link href="/app/audits/new">
                  Run an SEO audit <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="secondary" size="lg">
                <Link href="/login">Sign in to the workspace</Link>
              </Button>
            </div>
            <p className="mt-6 font-mono text-[0.58rem] uppercase tracking-[0.16em] text-faint">
              Runs in mock mode by default · live Claude opt-in
            </p>
          </Reveal>
        </div>
      </section>

      <SiteFooter />
    </div>
  )
}
