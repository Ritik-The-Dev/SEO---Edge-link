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
 *
 * V2: Added coloured signal sectors (technical, performance, content, schema),
 * dual orbital rings with different inclinations, a radial measurement arc,
 * animated scan pulse, and more coordinate ticks.
 */

interface SignalPoint {
  label: string
  lat: number
  lon: number
  category: 'technical' | 'performance' | 'content' | 'schema'
  status: 'pass' | 'warn' | 'fail'
}

const SIGNALS: SignalPoint[] = [
  { label: 'LCP', lat: 22, lon: 18, category: 'performance', status: 'fail' },
  { label: 'CLS', lat: -38, lon: 96, category: 'performance', status: 'pass' },
  { label: 'JSON-LD', lat: 52, lon: 204, category: 'schema', status: 'fail' },
  { label: 'H1', lat: -8, lon: 286, category: 'content', status: 'fail' },
  { label: 'SITEMAP', lat: 44, lon: 66, category: 'technical', status: 'pass' },
  { label: 'CANONICAL', lat: -52, lon: 236, category: 'technical', status: 'warn' },
  { label: 'INP', lat: -18, lon: 142, category: 'performance', status: 'warn' },
  { label: 'ROBOTS', lat: 30, lon: 320, category: 'technical', status: 'pass' },
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
    const warn = token('--warn', '38 78% 62%')
    const critical = token('--critical', '7 70% 62%')
    const info = token('--info', '199 68% 64%')

    // Category → colour mapping
    const categoryColor = {
      technical: accent,
      performance: warn,
      content: critical,
      schema: info,
    }
    const statusAlpha = { pass: 0.95, warn: 0.85, fail: 0.80 }

    let width = 0
    let height = 0
    let dpr = 1
    let raf = 0
    let angle = 0
    let tilt = -0.12
    let targetTilt = -0.12
    let visible = true
    let lastFrame = 0
    let scanAngle = 0

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

      // ── Ambient halo ──────────────────────────────────────────────
      const glow = ctx.createRadialGradient(width / 2, height / 2, radius * 0.1, width / 2, height / 2, radius * 2.4)
      glow.addColorStop(0, `hsl(${accent} / 0.12)`)
      glow.addColorStop(0.45, `hsl(${accent} / 0.04)`)
      glow.addColorStop(1, 'transparent')
      ctx.fillStyle = glow
      ctx.fillRect(0, 0, width, height)

      // ── Concentric guide rings (3) ────────────────────────────────
      ctx.strokeStyle = `hsl(${line} / 0.7)`
      ctx.lineWidth = 1
      for (const factor of [0.42, 0.72, 1.0]) {
        ctx.beginPath()
        ctx.ellipse(width / 2, height / 2, radius * factor, radius * factor * 0.985, 0, 0, Math.PI * 2)
        ctx.stroke()
      }

      // Faint outer measurement ring
      ctx.strokeStyle = `hsl(${accent} / 0.12)`
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.ellipse(width / 2, height / 2, radius * 1.32, radius * 1.32 * 0.985, 0, 0, Math.PI * 2)
      ctx.stroke()

      // ── Crosshair ─────────────────────────────────────────────────
      ctx.strokeStyle = `hsl(${line} / 0.55)`
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(width / 2 - radius * 1.4, height / 2)
      ctx.lineTo(width / 2 + radius * 1.4, height / 2)
      ctx.moveTo(width / 2, height / 2 - radius * 1.4)
      ctx.lineTo(width / 2, height / 2 + radius * 1.4)
      ctx.stroke()

      // ── Point field ───────────────────────────────────────────────
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

      // ── Scan meridian (animated) ───────────────────────────────────
      ctx.beginPath()
      for (let i = 0; i <= 60; i += 1) {
        const lat = -90 + i * 3
        const point = project(lat, 0, radius, spin, tilt)
        if (i === 0) ctx.moveTo(point.x, point.y)
        else ctx.lineTo(point.x, point.y)
      }
      ctx.strokeStyle = `hsl(${accent} / 0.38)`
      ctx.lineWidth = 1.2
      ctx.stroke()

      // ── Scan pulse glow on the meridian ───────────────────────────
      if (!reduceMotion) {
        const scanLat = -90 + ((scanAngle % 180) / 180) * 180
        const scanPoint = project(scanLat, 0, radius, spin, tilt)
        const pulseGlow = ctx.createRadialGradient(scanPoint.x, scanPoint.y, 0, scanPoint.x, scanPoint.y, radius * 0.22)
        pulseGlow.addColorStop(0, `hsl(${accent} / 0.28)`)
        pulseGlow.addColorStop(1, 'transparent')
        ctx.fillStyle = pulseGlow
        ctx.fillRect(0, 0, width, height)
      }

      // ── Primary orbit ring (tilted) ────────────────────────────────
      const drawOrbit = (inclinationOffset: number, speedFactor: number, alpha: number, lw: number) => {
        const orbitRadius = radius * 1.28
        ctx.beginPath()
        for (let i = 0; i <= 90; i += 1) {
          const lon = (i / 90) * 360
          const p = project(0, lon, orbitRadius, spin * speedFactor, tilt + inclinationOffset)
          if (i === 0) ctx.moveTo(p.x, p.y)
          else ctx.lineTo(p.x, p.y)
        }
        ctx.strokeStyle = `hsl(${accent} / ${alpha})`
        ctx.lineWidth = lw
        ctx.stroke()
      }
      drawOrbit(0.42, 0.6, 0.22, 1)
      drawOrbit(1.1, 0.35, 0.1, 0.8)

      // ── Signal arc links ───────────────────────────────────────────
      ctx.lineWidth = 1
      for (let i = 0; i < SIGNALS.length; i += 1) {
        const from = SIGNALS[i]
        const to = SIGNALS[(i + 1) % SIGNALS.length]
        if (!from || !to) continue
        const a = project(from.lat, from.lon, radius * 1.02, spin, tilt)
        const b = project(to.lat, to.lon, radius * 1.02, spin, tilt)
        if (a.depth < 0.5 || b.depth < 0.5) continue
        const midX = (a.x + b.x) / 2
        const midY = (a.y + b.y) / 2
        const controlX = midX + (width / 2 - midX) * 0.16
        const controlY = midY + (height / 2 - midY) * 0.16
        ctx.beginPath()
        ctx.moveTo(a.x, a.y)
        ctx.quadraticCurveTo(controlX, controlY, b.x, b.y)
        ctx.strokeStyle = `hsl(${accent} / 0.14)`
        ctx.stroke()
      }

      // ── Coordinate ticks ───────────────────────────────────────────
      for (let i = 0; i < 120; i += 1) {
        const theta = (i / 120) * Math.PI * 2
        const major = i % 10 === 0
        const mid = i % 5 === 0
        const inner = radius * 1.09
        const outer = radius * (major ? 1.21 : mid ? 1.17 : 1.14)
        ctx.beginPath()
        ctx.moveTo(width / 2 + Math.cos(theta) * inner, height / 2 + Math.sin(theta) * inner)
        ctx.lineTo(width / 2 + Math.cos(theta) * outer, height / 2 + Math.sin(theta) * outer)
        ctx.strokeStyle = `hsl(${major ? accent : line} / ${major ? 0.42 : 0.45})`
        ctx.lineWidth = major ? 1.2 : 0.8
        ctx.stroke()
      }

      // Degree labels at major ticks
      ctx.fillStyle = `hsl(${accent} / 0.4)`
      ctx.font = '7px ui-monospace, SFMono-Regular, Menlo, monospace'
      ctx.textAlign = 'center'
      for (let i = 0; i < 12; i += 1) {
        const theta = (i / 12) * Math.PI * 2 - Math.PI / 2
        const deg = i * 30
        const r = radius * 1.27
        ctx.fillText(`${deg}°`, width / 2 + Math.cos(theta) * r, height / 2 + Math.sin(theta) * r + 3)
      }

      // ── Signal markers ─────────────────────────────────────────────
      SIGNALS.forEach((signal, index) => {
        const point = project(signal.lat, signal.lon, radius * 1.02, spin, tilt)
        const facing = point.depth > 0.46
        const alpha = facing ? statusAlpha[signal.status] : 0.2
        const markerSize = 2.8 * point.scale
        const colour = categoryColor[signal.category]

        // Outer ring
        ctx.strokeStyle = `hsl(${colour} / ${(alpha * 0.45).toFixed(2)})`
        ctx.lineWidth = 0.9
        ctx.beginPath()
        ctx.arc(point.x, point.y, markerSize * 3.6, 0, Math.PI * 2)
        ctx.stroke()

        // Fill dot (status-tinted)
        ctx.fillStyle = `hsl(${colour} / ${alpha.toFixed(2)})`
        ctx.beginPath()
        ctx.arc(point.x, point.y, markerSize, 0, Math.PI * 2)
        ctx.fill()

        // Label leader line and text for near-face signals
        if (facing) {
          const label = signal.label
          const right = point.x < width / 2
          const dir = right ? 1 : -1
          const elbowX = point.x + dir * 28
          const elbowY = point.y - 18 - (index % 3) * 4

          ctx.strokeStyle = `hsl(${colour} / 0.35)`
          ctx.lineWidth = 0.9
          ctx.beginPath()
          ctx.moveTo(point.x + dir * markerSize * 1.8, point.y)
          ctx.lineTo(elbowX, elbowY)
          ctx.lineTo(elbowX + dir * 18, elbowY)
          ctx.stroke()

          ctx.fillStyle = `hsl(${ink} / 0.75)`
          ctx.font = '9px ui-monospace, SFMono-Regular, Menlo, monospace'
          ctx.textAlign = dir === 1 ? 'left' : 'right'
          ctx.fillText(label, elbowX + dir * 22, elbowY + 3)

          // Status indicator dot next to label
          const statusColour =
            signal.status === 'pass' ? accent : signal.status === 'warn' ? warn : critical
          ctx.fillStyle = `hsl(${statusColour} / 0.8)`
          ctx.beginPath()
          ctx.arc(
            dir === 1 ? elbowX + dir * 22 + ctx.measureText(label).width + 4 : elbowX + dir * 22 - ctx.measureText(label).width - 4,
            elbowY + 0.5,
            2,
            0,
            Math.PI * 2,
          )
          ctx.fill()
        }
      })

      // ── Centre reticle ─────────────────────────────────────────────
      ctx.strokeStyle = `hsl(${accent} / 0.55)`
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.arc(width / 2, height / 2, 3, 0, Math.PI * 2)
      ctx.stroke()
      // Inner fill
      ctx.fillStyle = `hsl(${accent} / 0.3)`
      ctx.beginPath()
      ctx.arc(width / 2, height / 2, 1.5, 0, Math.PI * 2)
      ctx.fill()

      if (!reduceMotion) {
        angle += 0.0022
        scanAngle += 1.2
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
          <div>
            <span className="mono-label">Signal observatory</span>
            <div className="mt-1.5 flex items-center gap-2.5">
              {[
                { label: 'Technical', col: 'bg-accent' },
                { label: 'Performance', col: 'bg-warn' },
                { label: 'Content', col: 'bg-critical' },
                { label: 'Schema', col: 'bg-info' },
              ].map((cat) => (
                <span key={cat.label} className="flex items-center gap-1">
                  <span className={`h-1.5 w-1.5 rounded-full ${cat.col} opacity-70`} aria-hidden />
                  <span className="font-mono text-[0.46rem] uppercase tracking-[0.12em] text-faint">{cat.label}</span>
                </span>
              ))}
            </div>
          </div>
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
