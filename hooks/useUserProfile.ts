import { useEffect, useState } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase.client'
import type { UserProfile } from '@/types/user'

export function useUserProfile(uid: string | null | undefined) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!uid) {
      setUser(null)
      setLoading(false)
      return
    }

    setLoading(true)
    const ref = doc(db, 'users', uid)
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        setUser(snap.data() as UserProfile)
        setError(null)
      } else {
        setUser(null)
        setError(new Error('User profile not found'))
      }
      setLoading(false)
    }, (err) => {
      setError(err instanceof Error ? err : new Error('Unknown error'))
      setLoading(false)
    })

    return () => unsub()
  }, [uid])

  return { user, loading, error }
}


