/**
 * Google Search Console — assessment fixture.
 * Query rows, totals and index-coverage errors are reproduced exactly as supplied.
 * CTR values are kept verbatim (0.043 etc.), not recomputed.
 */
export const GSC_MOCK = {
  source: 'mock',
  siteUrl: 'https://example-dental-clinic.com',
  totals: {
    clicks: 167,
    impressions: 4560,
  },
  indexCoverageErrors: 3,
  queries: [
    { query: 'dental clinic in pune', clicks: 42, impressions: 980, ctr: 0.043, position: 6.2 },
    { query: 'best dentist pune', clicks: 28, impressions: 740, ctr: 0.038, position: 8.1 },
    { query: 'tooth extraction pune', clicks: 19, impressions: 430, ctr: 0.044, position: 5.7 },
    { query: 'dental implants cost pune', clicks: 11, impressions: 310, ctr: 0.035, position: 11.3 },
    { query: 'dentist near me', clicks: 67, impressions: 2100, ctr: 0.032, position: 9.4 },
  ],
}

/**
 * @param {{ siteUrl?: string }} [input]
 * @returns {typeof GSC_MOCK & { fetchedAt: string }}
 */
export function getSearchConsole(input = {}) {
  const clicks = GSC_MOCK.totals.clicks
  const impressions = GSC_MOCK.totals.impressions
  return {
    ...GSC_MOCK,
    ...(input.siteUrl ? { siteUrl: input.siteUrl } : {}),
    totals: {
      ...GSC_MOCK.totals,
      // Derived from the supplied totals for display convenience.
      ctr: Number((clicks / impressions).toFixed(4)),
    },
    fetchedAt: new Date().toISOString(),
  }
}

export default { getSearchConsole, GSC_MOCK }
