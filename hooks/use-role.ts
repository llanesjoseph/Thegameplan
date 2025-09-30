import { useEffect, useState } from 'react'
import { auth, db } from '@/lib/firebase.client'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import type { AppRole } from '@/types/user'

export function useRole() {
  const [role, setRole] = useState<AppRole>('guest')
  const [loading, setLoading] = useState(true)

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

        // Single Source of Truth: users/{uid}.role
        try {
          // Add timeout to Firestore query
          const userDocPromise = getDoc(doc(db, 'users', user.uid))
          const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Firestore query timeout')), 10000)
          )

          const userDoc = await Promise.race([userDocPromise, timeoutPromise])
          if (userDoc.exists()) {
            const data = userDoc.data() as { role?: AppRole }
            setRole(data.role ?? 'user')
          } else {
            setRole('user')
          }
        } catch (firestoreError) {
          console.warn('Failed to fetch user role from Firestore:', firestoreError)
          // Default to 'user' role if Firestore fails
          setRole('user')
        }
      } catch (error) {
        console.error('Error in useRole:', error)
        setRole('user')
      } finally {
        setLoading(false)
      }
    })
    return () => unsub()
  }, [])

  return { role, loading }
}


