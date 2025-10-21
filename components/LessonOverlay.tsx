'use client'

import { useEffect, useState } from 'react'
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore'
import { db } from '@/lib/firebase.client'
import { X, Eye, Calendar, User, Clock, CheckCircle2, Circle } from 'lucide-react'
import LessonVideoPlayer from '@/components/LessonVideoPlayer'

interface LessonData {
  id: string
  title: string
  description: string
  longDescription?: string
  level: string
  creatorUid: string
  videoUrl?: string
  videoId?: string
  thumbnail?: string
  views: number
  createdAt: any
  status: string
  hasMedia?: boolean
  content?: string
  tags?: string[]
  sections?: Array<{
    title?: string
    content?: string
    videoUrl?: string
  }>
}

interface CreatorProfile {
  displayName: string
  name: string
  bio?: string
  avatar?: string
  profileImageUrl?: string
}

interface LessonOverlayProps {
  lessonId: string
  onClose: () => void
  isCompleted?: boolean
  onToggleCompletion?: () => void
}

export default function LessonOverlay({
  lessonId,
  onClose,
  isCompleted = false,
  onToggleCompletion
}: LessonOverlayProps) {
  const [lesson, setLesson] = useState<LessonData | null>(null)
  const [creator, setCreator] = useState<CreatorProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewsIncremented, setViewsIncremented] = useState(false)

  useEffect(() => {
    fetchLesson()
    // Prevent body scroll when overlay is open
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [lessonId])

  const fetchLesson = async () => {
    try {
      setLoading(true)
      console.log('🔍 Fetching lesson:', lessonId)

      // Fetch lesson data
      const lessonDoc = await getDoc(doc(db, 'content', lessonId))

      if (!lessonDoc.exists()) {
        setError('Lesson not found')
        return
      }

      const lessonData = { id: lessonDoc.id, ...lessonDoc.data() } as LessonData

      // Check if lesson is published
      if (lessonData.status && lessonData.status !== 'published') {
        setError('This lesson is not available')
        return
      }

      setLesson(lessonData)

      // Fetch creator profile
      if (lessonData.creatorUid) {
        try {
          const creatorDoc = await getDoc(doc(db, 'creator_profiles', lessonData.creatorUid))
          if (creatorDoc.exists()) {
            setCreator(creatorDoc.data() as CreatorProfile)
          }
        } catch (creatorError) {
          console.warn('Could not fetch creator profile:', creatorError)
        }
      }

      // Increment view count (only once per session)
      if (!viewsIncremented) {
        try {
          await updateDoc(doc(db, 'content', lessonId), {
            views: increment(1)
          })
          setViewsIncremented(true)
        } catch (viewError) {
          console.warn('Could not increment view count:', viewError)
        }
      }

    } catch (error) {
      console.error('Error fetching lesson:', error)
      setError('Failed to load lesson. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [onClose])

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-fadeIn"
        onClick={onClose}
      />

      {/* Overlay Panel */}
      <div className="fixed inset-y-0 right-0 w-full sm:w-[90%] md:w-[80%] lg:w-[70%] xl:w-[60%] bg-white z-50 shadow-2xl animate-slideInRight overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-gradient-to-r from-blue-500/10 to-teal-500/10 backdrop-blur-sm border-b border-blue-200/50 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold" style={{ color: '#000000' }}>
              Lesson Details
            </h2>
            <div className="flex items-center gap-3">
              {onToggleCompletion && (
                <button
                  onClick={onToggleCompletion}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                    isCompleted
                      ? 'bg-teal-500 hover:bg-teal-600 text-white'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  {isCompleted ? (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      <span>Completed</span>
                    </>
                  ) : (
                    <>
                      <Circle className="w-5 h-5" />
                      <span>Mark as Complete</span>
                    </>
                  )}
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
                title="Close (Esc)"
              >
                <X className="w-6 h-6" style={{ color: '#000000' }} />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading && (
            <div className="text-center py-20">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p style={{ color: '#000000', opacity: 0.7 }}>Loading lesson...</p>
            </div>
          )}

          {error && !loading && (
            <div className="text-center py-20">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#FF6B35' }}>
                <div className="text-white text-2xl">!</div>
              </div>
              <h3 className="text-xl mb-2" style={{ color: '#000000' }}>Error Loading Lesson</h3>
              <p style={{ color: '#000000', opacity: 0.6 }}>{error}</p>
            </div>
          )}

          {!loading && !error && lesson && (
            <>
              {/* Lesson Header */}
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4 flex-wrap">
                  <div className="px-3 py-1 rounded-full text-sm font-medium" style={{ backgroundColor: '#3B82F6', color: 'white' }}>
                    {lesson.level}
                  </div>
                  <div className="flex items-center gap-1 text-sm" style={{ color: '#000000', opacity: 0.6 }}>
                    <Eye className="w-4 h-4" />
                    {lesson.views || 0} views
                  </div>
                  <div className="flex items-center gap-1 text-sm" style={{ color: '#000000', opacity: 0.6 }}>
                    <Calendar className="w-4 h-4" />
                    {lesson.createdAt?.toDate
                      ? lesson.createdAt.toDate().toLocaleDateString()
                      : lesson.createdAt?.seconds
                      ? new Date(lesson.createdAt.seconds * 1000).toLocaleDateString()
                      : 'Recently'}
                  </div>
                </div>

                <h1 className="text-3xl sm:text-4xl mb-4 font-bold" style={{ color: '#000000' }}>
                  {lesson.title}
                </h1>

                {creator && (
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center" style={{ backgroundColor: '#3B82F6' }}>
                      {creator.profileImageUrl || creator.avatar ? (
                        <img
                          src={creator.profileImageUrl || creator.avatar}
                          alt={creator.displayName || creator.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-5 h-5 text-white" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm" style={{ color: '#000000', opacity: 0.6 }}>By</p>
                      <p className="font-medium" style={{ color: '#000000' }}>
                        {creator.displayName || creator.name}
                      </p>
                    </div>
                  </div>
                )}

                <p className="text-lg leading-relaxed" style={{ color: '#000000', opacity: 0.7 }}>
                  {lesson.description}
                </p>
              </div>

              {/* Lesson Content */}
              <div className="bg-gradient-to-br from-blue-50/50 to-white rounded-xl border border-blue-200/50 p-6 sm:p-8">
                {/* Video Player */}
                {(lesson.videoUrl || lesson.videoId) && (
                  <div className="mb-6">
                    <LessonVideoPlayer
                      videoUrl={lesson.videoUrl}
                      videoId={lesson.videoId}
                      title={lesson.title}
                    />
                  </div>
                )}

                {/* Text-only lesson indicator */}
                {!lesson.videoUrl && !lesson.videoId && (
                  <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-teal-50 rounded-xl border-2 border-blue-200">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#3B82F6' }}>
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-medium" style={{ color: '#000000' }}>Text-Based Lesson</h4>
                        <p className="text-sm" style={{ color: '#000000', opacity: 0.6 }}>
                          This lesson focuses on written content and detailed explanations
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Long Description */}
                {lesson.longDescription && (
                  <div className="mb-6">
                    <h3 className="text-2xl font-bold mb-4" style={{ color: '#000000' }}>
                      Lesson Details
                    </h3>
                    <div className="text-lg leading-relaxed whitespace-pre-wrap" style={{ color: '#000000', opacity: 0.8 }}>
                      {lesson.longDescription}
                    </div>
                  </div>
                )}

                {/* Content */}
                {lesson.content && (
                  <div className="mb-6">
                    <h3 className="text-2xl font-bold mb-4" style={{ color: '#000000' }}>
                      Lesson Content
                    </h3>
                    <div className="text-lg leading-relaxed whitespace-pre-wrap" style={{ color: '#000000', opacity: 0.8 }}>
                      {lesson.content}
                    </div>
                  </div>
                )}

                {/* Sections */}
                {lesson.sections && lesson.sections.length > 0 && lesson.sections.map((section, index) => (
                  <div key={index} className="mb-6">
                    {section.title && (
                      <h3 className="text-2xl font-bold mb-4" style={{ color: '#000000' }}>
                        {section.title}
                      </h3>
                    )}
                    {section.content && (
                      <div className="text-lg leading-relaxed whitespace-pre-wrap mb-4" style={{ color: '#000000', opacity: 0.8 }}>
                        {section.content}
                      </div>
                    )}
                    {section.videoUrl && (
                      <div className="mt-4">
                        <LessonVideoPlayer
                          videoUrl={section.videoUrl}
                          title={section.title || `Section ${index + 1}`}
                        />
                      </div>
                    )}
                  </div>
                ))}

                {/* No content message */}
                {!lesson.longDescription && !lesson.content && !lesson.videoUrl && !lesson.videoId && (!lesson.sections || lesson.sections.length === 0) && (
                  <div className="p-6 bg-blue-50 rounded-xl border border-blue-200 text-center">
                    <p className="text-lg" style={{ color: '#000000', opacity: 0.7 }}>
                      📝 This lesson is still being prepared. Check back soon for the full content!
                    </p>
                  </div>
                )}

                {/* Tags */}
                {lesson.tags && lesson.tags.length > 0 && (
                  <div className="mt-8 pt-6 border-t border-blue-200">
                    <h4 className="text-sm font-medium mb-3" style={{ color: '#000000' }}>Tags</h4>
                    <div className="flex flex-wrap gap-2">
                      {lesson.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 rounded-full text-sm"
                          style={{ backgroundColor: '#3B82F6', color: 'white' }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideInRight {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }

        .animate-slideInRight {
          animation: slideInRight 0.3s ease-out;
        }
      `}</style>
    </>
  )
}
