'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Field, FormAlert, Input, Select, Textarea } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

interface ClientRecord {
  id: string
  name: string
  company: string | null
  contactEmail: string | null
  phone: string | null
  notes: string | null
  isActive: boolean
}

export function ClientEditor({ client }: { client: ClientRecord }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [values, setValues] = useState({
    name: client.name,
    company: client.company ?? '',
    contactEmail: client.contactEmail ?? '',
    phone: client.phone ?? '',
    notes: client.notes ?? '',
    isActive: client.isActive,
  })
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const save = async () => {
    setBusy(true)
    setError(null)
    const response = await fetch(`/api/clients/${client.id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        name: values.name,
        company: values.company || undefined,
        contactEmail: values.contactEmail || undefined,
        phone: values.phone || undefined,
        notes: values.notes || undefined,
        isActive: values.isActive,
      }),
    })
    setBusy(false)
    if (!response.ok) {
      const data = (await response.json().catch(() => ({}))) as { error?: { message?: string } }
      setError(data.error?.message ?? 'Could not save the client')
      return
    }
    setOpen(false)
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="secondary">
          <Pencil className="h-3.5 w-3.5" /> Edit client
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit client</DialogTitle>
          <DialogDescription>Contact details are used for report delivery.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {error ? <FormAlert>{error}</FormAlert> : null}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Client name" htmlFor="edit-client-name">
              <Input id="edit-client-name" value={values.name} onChange={(event) => setValues({ ...values, name: event.target.value })} />
            </Field>
            <Field label="Company" htmlFor="edit-client-company">
              <Input id="edit-client-company" value={values.company} onChange={(event) => setValues({ ...values, company: event.target.value })} />
            </Field>
            <Field label="Contact email" htmlFor="edit-client-email">
              <Input id="edit-client-email" type="email" value={values.contactEmail} onChange={(event) => setValues({ ...values, contactEmail: event.target.value })} />
            </Field>
            <Field label="Phone" htmlFor="edit-client-phone">
              <Input id="edit-client-phone" value={values.phone} onChange={(event) => setValues({ ...values, phone: event.target.value })} />
            </Field>
          </div>
          <Field label="Notes" htmlFor="edit-client-notes">
            <Textarea id="edit-client-notes" value={values.notes} onChange={(event) => setValues({ ...values, notes: event.target.value })} />
          </Field>
          <label className="flex items-center gap-2 text-xs text-muted">
            <input
              type="checkbox"
              checked={values.isActive}
              onChange={(event) => setValues({ ...values, isActive: event.target.checked })}
              className="h-3.5 w-3.5 accent-[hsl(var(--accent))]"
            />
            Active client (inactive clients cannot start new audits)
          </label>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={save} disabled={busy}>
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null} Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface WebsiteRecord {
  id: string
  url: string
  label: string | null
  businessType: string
  city: string
  state: string
  status: 'ACTIVE' | 'PAUSED' | 'ARCHIVED'
}

export function WebsiteEditor({ website }: { website: WebsiteRecord }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [values, setValues] = useState({
    url: website.url,
    label: website.label ?? '',
    businessType: website.businessType,
    city: website.city,
    state: website.state,
    status: website.status,
  })
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const save = async () => {
    setBusy(true)
    setError(null)
    const response = await fetch(`/api/websites/${website.id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        url: values.url,
        label: values.label || undefined,
        businessType: values.businessType,
        city: values.city,
        state: values.state,
        status: values.status,
      }),
    })
    setBusy(false)
    if (!response.ok) {
      const data = (await response.json().catch(() => ({}))) as { error?: { message?: string } }
      setError(data.error?.message ?? 'Could not save the website')
      return
    }
    setOpen(false)
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="icon" variant="ghost" aria-label="Edit website">
          <Pencil className="h-3.5 w-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit website</DialogTitle>
          <DialogDescription>Business context is passed to the AI analysis.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {error ? <FormAlert>{error}</FormAlert> : null}
          <Field label="URL" htmlFor="edit-website-url">
            <Input id="edit-website-url" value={values.url} onChange={(event) => setValues({ ...values, url: event.target.value })} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Label" htmlFor="edit-website-label">
              <Input id="edit-website-label" value={values.label} onChange={(event) => setValues({ ...values, label: event.target.value })} />
            </Field>
            <Field label="Business type" htmlFor="edit-website-type">
              <Input id="edit-website-type" value={values.businessType} onChange={(event) => setValues({ ...values, businessType: event.target.value })} />
            </Field>
            <Field label="City" htmlFor="edit-website-city">
              <Input id="edit-website-city" value={values.city} onChange={(event) => setValues({ ...values, city: event.target.value })} />
            </Field>
            <Field label="State" htmlFor="edit-website-state">
              <Input id="edit-website-state" value={values.state} onChange={(event) => setValues({ ...values, state: event.target.value })} />
            </Field>
            <Field label="Status" htmlFor="edit-website-status" className="sm:col-span-2">
              <Select
                id="edit-website-status"
                value={values.status}
                onChange={(event) => setValues({ ...values, status: event.target.value as WebsiteRecord['status'] })}
              >
                <option value="ACTIVE">Active</option>
                <option value="PAUSED">Paused</option>
                <option value="ARCHIVED">Archived</option>
              </Select>
            </Field>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={save} disabled={busy}>
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null} Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
