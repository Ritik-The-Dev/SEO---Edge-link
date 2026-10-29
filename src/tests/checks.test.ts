import { describe, expect, it } from 'vitest'
import { makeSignals } from './fixtures'
import { buildMockAnalysis } from '@/mocks/ai.mock'
import { analysisSchema } from '@/server/ai/schema'

function statusOf(signals: ReturnType<typeof makeSignals>, id: string) {
  return signals.checks.find((check) => check.id === id)?.status
}

describe('deterministic checks', () => {
  const signals = makeSignals()

  it('evaluates exactly 26 checks', () => {
    expect(signals.checks).toHaveLength(26)
  })

  it('passes metadata and schema checks on a well-formed fixture', () => {
    expect(statusOf(signals, 'title-present')).toBe('pass')
    expect(statusOf(signals, 'meta-description')).toBe('pass')
    expect(statusOf(signals, 'h1-single')).toBe('pass')
    expect(statusOf(signals, 'local-business-schema')).toBe('pass')
    expect(statusOf(signals, 'sitemap')).toBe('pass')
  })

  it('fails Core Web Vitals against the published thresholds', () => {
    expect(statusOf(signals, 'cwv-lcp')).toBe('fail')
    expect(statusOf(signals, 'cwv-inp')).toBe('warn')
    expect(statusOf(signals, 'cwv-cls')).toBe('pass')
    expect(statusOf(signals, 'unused-js')).toBe('warn')
  })

  it('fails a page with no metadata at all', () => {
    const bare = makeSignals({ crawlHtml: '<html><head><title></title></head><body></body></html>' })
    expect(statusOf(bare, 'meta-description')).toBe('fail')
    expect(statusOf(bare, 'h1-single')).toBe('fail')
    expect(statusOf(bare, 'viewport')).toBe('fail')
    expect(statusOf(bare, 'word-count')).toBe('fail')
  })

  it('derives different scores for different signal sets (no static fake scores)', () => {
    const good = analysisSchema.parse(buildMockAnalysis(signals))
    const bare = analysisSchema.parse(
      buildMockAnalysis(makeSignals({ crawlHtml: '<html><head><title></title></head><body></body></html>' })),
    )
    expect(bare.overall_score).toBeLessThan(good.overall_score)
    expect(bare.score_breakdown.on_page).toBeLessThan(good.score_breakdown.on_page)
  })

  it('produces mock analysis that satisfies the versioned schema', () => {
    const analysis = buildMockAnalysis(signals)
    const parsed = analysisSchema.safeParse(analysis)
    expect(parsed.success).toBe(true)
    if (parsed.success) {
      expect(parsed.data.critical_issues.length).toBeLessThanOrEqual(5)
      expect(parsed.data.important_issues.length).toBeLessThanOrEqual(8)
      expect(parsed.data.quick_wins.length).toBeLessThanOrEqual(5)
      expect(parsed.data.quick_wins.every((win) => win.effort_hours <= 2)).toBe(true)
    }
  })
})
