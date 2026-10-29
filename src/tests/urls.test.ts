import { describe, expect, it } from 'vitest'
import {
  assertPublicDestination,
  isPrivateAddress,
  normalizeHttpUrl,
  safeFetch,
  UrlValidationError,
} from '@/lib/urls'

describe('normalizeHttpUrl', () => {
  it('accepts bare hostnames and upgrades them to https', () => {
    expect(normalizeHttpUrl('example.com').toString()).toBe('https://example.com/')
    expect(normalizeHttpUrl('  https://example.com/path#frag ').toString()).toBe('https://example.com/path')
  })

  it.each([
    'ftp://example.com/file',
    'javascript:alert(1)',
    'data:text/html,<h1>x</h1>',
    'file:///etc/passwd',
    'http://user:secret@example.com/',
    'http://localhost/',
    'http://127.0.0.1:8080/',
    'http://169.254.169.254/latest/meta-data/',
    'http://[::1]/',
    'http://10.1.2.3/',
    'http://192.168.0.10/',
    'http://172.20.0.1/',
    'http://printer.local/',
    'http://metadata.google.internal/',
  ])('rejects %s', (input) => {
    expect(() => normalizeHttpUrl(input)).toThrow(UrlValidationError)
  })

  it('rejects oversized URLs', () => {
    expect(() => normalizeHttpUrl(`https://example.com/${'a'.repeat(2100)}`)).toThrow(/too long/)
  })
})

describe('isPrivateAddress', () => {
  it.each([
    ['127.0.0.1', true],
    ['10.0.0.1', true],
    ['172.16.5.4', true],
    ['192.168.1.1', true],
    ['169.254.169.254', true],
    ['100.64.0.1', true],
    ['0.0.0.0', true],
    ['224.0.0.1', true],
    ['::1', true],
    ['fc00::1', true],
    ['fe80::1', true],
    ['::ffff:127.0.0.1', true],
    ['93.184.216.34', false],
    ['2606:2800:220:1:248:1893:25c8:1946', false],
  ])('%s → %s', (address, expected) => {
    expect(isPrivateAddress(address)).toBe(expected)
  })
})

describe('assertPublicDestination', () => {
  it('rejects hostnames that resolve to private addresses', async () => {
    await expect(assertPublicDestination('https://rebind.example.com', async () => ['10.0.0.8'])).rejects.toThrow(
      /private or reserved/i,
    )
  })

  it('accepts hostnames that resolve publicly', async () => {
    const url = await assertPublicDestination('https://example.com', async () => ['93.184.216.34'])
    expect(url.toString()).toBe('https://example.com/')
  })

  it('rejects a hostname when any DNS answer is private', async () => {
    await expect(
      assertPublicDestination('https://mixed.example.com', async () => ['93.184.216.34', '127.0.0.1']),
    ).rejects.toThrow(/private or reserved/i)
  })
})

describe('safeFetch', () => {
  it('re-validates every redirect destination before following it', async () => {
    const fetchImpl = (async () =>
      new Response(null, { status: 302, headers: { location: 'http://localhost:6379/' } })) as typeof fetch

    await expect(
      safeFetch('https://example.com', {
        resolver: async () => ['93.184.216.34'],
        fetchImpl,
      }),
    ).rejects.toThrow(/private|local/i)
  })

  it('follows a public redirect and caps the body size', async () => {
    let calls = 0
    const fetchImpl = (async (input: string | URL | Request) => {
      calls += 1
      const url = String(input)
      if (calls === 1) {
        return new Response(null, { status: 301, headers: { location: 'https://example.com/final' } })
      }
      if (!url.endsWith('/final')) throw new Error(`unexpected url ${url}`)
      return new Response('x'.repeat(5000), {
        status: 200,
        headers: { 'content-type': 'text/html' },
      })
    }) as typeof fetch

    const result = await safeFetch('https://example.com', {
      resolver: async () => ['93.184.216.34'],
      fetchImpl,
      maxBytes: 1000,
    })

    expect(result.status).toBe(200)
    expect(result.finalUrl).toBe('https://example.com/final')
    expect(result.truncated).toBe(true)
    expect(result.body.length).toBeLessThanOrEqual(1000)
    expect(result.redirects).toHaveLength(1)
  })
})
