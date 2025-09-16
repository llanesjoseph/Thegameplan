// Enterprise-grade monitoring and observability system

// Browser API type definitions
interface LayoutShift extends PerformanceEntry {
  value: number
  hadRecentInput: boolean
  sources: LayoutShiftAttribution[]
}

interface LayoutShiftAttribution {
  node?: Node
  previousRect: DOMRectReadOnly
  currentRect: DOMRectReadOnly
}

interface PerformanceEventTiming extends PerformanceEntry {
  target?: EventTarget
  element?: Element
  interactionId?: number
  cancelable?: boolean
  processingStart: number
  processingEnd: number
}

export interface PerformanceMetric {
  name: string
  value: number
  timestamp: Date
  userId?: string
  metadata?: Record<string, unknown>
}

export interface UserBehaviorEvent {
  event: string
  userId?: string
  timestamp: Date
  properties?: Record<string, unknown>
  sessionId?: string
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private metrics: PerformanceMetric[] = []
  private userId?: string
  private sessionId: string = this.generateSessionId()

  private constructor() {}

  public static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  public setUserId(userId: string): void {
    this.userId = userId
  }

  // Core Web Vitals monitoring
  public measureCLS(): void {
    if (typeof window === 'undefined') return

    let clsValue = 0
    const clsEntries: LayoutShift[] = []

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as LayoutShift[]) {
        if (!entry.hadRecentInput) {
          clsEntries.push(entry)
          clsValue += entry.value
        }
      }

      this.recordMetric('cumulative_layout_shift', clsValue, {
        entries: clsEntries.length
      })
    })

    observer.observe({ type: 'layout-shift', buffered: true })
  }

  public measureLCP(): void {
    if (typeof window === 'undefined') return

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      const lastEntry = entries[entries.length - 1] as PerformanceEventTiming

      this.recordMetric('largest_contentful_paint', lastEntry.startTime, {
        element: lastEntry.element?.tagName || 'unknown'
      })
    })

    observer.observe({ type: 'largest-contentful-paint', buffered: true })
  }

  public measureFID(): void {
    if (typeof window === 'undefined') return

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as PerformanceEventTiming[]) {
        this.recordMetric('first_input_delay', entry.processingStart - entry.startTime, {
          eventType: entry.name
        })
      }
    })

    observer.observe({ type: 'first-input', buffered: true })
  }

  // Custom performance metrics
  public startTimer(name: string): () => void {
    const startTime = performance.now()
    
    return () => {
      const duration = performance.now() - startTime
      this.recordMetric(`timer_${name}`, duration)
    }
  }

  public recordMetric(name: string, value: number, metadata?: Record<string, unknown>): void {
    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: new Date(),
      userId: this.userId,
      metadata: {
        sessionId: this.sessionId,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
        url: typeof window !== 'undefined' ? window.location.href : 'unknown',
        ...metadata
      }
    }

    this.metrics.push(metric)
    this.sendMetric(metric)
  }

  // Network performance monitoring
  public monitorFetch(): void {
    if (typeof window === 'undefined') return

    const originalFetch = window.fetch
    window.fetch = async (...args) => {
      const startTime = performance.now()
      const url = typeof args[0] === 'string' ? args[0] : (args[0] as Request).url
      
      try {
        const response = await originalFetch(...args)
        const duration = performance.now() - startTime
        
        this.recordMetric('api_request_duration', duration, {
          url,
          status: response.status,
          method: args[1]?.method || 'GET',
          success: response.ok
        })
        
        return response
      } catch (error) {
        const duration = performance.now() - startTime
        
        this.recordMetric('api_request_duration', duration, {
          url,
          method: args[1]?.method || 'GET',
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
        
        throw error
      }
    }
  }

  // React component performance monitoring
  public measureComponentRender(componentName: string, renderTime: number): void {
    this.recordMetric('component_render_time', renderTime, {
      component: componentName
    })
  }

  private sendMetric(metric: PerformanceMetric): void {
    // Send to analytics service
    if (process.env.NODE_ENV === 'development') {
      console.log('Performance metric:', metric)
    }

    // Store in localStorage for now (replace with real service)
    if (typeof window !== 'undefined') {
      try {
        const metrics = JSON.parse(localStorage.getItem('performance_metrics') || '[]')
        metrics.push(metric)
        // Keep only last 500 metrics
        localStorage.setItem('performance_metrics', JSON.stringify(metrics.slice(-500)))
      } catch (e) {
        console.warn('Failed to store performance metric:', e)
      }
    }
  }

  public getMetrics(): PerformanceMetric[] {
    return [...this.metrics]
  }

  public clearMetrics(): void {
    this.metrics = []
  }

  // Initialize all monitoring
  public initializeMonitoring(): void {
    if (typeof window === 'undefined') return

    this.measureCLS()
    this.measureLCP()
    this.measureFID()
    this.monitorFetch()

    // Monitor page load time
    window.addEventListener('load', () => {
      const loadTime = performance.now()
      this.recordMetric('page_load_time', loadTime)
    })

    // Monitor navigation
    this.recordMetric('page_view', 1, {
      page: window.location.pathname
    })
  }
}

// Structured application logger
type LogLevel = 'debug' | 'info' | 'warn' | 'error'

function ts(): string {
  return new Date().toISOString()
}

function base(level: LogLevel, msg: string, details?: Record<string, unknown>) {
  return {
    ts: ts(),
    level,
    msg,
    ...(details || {}),
  }
}

export const logger = {
  debug(message: string, details?: Record<string, unknown>) {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(JSON.stringify(base('debug', message, details)))
    }
  },
  info(message: string, details?: Record<string, unknown>) {
    console.info(JSON.stringify(base('info', message, details)))
  },
  warn(message: string, details?: Record<string, unknown>) {
    console.warn(JSON.stringify(base('warn', message, details)))
  },
  error(message: string, details?: Record<string, unknown>, err?: unknown) {
    const payload = base('error', message, {
      ...(details || {}),
      error: err instanceof Error ? { name: err.name, message: err.message, stack: err.stack } : err,
    })
    console.error(JSON.stringify(payload))
  },
}

// User behavior analytics
export class UserBehaviorTracker {
  private static instance: UserBehaviorTracker
  private events: UserBehaviorEvent[] = []
  private userId?: string
  private sessionId: string = this.generateSessionId()

  private constructor() {}

  public static getInstance(): UserBehaviorTracker {
    if (!UserBehaviorTracker.instance) {
      UserBehaviorTracker.instance = new UserBehaviorTracker()
    }
    return UserBehaviorTracker.instance
  }

  private generateSessionId(): string {
    return `behavior_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  public setUserId(userId: string): void {
    this.userId = userId
  }

  public trackEvent(event: string, properties?: Record<string, unknown>): void {
    const behaviorEvent: UserBehaviorEvent = {
      event,
      userId: this.userId,
      timestamp: new Date(),
      sessionId: this.sessionId,
      properties: {
        page: typeof window !== 'undefined' ? window.location.pathname : 'unknown',
        ...properties
      }
    }

    this.events.push(behaviorEvent)
    this.sendEvent(behaviorEvent)
  }

  // Pre-defined tracking methods
  public trackPageView(page: string): void {
    this.trackEvent('page_view', { page })
  }

  public trackClick(element: string, location?: string): void {
    this.trackEvent('click', { element, location })
  }

  public trackFormSubmission(form: string, success: boolean): void {
    this.trackEvent('form_submit', { form, success })
  }

  public trackVideoInteraction(action: 'play' | 'pause' | 'complete', videoId: string, progress?: number): void {
    this.trackEvent('video_interaction', { action, videoId, progress })
  }

  public trackSearchQuery(query: string, results: number): void {
    this.trackEvent('search', { query, results })
  }

  public trackFeatureUsage(feature: string, context?: Record<string, unknown>): void {
    this.trackEvent('feature_usage', { feature, ...context })
  }

  private sendEvent(event: UserBehaviorEvent): void {
    // Send to analytics service
    if (process.env.NODE_ENV === 'development') {
      console.log('User behavior event:', event)
    }

    // Store in localStorage for now (replace with real service)
    if (typeof window !== 'undefined') {
      try {
        const events = JSON.parse(localStorage.getItem('user_behavior_events') || '[]')
        events.push(event)
        // Keep only last 1000 events
        localStorage.setItem('user_behavior_events', JSON.stringify(events.slice(-1000)))
      } catch (e) {
        console.warn('Failed to store user behavior event:', e)
      }
    }
  }

  public getEvents(): UserBehaviorEvent[] {
    return [...this.events]
  }

  public clearEvents(): void {
    this.events = []
  }
}

// React hooks for monitoring
export function usePerformanceMonitoring() {
  const monitor = PerformanceMonitor.getInstance()

  const measureComponentRender = (componentName: string) => {
    const startTime = performance.now()
    
    return () => {
      const renderTime = performance.now() - startTime
      monitor.measureComponentRender(componentName, renderTime)
    }
  }

  const startTimer = (name: string) => monitor.startTimer(name)
  const recordMetric = (name: string, value: number, metadata?: Record<string, unknown>) => 
    monitor.recordMetric(name, value, metadata)

  return { measureComponentRender, startTimer, recordMetric }
}

export function useUserBehaviorTracking() {
  const tracker = UserBehaviorTracker.getInstance()

  return {
    trackEvent: tracker.trackEvent.bind(tracker),
    trackPageView: tracker.trackPageView.bind(tracker),
    trackClick: tracker.trackClick.bind(tracker),
    trackFormSubmission: tracker.trackFormSubmission.bind(tracker),
    trackVideoInteraction: tracker.trackVideoInteraction.bind(tracker),
    trackSearchQuery: tracker.trackSearchQuery.bind(tracker),
    trackFeatureUsage: tracker.trackFeatureUsage.bind(tracker)
  }
}

// Initialize monitoring on app start
export function initializeMonitoring(userId?: string): void {
  const performanceMonitor = PerformanceMonitor.getInstance()
  const behaviorTracker = UserBehaviorTracker.getInstance()

  if (userId) {
    performanceMonitor.setUserId(userId)
    behaviorTracker.setUserId(userId)
  }

  performanceMonitor.initializeMonitoring()
}

const Monitoring = {
  PerformanceMonitor,
  UserBehaviorTracker,
  usePerformanceMonitoring,
  useUserBehaviorTracking,
  initializeMonitoring
}

export default Monitoring