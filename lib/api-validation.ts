/**
 * Comprehensive API Validation Middleware
 *
 * This module provides consistent validation across all API endpoints
 * to ensure data integrity and security at the ingestion layer.
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyIdToken } from '@/lib/auth-utils'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase.client'
import { UserProfile, AppRole } from '@/types/user'
import { auditLog } from '@/lib/audit-logger'

// Request size limits (in bytes)
export const REQUEST_LIMITS = {
  JSON_BODY: 10 * 1024 * 1024, // 10MB for JSON
  FILE_UPLOAD: 10 * 1024 * 1024 * 1024, // 10GB for files
  IMAGE_UPLOAD: 100 * 1024 * 1024, // 100MB for images
  AUDIO_UPLOAD: 500 * 1024 * 1024, // 500MB for audio
} as const

// Role hierarchy for permission checks
const ROLE_HIERARCHY: Record<AppRole, number> = {
  guest: 0,
  user: 1,
  athlete: 1,
  creator: 2,
  coach: 3,
  assistant: 4,
  admin: 5,
  superadmin: 6
}

/**
 * Validation Error Types
 */
export class ValidationError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400,
    public field?: string
  ) {
    super(message)
    this.name = 'ValidationError'
  }
}

export class AuthenticationError extends Error {
  constructor(message: string = 'Authentication required', public statusCode: number = 401) {
    super(message)
    this.name = 'AuthenticationError'
  }
}

export class AuthorizationError extends Error {
  constructor(message: string = 'Insufficient permissions', public statusCode: number = 403) {
    super(message)
    this.name = 'AuthorizationError'
  }
}

/**
 * Request validation context
 */
export interface ValidationContext {
  user?: UserProfile
  userRole?: AppRole
  ip?: string
  userAgent?: string
  timestamp: string
}

/**
 * Authentication and user validation middleware
 */
export async function validateAuthentication(request: NextRequest): Promise<ValidationContext> {
  const timestamp = new Date().toISOString()
  const ip = request.ip || 'unknown'
  const userAgent = request.headers.get('user-agent') || 'unknown'

  // Check for authorization header
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    await auditLog('api_authentication_missing', {
      ip,
      userAgent,
      timestamp,
      endpoint: request.nextUrl.pathname
    })
    throw new AuthenticationError('Authorization header missing or invalid')
  }

  // Verify Firebase ID token
  const token = authHeader.substring(7)
  const decodedToken = await verifyIdToken(token)

  if (!decodedToken) {
    await auditLog('api_authentication_invalid_token', {
      ip,
      userAgent,
      timestamp,
      endpoint: request.nextUrl.pathname
    })
    throw new AuthenticationError('Invalid or expired token')
  }

  // Fetch user profile
  const userDoc = await getDoc(doc(db, 'users', decodedToken.uid))
  if (!userDoc.exists()) {
    await auditLog('api_authentication_user_not_found', {
      userId: decodedToken.uid,
      ip,
      userAgent,
      timestamp,
      endpoint: request.nextUrl.pathname
    })
    throw new AuthenticationError('User profile not found')
  }

  const user = userDoc.data() as UserProfile

  return {
    user,
    userRole: user.role,
    ip,
    userAgent,
    timestamp
  }
}

/**
 * Role-based authorization validation
 */
export function validateAuthorization(
  context: ValidationContext,
  requiredRole: AppRole,
  resourceOwnerId?: string
): void {
  if (!context.user || !context.userRole) {
    throw new AuthorizationError('User context missing')
  }

  // Check if user owns the resource (for resource-specific access)
  if (resourceOwnerId && context.user.uid === resourceOwnerId) {
    return // Owner has access
  }

  // Check role hierarchy
  const userLevel = ROLE_HIERARCHY[context.userRole]
  const requiredLevel = ROLE_HIERARCHY[requiredRole]

  if (userLevel < requiredLevel) {
    auditLog('api_authorization_insufficient_permissions', {
      userId: context.user.uid,
      userRole: context.userRole,
      requiredRole,
      resourceOwnerId,
      endpoint: 'unknown',
      timestamp: context.timestamp
    })
    throw new AuthorizationError(`Role '${context.userRole}' insufficient. Required: '${requiredRole}' or higher`)
  }
}

/**
 * Input validation schemas
 */
export const ValidationSchemas = {
  // User data validation
  userProfile: {
    uid: { type: 'string', required: true, minLength: 1 },
    email: { type: 'email', required: true },
    displayName: { type: 'string', required: false, maxLength: 100 },
    role: { type: 'enum', values: ['guest', 'user', 'athlete', 'creator', 'coach', 'assistant', 'admin', 'superadmin'], required: true }
  },

  // Content validation
  contentItem: {
    title: { type: 'string', required: true, minLength: 1, maxLength: 200 },
    description: { type: 'string', required: true, minLength: 1, maxLength: 2000 },
    sport: { type: 'string', required: true, minLength: 1 },
    type: { type: 'enum', values: ['video', 'article', 'lesson', 'drill'], required: true },
    tags: { type: 'array', itemType: 'string', maxItems: 10 }
  },

  // File upload validation
  fileUpload: {
    filename: { type: 'string', required: true, minLength: 1, maxLength: 255 },
    contentType: { type: 'string', required: true },
    size: { type: 'number', required: true, min: 1 }
  },

  // Video upload validation
  videoUpload: {
    videoId: { type: 'string', required: true, minLength: 1 },
    filename: { type: 'string', required: true, pattern: /^[a-zA-Z0-9._-]+\.(mp4|webm|mov|avi|mkv)$/i },
    size: { type: 'number', required: true, min: 1, max: REQUEST_LIMITS.FILE_UPLOAD },
    contentType: { type: 'string', required: true, pattern: /^video\// }
  },

  // Image upload validation
  imageUpload: {
    filename: { type: 'string', required: true, pattern: /^[a-zA-Z0-9._-]+\.(jpg|jpeg|png|gif|webp|svg)$/i },
    size: { type: 'number', required: true, min: 1, max: REQUEST_LIMITS.IMAGE_UPLOAD },
    contentType: { type: 'string', required: true, pattern: /^image\// }
  }
} as const

/**
 * Validate data against schema
 */
export function validateData(data: any, schema: Record<string, any>): void {
  const errors: string[] = []

  for (const [field, rules] of Object.entries(schema)) {
    const value = data[field]

    // Check required fields
    if (rules.required && (value === undefined || value === null || value === '')) {
      errors.push(`Field '${field}' is required`)
      continue
    }

    // Skip validation if field is not required and not provided
    if (!rules.required && (value === undefined || value === null)) {
      continue
    }

    // Type validation
    switch (rules.type) {
      case 'string':
        if (typeof value !== 'string') {
          errors.push(`Field '${field}' must be a string`)
          continue
        }
        if (rules.minLength && value.length < rules.minLength) {
          errors.push(`Field '${field}' must be at least ${rules.minLength} characters`)
        }
        if (rules.maxLength && value.length > rules.maxLength) {
          errors.push(`Field '${field}' must be at most ${rules.maxLength} characters`)
        }
        if (rules.pattern && !rules.pattern.test(value)) {
          errors.push(`Field '${field}' format is invalid`)
        }
        break

      case 'email':
        if (typeof value !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          errors.push(`Field '${field}' must be a valid email address`)
        }
        break

      case 'number':
        if (typeof value !== 'number' || isNaN(value)) {
          errors.push(`Field '${field}' must be a number`)
          continue
        }
        if (rules.min !== undefined && value < rules.min) {
          errors.push(`Field '${field}' must be at least ${rules.min}`)
        }
        if (rules.max !== undefined && value > rules.max) {
          errors.push(`Field '${field}' must be at most ${rules.max}`)
        }
        break

      case 'enum':
        if (!rules.values.includes(value)) {
          errors.push(`Field '${field}' must be one of: ${rules.values.join(', ')}`)
        }
        break

      case 'array':
        if (!Array.isArray(value)) {
          errors.push(`Field '${field}' must be an array`)
          continue
        }
        if (rules.maxItems && value.length > rules.maxItems) {
          errors.push(`Field '${field}' must have at most ${rules.maxItems} items`)
        }
        if (rules.itemType) {
          value.forEach((item, index) => {
            if (rules.itemType === 'string' && typeof item !== 'string') {
              errors.push(`Field '${field}[${index}]' must be a string`)
            }
          })
        }
        break
    }
  }

  if (errors.length > 0) {
    throw new ValidationError(
      `Validation failed: ${errors.join('; ')}`,
      'VALIDATION_FAILED',
      400
    )
  }
}

/**
 * Rate limiting validation
 */
export function validateRateLimit(
  context: ValidationContext,
  action: string,
  limit: number,
  windowMs: number
): void {
  // This would integrate with a rate limiting store (Redis, etc.)
  // For now, just log the attempt
  auditLog('api_rate_limit_check', {
    userId: context.user?.uid,
    action,
    limit,
    windowMs,
    timestamp: context.timestamp
  })
}

/**
 * Request size validation
 */
export function validateRequestSize(request: NextRequest, maxSize: number): void {
  const contentLength = request.headers.get('content-length')
  if (contentLength && parseInt(contentLength) > maxSize) {
    throw new ValidationError(
      `Request size exceeds limit of ${maxSize} bytes`,
      'REQUEST_TOO_LARGE',
      413
    )
  }
}

/**
 * File upload validation
 */
export function validateFileUpload(
  file: { filename: string; size: number; contentType: string },
  allowedTypes: string[],
  maxSize: number
): void {
  // Validate file type
  if (!allowedTypes.some(type => file.contentType.startsWith(type))) {
    throw new ValidationError(
      `File type '${file.contentType}' not allowed. Allowed types: ${allowedTypes.join(', ')}`,
      'INVALID_FILE_TYPE',
      400,
      'contentType'
    )
  }

  // Validate file size
  if (file.size > maxSize) {
    throw new ValidationError(
      `File size ${file.size} bytes exceeds limit of ${maxSize} bytes`,
      'FILE_TOO_LARGE',
      400,
      'size'
    )
  }

  // Validate filename
  if (!/^[a-zA-Z0-9._-]+$/.test(file.filename)) {
    throw new ValidationError(
      'Filename contains invalid characters. Only alphanumeric, dots, underscores, and hyphens allowed.',
      'INVALID_FILENAME',
      400,
      'filename'
    )
  }

  // Check for dangerous file extensions
  const dangerousExtensions = /\.(exe|bat|cmd|scr|com|pif|vbs|js|jar|sh|php|asp|jsp)$/i
  if (dangerousExtensions.test(file.filename)) {
    throw new ValidationError(
      'File type not allowed for security reasons',
      'DANGEROUS_FILE_TYPE',
      400,
      'filename'
    )
  }
}

/**
 * Comprehensive request validation middleware
 */
export async function validateRequest(
  request: NextRequest,
  options: {
    requireAuth?: boolean
    requiredRole?: AppRole
    resourceOwnerId?: string
    maxRequestSize?: number
    validation?: {
      body?: any
      params?: any
    }
  } = {}
): Promise<ValidationContext> {
  try {
    // Validate request size
    if (options.maxRequestSize) {
      validateRequestSize(request, options.maxRequestSize)
    }

    // Validate authentication if required
    let context: ValidationContext = { timestamp: new Date().toISOString() }

    if (options.requireAuth) {
      context = await validateAuthentication(request)
    }

    // Validate authorization if required
    if (options.requiredRole && context.user) {
      validateAuthorization(context, options.requiredRole, options.resourceOwnerId)
    }

    // Validate request body if schema provided
    if (options.validation?.body) {
      const body = await request.json()
      validateData(body, options.validation.body)
    }

    return context
  } catch (error) {
    // Log validation failures
    await auditLog('api_validation_failure', {
      error: error instanceof Error ? error.message : 'Unknown error',
      endpoint: request.nextUrl.pathname,
      method: request.method,
      timestamp: new Date().toISOString()
    })
    throw error
  }
}

/**
 * Simple email validation
 * Uses the same regex as validateData for consistency
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return typeof email === 'string' && emailRegex.test(email)
}

/**
 * Simple role validation
 * Reuses role values from ValidationSchemas for single source of truth
 */
export function validateRole(role: string): boolean {
  const validRoles = ValidationSchemas.userProfile.role.values as readonly string[]
  return validRoles.includes(role)
}

/**
 * Error response formatter
 */
export function formatErrorResponse(error: unknown): NextResponse {
  if (error instanceof ValidationError) {
    return NextResponse.json({
      success: false,
      error: {
        message: error.message,
        code: error.code,
        field: error.field,
        statusCode: error.statusCode,
        timestamp: new Date().toISOString()
      }
    }, { status: error.statusCode })
  }

  if (error instanceof AuthenticationError) {
    return NextResponse.json({
      success: false,
      error: {
        message: error.message,
        code: 'AUTHENTICATION_FAILED',
        statusCode: error.statusCode,
        timestamp: new Date().toISOString()
      }
    }, { status: error.statusCode })
  }

  if (error instanceof AuthorizationError) {
    return NextResponse.json({
      success: false,
      error: {
        message: error.message,
        code: 'AUTHORIZATION_FAILED',
        statusCode: error.statusCode,
        timestamp: new Date().toISOString()
      }
    }, { status: error.statusCode })
  }

  // Generic error response
  console.error('Unhandled API error:', error)
  return NextResponse.json({
    success: false,
    error: {
      message: 'Internal server error',
      code: 'INTERNAL_ERROR',
      statusCode: 500,
      timestamp: new Date().toISOString()
    }
  }, { status: 500 })
}

export default {
  validateRequest,
  validateAuthentication,
  validateAuthorization,
  validateData,
  validateFileUpload,
  validateEmail,
  validateRole,
  ValidationSchemas,
  formatErrorResponse,
  ValidationError,
  AuthenticationError,
  AuthorizationError
}