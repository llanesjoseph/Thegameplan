/**
 * AIRTIGHT: Hook to ensure baked profile adoption happens on every login
 * This hook automatically calls the adoption endpoint when user signs in
 */

import { useEffect, useRef } from 'react'
import { useAuth } from './use-auth'

export function useBakedProfileAdoption() {
  const { user } = useAuth()
  const adoptionAttemptedRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (!user || !user.email) return

    const userKey = `${user.uid}-${user.email}`
    
    // Only attempt adoption once per user session
    if (adoptionAttemptedRef.current.has(userKey)) {
      return
    }

    // Mark as attempted immediately to prevent duplicate calls
    adoptionAttemptedRef.current.add(userKey)

    // Call adoption endpoint with retry logic
    const attemptAdoption = async (retries = 3) => {
      for (let attempt = 1; attempt <= retries; attempt++) {
        try {
          const token = await user.getIdToken(true) // Force refresh token
          
          const response = await fetch('/api/user/adopt-baked-profile', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            // Don't include body - endpoint gets user from auth token
          })

          const data = await response.json()

          if (data?.success) {
            if (data.adopted) {
              console.log('✅ [BAKED-PROFILE] Successfully adopted baked profile')
              // Optionally reload page to show new profile
              if (data.bakedProfileId) {
                // Small delay to ensure all data is synced
                setTimeout(() => {
                  window.location.reload()
                }, 1000)
              }
            } else {
              console.log('[BAKED-PROFILE] No baked profile to adopt')
            }
            return // Success, exit retry loop
          } else {
            throw new Error(data?.error || 'Adoption failed')
          }
        } catch (error: any) {
          console.warn(`[BAKED-PROFILE] Adoption attempt ${attempt}/${retries} failed:`, error.message)
          
          if (attempt < retries) {
            // Wait before retry (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
          } else {
            console.error('[BAKED-PROFILE] All adoption attempts failed:', error)
            // Don't block user - they can still use the app
          }
        }
      }
    }

    // Small delay to ensure auth is fully settled
    const timeoutId = setTimeout(() => {
      attemptAdoption()
    }, 500)

    return () => {
      clearTimeout(timeoutId)
    }
  }, [user])
}

