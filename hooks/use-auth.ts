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
              // Initialize regular user document - DO NOT auto-assign a role
              // Let the user document initialization handle role assignment
              await initializeUserDocument(user, 'athlete') // Default to athlete (most common user type)
            }

            // Mark this user as initialized to prevent repeated calls
            initializedUsersRef.current.add(user.uid)
            
            // Check for account adoption (jasmineathleap@gmail.com -> lv255@cornell.edu)
            try {
              const token = await user.getIdToken()
              const email = user.email?.toLowerCase() || ''
              
              // Check if this email needs account adoption
              if (email === 'jasmineathleap@gmail.com') {
                console.log('🔄 Checking for account adoption...')
                fetch('/api/user/adopt-account', {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${token}`
                  }
                }).then(async (response) => {
                  if (response.ok) {
                    const data = await response.json()
                    if (data.success && !data.alreadyAdopted) {
                      console.log('✅ Account adoption completed:', data.message)
                      // Reload the page to reflect the new account data
                      window.location.reload()
                    } else if (data.alreadyAdopted) {
                      console.log('ℹ️ Account already adopted')
                    }
                  }
                }).catch(err => {
                  console.warn('Account adoption check failed (non-critical):', err)
                })
              }
            } catch (error) {
              // Silently fail - account adoption check is not critical
              console.warn('Could not check account adoption:', error)
            }

            // Check for baked profile transfer (server-side only, non-blocking)
            try {
              const token = await user.getIdToken()
              fetch('/api/user/check-baked-profile', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              }).catch(err => {
                console.warn('Baked profile check failed (non-critical):', err)
              })
            } catch (error) {
              // Silently fail - baked profile check is not critical
              console.warn('Could not check baked profile:', error)
            }
          } catch (error) {
            console.warn('Failed to initialize user document:', error)
            // Continue anyway - user can still use the app with limited functionality
          }
        }

        // Track user activity (lastLoginAt) - do in background
        try {
          const token = await user.getIdToken()
          fetch('/api/track-activity', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }).catch(err => {
            console.warn('Activity tracking failed (non-critical):', err)
          })
        } catch (error) {
          // Non-critical error - don't block auth flow
          console.warn('Could not track activity:', error)
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
    if (!user) return null
    // Don't use spread operator - it destroys Firebase Auth User methods like getIdToken()
    const enhancedUser = user as EnhancedUser
    enhancedUser.role = role
    return enhancedUser
  }, [user, role])

  return {
    user: enhancedUser,
    loading: loading || roleLoading
  }
}
