'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Play, RotateCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FormAlert } from '@/components/ui/input'

export function RunAuditButton({
  websiteId,
  label = 'Run audit',
  size = 'sm',
  variant = 'secondary',
}: {
  websiteId: string
  label?: string
  size?: 'sm' | 'md'
  variant?: 'primary' | 'secondary' | 'outline'
}) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const run = async () => {
    setBusy(true)
    setError(null)
    try {
      const response = await fetch('/api/audits', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ websiteId }),
      })
      const data = (await response.json()) as { audit?: { id: string }; error?: { message?: string } }
      if (!response.ok || !data.audit) {
        setError(data.error?.message ?? 'Could not start the audit')
        return
      }
      router.push(`/app/audits/${data.audit.id}`)
    } catch {
      setError('Network error — try again')
    } finally {
      setBusy(false)
    }
  }

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <Button size={size} variant={variant} onClick={run} disabled={busy}>
        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
        {busy ? 'Queueing…' : label}
      </Button>
      {error ? <FormAlert>{error}</FormAlert> : null}
    </span>
  )
}

export function RetryAuditButton({ auditId }: { auditId: string }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const retry = async () => {
    setBusy(true)
    setError(null)
    try {
      const response = await fetch(`/api/audits/${auditId}/retry`, { method: 'POST' })
      const data = (await response.json()) as { error?: { message?: string } }
      if (!response.ok) {
        setError(data.error?.message ?? 'Could not retry the audit')
        return
      }
      router.refresh()
    } catch {
      setError('Network error — try again')
    } finally {
      setBusy(false)
    }
  }

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <Button size="sm" variant="secondary" onClick={retry} disabled={busy}>
        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCw className="h-3.5 w-3.5" />}
        {busy ? 'Retrying…' : 'Retry audit'}
      </Button>
      {error ? <FormAlert>{error}</FormAlert> : null}
    </span>
  )
}
