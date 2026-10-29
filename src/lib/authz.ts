import { forbidden } from './api'
import type { CurrentUser } from './auth-types'

/**
 * Client users may only read their own client's records.
 * Pure and dependency-free so it is directly unit-testable and safe to reuse in
 * every route and server page.
 */
export function assertClientScope(user: CurrentUser, clientId: string | null | undefined): void {
  if (user.role === 'ADMIN') return
  if (!user.clientId || user.clientId !== clientId) {
    throw forbidden('This record belongs to another client')
  }
}

export function canAccessAudit(
  user: CurrentUser,
  audit: { clientId: string },
): boolean {
  return user.role === 'ADMIN' || (Boolean(user.clientId) && user.clientId === audit.clientId)
}
