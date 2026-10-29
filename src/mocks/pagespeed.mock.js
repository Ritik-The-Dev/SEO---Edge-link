/**
 * Google PageSpeed Insights — assessment fixture.
 * Values are the ones supplied in the assessment brief, reproduced exactly.
 * This is clearly-labelled sample data, never presented as a live measurement.
 */
export const PAGESPEED_MOCK = {
  source: 'mock',
  url: 'https://example-dental-clinic.com',
  strategy: 'mobile',
  scores: {
    performance: 0.61,
    seo: 0.89,
    accessibility: 0.74,
  },
  metrics: {
    largestContentfulPaint: '4.2 s',
    cumulativeLayoutShift: 0.08,
    interactionToNextPaint: '280 ms',
  },
  diagnostics: {
    renderBlockingResources: 2,
    unusedJavascript: '420 KiB',
  },
  fetchedAt: '2026-10-01T00:00:00.000Z',
}

/**
 * @param {{ url?: string, strategy?: 'mobile' }} [input]
 * @returns {typeof PAGESPEED_MOCK}
 */
export function getPageSpeed(input = {}) {
  return {
    ...PAGESPEED_MOCK,
    ...(input.url ? { url: input.url } : {}),
    ...(input.strategy ? { strategy: input.strategy } : {}),
    fetchedAt: new Date().toISOString(),
  }
}

export default { getPageSpeed, PAGESPEED_MOCK }
