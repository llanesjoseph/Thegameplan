import { useEffect, useState } from 'react'
import { auth } from '@/lib/firebase.client'
import { onAuthStateChanged } from 'firebase/auth'
import type { AppRole } from '@/types/user'

export function useRole() {
  const [role, setRole] = useState<AppRole>('guest')
  const [loading, setLoading] = useState(true)
  const [cached, setCached] = useState<AppRole | null>(null)

  // Add timeout to prevent infinite loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading) {
        console.warn('Role loading timeout - forcing role state to resolve')
        setLoading(false)
      }
    }, 5000) // 5 second timeout

    return () => clearTimeout(timeout)
  }, [loading])

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      try {
        if (!user) {
          setRole('guest')
          setLoading(false)
          return
        }

        // Single Source of Truth: users/{uid}.role via secure API
        try {
          const token = await user.getIdToken()
          const response = await fetch('/api/user/role', {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          })

          if (response.ok) {
            const data = await response.json()
            if (data.success) {
              const fetchedRole = data.data.role ?? 'user'
              setRole(fetchedRole)
              setCached(fetchedRole)
            } else {
              console.warn('⚠️ useRole: API returned error, keeping previous role')
              if (cached) setRole(cached)
              else setRole('guest')
            }
          } else {
            console.warn('⚠️ useRole: Failed to fetch role via API, keeping previous role')
            if (cached) setRole(cached)
            else setRole('guest')
          }
        } catch (apiError) {
          console.warn('❌ useRole: Failed to fetch user role via API:', apiError)
          if (cached) setRole(cached)
          else setRole('guest')
        }
      } catch (error) {
        console.error('Error in useRole:', error)
        if (cached) setRole(cached)
        else setRole('guest')
      } finally {
        setLoading(false)
      }
    })
    return () => unsub()
  }, [])

  return { role, loading }
}


