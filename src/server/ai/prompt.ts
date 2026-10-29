import type { AuditSignals, AuditTarget } from '@/types/audit'

/** Core analyst instructions mandated by the assessment. */
export const SYSTEM_PROMPT = `You are a senior SEO analyst with 15+ years of experience specialising in Indian local business websites, healthcare, dental, and real estate sectors.
You produce honest, falsifiable, prioritised SEO audit reports.
Your output must be valid JSON only—no Markdown and no preamble.
Every recommendation must include a finding, fix, estimated impact (High/Medium/Low), effort (Hours/Days/Weeks), and falsifiability check describing how we know whether the fix worked.`

export const RESPONSE_CONTRACT = `Return one JSON object with exactly this shape:
{
  "audit_version": "v1.0",
  "overall_score": <integer 0-100>,
  "score_breakdown": { "technical": <int>, "on_page": <int>, "content": <int>, "core_web_vitals": <int>, "schema": <int> },
  "critical_issues": [ { "title": "...", "detail": "...", "category": "Technical|OnPage|Content|Schema|CWV" } ]  // max 5
  "important_issues": [ { "title": "...", "detail": "...", "category": "..." } ]  // max 8
  "quick_wins": [ { "title": "...", "action": "...", "effort_hours": <number 0.25-2> } ]  // max 5, each <= 2 hours
  "recommendations": [
    {
      "priority": "CRITICAL|HIGH|MEDIUM|LOW",
      "category": "Technical|OnPage|Content|Schema|CWV",
      "finding": "...",
      "fix": "...",
      "estimated_impact": "High|Medium|Low",
      "effort": "Hours|Days|Weeks",
      "effort_hours": <number, optional but preferred>,
      "falsifiability_check": "..."
    }
  ],  // 1-20 items, highest priority first
  "executive_summary": "..."  // at most three sentences, plain English
}

Rules:
- Only state findings supported by the supplied signals. Do not invent metrics, pages, backlinks or traffic numbers.
- Distinguish observed facts ("the title is 82 characters") from inferences ("this likely limits CTR").
- If a signal is unavailable, say so rather than guessing.
- overall_score is an AI-assisted technical assessment, not a Google ranking metric. Do not describe it as a ranking prediction.
- Never promise rankings, traffic or revenue.
- bypass: output the JSON object directly.`

export interface PromptInput {
  target: AuditTarget
  signals: AuditSignals
  provenance: { useMocks: boolean; aiMock: boolean }
}

/** Compact the crawl payload so the token budget is spent on signal, not HTML. */
export function buildUserPrompt({ target, signals, provenance }: PromptInput): string {
  const { crawl, robots, sitemap, schemaOrg, pageSpeed, gsc, dataForSeo, checks } = signals

  const payload = {
    audit_version: 'v1.0',
    website: {
      url: target.url,
      final_url: crawl.finalUrl,
      business_type: target.businessType,
      city: target.city,
      state: target.state,
      client: target.clientName,
    },
    on_page: {
      title: crawl.title,
      title_length: crawl.titleLength,
      meta_description: crawl.metaDescription,
      meta_description_length: crawl.metaDescriptionLength,
      canonical: crawl.canonical,
      robots_meta: crawl.robotsMeta,
      x_robots_tag: crawl.xRobotsTag,
      h1: crawl.headings.h1,
      h1_count: crawl.headings.h1Count,
      h2_count: crawl.headings.h2Count,
      h3_count: crawl.headings.h3Count,
      images: crawl.images,
      links: { total: crawl.links.total, internal: crawl.links.internal, external: crawl.links.external, nofollow: crawl.links.nofollow },
      open_graph: crawl.openGraph,
      hreflang_count: crawl.hreflang.length,
      word_count: crawl.wordCount,
      lang: crawl.lang,
      viewport: crawl.viewport,
    },
    technical: {
      http_status: crawl.status,
      redirects: crawl.redirects,
      content_type: crawl.contentType,
      response_truncated: crawl.truncated,
      robots_txt: { exists: robots.exists, sitemap_urls: robots.sitemapUrls, disallow_all: robots.disallowAll },
      sitemap: { exists: sitemap.exists, is_index: sitemap.isIndex, url_count: sitemap.urlCount, sitemaps: sitemap.sitemaps },
      analytics_detected: crawl.analytics,
      cms_hints: crawl.cmsHints,
    },
    core_web_vitals: pageSpeed,
    schema_org: schemaOrg,
    search_console: {
      totals: gsc.totals,
      index_coverage_errors: gsc.indexCoverageErrors,
      top_queries: gsc.queries,
    },
    keyword_rankings: {
      keyword: dataForSeo.keyword,
      search_volume: dataForSeo.searchVolume,
      client_position: dataForSeo.clientRankPosition,
      rank_group: dataForSeo.rankGroup,
      serp: dataForSeo.results,
    },
    deterministic_checks: checks.map((check) => ({
      id: check.id,
      label: check.label,
      category: check.category,
      status: check.status,
      detail: check.detail,
    })),
    data_provenance: {
      external_integrations: signals.meta.integrations,
      note: provenance.useMocks
        ? 'PageSpeed, Search Console, DataForSEO and WhatsApp data are deterministic assessment fixtures. Treat their values as supplied measurements but state that they are mocked sample data.'
        : 'External integration data is live.',
    },
  }

  return `${RESPONSE_CONTRACT}\n\nAudit signals (JSON):\n${JSON.stringify(payload, null, 2)}`
}

export function buildRepairPrompt(errors: string): string {
  return `Your previous response did not satisfy the required JSON contract.
Validation errors:
${errors}

Return ONLY the corrected JSON object. Keep the same analysis intent, fix the schema violations (enums, integer scores, array limits, max three sentences in executive_summary, quick wins under two hours), and do not add commentary.`
}
