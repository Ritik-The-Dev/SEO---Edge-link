'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Progress } from '@/components/ui/progress'
import { StatusPill } from '@/components/ui/badge'
import { relativeTime } from '@/lib/utils'

const STAGE_STEPS = [
  { key: 'queued', label: 'Queued' },
  { key: 'crawling', label: 'Crawl' },
  { key: 'technical-checks', label: 'Technical' },
  { key: 'on-page-analysis', label: 'On-page' },
  { key: 'ai-analysis', label: 'AI analysis' },
  { key: 'persistence', label: 'Persist' },
  { key: 'report', label: 'PDF report' },
  { key: 'notifications', label: 'Notify' },
  { key: 'completed', label: 'Complete' },
]

interface PolledAudit {
  status: string
  stage: string
  progress: number
  error: string | null
  events: Array<{ id: string; stage: string; message: string; createdAt: string; status: string }>
}

/**
 * Polls the persisted audit state while the job is queued or running.
 * No fake real-time: every value comes from GET /api/audits/:id.
 */
export function AuditProgress({ auditId, initial }: { auditId: string; initial: PolledAudit }) {
  const router = useRouter()
  const [audit, setAudit] = useState<PolledAudit>(initial)
  const [polling, setPolling] = useState(initial.status === 'QUEUED' || initial.status === 'RUNNING')
  const refreshOnFinish = useRef(false)

  useEffect(() => {
    if (!polling) return
    let cancelled = false
    let timer: ReturnType<typeof setTimeout>

    const poll = async () => {
      try {
        const response = await fetch(`/api/audits/${auditId}`, { cache: 'no-store' })
        if (response.ok) {
          const data = (await response.json()) as { audit: PolledAudit }
          if (cancelled) return
          setAudit((previous) => ({
            ...data.audit,
            events: data.audit.events ?? previous.events,
          }))
          if (data.audit.status === 'COMPLETED' || data.audit.status === 'FAILED') {
            setPolling(false)
            refreshOnFinish.current = true
            router.refresh()
            return
          }
        }
      } catch {
        /* transient network failure — retry on next tick */
      }
      if (!cancelled) timer = setTimeout(poll, 2500)
    }

    timer = setTimeout(poll, 1200)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [auditId, polling, router])

  const activeIndex = useMemo(() => {
    const index = STAGE_STEPS.findIndex((step) => step.key === audit.stage)
    return index === -1 ? 0 : index
  }, [audit.stage])

  return (
    <div className="rounded-md border border-line bg-surface">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
        <div className="flex items-center gap-3">
          <StatusPill status={audit.status} />
          <span className="font-mono text-2xs uppercase tracking-[0.14em] text-faint">
            {STAGE_STEPS.find((step) => step.key === audit.stage)?.label ?? 'Working'}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs tabular-nums text-muted">{audit.progress}%</span>
          {polling ? (
            <span className="flex items-center gap-1.5 font-mono text-2xs uppercase tracking-[0.14em] text-faint">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" /> live
            </span>
          ) : null}
        </div>
      </div>

      <div className="px-5 py-4">
        <Progress value={audit.progress} label="Audit progress" />

        <ol className="mt-5 grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-9">
          {STAGE_STEPS.map((step, index) => {
            const state = index < activeIndex ? 'done' : index === activeIndex ? 'active' : 'todo'
            return (
              <li key={step.key} className="min-w-0">
                <div
                  className={
                    state === 'done'
                      ? 'h-[2px] w-full bg-accent'
                      : state === 'active'
                        ? 'h-[2px] w-full bg-accent/60'
                        : 'h-[2px] w-full bg-line'
                  }
                />
                <div
                  className={
                    state === 'active'
                      ? 'mt-2 truncate text-[0.65rem] text-ink'
                      : state === 'done'
                        ? 'mt-2 truncate text-[0.65rem] text-muted'
                        : 'mt-2 truncate text-[0.65rem] text-faint'
                  }
                >
                  {step.label}
                </div>
              </li>
            )
          })}
        </ol>

        {audit.error ? (
          <p className="mt-4 rounded-sm border border-critical/30 bg-critical/10 px-3 py-2 text-xs leading-relaxed text-critical">
            {audit.error}
          </p>
        ) : null}

        {audit.events?.length ? (
          <div className="mt-6 space-y-2 border-t border-line pt-4">
            {audit.events
              .slice(0, 6)
              .map((event) => (
                <div key={event.id} className="flex items-baseline justify-between gap-3 text-2xs">
                  <span className="flex min-w-0 items-baseline gap-2">
                    <span className="font-mono uppercase tracking-[0.12em] text-faint">{event.stage}</span>
                    <span className="truncate text-muted">{event.message}</span>
                  </span>
                  <span className="shrink-0 font-mono text-faint">{relativeTime(event.createdAt)}</span>
                </div>
              ))}
          </div>
        ) : null}

        {polling ? (
          <p className="mt-4 text-2xs leading-relaxed text-faint">
            Polling the persisted audit record every 2.5 seconds. This page updates when the worker advances a stage.
          </p>
        ) : null}
      </div>
    </div>
  )
}
