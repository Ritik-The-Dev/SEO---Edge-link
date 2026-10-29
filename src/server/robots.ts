import { safeFetch } from '@/lib/urls'
import type { RobotsResult } from '@/types/audit'

/**
 * Fetch and interpret robots.txt for the audit origin.
 * A missing robots.txt is reported as such (it is not automatically a failure).
 */
export async function checkRobots(origin: string): Promise<RobotsResult> {
  const url = new URL('/robots.txt', origin).toString()
  const empty: RobotsResult = {
    url,
    exists: false,
    status: null,
    sitemapUrls: [],
    disallowAll: false,
    blocksAllBots: false,
  }

  try {
    const fetched = await safeFetch(url, { timeoutMs: 10000, maxBytes: 200_000, maxRedirects: 2 })
    if (fetched.status === 404) return { ...empty, status: 404 }
    if (!fetched.ok) return { ...empty, status: fetched.status, error: `robots.txt returned HTTP ${fetched.status}` }

    const lines = fetched.body.split(/\r?\n/)
    const sitemapUrls: string[] = []
    const blockedAgents = new Set<string>()
    let currentAgents: string[] = []
    let disallowAll = false

    for (const rawLine of lines) {
      const line = rawLine.split('#')[0]?.trim() ?? ''
      if (!line) continue
      const [rawKey, ...rest] = line.split(':')
      const key = (rawKey ?? '').trim().toLowerCase()
      const value = rest.join(':').trim()

      if (key === 'sitemap' && value) {
        if (sitemapUrls.length < 10) sitemapUrls.push(value)
      } else if (key === 'user-agent') {
        currentAgents = [value.toLowerCase()]
      } else if (key === 'disallow') {
        if (value === '/' || value === '/*') {
          if (currentAgents.includes('*') || currentAgents.includes('edgelinkauditbot')) disallowAll = true
          currentAgents.forEach((agent) => blockedAgents.add(agent))
        }
      }
    }

    return {
      url,
      exists: true,
      status: fetched.status,
      sitemapUrls,
      disallowAll,
      blocksAllBots: disallowAll,
    }
  } catch (error) {
    return { ...empty, error: error instanceof Error ? error.message : 'Could not read robots.txt' }
  }
}
