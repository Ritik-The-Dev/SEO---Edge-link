import { safeFetch } from '@/lib/urls'
import type { SitemapResult } from '@/types/audit'

function extractLocs(xml: string, tag: 'url' | 'sitemap'): string[] {
  const pattern = new RegExp(`<${tag}>[\\s\\S]*?<loc>\\s*([^<\\s]+)\\s*</loc>[\\s\\S]*?</${tag}>`, 'gi')
  const results: string[] = []
  for (const match of xml.matchAll(pattern)) {
    const loc = match[1]?.trim()
    if (loc && results.length < 200) results.push(loc)
  }
  return results
}

/**
 * Check the declared sitemaps (robots.txt) or the conventional /sitemap.xml.
 * Sitemap indexes are detected and counted rather than recursively crawled, to
 * keep a single audit bounded.
 */
export async function checkSitemap(origin: string, declared: string[]): Promise<SitemapResult> {
  const candidates = declared.length ? declared.slice(0, 3) : [new URL('/sitemap.xml', origin).toString()]
  const primary = candidates[0]!

  const base: SitemapResult = {
    url: primary,
    exists: false,
    status: null,
    isIndex: false,
    urlCount: 0,
    sitemaps: [],
    sample: [],
  }

  try {
    const fetched = await safeFetch(primary, { timeoutMs: 12000, maxBytes: 3_000_000, maxRedirects: 2 })
    if (!fetched.ok) {
      return { ...base, status: fetched.status, error: `Sitemap returned HTTP ${fetched.status}` }
    }

    const body = fetched.body
    const isIndex = /<sitemapindex[\s>]/i.test(body)
    const entries = isIndex ? extractLocs(body, 'sitemap') : extractLocs(body, 'url')

    return {
      url: primary,
      exists: true,
      status: fetched.status,
      isIndex,
      urlCount: entries.length,
      sitemaps: isIndex ? entries.slice(0, 20) : [],
      sample: isIndex ? [] : entries.slice(0, 5),
    }
  } catch (error) {
    return { ...base, error: error instanceof Error ? error.message : 'Could not read the sitemap' }
  }
}
