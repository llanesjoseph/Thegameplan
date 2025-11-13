'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore'
import { db } from '@/lib/firebase.client'

type Lesson = { id: string; title: string; thumbnailUrl?: string }

export default function CoachLessonLibrary() {
  const router = useRouter()
  const { user } = useAuth()
  const [lessons, setLessons] = useState<Lesson[]>([])

  useEffect(() => {
    const load = async () => {
      if (!user?.uid) return
      try {
        const q = query(
          collection(db, 'content'),
          where('creatorUid', '==', user.uid),
          where('status', '==', 'published'),
          orderBy('createdAt', 'desc'),
          limit(8)
        )
        const snap = await getDocs(q)
        const items: Lesson[] = snap.docs.map(d => ({
          id: d.id,
          title: (d.data() as any).title || 'Title',
          thumbnailUrl: (d.data() as any).thumbnailUrl
        }))
        setLessons(items)
      } catch (e) {
        console.warn('Failed to load lessons:', e)
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
        Your Lesson Library
      </h2>

      <div className="flex flex-wrap gap-4">
        {lessons.map((l) => (
          <button
            key={l.id}
            onClick={() => router.push('/dashboard/coach/lessons/library')}
            className="text-left w-44 md:w-48 lg:w-56"
          >
            <div className="w-full aspect-square rounded-lg overflow-hidden bg-gray-100 mb-1">
              {l.thumbnailUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={l.thumbnailUrl} alt={l.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gray-300" />
              )}
            </div>
            <p className="text-sm font-semibold" style={{ color: '#000000', fontFamily: '\"Open Sans\", sans-serif' }}>
              {l.title}
            </p>
          </button>
        ))}
        {lessons.length === 0 && (
          <div className="text-sm text-gray-500">No published lessons yet.</div>
        )}
      </div>
    </div>
  )
}


