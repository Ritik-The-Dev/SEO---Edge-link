import { extractPageSignals } from '@/server/crawl'
import { buildChecks } from '@/server/checks'
import { getPageSpeed } from '@/mocks/pagespeed.mock'
import { getSearchConsole } from '@/mocks/gsc.mock'
import { getRankings } from '@/mocks/dataforseo.mock'
import { buildMockAnalysis } from '@/mocks/ai.mock'
import { analyzeSchemaOrg } from '@/server/schema-org'
import type { AuditSignals, AuditTarget } from '@/types/audit'

const LONG_BODY = Array.from({ length: 30 })
  .map(() => 'Our Pune dental clinic provides preventive care, extractions, implants and emergency treatment.')
  .join(' ')

export const FIXTURE_HTML = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Dental Clinic in Pune — Northstar Dental</title>
  <meta name="description" content="Northstar Dental is a family dental clinic in Pune offering implants, extractions and emergency care seven days a week." />
  <link rel="canonical" href="https://example-dental-clinic.com/" />
  <meta name="robots" content="index,follow" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta property="og:title" content="Northstar Dental — Pune" />
  <meta property="og:description" content="Family dental clinic in Pune." />
  <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "Dentist",
      "name": "Northstar Dental",
      "address": { "@type": "PostalAddress", "streetAddress": "12 FC Road", "addressLocality": "Pune" },
      "telephone": "+91-9876543210"
    }
  </script>
</head>
<body>
  <h1>Dental clinic in Pune</h1>
  <h2>Our services</h2>
  <h2>Book an appointment</h2>
  <img src="/clinic.jpg" alt="Northstar Dental reception" />
  <img src="/team.jpg" />
  <a href="/services">Services</a>
  <a href="/contact">Contact</a>
  <a href="/about">About</a>
  <a href="https://example.org/reference">Reference</a>
  <a href="https://example.org/other" rel="nofollow">Partner</a>
  <p>${LONG_BODY}</p>
</body>
</html>`

export function makeCrawl(html: string = FIXTURE_HTML) {
  return extractPageSignals(html, {
    requestedUrl: 'https://example-dental-clinic.com/',
    finalUrl: new URL('https://example-dental-clinic.com/'),
    status: 200,
    ok: true,
    contentType: 'text/html; charset=utf-8',
    headers: { 'content-type': 'text/html; charset=utf-8' },
    redirects: [],
    truncated: false,
    durationMs: 480,
  })
}

export const FIXTURE_TARGET: AuditTarget = {
  url: 'https://example-dental-clinic.com/',
  businessType: 'Dental clinic',
  city: 'Pune',
  state: 'Maharashtra',
  clientName: 'Northstar Dental',
}

export function makeSignals(overrides: { crawlHtml?: string } = {}): AuditSignals {
  const crawl = makeCrawl(overrides.crawlHtml)
  const robots = {
    url: 'https://example-dental-clinic.com/robots.txt',
    exists: true,
    status: 200,
    sitemapUrls: ['https://example-dental-clinic.com/sitemap.xml'],
    disallowAll: false,
    blocksAllBots: false,
  }
  const sitemap = {
    url: 'https://example-dental-clinic.com/sitemap.xml',
    exists: true,
    status: 200,
    isIndex: false,
    urlCount: 24,
    sitemaps: [],
    sample: ['https://example-dental-clinic.com/services'],
  }
  const pageSpeed = getPageSpeed({ url: crawl.finalUrl })
  const gsc = getSearchConsole({ siteUrl: crawl.finalUrl })
  const dataForSeo = getRankings()
  const schemaOrg = analyzeSchemaOrg(crawl.structuredData.raw, FIXTURE_TARGET.businessType)

  return {
    crawl,
    robots,
    sitemap,
    schemaOrg,
    pageSpeed: pageSpeed as AuditSignals['pageSpeed'],
    gsc: gsc as AuditSignals['gsc'],
    dataForSeo: dataForSeo as AuditSignals['dataForSeo'],
    checks: buildChecks({
      crawl,
      robots,
      sitemap,
      schemaOrg,
      pageSpeed: pageSpeed as AuditSignals['pageSpeed'],
      gsc: gsc as AuditSignals['gsc'],
      dataForSeo: dataForSeo as AuditSignals['dataForSeo'],
    }),
    meta: {
      useMocks: true,
      crawledAt: new Date().toISOString(),
      pageLimit: 1,
      integrations: { pagespeed: 'mock', searchConsole: 'mock', dataForSeo: 'mock', whatsapp: 'mock' },
    },
  }
}

export function makeAnalysis(signals: AuditSignals = makeSignals()) {
  return buildMockAnalysis(signals, { url: FIXTURE_TARGET.url })
}
