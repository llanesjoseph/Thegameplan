/**
 * Analytics Service - Comprehensive tracking for app health and user behavior
 *
 * Tracks:
 * 1. API & Server Health (errors, latency, throughput)
 * 2. Business & User Logic (auth, core actions)
 * 3. Bug Reporter Health (form funnel)
 * 4. Time on Page
 */

import { db } from '@/lib/firebase.client'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'

// ============================================================================
// TYPES
// ============================================================================

type EventCategory =
  | 'api_health'
  | 'user_auth'
  | 'business_action'
  | 'bug_reporter'
  | 'page_tracking'
  | 'error'

interface AnalyticsEvent {
  category: EventCategory
  action: string
  label?: string
  value?: number
  metadata?: Record<string, any>
  timestamp: Date
  sessionId?: string
  userId?: string
  userAgent?: string
  page?: string
}

interface APIHealthMetric {
  endpoint: string
  method: string
  statusCode: number
  responseTime: number
  success: boolean
  errorMessage?: string
}

interface PageTimeMetric {
  page: string
  timeSpent: number // in seconds
  scrollDepth: number // percentage
  interactions: number
}

// ============================================================================
// SESSION MANAGEMENT
// ============================================================================

let currentSessionId: string | null = null

function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return 'server-session'

  if (!currentSessionId) {
    currentSessionId = sessionStorage.getItem('analytics_session_id')
    if (!currentSessionId) {
      currentSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      sessionStorage.setItem('analytics_session_id', currentSessionId)
    }
  }
  return currentSessionId
}

// ============================================================================
// CORE TRACKING FUNCTIONS
// ============================================================================

/**
 * Track any analytics event
 */
export async function trackEvent(event: Omit<AnalyticsEvent, 'timestamp' | 'sessionId'>): Promise<void> {
  try {
    const fullEvent: AnalyticsEvent = {
      ...event,
      timestamp: new Date(),
      sessionId: getOrCreateSessionId(),
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
      page: typeof window !== 'undefined' ? window.location.pathname : undefined
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Analytics Event:', fullEvent)
    }

    // Send to Firestore
    await addDoc(collection(db, 'analytics_events'), {
      ...fullEvent,
      timestamp: serverTimestamp()
    })
  } catch (error) {
    console.error('Failed to track event:', error)
    // Don't throw - analytics should never break the app
  }
}

// ============================================================================
// 1. API & SERVER HEALTH METRICS
// ============================================================================

/**
 * Track API response (call this in API routes)
 */
export async function trackAPIResponse(metric: APIHealthMetric): Promise<void> {
  await trackEvent({
    category: 'api_health',
    action: 'api_response',
    label: `${metric.method} ${metric.endpoint}`,
    value: metric.responseTime,
    metadata: {
      statusCode: metric.statusCode,
      success: metric.success,
      errorMessage: metric.errorMessage,
      endpoint: metric.endpoint,
      method: metric.method
    }
  })
}

/**
 * Track server error (5xx)
 */
export async function trackServerError(endpoint: string, statusCode: number, error: string): Promise<void> {
  await trackEvent({
    category: 'error',
    action: 'server_error',
    label: endpoint,
    value: statusCode,
    metadata: {
      statusCode,
      error,
      severity: 'critical'
    }
  })
}

/**
 * Track client error (4xx)
 */
export async function trackClientError(endpoint: string, statusCode: number, error: string): Promise<void> {
  await trackEvent({
    category: 'error',
    action: 'client_error',
    label: endpoint,
    value: statusCode,
    metadata: {
      statusCode,
      error,
      severity: 'warning'
    }
  })
}

// ============================================================================
// 2. BUSINESS & USER LOGIC METRICS
// ============================================================================

/**
 * Track user authentication events
 */
export async function trackAuth(action: 'login_success' | 'login_failure' | 'signup_success' | 'password_reset', userId?: string, metadata?: Record<string, any>): Promise<void> {
  await trackEvent({
    category: 'user_auth',
    action: `user.${action}`,
    userId,
    metadata
  })
}

/**
 * Track core business actions (customize for your app)
 */
export async function trackBusinessAction(action: string, userId?: string, metadata?: Record<string, any>): Promise<void> {
  await trackEvent({
    category: 'business_action',
    action,
    userId,
    metadata
  })
}

// Example business action helpers
export const BusinessActions = {
  videoSubmitted: (userId: string, metadata?: Record<string, any>) =>
    trackBusinessAction('video.submitted', userId, metadata),

  lessonCompleted: (userId: string, lessonId: string) =>
    trackBusinessAction('lesson.completed', userId, { lessonId }),

  reviewPublished: (coachId: string, submissionId: string) =>
    trackBusinessAction('review.published', coachId, { submissionId }),

  messagesSent: (userId: string, recipientId: string) =>
    trackBusinessAction('message.sent', userId, { recipientId }),

  coachFollowed: (userId: string, coachId: string) =>
    trackBusinessAction('coach.followed', userId, { coachId })
}

// ============================================================================
// 3. BUG REPORTER HEALTH METRICS
// ============================================================================

/**
 * Track bug reporter form funnel
 */
export async function trackBugReporter(action: 'form_viewed' | 'form_started' | 'form_submitted' | 'form_failed', userId?: string, metadata?: Record<string, any>): Promise<void> {
  await trackEvent({
    category: 'bug_reporter',
    action: `bug_reporter.${action}`,
    userId,
    metadata
  })
}

// ============================================================================
// 4. TIME ON PAGE TRACKING
// ============================================================================

class PageTimeTracker {
  private startTime: number = 0
  private interactions: number = 0
  private maxScrollDepth: number = 0
  private isTracking: boolean = false

  start() {
    if (typeof window === 'undefined' || this.isTracking) return

    this.startTime = Date.now()
    this.interactions = 0
    this.maxScrollDepth = 0
    this.isTracking = true

    // Track scroll depth
    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight
      const scrolled = window.scrollY
      const scrollDepth = scrollHeight > 0 ? Math.round((scrolled / scrollHeight) * 100) : 0
      this.maxScrollDepth = Math.max(this.maxScrollDepth, scrollDepth)
    }

    // Track interactions
    const handleInteraction = () => {
      this.interactions++
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('click', handleInteraction)
    window.addEventListener('keydown', handleInteraction)

    // Cleanup and send on page unload
    const cleanup = () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('click', handleInteraction)
      window.removeEventListener('keydown', handleInteraction)
      this.send()
    }

    window.addEventListener('beforeunload', cleanup)

    // Store cleanup for later
    ;(window as any).__pageTimeTrackerCleanup = cleanup
  }

  send() {
    if (!this.isTracking) return

    const timeSpent = Math.round((Date.now() - this.startTime) / 1000) // Convert to seconds

    trackEvent({
      category: 'page_tracking',
      action: 'page_time',
      label: window.location.pathname,
      value: timeSpent,
      metadata: {
        scrollDepth: this.maxScrollDepth,
        interactions: this.interactions,
        page: window.location.pathname
      }
    })

    this.isTracking = false
  }

  stop() {
    if (typeof window !== 'undefined' && (window as any).__pageTimeTrackerCleanup) {
      ;(window as any).__pageTimeTrackerCleanup()
    }
  }
}

// Create singleton instance
export const pageTimeTracker = new PageTimeTracker()

// ============================================================================
// PERFORMANCE MONITORING
// ============================================================================

/**
 * Track page load performance
 */
export function trackPagePerformance() {
  if (typeof window === 'undefined') return

  window.addEventListener('load', () => {
    setTimeout(() => {
      const perfData = window.performance.timing
      const loadTime = perfData.loadEventEnd - perfData.navigationStart
      const domReady = perfData.domContentLoadedEventEnd - perfData.navigationStart
      const firstPaint = perfData.responseStart - perfData.navigationStart

      trackEvent({
        category: 'page_tracking',
        action: 'page_load',
        label: window.location.pathname,
        value: loadTime,
        metadata: {
          loadTime,
          domReady,
          firstPaint,
          page: window.location.pathname
        }
      })
    }, 0)
  })
}

// ============================================================================
// ERROR TRACKING
// ============================================================================

/**
 * Track JavaScript errors
 */
export function setupErrorTracking() {
  if (typeof window === 'undefined') return

  window.addEventListener('error', (event) => {
    trackEvent({
      category: 'error',
      action: 'javascript_error',
      label: event.message,
      metadata: {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack
      }
    })
  })

  window.addEventListener('unhandledrejection', (event) => {
    trackEvent({
      category: 'error',
      action: 'unhandled_promise_rejection',
      label: event.reason?.toString() || 'Unknown error',
      metadata: {
        reason: event.reason?.toString(),
        promise: event.promise
      }
    })
  })
}
