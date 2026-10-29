import { describe, expect, it } from 'vitest'
import { PDFDocument } from 'pdf-lib'
import { buildReportHtml } from '@/report/template'
import { downloadFilenameFor, reportKeyFor, reportStorage } from '@/report/storage'
import { stampPageNumbers } from '@/report/page-numbers'
import { analysisSchema } from '@/server/ai/schema'
import { FIXTURE_TARGET, makeAnalysis, makeSignals } from './fixtures'

function reportData(overrides: { clientName?: string; useMocks?: boolean } = {}) {
  const signals = makeSignals()
  if (overrides.useMocks === false) signals.meta.useMocks = false
  const payload = makeAnalysis(signals)
  return {
    analysis: analysisSchema.parse(payload),
    signals,
    data: {
      auditId: 'audit_test_123456789',
      generatedAt: new Date('2026-10-29T10:00:00Z'),
      completedAt: new Date('2026-10-29T09:59:00Z'),
      createdAt: new Date('2026-10-29T09:58:00Z'),
      aiSource: 'MOCK' as const,
      aiModel: null,
      website: {
        url: FIXTURE_TARGET.url,
        label: 'Primary clinic site',
        businessType: FIXTURE_TARGET.businessType,
        city: FIXTURE_TARGET.city,
        state: FIXTURE_TARGET.state,
      },
      client: { name: overrides.clientName ?? 'Northstar Dental', company: null },
    },
  }
}

describe('buildReportHtml', () => {
  it('renders the persisted score, findings and check register', () => {
    const { analysis, signals, data } = reportData()
    const html = buildReportHtml({ ...data, analysis, signals })

    expect(html).toContain(`${analysis.overall_score}`)
    expect(html).toContain('Executive summary')
    expect(html).toContain('Check register')
    expect(html).toContain('Prioritised recommendations')
    expect(html).toContain('How we know it worked')
    expect(html).toContain(signals.gsc.queries[0]!.query)
  })

  it('discloses mocked integrations and mock AI provenance', () => {
    const { analysis, signals, data } = reportData()
    const html = buildReportHtml({ ...data, analysis, signals })
    expect(html).toContain('Mock data disclosure')
    expect(html).toContain('Deterministic AI fixture (mock)')
    expect(html).toContain('not live measurements')
    expect(html).toContain("This report's analysis came from the deterministic AI fixture")
  })

  it('omits the mock disclosure when integrations are live', () => {
    const { analysis, signals, data } = reportData({ useMocks: false })
    const html = buildReportHtml({ ...data, analysis, signals })
    expect(html).not.toContain('Mock data disclosure')
  })

  it('escapes client-controlled strings instead of injecting markup', () => {
    const { analysis, signals, data } = reportData({ clientName: '<img src=x onerror=alert(1)>' })
    const html = buildReportHtml({ ...data, analysis, signals })
    expect(html).not.toContain('<img src=x onerror=alert(1)>')
    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;')
  })

  it('declares A4 print styles and page-break protection', () => {
    const { analysis, signals, data } = reportData()
    const html = buildReportHtml({ ...data, analysis, signals })
    expect(html).toContain('@page { size: A4; margin: 0; }')
    expect(html).toContain('break-inside: avoid')
  })
})

describe('report storage metadata', () => {
  it('builds safe keys and filenames from untrusted input', () => {
    const key = reportKeyFor('client/../../evil', 'audit-1')
    expect(key).toBe('clients/clientevil/audit-1.pdf')
    expect(key).not.toContain('..')
    expect(key.startsWith('/')).toBe(false)

    const filename = downloadFilenameFor('https://www.example.com/a?b=1', 'audit_ABC123', new Date('2026-10-29T00:00:00Z'))
    expect(filename).toBe('edgelink-seo-audit-example.com-2026-10-29-ABC123.pdf')
    expect(filename).toMatch(/^[a-zA-Z0-9.\-]+$/)
  })

  it('rejects path traversal in storage keys', async () => {
    await expect(reportStorage().put('../escape.pdf', Buffer.from('x'))).rejects.toThrow(/Unsafe/)
    await expect(reportStorage().get('/etc/passwd')).rejects.toThrow(/Unsafe/)
  })
})

describe('page numbering stamp', () => {
  it('preserves page count and produces a valid PDF', async () => {
    const document = await PDFDocument.create()
    document.addPage()
    document.addPage()
    const stamped = await stampPageNumbers(Buffer.from(await document.save()))
    const loaded = await PDFDocument.load(stamped)
    expect(loaded.getPageCount()).toBe(2)
    expect(stamped.subarray(0, 4).toString()).toBe('%PDF')
  })
})
