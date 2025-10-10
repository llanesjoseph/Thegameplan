import { useEffect, useState, useRef, useMemo } from 'react'
import { auth } from '@/lib/firebase.client'
import { onAuthStateChanged, User } from 'firebase/auth'
import { useRole } from './use-role'
import { initializeUserDocument } from '@/lib/user-initialization'
import { useAppStore } from '@/lib/store'
import type { AppRole } from '@/types/user'
import { autoProvisionSuperadmin, isSuperadminEmail } from '@/lib/auto-superadmin-setup'
import { isKnownCoach, getKnownCoachRole } from '@/lib/coach-role-mapping'

interface EnhancedUser extends User {
  role?: AppRole
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const initializedUsersRef = useRef<Set<string>>(new Set())
  const { role, loading: roleLoading } = useRole()
  const { setFirebaseUser } = useAppStore()

  // Add timeout to prevent infinite loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading || roleLoading) {
        console.warn('Auth loading timeout - forcing auth state to resolve')
        setLoading(false)
      }
    }, 5000) // 5 second timeout

    return () => clearTimeout(timeout)
  }, [loading, roleLoading])

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Only initialize user document once per user session
        if (!initializedUsersRef.current.has(user.uid)) {
          try {
            // Check if this is a predefined superadmin user
            const email = user.email
            if (email && isSuperadminEmail(email)) {
              const provisionResult = await autoProvisionSuperadmin(user.uid, email, user.displayName || undefined)
              // Reduced logging - only log if not already set up
              if (!provisionResult) {
                console.log(`⚙️ Setting up superadmin: ${email}`)
              }
            } else if (email && isKnownCoach(email)) {
              // Check if this is a known coach who should have coach role
              const correctRole = getKnownCoachRole(email)
              await initializeUserDocument(user, correctRole || 'coach')
            } else {
              // Initialize regular user document with coach role for dashboard access
              await initializeUserDocument(user, 'coach') // Default to coach for dashboard access
            }

            // Mark this user as initialized to prevent repeated calls
            initializedUsersRef.current.add(user.uid)
          } catch (error) {
            console.warn('Failed to initialize user document:', error)
            // Continue anyway - user can still use the app with limited functionality
          }
        }
      } else {
        // Clear initialized users when user logs out
        initializedUsersRef.current.clear()
      }
      setUser(user)
      setFirebaseUser(user)
      setLoading(false)
    })
    return () => unsub()
  }, [setFirebaseUser])

  // Create enhanced user object with role - memoized to prevent infinite loops
  const enhancedUser = useMemo(() => {
    // Reduced logging to prevent console spam during sign-in
    // if (user && role) {
    //   console.log('✅ useAuth: User authenticated with role:', {
    //     uid: user.uid,
    //     email: user.email,
    //     role: role
    //   })
    // }
    return user ? { ...user, role } as EnhancedUser : null
  }, [user, role])

  return {
    user: enhancedUser,
    loading: loading || roleLoading
  }
}
