'use client'

import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

/**
 * Signal Observatory — the product's visual signature.
 *
 * A wireframe sphere of sampled signals with orbital SEO markers. Drawn with
 * Canvas 2D (no WebGL dependency, no heavy 3D library), paused when offscreen,
 * capped at 2x DPR, and rendered as a single static frame when the visitor
 * prefers reduced motion. Colours are read from the live design tokens so the
 * visual follows the theme.
 */
const SIGNALS = [
  { label: 'LCP', lat: 22, lon: 18 },
  { label: 'CLS', lat: -38, lon: 96 },
  { label: 'JSON-LD', lat: 52, lon: 204 },
  { label: 'H1', lat: -8, lon: 286 },
  { label: 'SITEMAP', lat: 44, lon: 66 },
  { label: 'CANONICAL', lat: -52, lon: 236 },
]

function token(name: string, fallback: string): string {
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return value || fallback
}

export function SignalObservatory({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const accent = token('--accent', '160 74% 51%')
    const ink = token('--ink', '42 24% 93%')
    const line = token('--line', '155 8% 16%')
    const mutedInk = token('--muted-ink', '150 6% 62%')

    let width = 0
    let height = 0
    let dpr = 1
    let raf = 0
    let angle = 0
    let tilt = -0.12
    let targetTilt = -0.12
    let visible = true
    let lastFrame = 0

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      width = Math.max(280, rect.width)
      height = Math.max(280, rect.height)
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    const project = (latDeg: number, lonDeg: number, radius: number, spin: number, tiltRad: number) => {
      const lat = (latDeg * Math.PI) / 180
      const lon = (lonDeg * Math.PI) / 180 + spin
      const x = Math.cos(lat) * Math.sin(lon) * radius
      const y = Math.sin(lat) * radius
      const z = Math.cos(lat) * Math.cos(lon) * radius

      // tilt around X
      const cosT = Math.cos(tiltRad)
      const sinT = Math.sin(tiltRad)
      const y2 = y * cosT - z * sinT
      const z2 = y * sinT + z * cosT

      const focal = radius * 3.1
      const scale = focal / (focal + z2)
      return {
        x: width / 2 + x * scale,
        y: height / 2 + y2 * scale,
        z: z2,
        depth: (z2 + radius) / (2 * radius),
        scale,
      }
    }

    const draw = (timestamp: number) => {
      raf = requestAnimationFrame(draw)
      if (!visible) return
      if (timestamp - lastFrame < 30) return
      lastFrame = timestamp

      const radius = Math.min(width, height) * 0.315
      const spin = angle
      ctx.clearRect(0, 0, width, height)

      // Ambient halo
      const glow = ctx.createRadialGradient(width / 2, height / 2, radius * 0.1, width / 2, height / 2, radius * 2.2)
      glow.addColorStop(0, `hsl(${accent} / 0.10)`)
      glow.addColorStop(0.55, `hsl(${accent} / 0.03)`)
      glow.addColorStop(1, 'transparent')
      ctx.fillStyle = glow
      ctx.fillRect(0, 0, width, height)

      // Crosshair + concentric guides
      ctx.strokeStyle = `hsl(${line} / 0.7)`
      ctx.lineWidth = 1
      for (const factor of [0.42, 0.72, 1.0]) {
        ctx.beginPath()
        ctx.ellipse(width / 2, height / 2, radius * factor, radius * factor * 0.985, 0, 0, Math.PI * 2)
        ctx.stroke()
      }

      ctx.strokeStyle = `hsl(${line} / 0.55)`
      ctx.beginPath()
      ctx.moveTo(width / 2 - radius * 1.22, height / 2)
      ctx.lineTo(width / 2 + radius * 1.22, height / 2)
      ctx.moveTo(width / 2, height / 2 - radius * 1.22)
      ctx.lineTo(width / 2, height / 2 + radius * 1.22)
      ctx.stroke()

      // Sphere point field: latitude rings + meridians
      const drawField = (latRange: number[], lonRange: number[], dotSize: number, alphaBase: number, hue: string) => {
        for (const lat of latRange) {
          for (const lon of lonRange) {
            const point = project(lat, lon, radius, spin, tilt)
            const alpha = alphaBase * (0.25 + point.depth * 0.95)
            ctx.fillStyle = `hsl(${hue} / ${alpha.toFixed(3)})`
            const size = dotSize * (0.6 + point.depth * 0.7)
            ctx.fillRect(point.x - size / 2, point.y - size / 2, size, size)
          }
        }
      }

      const latitudes = [-60, -40, -20, 0, 20, 40, 60]
      const lons = Array.from({ length: 60 }, (_, index) => index * 6)
      drawField(latitudes, lons, 1.25, 0.32, line)
      drawField(
        [-70, -30, 10, 50],
        Array.from({ length: 28 }, (_, index) => index * (360 / 28)),
        1.4,
        0.5,
        mutedInk,
      )

      // Scan meridian
      ctx.beginPath()
      for (let i = 0; i <= 60; i += 1) {
        const lat = -90 + i * 3
        const point = project(lat, 0, radius, spin, tilt)
        if (i === 0) ctx.moveTo(point.x, point.y)
        else ctx.lineTo(point.x, point.y)
      }
      ctx.strokeStyle = `hsl(${accent} / 0.34)`
      ctx.lineWidth = 1.1
      ctx.stroke()

      // Orbit (tilted ring)
      const orbitRadius = radius * 1.28
      ctx.beginPath()
      for (let i = 0; i <= 90; i += 1) {
        const lon = (i / 90) * 360
        const p = project(0, lon, orbitRadius, spin * 0.6, tilt + 0.42)
        if (i === 0) ctx.moveTo(p.x, p.y)
        else ctx.lineTo(p.x, p.y)
      }
      ctx.strokeStyle = `hsl(${accent} / 0.22)`
      ctx.lineWidth = 1
      ctx.stroke()

      // Signal markers on the sphere
      SIGNALS.forEach((signal, index) => {
        const point = project(signal.lat, signal.lon, radius * 1.02, spin, tilt)
        const facing = point.depth > 0.46
        const alpha = facing ? 0.95 : 0.22
        const markerSize = 2.6 * point.scale

        ctx.strokeStyle = `hsl(${accent} / ${(alpha * 0.5).toFixed(2)})`
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.arc(point.x, point.y, markerSize * 3.4, 0, Math.PI * 2)
        ctx.stroke()

        ctx.fillStyle = `hsl(${accent} / ${alpha.toFixed(2)})`
        ctx.beginPath()
        ctx.arc(point.x, point.y, markerSize, 0, Math.PI * 2)
        ctx.fill()

        if (facing) {
          const label = signal.label
          const right = point.x < width / 2
          const dir = right ? 1 : -1
          const elbowX = point.x + dir * 26
          const elbowY = point.y - 16 - (index % 2) * 3

          ctx.strokeStyle = `hsl(${accent} / 0.32)`
          ctx.beginPath()
          ctx.moveTo(point.x + dir * markerSize * 1.6, point.y)
          ctx.lineTo(elbowX, elbowY)
          ctx.lineTo(elbowX + dir * 16, elbowY)
          ctx.stroke()

          ctx.fillStyle = `hsl(${ink} / 0.72)`
          ctx.font = '9px ui-monospace, SFMono-Regular, Menlo, monospace'
          ctx.textAlign = dir === 1 ? 'left' : 'right'
          ctx.fillText(label, elbowX + dir * 20, elbowY + 3)
        }
      })

      // Centre reticle
      ctx.strokeStyle = `hsl(${accent} / 0.5)`
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.arc(width / 2, height / 2, 3, 0, Math.PI * 2)
      ctx.stroke()

      if (!reduceMotion) {
        angle += 0.0022
        tilt += (targetTilt - tilt) * 0.04
      }
    }

    resize()
    draw(0)

    const resizeObserver = new ResizeObserver(() => {
      resize()
      if (reduceMotion) draw(0)
    })
    resizeObserver.observe(canvas)

    const intersection = new IntersectionObserver(
      ([entry]) => {
        visible = entry?.isIntersecting ?? true
      },
      { threshold: 0.05 },
    )
    intersection.observe(canvas)

    const onPointerMove = (event: PointerEvent) => {
      if (reduceMotion) return
      const rect = canvas.getBoundingClientRect()
      const y = (event.clientY - rect.top) / rect.height - 0.5
      targetTilt = -0.12 + y * 0.35
    }
    const onPointerLeave = () => {
      targetTilt = -0.12
    }

    canvas.addEventListener('pointermove', onPointerMove)
    canvas.addEventListener('pointerleave', onPointerLeave)

    return () => {
      cancelAnimationFrame(raf)
      resizeObserver.disconnect()
      intersection.disconnect()
      canvas.removeEventListener('pointermove', onPointerMove)
      canvas.removeEventListener('pointerleave', onPointerLeave)
    }
  }, [])

  return (
    <div className={cn('relative', className)}>
      <canvas ref={canvasRef} className="h-full w-full" aria-hidden />
      <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <span className="mono-label">Signal observatory</span>
          <span className="rounded-[3px] border border-line bg-surface/80 px-2 py-0.5 font-mono text-[0.58rem] uppercase tracking-[0.14em] text-faint">
            Sample
          </span>
        </div>
        <div className="flex items-end justify-between gap-3">
          <span className="font-mono text-[0.6rem] uppercase tracking-[0.14em] text-faint">
            reading · example-dental-clinic.com
          </span>
          <span className="font-mono text-[0.6rem] uppercase tracking-[0.14em] text-faint">illustrative</span>
        </div>
      </div>
    </div>
  )
}
