import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Protected route patterns (dashboard pages only - API routes handle their own auth)
const protectedPaths = [
  '/dashboard'
]

// Public paths that don't require authentication
const publicPaths = [
  '/',
  '/login',
  '/signup',
  '/coaches',
  '/lessons',
  '/gear',
  '/subscribe',
  '/about',
  '/contact',
  '/terms',
  '/privacy',
  '/api/auth',
  '/api/public'
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check if path is protected
  const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path))
  const isPublicPath = publicPaths.some(path =>
    pathname === path || pathname.startsWith(path)
  )

  // Allow public paths
  if (isPublicPath || pathname.startsWith('/_next') || pathname.startsWith('/static')) {
    return NextResponse.next()
  }

  // Protect dashboard and API routes
  if (isProtectedPath) {
    // Check for Firebase auth session cookie
    const sessionCookie = request.cookies.get('session')?.value
    const authToken = request.cookies.get('authToken')?.value

    // If no auth cookie, redirect to login
    if (!sessionCookie && !authToken) {
      const loginUrl = new URL('/', request.url)
      loginUrl.searchParams.set('redirect', pathname)

      console.log(`[Middleware] Blocking unauthenticated access to: ${pathname}`)

      return NextResponse.redirect(loginUrl)
    }
  }

  // Allow request to continue
  return NextResponse.next()
}

// Configure which routes use this middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
