import { SignJWT, jwtVerify } from 'jose'

/**
 * Edge-safe session token helpers. No database or bcrypt imports here so this
 * module can be used from middleware.
 */
export const SESSION_COOKIE = 'edgelink_session'
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8

export type SessionRole = 'ADMIN' | 'CLIENT'

export interface SessionClaims {
  sub: string
  email: string
  name: string
  role: SessionRole
  clientId?: string | null
}

function secretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET
  if (!secret || secret.length < 32) {
    throw new Error('AUTH_SECRET is missing or too short (min 32 characters)')
  }
  return new TextEncoder().encode(secret)
}

export async function signSession(claims: SessionClaims): Promise<string> {
  return new SignJWT({
    email: claims.email,
    name: claims.name,
    role: claims.role,
    clientId: claims.clientId ?? null,
  })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setSubject(claims.sub)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .setIssuer('edgelink')
    .setAudience('edgelink-app')
    .sign(secretKey())
}

export async function verifySession(token: string | undefined | null): Promise<SessionClaims | null> {
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, secretKey(), {
      issuer: 'edgelink',
      audience: 'edgelink-app',
    })
    if (!payload.sub || typeof payload.role !== 'string') return null
    if (payload.role !== 'ADMIN' && payload.role !== 'CLIENT') return null
    return {
      sub: payload.sub,
      email: String(payload.email ?? ''),
      name: String(payload.name ?? ''),
      role: payload.role,
      clientId: typeof payload.clientId === 'string' ? payload.clientId : null,
    }
  } catch {
    return null
  }
}
