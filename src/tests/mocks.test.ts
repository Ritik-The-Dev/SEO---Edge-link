import { afterEach, describe, expect, it, vi } from 'vitest'
import { PAGESPEED_MOCK, getPageSpeed } from '@/mocks/pagespeed.mock'
import { GSC_MOCK, getSearchConsole } from '@/mocks/gsc.mock'
import { DATAFORSEO_MOCK, getRankings } from '@/mocks/dataforseo.mock'
import { sendWhatsApp } from '@/mocks/twilio.mock'

describe('PageSpeed fixture', () => {
  it('preserves every supplied value', () => {
    expect(PAGESPEED_MOCK.url).toBe('https://example-dental-clinic.com')
    expect(PAGESPEED_MOCK.strategy).toBe('mobile')
    expect(PAGESPEED_MOCK.scores).toEqual({ performance: 0.61, seo: 0.89, accessibility: 0.74 })
    expect(PAGESPEED_MOCK.metrics.largestContentfulPaint).toBe('4.2 s')
    expect(PAGESPEED_MOCK.metrics.cumulativeLayoutShift).toBe(0.08)
    expect(PAGESPEED_MOCK.metrics.interactionToNextPaint).toBe('280 ms')
    expect(PAGESPEED_MOCK.diagnostics.renderBlockingResources).toBe(2)
    expect(PAGESPEED_MOCK.diagnostics.unusedJavascript).toBe('420 KiB')
  })

  it('is labelled as mock and never claims to be live', () => {
    expect(getPageSpeed().source).toBe('mock')
  })
})

describe('Search Console fixture', () => {
  it('preserves the five query rows exactly', () => {
    expect(GSC_MOCK.queries).toEqual([
      { query: 'dental clinic in pune', clicks: 42, impressions: 980, ctr: 0.043, position: 6.2 },
      { query: 'best dentist pune', clicks: 28, impressions: 740, ctr: 0.038, position: 8.1 },
      { query: 'tooth extraction pune', clicks: 19, impressions: 430, ctr: 0.044, position: 5.7 },
      { query: 'dental implants cost pune', clicks: 11, impressions: 310, ctr: 0.035, position: 11.3 },
      { query: 'dentist near me', clicks: 67, impressions: 2100, ctr: 0.032, position: 9.4 },
    ])
  })

  it('preserves totals and coverage errors', () => {
    expect(GSC_MOCK.totals).toEqual({ clicks: 167, impressions: 4560 })
    expect(GSC_MOCK.indexCoverageErrors).toBe(3)
  })
})

describe('DataForSEO fixture', () => {
  it('preserves the keyword, volume, client position and SERP rows', () => {
    expect(DATAFORSEO_MOCK.keyword).toBe('dental clinic pune')
    expect(DATAFORSEO_MOCK.searchVolume).toBe(1900)
    expect(DATAFORSEO_MOCK.clientRankPosition).toBe(4)
    expect(DATAFORSEO_MOCK.rankGroup).toBe('top_10')
    expect(DATAFORSEO_MOCK.results.map((row) => [row.domain, row.position])).toEqual([
      ['example-dental-clinic.com', 4],
      ['competitorA.com', 8],
      ['competitorB.com', 12],
    ])
    expect(getRankings().source).toBe('mock')
  })
})

describe('WhatsApp mock', () => {
  afterEach(() => vi.restoreAllMocks())

  it('logs the attempt and returns mock_sent without claiming delivery', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined)
    const result = await sendWhatsApp('client-123', 'clients/client-123/audit.pdf', 72)

    expect(result.status).toBe('mock_sent')
    expect(result.mock).toBe(true)
    expect(result.channel).toBe('whatsapp')
    expect(result.score).toBe(72)
    expect(result.pdfPath).toContain('audit.pdf')
    expect(result.id).toContain('mock_sent_client-123')

    const logged = JSON.parse(log.mock.calls[0]![0] as string)
    expect(logged).toMatchObject({
      adapter: 'twilio.mock',
      clientId: 'client-123',
      score: 72,
      deliveryStatus: 'mock_sent',
    })
  })
})
