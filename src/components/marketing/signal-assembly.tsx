'use client'

import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Gauge, Globe, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

gsap.registerPlugin(ScrollTrigger)

/**
 * SIGNAL ASSEMBLY
 *
 * On load, eight scattered SEO signals fly in from outside the viewport and
 * lock into place around a browser frame, which then "loads" into a ranked
 * page. Everything is CSS 3D (perspective + preserve-3d) driven by GSAP, so
 * the whole set piece costs no WebGL runtime and stays smooth on laptops.
 *
 * The block is decorative: the surrounding copy carries the message, the
 * shards are aria-hidden, and reduced-motion users see the assembled state
 * immediately. Without JavaScript the stage stays hidden rather than half-built.
 */

type Shard = {
  label: string
  value: string
  tone: 'pass' | 'good' | 'warn'
  position: string
  depth: number
  start: { x: number; y: number; z: number; rx: number; ry: number; rz: number }
  hideOnMobile?: boolean
}

const SHARDS: Shard[] = [
  {
    label: 'LCP',
    value: '1.2 s',
    tone: 'good',
    position: 'left-0 top-[9%]',
    depth: 90,
    start: { x: -1.15, y: -0.55, z: -500, rx: 40, ry: -70, rz: -18 },
  },
  {
    label: 'H1',
    value: 'one promise',
    tone: 'pass',
    position: 'right-0 top-[4%]',
    depth: 60,
    start: { x: 1.1, y: -0.75, z: -420, rx: -30, ry: 80, rz: 14 },
    hideOnMobile: true,
  },
  {
    label: 'canonical',
    value: 'self',
    tone: 'pass',
    position: 'left-[1%] top-[37%]',
    depth: 120,
    start: { x: -1.2, y: -0.1, z: -650, rx: 20, ry: -110, rz: 8 },
    hideOnMobile: true,
  },
  {
    label: 'JSON-LD',
    value: 'LocalBusiness',
    tone: 'good',
    position: 'right-[1%] top-[32%]',
    depth: 100,
    start: { x: 1.2, y: -0.2, z: -560, rx: -25, ry: 100, rz: -12 },
    hideOnMobile: true,
  },
  {
    label: 'sitemap',
    value: '42 urls',
    tone: 'pass',
    position: 'left-[2%] bottom-[31%]',
    depth: 70,
    start: { x: -1.05, y: 0.7, z: -480, rx: 35, ry: -80, rz: 16 },
    hideOnMobile: true,
  },
  {
    label: 'alt text',
    value: '100%',
    tone: 'good',
    position: 'right-0 bottom-[30%]',
    depth: 130,
    start: { x: 1.15, y: 0.65, z: -600, rx: -40, ry: 90, rz: -10 },
  },
  {
    label: 'robots',
    value: 'allow · 200',
    tone: 'pass',
    position: 'left-[1%] bottom-[8%]',
    depth: 50,
    start: { x: -0.9, y: 0.85, z: -380, rx: 25, ry: -60, rz: -14 },
    hideOnMobile: true,
  },
  {
    label: 'CLS',
    value: '0.01',
    tone: 'good',
    position: 'right-[1%] bottom-[7%]',
    depth: 80,
    start: { x: 0.95, y: 0.9, z: -520, rx: -20, ry: 70, rz: 12 },
  },
]

function Tone({ tone }: { tone: Shard['tone'] }) {
  return (
    <span
      className={cn(
        'h-1.5 w-1.5 rounded-full',
        tone === 'good' ? 'bg-accent' : tone === 'warn' ? 'bg-warn' : 'bg-[hsl(var(--gradient-2))]',
      )}
    />
  )
}

export function SignalAssembly({ className }: { className?: string }) {
  const rootRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<HTMLDivElement>(null)
  const browserRef = useRef<HTMLDivElement>(null)
  const rankRef = useRef<HTMLSpanElement>(null)
  const shardRefs = useRef<Array<HTMLDivElement | null>>([])

  useLayoutEffect(() => {
    const root = rootRef.current
    const scene = sceneRef.current
    const browser = browserRef.current
    if (!root || !scene || !browser) return

    const shards = shardRefs.current.filter((el): el is HTMLDivElement => Boolean(el))
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const context = gsap.context(() => {
      if (reduced) {
        gsap.set(root, { autoAlpha: 1 })
        gsap.set('.assembly-load', { scaleX: 1 })
        gsap.set(browser, { opacity: 1, rotateX: 0, y: 0 })
        if (rankRef.current) rankRef.current.textContent = '96'
        return
      }

      gsap.set(root, { autoAlpha: 1 })

      const vw = window.innerWidth
      const vh = window.innerHeight
      const timeline = gsap.timeline({ defaults: { ease: 'expo.out' } })

      timeline
        .from(browser, {
          y: 90,
          z: -220,
          rotationX: 16,
          scale: 0.8,
          opacity: 0,
          filter: 'blur(16px)',
          duration: 1.5,
        })
        .from(
          '.assembly-chrome',
          { y: 12, opacity: 0, duration: 0.7 },
          '-=1.05',
        )
        .from(
          '.assembly-load',
          { scaleX: 0, duration: 0.85, stagger: 0.075, ease: 'power3.inOut' },
          '-=0.9',
        )
        .from(
          '.assembly-card',
          { y: 26, opacity: 0, scale: 0.9, duration: 0.8, stagger: 0.09, ease: 'back.out(1.6)' },
          '-=0.55',
        )
        .from(
          '.assembly-rank',
          { scale: 0.4, opacity: 0, rotate: -8, duration: 0.9, ease: 'back.out(2.2)' },
          '-=0.35',
        )
        .from(
          '.assembly-serp',
          { y: 26, opacity: 0, scale: 0.94, duration: 0.9, ease: 'expo.out' },
          '-=0.4',
        )
        .from(
          '.assembly-sheen',
          { xPercent: -140, duration: 1.3, ease: 'power2.inOut' },
          '-=0.7',
        )

      shards.forEach((shard, index) => {
        const start = SHARDS[index]?.start
        if (!start) return
        timeline.from(
          shard,
          {
            x: vw * start.x,
            y: vh * start.y,
            z: start.z,
            rotationX: start.rx,
            rotationY: start.ry,
            rotationZ: start.rz,
            opacity: 0,
            scale: 0.45,
            duration: 1.65,
            ease: 'power4.out',
          },
          0.25 + index * 0.035,
        )
      })

      // Idle: each shard breathes on its own clock, the browser tilts with the pointer.
      shards.forEach((shard, index) => {
        const inner = shard.querySelector('[data-float]')
        if (!inner) return
        gsap.to(inner, {
          y: index % 2 === 0 ? -7 : 7,
          rotationZ: index % 2 === 0 ? 1.2 : -1.2,
          duration: 3.4 + (index % 4) * 0.6,
          ease: 'sine.inOut',
          repeat: -1,
          yoyo: true,
          delay: 0.4 + index * 0.12,
        })
      })

      const count = { value: 0 }
      gsap.to(count, {
        value: 96,
        duration: 1.6,
        delay: 1.1,
        ease: 'power2.out',
        onUpdate: () => {
          if (rankRef.current) rankRef.current.textContent = String(Math.round(count.value))
        },
      })

      // Scroll: the constellation breathes apart and the page tilts away.
      gsap.to(scene, {
        rotationX: -8,
        rotationY: -9,
        yPercent: 3,
        ease: 'none',
        scrollTrigger: {
          trigger: root,
          start: 'top top',
          end: 'bottom top',
          scrub: 1.1,
        },
      })
      gsap.to('.assembly-shard-inner', {
        z: 90,
        y: (index) => (index % 2 === 0 ? -26 : 26),
        ease: 'none',
        scrollTrigger: {
          trigger: root,
          start: 'top top',
          end: 'bottom top',
          scrub: 1.4,
        },
      })

      // Pointer depth: the stage looks at the cursor.
      if (window.matchMedia('(pointer: fine)').matches) {
        const rotateX = gsap.quickTo(scene, 'rotationX', { duration: 0.9, ease: 'power3.out' })
        const rotateY = gsap.quickTo(scene, 'rotationY', { duration: 0.9, ease: 'power3.out' })
        const onMove = (event: PointerEvent) => {
          const rect = root.getBoundingClientRect()
          const px = (event.clientX - rect.left) / rect.width - 0.5
          const py = (event.clientY - rect.top) / rect.height - 0.5
          rotateY(px * 7)
          rotateX(-py * 6)
        }
        root.addEventListener('pointermove', onMove)
        return () => root.removeEventListener('pointermove', onMove)
      }
    }, root)

    return () => context.revert()
  }, [])

  return (
    <div
      ref={rootRef}
      aria-hidden
      className={cn('relative select-none opacity-0', className)}
      style={{ perspective: '1600px' }}
    >
      <div
        ref={sceneRef}
        className="relative mx-auto aspect-[1/1.02] w-full max-w-[740px] sm:aspect-[4/3.05]"
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* orbit rings + measurement grid */}
        <div className="pointer-events-none absolute inset-[6%] rounded-full border border-line/40" />
        <div className="pointer-events-none absolute inset-[16%] rounded-full border border-dashed border-line/50" />
        <div className="orbit-slow pointer-events-none absolute inset-[10%] rounded-full">
          <span className="absolute left-1/2 top-0 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/70 shadow-[0_0_12px_2px_hsl(var(--accent)/0.4)]" />
          <span className="absolute bottom-[14%] right-[6%] h-1 w-1 rounded-full bg-accent/40" />
        </div>
        <div className="orbit-reverse pointer-events-none absolute inset-[22%] rounded-full">
          <span className="absolute right-0 top-1/2 h-1 w-1 rounded-full bg-[hsl(var(--gradient-2))]/70" />
        </div>
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.22]"
          style={{
            backgroundImage:
              'linear-gradient(hsl(var(--line)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--line)) 1px, transparent 1px)',
            backgroundSize: '44px 44px',
            maskImage: 'radial-gradient(ellipse at 50% 50%, black 30%, transparent 78%)',
            WebkitMaskImage: 'radial-gradient(ellipse at 50% 50%, black 30%, transparent 78%)',
          }}
        />

        {/* the page being built */}
        <div
          ref={browserRef}
          className="absolute left-1/2 top-1/2 w-[54%] -translate-x-1/2 -translate-y-1/2"
          style={{ transformStyle: 'preserve-3d' }}
        >
          <div
            className="relative overflow-hidden rounded-xl border border-line/80 bg-[#0b0f0d] shadow-[0_50px_120px_-50px_rgba(0,0,0,0.95)]"
            style={{ transform: 'translateZ(20px)' }}
          >
            {/* chrome */}
            <div className="assembly-chrome flex items-center gap-1.5 border-b border-white/10 bg-white/[0.04] px-3 py-2">
              <span className="h-1.5 w-1.5 rounded-full bg-white/25" />
              <span className="h-1.5 w-1.5 rounded-full bg-white/15" />
              <span className="h-1.5 w-1.5 rounded-full bg-white/10" />
              <div className="ml-2 flex h-4 flex-1 items-center gap-1.5 rounded-full bg-black/40 px-2">
                <Globe className="h-2 w-2 text-accent/80" />
                <span className="font-mono text-[0.38rem] tracking-[0.06em] text-white/55">
                  yourbrand.com
                </span>
                <span className="ml-auto h-1 w-1 rounded-full bg-accent" />
              </div>
            </div>

            {/* the ranked page */}
            <div className="relative p-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-[3px] bg-accent" />
                  <span className="font-mono text-[0.36rem] uppercase tracking-[0.18em] text-white/70">
                    yourbrand
                  </span>
                </div>
                <div className="flex gap-1.5">
                  {[10, 8, 9].map((width, index) => (
                    <span
                      key={index}
                      className="h-[2px] rounded-full bg-white/20"
                      style={{ width }}
                    />
                  ))}
                </div>
              </div>

              <div className="mt-4">
                <div className="assembly-load h-[3px] w-[26%] origin-left rounded-full bg-accent/70" />
                <div className="assembly-load mt-2 h-[9px] w-[86%] origin-left rounded-[2px] bg-white/85" />
                <div className="assembly-load mt-1.5 h-[9px] w-[62%] origin-left rounded-[2px] bg-white/55" />
                <div className="assembly-load mt-3 h-[2px] w-[74%] origin-left rounded-full bg-white/18" />
                <div className="assembly-load mt-1 h-[2px] w-[58%] origin-left rounded-full bg-white/14" />
              </div>

              <div className="mt-4 grid grid-cols-3 gap-1.5">
                {[0, 1, 2].map((index) => (
                  <div
                    key={index}
                    className="assembly-card overflow-hidden rounded-[4px] border border-white/10 bg-white/[0.045] p-1.5"
                  >
                    <div className="h-5 rounded-[2px] bg-gradient-to-br from-accent/25 to-transparent" />
                    <div className="mt-1.5 h-[2px] w-[80%] rounded-full bg-white/35" />
                    <div className="mt-1 h-[2px] w-[52%] rounded-full bg-white/15" />
                  </div>
                ))}
              </div>

              <div className="assembly-card mt-3 flex items-center justify-between rounded-[4px] border border-accent/25 bg-accent/[0.08] px-2 py-1.5">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="h-2.5 w-2.5 text-accent" />
                  <span className="font-mono text-[0.34rem] uppercase tracking-[0.14em] text-white/75">
                    42 pages indexable
                  </span>
                </div>
                <span className="font-mono text-[0.34rem] text-accent">0.4s</span>
              </div>

              {/* scan sheen */}
              <div className="assembly-sheen pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
            </div>
          </div>

          {/* rank badge — outside the clipped card so the glow can bleed */}
          <div
            className="assembly-rank absolute -right-4 -top-5 z-30 flex items-center gap-2 rounded-full border border-accent/50 bg-canvas px-2.5 py-1.5 shadow-[0_0_40px_-8px_hsl(var(--accent)/0.7)] sm:-right-6 sm:-top-7 sm:gap-2.5 sm:px-3 sm:py-2"
            style={{ transform: 'translateZ(70px) rotate(-3deg)' }}
          >
            <span className="font-mono text-[0.34rem] uppercase tracking-[0.14em] text-faint">score</span>
            <span ref={rankRef} className="font-display text-lg leading-none text-accent tabular-nums sm:text-xl">
              0
            </span>
            <span className="font-mono text-[0.34rem] text-faint">/100</span>
          </div>

          {/* reflection */}
          <div className="mx-auto mt-2 h-6 w-[72%] rounded-full bg-accent/10 blur-xl" />
        </div>

        {/* shards */}
        {SHARDS.map((shard, index) => (
          <div
            key={shard.label}
            ref={(element) => {
              shardRefs.current[index] = element
            }}
            className={cn('absolute z-10', shard.position, shard.hideOnMobile && 'hidden sm:block')}
            style={{ transformStyle: 'preserve-3d' }}
          >
            <div
              data-float
              className="assembly-shard-inner flex items-center gap-2 rounded-lg border border-line/80 bg-surface/90 px-2.5 py-2 shadow-[0_18px_40px_-20px_rgba(0,0,0,0.9)] backdrop-blur-md"
              style={{ transform: `translateZ(${shard.depth}px)` }}
            >
              <Tone tone={shard.tone} />
              <div className="leading-none">
                <div className="font-mono text-[0.42rem] uppercase tracking-[0.14em] text-faint">
                  {shard.label}
                </div>
                <div className="mt-1 font-mono text-[0.52rem] text-ink">{shard.value}</div>
              </div>
            </div>
          </div>
        ))}

        {/* search result: the page has a place in the index */}
        <div className="assembly-serp absolute left-1/2 top-[76%] z-20 hidden w-[52%] -translate-x-1/2 sm:block">
          <div className="overflow-hidden rounded-lg border border-line/80 bg-[#f7f5ef] shadow-[0_24px_60px_-30px_rgba(0,0,0,0.9)]">
            <div className="flex items-center justify-between gap-2 border-b border-[#e2ddd0] px-2.5 py-1.5">
              <span className="font-mono text-[0.34rem] uppercase tracking-[0.14em] text-[#7c8579]">
                google · dentist near me
              </span>
              <span className="rounded-full bg-[#4d7c0f] px-1.5 py-0.5 font-mono text-[0.32rem] uppercase tracking-[0.1em] text-white">
                rank 1
              </span>
            </div>
            <div className="px-2.5 py-2">
              <div className="flex items-center gap-1">
                <span className="flex h-3 w-3 items-center justify-center rounded-full bg-[#1f3a1a] font-mono text-[0.26rem] text-white">
                  Y
                </span>
                <span className="font-mono text-[0.34rem] text-[#4b554e]">yourbrand.com › services</span>
              </div>
              <div className="mt-1 font-display text-[0.62rem] leading-tight text-[#1b3a8a]">
                Dental care, found — Same-day appointments in Pune
              </div>
              <div className="mt-0.5 h-[2px] w-[92%] rounded-full bg-[#c9c3b4]" />
              <div className="mt-1 h-[2px] w-[68%] rounded-full bg-[#dcd6c7]" />
            </div>
          </div>
        </div>

        {/* corner annotations */}
        <div className="absolute left-0 top-0 hidden items-center gap-1.5 font-mono text-[0.4rem] uppercase tracking-[0.16em] text-faint sm:flex">
          <Gauge className="h-2.5 w-2.5" />
          signal capture
        </div>
        <div className="absolute right-0 top-1/2 hidden origin-right -rotate-90 font-mono text-[0.38rem] uppercase tracking-[0.2em] text-faint sm:block">
          8 signals / 1 page
        </div>
      </div>
    </div>
  )
}
