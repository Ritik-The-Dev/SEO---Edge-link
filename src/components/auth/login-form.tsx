'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowRight, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Field, FormAlert, Input } from '@/components/ui/input'

export function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = (await response.json()) as {
        error?: { message?: string }
        redirectTo?: string
      }
      if (!response.ok) {
        setError(data.error?.message ?? 'Could not sign in')
        return
      }
      const next = params.get('next')
      const target = next && next.startsWith('/') ? next : (data.redirectTo ?? '/app')
      router.push(target)
      router.refresh()
    } catch {
      setError('Network error — check your connection and try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {error ? <FormAlert>{error}</FormAlert> : null}

      <Field label="Work email" htmlFor="email">
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@agency.com"
        />
      </Field>

      <Field label="Password" htmlFor="password">
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="••••••••"
        />
      </Field>

      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {submitting ? 'Signing in…' : 'Sign in'}
        {!submitting ? <ArrowRight className="h-4 w-4" /> : null}
      </Button>

      <p className="pt-1 text-2xs leading-relaxed text-faint">
        Sessions are signed HttpOnly cookies, valid for eight hours. Access is verified against the database on every
        request.
      </p>
    </form>
  )
}
