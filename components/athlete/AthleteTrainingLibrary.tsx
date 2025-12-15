'use client'

import { useState, useEffect } from 'react'
import { ChevronUp, ChevronDown } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { doc, getDoc, collection, query, where, getDocs, onSnapshot } from 'firebase/firestore'
import { db, storage } from '@/lib/firebase.client'
import { ref, getDownloadURL } from 'firebase/storage'
import LessonOverlay from '@/components/LessonOverlay'

interface AthleteSubscriptionSummary {
  tier?: string
  status?: string
  isActive?: boolean
}

interface AthleteTrainingLibraryProps {
  subscription?: AthleteSubscriptionSummary | null
  isVerifying?: boolean
}

export default function AthleteTrainingLibrary({ subscription, isVerifying = false }: AthleteTrainingLibraryProps = {}) {
  const { user } = useAuth()
  const [lessons, setLessons] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [openLessonId, setOpenLessonId] = useState<string | null>(null)
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set())
  const [startedLessons, setStartedLessons] = useState<Set<string>>(new Set())
  const pageSize = 4
  const hasActiveSubscription = !!subscription?.isActive

  useEffect(() => {
    const loadTrainingLibrary = async () => {
      if (!user?.uid || !hasActiveSubscription) {
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
                
                // If it's a storage path (not a full URL), get download URL
                if (thumbnailUrl && !/^https?:\/\//i.test(thumbnailUrl)) {
                  try {
                    thumbnailUrl = await getDownloadURL(ref(storage, thumbnailUrl))
                  } catch (storageError) {
                    console.warn(`⚠️ Could not get download URL for lesson ${d.id}:`, storageError)
                    thumbnailUrl = undefined // Will use fallback
                  }
                }
                
                // If it's a Firebase Storage URL, use proxy to bypass CORS
                if (thumbnailUrl && thumbnailUrl.includes('firebasestorage.googleapis.com')) {
                  // Use proxy endpoint to bypass CORS issues
                  thumbnailUrl = `/api/image-proxy?url=${encodeURIComponent(thumbnailUrl)}`
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

        // CRITICAL: Load lesson status from aggregated API to ensure accuracy
        // This uses the same source as the progress metrics
        try {
          console.log('🔍 Loading lesson status from aggregated API...')
          const statusResponse = await fetch('/api/athlete/progress/aggregate', {
            headers: { 'Authorization': `Bearer ${token}` }
          })

          if (statusResponse.ok) {
            const statusData = await statusResponse.json()
            if (statusData.success && statusData.progress) {
              // Get all completed lessons from athlete_feed (API aggregates but we need the list)
              const feedDoc = await getDoc(doc(db, 'athlete_feed', user.uid))
              if (feedDoc.exists()) {
                const feedData = feedDoc.data()
                const completed = new Set<string>(feedData?.completedLessons || [])
                const started = new Set<string>(feedData?.startedLessons || [])
                console.log(`  ✅ Loaded ${completed.size} completed, ${started.size} started lessons`)
                setCompletedLessons(completed)
                setStartedLessons(started)
              } else {
                console.warn('⚠️ athlete_feed not found, using empty sets')
                setCompletedLessons(new Set())
                setStartedLessons(new Set())
              }
            } else {
              throw new Error('API returned unsuccessful response')
            }
          } else {
            throw new Error(`API returned ${statusResponse.status}`)
          }
        } catch (apiError) {
          console.warn('⚠️ Could not load lesson status from API, falling back to direct Firestore:', apiError)
          // Fallback: Load directly from athlete_feed
          try {
            const feedDoc = await getDoc(doc(db, 'athlete_feed', user.uid))
            if (feedDoc.exists()) {
              const feedData = feedDoc.data()
              const completed = new Set<string>(feedData?.completedLessons || [])
              const started = new Set<string>(feedData?.startedLessons || [])
              setCompletedLessons(completed)
              setStartedLessons(started)
            }
          } catch (feedError) {
            console.warn('⚠️ Could not load lesson status from athlete_feed:', feedError)
            setCompletedLessons(new Set())
            setStartedLessons(new Set())
          }
        }
      } catch (error) {
        console.error('Error loading training library:', error)
      } finally {
        setLoading(false)
      }
    }

    loadTrainingLibrary()
  }, [user, hasActiveSubscription])

  // CRITICAL: Real-time listener for athlete_feed updates
  // This ensures completion status updates instantly when lessons are completed
  useEffect(() => {
    if (!user?.uid || !hasActiveSubscription) return

    console.log('🔥 Setting up real-time listener for athlete_feed (Training Library)')

    const feedDocRef = doc(db, 'athlete_feed', user.uid)

    const unsubscribe = onSnapshot(
      feedDocRef,
      (snapshot) => {
        if (snapshot.exists() && !snapshot.metadata.hasPendingWrites) {
          console.log('🔄 Real-time update: athlete_feed changed (Training Library)')
          const feedData = snapshot.data()
          const completed = new Set<string>(feedData?.completedLessons || [])
          const started = new Set<string>(feedData?.startedLessons || [])
          console.log(`  ✅ Updated: ${completed.size} completed, ${started.size} started`)
          setCompletedLessons(completed)
          setStartedLessons(started)
        }
      },
      (error) => {
        if (error.code !== 'permission-denied') {
          console.error('❌ Error listening to athlete feed (Training Library):', error)
        }
      }
    )

    return () => {
      console.log('🔥 Cleaning up real-time listener (Training Library)')
      unsubscribe()
    }
  }, [user, hasActiveSubscription])

  const handleViewLesson = (lessonId: string) => {
    setOpenLessonId(lessonId)
  }

  const handleToggleCompletion = async () => {
    if (!openLessonId || !user?.uid) return

    try {
      const isCurrentlyCompleted = completedLessons.has(openLessonId)
      const action = isCurrentlyCompleted ? 'uncomplete' : 'complete'

      console.log(`🔄 Toggling lesson ${openLessonId}: ${action}`)

      const token = await user.getIdToken()
      
      // Use the correct API endpoint that uses transactions
      const response = await fetch('/api/athlete/progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          lessonId: openLessonId,
          action: action
        })
      })

      const result = await response.json().catch(() => ({}))
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to update completion status')
      }

      console.log(`✅ Lesson ${openLessonId} marked as ${action}`)

      // Update local state immediately for instant UI feedback
      // The real-time listener will also update this, but this provides instant feedback
      if (isCurrentlyCompleted) {
        setCompletedLessons((prev) => {
          const updated = new Set(prev)
          updated.delete(openLessonId)
          return updated
        })
        // Also remove from started if uncompleting
        setStartedLessons((prev) => {
          const updated = new Set(prev)
          updated.delete(openLessonId)
          return updated
        })
      } else {
        setCompletedLessons((prev) => new Set(prev).add(openLessonId))
        // Ensure it's also in started lessons
        setStartedLessons((prev) => new Set(prev).add(openLessonId))
      }
    } catch (error: any) {
      console.error('❌ Error toggling lesson completion:', error)
      alert(`Unable to update lesson status: ${error.message || 'Please try again.'}`)
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

      {isVerifying ? (
        <div className="border border-dashed border-green-300 rounded-lg p-6 text-center bg-green-50">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="w-5 h-5 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
            <p
              className="text-sm font-medium"
              style={{ fontFamily: '"Open Sans", sans-serif', color: '#166534' }}
            >
              Verifying your subscription...
            </p>
          </div>
          <p
            className="text-xs"
            style={{ fontFamily: '"Open Sans", sans-serif', color: '#15803d' }}
          >
            Please wait while we confirm your payment. This usually takes just a few seconds.
          </p>
        </div>
      ) : !hasActiveSubscription ? (
        <div className="border border-dashed border-gray-300 rounded-lg p-6 text-center">
          <p
            className="text-sm mb-3"
            style={{ fontFamily: '"Open Sans", sans-serif', color: '#444444' }}
          >
            Start your athlete subscription to unlock full access to your training library and coach lessons.
          </p>
          <button
            type="button"
            onClick={() => {
              window.location.href = '/dashboard/athlete/pricing'
            }}
            className="inline-flex items-center justify-center px-6 py-2 rounded-full text-xs sm:text-sm font-semibold tracking-[0.16em] uppercase shadow-sm transition-colors"
            style={{ fontFamily: '"Open Sans", sans-serif', backgroundColor: '#FC0105', color: '#FFFFFF' }}
          >
            View Plans
          </button>
        </div>
      ) : loading ? (
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
              const isStarted = startedLessons.has(lesson.id)
              
              // CRITICAL: Show correct status
              // START = not started yet
              // IN PROGRESS = started but not completed
              // COMPLETED = completed
              let statusText = 'Start'
              let statusColor = '#555555'
              if (isCompleted) {
                statusText = 'Completed'
                statusColor = '#16a34a' // green
              } else if (isStarted) {
                statusText = 'In Progress'
                statusColor = '#3b82f6' // blue
              }
              
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
                        loading="lazy"
                        onError={(e) => {
                          // Fallback to logo if image fails to load (CORS or other errors)
                          const target = e.target as HTMLImageElement
                          if (!target.src.includes('athleap-logo')) {
                            target.src = '/brand/athleap-logo-colored.png'
                            target.onerror = null // Prevent infinite loop
                          }
                        }}
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
                      className="text-xs font-medium"
                      style={{ fontFamily: '"Open Sans", sans-serif', color: statusColor }}
                    >
                      {statusText}
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


