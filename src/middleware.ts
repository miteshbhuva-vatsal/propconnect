import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'propconnect-jwt-secret-key-super-secure-minimum-32-chars-2026'
)

const PUBLIC_EXACT = ['/']

const PUBLIC_PATHS = [
  '/login',
  '/onboarding',
  '/api/auth/request-otp',
  '/api/auth/verify-otp',
  '/api/auth/refresh',
  '/p/', // public listing landing pages
]

const ADMIN_PATHS = ['/admin']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public paths
  if (PUBLIC_EXACT.includes(pathname) || PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  const token = request.cookies.get('access_token')?.value
    || request.headers.get('Authorization')?.replace('Bearer ', '')

  if (!token) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.redirect(new URL('/login', request.url))
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    const userId = payload.userId as string
    const role = payload.role as string

    // Admin route protection
    if (ADMIN_PATHS.some(p => pathname.startsWith(p))) {
      if (!['SUPER_ADMIN', 'ADMIN'].includes(role)) {
        return NextResponse.redirect(new URL('/feed', request.url))
      }
    }

    // Attach user info to request headers for API routes
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-user-id', userId)
    requestHeaders.set('x-user-role', role)

    return NextResponse.next({ request: { headers: requestHeaders } })
  } catch {
    // Token invalid or expired
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Token expired' }, { status: 401 })
    }
    const response = NextResponse.redirect(new URL('/login', request.url))
    response.cookies.delete('access_token')
    return response
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|images|icons).*)',
  ],
}
