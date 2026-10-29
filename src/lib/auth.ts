import { cookies } from 'next/headers'
import bcrypt from 'bcryptjs'
import { prisma } from './db'
import { SESSION_COOKIE, SESSION_MAX_AGE_SECONDS, signSession, verifySession } from './session'
import { forbidden, unauthorized } from './api'
import type { CurrentUser } from './auth-types'

export type { CurrentUser }
export { assertClientScope } from './authz'

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

/**
 * Resolve the signed-in user from the HttpOnly cookie, re-reading role and
 * client ownership from the database so a stale token cannot grant access.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const token = cookies().get(SESSION_COOKIE)?.value
  const claims = await verifySession(token)
  if (!claims) return null

  const user = await prisma.user.findUnique({
    where: { id: claims.sub },
    select: { id: true, email: true, name: true, role: true, clientId: true, isActive: true },
  })
  if (!user || !user.isActive) return null
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    clientId: user.clientId,
  }
}

export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser()
  if (!user) throw unauthorized()
  return user
}

export async function requireAdmin(): Promise<CurrentUser> {
  const user = await requireUser()
  if (user.role !== 'ADMIN') throw forbidden('Administrator access is required')
  return user
}

/** Store an HttpOnly session cookie for a freshly authenticated user. */
export async function startSession(user: CurrentUser): Promise<void> {
  const token = await signSession({
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    clientId: user.clientId,
  })
  cookies().set({
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
  })
}

export function endSession(): void {
  cookies().set({
    name: SESSION_COOKIE,
    value: '',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  })
}


