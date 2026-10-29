import { cn } from '@/lib/utils'

export function Progress({
  value,
  className,
  tone = 'accent',
  label,
}: {
  value: number
  className?: string
  tone?: 'accent' | 'warn' | 'critical' | 'muted'
  label?: string
}) {
  const clamped = Math.max(0, Math.min(100, value))
  const toneClass =
    tone === 'warn' ? 'bg-warn' : tone === 'critical' ? 'bg-critical' : tone === 'muted' ? 'bg-faint' : 'bg-accent'
  return (
    <div
      className={cn('relative h-1.5 w-full overflow-hidden rounded-full bg-line/60', className)}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label ?? 'Progress'}
    >
      <div
        className={cn('h-full rounded-full transition-[width] duration-500 ease-out', toneClass)}
        style={{ width: `${clamped}%` }}
      />
    </div>
  )
}

export function MeterRow({
  label,
  value,
  tone = 'accent',
  suffix = '/100',
}: {
  label: string
  value: number
  tone?: 'accent' | 'warn' | 'critical' | 'muted'
  suffix?: string
}) {
  return (
    <div className="grid grid-cols-[7.5rem_1fr_3rem] items-center gap-3">
      <span className="text-xs text-muted">{label}</span>
      <Progress value={value} tone={tone} label={`${label} score`} />
      <span className="text-right font-mono text-xs tabular-nums text-ink">
        {value}
        <span className="text-faint">{suffix}</span>
      </span>
    </div>
  )
}
