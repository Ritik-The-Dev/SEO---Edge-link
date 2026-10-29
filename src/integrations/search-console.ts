import { USE_MOCKS } from '@/mocks/index'
import { getSearchConsole } from '@/mocks/gsc.mock'
import type { GscSignal } from '@/types/audit'

/**
 * Google Search Console adapter.
 *
 * Mock mode returns the assessment fixture (exact query rows and totals).
 * Live mode requires OAuth service-account access to the property, which is not
 * configured in this environment, so it fails loudly rather than fabricating
 * search data into a "real" audit.
 */
export async function fetchSearchConsole(siteUrl: string): Promise<GscSignal> {
  if (USE_MOCKS) return getSearchConsole({ siteUrl }) as unknown as GscSignal

  throw new Error(
    'Search Console live mode is not configured. Set USE_MOCKS=true, or implement OAuth ' +
      'service-account access in src/integrations/search-console.ts before claiming live GSC data.',
  )
}
