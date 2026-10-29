import { afterEach, describe, expect, it, vi } from 'vitest'
import { downloadFilenameFor, reportKeyFor, reportStorage } from '@/report/storage'
import { resetEnvCache } from '@/lib/env'

const ORIGINAL = {
  REPORT_STORAGE: process.env.REPORT_STORAGE,
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
}

afterEach(() => {
  vi.unstubAllGlobals()
  for (const [key, value] of Object.entries(ORIGINAL)) {
    if (value === undefined) delete process.env[key]
    else process.env[key] = value
  }
  resetEnvCache()
})

describe('report storage keys', () => {
  it('produces deterministic, path-safe keys', () => {
    const key = reportKeyFor('client/../../etc', 'audit id 1')
    expect(key).toBe('clients/clientetc/auditid1.pdf')
    expect(key).not.toContain('..')
  })

  it('derives a readable, filesystem-safe download filename', () => {
    const name = downloadFilenameFor(
      'https://www.example.com/page',
      'cmvt4x9770001tx7s3autdcen',
      new Date('2026-10-29T00:00:00Z'),
    )
    expect(name).toBe('edgelink-seo-audit-example.com-2026-10-29-utdcen.pdf')
  })

  it('rejects traversal keys in the local adapter', () => {
    process.env.REPORT_STORAGE = 'local'
    resetEnvCache()
    expect(() => reportStorage().absolutePath('../secret.pdf')).toThrow(/Unsafe/)
  })
})

describe('supabase report storage', () => {
  it('uploads to the configured bucket with server-side credentials', async () => {
    process.env.REPORT_STORAGE = 'supabase'
    process.env.SUPABASE_URL = 'https://demo.supabase.co'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-test-key'
    resetEnvCache()

    const calls: Array<{ url: string; init?: RequestInit }> = []
    vi.stubGlobal('fetch', async (url: string, init?: RequestInit) => {
      calls.push({ url, init })
      return new Response('{}', { status: 200 })
    })

    const storage = reportStorage()
    expect(storage.kind).toBe('supabase')
    expect(storage.absolutePath('clients/a/b.pdf')).toBeNull()

    await storage.put('clients/a/b.pdf', Buffer.from('%PDF-1.4 test'))
    const first = calls[0]
    expect(first).toBeDefined()
    expect(first!.url).toBe('https://demo.supabase.co/storage/v1/object/reports/clients/a/b.pdf')
    expect(first!.init?.method).toBe('POST')
    expect(new Headers(first!.init?.headers).get('authorization')).toBe('Bearer service-role-test-key')
  })

  it('fails loudly when Supabase credentials are missing', () => {
    process.env.REPORT_STORAGE = 'supabase'
    delete process.env.SUPABASE_URL
    delete process.env.SUPABASE_SERVICE_ROLE_KEY
    resetEnvCache()
    expect(() => reportStorage()).toThrow(/SUPABASE_URL/)
  })
})
