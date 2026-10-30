'use client'

import { useState } from 'react'
import { ArrowRight, CircleDot } from 'lucide-react'
import { cn } from '@/lib/utils'

const STEPS = [
  {
    key: 'trigger',
    label: 'Trigger',
    title: 'An audit is requested',
    body: 'An administrator starts an audit from a website record, or the monthly schedule fires through a secret-protected cron endpoint. The audit row is written first, then the BullMQ job is submitted — never the other way round.',
    log: [
      'POST /api/audits { websiteId }',
      'audit.created  status=QUEUED',
      'queue.add("seo-audit-jobs", { auditId, attempt: 1 })',
    ],
    facts: ['Job id is stable per attempt', 'Duplicate window: 10 minutes', 'Failed queue writes are recorded, not hidden'],
  },
  {
    key: 'crawl',
    label: 'Crawl',
    title: 'The page is fetched and parsed',
    body: 'Node fetch + Cheerio collect the signals an audit can actually verify: status, title, meta, canonical, robots directives, headings, links, image alt coverage, Open Graph and JSON-LD.',
    log: [
      'GET https://example-dental-clinic.com · 200 · 1.4s',
      'cheerio: title, meta, canonical, h1, links, json-ld',
      'robots.txt · sitemap.xml · redirect chain validated',
    ],
    facts: ['Private IPs and metadata hosts blocked', 'Every redirect re-validated', '2 MB response ceiling'],
  },
  {
    key: 'measure',
    label: 'Measure',
    title: 'External signals are attached',
    body: 'PageSpeed, Search Console and rank data come through adapters with a single mock switch. In mock mode the deterministic assessment fixtures are used and labelled everywhere — dashboard, API and PDF.',
    log: [
      'pagespeed: performance 0.61 · LCP 4.2s · CLS 0.08',
      'search-console: 167 clicks · 4560 impressions · 3 errors',
      'dataforseo: "dental clinic pune" · position 4 · volume 1900',
    ],
    facts: ['USE_MOCKS is centralised in src/mocks/index.js', 'Missing live credentials raise explicit errors', 'Provenance is stored with the audit'],
  },
  {
    key: 'analyse',
    label: 'Analyse',
    title: 'Claude turns signals into priorities',
    body: 'A versioned prompt receives the measured signals plus 26 deterministic checks. The response must satisfy a strict schema — scores clamped to 0–100, five critical issues maximum, five quick wins of two hours or less, every fix with a falsifiability check.',
    log: [
      'POST /v1/messages · model claude-sonnet-4-6',
      'zod: audit_version v1.0 · overall_score 61 · 12 recommendations',
      'persisted: aiSource=CLAUDE · latency 7.4s',
    ],
    facts: ['One bounded repair attempt, then fail', 'Invalid JSON never becomes a “successful” audit', 'Mock analysis is labelled AI_USE_MOCKS'],
  },
  {
    key: 'report',
    label: 'Report',
    title: 'The report is rendered and delivered',
    body: 'Puppeteer prints the branded A4 report from the persisted result, page numbers are stamped, and WhatsApp plus email adapters record every delivery attempt. The PDF stays downloadable behind an authorization check.',
    log: [
      'puppeteer: report.pdf · 6 pages · A4',
      'notification: WHATSAPP · MOCKED · mock_sent_…',
      'notification: EMAIL · MOCKED · report link',
    ],
    facts: ['No hardcoded numbers in the PDF', 'Download requires an authenticated session', 'Delivery attempts are stored per channel'],
  },
] as const

export function AuditWalkthrough() {
  const [active, setActive] = useState(0)
  const step = STEPS[active] ?? STEPS[0]

  return (
    <div className="grid min-w-0 gap-8 lg:grid-cols-12 lg:gap-12">
      <div className="min-w-0 lg:col-span-4">
        <div className="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:gap-0 lg:overflow-visible">
          {STEPS.map((item, index) => (
            <button
              key={item.key}
              onClick={() => setActive(index)}
              aria-pressed={index === active}
              className={cn(
                'group flex min-w-[132px] items-center gap-3 border-line px-4 py-3 text-left transition-colors lg:min-w-0 lg:border-l-2 lg:px-4',
                index === active
                  ? 'border-accent bg-raised text-ink lg:border-l-accent'
                  : 'border-transparent text-muted hover:bg-raised/50 hover:text-ink',
              )}
            >
              <span className="font-mono text-[0.65rem] tabular-nums text-faint">
                {String(index + 1).padStart(2, '0')}
              </span>
              <span className="flex-1 text-xs font-medium">{item.label}</span>
              <CircleDot
                className={cn('h-3 w-3 transition-opacity', index === active ? 'text-accent opacity-100' : 'opacity-0')}
              />
            </button>
          ))}
        </div>
        <p className="mt-6 hidden text-2xs leading-relaxed text-faint lg:block">
          Each stage writes an audit event, so the exact progress is verifiable from the database — not an animation.
        </p>
      </div>

      <div className="min-w-0 lg:col-span-8">
        <div className="panel overflow-hidden">
          <div className="relative h-0.5 w-full bg-line/60">
            <div
              className="h-full bg-accent transition-[width] duration-500 ease-out"
              style={{ width: `${((active + 1) / STEPS.length) * 100}%` }}
            />
          </div>
          <div className="flex items-center justify-between border-b border-line px-5 py-3">
            <span className="mono-label">Stage {String(active + 1).padStart(2, '0')} · {step.label}</span>
            <span className="font-mono text-[0.6rem] uppercase tracking-[0.14em] text-faint">pipeline</span>
          </div>
          <div key={step.key} className="stage-visual px-5 py-6 sm:px-7">
            <h3 className="font-display text-2xl leading-tight sm:text-[1.75rem]">{step.title}</h3>
            <p className="mt-3 max-w-2xl text-xs leading-relaxed text-muted sm:text-[0.8rem]">{step.body}</p>

            <div className="mt-6 rounded-sm border border-line bg-canvas p-4">
              <div className="mb-3 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-critical/60" />
                <span className="h-1.5 w-1.5 rounded-full bg-warn/60" />
                <span className="h-1.5 w-1.5 rounded-full bg-accent/60" />
                <span className="ml-2 font-mono text-[0.58rem] uppercase tracking-[0.14em] text-faint">
                  worker log · illustrative
                </span>
              </div>
              <pre className="overflow-x-auto font-mono text-[0.68rem] leading-relaxed text-muted">
                {step.log.map((line, index) => (
                  <div
                    key={line}
                    className="stage-line whitespace-pre"
                    style={{ animationDelay: `${80 + index * 90}ms` }}
                  >
                    <span className="text-accent/70">›</span> {line}
                  </div>
                ))}
              </pre>
            </div>

            <ul className="mt-5 grid gap-2 sm:grid-cols-3">
              {step.facts.map((fact) => (
                <li key={fact} className="flex gap-2 border-t border-line pt-2.5 text-2xs leading-relaxed text-faint">
                  <ArrowRight className="mt-0.5 h-3 w-3 shrink-0 text-accent/60" />
                  {fact}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
