'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import { Wordmark } from '@/components/brand'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import { cn } from '@/lib/utils'

const LINKS = [
  { href: '#platform', label: 'Platform' },
  { href: '#workflow', label: 'Workflow' },
  { href: '#reports', label: 'Reports' },
  { href: '#security', label: 'Security' },
]

export function SiteHeader({ signedIn }: { signedIn: boolean }) {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={cn(
        'sticky top-0 z-40 border-b transition-colors duration-300',
        scrolled ? 'border-line bg-canvas/90 backdrop-blur-md' : 'border-transparent bg-transparent',
      )}
    >
      <div className="mx-auto flex h-16 w-full max-w-[1280px] items-center justify-between gap-6 px-5 lg:px-8">
        <Link href="/">
          <Wordmark />
        </Link>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Sections">
          {LINKS.map((link) => (
            <a key={link.href} href={link.href} className="link-underline text-xs text-muted transition-colors hover:text-ink">
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <ThemeToggle />
          {signedIn ? (
            <Button asChild variant="secondary" size="sm">
              <Link href="/app">Open workspace</Link>
            </Button>
          ) : (
            <Button asChild variant="ghost" size="sm">
              <Link href="/login">Sign in</Link>
            </Button>
          )}
          <Button asChild size="sm">
            <Link href="/app/audits/new">Run an SEO audit</Link>
          </Button>
        </div>

        <button
          className="rounded-sm border border-line p-2 text-muted md:hidden"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-label={open ? 'Close menu' : 'Open menu'}
        >
          {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </div>

      {open ? (
        <div className="border-t border-line bg-surface px-5 py-5 md:hidden">
          <nav className="flex flex-col gap-1" aria-label="Sections mobile">
            {LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-sm px-2 py-2.5 text-sm text-muted hover:bg-raised hover:text-ink"
              >
                {link.label}
              </a>
            ))}
          </nav>
          <div className="mt-4 flex flex-col gap-2 border-t border-line pt-4">
            {signedIn ? (
              <Button asChild variant="secondary">
                <Link href="/app">Open workspace</Link>
              </Button>
            ) : (
              <Button asChild variant="secondary">
                <Link href="/login">Sign in</Link>
              </Button>
            )}
            <Button asChild>
              <Link href="/app/audits/new">Run an SEO audit</Link>
            </Button>
            <div className="flex justify-end pt-1">
              <ThemeToggle />
            </div>
          </div>
        </div>
      ) : null}
    </header>
  )
}
