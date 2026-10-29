import { cn, scoreTone } from '@/lib/utils'

const TONE_STROKE: Record<string, string> = {
  good: 'hsl(var(--accent))',
  fair: 'hsl(var(--warn))',
  poor: 'hsl(var(--critical))',
  none: 'hsl(var(--line))',
}

/**
 * Score ring used across the dashboard, audit page and marketing preview.
 * Values come from persisted audit data only.
 */
export function ScoreRing({
  score,
  size = 132,
  stroke = 7,
  label,
  className,
}: {
  score: number | null | undefined
  size?: number
  stroke?: number
  label?: string
  className?: string
}) {
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const value = clamp(score ?? 0)
  const dash = (value / 100) * circumference
  const tone = scoreTone(score)

  return (
    <div
      className={cn('relative inline-flex items-center justify-center', className)}
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${label ?? 'Overall'} score ${score ?? 'not available'} out of 100`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="hsl(var(--line))" strokeWidth={stroke} />
        {score !== null && score !== undefined ? (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={TONE_STROKE[tone]}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circumference}`}
            className="transition-[stroke-dasharray] duration-700 ease-out"
          />
        ) : null}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className={cn(
            'font-display leading-none tracking-[-0.02em]',
            size >= 120 ? 'text-4xl' : size >= 88 ? 'text-2xl' : 'text-lg',
          )}
        >
          {score ?? '—'}
        </span>
        <span className="mt-1 font-mono text-[0.6rem] uppercase tracking-[0.18em] text-faint">/ 100</span>
      </div>
    </div>
  )
}

function clamp(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) return 0
  return Math.max(0, Math.min(100, value))
}

export function ScoreBreakdown({
  breakdown,
  className,
}: {
  breakdown: { technical: number; on_page: number; content: number; core_web_vitals: number; schema: number }
  className?: string
}) {
  const rows = [
    { label: 'Technical', value: breakdown.technical },
    { label: 'On-page', value: breakdown.on_page },
    { label: 'Content', value: breakdown.content },
    { label: 'Core Web Vitals', value: breakdown.core_web_vitals },
    { label: 'Schema', value: breakdown.schema },
  ]

  return (
    <div className={cn('space-y-3', className)}>
      {rows.map((row) => {
        const tone = scoreTone(row.value)
        return (
          <div key={row.label} className="grid grid-cols-[8rem_1fr_2.5rem] items-center gap-3">
            <span className="text-xs text-muted">{row.label}</span>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-line/60">
              <div
                className={cn(
                  'h-full rounded-full',
                  tone === 'good' ? 'bg-accent' : tone === 'fair' ? 'bg-warn' : 'bg-critical',
                )}
                style={{ width: `${clamp(row.value)}%` }}
              />
            </div>
            <span className="text-right font-mono text-xs tabular-nums">{row.value}</span>
          </div>
        )
      })}
    </div>
  )
}
