'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarClock, Loader2, Pencil, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Field, FormAlert, Input, Select } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { formatDate, formatDateTimeUtc, formatTimeLocal, hostFromUrl, relativeTime } from '@/lib/utils'

export interface ScheduleRow {
  id: string
  websiteId: string
  dayOfMonth: number
  hourUtc: number
  isEnabled: boolean
  nextRunAt: string
  lastRunAt: string | null
  website: { id: string; url: string; label: string | null; clientName: string }
  lastAudit: { id: string; status: string; overallScore: number | null } | null
}

export interface WebsiteOption {
  id: string
  url: string
  label: string | null
  clientName: string
}

export function ScheduleManager({
  schedules,
  websites,
}: {
  schedules: ScheduleRow[]
  websites: WebsiteOption[]
}) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [editing, setEditing] = useState<ScheduleRow | null>(null)
  const [creating, setCreating] = useState(false)

  const unscheduled = websites.filter((site) => !schedules.some((schedule) => schedule.websiteId === site.id))

  const patch = async (id: string, body: Record<string, unknown>) => {
    setBusyId(id)
    setError(null)
    const response = await fetch(`/api/schedules/${id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    })
    setBusyId(null)
    if (!response.ok) {
      const data = (await response.json().catch(() => ({}))) as { error?: { message?: string } }
      setError(data.error?.message ?? 'Could not update the schedule')
      return
    }
    router.refresh()
  }

  const remove = async (id: string) => {
    setBusyId(id)
    setError(null)
    const response = await fetch(`/api/schedules/${id}`, { method: 'DELETE' })
    setBusyId(null)
    if (!response.ok) {
      setError('Could not delete the schedule')
      return
    }
    router.refresh()
  }

  return (
    <div className="space-y-6">
      {error ? <FormAlert>{error}</FormAlert> : null}

      <div className="overflow-hidden rounded-md border border-line bg-surface">
        {schedules.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <CalendarClock className="mx-auto h-5 w-5 text-faint" />
            <h3 className="mt-3 text-sm text-ink">No recurring audits yet</h3>
            <p className="mx-auto mt-1.5 max-w-sm text-xs leading-relaxed text-muted">
              Monthly schedules are claimed by the protected cron endpoint. Each run creates a normal audit job.
            </p>
            {websites.length ? (
              <Button size="sm" className="mt-5" onClick={() => setCreating(true)}>
                <Plus className="h-3.5 w-3.5" /> Add a schedule
              </Button>
            ) : null}
          </div>
        ) : (
          <ul className="divide-y divide-line">
            {schedules.map((schedule) => (
              <li key={schedule.id} className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate text-sm text-ink">
                      {schedule.website.label || hostFromUrl(schedule.website.url)}
                    </span>
                    <span className="font-mono text-2xs uppercase tracking-[0.12em] text-faint">
                      {schedule.website.clientName}
                    </span>
                  </div>
                  <p className="mt-1 font-mono text-[0.65rem] text-muted">
                    day {schedule.dayOfMonth} · {String(schedule.hourUtc).padStart(2, '0')}:00 UTC · monthly
                  </p>
                  <p className="mt-1 text-2xs text-faint">
                    {schedule.isEnabled
                      ? `Next run ${formatDateTimeUtc(schedule.nextRunAt)} (${formatTimeLocal(schedule.nextRunAt)} local · ${relativeTime(schedule.nextRunAt)})`
                      : 'Paused'}
                    {schedule.lastRunAt ? ` · last run ${formatDate(schedule.lastRunAt)}` : ''}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={schedule.isEnabled}
                      onCheckedChange={(checked) => patch(schedule.id, { isEnabled: checked })}
                      aria-label={`${schedule.isEnabled ? 'Pause' : 'Enable'} schedule for ${schedule.website.url}`}
                      disabled={busyId === schedule.id}
                    />
                    <span className="text-2xs text-muted">{schedule.isEnabled ? 'Enabled' : 'Paused'}</span>
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => setEditing(schedule)} aria-label="Edit schedule">
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => remove(schedule.id)}
                    aria-label="Delete schedule"
                    disabled={busyId === schedule.id}
                  >
                    {busyId === schedule.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {websites.length > 0 ? (
        <div className="rounded-md border border-line bg-surface p-5">
          <div className="mono-label">Add a schedule</div>
          <p className="mt-1.5 text-xs leading-relaxed text-muted">
            Choose a website and a day of the month (1–28, so February is never skipped). Runs are queued at 03:00
            UTC by default and advanced only after a successful claim.
          </p>
          <ScheduleForm websites={websites} schedules={schedules} onDone={() => router.refresh()} />
          {unscheduled.length === 0 ? (
            <p className="mt-3 text-2xs text-faint">Every website already has a schedule; edit an existing one above.</p>
          ) : null}
        </div>
      ) : null}

      <Dialog open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          {editing ? (
            <EditScheduleForm
              schedule={editing}
              onClose={() => setEditing(null)}
              onSaved={() => {
                setEditing(null)
                router.refresh()
              }}
            />
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add a monthly schedule</DialogTitle>
            <DialogDescription>Pick the website and the day of the month for its recurring audit.</DialogDescription>
          </DialogHeader>
          {websites.length ? (
            <ScheduleForm
              websites={websites}
              schedules={schedules}
              onDone={() => {
                setCreating(false)
                router.refresh()
              }}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ScheduleForm({
  websites,
  schedules,
  onDone,
}: {
  websites: WebsiteOption[]
  schedules: ScheduleRow[]
  onDone: () => void
}) {
  const available = websites.filter((site) => !schedules.some((schedule) => schedule.websiteId === site.id))
  const [websiteId, setWebsiteId] = useState(available[0]?.id ?? '')
  const [day, setDay] = useState(1)
  const [hour, setHour] = useState(3)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setBusy(true)
    setError(null)
    const response = await fetch('/api/schedules', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ websiteId, dayOfMonth: day, hourUtc: hour, isEnabled: true }),
    })
    setBusy(false)
    if (!response.ok) {
      const data = (await response.json().catch(() => ({}))) as { error?: { message?: string } }
      setError(data.error?.message ?? 'Could not save the schedule')
      return
    }
    onDone()
  }

  if (available.length === 0) {
    return <p className="mt-4 text-xs text-muted">All websites already have a monthly schedule.</p>
  }

  return (
    <form onSubmit={submit} className="mt-4 space-y-4">
      {error ? <FormAlert>{error}</FormAlert> : null}
      <div className="grid gap-4 sm:grid-cols-[1.5fr_repeat(2,0.75fr)]">
        <Field label="Website" htmlFor="schedule-website">
          <Select id="schedule-website" value={websiteId} onChange={(event) => setWebsiteId(event.target.value)}>
            {available.map((site) => (
              <option key={site.id} value={site.id}>
                {site.label || hostFromUrl(site.url)} — {site.clientName}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Day (1–28)" htmlFor="schedule-day">
          <Input
            id="schedule-day"
            type="number"
            min={1}
            max={28}
            value={day}
            onChange={(event) => setDay(Number(event.target.value))}
          />
        </Field>
        <Field label="Hour (UTC)" htmlFor="schedule-hour">
          <Input
            id="schedule-hour"
            type="number"
            min={0}
            max={23}
            value={hour}
            onChange={(event) => setHour(Number(event.target.value))}
          />
        </Field>
      </div>
      <Button type="submit" size="sm" disabled={busy}>
        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
        {busy ? 'Saving…' : 'Save schedule'}
      </Button>
    </form>
  )
}

function EditScheduleForm({
  schedule,
  onClose,
  onSaved,
}: {
  schedule: ScheduleRow
  onClose: () => void
  onSaved: () => void
}) {
  const [day, setDay] = useState(schedule.dayOfMonth)
  const [hour, setHour] = useState(schedule.hourUtc)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const save = async () => {
    setBusy(true)
    setError(null)
    const response = await fetch(`/api/schedules/${schedule.id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ dayOfMonth: day, hourUtc: hour }),
    })
    setBusy(false)
    if (!response.ok) {
      const data = (await response.json().catch(() => ({}))) as { error?: { message?: string } }
      setError(data.error?.message ?? 'Could not update the schedule')
      return
    }
    onSaved()
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Edit monthly schedule</DialogTitle>
        <DialogDescription>{schedule.website.label || schedule.website.url}</DialogDescription>
      </DialogHeader>
      <div className="space-y-4">
        {error ? <FormAlert>{error}</FormAlert> : null}
        <div className="grid grid-cols-2 gap-4">
          <Field label="Day (1–28)" htmlFor="edit-day">
            <Input id="edit-day" type="number" min={1} max={28} value={day} onChange={(event) => setDay(Number(event.target.value))} />
          </Field>
          <Field label="Hour (UTC)" htmlFor="edit-hour">
            <Input id="edit-hour" type="number" min={0} max={23} value={hour} onChange={(event) => setHour(Number(event.target.value))} />
          </Field>
        </div>
        <p className="text-2xs leading-relaxed text-faint">
          The next run is recalculated immediately when the timing changes.
        </p>
      </div>
      <DialogFooter>
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={save} disabled={busy}>
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
          Save changes
        </Button>
      </DialogFooter>
    </>
  )
}
