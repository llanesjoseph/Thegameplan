import { useEffect, useState } from 'react'
import { auth } from '@/lib/firebase.client'
import { onAuthStateChanged } from 'firebase/auth'
import type { AppRole } from '@/types/user'

// Session storage for role caching (survives navigation)
const ROLE_CACHE_KEY = 'user_role_cache'
const ROLE_TIMESTAMP_KEY = 'user_role_timestamp'

export function useRole() {
  // Initialize from cache if available
  const getCachedRole = (): AppRole => {
    if (typeof window === 'undefined') return 'guest'
    try {
      const cached = sessionStorage.getItem(ROLE_CACHE_KEY)
      const timestamp = sessionStorage.getItem(ROLE_TIMESTAMP_KEY)
      
      // Cache valid for 5 minutes
      if (cached && timestamp) {
        const age = Date.now() - parseInt(timestamp)
        if (age < 5 * 60 * 1000) {
          console.log('✅ Using cached role:', cached)
          return cached as AppRole
        }
      }
    } catch {}
    return 'guest'
  }

  const [role, setRole] = useState<AppRole>(getCachedRole())
  const [loading, setLoading] = useState(true)

  // Add timeout to prevent infinite loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading) {
        console.warn('Role loading timeout - resolving with current role:', role)
        setLoading(false)
      }
    }, 5000)

    return () => clearTimeout(timeout)
  }, [loading, role])

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      try {
        if (!user) {
          setRole('guest')
          setLoading(false)
          if (typeof window !== 'undefined') {
            sessionStorage.removeItem(ROLE_CACHE_KEY)
            sessionStorage.removeItem(ROLE_TIMESTAMP_KEY)
          }
          return
        }

        // Fetch role from API
        try {
          const token = await user.getIdToken(true) // Force refresh
          const response = await fetch('/api/user/role', {
            headers: { 'Authorization': `Bearer ${token}` },
          })

          if (response.ok) {
            const data = await response.json()
            if (data.success) {
              const fetchedRole = data.data.role ?? 'user'
              console.log('✅ ROLE FETCHED:', fetchedRole, 'for', user.email)
              setRole(fetchedRole)
              
              // Cache the role
              if (typeof window !== 'undefined') {
                sessionStorage.setItem(ROLE_CACHE_KEY, fetchedRole)
                sessionStorage.setItem(ROLE_TIMESTAMP_KEY, Date.now().toString())
              }
            } else {
              console.warn('⚠️ API returned error, using cached or guest')
              const cached = getCachedRole()
              setRole(cached)
            }
          } else {
            console.warn('⚠️ Failed to fetch role, using cached or guest')
            const cached = getCachedRole()
            setRole(cached)
          }
        } catch (apiError) {
          console.error('❌ Role API error:', apiError)
          const cached = getCachedRole()
          setRole(cached)
        }
      } catch (error) {
        console.error('Error in useRole:', error)
        const cached = getCachedRole()
        setRole(cached)
      } finally {
        setLoading(false)
      }
    })
    
    return () => unsub()
  }, [])

  return { role, loading }
}
