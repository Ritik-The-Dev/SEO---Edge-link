import { prisma } from '@/lib/db'
import { HttpError, ok, parseBody, route } from '@/lib/api'
import { clientKey, checkRateLimit } from '@/lib/rate-limit'
import { loginSchema } from '@/validation/schemas'
import { startSession, verifyPassword } from '@/lib/auth'

export const POST = route(async (request) => {
  const limit = checkRateLimit(clientKey(request, 'login'), 8, 5 * 60 * 1000)
  if (!limit.allowed) {
    throw new HttpError(429, `Too many sign-in attempts. Try again in ${limit.retryAfterSeconds}s.`, 'RATE_LIMITED')
  }

  const body = await parseBody(request, loginSchema)
  const user = await prisma.user.findUnique({ where: { email: body.email } })

  // Constant-ish work regardless of account existence.
  const passwordValid = user ? await verifyPassword(body.password, user.passwordHash) : false
  if (!user || !passwordValid || !user.isActive) {
    throw new HttpError(401, 'Email or password is incorrect', 'INVALID_CREDENTIALS')
  }

  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } })
  await startSession({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    clientId: user.clientId,
  })

  return ok({
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
    redirectTo: user.role === 'ADMIN' ? '/app' : '/client',
  })
})
