/**
 * Deterministic AI analysis fixture (AI_USE_MOCKS=true).
 *
 * This is NOT a Claude response. It exists so the pipeline, schema validation,
 * persistence, PDF and notifications can be exercised without spending tokens or
 * depending on the network. It is derived from the actual crawled signals, so a
 * different website produces a different report; it is never a static score.
 * Provenance is persisted as `aiSource: MOCK` and disclosed in the PDF.
 */

/** Specific, actionable fixes keyed by deterministic check id. */
const FIXES = {
  https: 'Serve the site over HTTPS and 301-redirect every http:// URL to its https:// equivalent.',
  'title-present': 'Add a unique <title> to the document head describing the service and city.',
  'title-length': 'Rewrite the title to 50–60 characters, leading with the primary local keyword.',
  'meta-description': 'Add a meta description summarising the service, location and a clear reason to click.',
  'meta-description-length': 'Rewrite the meta description to 120–155 characters and include a call to action.',
  'h1-single': 'Keep exactly one H1 that states the primary service and city; demote the rest to H2/H3.',
  canonical: 'Add a self-referencing <link rel="canonical"> using the final https URL.',
  'robots-meta-indexable': 'Remove the noindex directive from the meta robots tag or X-Robots-Tag header.',
  'image-alt': 'Write descriptive alt text for every content image; keep it under 125 characters.',
  'internal-links': 'Link service pages from the homepage and from related content to spread internal equity.',
  'structured-data': 'Add JSON-LD for LocalBusiness (or the relevant schema type) with name, address, phone and URL.',
  'local-business-schema': 'Add LocalBusiness/Dentist JSON-LD with address, geo, openingHours and sameAs profiles.',
  viewport: 'Add <meta name="viewport" content="width=device-width, initial-scale=1">.',
  lang: 'Set the correct lang attribute on the <html> element.',
  'robots-txt': 'Publish a robots.txt that allows crawling and declares the XML sitemap.',
  sitemap: 'Publish an XML sitemap, declare it in robots.txt and submit it in Search Console.',
  'cwv-lcp': 'Compress and preload the LCP image, and serve it from the same origin with a modern format.',
  'cwv-cls': 'Reserve width and height on images, embeds and ad slots to stop layout shift.',
  'cwv-inp': 'Reduce main-thread work by deferring non-critical scripts and splitting long tasks.',
  'pagespeed-performance': 'Address render-blocking CSS/JS and unused JavaScript before adding new features.',
  'render-blocking': 'Inline critical CSS and defer non-critical stylesheets and scripts.',
  'unused-js': 'Remove unused JavaScript and code-split third-party widgets behind interaction.',
  'gsc-coverage': 'Fix the excluded URLs surfaced in the Index coverage report, then request validation.',
  'ranking-position': 'Strengthen the ranking page with local intent content, internal links and reviews.',
  'open-graph': 'Add Open Graph title, description and image tags for reliable social previews.',
  'word-count': 'Expand thin pages with service detail, pricing guidance, FAQs and local proof points.',
}

const IMPACT_BY_STATUS = { fail: 'High', warn: 'Medium', info: 'Low' }
const EFFORT_BY_ID = {
  'title-present': { effort: 'Hours', effort_hours: 1 },
  'title-length': { effort: 'Hours', effort_hours: 1 },
  'meta-description': { effort: 'Hours', effort_hours: 1 },
  'meta-description-length': { effort: 'Hours', effort_hours: 1 },
  'image-alt': { effort: 'Hours', effort_hours: 2 },
  viewport: { effort: 'Hours', effort_hours: 0.5 },
  lang: { effort: 'Hours', effort_hours: 0.5 },
  'open-graph': { effort: 'Hours', effort_hours: 1 },
  canonical: { effort: 'Hours', effort_hours: 1 },
  'robots-meta-indexable': { effort: 'Hours', effort_hours: 1 },
  'cwv-lcp': { effort: 'Days', effort_hours: 16 },
  'cwv-cls': { effort: 'Days', effort_hours: 12 },
  'cwv-inp': { effort: 'Days', effort_hours: 24 },
  'pagespeed-performance': { effort: 'Days', effort_hours: 20 },
  'render-blocking': { effort: 'Days', effort_hours: 10 },
  'unused-js': { effort: 'Days', effort_hours: 12 },
  'structured-data': { effort: 'Days', effort_hours: 6 },
  'local-business-schema': { effort: 'Days', effort_hours: 6 },
  sitemap: { effort: 'Hours', effort_hours: 2 },
  'robots-txt': { effort: 'Hours', effort_hours: 1 },
  'gsc-coverage': { effort: 'Days', effort_hours: 8 },
  'ranking-position': { effort: 'Weeks', effort_hours: 40 },
  'internal-links': { effort: 'Days', effort_hours: 8 },
  'word-count': { effort: 'Weeks', effort_hours: 24 },
  https: { effort: 'Days', effort_hours: 8 },
}

const VERIFICATION = {
  'cwv-lcp': 'Re-run PageSpeed field data; LCP should fall below 2.5 s on mobile.',
  'cwv-cls': 'Re-run PageSpeed; CLS should stay below 0.1 in both lab and field data.',
  'cwv-inp': 'Re-run PageSpeed; INP should fall below 200 ms on mobile.',
  'gsc-coverage': 'Search Console → Index coverage should show the affected URLs as Valid.',
  'ranking-position': 'Track the keyword weekly in the rank API; position should improve past the current value.',
  'meta-description': 'Search Console CTR for the page should improve within 4 weeks of the change.',
  'image-alt': 'A crawler re-run should report zero content images without alt attributes.',
  'local-business-schema': "Google's Rich Results Test should validate the LocalBusiness block without errors.",
}

function categoryScore(checks, category) {
  const relevant = checks.filter((check) => check.category === category)
  if (!relevant.length) return 75
  let score = 100
  for (const check of relevant) {
    if (check.status === 'fail') score -= 16
    else if (check.status === 'warn') score -= 7
  }
  return Math.max(20, Math.min(100, Math.round(score)))
}

function effortFor(id) {
  return EFFORT_BY_ID[id] || { effort: 'Days', effort_hours: 8 }
}

function priorityFor(status) {
  if (status === 'fail') return 'HIGH'
  if (status === 'warn') return 'MEDIUM'
  return 'LOW'
}

/**
 * @param {object} signals  Persisted audit signals (crawl, robots, checks, …)
 * @param {object} [meta]
 * @returns {object} AI-shaped analysis that satisfies the versioned schema
 */
export function buildMockAnalysis(signals, meta = {}) {
  const checks = Array.isArray(signals?.checks) ? signals.checks : []
  const actionable = checks.filter((check) => check.status === 'fail' || check.status === 'warn')

  const scoreBreakdown = {
    technical: categoryScore(checks, 'Technical'),
    on_page: categoryScore(checks, 'OnPage'),
    content: categoryScore(checks, 'Content'),
    core_web_vitals: categoryScore(checks, 'CWV'),
    schema: categoryScore(checks, 'Schema'),
  }

  const overall = Math.round(
    scoreBreakdown.technical * 0.3 +
      scoreBreakdown.on_page * 0.25 +
      scoreBreakdown.core_web_vitals * 0.2 +
      scoreBreakdown.content * 0.15 +
      scoreBreakdown.schema * 0.1,
  )

  const recommendations = actionable.slice(0, 12).map((check, index) => {
    const effort = effortFor(check.id)
    return {
      priority: index < 3 ? 'CRITICAL' : priorityFor(check.status),
      category: check.category,
      finding: `${check.label}: ${check.detail}`,
      fix: FIXES[check.id] || 'Resolve the issue described in the finding and re-run the audit to confirm.',
      estimated_impact: IMPACT_BY_STATUS[check.status] || 'Medium',
      effort: effort.effort,
      effort_hours: effort.effort_hours,
      falsifiability_check:
        VERIFICATION[check.id] || 'Re-run the audit; this check should move to pass with no new regressions.',
    }
  })

  const issueTitle = (recommendation) => {
    const [label] = recommendation.finding.split(': ')
    return label || recommendation.category
  }

  const critical = recommendations
    .filter((recommendation) => recommendation.priority === 'CRITICAL')
    .slice(0, 5)
    .map((recommendation) => ({ title: issueTitle(recommendation), detail: recommendation.finding }))

  const important = recommendations
    .filter((recommendation) => recommendation.priority === 'HIGH' || recommendation.priority === 'MEDIUM')
    .slice(0, 8)
    .map((recommendation) => ({ title: issueTitle(recommendation), detail: recommendation.finding }))

  // One quick win per distinct fix, so a missing tag and its length check do not
  // produce two near-identical suggestions.
  const seenFixes = new Set()
  const quickWins = recommendations
    .filter((recommendation) => (recommendation.effort_hours || 99) <= 2)
    .filter((recommendation) => {
      if (seenFixes.has(recommendation.fix)) return false
      seenFixes.add(recommendation.fix)
      return true
    })
    .slice(0, 5)
    .map((recommendation) => ({
      title: issueTitle(recommendation),
      action: recommendation.fix,
      effort_hours: recommendation.effort_hours,
    }))

  const host = signals?.crawl?.finalUrl || meta.url || 'the website'
  const fails = checks.filter((check) => check.status === 'fail').length
  const warns = checks.filter((check) => check.status === 'warn').length

  const executive_summary = [
    `${host} scores ${overall}/100 in this AI-assisted assessment, with ${fails} failed and ${warns} warning checks across technical, on-page, content, Core Web Vitals and schema signals.`,
    recommendations[0]
      ? `The highest-leverage fix: ${recommendations[0].fix}`
      : 'No blocking issues were detected in the collected signals.',
    'This report was produced from the deterministic AI fixture (AI_USE_MOCKS); scores are derived from the crawled signals above, not from Claude.',
  ]
    .join(' ')
    .replace(/\s+/g, ' ')
    .slice(0, 600)

  return {
    audit_version: 'v1.0',
    overall_score: overall,
    score_breakdown: scoreBreakdown,
    critical_issues: critical,
    important_issues: important,
    quick_wins: quickWins,
    recommendations:
      recommendations.length > 0
        ? recommendations
        : [
            {
              priority: 'LOW',
              category: 'Technical',
              finding: 'No blocking issues were detected in the collected signals.',
              fix: 'Keep monitoring with scheduled monthly audits.',
              estimated_impact: 'Low',
              effort: 'Hours',
              effort_hours: 1,
              falsifiability_check: 'The next scheduled audit should keep every check in pass state.',
            },
          ],
    executive_summary,
    _meta: {
      source: 'mock',
      generator: 'deterministic-signal-fixture',
      note: 'Generated by src/mocks/ai.mock.js — not an Anthropic API response.',
      generatedAt: new Date().toISOString(),
    },
  }
}

export default { buildMockAnalysis }
