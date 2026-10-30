'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

const OBSERVATIONS = [
  { tag: 'LCP', text: '4.2 s on mobile — 1.7 s over the good threshold', tone: 'warn' },
  { tag: 'JSON-LD', text: 'no LocalBusiness block, so no rich result is eligible', tone: 'critical' },
  { tag: 'CHECKS', text: '26 evaluated — 9 failing, 10 warnings, 7 passing', tone: 'accent' },
  { tag: 'CANONICAL', text: 'self-reference resolves through a single 301 hop', tone: 'warn' },
  { tag: 'INP', text: '280 ms interaction latency on the primary CTA', tone: 'warn' },
  { tag: 'SITEMAP', text: 'declared in robots.txt and reachable over HTTPS', tone: 'accent' },
]

const TONE: Record<string, string> = {
  accent: 'text-accent',
  warn: 'text-warn',
  critical: 'text-critical',
}

/**
 * A small live readout beneath the hero CTAs. It cycles through fixture
 * observations with a scan transition; the values are the same deterministic
 * assessment fixtures used by the audit, and the pill says so.
 */
export function SignalTicker({ className }: { className?: string }) {
  const [index, setIndex] = useState(0)
  const [visible, setVisible] = useState(true)
  const paused = useRef(false)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const timer = window.setInterval(() => {
      if (paused.current) return
      setVisible(false)
      window.setTimeout(() => {
        setIndex((value) => (value + 1) % OBSERVATIONS.length)
        setVisible(true)
      }, 260)
    }, 3400)
    return () => window.clearInterval(timer)
  }, [])

  const item = OBSERVATIONS[index] ?? OBSERVATIONS[0]!

  return (
    <div
      className={cn(
        'group flex items-stretch gap-3 border border-line bg-surface/40 px-3 py-2',
        className,
      )}
      onMouseEnter={() => {
        paused.current = true
      }}
      onMouseLeave={() => {
        paused.current = false
      }}
    >
      <span className="flex items-center gap-1.5">
        <span className="relative inline-flex h-1.5 w-1.5">
          <span className="absolute inset-0 rounded-full bg-accent pulse-dot" />
        </span>
        <span className="font-mono text-[0.5rem] uppercase tracking-[0.18em] text-faint">live read</span>
      </span>
      <span className="h-auto w-px bg-line" aria-hidden />
      <div className="min-w-0 flex-1 overflow-hidden">
        <div
          className={cn(
            'flex items-baseline gap-2 transition-all duration-300',
            visible ? 'translate-y-0 opacity-100' : 'translate-y-1 opacity-0',
          )}
        >
          <span className={cn('shrink-0 font-mono text-[0.55rem] uppercase tracking-[0.14em]', TONE[item.tone])}>
            {item.tag}
          </span>
          <span className="truncate font-mono text-[0.58rem] text-muted">{item.text}</span>
        </div>
      </div>
      <span className="self-center border border-line px-1.5 py-0.5 font-mono text-[0.45rem] uppercase tracking-[0.14em] text-faint">
        sample
      </span>
      <span className="sr-only">
        Rotating sample observations from the deterministic audit fixture. All values are sample data.
      </span>
    </div>
  )
}
