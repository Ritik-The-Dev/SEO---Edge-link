'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  CalendarClock,
  ChevronLeft,
  FileText,
  Globe,
  LayoutDashboard,
  LogOut,
  PanelLeft,
  ScanLine,
  Settings2,
  Users,
} from 'lucide-react'
import { Wordmark } from '@/components/brand'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import { CommandPalette } from './command-palette'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn, initials } from '@/lib/utils'

export interface ShellUser {
  id: string
  name: string
  email: string
  role: 'ADMIN' | 'CLIENT'
}

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}

const ADMIN_NAV: NavItem[] = [
  { href: '/app', label: 'Overview', icon: LayoutDashboard },
  { href: '/app/clients', label: 'Clients', icon: Users },
  { href: '/app/websites', label: 'Websites', icon: Globe },
  { href: '/app/audits', label: 'Audits', icon: ScanLine },
  { href: '/app/reports', label: 'Reports', icon: FileText },
  { href: '/app/schedules', label: 'Schedules', icon: CalendarClock },
  { href: '/app/settings', label: 'Settings', icon: Settings2 },
]

const CLIENT_NAV: NavItem[] = [
  { href: '/client', label: 'Overview', icon: LayoutDashboard },
  { href: '/client/audits', label: 'Audits', icon: ScanLine },
  { href: '/client/reports', label: 'Reports', icon: FileText },
]

const SEGMENT_LABELS: Record<string, string> = {
  app: 'Workspace',
  client: 'Client portal',
  clients: 'Clients',
  websites: 'Websites',
  audits: 'Audits',
  reports: 'Reports',
  schedules: 'Schedules',
  settings: 'Settings',
  new: 'New',
}

export function AppShell({
  user,
  children,
  variant,
}: {
  user: ShellUser
  children: React.ReactNode
  variant: 'admin' | 'client'
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const nav = variant === 'admin' ? ADMIN_NAV : CLIENT_NAV

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem('edgelink-sidebar') === 'collapsed')
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  const toggleCollapsed = () => {
    setCollapsed((value) => {
      const next = !value
      try {
        localStorage.setItem('edgelink-sidebar', next ? 'collapsed' : 'expanded')
      } catch {
        /* ignore */
      }
      return next
    })
  }

  const isActive = (href: string) => {
    if (href === '/app' || href === '/client') return pathname === href
    return pathname === href || pathname.startsWith(`${href}/`)
  }

  const signOut = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  const crumbs = pathname.split('/').filter(Boolean)

  return (
    <div className="min-h-screen bg-canvas">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-sm focus:bg-accent focus:px-3 focus:py-2 focus:text-xs focus:text-[hsl(var(--accent-ink))]"
      >
        Skip to content
      </a>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={cn(
            'sticky top-0 hidden h-screen shrink-0 flex-col border-r border-line bg-surface transition-[width] duration-200 lg:flex',
            collapsed ? 'w-[68px]' : 'w-[248px]',
          )}
        >
          {/* Sidebar brand header */}
          <div
            className={cn(
              'flex h-16 items-center border-b border-line',
              collapsed ? 'justify-center px-2' : 'px-5',
            )}
          >
            {collapsed ? (
              <Link href={variant === 'admin' ? '/app' : '/client'}>
                <Wordmark compact className="[&>span:last-child]:hidden" />
              </Link>
            ) : (
              <Link href={variant === 'admin' ? '/app' : '/client'}>
                <Wordmark />
              </Link>
            )}
          </div>

          <nav className="flex-1 space-y-0.5 overflow-y-auto p-2.5" aria-label="Primary">
            {!collapsed ? <div className="mono-label px-2.5 pb-2.5 pt-1.5">Workspace</div> : null}
            {nav.map((item) => {
              const active = isActive(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    'group relative flex items-center gap-3 rounded-sm px-2.5 py-2.5 text-[0.8rem] transition-all duration-150',
                    active
                      ? 'bg-raised text-ink'
                      : 'text-muted hover:bg-raised/70 hover:text-ink',
                    collapsed && 'justify-center px-0',
                  )}
                  aria-current={active ? 'page' : undefined}
                >
                  {active ? <span className="nav-active-bar" /> : null}
                  <item.icon
                    className={cn(
                      'h-4 w-4 shrink-0 transition-colors',
                      active ? 'text-accent' : 'text-faint group-hover:text-muted',
                    )}
                  />
                  {!collapsed ? (
                    <span className={cn('flex-1 truncate', active && 'font-medium')}>{item.label}</span>
                  ) : null}
                  {active && !collapsed ? (
                    <span className="h-1 w-1 rounded-full bg-accent opacity-70" aria-hidden />
                  ) : null}
                </Link>
              )
            })}
          </nav>

          <div className="border-t border-line p-2.5">
            {!collapsed ? (
              <div className="mb-2 flex items-center gap-1.5 px-2">
                <Badge tone="accent" mono>
                  Live pipeline
                </Badge>
              </div>
            ) : null}
            <button
              onClick={toggleCollapsed}
              className={cn(
                'flex w-full items-center gap-2 rounded-sm px-2 py-2 text-[0.72rem] text-faint transition-colors hover:bg-raised hover:text-ink',
                collapsed && 'justify-center',
              )}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? <PanelLeft className="h-4 w-4" /> : <ChevronLeft className="h-3.5 w-3.5" />}
              {!collapsed ? <span>Collapse</span> : null}
            </button>
          </div>
        </aside>

        {/* Mobile drawer */}
        {mobileOpen ? (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-[hsl(var(--canvas))]/80" onClick={() => setMobileOpen(false)} />
            <div className="absolute inset-y-0 left-0 w-[264px] border-r border-line bg-surface p-4">
              <Wordmark className="mb-6" />
              <nav className="space-y-1" aria-label="Primary mobile">
                {nav.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 rounded-sm px-2.5 py-2.5 text-sm',
                      isActive(item.href) ? 'bg-raised text-ink' : 'text-muted',
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
          </div>
        ) : null}

        {/* Main column */}
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-line bg-canvas/85 backdrop-blur-md">
            <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6">
              <div className="flex min-w-0 items-center gap-3">
                <button
                  className="rounded-sm p-1.5 text-muted hover:bg-raised lg:hidden"
                  onClick={() => setMobileOpen(true)}
                  aria-label="Open navigation"
                >
                  <PanelLeft className="h-4 w-4" />
                </button>
                <nav aria-label="Breadcrumb" className="hidden min-w-0 items-center gap-1.5 text-xs sm:flex">
                  {crumbs.map((segment, index) => {
                    const href = `/${crumbs.slice(0, index + 1).join('/')}`
                    const last = index === crumbs.length - 1
                    const isId = /^[a-z0-9]{20,}$/i.test(segment)
                    const label = isId ? 'Detail' : SEGMENT_LABELS[segment] ?? segment
                    return (
                      <span key={href} className="flex items-center gap-1.5">
                        {index > 0 ? <span className="text-faint">/</span> : null}
                        {last ? (
                          <span className="truncate text-ink">{label}</span>
                        ) : (
                          <Link href={href} className="text-faint transition-colors hover:text-muted">
                            {label}
                          </Link>
                        )}
                      </span>
                    )
                  })}
                </nav>
                <span className="text-sm font-medium sm:hidden">{variant === 'admin' ? 'EdgeLink' : 'Client portal'}</span>
              </div>

              <div className="flex items-center gap-1.5">
                <CommandPalette variant={variant} />
                <ThemeToggle />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="flex items-center gap-2 rounded-sm border border-line px-2 py-1.5 text-xs transition-colors hover:bg-raised"
                      aria-label="Account menu"
                    >
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent-soft font-mono text-[0.6rem] font-semibold text-accent">
                        {initials(user.name)}
                      </span>
                      <span className="hidden max-w-[120px] truncate text-muted sm:inline">{user.name}</span>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>{user.role === 'ADMIN' ? 'Administrator' : 'Client'}</DropdownMenuLabel>
                    <div className="px-2.5 pb-2 text-[0.7rem] text-faint">{user.email}</div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href={variant === 'admin' ? '/app/settings' : '/client'}>
                        <Settings2 className="h-3.5 w-3.5" /> Account settings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={signOut}>
                      <LogOut className="h-3.5 w-3.5" /> Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </header>

          <main id="main" className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-6 sm:px-6 sm:py-8">
            {children}
          </main>
          <footer className="border-t border-line px-4 py-4 sm:px-6">
            <div className="flex flex-wrap items-center justify-between gap-2 text-2xs text-faint">
              <span>EdgeLink — SEO Intelligence · technical audits, not ranking guarantees.</span>
              <span className="font-mono">
                {variant === 'admin' ? 'admin workspace' : 'client portal'} · {user.email}
              </span>
            </div>
          </footer>
        </div>
      </div>
    </div>
  )
}

export function PageHeader({
  title,
  description,
  actions,
  eyebrow,
}: {
  title: React.ReactNode
  description?: React.ReactNode
  actions?: React.ReactNode
  eyebrow?: string
}) {
  return (
    <div className="mb-7 flex flex-col gap-4 border-b border-line pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow ? <div className="mono-label mb-2">{eyebrow}</div> : null}
        <h1 className="font-display text-[1.9rem] leading-[1.05] tracking-[-0.01em] sm:text-[2.2rem]">{title}</h1>
        {description ? <p className="mt-2 max-w-2xl text-xs leading-relaxed text-muted">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  )
}

export function AdminNewAuditButton() {
  return (
    <Button asChild size="sm">
      <Link href="/app/audits/new">
        <ScanLine className="h-3.5 w-3.5" /> Run audit
      </Link>
    </Button>
  )
}
