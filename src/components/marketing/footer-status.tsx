'use client'

import { useEffect, useState } from 'react'

/**
 * A small, honest piece of life in the footer: the current UTC time, the
 * running year and the active analysis mode. No fabricated service status.
 */
export function FooterStatus() {
  const [now, setNow] = useState<Date | null>(null)

  useEffect(() => {
    setNow(new Date())
    const timer = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  const clock = now
    ? now.toLocaleTimeString('en-GB', { timeZone: 'UTC', hour12: false })
    : '--:--:--'

  return (
    <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
      <span>© {now ? now.getUTCFullYear() : 2026} Edgelink Technology</span>
      <span className="h-2.5 w-px bg-line" aria-hidden />
      <span className="inline-flex items-center gap-1.5">
        <span className="relative inline-flex h-1 w-1">
          <span className="absolute inset-0 rounded-full bg-accent pulse-dot" />
        </span>
        <span className="tabular-nums">{clock} UTC</span>
      </span>
      <span className="h-2.5 w-px bg-line" aria-hidden />
      <span>mock integrations · fixture analysis</span>
    </p>
  )
}
