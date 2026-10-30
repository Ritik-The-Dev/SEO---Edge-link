'use client'

import { useEffect, useRef } from 'react'

/**
 * A trailing measurement reticle: a thin ring and crosshair that follow the
 * pointer with easing and enlarge over interactive elements. It is additive —
 * the native cursor is never hidden — and is limited to fine pointers with
 * motion enabled. Purely decorative: aria-hidden, pointer-events none.
 */
export function CursorReticle() {
  const ringRef = useRef<HTMLDivElement>(null)
  const dotRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!window.matchMedia('(pointer: fine)').matches) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const ring = ringRef.current
    const dot = dotRef.current
    if (!ring || !dot) return

    let targetX = window.innerWidth / 2
    let targetY = window.innerHeight / 2
    let x = targetX
    let y = targetY
    let raf = 0
    let scale = 1
    let targetScale = 1
    let visible = false

    const onMove = (event: PointerEvent) => {
      targetX = event.clientX
      targetY = event.clientY
      if (!visible) {
        visible = true
        ring.style.opacity = '1'
        dot.style.opacity = '1'
      }
      const interactive = (event.target as HTMLElement | null)?.closest(
        'a, button, [role="button"], input, select, textarea, [data-cursor]',
      )
      targetScale = interactive ? 1.9 : 1
    }

    const onLeave = () => {
      visible = false
      ring.style.opacity = '0'
      dot.style.opacity = '0'
    }

    const tick = () => {
      raf = requestAnimationFrame(tick)
      x += (targetX - x) * 0.16
      y += (targetY - y) * 0.16
      scale += (targetScale - scale) * 0.14
      ring.style.transform = `translate3d(${x - 18}px, ${y - 18}px, 0) scale(${scale.toFixed(3)})`
      dot.style.transform = `translate3d(${targetX - 2}px, ${targetY - 2}px, 0)`
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    document.addEventListener('pointerleave', onLeave)
    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerleave', onLeave)
    }
  }, [])

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[60] hidden lg:block">
      <div
        ref={ringRef}
        className="absolute left-0 top-0 h-9 w-9 rounded-full border border-accent/50 opacity-0 transition-opacity duration-300"
        style={{ boxShadow: '0 0 24px -6px hsl(var(--accent) / 0.5)' }}
      >
        <span className="absolute left-1/2 top-0 h-1 w-px -translate-x-1/2 bg-accent/60" />
        <span className="absolute bottom-0 left-1/2 h-1 w-px -translate-x-1/2 bg-accent/60" />
        <span className="absolute left-0 top-1/2 h-px w-1 -translate-y-1/2 bg-accent/60" />
        <span className="absolute right-0 top-1/2 h-px w-1 -translate-y-1/2 bg-accent/60" />
      </div>
      <div ref={dotRef} className="absolute left-0 top-0 h-1 w-1 rounded-full bg-accent opacity-0" />
    </div>
  )
}
