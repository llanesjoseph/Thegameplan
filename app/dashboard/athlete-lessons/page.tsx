'use client'

/**
 * Athlete Lessons - Personalized Lesson Feed
 * Displays lessons assigned by the athlete's coach from athlete_feed collection
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { BookOpen, CheckCircle2, Circle, Clock, User, RefreshCw, ChevronDown, ChevronUp, Play, Video, X } from 'lucide-react'
import AppHeader from '@/components/ui/AppHeader'
import LessonOverlay from '@/components/LessonOverlay'
import LessonCompletionCelebration from '@/components/athlete/LessonCompletionCelebration'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase.client'

interface Lesson {
  id: string
  title: string
  description?: string
  sport?: string
  level?: string
  videoUrl?: string
  createdAt?: string
  isCompleted: boolean
}

interface CoachInfo {
  id: string
  displayName: string
  email: string | null
  photoURL: string | null
}

interface FeedData {
  athleteId: string
  coachId: string | null
  coach: CoachInfo | null
  availableLessons: string[]
  completedLessons: string[]
  totalLessons: number
  completionRate: number
}

export default function AthleteLessonsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [initialLoad, setInitialLoad] = useState(true) // Track first load to prevent "no lessons" flash
  const [error, setError] = useState<string | null>(null)
  const [feed, setFeed] = useState<FeedData | null>(null)
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [processingLesson, setProcessingLesson] = useState<string | null>(null)
  const [isInIframe, setIsInIframe] = useState(false)
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [showCompleted, setShowCompleted] = useState(true) // Show completed lessons by default
  const [showOlder, setShowOlder] = useState(false)
  const [progressUpdated, setProgressUpdated] = useState(false)
  const [showCelebration, setShowCelebration] = useState(false)
  const [completedLessonTitle, setCompletedLessonTitle] = useState('')
  const [coachVideos, setCoachVideos] = useState<any[]>([])
  const [videosLoading, setVideosLoading] = useState(false)
  const [selectedVideo, setSelectedVideo] = useState<any | null>(null)

  // Detect if page is loaded in iframe (check URL param or window)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const embeddedParam = params.get('embedded') === 'true'
    const windowCheck = window.self !== window.top
    setIsInIframe(embeddedParam || windowCheck)
  }, [])

  // Fetch athlete feed and lessons
  useEffect(() => {
    const fetchFeed = async () => {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        const token = await user.getIdToken()
        const response = await fetch('/api/athlete/feed', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          throw new Error(`Failed to fetch feed: ${response.statusText}`)
        }

        const data = await response.json()

        if (data.success) {
          setFeed(data.feed)
          setLessons(data.lessons || [])
          
          // If no lessons found but coach is assigned, try to sync
          if ((data.lessons || []).length === 0 && data.feed?.coachId) {
            console.log('🔄 No lessons found, attempting to sync from coach...')
            try {
              const syncResponse = await fetch('/api/athlete/sync-lessons', {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              })

              if (syncResponse.ok) {
                const syncData = await syncResponse.json()
                if (syncData.success && syncData.lessonCount > 0) {
                  console.log(`✅ Synced ${syncData.lessonCount} lessons, refetching...`)
                  // Refetch the feed after sync
                  const refetchResponse = await fetch('/api/athlete/feed', {
                    headers: {
                      Authorization: `Bearer ${token}`,
                    },
                  })
                  
                  if (refetchResponse.ok) {
                    const refetchData = await refetchResponse.json()
                    if (refetchData.success) {
                      setFeed(refetchData.feed)
                      setLessons(refetchData.lessons || [])
                    }
                  }
                }
              }
            } catch (syncErr) {
              console.error('Error syncing lessons:', syncErr)
              // Don't set error, just continue with empty lessons
            }
          }
        } else {
          setError(data.error || 'Failed to load lessons')
        }
      } catch (err: any) {
        console.error('Error fetching feed:', err)
        setError(err.message || 'Failed to load lessons')
      } finally {
        setLoading(false)
        setInitialLoad(false) // Mark initial load complete
      }
    }

    fetchFeed()
  }, [user])

  // Real-time listener for athlete_feed updates
  // Automatically refetches lessons when coach assigns new content
  useEffect(() => {
    if (!user?.uid || loading) return

    console.log('🔥 Setting up real-time listener for athlete feed')

    const feedDocRef = doc(db, 'athlete_feed', user.uid)

    const unsubscribe = onSnapshot(
      feedDocRef,
      async (snapshot) => {
        // Only refetch if document exists AND has been modified (not on initial load)
        if (snapshot.exists() && !snapshot.metadata.hasPendingWrites) {
          console.log('🔄 Athlete feed updated, refetching lessons...')

          // Refetch full feed with lesson details
          try {
            const token = await user.getIdToken()
            const response = await fetch('/api/athlete/feed', {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            })

            if (response.ok) {
              const data = await response.json()
              if (data.success) {
                setFeed(data.feed)
                setLessons(data.lessons || [])
                console.log('✅ Lessons auto-refreshed:', data.lessons?.length || 0)
              }
            }
          } catch (err) {
            console.error('Error auto-refreshing feed:', err)
          }
        }
      },
      (error) => {
        // Silently handle permission errors for non-existent documents
        if (error.code !== 'permission-denied') {
          console.error('Error listening to athlete feed:', error)
        }
      }
    )

    // Cleanup listener on unmount
    return () => {
      console.log('🔥 Cleaning up real-time listener')
      unsubscribe()
    }
  }, [user, loading])

  // Fetch coach videos when component loads
  useEffect(() => {
    if (user && !loading) {
      fetchCoachVideos()
    }
  }, [user, loading])

  // Toggle lesson completion
  const toggleCompletion = async (lessonId: string, isCurrentlyCompleted: boolean) => {
    if (!user || processingLesson) return

    setProcessingLesson(lessonId)

    try {
      const token = await user.getIdToken()
      const action = isCurrentlyCompleted ? 'uncomplete' : 'complete'

      const response = await fetch('/api/athlete/progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          lessonId,
          action,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update progress')
      }

      // Update local state
      setLessons(prevLessons =>
        prevLessons.map(lesson =>
          lesson.id === lessonId
            ? { ...lesson, isCompleted: !isCurrentlyCompleted }
            : lesson
        )
      )

      if (feed) {
        const updatedCompletedLessons = isCurrentlyCompleted
          ? feed.completedLessons.filter(id => id !== lessonId)
          : [...feed.completedLessons, lessonId]
        
        const newCompletionRate = feed.totalLessons > 0 
          ? Math.round((updatedCompletedLessons.length / feed.totalLessons) * 100)
          : 0

        setFeed({
          ...feed,
          completedLessons: updatedCompletedLessons,
          completionRate: newCompletionRate,
        })
        
        console.log(`📊 Progress updated: ${updatedCompletedLessons.length}/${feed.totalLessons} (${newCompletionRate}%)`)
        
        // Show success feedback and progress animation
        if (!isCurrentlyCompleted) {
          console.log('🎉 Lesson completed successfully!')
          setProgressUpdated(true)
          // Reset animation after 2 seconds
          setTimeout(() => setProgressUpdated(false), 2000)
          
          // Show celebration modal and auto-expand completed lessons
          const completedLesson = lessons.find(l => l.id === lessonId)
          if (completedLesson) {
            setCompletedLessonTitle(completedLesson.title)
            setShowCelebration(true)
            // Auto-expand completed lessons section
            setShowCompleted(true)
          }
        }
      }
    } catch (err: any) {
      console.error('Error updating progress:', err)
      alert('Failed to update progress. Please try again.')
    } finally {
      setProcessingLesson(null)
    }
  }

  // Sync lessons from coach
  const syncLessons = async () => {
    if (!user || syncing) return

    setSyncing(true)

    try {
      const token = await user.getIdToken()

      const response = await fetch('/api/athlete/sync-lessons', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to sync lessons')
      }

      const data = await response.json()

      if (data.success) {
        // Reload the feed after sync
        const feedResponse = await fetch('/api/athlete/feed', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (feedResponse.ok) {
          const feedData = await feedResponse.json()
          if (feedData.success) {
            setFeed(feedData.feed)
            setLessons(feedData.lessons || [])
            alert(`✅ ${data.message}`)
          }
        }
      }
    } catch (err: any) {
      console.error('Error syncing lessons:', err)
      alert('Failed to sync lessons. Please try again.')
    } finally {
      setSyncing(false)
    }
  }

  const fetchCoachVideos = async () => {
    if (!user) return

    try {
      setVideosLoading(true)
      console.log('Fetching coach videos...')

      const response = await fetch('/api/athlete/coach-videos', {
        headers: {
          'Authorization': `Bearer ${await user.getIdToken()}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        console.log('Coach videos response:', data)

        if (data.success) {
          setCoachVideos(data.videos || [])
          console.log('Loaded coach videos:', data.videos?.length || 0)
        } else {
          console.log('No coach videos found')
          setCoachVideos([])
        }
      } else {
        console.error('Failed to fetch coach videos:', response.status)
        setCoachVideos([])
      }
    } catch (err: any) {
      console.error('Error fetching coach videos:', err)
      setCoachVideos([])
    } finally {
      setVideosLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#E8E6D8' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-black mx-auto"></div>
          <p className="mt-4" style={{ color: '#000000' }}>Loading your lessons...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#E8E6D8' }}>
        <div className="max-w-md mx-auto px-4">
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-8 text-center">
            <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: '#FF6B35' }}>
              <BookOpen className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl mb-3" style={{ color: '#000000' }}>
              Error Loading Lessons
            </h2>
            <p className="mb-6" style={{ color: '#000000', opacity: 0.7 }}>
              {error}
            </p>
            <button
              onClick={() => router.push('/dashboard/progress')}
              className="px-6 py-3 rounded-lg text-white transition-colors"
              style={{ backgroundColor: '#3B82F6' }}
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  const completedCount = feed?.completedLessons.length || 0
  const totalCount = lessons.length
  const completionPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  // Categorize lessons
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  const activeLessons = lessons.filter(lesson => !lesson.isCompleted)
  const completedLessons = lessons.filter(lesson => lesson.isCompleted)

  // Split active lessons into recent and older
  const recentActiveLessons = activeLessons.filter(lesson => {
    if (!lesson.createdAt) return true // If no date, consider recent
    return new Date(lesson.createdAt) >= thirtyDaysAgo
  })

  const olderActiveLessons = activeLessons.filter(lesson => {
    if (!lesson.createdAt) return false
    return new Date(lesson.createdAt) < thirtyDaysAgo
  })

  // Lesson Card Component
  const LessonCard = ({
    lesson,
    processingLesson,
    onView,
    onToggleCompletion
  }: {
    lesson: Lesson
    processingLesson: string | null
    onView: () => void
    onToggleCompletion: () => void
  }) => (
    <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-md border border-white/50 overflow-hidden hover:shadow-lg transition-all">
      <div className="p-4">
        {/* Compact Header */}
        <div className="mb-3">
          <h3
            className={`text-lg font-semibold mb-1 ${lesson.isCompleted ? 'opacity-60 line-through' : ''}`}
            style={{ color: '#000000' }}
          >
            {lesson.title}
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {lesson.sport && (
              <span className="px-2 py-0.5 rounded text-xs font-medium" style={{ backgroundColor: '#3B82F6', color: 'white' }}>
                {lesson.sport}
              </span>
            )}
            {lesson.level && (
              <span className="px-2 py-0.5 rounded text-xs font-medium" style={{ backgroundColor: '#8D9440', color: 'white' }}>
                {lesson.level}
              </span>
            )}
            {lesson.createdAt && (
              <span className="px-2 py-0.5 rounded text-xs flex items-center gap-1" style={{ backgroundColor: '#E8E6D8', color: '#000000' }}>
                <Clock className="w-3 h-3" />
                {new Date(lesson.createdAt).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>

        {/* Single Review Button */}
        <div className="flex gap-2">
          <button
            onClick={onView}
            className="w-full px-3 py-2 rounded text-sm font-medium transition-all hover:shadow-md active:scale-95 flex items-center justify-center gap-1.5"
            style={{
              backgroundColor: '#20B2AA',
              color: '#ffffff'
            }}
          >
            <BookOpen className="w-4 h-4" />
            Review
          </button>
        </div>
      </div>
    </div>
  )

  const VideoCard = ({
    video,
    onView
  }: {
    video: any
    onView: () => void
  }) => (
    <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-md border border-white/50 overflow-hidden hover:shadow-lg transition-all">
      <div className="p-4">
        {/* Video Thumbnail */}
        {video.thumbnail && (
          <div className="mb-3">
            <img
              src={video.thumbnail}
              alt={video.title}
              className="w-full h-24 object-cover rounded"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
            />
          </div>
        )}

        {/* Video Info */}
        <div className="mb-3">
          <h3 className="text-lg font-semibold mb-1 line-clamp-2" style={{ color: '#000000' }}>
            {video.title}
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {video.sport && (
              <span className="px-2 py-0.5 rounded text-xs font-medium" style={{ backgroundColor: '#FF6B35', color: 'white' }}>
                {video.sport}
              </span>
            )}
            {video.duration > 0 && (
              <span className="px-2 py-0.5 rounded text-xs flex items-center gap-1" style={{ backgroundColor: '#E8E6D8', color: '#000000' }}>
                <Clock className="w-3 h-3" />
                {video.duration}m
              </span>
            )}
            {video.createdDate && (
              <span className="px-2 py-0.5 rounded text-xs" style={{ backgroundColor: '#E8E6D8', color: '#000000' }}>
                {video.createdDate}
              </span>
            )}
          </div>
        </div>

        {/* View Button */}
        <button
          onClick={onView}
          className="w-full px-3 py-2 rounded text-sm font-medium transition-all hover:shadow-md active:scale-95 flex items-center justify-center gap-1.5"
          style={{ backgroundColor: '#FF6B35', color: 'white' }}
        >
          <Play className="w-4 h-4" />
          Watch Video
        </button>
      </div>
    </div>
  )

  return (
    <div style={{ backgroundColor: isInIframe ? 'transparent' : '#E8E6D8' }} className="min-h-screen">
      {!isInIframe && (
        <AppHeader
          title="My Lessons"
          subtitle={feed?.coach ? `From ${feed.coach.displayName} • ${completedCount}/${totalCount} complete (${completionPercentage}%)` : `${completedCount}/${totalCount} complete`}
        />
      )}

      <main className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 space-y-6 lg:space-y-8">
        {/* Progress Bar */}
        <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <h3 className="text-lg font-semibold" style={{ color: '#000000' }}>
                Your Progress
              </h3>
              <button
                onClick={syncLessons}
                disabled={syncing}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: '#3B82F6', color: 'white' }}
                title="Refresh lessons from your coach"
              >
                <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                {syncing ? 'Syncing...' : 'Refresh'}
              </button>
            </div>
            <div className="text-2xl font-bold" style={{ color: '#20B2AA' }}>
              {completionPercentage}%
            </div>
          </div>
          <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${progressUpdated ? 'animate-pulse' : ''}`}
              style={{
                backgroundColor: progressUpdated ? '#10B981' : '#20B2AA',
                width: `${completionPercentage}%`,
                boxShadow: progressUpdated ? '0 0 10px rgba(16, 185, 129, 0.5)' : 'none',
              }}
            />
          </div>
          {progressUpdated && (
            <div className="mt-2 text-sm text-green-600 font-medium animate-bounce">
              🎉 Great job! Progress updated!
            </div>
          )}
        </div>

        {/* Lessons List */}
        {initialLoad ? (
          /* Still loading data - show loading state */
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-12 text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p style={{ color: '#000000', opacity: 0.7 }}>Loading lessons...</p>
          </div>
        ) : lessons.length === 0 ? (
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-12 text-center">
            <BookOpen className="w-20 h-20 mx-auto mb-4" style={{ color: '#3B82F6', opacity: 0.5 }} />
            <h2 className="text-2xl mb-2" style={{ color: '#000000' }}>
              No Lessons Yet
            </h2>
            <p style={{ color: '#000000', opacity: 0.7 }}>
              {feed?.coach
                ? `${feed.coach.displayName} hasn't assigned any lessons yet. Check back soon!`
                : 'You need to be assigned to a coach to see lessons here.'}
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Coach Videos Section */}
            {coachVideos.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Video className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold" style={{ color: '#000000' }}>
                      Coach's Videos ({coachVideos.length})
                    </h3>
                    <p className="text-sm" style={{ color: '#666' }}>
                      Videos posted by your coach
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {coachVideos.map((video) => (
                    <VideoCard
                      key={video.id}
                      video={video}
                      onView={() => setSelectedVideo(video)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Active Lessons Section */}
            {(recentActiveLessons.length > 0 || olderActiveLessons.length > 0) && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold" style={{ color: '#000000' }}>
                      Active Lessons ({recentActiveLessons.length + olderActiveLessons.length})
                    </h3>
                    <p className="text-sm" style={{ color: '#666' }}>
                      Lessons assigned by your coach
                    </p>
                  </div>
                </div>

                {/* Recent Active Lessons */}
                {recentActiveLessons.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {recentActiveLessons.map((lesson) => (
                      <LessonCard
                        key={lesson.id}
                        lesson={lesson}
                        processingLesson={processingLesson}
                        onView={() => setSelectedLessonId(lesson.id)}
                        onToggleCompletion={() => toggleCompletion(lesson.id, lesson.isCompleted)}
                      />
                    ))}
                  </div>
                )}

                {/* Older Active Lessons (collapsible) */}
                {olderActiveLessons.length > 0 && (
                  <div className="space-y-4">
                    <button
                      onClick={() => setShowOlder(!showOlder)}
                      className="w-full flex items-center justify-between px-4 py-3 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      <span className="text-lg font-semibold" style={{ color: '#000000' }}>
                        Older Lessons ({olderActiveLessons.length})
                      </span>
                      {showOlder ? (
                        <ChevronUp className="w-5 h-5" style={{ color: '#666' }} />
                      ) : (
                        <ChevronDown className="w-5 h-5" style={{ color: '#666' }} />
                      )}
                    </button>

                    {showOlder && (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {olderActiveLessons.map((lesson) => (
                          <LessonCard
                            key={lesson.id}
                            lesson={lesson}
                            processingLesson={processingLesson}
                            onView={() => setSelectedLessonId(lesson.id)}
                            onToggleCompletion={() => toggleCompletion(lesson.id, lesson.isCompleted)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Completed Lessons (enhanced) */}
            {completedLessons.length > 0 && (
              <div className="space-y-4" data-section="completed-lessons">
                <button
                  onClick={() => setShowCompleted(!showCompleted)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg hover:from-green-100 hover:to-emerald-100 transition-all border border-green-200 group"
                >
                  <span className="text-lg font-semibold flex items-center gap-2" style={{ color: '#000000' }}>
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    Completed Lessons ({completedLessons.length})
                    <span className="text-sm font-normal text-green-600 bg-green-100 px-2 py-1 rounded-full">
                      {Math.round((completedLessons.length / (completedLessons.length + recentActiveLessons.length + olderActiveLessons.length)) * 100)}% Complete
                    </span>
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500 group-hover:text-gray-700 transition-colors">
                      {showCompleted ? 'Hide' : 'Show All'}
                    </span>
                    <div className={`w-6 h-6 rounded-full bg-green-100 group-hover:bg-green-200 transition-all flex items-center justify-center`}>
                      {showCompleted ? (
                        <ChevronUp className="w-4 h-4 text-green-600" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-green-600" />
                      )}
                    </div>
                  </div>
                </button>

                {/* Show preview of recent completed lessons even when collapsed */}
                {!showCompleted && (
                  <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                        <CheckCircle2 className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Recent Completions</p>
                        <p className="text-sm text-gray-600">Click lesson titles to view, or click above to see all {completedLessons.length} completed lessons</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {completedLessons.slice(0, 3).map((lesson) => (
                        <button
                          key={lesson.id}
                          onClick={() => setSelectedLessonId(lesson.id)}
                          className="px-3 py-1 bg-white rounded-full text-sm font-medium text-gray-700 border border-green-200 hover:bg-green-100 hover:border-green-300 transition-all cursor-pointer"
                          title={`Click to view "${lesson.title}"`}
                        >
                          {lesson.title}
                        </button>
                      ))}
                      {completedLessons.length > 3 && (
                        <button
                          onClick={() => setShowCompleted(true)}
                          className="px-3 py-1 bg-green-100 rounded-full text-sm font-medium text-green-700 hover:bg-green-200 transition-all cursor-pointer"
                          title="Click to view all completed lessons"
                        >
                          +{completedLessons.length - 3} more
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {showCompleted && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {completedLessons.map((lesson) => (
                      <LessonCard
                        key={lesson.id}
                        lesson={lesson}
                        processingLesson={processingLesson}
                        onView={() => setSelectedLessonId(lesson.id)}
                        onToggleCompletion={() => toggleCompletion(lesson.id, lesson.isCompleted)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Message when all lessons are complete */}
            {recentActiveLessons.length === 0 && olderActiveLessons.length === 0 && completedLessons.length > 0 && (
              <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-8 text-white text-center shadow-lg">
                <CheckCircle2 className="w-16 h-16 mx-auto mb-4" />
                <h3 className="text-2xl font-bold mb-2">All Caught Up! 🎉</h3>
                <p className="text-green-50">
                  You've completed all your lessons. Great work! Check back for new content from your coach.
                </p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Lesson Overlay */}
      {selectedLessonId && (
        <LessonOverlay
          lessonId={selectedLessonId}
          onClose={() => setSelectedLessonId(null)}
          isCompleted={lessons.find(l => l.id === selectedLessonId)?.isCompleted}
          onToggleCompletion={() => {
            const lesson = lessons.find(l => l.id === selectedLessonId)
            if (lesson) {
              toggleCompletion(lesson.id, lesson.isCompleted)
            }
          }}
        />
      )}

      {/* Video Overlay */}
      {selectedVideo && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-xl font-semibold" style={{ color: '#000000' }}>
                {selectedVideo.title}
              </h3>
              <button
                onClick={() => setSelectedVideo(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" style={{ color: '#000000' }} />
              </button>
            </div>
            
            <div className="p-4">
              {/* Video Player */}
              <div className="mb-4">
                {selectedVideo.source === 'youtube' && selectedVideo.url ? (
                  <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                    <iframe
                      src={selectedVideo.url.replace('watch?v=', 'embed/')}
                      className="absolute top-0 left-0 w-full h-full rounded-lg"
                      allowFullScreen
                      title={selectedVideo.title}
                    />
                  </div>
                ) : selectedVideo.source === 'vimeo' && selectedVideo.url ? (
                  <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                    <iframe
                      src={selectedVideo.url.replace('vimeo.com/', 'player.vimeo.com/video/')}
                      className="absolute top-0 left-0 w-full h-full rounded-lg"
                      allowFullScreen
                      title={selectedVideo.title}
                    />
                  </div>
                ) : selectedVideo.url ? (
                  <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                    <video
                      controls
                      className="absolute top-0 left-0 w-full h-full rounded-lg bg-black"
                      src={selectedVideo.url}
                      title={selectedVideo.title}
                    >
                      Your browser does not support the video tag.
                    </video>
                  </div>
                ) : (
                  <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                    <p className="text-gray-500">Video not available</p>
                  </div>
                )}
              </div>

              {/* Video Info */}
              <div className="space-y-3">
                {selectedVideo.description && (
                  <p className="text-gray-700">{selectedVideo.description}</p>
                )}
                
                <div className="flex flex-wrap gap-2">
                  {selectedVideo.sport && (
                    <span className="px-3 py-1 rounded-full text-sm" style={{ backgroundColor: '#FF6B35', color: 'white' }}>
                      {selectedVideo.sport}
                    </span>
                  )}
                  {selectedVideo.duration > 0 && (
                    <span className="px-3 py-1 rounded-full text-sm flex items-center gap-1" style={{ backgroundColor: '#E8E6D8', color: '#000000' }}>
                      <Clock className="w-4 h-4" />
                      {selectedVideo.duration}m
                    </span>
                  )}
                  {selectedVideo.createdDate && (
                    <span className="px-3 py-1 rounded-full text-sm" style={{ backgroundColor: '#E8E6D8', color: '#000000' }}>
                      {selectedVideo.createdDate}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lesson Completion Celebration */}
      <LessonCompletionCelebration
        isOpen={showCelebration}
        onClose={() => setShowCelebration(false)}
        lessonTitle={completedLessonTitle}
        totalCompleted={completedLessons.length}
        onViewCompletedLessons={() => {
          // Close the modal and redirect to main lessons page
          setShowCelebration(false)
          // Send message to parent to navigate to lessons section
          if (isInIframe && window.parent !== window) {
            window.parent.postMessage({ type: 'NAVIGATE_TO_LESSONS' }, '*')
          } else {
            // If not in iframe, just close the modal and stay on lessons page
            setShowCompleted(true)
            setTimeout(() => {
              const element = document.querySelector('[data-section="completed-lessons"]')
              if (element) {
                element.scrollIntoView({ behavior: 'smooth' })
              }
            }, 100)
          }
        }}
        onRequestVideoReview={() => {
          // Close the modal first
          setShowCelebration(false)
          // Send message to parent to navigate to video review
          if (isInIframe && window.parent !== window) {
            window.parent.postMessage({ type: 'NAVIGATE_TO_VIDEO_REVIEW' }, '*')
          } else {
            router.push('/dashboard/athlete/video-reviews')
          }
        }}
        onAskCoach={() => {
          // Close the modal first
          setShowCelebration(false)
          // Send message to parent to navigate to AI assistant
          if (isInIframe && window.parent !== window) {
            window.parent.postMessage({ type: 'NAVIGATE_TO_AI_ASSISTANT' }, '*')
          } else {
            router.push('/dashboard/athlete/ai-assistant')
          }
        }}
      />
    </div>
  )
}
