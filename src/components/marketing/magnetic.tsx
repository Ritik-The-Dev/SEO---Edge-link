'use client'

import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { cn } from '@/lib/utils'

/**
 * Magnetic wrapper: the child drifts toward the pointer while it is near,
 * then springs back. Pointer-only and motion-safe — touch users and
 * reduced-motion users get a plain element with no listeners attached.
 */
export function Magnetic({
  children,
  className,
  strength = 0.28,
}: {
  children: React.ReactNode
  className?: string
  strength?: number
}) {
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const root = ref.current
    if (!root) return
    if (!window.matchMedia('(pointer: fine)').matches) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const moveX = gsap.quickTo(root, 'x', { duration: 0.5, ease: 'power3.out' })
    const moveY = gsap.quickTo(root, 'y', { duration: 0.5, ease: 'power3.out' })

    const onMove = (event: PointerEvent) => {
      const rect = root.getBoundingClientRect()
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2
      const dx = event.clientX - cx
      const dy = event.clientY - cy
      const distance = Math.hypot(dx, dy)
      const radius = Math.max(rect.width, rect.height) * 0.9 + 46
      if (distance > radius) return
      moveX(dx * strength)
      moveY(dy * strength)
    }

    const onLeave = () => {
      moveX(0)
      moveY(0)
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerleave', onLeave)
    // Pointer leaving the window entirely should snap the element home.
    window.addEventListener('blur', onLeave)

    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerleave', onLeave)
      window.removeEventListener('blur', onLeave)
      gsap.killTweensOf(root)
    }
  }, [strength])

  return (
    <span ref={ref} className={cn('inline-flex will-change-transform', className)}>
      {children}
    </span>
  )
}
