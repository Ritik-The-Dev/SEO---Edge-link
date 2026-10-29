import { describe, expect, it } from 'vitest'
import { assertClientScope, canAccessAudit } from '@/lib/authz'
import { signSession, verifySession, SESSION_MAX_AGE_SECONDS } from '@/lib/session'
import { hashPassword, verifyPassword } from '@/lib/auth'
import { HttpError } from '@/lib/api'
import type { CurrentUser } from '@/lib/auth-types'

const admin: CurrentUser = { id: 'u1', email: 'a@example.com', name: 'Admin', role: 'ADMIN', clientId: null }
const clientA: CurrentUser = { id: 'u2', email: 'c@example.com', name: 'Client A', role: 'CLIENT', clientId: 'client-a' }
const clientB: CurrentUser = { id: 'u3', email: 'd@example.com', name: 'Client B', role: 'CLIENT', clientId: 'client-b' }

describe('client scoping', () => {
  it('lets admins read any client', () => {
    expect(() => assertClientScope(admin, 'client-a')).not.toThrow()
    expect(() => assertClientScope(admin, null)).not.toThrow()
  })

  it('lets a client read only its own client id', () => {
    expect(() => assertClientScope(clientA, 'client-a')).not.toThrow()
  })

  it('rejects another client with a 403', () => {
    try {
      assertClientScope(clientA, 'client-b')
      throw new Error('expected a rejection')
    } catch (error) {
      expect(error).toBeInstanceOf(HttpError)
      expect((error as HttpError).status).toBe(403)
    }
  })

  it('rejects clients without an association', () => {
    expect(() => assertClientScope({ ...clientA, clientId: null }, 'client-a')).toThrow(HttpError)
  })

  it('evaluates audit ownership the same way', () => {
    expect(canAccessAudit(admin, { clientId: 'client-b' })).toBe(true)
    expect(canAccessAudit(clientA, { clientId: 'client-a' })).toBe(true)
    expect(canAccessAudit(clientA, { clientId: 'client-b' })).toBe(false)
  })
})

describe('session tokens', () => {
  it('round-trips signed claims', async () => {
    const token = await signSession({ sub: 'u2', email: 'c@example.com', name: 'Client A', role: 'CLIENT', clientId: 'client-a' })
    const claims = await verifySession(token)
    expect(claims).toMatchObject({ sub: 'u2', role: 'CLIENT', clientId: 'client-a' })
    expect(SESSION_MAX_AGE_SECONDS).toBe(8 * 3600)
  })

  it('rejects tampered and empty tokens', async () => {
    const token = await signSession({ sub: 'u1', email: 'a@example.com', name: 'Admin', role: 'ADMIN', clientId: null })
    expect(await verifySession(`${token}tampered`)).toBeNull()
    expect(await verifySession('')).toBeNull()
    expect(await verifySession(undefined)).toBeNull()
  })
})

describe('password hashing', () => {
  it('hashes and verifies without storing plaintext', async () => {
    const hash = await hashPassword('EdgelinkClient!2026')
    expect(hash).not.toContain('EdgelinkClient')
    expect(await verifyPassword('EdgelinkClient!2026', hash)).toBe(true)
    expect(await verifyPassword('wrong-password', hash)).toBe(false)
  })
})
