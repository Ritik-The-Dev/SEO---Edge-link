/** Shared types for the audit pipeline (persisted in Audit.signals JSON). */

export interface CrawlImageStats {
  total: number
  missingAlt: number
  missingAltSamples: string[]
}

export interface CrawlLinkStats {
  total: number
  internal: number
  external: number
  nofollow: number
  samples: { internal: string[]; external: string[] }
}

export interface CrawlResult {
  requestedUrl: string
  finalUrl: string
  status: number
  ok: boolean
  contentType: string
  redirects: string[]
  fetchedAt: string
  durationMs: number
  truncated: boolean
  title: string | null
  titleLength: number
  metaDescription: string | null
  metaDescriptionLength: number
  canonical: string | null
  robotsMeta: string | null
  xRobotsTag: string | null
  lang: string | null
  viewport: string | null
  charset: string | null
  headings: { h1: string[]; h1Count: number; h2Count: number; h3Count: number }
  images: CrawlImageStats
  links: CrawlLinkStats
  openGraph: Record<string, string>
  structuredData: { blocks: number; types: string[]; raw: string[] }
  hreflang: Array<{ hreflang: string; href: string }>
  wordCount: number
  cmsHints: string[]
  analytics: string[]
  notes: string[]
}

export interface RobotsResult {
  url: string
  exists: boolean
  status: number | null
  sitemapUrls: string[]
  disallowAll: boolean
  blocksAllBots: boolean
  error?: string
}

export interface SitemapResult {
  url: string
  exists: boolean
  status: number | null
  isIndex: boolean
  urlCount: number
  sitemaps: string[]
  sample: string[]
  error?: string
}

export interface SchemaOrgBlock {
  type: string
  valid: boolean
  errors: string[]
  propertyCount: number
}

export interface SchemaOrgResult {
  blocks: SchemaOrgBlock[]
  types: string[]
  validCount: number
  invalidCount: number
  hasLocalBusiness: boolean
  suggestsLocalBusiness: boolean
}

export interface PageSpeedSignal {
  source: 'mock' | 'live'
  url: string
  strategy: 'mobile'
  scores: { performance: number; seo: number; accessibility: number }
  metrics: {
    largestContentfulPaint: string
    cumulativeLayoutShift: number
    interactionToNextPaint: string
  }
  diagnostics: { renderBlockingResources: number; unusedJavascript: string }
  fetchedAt: string
}

export interface GscQueryRow {
  query: string
  clicks: number
  impressions: number
  ctr: number
  position: number
}

export interface GscSignal {
  source: 'mock' | 'live'
  siteUrl: string
  totals: { clicks: number; impressions: number; ctr: number }
  indexCoverageErrors: number
  queries: GscQueryRow[]
  fetchedAt: string
}

export interface DataForSeoResultRow {
  domain: string
  position: number
  absolutePosition: number
  isClient: boolean
}

export interface DataForSeoSignal {
  source: 'mock' | 'live'
  keyword: string
  searchVolume: number
  clientRankPosition: number
  rankGroup: string
  results: DataForSeoResultRow[]
  fetchedAt: string
}

export type CheckStatus = 'pass' | 'warn' | 'fail' | 'info'

export interface SeoCheck {
  id: string
  label: string
  category: 'Technical' | 'OnPage' | 'Content' | 'Schema' | 'CWV'
  status: CheckStatus
  detail: string
  source: 'crawl' | 'robots' | 'sitemap' | 'pageSpeed' | 'gsc' | 'dataForSeo' | 'schema'
}

export interface AuditSignals {
  crawl: CrawlResult
  robots: RobotsResult
  sitemap: SitemapResult
  schemaOrg: SchemaOrgResult
  pageSpeed: PageSpeedSignal
  gsc: GscSignal
  dataForSeo: DataForSeoSignal
  checks: SeoCheck[]
  meta: {
    useMocks: boolean
    crawledAt: string
    pageLimit: number
    integrations: Record<string, 'mock' | 'live'>
  }
}

export interface AuditTarget {
  url: string
  businessType: string
  city: string
  state: string
  clientName: string
}
