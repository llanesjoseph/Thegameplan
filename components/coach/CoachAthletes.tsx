'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { getDownloadURL, ref } from 'firebase/storage'
import { storage } from '@/lib/firebase.client'

type Athlete = { id: string; name: string; imageUrl?: string }

export default function CoachAthletes() {
  const router = useRouter()
  const { user } = useAuth()
  const [athletes, setAthletes] = useState<Athlete[]>([])

  useEffect(() => {
    const load = async () => {
      if (!user?.uid) return
      try {
        const token = await user.getIdToken()
        const res = await fetch('/api/coach/athletes', {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (res.ok) {
          const data = await res.json()
          let list: Athlete[] =
            data?.athletes?.map((a: any) => {
              const raw =
                a.photoURL || a.photoUrl || a.profileImageUrl || a.avatarUrl || a.imageUrl || ''
              return {
                id: a.id || a.uid,
                name: a.displayName || a.name || 'Athlete',
                imageUrl: raw
              }
            }) || []

          // Resolve any storage paths
          list = await Promise.all(
            list.slice(0, 6).map(async (ath) => {
              const isHttp = /^https?:\/\//i.test(ath.imageUrl || '')
              if (ath.imageUrl && !isHttp) {
                try {
                  const url = await getDownloadURL(ref(storage, ath.imageUrl))
                  return { ...ath, imageUrl: url }
                } catch {
                  return ath
                }
              }
              return ath
            })
          )

          setAthletes(list)
        }
      } catch (e) {
        console.warn('Failed to load athletes', e)
      }
    }
    load()
  }, [user])

  return (
    <div>
      <h2
        className="text-xl font-bold mb-2"
        style={{ color: '#000000', fontFamily: '\"Open Sans\", sans-serif', fontWeight: 700 }}
      >
        Your Athletes
      </h2>

      <div className="flex flex-wrap gap-4">
        {athletes.map((a) => (
          <button
            key={a.id}
            onClick={() => router.push('/dashboard/coach/athletes')}
            className="text-left w-44 md:w-48 lg:w-56"
          >
            <div className="w-full aspect-square rounded-lg overflow-hidden bg-gray-100 mb-1">
              {a.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={a.imageUrl} alt={a.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-white flex items-center justify-center">
                  <img src="/new-logo.png" alt="AthLeap" className="w-1/2 opacity-60" />
                </div>
              )}
            </div>
            <p className="text-sm font-semibold" style={{ color: '#000000', fontFamily: '\"Open Sans\", sans-serif' }}>
              {a.name}
            </p>
            <p className="text-xs" style={{ color: '#666', fontFamily: '\"Open Sans\", sans-serif' }}>
              View profile
            </p>
          </button>
        ))}
        {athletes.length === 0 && (
          <div className="text-sm text-gray-500">No assigned athletes yet.</div>
        )}
      </div>
    </div>
  )
}


