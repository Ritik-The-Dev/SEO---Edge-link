import * as cheerio from 'cheerio'
import { normalizeHttpUrl, safeFetch } from '@/lib/urls'
import type { CrawlResult } from '@/types/audit'

const MAX_JSONLD_BLOCKS = 10
const MAX_JSONLD_BYTES = 20_000

function absoluteUrl(href: string | undefined, base: URL): string | null {
  if (!href) return null
  try {
    return new URL(href, base).toString()
  } catch {
    return null
  }
}

export interface CrawlContext {
  requestedUrl: string
  finalUrl: URL
  status: number
  ok: boolean
  contentType: string
  headers: Record<string, string>
  redirects: string[]
  truncated: boolean
  durationMs: number
}

/**
 * Pure HTML → signal extraction (no network). Exported so the extraction rules
 * can be unit-tested against fixed markup.
 */
export function extractPageSignals(html: string, context: CrawlContext): CrawlResult {
  const $ = cheerio.load(html)
  const finalUrl = context.finalUrl
  const notes: string[] = []

  if (context.truncated) notes.push('Response exceeded the 2 MB crawl ceiling and was truncated.')
  if (context.redirects.length) {
    notes.push(`Followed ${context.redirects.length} redirect(s) before the final HTML.`)
  }
  if (!context.ok) notes.push(`The final response returned HTTP ${context.status}.`)

  const title = $('head title').first().text().trim() || null
  const metaDescription = $('meta[name="description"]').attr('content')?.trim() || null
  const canonical = $('link[rel="canonical"]').attr('href')?.trim() || null
  const robotsMeta = $('meta[name="robots"]').attr('content')?.trim() || null
  const xRobotsTag = context.headers['x-robots-tag'] ?? null
  const lang = $('html').attr('lang')?.trim() || null
  const viewport = $('meta[name="viewport"]').attr('content')?.trim() || null
  const charset =
    $('meta[charset]').attr('charset')?.trim() ||
    context.contentType.match(/charset=([\w-]+)/i)?.[1] ||
    null

  const h1 = $('h1')
    .map((_, element) => $(element).text().replace(/\s+/g, ' ').trim())
    .get()
    .filter(Boolean)

  const images = $('img')
  const missingAltSamples: string[] = []
  let missingAlt = 0
  images.each((_, element) => {
    const alt = $(element).attr('alt')
    if (alt === undefined) {
      missingAlt += 1
      if (missingAltSamples.length < 5) {
        missingAltSamples.push(absoluteUrl($(element).attr('src'), finalUrl) ?? 'inline/unknown image')
      }
    }
  })

  let internal = 0
  let external = 0
  let nofollow = 0
  let totalLinks = 0
  const internalSamples: string[] = []
  const externalSamples: string[] = []

  $('a[href]').each((_, element) => {
    const href = $(element).attr('href')?.trim()
    if (!href || href.startsWith('#') || /^(mailto:|tel:|javascript:|data:)/i.test(href)) return
    const resolved = absoluteUrl(href, finalUrl)
    if (!resolved) return
    totalLinks += 1
    const rel = ($(element).attr('rel') ?? '').toLowerCase()
    if (rel.includes('nofollow')) nofollow += 1
    try {
      const linkUrl = new URL(resolved)
      if (linkUrl.hostname === finalUrl.hostname) {
        internal += 1
        if (internalSamples.length < 5) internalSamples.push(linkUrl.pathname)
      } else {
        external += 1
        if (externalSamples.length < 5) externalSamples.push(linkUrl.hostname)
      }
    } catch {
      notes.push('One or more anchors used an unparseable URL.')
    }
  })

  const openGraph: Record<string, string> = {}
  $('meta[property^="og:"]').each((_, element) => {
    const property = $(element).attr('property')
    const content = $(element).attr('content')
    if (property && content) openGraph[property] = content.slice(0, 300)
  })

  const jsonLdRaw: string[] = []
  const structuredTypes: string[] = []
  $('script[type="application/ld+json"]').each((_, element) => {
    if (jsonLdRaw.length >= MAX_JSONLD_BLOCKS) return
    const raw = $(element).text().trim()
    if (!raw) return
    jsonLdRaw.push(raw.slice(0, MAX_JSONLD_BYTES))
    try {
      const parsed = JSON.parse(raw) as unknown
      const collect = (value: unknown, depth = 0) => {
        if (depth > 6 || value === null || value === undefined) return
        if (Array.isArray(value)) {
          value.forEach((item) => collect(item, depth + 1))
          return
        }
        if (typeof value === 'object') {
          const record = value as Record<string, unknown>
          const type = record['@type']
          if (typeof type === 'string' && !structuredTypes.includes(type)) structuredTypes.push(type)
          if (Array.isArray(type)) {
            type.forEach((entry) => {
              if (typeof entry === 'string' && !structuredTypes.includes(entry)) structuredTypes.push(entry)
            })
          }
          if (record['@graph']) collect(record['@graph'], depth + 1)
        }
      }
      collect(parsed)
    } catch {
      notes.push('A JSON-LD block could not be parsed.')
    }
  })

  const hreflang = $('link[rel="alternate"][hreflang]')
    .map((_, element) => ({
      hreflang: $(element).attr('hreflang') ?? '',
      href: absoluteUrl($(element).attr('href'), finalUrl) ?? '',
    }))
    .get()
    .filter((entry) => Boolean(entry.hreflang && entry.href))
    .slice(0, 20)

  $('script, style, noscript, svg').remove()
  const bodyText = $('body').text().replace(/\s+/g, ' ').trim()
  const wordCount = bodyText ? bodyText.split(' ').filter(Boolean).length : 0

  const lowered = html.toLowerCase()
  const cmsHints: string[] = []
  if (lowered.includes('wp-content') || lowered.includes('wp-includes')) cmsHints.push('WordPress')
  if (lowered.includes('cdn.shopify.com')) cmsHints.push('Shopify')
  if (lowered.includes('__next_data__')) cmsHints.push('Next.js')
  if (lowered.includes('drupal')) cmsHints.push('Drupal')
  if (lowered.includes('webflow')) cmsHints.push('Webflow')
  if (lowered.includes('wix.com')) cmsHints.push('Wix')

  const analytics: string[] = []
  if (lowered.includes('googletagmanager.com/gtag/js')) analytics.push('Google Analytics 4 / gtag')
  if (lowered.includes('googletagmanager.com/gtm.js')) analytics.push('Google Tag Manager')
  if (lowered.includes('connect.facebook.net')) analytics.push('Meta Pixel')
  if (lowered.includes('clarity.ms')) analytics.push('Microsoft Clarity')

  return {
    requestedUrl: context.requestedUrl,
    finalUrl: finalUrl.toString(),
    status: context.status,
    ok: context.ok,
    contentType: context.contentType,
    redirects: context.redirects,
    fetchedAt: new Date().toISOString(),
    durationMs: context.durationMs,
    truncated: context.truncated,
    title,
    titleLength: title?.length ?? 0,
    metaDescription,
    metaDescriptionLength: metaDescription?.length ?? 0,
    canonical,
    robotsMeta,
    xRobotsTag,
    lang,
    viewport,
    charset,
    headings: { h1, h1Count: h1.length, h2Count: $('h2').length, h3Count: $('h3').length },
    images: { total: images.length, missingAlt, missingAltSamples },
    links: {
      total: totalLinks,
      internal,
      external,
      nofollow,
      samples: { internal: internalSamples, external: externalSamples },
    },
    openGraph,
    structuredData: { blocks: jsonLdRaw.length, types: structuredTypes, raw: jsonLdRaw },
    hreflang,
    wordCount,
    cmsHints,
    analytics,
    notes,
  }
}

/**
 * Fetches and parses a single page with Cheerio.
 *
 * Deliberately single-page: a reliable, auditable snapshot is more useful than
 * an unreliable site-wide crawl. `pageLimit` is carried in the signals metadata
 * so a multi-page expansion stays a configuration change, not a rewrite.
 */
export async function crawlWebsite(rawUrl: string): Promise<CrawlResult> {
  const requested = normalizeHttpUrl(rawUrl)
  const fetched = await safeFetch(requested, { timeoutMs: 20000, maxBytes: 2_000_000, maxRedirects: 4 })

  const isHtml =
    fetched.contentType.includes('text/html') || fetched.contentType.includes('application/xhtml+xml')
  if (!isHtml) {
    throw new Error(
      `The URL returned "${fetched.contentType || 'an unknown content type'}" instead of HTML (status ${fetched.status})`,
    )
  }

  return extractPageSignals(fetched.body, {
    requestedUrl: requested.toString(),
    finalUrl: new URL(fetched.finalUrl),
    status: fetched.status,
    ok: fetched.ok,
    contentType: fetched.contentType,
    headers: fetched.headers,
    redirects: fetched.redirects,
    truncated: fetched.truncated,
    durationMs: fetched.durationMs,
  })
}

export function crawlProvenance() {
  return { fetcher: 'fetch', parser: 'cheerio', pagesCrawled: 1 }
}
