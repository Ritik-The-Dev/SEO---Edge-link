/**
 * DataForSEO SERP snapshot — assessment fixture.
 * Supplied values: keyword "dental clinic pune", client organic position 4,
 * search volume 1900, and the three competitor positions below.
 *
 * `rankGroup` is derived from the client position and documented as a
 * reconstruction in the README, because the brief's original rank-group field
 * was not included in the supplied document pages.
 */
export const DATAFORSEO_MOCK = {
  source: 'mock',
  keyword: 'dental clinic pune',
  searchVolume: 1900,
  clientRankPosition: 4,
  rankGroup: 'top_10',
  location: { city: 'Pune', state: 'Maharashtra', country: 'India' },
  results: [
    {
      domain: 'example-dental-clinic.com',
      position: 4,
      absolutePosition: 4,
      isClient: true,
      url: 'https://example-dental-clinic.com/',
    },
    { domain: 'competitorA.com', position: 8, absolutePosition: 8, isClient: false, url: 'https://competitorA.com/' },
    { domain: 'competitorB.com', position: 12, absolutePosition: 12, isClient: false, url: 'https://competitorB.com/' },
  ],
}

/**
 * @param {{ keyword?: string }} [input]
 */
export function getRankings(input = {}) {
  return {
    ...DATAFORSEO_MOCK,
    ...(input.keyword ? { keyword: input.keyword } : {}),
    fetchedAt: new Date().toISOString(),
  }
}

export default { getRankings, DATAFORSEO_MOCK }
