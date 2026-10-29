import * as React from 'react'
import { cn } from '@/lib/utils'

export function Panel({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('rounded-md border border-line bg-surface', className)} {...props}>
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
    <div className={cn('flex items-start justify-between gap-4 border-b border-line px-5 py-4', className)}>
      <div className="min-w-0">
        <h2 className="text-sm font-medium tracking-[-0.01em] text-ink">{title}</h2>
        {description ? <p className="mt-0.5 text-xs leading-relaxed text-muted">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </div>
  )
}

export function PanelBody({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn('px-5 py-4', className)}>{children}</div>
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
    <div className={cn('border-line px-5 py-4', className)}>
      <div className="mono-label">{label}</div>
      <div
        className={cn(
          'mt-2 font-display text-3xl leading-none tracking-[-0.01em]',
          tone === 'accent' && 'text-accent',
          tone === 'warn' && 'text-warn',
          tone === 'critical' && 'text-critical',
        )}
      >
        {value}
      </div>
      {hint ? <div className="mt-1.5 text-xs text-muted">{hint}</div> : null}
    </div>
  )
}
