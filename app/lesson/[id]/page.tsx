'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore'
import { db } from '@/lib/firebase.client'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Play, 
  Eye, 
  Clock, 
  User, 
  Star, 
  BookOpen,
  Video,
  FileText,
  Calendar,
  Target,
  Award
} from 'lucide-react'

interface LessonData {
  id: string
  title: string
  description: string
  longDescription?: string
  level: string
  creatorUid: string
  creatorName?: string
  videoUrl?: string
  thumbnail?: string
  views: number
  createdAt: any
  status: string
  content?: string
  tags?: string[]
}

export default function LessonDetailPage() {
  const params = useParams()
  const lessonId = params.id as string
  
  const [lesson, setLesson] = useState<LessonData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [viewIncremented, setViewIncremented] = useState(false)

  useEffect(() => {
    if (lessonId) {
      fetchLesson()
    }
  }, [lessonId])

  const fetchLesson = async () => {
    try {
      setLoading(true)
      console.log('🔍 Fetching lesson:', lessonId)
      
      const lessonDoc = await getDoc(doc(db, 'content', lessonId))
      
      if (lessonDoc.exists()) {
        const lessonData = {
          id: lessonDoc.id,
          ...lessonDoc.data()
        } as LessonData
        
        setLesson(lessonData)
        
        // Increment view count (only once per session)
        if (!viewIncremented) {
          try {
            await updateDoc(doc(db, 'content', lessonId), {
              views: increment(1)
            })
            setViewIncremented(true)
            // Update local state
            setLesson(prev => prev ? { ...prev, views: (prev.views || 0) + 1 } : null)
          } catch (error) {
            console.warn('Could not increment view count:', error)
          }
        }
      } else {
        setError('Lesson not found')
      }
    } catch (error) {
      console.error('Error fetching lesson:', error)
      setError('Failed to load lesson')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-purple-900">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="text-center py-20">
            <div className="w-16 h-16 border-4 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-white text-lg">Loading lesson...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !lesson) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-purple-900">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <div className="text-red-400 text-2xl">!</div>
            </div>
            <h1 className="text-white text-2xl font-bold mb-2">Lesson Not Found</h1>
            <p className="text-slate-300 mb-6">{error || 'The lesson you are looking for does not exist.'}</p>
            <Link
              href="/lessons"
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors inline-flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Lessons
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-purple-900">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Navigation */}
        <div className="mb-6">
          <Link 
            href="/lessons"
            className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Lessons
          </Link>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Video/Media Section */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-600/30 rounded-2xl overflow-hidden mb-6">
              <div className="aspect-video bg-slate-900 flex items-center justify-center relative">
                {lesson.videoUrl ? (
                  <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                    <div className="text-center">
                      <Play className="w-16 h-16 text-purple-400 mx-auto mb-4" />
                      <p className="text-white text-lg font-medium">Video Content</p>
                      <p className="text-slate-400 text-sm">Click to play video</p>
                    </div>
                  </div>
                ) : lesson.thumbnail ? (
                  <img 
                    src={lesson.thumbnail} 
                    alt={lesson.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center">
                    <BookOpen className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-300 text-lg font-medium">Text-Based Lesson</p>
                    <p className="text-slate-400 text-sm">Educational content below</p>
                  </div>
                )}
              </div>
            </div>

            {/* Lesson Content */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-600/30 rounded-2xl p-8">
              {/* Header */}
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-sm font-medium">
                    {lesson.level}
                  </div>
                  <div className="flex items-center gap-1 text-slate-400 text-sm">
                    <Eye className="w-4 h-4" />
                    {lesson.views || 0} views
                  </div>
                  <div className="flex items-center gap-1 text-slate-400 text-sm">
                    <Clock className="w-4 h-4" />
                    {lesson.createdAt?.toDate ? 
                      lesson.createdAt.toDate().toLocaleDateString() : 
                      lesson.createdAt?.seconds ? 
                      new Date(lesson.createdAt.seconds * 1000).toLocaleDateString() :
                      'Recently'
                    }
                  </div>
                </div>
                
                <h1 className="text-3xl font-bold text-white mb-4">{lesson.title}</h1>
                <p className="text-slate-300 text-lg leading-relaxed">{lesson.description}</p>
              </div>

              {/* Long Description / Content */}
              {(lesson.longDescription || lesson.content) && (
                <div className="mb-8">
                  <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Lesson Content
                  </h2>
                  <div className="prose prose-invert max-w-none">
                    <div className="text-slate-300 leading-relaxed whitespace-pre-wrap">
                      {lesson.longDescription || lesson.content}
                    </div>
                  </div>
                </div>
              )}

              {/* Tags */}
              {lesson.tags && lesson.tags.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-white mb-3">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {lesson.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-slate-700/50 text-slate-300 rounded-full text-sm border border-slate-600/30"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4 pt-6 border-t border-slate-600/30">
                <Link
                  href="/dashboard/coaching"
                  className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                  <User className="w-4 h-4" />
                  Request Coaching
                </Link>
                
                {lesson.creatorUid && (
                  <Link
                    href={`/contributors/${lesson.creatorUid}`}
                    className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                  >
                    <Award className="w-4 h-4" />
                    View Instructor
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Instructor Info */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-600/30 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <User className="w-5 h-5" />
                Instructor
              </h3>
              
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                  {lesson.creatorName?.charAt(0) || 'I'}
                </div>
                <div>
                  <h4 className="font-medium text-white">{lesson.creatorName || 'Instructor'}</h4>
                  <div className="flex items-center gap-1 text-sm text-slate-400">
                    <Star className="w-4 h-4 fill-current text-yellow-400" />
                    <span>4.8 (24 reviews)</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {lesson.creatorUid && (
                  <Link
                    href={`/contributors/${lesson.creatorUid}`}
                    className="block w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors text-center"
                  >
                    View Profile
                  </Link>
                )}
                
                <Link
                  href="/dashboard/coaching"
                  className="block w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors text-center"
                >
                  Request Coaching
                </Link>
              </div>
            </div>

            {/* Lesson Details */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-600/30 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Target className="w-5 h-5" />
                Lesson Details
              </h3>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Level:</span>
                  <span className="text-white font-medium">{lesson.level}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-slate-400">Views:</span>
                  <span className="text-white font-medium">{lesson.views || 0}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-slate-400">Published:</span>
                  <span className="text-white font-medium">
                    {lesson.createdAt?.toDate ? 
                      lesson.createdAt.toDate().toLocaleDateString() : 
                      lesson.createdAt?.seconds ? 
                      new Date(lesson.createdAt.seconds * 1000).toLocaleDateString() :
                      'Recently'
                    }
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-slate-400">Type:</span>
                  <span className="text-white font-medium flex items-center gap-1">
                    {lesson.videoUrl ? (
                      <>
                        <Video className="w-4 h-4" />
                        Video
                      </>
                    ) : (
                      <>
                        <FileText className="w-4 h-4" />
                        Text
                      </>
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Related Lessons */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-600/30 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                More Lessons
              </h3>
              
              <div className="space-y-3">
                <Link
                  href="/lessons"
                  className="block p-3 bg-slate-700/30 hover:bg-slate-700/50 rounded-lg transition-colors"
                >
                  <h4 className="font-medium text-white text-sm mb-1">Browse All Lessons</h4>
                  <p className="text-slate-400 text-xs">Discover more educational content</p>
                </Link>
                
                {lesson.creatorUid && (
                  <Link
                    href={`/lessons?coach=${lesson.creatorUid}`}
                    className="block p-3 bg-slate-700/30 hover:bg-slate-700/50 rounded-lg transition-colors"
                  >
                    <h4 className="font-medium text-white text-sm mb-1">More from this Instructor</h4>
                    <p className="text-slate-400 text-xs">View all lessons by {lesson.creatorName || 'this instructor'}</p>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
