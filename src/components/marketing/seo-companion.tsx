'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import gsap from 'gsap'
import { ArrowUpRight, ChevronUp, Radio, ScanLine, X } from 'lucide-react'

/**
 * SEO COMPANION
 *
 * A small signal probe that follows the reader down the page. It reads the
 * section currently under the viewport, updates its label, fills a progress
 * ring, leans toward the cursor and can be opened for guidance plus a route
 * into the real product.
 *
 * Everything is decorative-but-usable: the trigger is a real button, the panel
 * is described, Escape closes it, and reduced-motion removes the idle motion
 * while keeping every function.
 */

type BeatId = 'hero' | 'audit' | 'pipeline' | 'proof' | 'convert'

type Beat = {
  id: BeatId
  index: string
  title: string
  body: string
  href: string
  cta: string
}

const BEATS: Record<BeatId, Beat> = {
  hero: {
    id: 'hero',
    index: '01',
    title: 'Eight signals, one page',
    body: 'Scroll and watch the fragments find their place. They are the same checks the worker runs on a real crawl.',
    href: '#audit',
    cta: 'Skip to the instrument',
  },
  audit: {
    id: 'audit',
    index: '02',
    title: 'Play before you sign up',
    body: 'Type a domain into the instant audit. It resolves, reads, structures and scores in about two seconds — no account.',
    href: '#audit',
    cta: 'Run the preview',
  },
  pipeline: {
    id: 'pipeline',
    index: '03',
    title: 'This is the real pipeline',
    body: 'The same stages run in the worker: crawl, 26 checks, vitals, schema, then Claude returns validated JSON.',
    href: '/app/audits/new',
    cta: 'Start a full audit',
  },
  proof: {
    id: 'proof',
    index: '04',
    title: 'Every audit becomes a report',
    body: 'Results are stored in Postgres, rendered to A4, and delivered with a recorded attempt per channel.',
    href: '#reports',
    cta: 'See the report',
  },
  convert: {
    id: 'convert',
    index: '05',
    title: 'From curiosity to client',
    body: 'Attach a client, schedule the audit monthly, and each cycle produces a fresh report on its own.',
    href: '/signin',
    cta: 'Open the workspace',
  },
}

const ORDER: readonly BeatId[] = ['hero', 'audit', 'pipeline', 'proof', 'convert']

export function SeoCompanion() {
  const [active, setActive] = useState<BeatId>('hero')
  const [progress, setProgress] = useState(0)
  const [open, setOpen] = useState(false)
  const probeRef = useRef<HTMLDivElement>(null)
  const ringRef = useRef<SVGCircleElement>(null)
  const leanX = useRef<((value: number) => void) | null>(null)
  const leanY = useRef<((value: number) => void) | null>(null)

  const close = useCallback(() => setOpen(false), [])

  useEffect(() => {
    const root = document.documentElement
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (!reduced && probeRef.current) {
      gsap.from(probeRef.current, {
        y: 90,
        opacity: 0,
        duration: 1.1,
        delay: 1.4,
        ease: 'expo.out',
      })
      const inner = probeRef.current.querySelector('[data-probe-float]')
      if (inner) {
        gsap.to(inner, {
          y: -5,
          duration: 2.8,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
        })
      }
      leanX.current = gsap.quickTo(probeRef.current, 'x', { duration: 0.8, ease: 'power3.out' })
      leanY.current = gsap.quickTo(probeRef.current, 'y', { duration: 0.8, ease: 'power3.out' })
    }

    let frame = 0
    const read = () => {
      frame = 0
      const scrollable = root.scrollHeight - window.innerHeight
      const ratio = scrollable > 0 ? Math.min(1, Math.max(0, window.scrollY / scrollable)) : 0
      setProgress(ratio)

      if (ringRef.current) {
        const length = 2 * Math.PI * 26
        ringRef.current.style.strokeDashoffset = String(length * (1 - ratio))
      }

      const middle = window.innerHeight * 0.42
      let found: BeatId = 'hero'
      for (const id of ORDER) {
        const element = document.querySelector<HTMLElement>(`[data-companion="${id}"]`)
        if (!element) continue
        const rect = element.getBoundingClientRect()
        if (rect.top <= middle) found = id
      }
      setActive(found)
    }

    const onScroll = () => {
      if (frame) return
      frame = window.requestAnimationFrame(read)
    }

    read()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)

    const onPointer = (event: PointerEvent) => {
      if (!leanX.current || !leanY.current || !probeRef.current) return
      const rect = probeRef.current.getBoundingClientRect()
      const dx = event.clientX - (rect.left + rect.width / 2)
      const dy = event.clientY - (rect.top + rect.height / 2)
      const distance = Math.hypot(dx, dy)
      if (distance > 320) {
        leanX.current(0)
        leanY.current(0)
        return
      }
      leanX.current((dx / 320) * 26)
      leanY.current((dy / 320) * 18)
    }
    if (window.matchMedia('(pointer: fine)').matches) {
      window.addEventListener('pointermove', onPointer)
    }

    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('pointermove', onPointer)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [])

  const beat = BEATS[active]

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-end px-4 pb-4 sm:px-6 sm:pb-6">
      <div className="pointer-events-auto flex flex-col items-end gap-2.5">
        {open && (
          <div
            id="seo-companion-panel"
            className="companion-panel w-[min(20rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-line bg-surface/95 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.85)] backdrop-blur-xl"
          >
            <div className="flex items-start justify-between gap-3 border-b border-line/70 px-4 py-3">
              <div className="flex items-center gap-2">
                <ScanLine className="h-3.5 w-3.5 text-accent" />
                <span className="font-mono text-[0.55rem] uppercase tracking-[0.2em] text-faint">
                  signal {beat.index} / 05
                </span>
              </div>
              <button
                type="button"
                onClick={close}
                aria-label="Close guide"
                className="-mr-1 rounded-full p-1 text-faint transition hover:bg-raised hover:text-ink"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="px-4 py-4">
              <h3 className="font-display text-[1.35rem] leading-tight text-ink">{beat.title}</h3>
              <p className="mt-2 text-[0.82rem] leading-relaxed text-muted">{beat.body}</p>
              <Link
                href={beat.href}
                onClick={close}
                className="group mt-4 flex items-center justify-between rounded-lg border border-line bg-canvas px-3 py-2 text-[0.75rem] font-medium text-ink transition hover:border-accent/50 hover:bg-accent/10"
              >
                {beat.cta}
                <ArrowUpRight className="h-3.5 w-3.5 text-accent transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </Link>
              <div className="mt-3 flex items-center gap-1.5">
                {ORDER.map((id) => (
                  <span
                    key={id}
                    className={`h-[2px] flex-1 rounded-full transition-colors duration-500 ${
                      ORDER.indexOf(id) <= ORDER.indexOf(active) ? 'bg-accent/80' : 'bg-line'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        <div ref={probeRef} className="will-change-transform">
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-controls="seo-companion-panel"
            aria-label={`SEO guide, step ${beat.index} of 5: ${beat.title}`}
            className="group relative flex h-[4.25rem] w-[4.25rem] items-center justify-center rounded-full border border-line/80 bg-canvas/95 shadow-[0_18px_50px_-18px_rgba(0,0,0,0.9)] backdrop-blur-xl transition hover:border-accent/60 sm:h-[4.75rem] sm:w-[4.75rem]"
          >
            <span className="absolute inset-0 rounded-full bg-accent/0 transition group-hover:bg-accent/[0.07]" />
            <span
              className="absolute inset-0 rounded-full border border-accent/25"
              style={{ animation: 'probe-ping 4.5s ease-out infinite' }}
            />
            <svg viewBox="0 0 64 64" className="absolute inset-0 h-full w-full -rotate-90">
              <circle cx="32" cy="32" r="26" fill="none" stroke="hsl(var(--line))" strokeWidth="1" />
              <circle
                ref={ringRef}
                cx="32"
                cy="32"
                r="26"
                fill="none"
                stroke="hsl(var(--accent))"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 26}
                strokeDashoffset={2 * Math.PI * 26}
                className="transition-[stroke-dashoffset] duration-150 ease-out"
              />
            </svg>
            <span data-probe-float className="relative flex flex-col items-center">
              <span className="font-mono text-[0.42rem] uppercase tracking-[0.16em] text-faint">
                step
              </span>
              <span className="font-display text-lg leading-none text-ink">{beat.index}</span>
              <span className="mt-0.5 flex items-center gap-1 font-mono text-[0.36rem] uppercase tracking-[0.12em] text-accent">
                <Radio className="h-2 w-2" />
                {Math.round(progress * 100)}%
              </span>
            </span>
            <span className="absolute -left-1 top-1/2 hidden -translate-y-1/2 items-center rounded-full border border-line bg-surface px-2 py-0.5 font-mono text-[0.42rem] uppercase tracking-[0.14em] text-muted opacity-0 transition group-hover:opacity-100 md:flex">
              {open ? 'close' : 'guide'}
            </span>
          </button>
          {open && (
            <button
              type="button"
              onClick={close}
              aria-label="Close guide"
              className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border border-line bg-canvas text-faint"
            >
              <ChevronUp className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
