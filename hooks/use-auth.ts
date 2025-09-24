import { useEffect, useState } from 'react'
import { auth } from '@/lib/firebase.client'
import { onAuthStateChanged, User } from 'firebase/auth'
import { useRole } from './use-role'
import { initializeUserDocument } from '@/lib/user-initialization'
import { useAppStore } from '@/lib/store'
import type { AppRole } from '@/types/user'
import { autoProvisionSuperadmin, isSuperadminEmail } from '@/lib/auto-superadmin-setup'

interface EnhancedUser extends User {
  role?: AppRole
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [initializedUsers, setInitializedUsers] = useState<Set<string>>(new Set())
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
        if (!initializedUsers.has(user.uid)) {
          try {
            // Check if this is a predefined superadmin user
            const email = user.email
            if (email && isSuperadminEmail(email)) {
              console.log(`🔍 Detected superadmin user: ${email}`)
              const provisionResult = await autoProvisionSuperadmin(user.uid, email, user.displayName || undefined)
              if (provisionResult) {
                console.log(`✅ ${email} auto-provisioned as superadmin`)
              }
            } else {
              // Initialize regular user document to prevent permission errors
              await initializeUserDocument(user, 'user') // Default to user for production
              console.log('User document initialized successfully')
            }

            // Mark this user as initialized to prevent repeated calls
            setInitializedUsers(prev => new Set(prev).add(user.uid))
          } catch (error) {
            console.warn('Failed to initialize user document:', error)
            // Continue anyway - user can still use the app with limited functionality
          }
        }
      } else {
        // Clear initialized users when user logs out
        setInitializedUsers(new Set())
      }
      setUser(user)
      setFirebaseUser(user)
      setLoading(false)
    })
    return () => unsub()
  }, [])

  // Create enhanced user object with role
  const enhancedUser = user ? { ...user, role } as EnhancedUser : null

  return { 
    user: enhancedUser, 
    loading: loading || roleLoading 
  }
}
