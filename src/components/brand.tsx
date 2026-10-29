import { cn } from '@/lib/utils'

/**
 * Brand mark: an orbital signal ring with a precise node — the EdgeLink
 * "signal observatory" motif reused across the marketing site and app chrome.
 */
export function BrandMark({ className, size = 22 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={cn('text-accent', className)}
      aria-hidden
    >
      <circle cx="12" cy="12" r="9.25" stroke="currentColor" strokeOpacity="0.35" strokeWidth="1" />
      <ellipse cx="12" cy="12" rx="9.25" ry="4" stroke="currentColor" strokeOpacity="0.5" strokeWidth="0.9" transform="rotate(-24 12 12)" />
      <circle cx="12" cy="12" r="3.1" stroke="currentColor" strokeWidth="1.1" />
      <circle cx="19.1" cy="7.7" r="1.8" fill="currentColor" />
      <path d="M12 2.75v2.4M12 18.85v2.4M2.75 12h2.4M18.85 12h2.4" stroke="currentColor" strokeOpacity="0.55" strokeWidth="0.9" strokeLinecap="round" />
    </svg>
  )
}

export function Wordmark({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <BrandMark size={20} />
      <span className="flex items-baseline gap-1.5">
        <span className="text-[0.95rem] font-semibold tracking-[0.16em] text-ink">EDGE</span>
        <span className="text-[0.95rem] font-semibold tracking-[0.16em] text-accent">LINK</span>
      </span>
      {!compact ? (
        <span className="hidden border-l border-line pl-2.5 font-mono text-[0.58rem] uppercase tracking-[0.2em] text-faint sm:inline">
          SEO Intelligence
        </span>
      ) : null}
    </span>
  )
}
