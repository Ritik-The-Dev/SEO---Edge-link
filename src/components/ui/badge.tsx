import * as React from 'react'
import { cn, scoreTone, AUDIT_STATUS_LABEL } from '@/lib/utils'

type Tone = 'neutral' | 'accent' | 'warn' | 'critical' | 'info' | 'outline'

const toneClass: Record<Tone, string> = {
  neutral: 'border-line bg-raised text-muted',
  accent: 'border-accent/30 bg-accent-soft text-accent',
  warn: 'border-warn/30 bg-warn/10 text-warn',
  critical: 'border-critical/30 bg-critical/10 text-critical',
  info: 'border-info/30 bg-info/10 text-info',
  outline: 'border-line bg-transparent text-muted',
}

export function Badge({
  children,
  tone = 'neutral',
  className,
  mono,
}: {
  children: React.ReactNode
  tone?: Tone
  className?: string
  mono?: boolean
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-[3px] border px-2 py-0.5 text-2xs font-medium uppercase tracking-[0.1em]',
        toneClass[tone],
        mono && 'font-mono',
        className,
      )}
    >
      {children}
    </span>
  )
}

const statusTone: Record<string, Tone> = {
  QUEUED: 'neutral',
  RUNNING: 'info',
  COMPLETED: 'accent',
  FAILED: 'critical',
  CANCELLED: 'warn',
}

const statusDot: Record<string, string> = {
  QUEUED: 'bg-faint',
  RUNNING: 'bg-info animate-pulse',
  COMPLETED: 'bg-accent',
  FAILED: 'bg-critical',
  CANCELLED: 'bg-warn',
}

export function StatusPill({ status, className }: { status: string; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-[3px] border px-2 py-0.5 font-mono text-2xs uppercase tracking-[0.1em]',
        toneClass[statusTone[status] ?? 'neutral'],
        className,
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', statusDot[status] ?? 'bg-faint')} aria-hidden />
      {AUDIT_STATUS_LABEL[status] ?? status}
    </span>
  )
}

export function ScorePill({
  score,
  size = 'md',
  className,
}: {
  score: number | null | undefined
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  const tone = scoreTone(score)
  const toneClasses =
    tone === 'good'
      ? 'text-accent border-accent/30 bg-accent-soft'
      : tone === 'fair'
        ? 'text-warn border-warn/30 bg-warn/10'
        : tone === 'poor'
          ? 'text-critical border-critical/30 bg-critical/10'
          : 'text-faint border-line bg-raised'

  return (
    <span
      className={cn(
        'inline-flex items-baseline gap-1 rounded-[3px] border font-mono tabular-nums',
        size === 'sm' ? 'px-1.5 py-0.5 text-xs' : size === 'lg' ? 'px-3 py-1 text-xl' : 'px-2 py-0.5 text-sm',
        toneClasses,
        className,
      )}
    >
      {score ?? '—'}
      {score !== null && score !== undefined ? <span className="text-[0.65em] opacity-60">/100</span> : null}
    </span>
  )
}
