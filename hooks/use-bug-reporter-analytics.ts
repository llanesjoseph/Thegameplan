/**
 * Bug Reporter Analytics Hook
 *
 * Tracks bug reporter form funnel:
 * - Form viewed
 * - Form started (user typed something)
 * - Form submitted
 * - Form failed
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { trackBugReporter } from '@/lib/analytics-service'
import { useAuth } from './use-auth'

export function useBugReporterAnalytics() {
  const { user } = useAuth()
  const [formViewed, setFormViewed] = useState(false)
  const [formStarted, setFormStarted] = useState(false)

  /**
   * Call when bug reporter form is opened
   */
  const trackFormViewed = useCallback(() => {
    if (!formViewed) {
      trackBugReporter('form_viewed', user?.uid)
      setFormViewed(true)
    }
  }, [formViewed, user?.uid])

  /**
   * Call when user starts typing in any form field
   */
  const trackFormStarted = useCallback(() => {
    if (!formStarted) {
      trackBugReporter('form_started', user?.uid)
      setFormStarted(true)
    }
  }, [formStarted, user?.uid])

  /**
   * Call when form is successfully submitted
   */
  const trackFormSubmitted = useCallback((metadata?: Record<string, any>) => {
    trackBugReporter('form_submitted', user?.uid, metadata)
  }, [user?.uid])

  /**
   * Call when form submission fails
   */
  const trackFormFailed = useCallback((error: string) => {
    trackBugReporter('form_failed', user?.uid, { error })
  }, [user?.uid])

  return {
    trackFormViewed,
    trackFormStarted,
    trackFormSubmitted,
    trackFormFailed
  }
}

/**
 * Example usage in BugReporter component:
 *
 * const { trackFormViewed, trackFormStarted, trackFormSubmitted, trackFormFailed } = useBugReporterAnalytics()
 *
 * useEffect(() => {
 *   if (isOpen) {
 *     trackFormViewed()
 *   }
 * }, [isOpen])
 *
 * <input
 *   onChange={(e) => {
 *     trackFormStarted()
 *     // your onChange logic
 *   }}
 * />
 *
 * const handleSubmit = async () => {
 *   try {
 *     await submitBugReport(data)
 *     trackFormSubmitted({ category: data.category })
 *   } catch (error) {
 *     trackFormFailed(error.message)
 *   }
 * }
 */
