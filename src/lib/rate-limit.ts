/**
 * Minimal fixed-window rate limiter for auth and audit-creation endpoints.
 * State is per process: on serverless this limits per instance only, and the
 * README documents swapping in a Redis-backed limiter for strict enforcement.
 */
type Bucket = { count: number; resetAt: number }

const buckets = new Map<string, Bucket>()
const MAX_TRACKED_KEYS = 10_000

export function checkRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now()
  if (buckets.size > MAX_TRACKED_KEYS) {
    for (const [bucketKey, bucket] of buckets) {
      if (bucket.resetAt <= now) buckets.delete(bucketKey)
    }
  }

  const existing = buckets.get(key)
  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: limit - 1, retryAfterSeconds: 0 }
  }

  existing.count += 1
  if (existing.count > limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    }
  }
  return { allowed: true, remaining: limit - existing.count, retryAfterSeconds: 0 }
}

export function clientKey(request: Request, scope: string): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'local'
  return `${scope}:${ip}`
}

/** Test seam. */
export function resetRateLimits() {
  buckets.clear()
}
