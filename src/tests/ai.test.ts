import { describe, expect, it } from 'vitest'
import { analysisSchema } from '@/server/ai/schema'
import { extractJsonObject } from '@/server/ai/parse'
import { analyzeAudit } from '@/server/ai/analyze'
import { FIXTURE_TARGET, makeAnalysis, makeSignals } from './fixtures'

const base = makeAnalysis()

function validPayload(overrides: Record<string, unknown> = {}) {
  const { _meta: _ignored, ...payload } = base as Record<string, unknown>
  return { ...payload, ...overrides }
}

const sampleRecommendation = {
  priority: 'HIGH',
  category: 'Technical',
  finding: 'The canonical tag is missing from the audited page.',
  fix: 'Add a self-referencing canonical link using the final https URL.',
  estimated_impact: 'Medium',
  effort: 'Hours',
  effort_hours: 1,
  falsifiability_check: 'A crawler re-run should report a canonical URL matching the final URL.',
}

describe('analysis schema', () => {
  it('accepts the deterministic fixture output', () => {
    expect(analysisSchema.safeParse(validPayload()).success).toBe(true)
  })

  it('normalises string-only issue lists instead of rejecting them', () => {
    const parsed = analysisSchema.safeParse(
      validPayload({ critical_issues: ['Missing canonical tag on the homepage'] }),
    )
    expect(parsed.success).toBe(true)
    if (parsed.success) {
      expect(parsed.data.critical_issues[0]?.title).toBe('Missing canonical tag on the homepage')
    }
  })

  it('rejects an unknown audit version', () => {
    expect(analysisSchema.safeParse(validPayload({ audit_version: 'v2.0' })).success).toBe(false)
  })

  it.each([
    ['score above 100', { overall_score: 101 }],
    ['negative score', { overall_score: -1 }],
    ['invalid priority', { recommendations: [{ ...sampleRecommendation, priority: 'URGENT' }] }],
    ['invalid category', { recommendations: [{ ...sampleRecommendation, category: 'UX' }] }],
    ['invalid impact', { recommendations: [{ ...sampleRecommendation, estimated_impact: 'Huge' }] }],
    ['invalid effort', { recommendations: [{ ...sampleRecommendation, effort: 'Minutes' }] }],
    ['missing falsifiability', { recommendations: [{ ...sampleRecommendation, falsifiability_check: '' }] }],
  ])('rejects %s', (_label, overrides) => {
    expect(analysisSchema.safeParse(validPayload(overrides)).success).toBe(false)
  })

  it('enforces the issue and quick-win array caps', () => {
    const sixCritical = Array.from({ length: 6 }, () => ({ title: 'Issue', detail: 'Detail' }))
    const nineImportant = Array.from({ length: 9 }, () => ({ title: 'Issue', detail: 'Detail' }))
    const sixWins = Array.from({ length: 6 }, () => ({ title: 'Win', action: 'Do it', effort_hours: 1 }))

    expect(analysisSchema.safeParse(validPayload({ critical_issues: sixCritical })).success).toBe(false)
    expect(analysisSchema.safeParse(validPayload({ important_issues: nineImportant })).success).toBe(false)
    expect(analysisSchema.safeParse(validPayload({ quick_wins: sixWins })).success).toBe(false)
  })

  it('rejects quick wins that take longer than two hours', () => {
    const result = analysisSchema.safeParse(
      validPayload({ quick_wins: [{ title: 'Win', action: 'Rewrite copy', effort_hours: 3 }] }),
    )
    expect(result.success).toBe(false)
  })

  it('rejects executive summaries longer than three sentences', () => {
    const summary = 'One. Two. Three. Four.'
    expect(analysisSchema.safeParse(validPayload({ executive_summary: summary })).success).toBe(false)
  })

  it('rounds fractional scores to integers', () => {
    const parsed = analysisSchema.safeParse(validPayload({ overall_score: 72.6 }))
    expect(parsed.success).toBe(true)
    if (parsed.success) expect(parsed.data.overall_score).toBe(73)
  })
})

describe('extractJsonObject', () => {
  it('extracts JSON from Markdown fences and surrounding prose', () => {
    const parsed = extractJsonObject('Here is the analysis:\n```json\n{"audit_version":"v1.0"}\n```\nThanks.')
    expect(parsed).toEqual({ audit_version: 'v1.0' })
  })

  it('repairs trailing commas', () => {
    expect(extractJsonObject('{"a":1,"b":[1,2,],}')).toEqual({ a: 1, b: [1, 2] })
  })

  it('repairs curly quotes inside strings', () => {
    expect(extractJsonObject('{“note”:“hello”}')).toEqual({ note: 'hello' })
  })

  it('throws on an empty or non-JSON response', () => {
    expect(() => extractJsonObject('')).toThrow()
    expect(() => extractJsonObject('I cannot help with that.')).toThrow(/JSON object/)
  })
})

describe('analyzeAudit (deterministic AI fixture)', () => {
  it('returns validated analysis with explicit MOCK provenance', async () => {
    const signals = makeSignals()
    const outcome = await analyzeAudit(FIXTURE_TARGET, signals)

    expect(outcome.provenance.source).toBe('MOCK')
    expect(outcome.provenance.model).toBeNull()
    expect(outcome.provenance.note).toMatch(/not a Claude response/i)
    expect(analysisSchema.safeParse(outcome.analysis).success).toBe(true)
    expect(outcome.analysis.recommendations.length).toBeGreaterThan(0)
    expect(outcome.analysis.executive_summary.split(/(?<=[.!?])\s+/).length).toBeLessThanOrEqual(3)
  })
})
