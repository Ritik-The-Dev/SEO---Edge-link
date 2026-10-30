'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

/**
 * Marks a block when it first enters the viewport. Children opt into CSS
 * transitions with `.rise`, `.bar-grow` or `.draw-in`.
 *
 * States: "pending" (server / no JS — everything visible), "false" (motion
 * armed, waiting for the viewport) and "true" (revealed). The switch to
 * "false" happens in a layout effect, so there is no flash of visible content
 * and no hidden content if JavaScript never runs.
 */
export function InView({
  children,
  className,
  as: Tag = 'div',
  threshold = 0.18,
}: {
  children: React.ReactNode
  className?: string
  as?: 'div' | 'section' | 'li' | 'article'
  threshold?: number
}) {
  const ref = useRef<HTMLElement>(null)
  const [state, setState] = useState<'pending' | 'false' | 'true'>('pending')

  useLayoutEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    setState('false')
  }, [])

  useEffect(() => {
    if (state !== 'false') return
    const element = ref.current
    if (!element) return

    let frame = 0
    const reveal = () => {
      setState('true')
      observer.disconnect()
      window.removeEventListener('scroll', onScroll)
    }

    // An IntersectionObserver alone misses sections skipped by a single jump
    // (anchor link, End key, restored scroll position): they go from "below"
    // to "above" without ever reporting an intersection. The scroll fallback
    // reveals anything that is already at or above the fold.
    const check = () => {
      frame = 0
      const rect = element.getBoundingClientRect()
      if (rect.top < window.innerHeight * 0.94) reveal()
    }

    const onScroll = () => {
      if (frame) return
      frame = requestAnimationFrame(check)
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) reveal()
      },
      { threshold, rootMargin: '0px 0px -6% 0px' },
    )
    observer.observe(element)
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    check()

    return () => {
      if (frame) cancelAnimationFrame(frame)
      observer.disconnect()
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [state, threshold])

  return (
    <Tag ref={ref as never} data-inview={state} className={cn(className)}>
      {children}
    </Tag>
  )
}
