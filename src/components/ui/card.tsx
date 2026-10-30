import * as React from 'react'
import { cn } from '@/lib/utils'

export function Panel({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('panel', className)} {...props}>
      {children}
    </div>
  )
}

export function PanelHeader({
  title,
  description,
  actions,
  className,
}: {
  title: React.ReactNode
  description?: React.ReactNode
  actions?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex items-start justify-between gap-4 border-b border-line/50 px-6 py-5 bg-gradient-to-r from-surface/50 to-transparent', className)}>
      <div className="min-w-0">
        <h2 className="text-base font-semibold tracking-[-0.01em] text-ink">{title}</h2>
        {description ? <p className="mt-1 text-sm leading-relaxed text-muted">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </div>
  )
}

export function PanelBody({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn('px-6 py-5', className)}>{children}</div>
}

export function SectionLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('mono-label', className)}>{children}</div>
}

export function Stat({
  label,
  value,
  hint,
  tone,
  className,
}: {
  label: string
  value: React.ReactNode
  hint?: React.ReactNode
  tone?: 'accent' | 'warn' | 'critical' | 'default'
  className?: string
}) {
  return (
    <div className={cn('stat-card border border-line/50 px-6 py-6 relative overflow-hidden', className)}>
      <div className="mono-label relative z-10">{label}</div>
      <div
        className={cn(
          'mt-3 font-display text-4xl leading-none tracking-[-0.02em] relative z-10',
          tone === 'accent' && 'gradient-text',
          tone === 'warn' && 'text-warn',
          tone === 'critical' && 'text-critical',
        )}
      >
        {value}
      </div>
      {hint ? <div className="mt-2.5 text-sm leading-relaxed text-muted relative z-10">{hint}</div> : null}
    </div>
  )
}
