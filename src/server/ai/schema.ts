import { z } from 'zod'

/**
 * Versioned contract for AI audit output (audit_version v1.0).
 * Every constraint from the assessment is encoded here:
 *  - integer scores 0–100
 *  - ≤5 critical issues, ≤8 important issues, ≤5 quick wins
 *  - quick wins ≤ 2 hours of effort
 *  - priority/category/impact/effort enums
 *  - ≤3 sentence executive summary
 *  - every recommendation carries finding, fix, impact, effort, falsifiability
 */

export const PRIORITIES = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const
export const CATEGORIES = ['Technical', 'OnPage', 'Content', 'Schema', 'CWV'] as const
export const IMPACTS = ['High', 'Medium', 'Low'] as const
export const EFFORTS = ['Hours', 'Days', 'Weeks'] as const

const score = z
  .number()
  .min(0)
  .max(100)
  .transform((value) => Math.round(value))

const issueSchema = z.preprocess(
  (value) => {
    if (typeof value === 'string') {
      return { title: value.slice(0, 160), detail: value.slice(0, 1200) }
    }
    if (value && typeof value === 'object') {
      const record = value as Record<string, unknown>
      const title = record.title ?? record.issue ?? record.name ?? record.summary
      const detail = record.detail ?? record.description ?? record.message ?? record.reason ?? title
      return {
        title: String(title ?? 'Issue').slice(0, 200),
        detail: String(detail ?? '').slice(0, 1200),
        category: typeof record.category === 'string' ? record.category : undefined,
      }
    }
    return value
  },
  z.object({
    title: z.string().min(1).max(200),
    detail: z.string().max(1200).default(''),
    category: z.enum(CATEGORIES).optional(),
  }),
)

/** Quick wins are capped at two hours of effort, in addition to the array cap. */
const quickWinSchema = z.preprocess(
  (value) => {
    if (typeof value === 'string') return { title: value.slice(0, 160), action: value.slice(0, 800), effort_hours: 2 }
    if (value && typeof value === 'object') {
      const record = value as Record<string, unknown>
      const title = record.title ?? record.issue ?? record.name
      const action = record.action ?? record.fix ?? record.recommendation ?? record.detail ?? title
      const hours = record.effort_hours ?? record.hours ?? record.effort_estimate_hours ?? 2
      return {
        title: String(title ?? 'Quick win').slice(0, 200),
        action: String(action ?? '').slice(0, 800),
        effort_hours: typeof hours === 'number' ? hours : Number(hours) || 2,
      }
    }
    return value
  },
  z.object({
    title: z.string().min(1).max(200),
    action: z.string().min(1).max(800),
    effort_hours: z.number().min(0.25).max(2, 'Quick wins must take two hours or less'),
  }),
)

export const recommendationSchema = z.object({
  priority: z.enum(PRIORITIES),
  category: z.enum(CATEGORIES),
  finding: z.string().min(10).max(1600),
  fix: z.string().min(10).max(1600),
  estimated_impact: z.enum(IMPACTS),
  effort: z.enum(EFFORTS),
  effort_hours: z.number().min(0.25).max(400).optional(),
  falsifiability_check: z.string().min(10).max(900),
})

function sentenceCount(text: string): number {
  return text
    .trim()
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean).length
}

export const analysisSchema = z.object({
  audit_version: z.literal('v1.0'),
  overall_score: score,
  score_breakdown: z.object({
    technical: score,
    on_page: score,
    content: score,
    core_web_vitals: score,
    schema: score,
  }),
  critical_issues: z.array(issueSchema).max(5),
  important_issues: z.array(issueSchema).max(8),
  quick_wins: z.array(quickWinSchema).max(5),
  recommendations: z.array(recommendationSchema).min(1).max(20),
  executive_summary: z
    .string()
    .min(20)
    .max(900)
    .refine((value) => sentenceCount(value) <= 3, 'Executive summary must be three sentences or fewer'),
})

export type AiAnalysis = z.infer<typeof analysisSchema>
export type AiRecommendation = z.infer<typeof recommendationSchema>

export interface AnalysisProvenance {
  source: 'CLAUDE' | 'MOCK'
  model: string | null
  latencyMs: number
  attempts: number
  repaired: boolean
  note?: string
}
