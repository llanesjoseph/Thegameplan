/**
 * Enhanced Authentication Utilities
 * Secure token verification and role management
 */

import { auth } from '@/lib/firebase.admin'
import { DecodedIdToken } from 'firebase-admin/auth'
import { auditLog } from '@/lib/audit-logger'

/**
 * Verify Firebase ID token with enhanced security
 */
export async function verifyIdToken(token: string): Promise<DecodedIdToken | null> {
  try {
    // Verify the token with Firebase Admin
    const decodedToken = await auth.verifyIdToken(token, true) // checkRevoked = true

    // Additional security checks
    if (!decodedToken.uid) {
      await auditLog('token_verification_missing_uid', {
        tokenIssuer: decodedToken.iss,
        timestamp: new Date().toISOString()
      }, { severity: 'high' })
      return null
    }

    // Check token age (optional: reject tokens older than X hours)
    const tokenAge = Date.now() / 1000 - decodedToken.auth_time
    const MAX_TOKEN_AGE_HOURS = 24

    if (tokenAge > MAX_TOKEN_AGE_HOURS * 60 * 60) {
      await auditLog('token_verification_expired', {
        userId: decodedToken.uid,
        tokenAge: Math.round(tokenAge / 3600),
        timestamp: new Date().toISOString()
      }, { userId: decodedToken.uid, severity: 'medium' })
      return null
    }

    return decodedToken

  } catch (error) {
    const err = error as Error & { code?: string }
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
 */
export async function hasRole(
  userId: string,
  requiredRoles: string | string[],
  userRole?: string
): Promise<boolean> {
  try {
    const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles]

    // If userRole not provided, fetch from database
    let resolvedUserRole: string = userRole || 'user'
    if (!userRole) {
      const { doc, getDoc } = await import('firebase/firestore')
      const { db } = await import('@/lib/firebase.client')

      const userDoc = await getDoc(doc(db, 'users', userId))
      resolvedUserRole = userDoc.data()?.role || 'user'
    }

    const hasAccess = roles.includes(resolvedUserRole)

    if (!hasAccess) {
      await auditLog('role_check_failed', {
        userId,
        userRole: resolvedUserRole,
        requiredRoles: roles,
        timestamp: new Date().toISOString()
      }, { userId, severity: 'medium' })
    }

    return hasAccess

  } catch (error) {
    const err = error as Error
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
    if (!authHeader?.startsWith('Bearer ')) {
      await auditLog('auth_middleware_no_token', {
        url: request.url,
        method: request.method,
        timestamp: new Date().toISOString()
      }, { severity: 'medium' })

      return { success: false, error: 'Unauthorized', status: 401 }
    }

    // Verify token
    const token = authHeader.substring(7)
    const decodedToken = await verifyIdToken(token)

    if (!decodedToken) {
      return { success: false, error: 'Invalid token', status: 401 }
    }

    // Check role requirements if specified
    if (requiredRoles) {
      const hasRequiredRole = await hasRole(decodedToken.uid, requiredRoles)

      if (!hasRequiredRole) {
        await auditLog('auth_middleware_insufficient_role', {
          userId: decodedToken.uid,
          requiredRoles,
          url: request.url,
          method: request.method,
          timestamp: new Date().toISOString()
        }, { userId: decodedToken.uid, severity: 'medium' })

        return { success: false, error: 'Insufficient permissions', status: 403 }
      }
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

    return { success: true, user: decodedToken }

  } catch (error: any) {
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