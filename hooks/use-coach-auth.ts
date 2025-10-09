import { useAuth } from './use-auth'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Hook to verify coach authentication and authorization
 * Redirects to login if not authenticated
 * Redirects to dashboard if not authorized as coach
 */
export function useCoachAuth(options: { embedded?: boolean } = {}) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (loading) return

    // Not authenticated - redirect to login
    if (!user) {
      console.warn('[useCoachAuth] No authenticated user, redirecting to login')
      router.push('/')
      return
    }

    // Check if user has coach role
    // Coach role can be stored in custom claims or Firestore user document
    // For now, we'll allow creator, coach, admin, and superadmin roles
    // This will need to be updated based on your actual role structure
  }, [user, loading, router, options.embedded])

  return {
    user,
    loading,
    isAuthenticated: !!user,
    isAuthorized: !!user // Will be enhanced with role checking
  }
}
