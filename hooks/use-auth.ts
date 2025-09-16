import { useEffect, useState } from 'react'
import { auth } from '@/lib/firebase.client'
import { onAuthStateChanged, User } from 'firebase/auth'
import { useRole } from './use-role'
import { initializeUserDocument } from '@/lib/user-initialization'
import { useAppStore } from '@/lib/store'
import type { AppRole } from '@/types/user'

interface EnhancedUser extends User {
  role?: AppRole
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const { role, loading: roleLoading } = useRole()
  const { setFirebaseUser } = useAppStore()

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Initialize user document to prevent permission errors
          await initializeUserDocument(user, 'user') // Default to user for production
          console.log('User document initialized successfully')
        } catch (error) {
          console.warn('Failed to initialize user document:', error)
          // Continue anyway - user can still use the app with limited functionality
        }
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
