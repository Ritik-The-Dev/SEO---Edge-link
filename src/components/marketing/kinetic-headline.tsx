'use client'

import { useEffect, useRef } from 'react'
import gsap from 'gsap'

/**
 * Editorial hero headline with a masked line-by-line entrance and a
 * hand-drawn underline that draws itself under the emphasised word.
 * The DOM is fully readable before and without JavaScript; GSAP only
 * enhances it, and the timeline is reverted on unmount.
 */
export function KineticHeadline() {
  const rootRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const lines = Array.from(root.querySelectorAll<HTMLElement>('[data-line]'))
    const stroke = root.querySelector<SVGPathElement>('[data-stroke]')

    const context = gsap.context(() => {
      gsap.set(lines, { yPercent: 118, rotate: 2.2, opacity: 0 })
      const timeline = gsap.timeline({ delay: 0.12, defaults: { ease: 'expo.out' } })
      timeline.to(lines, {
        yPercent: 0,
        rotate: 0,
        opacity: 1,
        duration: 1.15,
        stagger: 0.085,
      })

      if (stroke) {
        const length = stroke.getTotalLength()
        gsap.set(stroke, { strokeDasharray: length, strokeDashoffset: length, opacity: 1 })
        timeline.to(stroke, { strokeDashoffset: 0, duration: 1.1, ease: 'power2.inOut' }, '-=0.6')
      }
    }, root)

    return () => context.revert()
  }, [])

  return (
    <h1
      ref={rootRef}
      className="font-display text-[3.35rem] leading-[0.9] tracking-[-0.035em] sm:text-[4.5rem] lg:text-[5.15rem]"
    >
      <span className="block overflow-hidden pb-[0.08em]">
        <span data-line className="block will-change-transform">
          Know what is
        </span>
      </span>
      <span className="-mb-[0.16em] block overflow-hidden pb-[0.28em]">
        <span data-line className="block will-change-transform">
          <em className="ink-underline italic text-accent">
            holding
            <svg viewBox="0 0 220 18" fill="none" preserveAspectRatio="none" aria-hidden>
              <path
                data-stroke
                d="M3 12.5C38 5.5 96 3.4 143 6.2c26 1.6 52 4.2 74 7.8"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                opacity="0"
              />
            </svg>
          </em>{' '}
          your
        </span>
      </span>
      <span className="block overflow-hidden pb-[0.08em]">
        <span data-line className="block will-change-transform">
          website back.
        </span>
      </span>
    </h1>
  )
}
