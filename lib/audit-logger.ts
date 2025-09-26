/**
 * Comprehensive Audit Logging System
 * Tracks all security-sensitive operations across the platform
 */

import { db } from '@/lib/firebase.client'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'

export interface AuditLogEntry {
  eventType: string
  userId?: string
  data: Record<string, any>
  timestamp?: any
  severity?: 'low' | 'medium' | 'high' | 'critical'
  source?: string
}

/**
 * Log security and operational events for audit purposes
 */
export async function auditLog(
  eventType: string,
  data: Record<string, any>,
  options: {
    userId?: string
    severity?: 'low' | 'medium' | 'high' | 'critical'
    source?: string
  } = {}
): Promise<void> {
  try {
    const logEntry: AuditLogEntry = {
      eventType,
      userId: options.userId,
      data: {
        ...data,
        ip: data.ip ? sanitizeIP(data.ip) : undefined, // Hash IP for privacy
        userAgent: data.userAgent ? sanitizeUserAgent(data.userAgent) : undefined
      },
      timestamp: serverTimestamp(),
      severity: options.severity || getSeverityFromEventType(eventType),
      source: options.source || 'api'
    }

    // Store in Firestore audit collection
    await addDoc(collection(db, 'auditLogs'), logEntry)

    // For critical events, also log to console for immediate visibility
    if (logEntry.severity === 'critical') {
      console.error('🚨 CRITICAL AUDIT EVENT:', {
        eventType,
        userId: options.userId,
        timestamp: new Date().toISOString()
      })
    }

    // In production, you might also want to send to external logging service
    if (process.env.NODE_ENV === 'production') {
      await sendToExternalLogger(logEntry)
    }

  } catch (error) {
    // Fallback to console if Firestore fails
    console.error('Failed to write audit log:', error, {
      eventType,
      userId: options.userId,
      data
    })
  }
}

/**
 * Determine event severity based on event type
 */
function getSeverityFromEventType(eventType: string): 'low' | 'medium' | 'high' | 'critical' {
  const criticalEvents = [
    'unauthorized_admin_access',
    'data_breach_attempt',
    'suspicious_file_upload',
    'role_escalation_attempt'
  ]

  const highEvents = [
    'unauthorized_access',
    'invalid_token',
    'insufficient_permissions',
    'external_api_failure',
    'storage_access_denied'
  ]

  const mediumEvents = [
    'login_failure',
    'video_upload_unauthorized',
    'ai_api_rate_limit',
    'file_validation_failure'
  ]

  if (criticalEvents.some(event => eventType.includes(event))) return 'critical'
  if (highEvents.some(event => eventType.includes(event))) return 'high'
  if (mediumEvents.some(event => eventType.includes(event))) return 'medium'

  return 'low'
}

/**
 * Sanitize IP address for privacy compliance
 */
function sanitizeIP(ip: string): string {
  // Hash IP to maintain privacy while allowing pattern detection
  const crypto = require('crypto')
  return crypto.createHash('sha256').update(ip + process.env.IP_SALT || 'default-salt').digest('hex').substring(0, 16)
}

/**
 * Sanitize user agent string
 */
function sanitizeUserAgent(userAgent: string): string {
  // Remove potentially sensitive information while keeping browser/OS info
  return userAgent?.split('/')[0] || 'unknown'
}

/**
 * Send to external logging service (placeholder for production)
 */
async function sendToExternalLogger(logEntry: AuditLogEntry): Promise<void> {
  // In production, implement integration with services like:
  // - DataDog
  // - Splunk
  // - CloudWatch
  // - Sentry

  // For now, just console log in production
  if (logEntry.severity === 'critical' || logEntry.severity === 'high') {
    console.warn('External log:', JSON.stringify(logEntry, null, 2))
  }
}

/**
 * Query recent audit logs (admin only)
 */
export async function getRecentAuditLogs(
  limit: number = 100,
  severity?: 'low' | 'medium' | 'high' | 'critical'
): Promise<AuditLogEntry[]> {
  try {
    const { getDocs, query, orderBy, limit: limitTo, where } = await import('firebase/firestore')

    let q = query(
      collection(db, 'auditLogs'),
      orderBy('timestamp', 'desc'),
      limitTo(limit)
    )

    if (severity) {
      q = query(q, where('severity', '==', severity))
    }

    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp || new Date(),
      eventType: doc.data().eventType || 'unknown',
      data: doc.data().data || {}
    } as AuditLogEntry))
  } catch (error) {
    console.error('Failed to fetch audit logs:', error)
    return []
  }
}

/**
 * Log external API calls for audit purposes
 */
export async function auditExternalAPI(
  apiName: string,
  endpoint: string,
  method: string,
  userId?: string,
  responseStatus?: number,
  error?: string
): Promise<void> {
  await auditLog('external_api_call', {
    apiName,
    endpoint: sanitizeEndpoint(endpoint),
    method,
    responseStatus,
    error,
    timestamp: new Date().toISOString()
  }, {
    userId,
    severity: error ? 'high' : 'low',
    source: 'external_api'
  })
}

/**
 * Sanitize endpoint URLs to remove sensitive parameters
 */
function sanitizeEndpoint(endpoint: string): string {
  try {
    const url = new URL(endpoint)
    // Remove sensitive query parameters
    const sensitiveParams = ['api_key', 'token', 'secret', 'password']
    sensitiveParams.forEach(param => {
      if (url.searchParams.has(param)) {
        url.searchParams.set(param, '[REDACTED]')
      }
    })
    return url.toString()
  } catch {
    // If URL parsing fails, just return the original (likely a path)
    return endpoint
  }
}