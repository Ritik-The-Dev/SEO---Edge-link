import { describe, expect, it } from 'vitest'
import { makeCrawl } from './fixtures'

describe('extractPageSignals', () => {
  const crawl = makeCrawl()

  it('extracts metadata and heading structure', () => {
    expect(crawl.title).toBe('Dental Clinic in Pune — Northstar Dental')
    expect(crawl.titleLength).toBeGreaterThan(30)
    expect(crawl.metaDescription).toContain('Northstar Dental')
    expect(crawl.canonical).toBe('https://example-dental-clinic.com/')
    expect(crawl.robotsMeta).toBe('index,follow')
    expect(crawl.lang).toBe('en')
    expect(crawl.viewport).toContain('width=device-width')
    expect(crawl.headings.h1Count).toBe(1)
    expect(crawl.headings.h1[0]).toBe('Dental clinic in Pune')
    expect(crawl.headings.h2Count).toBe(2)
  })

  it('counts only real anchors and separates internal from external', () => {
    expect(crawl.links.internal).toBe(3)
    expect(crawl.links.external).toBe(2)
    expect(crawl.links.nofollow).toBe(1)
  })

  it('tracks images missing alt text', () => {
    expect(crawl.images.total).toBe(2)
    expect(crawl.images.missingAlt).toBe(1)
    expect(crawl.images.missingAltSamples[0]).toContain('team.jpg')
  })

  it('parses JSON-LD types and Open Graph tags', () => {
    expect(crawl.structuredData.blocks).toBe(1)
    expect(crawl.structuredData.types).toContain('Dentist')
    expect(crawl.openGraph['og:title']).toBe('Northstar Dental — Pune')
  })

  it('ignores script and style text in the word count', () => {
    expect(crawl.wordCount).toBeGreaterThan(200)
  })

  it('never echoes raw HTML into extracted text fields', () => {
    const malicious = makeCrawl(
      '<html lang="en"><head><title>&lt;script&gt;alert(1)&lt;/script&gt;</title></head><body><h1>Hi</h1></body></html>',
    )
    expect(malicious.title).toBe('<script>alert(1)</script>')
    // The value is plain text from Cheerio; it is escaped by React/the PDF template,
    // never injected as markup.
    expect(malicious.notes.join(' ')).not.toContain('<script>')
  })
})
