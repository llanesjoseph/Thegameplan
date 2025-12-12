/**
 * Enhanced Authentication Utilities
 * Secure token verification and role management
 */

import { auth, adminDb } from '@/lib/firebase.admin'
import { DecodedIdToken } from 'firebase-admin/auth'
import { auditLog } from '@/lib/audit-logger'

/**
 * Verify Firebase ID token with enhanced security
 */
export async function verifyIdToken(token: string): Promise<DecodedIdToken | null> {
  try {
    // Validate token format first
    if (!token || typeof token !== 'string' || token.trim().length === 0) {
      console.error('[AUTH-UTILS] Token verification failed: empty or invalid token format')
      return null
    }

    // Verify the token with Firebase Admin
    // Use checkRevoked = false for now to avoid issues with token refresh
    // The token is already being refreshed on the client side
    // Firebase Admin SDK automatically checks token expiration (exp claim)
    console.log(`[AUTH-UTILS] Calling Firebase Admin verifyIdToken (checkRevoked=false)`)
    const decodedToken = await auth.verifyIdToken(token, false) // checkRevoked = false
    console.log(`[AUTH-UTILS] Firebase Admin verifyIdToken succeeded`)

    // Additional security checks
    if (!decodedToken.uid) {
      console.error('[AUTH-UTILS] Token verification failed: missing UID')
      await auditLog('token_verification_missing_uid', {
        tokenIssuer: decodedToken.iss,
        timestamp: new Date().toISOString()
      }, { severity: 'high' })
      return null
    }

    console.log(`[AUTH-UTILS] Token verified - UID: ${decodedToken.uid}, email: ${decodedToken.email || 'N/A'}`)
    console.log(`[AUTH-UTILS] Token issued at: ${new Date(decodedToken.iat * 1000).toISOString()}, expires at: ${new Date(decodedToken.exp * 1000).toISOString()}`)

    // CRITICAL FIX: Don't check auth_time - that's when the user first logged in, not when token was issued
    // Firebase Admin SDK already validates token expiration (exp claim) automatically
    // If verifyIdToken succeeds, the token is valid and not expired
    // Checking auth_time was causing valid refreshed tokens to be rejected

    return decodedToken

  } catch (error) {
    const err = error as Error & { code?: string }
    console.error('[AUTH-UTILS] Token verification exception:', err.message)
    console.error('[AUTH-UTILS] Error code:', err.code)
    console.error('[AUTH-UTILS] Error stack:', err.stack)
    
    // Log more details for debugging
    if (err.code === 'auth/id-token-expired') {
      console.error('[AUTH-UTILS] Token has expired - user needs to refresh')
    } else if (err.code === 'auth/argument-error') {
      console.error('[AUTH-UTILS] Invalid token format or argument')
    } else if (err.code === 'auth/invalid-id-token') {
      console.error('[AUTH-UTILS] Token is invalid or malformed')
    }
    
    await auditLog('token_verification_failed', {
      error: err.message || 'Unknown error',
      errorCode: err.code || 'UNKNOWN',
      timestamp: new Date().toISOString()
    }, { severity: 'high' })

    return null
  }
}

/**
 * Enhanced role checking with audit logging
 * CRITICAL: Uses server-side Firebase Admin (not client-side)
 */
export async function hasRole(
  userId: string,
  requiredRoles: string | string[],
  userRole?: string
): Promise<boolean> {
  try {
    const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles]

    // If userRole not provided, fetch from database using SERVER-SIDE Firebase Admin
    let resolvedUserRole: string = userRole || 'user'
    if (!userRole) {
      try {
        const userDoc = await adminDb.collection('users').doc(userId).get()
        if (!userDoc.exists) {
          console.error(`[AUTH-UTILS] User document does not exist for ${userId}`)
          resolvedUserRole = 'user'
        } else {
          const userData = userDoc.data()
          resolvedUserRole = userData?.role || 'user'
          console.log(`[AUTH-UTILS] Fetched role for ${userId}: ${resolvedUserRole} (from document)`)
        }
      } catch (error) {
        console.error(`[AUTH-UTILS] Error fetching role for ${userId}:`, error)
        resolvedUserRole = 'user'
      }
    } else {
      console.log(`[AUTH-UTILS] Using provided role for ${userId}: ${resolvedUserRole}`)
    }

    // Normalize role names to lowercase for comparison
    const normalizedUserRole = resolvedUserRole.toLowerCase().trim()
    const normalizedRequiredRoles = roles.map(r => r.toLowerCase().trim())
    const hasAccess = normalizedRequiredRoles.includes(normalizedUserRole)

    if (!hasAccess) {
      console.error(`[AUTH-UTILS] Role check failed: user ${userId} has role '${resolvedUserRole}' (normalized: '${normalizedUserRole}'), required: ${roles.join(', ')} (normalized: ${normalizedRequiredRoles.join(', ')})`)
      await auditLog('role_check_failed', {
        userId,
        userRole: resolvedUserRole,
        normalizedUserRole,
        requiredRoles: roles,
        normalizedRequiredRoles,
        timestamp: new Date().toISOString()
      }, { userId, severity: 'medium' })
    } else {
      console.log(`[AUTH-UTILS] Role check passed: user ${userId} has role '${resolvedUserRole}' (normalized: '${normalizedUserRole}'), required: ${roles.join(', ')}`)
    }

    return hasAccess

  } catch (error) {
    const err = error as Error
    console.error(`[AUTH-UTILS] Role check error for ${userId}:`, err.message)
    await auditLog('role_check_error', {
      userId,
      requiredRoles,
      error: err.message || 'Unknown error',
      timestamp: new Date().toISOString()
    }, { userId, severity: 'high' })

    return false
  }
}

/**
 * Check if user has admin privileges
 */
export async function isAdmin(userId: string): Promise<boolean> {
  return hasRole(userId, ['admin', 'superadmin'])
}

/**
 * Check if user can upload content (creator or higher)
 */
export async function canUploadContent(userId: string): Promise<boolean> {
  return hasRole(userId, ['creator', 'coach', 'assistant', 'admin', 'superadmin'])
}

/**
 * Enhanced middleware for API route protection
 */
export async function requireAuth(
  request: Request,
  requiredRoles?: string | string[]
): Promise<{ success: true; user: DecodedIdToken } | { success: false; error: string; status: number }> {

  try {
    // Extract token from Authorization header
    const authHeader = request.headers.get('authorization')
    console.log(`[AUTH-UTILS] Checking authorization header for ${request.url}`)
    console.log(`[AUTH-UTILS] Authorization header present: ${!!authHeader}`)
    console.log(`[AUTH-UTILS] Authorization header starts with Bearer: ${authHeader?.startsWith('Bearer ')}`)
    
    if (!authHeader?.startsWith('Bearer ')) {
      console.error('[AUTH-UTILS] No authorization header found or invalid format')
      console.error(`[AUTH-UTILS] Header value: ${authHeader ? authHeader.substring(0, 50) + '...' : 'null'}`)
      await auditLog('auth_middleware_no_token', {
        url: request.url,
        method: request.method,
        timestamp: new Date().toISOString()
      }, { severity: 'medium' })

      return { success: false, error: 'Unauthorized', status: 401 }
    }

    // Verify token
    const token = authHeader.substring(7)
    console.log(`[AUTH-UTILS] Verifying token for ${request.url}`)
    console.log(`[AUTH-UTILS] Token length: ${token.length}, starts with: ${token.substring(0, 20)}...`)
    
    const decodedToken = await verifyIdToken(token)

    if (!decodedToken) {
      console.error('[AUTH-UTILS] Token verification failed - verifyIdToken returned null')
      console.error('[AUTH-UTILS] This could mean: token expired, invalid format, or Firebase verification failed')
      return { success: false, error: 'Invalid token', status: 401 }
    }
    
    console.log(`[AUTH-UTILS] Token verified successfully for user ${decodedToken.uid}`)

    console.log(`[AUTH-UTILS] Token verified for user ${decodedToken.uid}`)

    // Check role requirements if specified
    if (requiredRoles) {
      const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles]
      console.log(`[AUTH-UTILS] Checking roles for ${decodedToken.uid}: required ${roles.join(', ')}`)
      const hasRequiredRole = await hasRole(decodedToken.uid, requiredRoles)

      if (!hasRequiredRole) {
        console.error(`[AUTH-UTILS] Insufficient role for ${decodedToken.uid}`)
        await auditLog('auth_middleware_insufficient_role', {
          userId: decodedToken.uid,
          requiredRoles,
          url: request.url,
          method: request.method,
          timestamp: new Date().toISOString()
        }, { userId: decodedToken.uid, severity: 'medium' })

        return { success: false, error: 'Insufficient permissions', status: 403 }
      }
      console.log(`[AUTH-UTILS] Role check passed for ${decodedToken.uid}`)
    }

    // Log successful authentication for sensitive endpoints
    if (isSensitiveEndpoint(request.url)) {
      await auditLog('auth_middleware_success', {
        userId: decodedToken.uid,
        url: request.url,
        method: request.method,
        timestamp: new Date().toISOString()
      }, { userId: decodedToken.uid, severity: 'low' })
    }

    console.log(`[AUTH-UTILS] Authentication successful for ${decodedToken.uid}`)
    return { success: true, user: decodedToken }

  } catch (error: any) {
    console.error('[AUTH-UTILS] Authentication error:', error.message, error.stack)
    await auditLog('auth_middleware_error', {
      error: error.message,
      url: request.url,
      method: request.method,
      timestamp: new Date().toISOString()
    }, { severity: 'high' })

    return { success: false, error: 'Authentication error', status: 500 }
  }
}

/**
 * Check if endpoint requires audit logging
 */
function isSensitiveEndpoint(url: string): boolean {
  const sensitivePatterns = [
    '/api/admin',
    '/api/video/upload',
    '/api/ai-coaching',
    '/api/generate-lesson',
    '/api/user/role'
  ]

  return sensitivePatterns.some(pattern => url.includes(pattern))
}

/**
 * Rate limiting utilities
 */
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

export async function checkRateLimit(
  identifier: string, // userId or IP
  limit: number = 100,
  windowMs: number = 60 * 1000 // 1 minute
): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {

  const now = Date.now()
  const key = `${identifier}:${Math.floor(now / windowMs)}`

  const current = rateLimitStore.get(key) || { count: 0, resetTime: now + windowMs }

  if (now > current.resetTime) {
    // Reset window
    current.count = 0
    current.resetTime = now + windowMs
  }

  current.count++
  rateLimitStore.set(key, current)

  const allowed = current.count <= limit

  if (!allowed) {
    await auditLog('rate_limit_exceeded', {
      identifier,
      count: current.count,
      limit,
      timestamp: new Date().toISOString()
    }, { severity: 'medium' })
  }

  return {
    allowed,
    remaining: Math.max(0, limit - current.count),
    resetTime: current.resetTime
  }
}

// Clean up old rate limit entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, value] of rateLimitStore.entries()) {
    if (now > value.resetTime) {
      rateLimitStore.delete(key)
    }
  }
}, 5 * 60 * 1000) // Clean up every 5 minutes