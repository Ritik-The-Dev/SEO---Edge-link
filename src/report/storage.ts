import { mkdir, readFile, stat, writeFile, unlink } from 'node:fs/promises'
import path from 'node:path'
import { env } from '@/lib/env'

/**
 * Report storage boundary.
 *
 * The local adapter writes under REPORT_DIR and is the default for development
 * and single-host deployments. It is intentionally small so it can be replaced
 * by S3/R2/Supabase Storage without touching the pipeline: implement the same
 * three methods and swap `reportStorage()`.
 *
 * Note: a Vercel serverless filesystem is neither durable nor shared — see the
 * README deployment section before relying on this adapter in production.
 */
export interface ReportStorage {
  readonly kind: 'local'
  put(key: string, data: Buffer): Promise<{ key: string; size: number }>
  get(key: string): Promise<Buffer>
  exists(key: string): Promise<boolean>
  remove(key: string): Promise<void>
  absolutePath(key: string): string | null
}

const SAFE_KEY = /^[a-zA-Z0-9/_.-]+$/

function assertSafeKey(key: string) {
  if (!SAFE_KEY.test(key) || key.includes('..') || key.startsWith('/') || key.includes('\\')) {
    throw new Error('Unsafe report storage key')
  }
}

function baseDir(): string {
  const configured = env().REPORT_DIR
  return path.isAbsolute(configured) ? configured : path.join(process.cwd(), configured)
}

class LocalReportStorage implements ReportStorage {
  readonly kind = 'local' as const

  absolutePath(key: string): string {
    assertSafeKey(key)
    const base = baseDir()
    const resolved = path.resolve(base, key)
    if (!resolved.startsWith(path.resolve(base))) throw new Error('Unsafe report storage key')
    return resolved
  }

  async put(key: string, data: Buffer) {
    const target = this.absolutePath(key)
    await mkdir(path.dirname(target), { recursive: true })
    await writeFile(target, data)
    return { key, size: data.byteLength }
  }

  async get(key: string) {
    return readFile(this.absolutePath(key))
  }

  async exists(key: string) {
    try {
      const info = await stat(this.absolutePath(key))
      return info.isFile()
    } catch {
      return false
    }
  }

  async remove(key: string) {
    await unlink(this.absolutePath(key)).catch(() => undefined)
  }
}

export function reportStorage(): ReportStorage {
  // REPORT_STORAGE is validated to `local` today; additional adapters plug in here.
  return new LocalReportStorage()
}

/** Deterministic, filename-safe key: clients/<clientId>/<auditId>.pdf */
export function reportKeyFor(clientId: string, auditId: string): string {
  const safe = (value: string) => value.replace(/[^a-zA-Z0-9_-]/g, '')
  return `clients/${safe(clientId)}/${safe(auditId)}.pdf`
}

export function downloadFilenameFor(siteUrl: string, auditId: string, generatedAt: Date): string {
  const host = (() => {
    try {
      return new URL(siteUrl).hostname.replace(/^www\./, '')
    } catch {
      return 'website'
    }
  })()
  const date = generatedAt.toISOString().slice(0, 10)
  return `edgelink-seo-audit-${host}-${date}-${auditId.slice(-6)}.pdf`.replace(/[^a-zA-Z0-9.\-]/g, '-')
}
