import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Middleware to protect dashboard routes with authentication
 *
 * This middleware ONLY runs on /dashboard/* routes to prevent interference with API routes.
 * API routes handle their own authentication via Bearer tokens.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Only protect /dashboard/* routes
  if (!pathname.startsWith('/dashboard')) {
    return NextResponse.next()
  }

  // Check for authentication cookies
  const sessionCookie = request.cookies.get('session')?.value
  const authToken = request.cookies.get('authToken')?.value

  // If no auth cookie found, redirect to login page
  if (!sessionCookie && !authToken) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)

    console.log(`[Middleware] Redirecting unauthenticated user from ${pathname} to /login`)

    return NextResponse.redirect(loginUrl)
  }

  // User is authenticated, allow access
  return NextResponse.next()
}

/**
 * Configure middleware to ONLY run on dashboard routes
 * Explicitly excludes:
 * - All /api/* routes (they handle their own auth)
 * - Static files
 * - Next.js internals
 */
export const config = {
  matcher: [
    '/dashboard/:path*'  // Only match /dashboard and its sub-paths
  ]
}
