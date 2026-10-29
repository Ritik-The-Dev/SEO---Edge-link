import type {
  CrawlResult,
  DataForSeoSignal,
  GscSignal,
  PageSpeedSignal,
  RobotsResult,
  SchemaOrgResult,
  SeoCheck,
  SitemapResult,
} from '@/types/audit'

interface CheckInput {
  crawl: CrawlResult
  robots: RobotsResult
  sitemap: SitemapResult
  schemaOrg: SchemaOrgResult
  pageSpeed: PageSpeedSignal
  gsc: GscSignal
  dataForSeo: DataForSeoSignal
}

function check(
  id: string,
  label: string,
  category: SeoCheck['category'],
  status: SeoCheck['status'],
  detail: string,
  source: SeoCheck['source'],
): SeoCheck {
  return { id, label, category, status, detail, source }
}

function seconds(value: string): number | null {
  const match = value.match(/([\d.]+)\s*s/)
  return match?.[1] ? Number(match[1]) : null
}

function milliseconds(value: string): number | null {
  const match = value.match(/([\d.]+)\s*ms/)
  return match?.[1] ? Number(match[1]) : null
}

function mebibytes(value: string): number | null {
  const match = value.match(/([\d.]+)\s*KiB/i)
  return match?.[1] ? Number(match[1]) / 1024 : null
}

/**
 * Deterministic checks over the collected signals.
 * These are the "observed" layer: the AI prompt receives them and the UI shows
 * them as measured facts, independent of the AI narrative.
 */
export function buildChecks(input: CheckInput): SeoCheck[] {
  const { crawl, robots, sitemap, schemaOrg, pageSpeed, gsc, dataForSeo } = input
  const checks: SeoCheck[] = []
  const finalUrl = new URL(crawl.finalUrl)

  checks.push(
    check(
      'https',
      'HTTPS',
      'Technical',
      finalUrl.protocol === 'https:' ? 'pass' : 'fail',
      finalUrl.protocol === 'https:' ? 'The audited page is served over HTTPS.' : 'The page is served over plain HTTP.',
      'crawl',
    ),
  )

  checks.push(
    check(
      'title-present',
      'Page title',
      'OnPage',
      crawl.title ? 'pass' : 'fail',
      crawl.title ? `Title: “${crawl.title}” (${crawl.titleLength} characters).` : 'No <title> element was found.',
      'crawl',
    ),
  )

  checks.push(
    check(
      'title-length',
      'Title length',
      'OnPage',
      !crawl.title ? 'fail' : crawl.titleLength >= 30 && crawl.titleLength <= 60 ? 'pass' : 'warn',
      !crawl.title
        ? 'A title is required before length can be assessed.'
        : crawl.titleLength < 30
          ? `Title is short at ${crawl.titleLength} characters; 30–60 is the useful range.`
          : crawl.titleLength > 60
            ? `Title is ${crawl.titleLength} characters; search results may truncate it.`
            : `Title length (${crawl.titleLength}) is within the 30–60 character range.`,
      'crawl',
    ),
  )

  checks.push(
    check(
      'meta-description',
      'Meta description',
      'OnPage',
      crawl.metaDescription ? 'pass' : 'fail',
      crawl.metaDescription
        ? `Meta description present (${crawl.metaDescriptionLength} characters).`
        : 'No meta description was found; search engines will improvise the snippet.',
      'crawl',
    ),
  )

  checks.push(
    check(
      'meta-description-length',
      'Meta description length',
      'OnPage',
      !crawl.metaDescription
        ? 'fail'
        : crawl.metaDescriptionLength >= 70 && crawl.metaDescriptionLength <= 160
          ? 'pass'
          : 'warn',
      !crawl.metaDescription
        ? 'A description is required before length can be assessed.'
        : `Descriptions of 70–160 characters fit most snippets; this one is ${crawl.metaDescriptionLength}.`,
      'crawl',
    ),
  )

  checks.push(
    check(
      'h1-single',
      'Heading structure',
      'OnPage',
      crawl.headings.h1Count === 1 ? 'pass' : crawl.headings.h1Count === 0 ? 'fail' : 'warn',
      crawl.headings.h1Count === 1
        ? `One H1 found: “${crawl.headings.h1[0] ?? ''}”.`
        : crawl.headings.h1Count === 0
          ? 'No H1 element was found.'
          : `${crawl.headings.h1Count} H1 elements compete for the page topic.`,
      'crawl',
    ),
  )

  checks.push(
    check(
      'canonical',
      'Canonical URL',
      'Technical',
      crawl.canonical ? (/^https?:\/\//i.test(crawl.canonical) ? 'pass' : 'warn') : 'warn',
      crawl.canonical
        ? `Canonical: ${crawl.canonical}.`
        : 'No canonical link element; duplicate URLs may split signals.',
      'crawl',
    ),
  )

  const robotsValue = `${crawl.robotsMeta ?? ''} ${crawl.xRobotsTag ?? ''}`.toLowerCase()
  const noindex = robotsValue.includes('noindex')
  checks.push(
    check(
      'robots-meta-indexable',
      'Indexability',
      'Technical',
      noindex ? 'fail' : 'pass',
      noindex
        ? `The page is marked noindex (${crawl.robotsMeta ?? crawl.xRobotsTag}).`
        : 'No noindex directive was found on the page.',
      'crawl',
    ),
  )

  checks.push(
    check(
      'image-alt',
      'Image alt text',
      'OnPage',
      crawl.images.total === 0
        ? 'info'
        : crawl.images.missingAlt === 0
          ? 'pass'
          : crawl.images.missingAlt / Math.max(1, crawl.images.total) > 0.25
            ? 'fail'
            : 'warn',
      crawl.images.total === 0
        ? 'No images were found on the page.'
        : `${crawl.images.missingAlt} of ${crawl.images.total} images are missing an alt attribute.`,
      'crawl',
    ),
  )

  checks.push(
    check(
      'internal-links',
      'Internal linking',
      'Technical',
      crawl.links.internal >= 10 ? 'pass' : crawl.links.internal >= 3 ? 'warn' : 'fail',
      `${crawl.links.internal} internal and ${crawl.links.external} external links were found.`,
      'crawl',
    ),
  )

  checks.push(
    check(
      'structured-data',
      'Structured data',
      'Schema',
      crawl.structuredData.blocks === 0 ? 'fail' : schemaOrg.invalidCount === 0 ? 'pass' : 'warn',
      crawl.structuredData.blocks === 0
        ? 'No JSON-LD structured data was found.'
        : `${crawl.structuredData.blocks} JSON-LD block(s): ${crawl.structuredData.types.join(', ') || 'no recognised @type'} · ${schemaOrg.validCount} valid, ${schemaOrg.invalidCount} with issues.`,
      'schema',
    ),
  )

  checks.push(
    check(
      'local-business-schema',
      'LocalBusiness schema',
      'Schema',
      schemaOrg.hasLocalBusiness ? 'pass' : schemaOrg.suggestsLocalBusiness ? 'fail' : 'info',
      schemaOrg.hasLocalBusiness
        ? 'A LocalBusiness-family type is present.'
        : schemaOrg.suggestsLocalBusiness
          ? 'No LocalBusiness-family type detected for a local service business.'
          : 'No LocalBusiness type detected and the business type does not clearly require one.',
      'schema',
    ),
  )

  checks.push(
    check(
      'viewport',
      'Mobile viewport',
      'Technical',
      crawl.viewport ? 'pass' : 'fail',
      crawl.viewport ? `Viewport meta: ${crawl.viewport}.` : 'No viewport meta tag; mobile rendering will be affected.',
      'crawl',
    ),
  )

  checks.push(
    check(
      'lang',
      'Language declaration',
      'Technical',
      crawl.lang ? 'pass' : 'warn',
      crawl.lang ? `html lang="${crawl.lang}".` : 'The <html> element has no lang attribute.',
      'crawl',
    ),
  )

  checks.push(
    check(
      'open-graph',
      'Open Graph tags',
      'Content',
      crawl.openGraph['og:title'] && crawl.openGraph['og:description'] ? 'pass' : 'warn',
      crawl.openGraph['og:title']
        ? `Open Graph present (${Object.keys(crawl.openGraph).length} tags).`
        : 'No Open Graph title/description; shared links may render poorly.',
      'crawl',
    ),
  )

  checks.push(
    check(
      'word-count',
      'Content depth',
      'Content',
      crawl.wordCount >= 500 ? 'pass' : crawl.wordCount >= 250 ? 'warn' : 'fail',
      `${crawl.wordCount} words of visible body copy on the audited page.`,
      'crawl',
    ),
  )

  checks.push(
    check(
      'robots-txt',
      'robots.txt',
      'Technical',
      !robots.exists ? 'warn' : robots.blocksAllBots ? 'fail' : 'pass',
      !robots.exists
        ? robots.error
          ? `robots.txt could not be read: ${robots.error}`
          : 'No robots.txt was found at the origin.'
        : robots.blocksAllBots
          ? 'robots.txt disallows all crawlers.'
          : `robots.txt allows crawling and declares ${robots.sitemapUrls.length} sitemap URL(s).`,
      'robots',
    ),
  )

  checks.push(
    check(
      'sitemap',
      'XML sitemap',
      'Technical',
      sitemap.exists ? (sitemap.urlCount > 0 ? 'pass' : 'warn') : 'fail',
      sitemap.exists
        ? sitemap.isIndex
          ? `Sitemap index with ${sitemap.urlCount} child sitemaps.`
          : `Sitemap found with ${sitemap.urlCount} URLs.`
        : sitemap.error
          ? `Sitemap could not be read: ${sitemap.error}`
          : 'No sitemap was found.',
      'sitemap',
    ),
  )

  const lcp = seconds(pageSpeed.metrics.largestContentfulPaint)
  checks.push(
    check(
      'cwv-lcp',
      'Largest Contentful Paint',
      'CWV',
      lcp === null ? 'info' : lcp <= 2.5 ? 'pass' : lcp <= 4 ? 'warn' : 'fail',
      `LCP is ${pageSpeed.metrics.largestContentfulPaint} (mobile) against a 2.5 s good threshold.`,
      'pageSpeed',
    ),
  )

  const cls = pageSpeed.metrics.cumulativeLayoutShift
  checks.push(
    check(
      'cwv-cls',
      'Cumulative Layout Shift',
      'CWV',
      cls <= 0.1 ? 'pass' : cls <= 0.25 ? 'warn' : 'fail',
      `CLS is ${cls} against a 0.1 good threshold.`,
      'pageSpeed',
    ),
  )

  const inp = milliseconds(pageSpeed.metrics.interactionToNextPaint)
  checks.push(
    check(
      'cwv-inp',
      'Interaction to Next Paint',
      'CWV',
      inp === null ? 'info' : inp <= 200 ? 'pass' : inp <= 500 ? 'warn' : 'fail',
      `INP is ${pageSpeed.metrics.interactionToNextPaint} against a 200 ms good threshold.`,
      'pageSpeed',
    ),
  )

  const performance = Math.round(pageSpeed.scores.performance * 100)
  checks.push(
    check(
      'pagespeed-performance',
      'Lab performance score',
      'CWV',
      performance >= 90 ? 'pass' : performance >= 50 ? 'warn' : 'fail',
      `PageSpeed mobile performance score is ${performance}/100.`,
      'pageSpeed',
    ),
  )

  checks.push(
    check(
      'render-blocking',
      'Render-blocking resources',
      'CWV',
      pageSpeed.diagnostics.renderBlockingResources <= 0
        ? 'pass'
        : pageSpeed.diagnostics.renderBlockingResources <= 3
          ? 'warn'
          : 'fail',
      `${pageSpeed.diagnostics.renderBlockingResources} render-blocking resource(s) reported.`,
      'pageSpeed',
    ),
  )

  const unusedJs = mebibytes(pageSpeed.diagnostics.unusedJavascript)
  checks.push(
    check(
      'unused-js',
      'Unused JavaScript',
      'CWV',
      unusedJs === null ? 'info' : unusedJs <= 0.1 ? 'pass' : unusedJs <= 0.5 ? 'warn' : 'fail',
      `${pageSpeed.diagnostics.unusedJavascript} of unused JavaScript reported.`,
      'pageSpeed',
    ),
  )

  checks.push(
    check(
      'gsc-coverage',
      'Search Console coverage',
      'Technical',
      gsc.indexCoverageErrors === 0 ? 'pass' : gsc.indexCoverageErrors <= 5 ? 'warn' : 'fail',
      `${gsc.indexCoverageErrors} index-coverage error(s) in Search Console.`,
      'gsc',
    ),
  )

  checks.push(
    check(
      'ranking-position',
      'Keyword position',
      'Content',
      dataForSeo.clientRankPosition <= 3 ? 'pass' : dataForSeo.clientRankPosition <= 10 ? 'warn' : 'fail',
      `“${dataForSeo.keyword}” ranks at position ${dataForSeo.clientRankPosition} (volume ${dataForSeo.searchVolume}/mo).`,
      'dataForSeo',
    ),
  )

  return checks
}
