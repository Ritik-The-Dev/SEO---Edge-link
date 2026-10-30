'use client'

import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

/**
 * Adds a gentle pointer-driven 3D tilt to a plate. Max 3.5°, eased, reset on
 * leave and focus-out. Disabled for coarse pointers and reduced motion, so it
 * never fights scrolling or accessibility.
 */
export function TiltFrame({
  children,
  className,
  max = 3.5,
}: {
  children: React.ReactNode
  className?: string
  max?: number
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return
    if (!window.matchMedia('(pointer: fine)').matches) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let raf = 0
    let currentX = 0
    let currentY = 0
    let targetX = 0
    let targetY = 0

    const tick = () => {
      raf = requestAnimationFrame(tick)
      currentX += (targetX - currentX) * 0.12
      currentY += (targetY - currentY) * 0.12
      element.style.transform = `perspective(1200px) rotateX(${currentX.toFixed(3)}deg) rotateY(${currentY.toFixed(3)}deg)`
    }

    const onMove = (event: PointerEvent) => {
      const rect = element.getBoundingClientRect()
      const px = (event.clientX - rect.left) / rect.width - 0.5
      const py = (event.clientY - rect.top) / rect.height - 0.5
      targetY = px * max * 2
      targetX = -py * max * 2
    }

    const reset = () => {
      targetX = 0
      targetY = 0
    }

    element.addEventListener('pointermove', onMove)
    element.addEventListener('pointerleave', reset)
    element.addEventListener('focusout', reset)
    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      element.removeEventListener('pointermove', onMove)
      element.removeEventListener('pointerleave', reset)
      element.removeEventListener('focusout', reset)
    }
  }, [max])

  return (
    <div ref={ref} className={cn('tilt-frame', className)}>
      {children}
    </div>
  )
}
