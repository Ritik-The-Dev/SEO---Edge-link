import { cn } from '@/lib/utils'

/** Minimal sparkline for score history. Pure SVG, no client JS. */
export function Sparkline({
  values,
  className,
  height = 48,
  label = 'Score trend',
}: {
  values: number[]
  className?: string
  height?: number
  label?: string
}) {
  if (values.length === 0) {
    return <div className={cn('text-2xs text-faint', className)}>No completed audits yet</div>
  }

  const width = 240
  const min = 0
  const max = 100
  const stepX = values.length > 1 ? width / (values.length - 1) : width
  const points = values.map((value, index) => {
    const x = index * stepX
    const y = height - ((Math.max(min, Math.min(max, value)) - min) / (max - min)) * (height - 8) - 4
    return `${x.toFixed(1)},${y.toFixed(1)}`
  })

  const area = `M0,${height} L${points.join(' L')} L${width},${height} Z`

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={cn('h-12 w-full', className)}
      role="img"
      aria-label={`${label}: ${values.join(', ')}`}
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="spark-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity="0.30" />
          <stop offset="60%" stopColor="hsl(var(--accent))" stopOpacity="0.08" />
          <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity="0" />
        </linearGradient>
        <filter id="spark-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <path d={area} fill="url(#spark-fill)" />
      <polyline
        points={points.join(' ')}
        fill="none"
        stroke="hsl(var(--accent))"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
        filter="url(#spark-glow)"
      />
      {values.map((value, index) => {
        const [x, y] = points[index]!.split(',')
        return (
          <circle
            key={index}
            cx={x}
            cy={y}
            r="2.4"
            fill="hsl(var(--canvas))"
            stroke="hsl(var(--accent))"
            strokeWidth="1.6"
          />
        )
      })}
    </svg>
  )
}

/** Ranked bars for failure frequencies or query volume. */
export function RankedBars({
  items,
  emptyLabel = 'Nothing to show yet',
}: {
  items: Array<{ label: string; value: number; tone?: 'accent' | 'warn' | 'critical' }>
  emptyLabel?: string
}) {
  if (items.length === 0) return <p className="py-6 text-center text-2xs text-faint">{emptyLabel}</p>
  const max = Math.max(...items.map((item) => item.value), 1)

  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.label}>
          <div className="flex items-baseline justify-between gap-3 text-xs">
            <span className="truncate text-muted">{item.label}</span>
            <span className="font-mono tabular-nums text-faint">{item.value}</span>
          </div>
          <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-line/60">
            <div
              className={cn(
                'h-full rounded-full',
                item.tone === 'critical' ? 'bg-critical' : item.tone === 'warn' ? 'bg-warn' : 'bg-accent',
              )}
              style={{ width: `${Math.max(4, (item.value / max) * 100)}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  )
}

/** Compact proportional bar used for category counts. */
export function Distribution({
  counts,
}: {
  counts: Array<{ label: string; value: number; className: string }>
}) {
  const total = counts.reduce((sum, item) => sum + item.value, 0)
  if (total === 0) return <div className="h-1.5 w-full rounded-full bg-line/60" />
  return (
    <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-line/40">
      {counts.map((item) => (
        <div
          key={item.label}
          className={cn('h-full', item.className)}
          style={{ width: `${(item.value / total) * 100}%` }}
          title={`${item.label}: ${item.value}`}
        />
      ))}
    </div>
  )
}
