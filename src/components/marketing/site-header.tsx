'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import { Wordmark } from '@/components/brand'
import { Magnetic } from '@/components/marketing/magnetic'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import { cn } from '@/lib/utils'

const LINKS = [
  { id: 'platform', label: 'Workspace' },
  { id: 'how', label: 'Instrument' },
  { id: 'journey', label: 'Pipeline' },
  { id: 'reports', label: 'Reports' },
  { id: 'plans', label: 'How it converts' },
]

export function SiteHeader({ signedIn }: { signedIn: boolean }) {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState<string | null>(null)
  const progressRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let raf = 0

    const update = () => {
      raf = 0
      setScrolled(window.scrollY > 12)
      const max = document.documentElement.scrollHeight - window.innerHeight
      const ratio = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0
      if (progressRef.current) progressRef.current.style.transform = `scaleX(${ratio.toFixed(4)})`
    }

    const onScroll = () => {
      if (raf) return
      raf = requestAnimationFrame(update)
    }

    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)

    const sections = LINKS.map((link) => document.getElementById(link.id)).filter(
      (element): element is HTMLElement => Boolean(element),
    )
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
        if (visible) setActive(visible.target.id)
      },
      { rootMargin: '-45% 0px -45% 0px', threshold: [0, 0.2, 0.6] },
    )
    sections.forEach((section) => observer.observe(section))

    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      observer.disconnect()
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <header
      className={cn(
        'sticky top-0 z-40 transition-all duration-300',
        scrolled ? 'border-b border-line/70 bg-canvas/80 backdrop-blur-xl' : 'border-b border-transparent',
      )}
    >
      <div className="mx-auto flex h-16 w-full max-w-[1320px] items-center justify-between gap-6 px-5 lg:h-[4.5rem] lg:px-8">
        <Link href="/" className="group inline-flex shrink-0" aria-label="EdgeLink home">
          <Wordmark />
        </Link>

        <nav
          className="hidden items-center gap-0.5 rounded-full border border-line/70 bg-surface/50 p-1 backdrop-blur md:flex"
          aria-label="Sections"
        >
          {LINKS.map((link) => (
            <a
              key={link.id}
              href={`#${link.id}`}
              aria-current={active === link.id ? 'location' : undefined}
              className={cn(
                'relative rounded-full px-3.5 py-1.5 text-[0.72rem] font-medium transition-colors duration-200',
                active === link.id ? 'bg-accent/12 text-ink' : 'text-muted hover:text-ink',
              )}
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <ThemeToggle />
          {signedIn ? (
            <Button asChild variant="outline" size="sm" className="rounded-full">
              <Link href="/app">Workspace</Link>
            </Button>
          ) : (
            <Button asChild variant="ghost" size="sm" className="rounded-full">
              <Link href="/login">Sign in</Link>
            </Button>
          )}
          <Magnetic strength={0.2}>
            <Button asChild size="sm" className="rounded-full">
              <Link href={signedIn ? '/app/audits/new' : '/login'}>
                {signedIn ? 'New audit' : 'Get started'}
              </Link>
            </Button>
          </Magnetic>
        </div>

        <div className="flex items-center gap-1.5 md:hidden">
          <ThemeToggle />
          <button
            className="rounded-full border border-line bg-surface/70 p-2 text-muted transition-colors hover:text-ink"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? 'Close menu' : 'Open menu'}
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 h-px bg-transparent">
        <div
          ref={progressRef}
          className="h-full origin-left scale-x-0 bg-accent/70"
          aria-hidden
        />
      </div>

      {open ? (
        <div
          id="mobile-nav"
          className="border-t border-line/70 bg-canvas/95 px-5 pb-6 pt-4 backdrop-blur-xl md:hidden"
        >
          <nav className="flex flex-col gap-1" aria-label="Sections mobile">
            {LINKS.map((link) => (
              <a
                key={link.id}
                href={`#${link.id}`}
                onClick={() => setOpen(false)}
                className="rounded-xl px-3 py-2.5 text-sm font-medium text-muted transition-colors hover:bg-surface hover:text-ink"
              >
                {link.label}
              </a>
            ))}
          </nav>
          <div className="mt-4 flex flex-col gap-2 border-t border-line/70 pt-4">
            <Button asChild variant="outline">
              <Link href={signedIn ? '/app' : '/login'} onClick={() => setOpen(false)}>
                {signedIn ? 'Open workspace' : 'Sign in'}
              </Link>
            </Button>
            <Button asChild>
              <Link href={signedIn ? '/app/audits/new' : '/login'} onClick={() => setOpen(false)}>
                {signedIn ? 'Run a new audit' : 'Get started'}
              </Link>
            </Button>
          </div>
        </div>
      ) : null}
    </header>
  )
}
