/** Pipeline stage plan shared by the worker, the UI and the PDF. */
export const STAGE_PLAN = [
  { key: 'queued', label: 'Queued', progress: 0 },
  { key: 'crawling', label: 'Crawling website', progress: 12 },
  { key: 'technical-checks', label: 'Technical checks & integrations', progress: 32 },
  { key: 'on-page-analysis', label: 'On-page analysis', progress: 48 },
  { key: 'ai-analysis', label: 'AI analysis', progress: 66 },
  { key: 'persistence', label: 'Saving results', progress: 76 },
  { key: 'report', label: 'Generating PDF report', progress: 88 },
  { key: 'notifications', label: 'Sending notifications', progress: 96 },
  { key: 'completed', label: 'Completed', progress: 100 },
] as const

export type StageKey = (typeof STAGE_PLAN)[number]['key']

export function stageMeta(key: StageKey) {
  return STAGE_PLAN.find((stage) => stage.key === key) ?? STAGE_PLAN[0]
}

export function progressFor(key: StageKey): number {
  return stageMeta(key).progress
}

export function stageLabel(key: string): string {
  return STAGE_PLAN.find((stage) => stage.key === key)?.label ?? 'Queued'
}
