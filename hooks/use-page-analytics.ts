/**
 * React Hook for Page Analytics
 *
 * Automatically tracks:
 * - Time on page
 * - Scroll depth
 * - User interactions
 * - Page load performance
 *
 * Usage: Add to any page component
 * usePageAnalytics()
 */

'use client'

import { useEffect } from 'react'
import { pageTimeTracker, trackPagePerformance, setupErrorTracking } from '@/lib/analytics-service'

/**
 * Hook to track page analytics
 * Call this at the top of any page component
 */
export function usePageAnalytics() {
  useEffect(() => {
    // Start tracking time on page
    pageTimeTracker.start()

    // Track page load performance (only runs once per page load)
    if (typeof window !== 'undefined' && !(window as any).__performanceTracked) {
      trackPagePerformance()
      ;(window as any).__performanceTracked = true
    }

    // Setup error tracking (only runs once)
    if (typeof window !== 'undefined' && !(window as any).__errorTrackingSetup) {
      setupErrorTracking()
      ;(window as any).__errorTrackingSetup = true
    }

    // Cleanup on unmount
    return () => {
      pageTimeTracker.stop()
    }
  }, [])
}

/**
 * Example usage in a page:
 *
 * export default function MyPage() {
 *   usePageAnalytics()
 *
 *   return <div>My Page Content</div>
 * }
 */
