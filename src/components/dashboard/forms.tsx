'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Field, FormAlert, Input, Select, Textarea } from '@/components/ui/input'

type ApiError = { message?: string; details?: Array<{ path: string; message: string }> }

async function postJson(url: string, body: unknown) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = (await response.json().catch(() => ({}))) as { error?: ApiError } & Record<string, unknown>
  return { ok: response.ok, status: response.status, data }
}

function fieldError(error: ApiError | undefined, path: string): string | undefined {
  return error?.details?.find((detail) => detail.path === path)?.message
}

export function NewClientForm() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [company, setCompany] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [withPortal, setWithPortal] = useState(false)
  const [portalName, setPortalName] = useState('')
  const [portalEmail, setPortalEmail] = useState('')
  const [portalPassword, setPortalPassword] = useState('')
  const [error, setError] = useState<ApiError | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setBusy(true)
    setError(null)
    setMessage(null)
    const { ok, data } = await postJson('/api/clients', {
      name,
      company: company || undefined,
      contactEmail: contactEmail || undefined,
      phone: phone || undefined,
      notes: notes || undefined,
      ...(withPortal
        ? { portal: { name: portalName, email: portalEmail, password: portalPassword } }
        : {}),
    })
    setBusy(false)
    if (!ok) {
      setError(data.error ?? { message: 'Could not create the client' })
      return
    }
    const client = data.client as { id: string }
    router.push(`/app/clients/${client.id}`)
    router.refresh()
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      {error?.message ? <FormAlert>{error.message}</FormAlert> : null}
      {message ? <FormAlert tone="accent">{message}</FormAlert> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Client name" htmlFor="client-name" error={fieldError(error ?? undefined, 'name')}>
          <Input id="client-name" value={name} onChange={(event) => setName(event.target.value)} required placeholder="Northstar Dental Group" />
        </Field>
        <Field label="Company (optional)" htmlFor="client-company">
          <Input id="client-company" value={company} onChange={(event) => setCompany(event.target.value)} placeholder="Northstar Dental" />
        </Field>
        <Field
          label="Contact email (optional)"
          htmlFor="client-email"
          hint="Used for report delivery. Without it, email notifications are recorded as failed."
          error={fieldError(error ?? undefined, 'contactEmail')}
        >
          <Input id="client-email" type="email" value={contactEmail} onChange={(event) => setContactEmail(event.target.value)} placeholder="marketing@client.com" />
        </Field>
        <Field label="Phone (optional)" htmlFor="client-phone" hint="WhatsApp recipient for live delivery mode.">
          <Input id="client-phone" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+91 98765 43210" />
        </Field>
      </div>

      <Field label="Internal notes (optional)" htmlFor="client-notes">
        <Textarea id="client-notes" value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Context the team should know before running audits." />
      </Field>

      <div className="rounded-sm border border-line bg-surface p-4">
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={withPortal}
            onChange={(event) => setWithPortal(event.target.checked)}
            className="mt-0.5 h-3.5 w-3.5 accent-[hsl(var(--accent))]"
          />
          <span>
            <span className="block text-xs font-medium text-ink">Create portal access</span>
            <span className="mt-0.5 block text-2xs leading-relaxed text-muted">
              Adds a client user who can sign in and see only this client&apos;s websites and reports.
            </span>
          </span>
        </label>

        {withPortal ? (
          <div className="mt-4 grid gap-4 border-t border-line pt-4 sm:grid-cols-3">
            <Field label="Contact name" htmlFor="portal-name" error={fieldError(error ?? undefined, 'portal.name')}>
              <Input id="portal-name" value={portalName} onChange={(event) => setPortalName(event.target.value)} required={withPortal} />
            </Field>
            <Field label="Login email" htmlFor="portal-email" error={fieldError(error ?? undefined, 'portal.email')}>
              <Input id="portal-email" type="email" value={portalEmail} onChange={(event) => setPortalEmail(event.target.value)} required={withPortal} />
            </Field>
            <Field label="Temporary password" htmlFor="portal-password" hint="At least 8 characters." error={fieldError(error ?? undefined, 'portal.password')}>
              <Input id="portal-password" type="text" value={portalPassword} onChange={(event) => setPortalPassword(event.target.value)} required={withPortal} />
            </Field>
          </div>
        ) : null}
      </div>

      <Button type="submit" disabled={busy}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
        {busy ? 'Creating…' : 'Create client'}
      </Button>
    </form>
  )
}

export function AddWebsiteForm({
  clientId,
  defaultBusinessType = '',
  defaultCity = '',
  defaultState = '',
}: {
  clientId: string
  defaultBusinessType?: string
  defaultCity?: string
  defaultState?: string
}) {
  const router = useRouter()
  const [url, setUrl] = useState('')
  const [label, setLabel] = useState('')
  const [businessType, setBusinessType] = useState(defaultBusinessType)
  const [city, setCity] = useState(defaultCity)
  const [state, setState] = useState(defaultState)
  const [error, setError] = useState<ApiError | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setBusy(true)
    setError(null)
    setMessage(null)
    const { ok, data } = await postJson('/api/websites', {
      clientId,
      url,
      label: label || undefined,
      businessType,
      city,
      state,
    })
    setBusy(false)
    if (!ok) {
      setError(data.error ?? { message: 'Could not add the website' })
      return
    }
    setUrl('')
    setLabel('')
    setMessage('Website added. You can run its first audit now.')
    router.refresh()
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {error?.message ? <FormAlert>{error.message}</FormAlert> : null}
      {message ? <FormAlert tone="accent">{message}</FormAlert> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Website URL"
          htmlFor="website-url"
          hint="http(s) only. Private and local addresses are rejected."
          error={fieldError(error ?? undefined, 'url')}
          className="sm:col-span-2"
        >
          <Input id="website-url" value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://client-site.com" required />
        </Field>
        <Field label="Label (optional)" htmlFor="website-label">
          <Input id="website-label" value={label} onChange={(event) => setLabel(event.target.value)} placeholder="Primary clinic site" />
        </Field>
        <Field label="Business type" htmlFor="website-type" error={fieldError(error ?? undefined, 'businessType')}>
          <Input id="website-type" value={businessType} onChange={(event) => setBusinessType(event.target.value)} placeholder="Dental clinic" required />
        </Field>
        <Field label="City" htmlFor="website-city" error={fieldError(error ?? undefined, 'city')}>
          <Input id="website-city" value={city} onChange={(event) => setCity(event.target.value)} placeholder="Pune" required />
        </Field>
        <Field label="State" htmlFor="website-state" error={fieldError(error ?? undefined, 'state')}>
          <Input id="website-state" value={state} onChange={(event) => setState(event.target.value)} placeholder="Maharashtra" required />
        </Field>
      </div>

      <Button type="submit" variant="secondary" disabled={busy}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
        {busy ? 'Adding…' : 'Add website'}
      </Button>
    </form>
  )
}

export interface ClientOption {
  id: string
  name: string
  company: string | null
  websites: Array<{ id: string; url: string; label: string | null; businessType: string; city: string; state: string }>
}

export function NewAuditForm({ clients, mockMode }: { clients: ClientOption[]; mockMode: boolean }) {
  const router = useRouter()
  const [clientId, setClientId] = useState(clients.find((client) => client.websites.length > 0)?.id ?? clients[0]?.id ?? '')
  const [websiteId, setWebsiteId] = useState(
    clients.find((client) => client.websites.length > 0)?.websites[0]?.id ?? '',
  )
  const [error, setError] = useState<ApiError | null>(null)
  const [busy, setBusy] = useState(false)

  const selectedClient = useMemo(() => clients.find((client) => client.id === clientId), [clients, clientId])
  const website = selectedClient?.websites.find((entry) => entry.id === websiteId)

  const onClientChange = (nextId: string) => {
    setClientId(nextId)
    const next = clients.find((client) => client.id === nextId)
    setWebsiteId(next?.websites[0]?.id ?? '')
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!websiteId) {
      setError({ message: 'Choose a website to audit' })
      return
    }
    setBusy(true)
    setError(null)
    const { ok, data } = await postJson('/api/audits', { websiteId })
    setBusy(false)
    if (!ok) {
      setError(data.error ?? { message: 'Could not queue the audit' })
      return
    }
    const audit = data.audit as { id: string }
    router.push(`/app/audits/${audit.id}`)
    router.refresh()
  }

  if (clients.every((client) => client.websites.length === 0)) {
    return (
      <div className="rounded-sm border border-line bg-surface p-5">
        <p className="text-xs leading-relaxed text-muted">
          No websites are registered yet. Add a website to a client first, then return here to run an audit.
        </p>
        <Button asChild size="sm" variant="secondary" className="mt-4">
          <a href="/app/clients/new">Create a client</a>
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      {error?.message ? <FormAlert>{error.message}</FormAlert> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Client" htmlFor="audit-client">
          <Select id="audit-client" value={clientId} onChange={(event) => onClientChange(event.target.value)}>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.company || client.name}
              </option>
            ))}
          </Select>
        </Field>

        <Field
          label="Website"
          htmlFor="audit-website"
          hint={selectedClient && selectedClient.websites.length === 0 ? 'This client has no websites yet.' : undefined}
        >
          <Select
            id="audit-website"
            value={websiteId}
            onChange={(event) => setWebsiteId(event.target.value)}
            disabled={!selectedClient || selectedClient.websites.length === 0}
          >
            {selectedClient?.websites.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.label ? `${entry.label} — ${entry.url}` : entry.url}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      {website ? (
        <div className="grid gap-3 rounded-sm border border-line bg-surface p-4 text-xs sm:grid-cols-3">
          <div>
            <div className="mono-label">Business</div>
            <div className="mt-1 text-ink">{website.businessType}</div>
          </div>
          <div>
            <div className="mono-label">Location</div>
            <div className="mt-1 text-ink">
              {website.city}, {website.state}
            </div>
          </div>
          <div>
            <div className="mono-label">Data sources</div>
            <div className="mt-1 font-mono text-[0.65rem] uppercase tracking-[0.1em] text-muted">
              {mockMode ? 'mock integrations' : 'live integrations'}
            </div>
          </div>
        </div>
      ) : null}

      <div className="rounded-sm border border-line bg-surface p-4">
        <div className="mono-label">Pipeline</div>
        <p className="mt-1.5 text-xs leading-relaxed text-muted">
          The audit is queued as a BullMQ job (<span className="font-mono">seo-audit-jobs</span>), processed by a
          persistent worker, and tracked here. Progress reflects persisted stages; no stage is simulated.
        </p>
      </div>

      <Button type="submit" disabled={busy || !websiteId}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
        {busy ? 'Queueing…' : 'Queue audit'}
      </Button>
    </form>
  )
}
