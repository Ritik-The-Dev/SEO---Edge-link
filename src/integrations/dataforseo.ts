import { USE_MOCKS } from '@/mocks/index'
import { getRankings } from '@/mocks/dataforseo.mock'
import type { DataForSeoSignal } from '@/types/audit'

/**
 * DataForSEO SERP/rank adapter.
 * Mock mode returns the assessment fixture. Live mode requires DataForSEO
 * credentials and a configured location/keyword strategy; it therefore fails
 * clearly instead of mixing unknown measurements into the audit.
 */
export async function fetchRankings(keyword?: string): Promise<DataForSeoSignal> {
  if (USE_MOCKS) return getRankings(keyword ? { keyword } : {}) as unknown as DataForSeoSignal

  throw new Error(
    'DataForSEO live mode is not configured. Set USE_MOCKS=true, or supply DataForSEO ' +
      'credentials and implement the SERP call in src/integrations/dataforseo.ts.',
  )
}
