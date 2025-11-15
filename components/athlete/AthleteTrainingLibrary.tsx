'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { doc, getDoc, collection, query, where, getDocs, setDoc, deleteDoc } from 'firebase/firestore'
import { db, storage } from '@/lib/firebase.client'
import { ref, getDownloadURL } from 'firebase/storage'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import LessonOverlay from '@/components/LessonOverlay'

export default function AthleteTrainingLibrary() {
  const { user } = useAuth()
  const [lessons, setLessons] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [openLessonId, setOpenLessonId] = useState<string | null>(null)
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set())
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
                // Priority: video thumbnail > lesson thumbnail > coach photo > logo
                let thumbnailUrl: string | undefined =
                  data.videoThumbnail ||
                  data.thumbnailUrl ||
                  data.thumbnail ||
                  data.thumbUrl ||
                  data.coverImageUrl ||
                  data.imageUrl ||
                  data.coachPhoto ||
                  data.uploadedImage
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

            // Load completed lessons for this athlete
            const completedQuery = query(
              collection(db, 'lessonCompletions'),
              where('athleteUid', '==', user.uid)
            )
            const completedSnap = await getDocs(completedQuery)
            const completed = new Set<string>()
            completedSnap.forEach((doc) => {
              const data = doc.data()
              if (data.lessonId) {
                completed.add(data.lessonId)
              }
            })
            setCompletedLessons(completed)
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
    setOpenLessonId(lessonId)
  }

  const handleToggleCompletion = async () => {
    if (!openLessonId || !user?.uid) return

    try {
      const completionId = `${user.uid}_${openLessonId}`
      const isCurrentlyCompleted = completedLessons.has(openLessonId)

      if (isCurrentlyCompleted) {
        // Mark as incomplete - remove from Firestore
        await deleteDoc(doc(db, 'lessonCompletions', completionId))
        setCompletedLessons((prev) => {
          const updated = new Set(prev)
          updated.delete(openLessonId)
          return updated
        })
      } else {
        // Mark as complete - add to Firestore
        await setDoc(doc(db, 'lessonCompletions', completionId), {
          athleteUid: user.uid,
          lessonId: openLessonId,
          completedAt: new Date(),
          lessonTitle: lessons.find((l) => l.id === openLessonId)?.title || ''
        })
        setCompletedLessons((prev) => new Set(prev).add(openLessonId))
      }
    } catch (error) {
      console.error('Error toggling lesson completion:', error)
    }
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
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="w-full">
              <div className="w-full rounded-lg overflow-hidden bg-gray-200 mb-1 animate-pulse" style={{ aspectRatio: '1/1' }}></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
            </div>
          ))}
        </div>
      ) : lessons.length > 0 ? (
        <div className="relative">
          {/* Content row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {visibleLessons.map((lesson) => (
            <button
              key={lesson.id}
              onClick={() => handleViewLesson(lesson.id)}
              className="text-left group w-full"
            >
              <div className="w-full rounded-lg overflow-hidden mb-1" style={{ aspectRatio: '1/1' }}>
                {lesson.thumbnailUrl ? (
                  <img
                    src={lesson.thumbnailUrl}
                    alt={lesson.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: '#8B7D7B' }}>
                    <img src="/brand/athleap-logo-colored.png" alt="AthLeap" className="w-1/2 opacity-90" />
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

          {/* Overlay arrows positioned over the thumbnails row */}
          {totalPages > 1 && (
            <>
              <button
                aria-label="Previous lessons"
                disabled={!canPrev}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                className={`absolute left-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full border flex items-center justify-center transition ${
                  canPrev
                    ? 'bg-white text-black border-black/70 hover:bg-black hover:text-white'
                    : 'bg-white text-gray-400 border-gray-300 cursor-not-allowed opacity-60'
                }`}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                aria-label="Next lessons"
                disabled={!canNext}
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                className={`absolute right-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full border flex items-center justify-center transition ${
                  canNext
                    ? 'bg-white text-black border-black/70 hover:bg-black hover:text-white'
                    : 'bg-white text-gray-400 border-gray-300 cursor-not-allowed opacity-60'
                }`}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      ) : (
        <p className="text-gray-500 text-sm">No training content available yet</p>
      )}

      {/* Lesson Viewer - Shows ONLY the individual lesson */}
      {openLessonId && (
        <LessonOverlay
          lessonId={openLessonId}
          onClose={() => setOpenLessonId(null)}
          isCompleted={completedLessons.has(openLessonId)}
          onToggleCompletion={handleToggleCompletion}
        />
      )}
    </div>
  )
}

