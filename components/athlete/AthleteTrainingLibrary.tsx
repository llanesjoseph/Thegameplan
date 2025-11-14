'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useRouter } from 'next/navigation'
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore'
import { db, storage } from '@/lib/firebase.client'
import { ref, getDownloadURL } from 'firebase/storage'
import { BookOpen } from 'lucide-react'

export default function AthleteTrainingLibrary() {
  const { user } = useAuth()
  const router = useRouter()
  const [lessons, setLessons] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const pageSize = 4

  useEffect(() => {
    const loadTrainingLibrary = async () => {
      if (!user?.uid) {
        setLoading(false)
        return
      }

      try {
        // Get athlete's coach ID
        const userDoc = await getDoc(doc(db, 'users', user.uid))
        if (userDoc.exists()) {
          const userData = userDoc.data()
          const coachId = userData?.coachId || userData?.assignedCoachId

          if (coachId) {
            // Fetch coach's published lessons
            const lessonsQuery = query(
              collection(db, 'content'),
              where('creatorUid', '==', coachId),
              where('status', '==', 'published')
            )
            const lessonsSnap = await getDocs(lessonsQuery)
            const lessonsData = await Promise.all(
              lessonsSnap.docs.map(async (d) => {
                const data: any = d.data()
                let thumbnailUrl: string | undefined =
                  data.thumbnailUrl || data.thumbnail || data.thumbUrl || data.coverImageUrl || data.imageUrl
                if (thumbnailUrl && !/^https?:\/\//i.test(thumbnailUrl)) {
                  try {
                    thumbnailUrl = await getDownloadURL(ref(storage, thumbnailUrl))
                  } catch {
                    // keep as-is; placeholder will show
                  }
                }
                return {
                  id: d.id,
                  ...data,
                  thumbnailUrl,
                  title: data.title || 'Title',
                  author: data.creatorName || 'Author'
                }
              })
            )
            setLessons(lessonsData) // We keep all, but page through
            setPage(0)
          }
        }
      } catch (error) {
        console.error('Error loading training library:', error)
      } finally {
        setLoading(false)
      }
    }

    loadTrainingLibrary()
  }, [user])

  const handleViewLesson = (lessonId: string) => {
    router.push(`/dashboard/athlete-lessons?lesson=${lessonId}`)
  }

  const totalPages = Math.max(1, Math.ceil(lessons.length / pageSize))
  const start = page * pageSize
  const visibleLessons = lessons.slice(start, start + pageSize)
  const canPrev = page > 0
  const canNext = page < totalPages - 1

  return (
    <div>
      <h2 className="text-xl font-bold mb-2" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif', fontWeight: 700 }}>
        Your Training Library
      </h2>
      
      {loading ? (
        <div className="flex flex-wrap gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="w-44 h-44 md:w-48 md:h-48 lg:w-56 lg:h-56 bg-gray-200 rounded-lg animate-pulse" style={{ aspectRatio: '1/1' }}></div>
          ))}
        </div>
      ) : lessons.length > 0 ? (
        <div className="relative">
          {/* Content row */}
          <div className="flex flex-wrap gap-4">
          {visibleLessons.map((lesson) => (
            <button
              key={lesson.id}
              onClick={() => handleViewLesson(lesson.id)}
              className="text-left group w-44 md:w-48 lg:w-56"
            >
              <div className="w-full rounded-lg overflow-hidden bg-gray-100 mb-1" style={{ aspectRatio: '1/1' }}>
                {lesson.thumbnailUrl ? (
                  <img
                    src={lesson.thumbnailUrl}
                    alt={lesson.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                ) : (
                  <div className="w-full h-full" style={{ backgroundColor: '#E5E5E5' }}>
                    {/* Placeholder for training library image */}
                    <div className="w-full h-full bg-gray-300"></div>
                  </div>
                )}
              </div>
              <p className="text-sm font-semibold" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif' }}>
                {lesson.title}
              </p>
              {/* Author hidden to avoid coach reference clutter per design */}
            </button>
          ))}
          </div>

          {/* Overlay arrows positioned over first/last tiles */}
          {totalPages > 1 && (
            <>
              <button
                aria-label="Previous lessons"
                disabled={!canPrev}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                className={`absolute -left-4 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full border text-lg leading-none flex items-center justify-center transition ${
                  canPrev
                    ? 'bg-white text-black border-black/70 hover:bg-black hover:text-white'
                    : 'bg-white text-gray-400 border-gray-300 cursor-not-allowed opacity-60'
                }`}
              >
                ‹
              </button>
              <button
                aria-label="Next lessons"
                disabled={!canNext}
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                className={`absolute -right-4 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full border text-lg leading-none flex items-center justify-center transition ${
                  canNext
                    ? 'bg-white text-black border-black/70 hover:bg-black hover:text-white'
                    : 'bg-white text-gray-400 border-gray-300 cursor-not-allowed opacity-60'
                }`}
              >
                ›
              </button>
            </>
          )}
        </div>
      ) : (
        <p className="text-gray-500 text-sm">No training content available yet</p>
      )}
    </div>
  )
}

