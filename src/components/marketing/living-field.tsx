'use client'

import { useEffect, useRef } from 'react'

/**
 * Ambient "living field" behind the marketing page.
 *
 * A low-density constellation of signal nodes that drift, connect when close,
 * and lean away from the pointer. Canvas 2D, capped DPR, ~30 fps, paused when
 * the tab is hidden. Under prefers-reduced-motion it renders one static frame
 * and never registers pointer handlers.
 *
 * The same pointer drive feeds the CSS aurora gradient (--aurora-x/y), so the
 * whole page reacts to the visitor without ever competing with the content.
 */
export function LivingField() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const auraRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const ring = window.matchMedia('(pointer: fine)').matches

    const styles = getComputedStyle(document.documentElement)
    const accent = styles.getPropertyValue('--accent').trim() || '160 74% 51%'
    const muted = styles.getPropertyValue('--muted-ink').trim() || '150 6% 62%'
    const ink = styles.getPropertyValue('--ink').trim() || '42 24% 93%'

    let width = 0
    let height = 0
    let dpr = 1
    let raf = 0
    let running = true
    let last = 0
    const pointer = { x: -999, y: -999, active: false }

    type Node = { x: number; y: number; vx: number; vy: number; r: number; hue: string }
    let nodes: Node[] = []

    const seed = () => {
      const count = Math.round(Math.min(78, Math.max(36, (width * height) / 26000)))
      nodes = Array.from({ length: count }, (_, i) => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.12,
        vy: (Math.random() - 0.5) * 0.12,
        r: Math.random() * 1.1 + 0.5,
        hue: i % 7 === 0 ? accent : i % 5 === 0 ? ink : muted,
      }))
    }

    const resize = () => {
      width = window.innerWidth
      height = window.innerHeight
      dpr = Math.min(window.devicePixelRatio || 1, 1.5)
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      seed()
      if (reduce) draw()
    }

    const draw = () => {
      ctx.clearRect(0, 0, width, height)
      const link = width < 640 ? 92 : 132

      for (const node of nodes) {
        if (!reduce) {
          node.x += node.vx
          node.y += node.vy
        }
        if (node.x < -20) node.x = width + 20
        if (node.x > width + 20) node.x = -20
        if (node.y < -20) node.y = height + 20
        if (node.y > height + 20) node.y = -20
      }

      // Connections first, so nodes sit on top.
      for (let i = 0; i < nodes.length; i += 1) {
        const a = nodes[i]
        if (!a) continue
        for (let j = i + 1; j < nodes.length; j += 1) {
          const b = nodes[j]
          if (!b) continue
          const dx = a.x - b.x
          const dy = a.y - b.y
          const dist = Math.hypot(dx, dy)
          if (dist > link) continue
          const alpha = (1 - dist / link) * 0.11
          ctx.strokeStyle = `hsl(${accent} / ${alpha.toFixed(3)})`
          ctx.lineWidth = 0.6
          ctx.beginPath()
          ctx.moveTo(a.x, a.y)
          ctx.lineTo(b.x, b.y)
          ctx.stroke()
        }
      }

      for (const node of nodes) {
        const depth = 0.35 + Math.sin((node.x + node.y) * 0.01) * 0.12
        ctx.fillStyle = `hsl(${node.hue} / ${depth.toFixed(3)})`
        ctx.beginPath()
        ctx.arc(node.x, node.y, node.r, 0, Math.PI * 2)
        ctx.fill()
      }

      if (pointer.active && ring) {
        const glow = ctx.createRadialGradient(pointer.x, pointer.y, 0, pointer.x, pointer.y, 190)
        glow.addColorStop(0, `hsl(${accent} / 0.10)`)
        glow.addColorStop(0.5, `hsl(${accent} / 0.035)`)
        glow.addColorStop(1, 'transparent')
        ctx.fillStyle = glow
        ctx.fillRect(pointer.x - 190, pointer.y - 190, 380, 380)
      }
    }

    const tick = (time: number) => {
      if (!running) return
      raf = requestAnimationFrame(tick)
      if (time - last < 33) return
      last = time
      draw()
    }

    const onPointer = (event: PointerEvent) => {
      pointer.x = event.clientX
      pointer.y = event.clientY
      pointer.active = true
      // Ease nearby nodes away from the pointer.
      for (const node of nodes) {
        const dx = node.x - event.clientX
        const dy = node.y - event.clientY
        const dist = Math.hypot(dx, dy)
        if (dist < 120 && dist > 0.001) {
          node.vx += (dx / dist) * 0.006
          node.vy += (dy / dist) * 0.006
          node.vx = Math.max(-0.5, Math.min(0.5, node.vx))
          node.vy = Math.max(-0.5, Math.min(0.5, node.vy))
        }
      }
      const aura = auraRef.current
      if (aura) {
        aura.style.setProperty('--aurora-x', `${(event.clientX / window.innerWidth) * 100}%`)
        aura.style.setProperty('--aurora-y', `${(event.clientY / window.innerHeight) * 100}%`)
      }
    }

    const onLeave = () => {
      pointer.active = false
    }

    const onVisibility = () => {
      running = !document.hidden
      if (running && !reduce) {
        last = 0
        raf = requestAnimationFrame(tick)
      }
    }

    resize()
    if (!reduce) {
      raf = requestAnimationFrame(tick)
      if (ring) {
        window.addEventListener('pointermove', onPointer, { passive: true })
        window.addEventListener('pointerleave', onLeave)
      }
    }
    window.addEventListener('resize', resize)
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', onPointer)
      window.removeEventListener('pointerleave', onLeave)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  return (
    <>
      <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 z-0 opacity-70" aria-hidden />
      <div
        ref={auraRef}
        className="aurora pointer-events-none fixed inset-0 z-0 opacity-80"
        aria-hidden
      />
    </>
  )
}
