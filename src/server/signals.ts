import { crawlWebsite } from './crawl'
import { checkRobots } from './robots'
import { checkSitemap } from './sitemap'
import { analyzeSchemaOrg } from './schema-org'
import { buildChecks } from './checks'
import { fetchPageSpeed } from '@/integrations/pagespeed'
import { fetchSearchConsole } from '@/integrations/search-console'
import { fetchRankings } from '@/integrations/dataforseo'
import { USE_MOCKS } from '@/mocks/index'
import type { AuditSignals, AuditTarget } from '@/types/audit'

/**
 * Collects every signal for one audit. Kept dependency-injectable at the edges
 * so unit tests can exercise analysis without network access.
 */
export async function collectSignals(
  target: AuditTarget,
  options: {
    crawl?: typeof crawlWebsite
    onStage?: (stage: string, detail?: string) => Promise<void> | void
  } = {},
): Promise<AuditSignals> {
  const crawlFn = options.crawl ?? crawlWebsite
  const onStage = options.onStage ?? (() => undefined)

  await onStage('crawling', `Fetching and parsing ${target.url}`)
  const crawl = await crawlFn(target.url)
  const origin = new URL(crawl.finalUrl).origin

  await onStage('technical-checks', 'Reading robots.txt and sitemap.xml')
  const [robots, pageSpeed, gsc, dataForSeo] = await Promise.all([
    checkRobots(origin),
    fetchPageSpeed(crawl.finalUrl),
    fetchSearchConsole(crawl.finalUrl),
    fetchRankings(),
  ])
  const sitemap = await checkSitemap(origin, robots.sitemapUrls)
  const schemaOrg = analyzeSchemaOrg(crawl.structuredData.raw, target.businessType)

  const checks = buildChecks({ crawl, robots, sitemap, schemaOrg, pageSpeed, gsc, dataForSeo })

  return {
    crawl,
    robots,
    sitemap,
    schemaOrg,
    pageSpeed,
    gsc,
    dataForSeo,
    checks,
    meta: {
      useMocks: USE_MOCKS,
      crawledAt: new Date().toISOString(),
      pageLimit: 1,
      integrations: {
        pagespeed: pageSpeed.source,
        searchConsole: gsc.source,
        dataForSeo: dataForSeo.source,
        whatsapp: USE_MOCKS ? 'mock' : 'live',
      },
    },
  }
}
