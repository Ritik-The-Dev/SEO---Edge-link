'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface InteractiveCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  tilt?: boolean
  glow?: boolean
  float?: boolean
}

export function InteractiveCard({ 
  children, 
  className, 
  tilt = true, 
  glow = true,
  float = false,
  ...props 
}: InteractiveCardProps) {
  const [mousePosition, setMousePosition] = React.useState({ x: 0, y: 0 })
  const [isHovered, setIsHovered] = React.useState(false)
  const cardRef = React.useRef<HTMLDivElement>(null)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current || !tilt) return
    const rect = cardRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    setMousePosition({ x, y })
  }

  const handleMouseEnter = () => setIsHovered(true)
  const handleMouseLeave = () => {
    setIsHovered(false)
    setMousePosition({ x: 0, y: 0 })
  }

  const rect = cardRef.current?.getBoundingClientRect()
  const tiltStyle = tilt && isHovered && rect ? {
    transform: `perspective(1000px) rotateX(${(mousePosition.y / rect.height - 0.5) * -10}deg) rotateY(${(mousePosition.x / rect.width - 0.5) * 10}deg)`,
    transition: 'transform 0.1s ease-out'
  } : {}

  return (
    <div
      ref={cardRef}
      className={cn(
        'relative rounded-2xl border border-line/50 bg-gradient-to-br from-surface/80 to-raised/80 backdrop-blur-xl transition-all duration-300',
        glow && 'hover:shadow-glow-accent',
        float && 'floating',
        className
      )}
      style={tiltStyle}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {glow && isHovered && (
        <div
          className="absolute inset-0 rounded-2xl opacity-30 pointer-events-none"
          style={{
            background: `radial-gradient(circle at ${mousePosition.x}px ${mousePosition.y}px, hsl(var(--gradient-1) / 0.4), transparent 50%)`
          }}
        />
      )}
      <div className="relative z-10">{children}</div>
    </div>
  )
}
