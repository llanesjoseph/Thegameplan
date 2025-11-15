'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { getDownloadURL, ref } from 'firebase/storage'
import { storage } from '@/lib/firebase.client'

type Athlete = { id: string; name: string; imageUrl?: string }
type Metrics = {
  submissions: number
  videosAwaiting: number
  lastActivity?: string
  lessons?: number
  lessonsCompleted?: number
  lessonsUnfinished?: number
}

export default function CoachAthletes() {
  const { user } = useAuth()
  const [athletes, setAthletes] = useState<Athlete[]>([])
  const [openId, setOpenId] = useState<string | null>(null)
  const [metricsById, setMetricsById] = useState<Record<string, Metrics>>({})
  const [loadingMetrics, setLoadingMetrics] = useState<Record<string, boolean>>({})

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

  // Auto-close metrics after 5 seconds
  useEffect(() => {
    if (openId) {
      const timer = setTimeout(() => {
        setOpenId(null)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [openId])

  const toggleMetrics = async (athleteId: string) => {
    if (openId === athleteId) {
      setOpenId(null)
      return
    }
    setOpenId(athleteId)
    if (!metricsById[athleteId] && user) {
      setLoadingMetrics((s) => ({ ...s, [athleteId]: true }))
      try {
        const res = await fetch(`/api/coach/${athleteId}/stats`)
        if (res.ok) {
          const data = await res.json()
          const m: Metrics = {
            submissions: data?.pendingVideos ?? data?.pendingSubmissions ?? 0,
            videosAwaiting: data?.pendingVideos ?? 0,
            lastActivity: data?.lastActivity,
            lessons: data?.recentLessons?.length ?? data?.lessonsCount ?? undefined,
            lessonsCompleted: data?.lessonsCompleted ?? data?.completedLessons ?? 0,
            lessonsUnfinished: data?.lessonsUnfinished ?? data?.incompleteLessons ?? 0
          }
          setMetricsById((s) => ({ ...s, [athleteId]: m }))
        }
      } catch {
        // ignore
      } finally {
        setLoadingMetrics((s) => ({ ...s, [athleteId]: false }))
      }
    }
  }

  return (
    <div>
      <h2
        className="text-xl font-bold mb-2"
        style={{ color: '#000000', fontFamily: '\"Open Sans\", sans-serif', fontWeight: 700 }}
      >
        Your Athletes
      </h2>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {athletes.map((a) => {
          const isOpen = openId === a.id
          const m = metricsById[a.id]
          return (
            <button
              key={a.id}
              onClick={() => toggleMetrics(a.id)}
              className="text-left w-full"
              title={isOpen ? 'Hide metrics' : 'View quick metrics'}
            >
              <div className="w-full aspect-square rounded-lg overflow-hidden bg-gray-100 mb-1 relative">
                {isOpen ? (
                  <div className="absolute inset-0 bg-white/95 backdrop-blur flex items-center justify-center p-3">
                    <div className="text-center space-y-1" style={{ fontFamily: '\"Open Sans\", sans-serif' }}>
                      {loadingMetrics[a.id] ? (
                        <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                          <div className="h-4 w-4 rounded-full border-2 border-gray-400 border-t-transparent animate-spin" />
                          Loading metrics…
                        </div>
                      ) : (
                        <>
                          <div className="grid grid-cols-2 gap-3 text-left">
                            <div>
                              <p className="text-[11px] text-gray-600">Awaiting review</p>
                              <p className="text-lg font-bold">{m?.videosAwaiting ?? 0}</p>
                            </div>
                            <div>
                              <p className="text-[11px] text-gray-600">Total submissions</p>
                              <p className="text-lg font-bold">{m?.submissions ?? 0}</p>
                            </div>
                            <div>
                              <p className="text-[11px] text-gray-600">Lessons completed</p>
                              <p className="text-lg font-bold">{m?.lessonsCompleted ?? 0}</p>
                            </div>
                            <div>
                              <p className="text-[11px] text-gray-600">Lessons unfinished</p>
                              <p className="text-lg font-bold">{m?.lessonsUnfinished ?? 0}</p>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ) : a.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={a.imageUrl} alt={a.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: '#8B7D7B' }}>
                    <img src="/brand/athleap-logo-colored.png" alt="AthLeap" className="w-1/2 opacity-90" />
                  </div>
                )}
              </div>
              <p className="text-sm font-semibold" style={{ color: '#000000', fontFamily: '\"Open Sans\", sans-serif' }}>
                {a.name}
              </p>
              <p className="text-xs" style={{ color: '#666', fontFamily: '\"Open Sans\", sans-serif' }}>
                {isOpen ? 'Click to hide metrics' : 'Click to view metrics'}
              </p>
            </button>
          )
        })}
        {athletes.length === 0 && (
          <div className="text-sm text-gray-500">No assigned athletes yet.</div>
        )}
      </div>
    </div>
  )
}


