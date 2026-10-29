import { NextResponse, type NextRequest } from 'next/server'
import { SESSION_COOKIE, verifySession } from '@/lib/session'

/**
 * First line of defence: redirects unauthenticated traffic and keeps admins and
 * clients inside their own areas. Every route handler and layout still performs
 * its own server-side authentication and ownership checks.
 */
export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  const claims = await verifySession(request.cookies.get(SESSION_COOKIE)?.value)
  const home = claims ? (claims.role === 'ADMIN' ? '/app' : '/client') : '/login'

  if (pathname === '/login') {
    if (claims) return NextResponse.redirect(new URL(home, request.url))
    return NextResponse.next()
  }

  if (!claims) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('next', `${pathname}${search}`)
    return NextResponse.redirect(loginUrl)
  }

  if (pathname.startsWith('/app') && claims.role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/client', request.url))
  }
  if (pathname.startsWith('/client') && claims.role !== 'CLIENT') {
    return NextResponse.redirect(new URL('/app', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/app/:path*', '/client/:path*', '/login'],
}
