import { env } from '@/lib/env'
import { USE_MOCKS } from '@/mocks/index'
import { getPageSpeed } from '@/mocks/pagespeed.mock'
import type { PageSpeedSignal } from '@/types/audit'

interface PsiResponse {
  lighthouseResult?: {
    categories?: Record<string, { score?: number }>
    audits?: Record<string, { displayValue?: string; numericValue?: number; details?: { items?: unknown[] } }>
  }
}

/**
 * PageSpeed Insights adapter.
 * Mock mode returns the assessment fixture verbatim (clearly labelled `mock`).
 * Live mode calls the PSI v5 API and requires PAGESPEED_API_KEY.
 */
export async function fetchPageSpeed(url: string): Promise<PageSpeedSignal> {
  if (USE_MOCKS) return getPageSpeed({ url }) as PageSpeedSignal

  const apiKey = process.env.PAGESPEED_API_KEY
  if (!apiKey) {
    throw new Error('PAGESPEED_API_KEY is required when USE_MOCKS=false')
  }

  const endpoint = new URL('https://www.googleapis.com/pagespeedonline/v5/runPagespeed')
  endpoint.searchParams.set('url', url)
  endpoint.searchParams.set('strategy', 'mobile')
  endpoint.searchParams.set('category', 'performance')
  endpoint.searchParams.set('category', 'seo')
  endpoint.searchParams.set('category', 'accessibility')
  endpoint.searchParams.set('key', apiKey)

  const response = await fetch(endpoint, { signal: AbortSignal.timeout(30000) })
  if (!response.ok) {
    throw new Error(`PageSpeed API responded with ${response.status}`)
  }
  const data = (await response.json()) as PsiResponse
  const categories = data.lighthouseResult?.categories ?? {}
  const audits = data.lighthouseResult?.audits ?? {}

  return {
    source: 'live',
    url,
    strategy: 'mobile',
    scores: {
      performance: categories.performance?.score ?? 0,
      seo: categories.seo?.score ?? 0,
      accessibility: categories.accessibility?.score ?? 0,
    },
    metrics: {
      largestContentfulPaint: audits['largest-contentful-paint']?.displayValue ?? 'unavailable',
      cumulativeLayoutShift: audits['cumulative-layout-shift']?.numericValue ?? 0,
      interactionToNextPaint: audits['interaction-to-next-paint']?.displayValue ?? 'unavailable',
    },
    diagnostics: {
      renderBlockingResources: audits['render-blocking-resources']?.details?.items?.length ?? 0,
      unusedJavascript: audits['unused-javascript']?.displayValue ?? 'unavailable',
    },
    fetchedAt: new Date().toISOString(),
  }
}

export function pageSpeedProvenance() {
  return { adapter: 'pagespeed', mode: USE_MOCKS ? 'mock' : 'live', configured: USE_MOCKS || Boolean(process.env.PAGESPEED_API_KEY), env: env().NODE_ENV }
}
