'use client'

import { useState, useEffect } from 'react'
import { ChevronUp, ChevronDown } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore'
import { db, storage } from '@/lib/firebase.client'
import { ref, getDownloadURL } from 'firebase/storage'
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
        console.log('🔍 Loading training library for athlete:', user.uid)

        const token = await user.getIdToken()

        // Get athlete's assigned coach ID
        const userDoc = await getDoc(doc(db, 'users', user.uid))
        const coachIds: string[] = []

        if (userDoc.exists()) {
          const userData = userDoc.data()
          const assignedCoachId = userData?.coachId || userData?.assignedCoachId

          // Add assigned coach
          if (assignedCoachId) {
            coachIds.push(assignedCoachId)
            console.log('  ✅ Assigned coach:', assignedCoachId)
          }
        }

        // Get followed coaches via API (uses admin privileges; avoids client Firestore permission issues)
        try {
          console.log('🔍 Loading followed coaches for training library...')
          const followingResponse = await fetch('/api/athlete/following', {
            headers: { 'Authorization': `Bearer ${token}` }
          })

          if (followingResponse.ok) {
            const followingData = await followingResponse.json()
            if (followingData.success && Array.isArray(followingData.following)) {
              for (const follow of followingData.following) {
                const followedCoachId = follow.coachId
                if (followedCoachId && !coachIds.includes(followedCoachId)) {
                  coachIds.push(followedCoachId)
                  console.log('  ✅ Followed coach (library):', followedCoachId)
                }
              }
            }
          } else {
            const errorData = await followingResponse.json().catch(() => ({}))
            console.warn('⚠️ Training library following API error:', followingResponse.status, errorData)
          }
        } catch (followError) {
          console.warn('⚠️ Could not load followed coaches for training library:', followError)
        }

        console.log(`📚 Fetching lessons from ${coachIds.length} coach(es)`)

        if (coachIds.length > 0) {
          // Fetch lessons from ALL coaches (assigned + followed)
          const allLessons: any[] = []

          for (const coachId of coachIds) {
            const lessonsQuery = query(
              collection(db, 'content'),
              where('creatorUid', '==', coachId),
              where('status', '==', 'published')
            )
            const lessonsSnap = await getDocs(lessonsQuery)
            console.log(`  📖 Found ${lessonsSnap.size} lessons from coach ${coachId}`)

            const coachLessons = await Promise.all(
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
            allLessons.push(...coachLessons)
          }

          console.log(`✅ Total lessons loaded: ${allLessons.length}`)
          setLessons(allLessons)
          setPage(0)
        }

        // Load completed lessons for this athlete (best-effort; failures should not hide lessons)
        try {
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
        } catch (completedError) {
          console.warn('⚠️ Could not load completed lessons (training library):', completedError)
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
      const isCurrentlyCompleted = completedLessons.has(openLessonId)

      const token = await user.getIdToken()
      const response = await fetch('/api/athlete/lesson-completion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          lessonId: openLessonId,
          completed: !isCurrentlyCompleted
        })
      })

      const result = await response.json().catch(() => ({}))
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to update completion status')
      }

      // Update local state after successful API call
      if (isCurrentlyCompleted) {
        setCompletedLessons((prev) => {
          const updated = new Set(prev)
          updated.delete(openLessonId)
          return updated
        })
      } else {
        setCompletedLessons((prev) => new Set(prev).add(openLessonId))
      }
    } catch (error) {
      console.error('Error toggling lesson completion:', error)
      alert('Unable to update lesson status. Please try again.')
    }
  }

  const totalPages = Math.max(1, Math.ceil(lessons.length / pageSize))
  const start = page * pageSize
  const visibleLessons = lessons.slice(start, start + pageSize)

  return (
    <div>
      <h2
        className="mb-6"
        style={{ fontFamily: '"Open Sans", sans-serif', fontSize: '25px', letterSpacing: '0.05em' }}
      >
        Your Training Library
      </h2>

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-gray-200 animate-pulse" />
              <div className="flex-1 h-4 bg-gray-200 rounded" />
              <div className="w-16 h-4 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      ) : lessons.length > 0 ? (
        <>
          <div className="border-t border-gray-300">
            {visibleLessons.map((lesson) => {
              const isCompleted = completedLessons.has(lesson.id)
              return (
                <button
                  key={lesson.id}
                  onClick={() => handleViewLesson(lesson.id)}
                  className="w-full flex items-center gap-6 py-4 border-b border-gray-200 text-left hover:bg-gray-50 transition-colors"
                >
                  <div className="w-14 h-14 rounded-full overflow-hidden flex-shrink-0 bg-[#440102]">
                    {lesson.thumbnailUrl ? (
                      <img
                        src={lesson.thumbnailUrl}
                        alt={lesson.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <img
                        src="/brand/athleap-logo-colored.png"
                        alt="AthLeap"
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div className="flex-1 flex items-center justify-between gap-4">
                    <p
                      style={{ fontFamily: '"Open Sans", sans-serif', fontSize: '14px', color: '#000000' }}
                    >
                      {lesson.title}
                    </p>
                    <p
                      className="text-xs"
                      style={{ fontFamily: '"Open Sans", sans-serif', color: '#555555' }}
                    >
                      {isCompleted ? 'Completed' : 'In Progress'}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Pagination arrows - only show when there are more than 4 lessons */}
          {lessons.length > pageSize && (
            <div className="mt-6 flex items-center justify-center gap-4">
              <button
                type="button"
                aria-label="Previous lessons"
                onClick={() => setPage((prev) => Math.max(0, prev - 1))}
                disabled={page === 0}
                className={`w-9 h-9 rounded-full border flex items-center justify-center transition-colors ${
                  page === 0
                    ? 'border-gray-300 text-gray-400 cursor-not-allowed opacity-60'
                    : 'border-black text-black hover:bg-black hover:text-white'
                }`}
              >
                <ChevronUp className="w-4 h-4" />
              </button>
              <span
                className="text-xs"
                style={{ fontFamily: '"Open Sans", sans-serif', color: '#555555' }}
              >
                Page {page + 1} of {totalPages}
              </span>
              <button
                type="button"
                aria-label="Next lessons"
                onClick={() => setPage((prev) => Math.min(totalPages - 1, prev + 1))}
                disabled={page >= totalPages - 1}
                className={`w-9 h-9 rounded-full border flex items-center justify-center transition-colors ${
                  page >= totalPages - 1
                    ? 'border-gray-300 text-gray-400 cursor-not-allowed opacity-60'
                    : 'border-black text-black hover:bg-black hover:text-white'
                }`}
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
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

