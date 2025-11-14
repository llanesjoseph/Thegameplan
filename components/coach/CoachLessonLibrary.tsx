'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore'
import { db, storage } from '@/lib/firebase.client'
import { getDownloadURL, ref } from 'firebase/storage'

type Lesson = { id: string; title: string; thumbnailUrl?: string }

export default function CoachLessonLibrary() {
  const router = useRouter()
  const { user } = useAuth()
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [openLessonId, setOpenLessonId] = useState<string | null>(null)

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
        let items: Lesson[] = snap.docs.map(d => {
          const data = d.data() as any
          return {
            id: d.id,
            title: data.title || 'Title',
            thumbnailUrl: data.thumbnailUrl || data.imageUrl || data.coverUrl || ''
          }
        })
        // Resolve storage paths for thumbnails
        items = await Promise.all(
          items.map(async (it) => {
            const isHttp = /^https?:\/\//i.test(it.thumbnailUrl || '')
            if (it.thumbnailUrl && !isHttp) {
              try {
                const url = await getDownloadURL(ref(storage, it.thumbnailUrl))
                return { ...it, thumbnailUrl: url }
              } catch {
                return it
              }
            }
            return it
          })
        )
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
            onClick={() => setOpenLessonId(l.id)}
            className="text-left w-44 md:w-48 lg:w-56"
          >
            <div className="w-full aspect-square rounded-lg overflow-hidden bg-gray-100 mb-1">
              {l.thumbnailUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={l.thumbnailUrl} alt={l.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-white flex items-center justify-center">
                  <img src="/new-logo.png" alt="AthLeap" className="w-1/2 opacity-60" />
                </div>
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

      {/* Inline editor drawer */}
      {openLessonId && (
        <div
          className="fixed inset-0 z-50"
          style={{ backgroundColor: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(2px)' }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpenLessonId(null)
          }}
        >
          <div className="fixed right-4 bottom-4 sm:right-6 sm:bottom-6 w-[94vw] sm:w-[840px] max-w-[880px] rounded-2xl shadow-2xl overflow-hidden bg-white">
            <div className="flex items-center justify-between px-4 py-3 border-b" style={{ background: '#FC0105' }}>
              <h3 className="text-white font-bold" style={{ fontFamily: '\"Open Sans\", sans-serif' }}>Edit Lesson</h3>
              <button onClick={() => setOpenLessonId(null)} className="text-white/90 hover:text-white px-2 py-1 rounded-lg hover:bg-white/10">✕</button>
            </div>
            <div className="h-[70vh]">
              <iframe
                src={`/dashboard/coach/lessons/${openLessonId}/edit?embedded=true`}
                title="Edit Lesson"
                className="w-full h-full border-0"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


