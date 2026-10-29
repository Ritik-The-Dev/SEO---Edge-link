import { cn } from '@/lib/utils'

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ReactNode
  title: string
  description: string
  action?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center px-6 py-14 text-center', className)}>
      {icon ? (
        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full border border-line bg-raised text-faint">
          {icon}
        </div>
      ) : null}
      <h3 className="text-sm font-medium text-ink">{title}</h3>
      <p className="mt-1.5 max-w-sm text-xs leading-relaxed text-muted">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  )
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn('relative overflow-hidden rounded-sm bg-raised', className)}
      aria-hidden
    >
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-line/60 to-transparent" />
    </div>
  )
}
