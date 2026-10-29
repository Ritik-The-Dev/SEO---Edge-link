import type { AiAnalysis } from '@/server/ai/schema'
import type { AuditSignals } from '@/types/audit'

export interface ReportData {
  auditId: string
  generatedAt: Date
  completedAt: Date | null
  createdAt: Date
  aiSource: 'CLAUDE' | 'MOCK' | null
  aiModel: string | null
  analysis: AiAnalysis
  signals: AuditSignals
  website: { url: string; label: string | null; businessType: string; city: string; state: string }
  client: { name: string; company: string | null }
}

const escapeHtml = (value: unknown): string =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

const fmtDate = (date: Date) =>
  new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(date)

const fmtDateTime = (date: Date) =>
  new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
    timeZoneName: 'short',
  }).format(date)

function scoreRing(score: number): string {
  const radius = 64
  const circumference = 2 * Math.PI * radius
  const dash = (Math.max(0, Math.min(100, score)) / 100) * circumference
  return `<svg width="168" height="168" viewBox="0 0 168 168" role="img" aria-label="Overall score ${score} out of 100">
    <circle cx="84" cy="84" r="${radius}" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="8" />
    <circle cx="84" cy="84" r="${radius}" fill="none" stroke="#2FD8A8" stroke-width="8" stroke-linecap="round"
      stroke-dasharray="${dash.toFixed(1)} ${circumference.toFixed(1)}" transform="rotate(-90 84 84)" />
  </svg>`
}

function bar(label: string, value: number): string {
  return `<div class="bar-row">
    <span class="bar-label">${escapeHtml(label)}</span>
    <span class="bar-track"><span class="bar-fill" style="width:${Math.max(2, Math.min(100, value))}%"></span></span>
    <span class="bar-value">${value}</span>
  </div>`
}

function priorityClass(priority: string): string {
  return priority.toLowerCase() === 'critical' ? 'p-critical' : priority.toLowerCase() === 'high' ? 'p-high' : priority.toLowerCase() === 'medium' ? 'p-medium' : 'p-low'
}

export function buildReportHtml(data: ReportData): string {
  const { analysis, signals, website, client } = data
  const host = (() => {
    try {
      return new URL(website.url).hostname.replace(/^www\./, '')
    } catch {
      return website.url
    }
  })()
  const checks = signals.checks
  const counts = {
    pass: checks.filter((c) => c.status === 'pass').length,
    warn: checks.filter((c) => c.status === 'warn').length,
    fail: checks.filter((c) => c.status === 'fail').length,
    info: checks.filter((c) => c.status === 'info').length,
  }
  const aiLabel = data.aiSource === 'CLAUDE' ? `Claude (${data.aiModel ?? 'model'})` : 'Deterministic AI fixture (mock)'
  const mockDisclosure = data.signals.meta.useMocks

  const recommendationCards = analysis.recommendations
    .map(
      (rec, index) => `<article class="rec">
        <header>
          <span class="rec-index">${String(index + 1).padStart(2, '0')}</span>
          <span class="chip ${priorityClass(rec.priority)}">${escapeHtml(rec.priority)}</span>
          <span class="chip">${escapeHtml(rec.category)}</span>
          <span class="chip">Impact: ${escapeHtml(rec.estimated_impact)}</span>
          <span class="chip">Effort: ${escapeHtml(rec.effort)}${rec.effort_hours ? ` · ${rec.effort_hours}h` : ''}</span>
        </header>
        <div class="rec-body">
          <p><span class="label">Finding</span>${escapeHtml(rec.finding)}</p>
          <p><span class="label">Fix</span>${escapeHtml(rec.fix)}</p>
          <p class="verify"><span class="label">How we know it worked</span>${escapeHtml(rec.falsifiability_check)}</p>
        </div>
      </article>`,
    )
    .join('')

  const issueList = (items: typeof analysis.critical_issues, kind: string) =>
    items.length
      ? `<ul class="issues">${items
          .map((issue) => `<li><strong>${escapeHtml(issue.title)}</strong><span>${escapeHtml(issue.detail)}</span></li>`)
          .join('')}</ul>`
      : `<p class="empty">No ${kind} issues were identified from the collected signals.</p>`

  const queryRows = signals.gsc.queries
    .map(
      (row) => `<tr>
        <td>${escapeHtml(row.query)}</td>
        <td class="num">${row.clicks}</td>
        <td class="num">${row.impressions}</td>
        <td class="num">${(row.ctr * 100).toFixed(1)}%</td>
        <td class="num">${row.position.toFixed(1)}</td>
      </tr>`,
    )
    .join('')

  const serpRows = signals.dataForSeo.results
    .map(
      (row) => `<tr${row.isClient ? ' class="client-row"' : ''}>
        <td>${escapeHtml(row.domain)}${row.isClient ? ' <span class="tag">client</span>' : ''}</td>
        <td class="num">${row.position}</td>
        <td class="num">${row.absolutePosition}</td>
      </tr>`,
    )
    .join('')

  const failedChecks = checks.filter((check) => check.status === 'fail' || check.status === 'warn').slice(0, 12)

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>EdgeLink SEO audit — ${escapeHtml(host)}</title>
<style>
  @page { size: A4; margin: 0; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body {
    font-family: "Helvetica Neue", Arial, sans-serif;
    color: #12181a;
    background: #f7f4ee;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
    font-size: 10.5pt;
    line-height: 1.55;
  }
  .serif { font-family: Georgia, "Times New Roman", serif; }
  .mono { font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace; }
  .cover {
    height: 297mm; width: 210mm; background: #06110e; color: #f2efe6;
    padding: 22mm 20mm; position: relative; overflow: hidden;
    display: flex; flex-direction: column; justify-content: space-between;
    page-break-after: always;
  }
  .cover .grid {
    position: absolute; inset: 0;
    background-image:
      linear-gradient(rgba(47,216,168,0.06) 1px, transparent 1px),
      linear-gradient(90deg, rgba(47,216,168,0.06) 1px, transparent 1px);
    background-size: 18mm 18mm;
  }
  .cover .orbit {
    position: absolute; right: -42mm; top: 52mm; width: 210mm; height: 210mm;
    border: 1px solid rgba(47,216,168,0.22); border-radius: 50%;
  }
  .cover .orbit.two { right: -18mm; top: 76mm; width: 160mm; height: 160mm; border-color: rgba(242,239,230,0.10); }
  .cover .orbit.three { right: 8mm; top: 100mm; width: 108mm; height: 108mm; border-color: rgba(47,216,168,0.14); }
  .brandline { display: flex; justify-content: space-between; align-items: baseline; position: relative; z-index: 2; }
  .wordmark { font-size: 11pt; letter-spacing: 0.26em; font-weight: 700; }
  .wordmark span { color: #2fd8a8; }
  .kicker { font-size: 7.5pt; letter-spacing: 0.22em; color: #9fb2a9; text-transform: uppercase; }
  .cover-main { position: relative; z-index: 2; margin-top: 34mm; }
  .cover h1 { font-size: 32pt; line-height: 1.06; margin: 0 0 6mm; font-weight: 400; letter-spacing: -0.01em; }
  .cover h1 em { color: #2fd8a8; font-style: italic; }
  .cover .sub { font-size: 10pt; color: #c9d4cd; max-width: 118mm; }
  .score-block { display: flex; align-items: center; gap: 8mm; margin-top: 14mm; position: relative; z-index: 2; }
  .score-number { font-size: 40pt; line-height: 1; color: #f2efe6; }
  .score-number small { font-size: 12pt; color: #9fb2a9; }
  .score-caption { font-size: 8pt; letter-spacing: 0.16em; text-transform: uppercase; color: #9fb2a9; }
  .score-ring { position: relative; width: 42mm; }
  .score-ring .val { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-size: 22pt; }
  .cover-meta { position: relative; z-index: 2; display: grid; grid-template-columns: repeat(3, 1fr); gap: 6mm; border-top: 1px solid rgba(242,239,230,0.16); padding-top: 7mm; }
  .cover-meta dt { font-size: 6.8pt; letter-spacing: 0.16em; text-transform: uppercase; color: #8ea198; margin-bottom: 1.5mm; }
  .cover-meta dd { margin: 0; font-size: 9pt; color: #eceae2; word-break: break-word; }
  .page { padding: 18mm 18mm 20mm; page-break-after: always; }
  .page:last-child { page-break-after: auto; }
  .page-head { display: flex; justify-content: space-between; align-items: baseline; border-bottom: 1px solid #d8d2c4; padding-bottom: 3mm; margin-bottom: 7mm; }
  .page-head .sec { font-size: 7.5pt; letter-spacing: 0.2em; text-transform: uppercase; color: #6f7a72; }
  .page-head .brand { font-size: 7.5pt; letter-spacing: 0.22em; font-weight: 700; color: #12181a; }
  h2 { font-family: Georgia, serif; font-weight: 400; font-size: 19pt; margin: 0 0 4mm; letter-spacing: -0.01em; }
  h3 { font-size: 9pt; letter-spacing: 0.16em; text-transform: uppercase; color: #4c5a52; margin: 8mm 0 3mm; }
  p { margin: 0 0 3mm; }
  .lede { font-size: 11.5pt; line-height: 1.6; color: #1b2422; }
  .summary-box { background: #efebe0; border-left: 3px solid #0f7a5f; padding: 6mm; margin: 6mm 0; }
  .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 8mm; }
  .bar-row { display: grid; grid-template-columns: 34mm 1fr 10mm; align-items: center; gap: 3mm; margin-bottom: 3mm; }
  .bar-label { font-size: 9pt; color: #3d4a44; }
  .bar-track { height: 2.2mm; background: #ddd7c9; border-radius: 2mm; overflow: hidden; }
  .bar-fill { display: block; height: 100%; background: #0f7a5f; }
  .bar-value { font-size: 9pt; text-align: right; font-variant-numeric: tabular-nums; }
  .stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 4mm; margin: 6mm 0; }
  .stat { border: 1px solid #d8d2c4; padding: 4mm; background: #fbf9f4; }
  .stat .n { font-size: 18pt; font-family: Georgia, serif; display: block; line-height: 1; margin-bottom: 1.5mm; }
  .stat .l { font-size: 7pt; letter-spacing: 0.14em; text-transform: uppercase; color: #6f7a72; }
  .issues { list-style: none; padding: 0; margin: 0; }
  .issues li { border-top: 1px solid #ddd7c9; padding: 3.5mm 0; break-inside: avoid; }
  .issues li strong { display: block; font-size: 10pt; margin-bottom: 1mm; }
  .issues li span { color: #46524c; font-size: 9.5pt; }
  .empty { color: #6f7a72; font-style: italic; }
  .rec { border: 1px solid #d8d2c4; background: #fbf9f4; padding: 5mm; margin-bottom: 4mm; break-inside: avoid; }
  .rec header { display: flex; flex-wrap: wrap; gap: 2mm; align-items: center; margin-bottom: 3mm; }
  .rec-index { font-family: Georgia, serif; font-size: 13pt; color: #0f7a5f; margin-right: 2mm; }
  .chip { font-size: 6.8pt; letter-spacing: 0.1em; text-transform: uppercase; border: 1px solid #cfc8b8; padding: 1mm 2mm; color: #3d4a44; }
  .p-critical { background: #7a2a1c; border-color: #7a2a1c; color: #fff; }
  .p-high { background: #a04a22; border-color: #a04a22; color: #fff; }
  .p-medium { background: #8a6a1f; border-color: #8a6a1f; color: #fff; }
  .p-low { background: #3d4a44; border-color: #3d4a44; color: #fff; }
  .label { display: block; font-size: 6.8pt; letter-spacing: 0.16em; text-transform: uppercase; color: #6f7a72; margin-bottom: 0.8mm; }
  .verify { border-top: 1px dashed #d8d2c4; padding-top: 2.5mm; margin-top: 2.5mm; color: #0f5c49; }
  table { width: 100%; border-collapse: collapse; font-size: 9pt; margin: 3mm 0 6mm; }
  th { text-align: left; font-size: 6.8pt; letter-spacing: 0.14em; text-transform: uppercase; color: #6f7a72; border-bottom: 1px solid #c9c2b2; padding: 2mm 2mm; }
  td { border-bottom: 1px solid #e2dccd; padding: 2mm; vertical-align: top; }
  td.num { text-align: right; font-variant-numeric: tabular-nums; }
  .client-row td { background: #e8f2ec; font-weight: 600; }
  .tag { font-size: 6pt; letter-spacing: 0.1em; text-transform: uppercase; background: #0f7a5f; color: #fff; padding: 0.3mm 1.2mm; }
  .url { word-break: break-all; }
  .note { font-size: 8.5pt; color: #5a675f; }
  .callout { border: 1px solid #d8c9a8; background: #f6efdd; padding: 5mm; margin: 5mm 0; break-inside: avoid; }
  .callout strong { display: block; font-size: 8pt; letter-spacing: 0.14em; text-transform: uppercase; margin-bottom: 2mm; color: #7a5b16; }
  .check-table td:first-child { width: 46mm; font-weight: 600; }
  .status { font-size: 7pt; letter-spacing: 0.1em; text-transform: uppercase; padding: 0.6mm 1.6mm; color: #fff; }
  .s-pass { background: #0f7a5f; } .s-warn { background: #8a6a1f; } .s-fail { background: #7a2a1c; } .s-info { background: #4c5a52; }
  .footer-note { border-top: 1px solid #d8d2c4; margin-top: 10mm; padding-top: 4mm; font-size: 7.5pt; color: #6f7a72; }
</style>
</head>
<body>
  <section class="cover">
    <div class="grid"></div>
    <div class="orbit"></div><div class="orbit two"></div><div class="orbit three"></div>

    <div class="brandline">
      <div class="wordmark">EDGE<span>LINK</span></div>
      <div class="kicker">SEO Intelligence · Technical audit</div>
    </div>

    <div class="cover-main">
      <div class="kicker">Website health report</div>
      <h1 class="serif">${escapeHtml(host)}<br /><em>technical SEO audit</em></h1>
      <p class="sub">A signal-by-signal assessment of crawlability, on-page structure, Core Web Vitals, structured data and search visibility, with prioritised fixes and stated verification steps.</p>
      <div class="score-block">
        <div class="score-ring">
          ${scoreRing(analysis.overall_score)}
          <div class="val serif">${analysis.overall_score}</div>
        </div>
        <div>
          <div class="score-number serif">${analysis.overall_score}<small> / 100</small></div>
          <div class="score-caption">AI-assisted audit score</div>
        </div>
      </div>
    </div>

    <dl class="cover-meta">
      <div><dt>Prepared for</dt><dd>${escapeHtml(client.company || client.name)}</dd></div>
      <div><dt>Business</dt><dd>${escapeHtml(website.businessType)} · ${escapeHtml(website.city)}, ${escapeHtml(website.state)}</dd></div>
      <div><dt>Audit date</dt><dd>${escapeHtml(fmtDate(data.completedAt ?? data.createdAt))}</dd></div>
      <div><dt>Audit identifier</dt><dd class="mono">${escapeHtml(data.auditId)}</dd></div>
      <div><dt>Analysis</dt><dd>${escapeHtml(aiLabel)}</dd></div>
      <div><dt>Signals</dt><dd>${mockDisclosure ? 'Mocked integrations (labelled)' : 'Live integrations'}</dd></div>
    </dl>
  </section>

  <section class="page">
    <div class="page-head"><span class="brand">EDGE<span style="color:#0f7a5f">LINK</span></span><span class="sec">01 · Executive summary</span></div>
    <h2 class="serif">What the audit found</h2>
    <div class="summary-box"><p class="lede">${escapeHtml(analysis.executive_summary)}</p></div>
    <div class="stat-grid">
      <div class="stat"><span class="n">${analysis.overall_score}</span><span class="l">Overall score</span></div>
      <div class="stat"><span class="n">${counts.fail}</span><span class="l">Failed checks</span></div>
      <div class="stat"><span class="n">${counts.warn}</span><span class="l">Warnings</span></div>
      <div class="stat"><span class="n">${counts.pass}</span><span class="l">Passed checks</span></div>
    </div>
    <h3>Score breakdown</h3>
    ${bar('Technical', analysis.score_breakdown.technical)}
    ${bar('On-page', analysis.score_breakdown.on_page)}
    ${bar('Content', analysis.score_breakdown.content)}
    ${bar('Core Web Vitals', analysis.score_breakdown.core_web_vitals)}
    ${bar('Schema', analysis.score_breakdown.schema)}
    <p class="note" style="margin-top:4mm">The overall score is an AI-assisted technical assessment weighted across the five categories (technical 30%, on-page 25%, Core Web Vitals 20%, content 15%, schema 10%). It is not a Google ranking metric or a traffic forecast.</p>
    <div class="callout">
      <strong>How to read this report</strong>
      Observed findings come from a live single-page crawl of the supplied URL plus the integration data listed in §06. Recommendations are prioritised by impact and effort, and each carries a verification step so the fix can be judged on evidence rather than opinion.
    </div>
    <div class="footer-note">EdgeLink — SEO Intelligence · ${escapeHtml(host)} · Report ${escapeHtml(data.auditId)}</div>
  </section>

  <section class="page">
    <div class="page-head"><span class="brand">EDGE<span style="color:#0f7a5f">LINK</span></span><span class="sec">02 · Critical &amp; important issues</span></div>
    <h2 class="serif">Critical issues</h2>
    ${issueList(analysis.critical_issues, 'critical')}
    <h3 style="margin-top:10mm">Important issues</h3>
    ${issueList(analysis.important_issues, 'important')}
    <h3>Quick wins (≤ 2 hours each)</h3>
    ${
      analysis.quick_wins.length
        ? `<ul class="issues">${analysis.quick_wins
            .map((win) => `<li><strong>${escapeHtml(win.title)} · ${win.effort_hours}h</strong><span>${escapeHtml(win.action)}</span></li>`)
            .join('')}</ul>`
        : '<p class="empty">No two-hour fixes were identified.</p>'
    }
  </section>

  <section class="page">
    <div class="page-head"><span class="brand">EDGE<span style="color:#0f7a5f">LINK</span></span><span class="sec">03 · Prioritised recommendations</span></div>
    <h2 class="serif">What to fix, in order</h2>
    ${recommendationCards}
  </section>

  <section class="page">
    <div class="page-head"><span class="brand">EDGE<span style="color:#0f7a5f">LINK</span></span><span class="sec">04 · Measured signals</span></div>
    <h2 class="serif">Performance &amp; indexability</h2>
    <table>
      <thead><tr><th>Core Web Vitals (mobile)</th><th>Value</th><th>Good threshold</th></tr></thead>
      <tbody>
        <tr><td>Largest Contentful Paint</td><td class="num">${escapeHtml(signals.pageSpeed.metrics.largestContentfulPaint)}</td><td class="num">≤ 2.5 s</td></tr>
        <tr><td>Cumulative Layout Shift</td><td class="num">${signals.pageSpeed.metrics.cumulativeLayoutShift}</td><td class="num">≤ 0.1</td></tr>
        <tr><td>Interaction to Next Paint</td><td class="num">${escapeHtml(signals.pageSpeed.metrics.interactionToNextPaint)}</td><td class="num">≤ 200 ms</td></tr>
        <tr><td>Performance score</td><td class="num">${Math.round(signals.pageSpeed.scores.performance * 100)}</td><td class="num">90+</td></tr>
        <tr><td>Accessibility score</td><td class="num">${Math.round(signals.pageSpeed.scores.accessibility * 100)}</td><td class="num">90+</td></tr>
        <tr><td>Render-blocking resources</td><td class="num">${signals.pageSpeed.diagnostics.renderBlockingResources}</td><td class="num">0</td></tr>
        <tr><td>Unused JavaScript</td><td class="num">${escapeHtml(signals.pageSpeed.diagnostics.unusedJavascript)}</td><td class="num">&lt; 100 KiB</td></tr>
      </tbody>
    </table>
    <h3>Search Console — top queries</h3>
    <table>
      <thead><tr><th>Query</th><th>Clicks</th><th>Impressions</th><th>CTR</th><th>Position</th></tr></thead>
      <tbody>${queryRows}</tbody>
    </table>
    <p class="note">Totals: ${signals.gsc.totals.clicks} clicks from ${signals.gsc.totals.impressions} impressions · ${signals.gsc.indexCoverageErrors} index-coverage errors.</p>
    <h3>Rank snapshot — ${escapeHtml(signals.dataForSeo.keyword)} (${signals.dataForSeo.searchVolume}/mo)</h3>
    <table>
      <thead><tr><th>Domain</th><th>Organic position</th><th>Absolute position</th></tr></thead>
      <tbody>${serpRows}</tbody>
    </table>
    <p class="note">Rank group: ${escapeHtml(signals.dataForSeo.rankGroup)} · Client position ${signals.dataForSeo.clientRankPosition}.</p>
  </section>

  <section class="page">
    <div class="page-head"><span class="brand">EDGE<span style="color:#0f7a5f">LINK</span></span><span class="sec">05 · Check register</span></div>
    <h2 class="serif">Every signal we tested</h2>
    <table class="check-table">
      <thead><tr><th>Check</th><th>Status</th><th>Observation</th></tr></thead>
      <tbody>
        ${checks
          .map(
            (check) => `<tr>
              <td>${escapeHtml(check.label)}</td>
              <td><span class="status s-${check.status}">${check.status}</span></td>
              <td>${escapeHtml(check.detail)}</td>
            </tr>`,
          )
          .join('')}
      </tbody>
    </table>
  </section>

  <section class="page">
    <div class="page-head"><span class="brand">EDGE<span style="color:#0f7a5f">LINK</span></span><span class="sec">06 · Method &amp; disclosures</span></div>
    <h2 class="serif">How this audit was produced</h2>
    <p><strong>Crawl.</strong> One page was fetched from <span class="url">${escapeHtml(signals.crawl.finalUrl)}</span> at audit time (HTTP ${signals.crawl.status}, ${signals.crawl.durationMs} ms, ${signals.crawl.wordCount} words of body copy). Redirects are followed and validated, HTML is parsed with Cheerio, and crawled markup is never rendered as HTML.</p>
    <p><strong>Checks.</strong> ${checks.length} deterministic checks cover technical, on-page, content, schema and Core Web Vitals signals. ${counts.pass} passed, ${counts.warn} warned, ${counts.fail} failed, ${counts.info} were informational.</p>
    <p><strong>Analysis.</strong> ${escapeHtml(aiLabel)} produced the scores, issue lists and recommendations. Every recommendation is validated against a versioned schema before being stored; invalid output fails the audit rather than being published.</p>
    ${mockDisclosure ? `<div class="callout"><strong>Mock data disclosure</strong>PageSpeed Insights, Search Console, DataForSEO and WhatsApp results in this report are deterministic assessment fixtures supplied with the brief, not live measurements. They are identified in the dashboard and in the audit record.</div>` : ''}
    ${
      data.aiSource === 'MOCK'
        ? `<div class="callout"><strong>AI disclosure</strong>This report's analysis came from the deterministic AI fixture (AI_USE_MOCKS). It is not an Anthropic Claude response. Set AI_USE_MOCKS=false with a valid ANTHROPIC_API_KEY to generate Claude-authored analysis.</div>`
        : ''
    }
    <p><strong>Limits.</strong> This is a single-page technical audit, not a full-site search-engine crawl. It does not measure backlinks, competitor traffic or revenue, and it does not guarantee rankings. Core Web Vitals values are lab data for mobile.</p>
    <h3>Failed and warning checks in this audit</h3>
    <table class="check-table">
      <thead><tr><th>Check</th><th>Status</th><th>Observation</th></tr></thead>
      <tbody>
        ${failedChecks
          .map(
            (check) => `<tr>
              <td>${escapeHtml(check.label)}</td>
              <td><span class="status s-${check.status}">${check.status}</span></td>
              <td>${escapeHtml(check.detail)}</td>
            </tr>`,
          )
          .join('')}
      </tbody>
    </table>
    <div class="footer-note">
      Generated ${escapeHtml(fmtDateTime(data.generatedAt))} · EdgeLink — SEO Intelligence.<br />
      Confidential: prepared for ${escapeHtml(client.company || client.name)}. Scores are an AI-assisted technical assessment, not a guarantee of search performance.
    </div>
  </section>
</body>
</html>`
}
