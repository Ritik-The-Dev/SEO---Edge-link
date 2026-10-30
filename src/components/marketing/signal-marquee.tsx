import { cn } from '@/lib/utils'

/**
 * Factual signal marquee. The track is rendered twice; the duplicate is
 * aria-hidden. CSS pauses it on hover/focus, and reduced-motion stops it
 * entirely (the list then wraps normally).
 */
export function SignalMarquee({
  items,
  className,
  duration = 46,
}: {
  items: string[]
  className?: string
  duration?: number
}) {
  const track = [...items, ...items]

  return (
    <div
      className={cn('marquee-wrap relative overflow-hidden border-y border-line bg-surface/40', className)}
      style={{ '--marquee-duration': `${duration}s` } as React.CSSProperties}
    >
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-canvas to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-canvas to-transparent" />
      <div className="marquee items-center gap-6 py-3">
        {track.map((item, index) => (
          <span
            key={`${item}-${index}`}
            aria-hidden={index >= items.length}
            className="flex shrink-0 items-center gap-6 font-mono text-[0.56rem] uppercase tracking-[0.18em] text-faint"
          >
            <span className="h-1 w-1 rotate-45 bg-accent/50" aria-hidden />
            {item}
          </span>
        ))}
      </div>
    </div>
  )
}
