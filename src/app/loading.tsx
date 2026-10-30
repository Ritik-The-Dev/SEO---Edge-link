import { Wordmark } from '@/components/brand'

/**
 * Route-level loading state, on brand: eight signal ticks assembling.
 * Pure CSS with no client JavaScript, so it can render before the page hydrates.
 */
export default function Loading() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-8 bg-canvas px-6">
      <Wordmark />
      <div className="flex items-end gap-1.5" aria-hidden>
        {Array.from({ length: 8 }).map((_, index) => (
          <span
            key={index}
            className="boot-signal h-6 w-[3px] rounded-full bg-accent/70"
            style={{ animationDelay: `${index * 90}ms` }}
          />
        ))}
      </div>
      <p className="font-mono text-[0.55rem] uppercase tracking-[0.24em] text-faint">
        assembling signals
      </p>
      <span className="sr-only" role="status">
        Loading
      </span>
    </div>
  )
}
