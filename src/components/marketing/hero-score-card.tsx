'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowUpRight, Gauge, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TiltFrame } from '@/components/marketing/tilt-frame'

const BREAKDOWN = [
  { label: 'Technical', value: 68, color: 'hsl(var(--critical))' },
  { label: 'On-page', value: 82, color: 'hsl(var(--warn))' },
  { label: 'Core Web Vitals', value: 60, color: 'hsl(var(--critical))' },
  { label: 'Schema', value: 80, color: 'hsl(var(--success))' },
]

/**
 * The hero result card. The ring, the score and the category bars animate from
 * zero on mount; under reduced motion they render at their final values.
 * Every number is the deterministic sample fixture (score 61), labelled below.
 */
export function HeroScoreCard() {
  const [score, setScore] = useState(0)
  const [armed, setArmed] = useState(false)
  const rafRef = useRef(0)

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) {
      setScore(61)
      setArmed(true)
      return
    }
    setArmed(true)
    const start = performance.now()
    const duration = 1500
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - progress, 3)
      setScore(Math.round(eased * 61))
      if (progress < 1) rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  const size = 96
  const stroke = 5
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius

  // Calculate color based on score
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'hsl(var(--success))'
    if (score >= 70) return 'hsl(var(--warn))'
    return 'hsl(var(--critical))'
  }

  return (
    <TiltFrame className="group relative border-0 bg-gradient-to-br from-surface via-surface to-surface/80 p-[1px] backdrop-blur-sm">
      <div className="relative h-full border border-line/50 bg-surface/95 p-4 shadow-lg transition-all duration-300 group-hover:shadow-xl group-hover:-translate-y-1">
        {/* Glow effect on hover */}
        <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-accent/10 to-success/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        <div className="relative flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="mono-label text-accent">Audit result · sample</span>
            <div className="flex items-center gap-1.5 rounded-full border border-accent/20 bg-accent/10 px-2 py-0.5 font-mono text-[0.44rem] uppercase tracking-wider text-accent">
              <span className="relative inline-flex h-1 w-1">
                <span className="absolute inset-0 rounded-full bg-accent animate-pulse" />
              </span>
              complete
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-5">
          <div className="relative shrink-0" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="-rotate-90">
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="hsl(var(--line)/0.6)"
                strokeWidth={stroke}
              />
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={getScoreColor(score)}
                strokeWidth={stroke}
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={armed ? circumference * (1 - score / 100) : circumference}
                style={{
                  transition: 'stroke-dashoffset 120ms linear, stroke 300ms ease-in-out',
                  filter: armed ? 'drop-shadow(0 0 8px hsla(var(--accent)/0.5))' : 'none'
                }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-display text-2xl leading-none tabular-nums tracking-[-0.02em] {score >= 80 ? 'text-success' : score >= 70 ? 'text-warn' : 'text-critical'}">{score}</span>
              <span className="mt-1 font-mono text-[0.48rem] uppercase tracking-[0.16em] text-muted">/ 100</span>
            </div>
          </div>

          <div className="min-w-0 flex-1 space-y-3">
            <div className="truncate font-mono text-[0.7rem] font-medium text-ink group-hover:text-accent transition-colors">
              example-dental-clinic.com
            </div>
            <div className="flex items-center gap-2 font-mono text-[0.48rem] uppercase tracking-wider text-muted">
              <span className="flex items-center gap-1">
                <Gauge className="h-3 w-3 text-accent/70" />
                12 fixes
              </span>
              <span className="text-muted/40">·</span>
              <span className="flex items-center gap-1">
                <FileText className="h-3 w-3 text-accent/70" />
                6 pages
              </span>
            </div>

            <div className="mt-2 space-y-1.5">
              {BREAKDOWN.map((row, index) => (
                <div key={row.label} className="grid grid-cols-[5.4rem_1fr_1.4rem] items-center gap-2">
                  <span className="text-[0.5rem] font-medium text-muted">{row.label}</span>
                  <div className="h-1 w-full overflow-hidden rounded-full bg-line/60">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all duration-1000 ease-out',
                        row.value >= 80
                          ? 'bg-gradient-to-r from-success to-accent shadow-sm'
                          : row.value >= 70
                          ? 'bg-gradient-to-r from-warn to-warning shadow-sm'
                          : 'bg-gradient-to-r from-critical to-danger shadow-sm'
                      )}
                      style={{
                        width: armed ? `${row.value}%` : '0%',
                        transitionDelay: armed ? `${240 + index * 90}ms` : '0ms',
                      }}
                    />
                  </div>
                  <span className="text-right font-mono text-[0.48rem] tabular-nums font-semibold text-muted">{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-line/50 pt-3">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[0.44rem] uppercase tracking-wider text-muted">
              mock integrations · ai fixture
            </span>
          </div>
          <a
            href="#interface"
            className="group inline-flex items-center gap-1.5 font-mono text-[0.45rem] uppercase tracking-wider text-accent transition-all duration-200 hover:gap-2"
          >
            inspect <ArrowUpRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
          </a>
        </div>
      </div>
    </TiltFrame>
  )
}
