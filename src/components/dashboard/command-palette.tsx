'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  CalendarClock,
  FileText,
  Globe,
  LayoutDashboard,
  Plus,
  ScanLine,
  Search,
  Settings2,
  Users,
} from 'lucide-react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

/**
 * Keyboard-first command palette (⌘K / Ctrl+K).
 * Every entry navigates to a real route — no placeholder commands.
 */
export function CommandPalette({ variant }: { variant: 'admin' | 'client' }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const items = useMemo(() => {
    if (variant === 'client') {
      return [
        { label: 'Overview', group: 'Navigate', href: '/client', icon: LayoutDashboard },
        { label: 'Audit history', group: 'Navigate', href: '/client/audits', icon: ScanLine },
        { label: 'Reports', group: 'Navigate', href: '/client/reports', icon: FileText },
      ]
    }
    return [
      { label: 'Overview', group: 'Navigate', href: '/app', icon: LayoutDashboard },
      { label: 'Clients', group: 'Navigate', href: '/app/clients', icon: Users },
      { label: 'Websites', group: 'Navigate', href: '/app/websites', icon: Globe },
      { label: 'Audits', group: 'Navigate', href: '/app/audits', icon: ScanLine },
      { label: 'Reports', group: 'Navigate', href: '/app/reports', icon: FileText },
      { label: 'Schedules', group: 'Navigate', href: '/app/schedules', icon: CalendarClock },
      { label: 'Settings', group: 'Navigate', href: '/app/settings', icon: Settings2 },
      { label: 'Run a new audit', group: 'Actions', href: '/app/audits/new', icon: Plus },
      { label: 'Add a client', group: 'Actions', href: '/app/clients/new', icon: Plus },
    ]
  }, [variant])

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!term) return items
    return items.filter((item) => `${item.label} ${item.group}`.toLowerCase().includes(term))
  }, [items, query])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setOpen((value) => !value)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  useEffect(() => {
    if (open) {
      setQuery('')
      setActive(0)
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [open])

  const go = (href: string) => {
    setOpen(false)
    router.push(href)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="group flex items-center gap-2 rounded-sm border border-line bg-surface px-2.5 py-1.5 text-2xs text-faint transition-colors hover:border-muted hover:text-muted"
        aria-label="Open command palette"
      >
        <Search className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Search or jump to…</span>
        <kbd className="ml-1 hidden rounded-[3px] border border-line bg-raised px-1.5 py-0.5 font-mono text-[0.6rem] sm:inline">
          ⌘K
        </kbd>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent hideClose className="max-w-xl gap-0 p-0">
          <div className="flex items-center gap-2 border-b border-line px-4">
            <Search className="h-4 w-4 text-faint" />
            <input
              ref={inputRef}
              value={query}
              onChange={(event) => {
                setQuery(event.target.value)
                setActive(0)
              }}
              onKeyDown={(event) => {
                if (event.key === 'ArrowDown') {
                  event.preventDefault()
                  setActive((index) => Math.min(index + 1, filtered.length - 1))
                } else if (event.key === 'ArrowUp') {
                  event.preventDefault()
                  setActive((index) => Math.max(index - 1, 0))
                } else if (event.key === 'Enter') {
                  const item = filtered[active]
                  if (item) go(item.href)
                }
              }}
              placeholder="Search pages and actions"
              aria-label="Command palette search"
              className="h-12 w-full bg-transparent text-sm text-ink placeholder:text-faint focus:outline-none"
            />
          </div>
          <div className="max-h-[320px] overflow-y-auto p-2">
            {filtered.length === 0 ? (
              <p className="px-3 py-8 text-center text-xs text-faint">No matches. Try “audits” or “reports”.</p>
            ) : (
              filtered.map((item, index) => {
                const Icon = item.icon
                return (
                  <button
                    key={`${item.group}-${item.href}-${item.label}`}
                    onMouseEnter={() => setActive(index)}
                    onClick={() => go(item.href)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-sm px-3 py-2.5 text-left text-xs transition-colors',
                      index === active ? 'bg-raised text-ink' : 'text-muted',
                    )}
                  >
                    <Icon className="h-3.5 w-3.5 text-faint" />
                    <span className="flex-1">{item.label}</span>
                    <span className="font-mono text-[0.6rem] uppercase tracking-[0.14em] text-faint">{item.group}</span>
                  </button>
                )
              })
            )}
          </div>
          <div className="flex items-center justify-between border-t border-line px-4 py-2 text-[0.6rem] text-faint">
            <span className="font-mono">↑↓ navigate · ↵ open · esc close</span>
            <span className="font-mono">EdgeLink</span>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
