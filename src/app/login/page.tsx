import { Suspense } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { Wordmark } from '@/components/brand'
import { LoginForm } from '@/components/auth/login-form'
import { SignalObservatory } from '@/components/marketing/signal-observatory'
import { Badge } from '@/components/ui/badge'

export const metadata = { title: 'Sign in' }

export default async function LoginPage() {
  const user = await getCurrentUser()
  if (user) redirect(user.role === 'ADMIN' ? '/app' : '/client')

  const isDev = process.env.NODE_ENV !== 'production'

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[1.05fr_1fr]">
      <div className="relative hidden overflow-hidden border-r border-line bg-surface lg:flex lg:flex-col lg:justify-between">
        <div className="pointer-events-none absolute inset-0 grid-lines opacity-30" />
        <div className="relative flex items-center justify-between p-8">
          <Link href="/">
            <Wordmark />
          </Link>
          <Badge tone="outline" mono>
            workspace
          </Badge>
        </div>

        <div className="relative px-8">
          <div className="panel overflow-hidden">
            <SignalObservatory className="aspect-square w-full" />
          </div>
          <h1 className="mt-8 max-w-sm font-display text-4xl leading-[1.02] tracking-[-0.01em]">
            The signals are already there. <em className="italic text-accent">Read them.</em>
          </h1>
          <p className="mt-4 max-w-sm text-xs leading-relaxed text-muted">
            Technical audits, AI-assisted analysis and client-ready reports for every website you manage.
          </p>
        </div>

        <div className="relative flex items-center justify-between border-t border-line p-8 font-mono text-[0.58rem] uppercase tracking-[0.16em] text-faint">
          <span>Edgelink Technology</span>
          <span>SEO intelligence</span>
        </div>
      </div>

      <main id="main" className="flex min-h-screen flex-col justify-center px-5 py-12 sm:px-10 lg:px-16">
        <div className="mx-auto w-full max-w-sm">
          <Link href="/" className="mb-10 inline-flex items-center gap-2 text-xs text-faint transition-colors hover:text-ink lg:hidden">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to site
          </Link>
          <div className="mb-8 lg:hidden">
            <Wordmark />
          </div>

          <div className="mono-label">Client &amp; admin access</div>
          <h2 className="mt-3 font-display text-3xl leading-tight">Sign in to EdgeLink</h2>
          <p className="mt-2 text-xs leading-relaxed text-muted">
            Admins manage clients, websites, audits and schedules. Clients see only their own websites and reports.
          </p>

          <div className="mt-8">
            <Suspense fallback={<div className="h-64 animate-pulse rounded-sm bg-raised" />}>
              <LoginForm />
            </Suspense>
          </div>

          {isDev ? (
            <div className="mt-8 rounded-sm border border-line bg-surface p-4">
              <div className="mono-label">Seeded development accounts</div>
              <dl className="mt-2.5 space-y-2 font-mono text-[0.65rem] text-muted">
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="text-faint">admin</dt>
                  <dd className="text-right">admin@edgelink.test · EdgelinkAdmin!2026</dd>
                </div>
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="text-faint">client</dt>
                  <dd className="text-right">client@northstar.test · EdgelinkClient!2026</dd>
                </div>
              </dl>
              <p className="mt-3 text-2xs leading-relaxed text-faint">
                Local only — override with SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD before seeding any shared
                environment.
              </p>
            </div>
          ) : null}
        </div>
      </main>
    </div>
  )
}
