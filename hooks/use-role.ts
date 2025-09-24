import { useEffect, useState } from 'react'
import { auth, db } from '@/lib/firebase.client'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import type { AppRole } from '@/types/user'

export function useRole() {
  const [role, setRole] = useState<AppRole>('guest')
  const [loading, setLoading] = useState(true)

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
          const userDoc = await getDoc(doc(db, 'users', user.uid))
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


