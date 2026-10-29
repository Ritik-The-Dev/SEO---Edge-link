import { lookup } from 'node:dns/promises'
import net from 'node:net'

/**
 * URL normalisation and SSRF protection for the crawler.
 *
 * Rules enforced here (and re-checked on every redirect hop):
 *  - only http(s)
 *  - no embedded credentials
 *  - reject localhost, *.local/*.internal names and metadata hostnames
 *  - reject IP literals and DNS answers in private, loopback, link-local,
 *    CGNAT, multicast and reserved ranges (incl. IPv4-mapped IPv6)
 */

export class UrlValidationError extends Error {
  code: string
  constructor(message: string, code = 'INVALID_URL') {
    super(message)
    this.name = 'UrlValidationError'
    this.code = code
  }
}

const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  'localhost.localdomain',
  'ip6-localhost',
  'ip6-loopback',
  'metadata',
  'metadata.google.internal',
  'instance-data',
  'kubernetes.default',
])

const BLOCKED_SUFFIXES = ['.localhost', '.local', '.internal', '.localdomain', '.home.arpa', '.cluster.local']

export type Resolver = (hostname: string) => Promise<string[]>

const defaultResolver: Resolver = async (hostname) => {
  const records = await lookup(hostname, { all: true, verbatim: true })
  return records.map((record) => record.address)
}

function parseIPv4(address: string): number[] | null {
  const parts = address.split('.')
  if (parts.length !== 4) return null
  const octets = parts.map((part) => (/^\d{1,3}$/.test(part) ? Number(part) : NaN))
  if (octets.some((octet) => Number.isNaN(octet) || octet < 0 || octet > 255)) return null
  return octets as number[]
}

function expandIPv6(address: string): number[] | null {
  let value = address.trim().toLowerCase()
  const zoneIndex = value.indexOf('%')
  if (zoneIndex !== -1) value = value.slice(0, zoneIndex)
  if (value.startsWith('[') && value.endsWith(']')) value = value.slice(1, -1)
  if (!value.includes(':')) return null

  // Rewrite an embedded IPv4 tail (e.g. ::ffff:127.0.0.1) as two hex groups.
  if (value.includes('.')) {
    const lastColon = value.lastIndexOf(':')
    if (lastColon === -1) return null
    const v4 = parseIPv4(value.slice(lastColon + 1))
    if (!v4) return null
    const high = ((v4[0]! << 8) | v4[1]!).toString(16)
    const low = ((v4[2]! << 8) | v4[3]!).toString(16)
    value = `${value.slice(0, lastColon + 1)}${high}:${low}`
  }

  const parseGroups = (parts: string[]): number[] | null => {
    const out: number[] = []
    for (const part of parts) {
      if (!/^[0-9a-f]{1,4}$/.test(part)) return null
      out.push(parseInt(part, 16))
    }
    return out
  }

  const halves = value.split('::')
  if (halves.length > 2) return null
  const head = halves[0] ? parseGroups(halves[0].split(':')) : []
  if (!head) return null

  let groups: number[]
  if (halves.length === 2) {
    const tail = halves[1] ? parseGroups(halves[1].split(':')) : []
    if (!tail) return null
    const missing = 8 - head.length - tail.length
    if (missing < 1) return null
    groups = [...head, ...Array<number>(missing).fill(0), ...tail]
  } else {
    if (head.length !== 8) return null
    groups = head
  }

  const bytes: number[] = []
  for (const group of groups) bytes.push((group >> 8) & 0xff, group & 0xff)
  return bytes.length === 16 ? bytes : null
}

export function isPrivateAddress(address: string): boolean {
  const version = net.isIP(address)
  if (version === 4) {
    const octets = parseIPv4(address)
    if (!octets) return true
    const [a, b] = octets as [number, number, number, number]
    if (a === 0) return true // "this network"
    if (a === 10) return true // private
    if (a === 127) return true // loopback
    if (a === 169 && b === 254) return true // link-local + cloud metadata
    if (a === 172 && b >= 16 && b <= 31) return true // private
    if (a === 192 && b === 168) return true // private
    if (a === 192 && b === 0 && octets[2] === 0) return true
    if (a === 100 && b >= 64 && b <= 127) return true // CGNAT
    if (a === 198 && (b === 18 || b === 19)) return true // benchmarking
    if (a === 198 && b === 51 && octets[2] === 100) return true // TEST-NET-2
    if (a === 203 && b === 0 && octets[2] === 113) return true // TEST-NET-3
    if (a >= 224) return true // multicast + reserved + broadcast
    return false
  }
  if (version === 6) {
    const bytes = expandIPv6(address)
    if (!bytes) return true
    const allZero = bytes.every((byte) => byte === 0)
    if (allZero) return true // ::
    const loopback = bytes.slice(0, 15).every((byte) => byte === 0) && bytes[15] === 1
    if (loopback) return true // ::1
    // IPv4-mapped ::ffff:a.b.c.d
    const mappedPrefix = bytes.slice(0, 10).every((byte) => byte === 0) && bytes[10] === 0xff && bytes[11] === 0xff
    if (mappedPrefix) {
      return isPrivateAddress(`${bytes[12]}.${bytes[13]}.${bytes[14]}.${bytes[15]}`)
    }
    if ((bytes[0]! & 0xfe) === 0xfc) return true // unique local fc00::/7
    if (bytes[0] === 0xfe && (bytes[1]! & 0xc0) === 0x80) return true // link-local fe80::/10
    if (bytes[0] === 0xff) return true // multicast
    if (bytes[0] === 0x20 && bytes[1] === 0x01 && bytes[2] === 0x0d && bytes[3] === 0xb8) return true // documentation
    return false
  }
  return true
}

function assertPublicHostname(hostname: string) {
  // URL keeps IPv6 literals bracketed; net.isIP wants the bare address.
  const host = hostname.toLowerCase().replace(/\.$/, '').replace(/^\[|\]$/g, '')
  if (!host) throw new UrlValidationError('URL is missing a hostname')
  if (BLOCKED_HOSTNAMES.has(host)) {
    throw new UrlValidationError('Private, local or metadata hosts cannot be audited')
  }
  if (BLOCKED_SUFFIXES.some((suffix) => host.endsWith(suffix))) {
    throw new UrlValidationError('Private, local or metadata hosts cannot be audited')
  }
  if (net.isIP(host) && isPrivateAddress(host)) {
    throw new UrlValidationError('Private or reserved IP addresses cannot be audited')
  }
}

/**
 * Normalise user input into an absolute http(s) URL.
 * Accepts `example.com` as shorthand for `https://example.com`.
 */
export function normalizeHttpUrl(raw: string): URL {
  const trimmed = (raw ?? '').trim()
  if (!trimmed) throw new UrlValidationError('A website URL is required')
  if (trimmed.length > 2048) throw new UrlValidationError('URL is too long')

  const hasScheme = /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)
  const candidate = hasScheme ? trimmed : `https://${trimmed}`

  let url: URL
  try {
    url = new URL(candidate)
  } catch {
    throw new UrlValidationError('Enter a valid website URL, for example https://example.com')
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new UrlValidationError('Only http:// and https:// URLs can be audited', 'UNSUPPORTED_PROTOCOL')
  }
  if (url.username || url.password) {
    throw new UrlValidationError('URLs containing credentials are not allowed')
  }
  assertPublicHostname(url.hostname)
  url.hash = ''
  if (url.pathname === '') url.pathname = '/'
  return url
}

/**
 * Resolve a hostname and reject any answer that points at a non-public address.
 * DNS rebinding is mitigated by validating each hop immediately before fetching.
 */
export async function assertPublicDestination(
  target: string | URL,
  resolver: Resolver = defaultResolver,
): Promise<URL> {
  const url = typeof target === 'string' ? normalizeHttpUrl(target) : target
  assertPublicHostname(url.hostname)

  if (net.isIP(url.hostname)) {
    if (isPrivateAddress(url.hostname)) {
      throw new UrlValidationError('Private or reserved IP addresses cannot be audited')
    }
    return url
  }

  let addresses: string[]
  try {
    addresses = await resolver(url.hostname)
  } catch {
    throw new UrlValidationError(`Could not resolve ${url.hostname}`, 'DNS_FAILURE')
  }
  if (!addresses.length) {
    throw new UrlValidationError(`Could not resolve ${url.hostname}`, 'DNS_FAILURE')
  }
  if (addresses.some((address) => isPrivateAddress(address))) {
    throw new UrlValidationError('Host resolves to a private or reserved address', 'PRIVATE_ADDRESS')
  }
  return url
}

export const DEFAULT_USER_AGENT = 'EdgeLinkAuditBot/1.0 (+https://edgelink.example/bot)'

export interface SafeFetchOptions {
  timeoutMs?: number
  maxBytes?: number
  maxRedirects?: number
  headers?: Record<string, string>
  resolver?: Resolver
  userAgent?: string
  /** Injectable for tests; defaults to the global fetch. */
  fetchImpl?: typeof fetch
}

export interface SafeFetchResult {
  finalUrl: string
  status: number
  ok: boolean
  contentType: string
  headers: Record<string, string>
  body: string
  truncated: boolean
  redirects: string[]
  durationMs: number
}

function headersToObject(headers: Headers): Record<string, string> {
  const out: Record<string, string> = {}
  headers.forEach((value, key) => {
    out[key.toLowerCase()] = value
  })
  return out
}

async function readCapped(response: Response, maxBytes: number): Promise<{ body: string; truncated: boolean }> {
  if (!response.body) return { body: '', truncated: false }
  const reader = response.body.getReader()
  const chunks: Uint8Array[] = []
  let total = 0
  let truncated = false

  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    if (!value) continue
    total += value.byteLength
    if (total > maxBytes) {
      chunks.push(value.slice(0, Math.max(0, value.byteLength - (total - maxBytes))))
      truncated = true
      await reader.cancel().catch(() => undefined)
      break
    }
    chunks.push(value)
  }

  const merged = new Uint8Array(chunks.reduce((sum, chunk) => sum + chunk.byteLength, 0))
  let offset = 0
  for (const chunk of chunks) {
    merged.set(chunk, offset)
    offset += chunk.byteLength
  }
  return { body: new TextDecoder('utf-8', { fatal: false }).decode(merged), truncated }
}

/**
 * Fetch a URL with redirect-by-redirect SSRF validation, a hard timeout and a
 * response-size ceiling. Only used for audit targets (never for user HTML).
 */
export async function safeFetch(input: string | URL, options: SafeFetchOptions = {}): Promise<SafeFetchResult> {
  const timeoutMs = options.timeoutMs ?? 15000
  const maxBytes = options.maxBytes ?? 2 * 1024 * 1024
  const maxRedirects = options.maxRedirects ?? 4
  const resolver = options.resolver ?? defaultResolver

  let current = await assertPublicDestination(input, resolver)
  const redirects: string[] = []
  const started = Date.now()
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  const doFetch = options.fetchImpl ?? fetch

  try {
    for (let hop = 0; hop <= maxRedirects; hop += 1) {
      const response = await doFetch(current.toString(), {
        redirect: 'manual',
        signal: controller.signal,
        headers: {
          'user-agent': options.userAgent ?? DEFAULT_USER_AGENT,
          accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'accept-language': 'en-IN,en;q=0.9',
          ...options.headers,
        },
      })

      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get('location')
        await response.body?.cancel().catch(() => undefined)
        if (!location) {
          return {
            finalUrl: current.toString(),
            status: response.status,
            ok: false,
            contentType: '',
            headers: headersToObject(response.headers),
            body: '',
            truncated: false,
            redirects,
            durationMs: Date.now() - started,
          }
        }
        const next = new URL(location, current)
        redirects.push(next.toString())
        current = await assertPublicDestination(next, resolver)
        continue
      }

      const { body, truncated } = await readCapped(response, maxBytes)
      return {
        finalUrl: current.toString(),
        status: response.status,
        ok: response.ok,
        contentType: response.headers.get('content-type') ?? '',
        headers: headersToObject(response.headers),
        body,
        truncated,
        redirects,
        durationMs: Date.now() - started,
      }
    }

    throw new UrlValidationError('Too many redirects', 'TOO_MANY_REDIRECTS')
  } catch (error) {
    if (error instanceof UrlValidationError) throw error
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new UrlValidationError('The website took too long to respond', 'TIMEOUT')
    }
    throw new UrlValidationError(
      error instanceof Error ? `Could not reach the website: ${error.message}` : 'Could not reach the website',
      'FETCH_FAILED',
    )
  } finally {
    clearTimeout(timer)
  }
}
