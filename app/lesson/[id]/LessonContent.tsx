'use client'

import { useEffect, useState, Suspense } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { doc, getDoc, updateDoc, increment, writeBatch } from 'firebase/firestore'
import { db } from '@/lib/firebase.client'
import Link from 'next/link'
import { ArrowLeft, Play, Clock, Eye, User, Calendar, ExternalLink } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import AppHeader from '@/components/ui/AppHeader'
import LessonVideoPlayer from '@/components/LessonVideoPlayer'
import LessonPreview from '@/components/LessonPreview'

interface LessonData {
 id: string
 title: string
 description: string
 longDescription?: string
 level: string
 creatorUid: string
 videoUrl?: string // YouTube URL or direct video URL
 videoId?: string // GCS video ID for uploaded videos
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

export default function LessonContent() {
 const router = useRouter()
 const params = useParams()
 const { user } = useAuth()
 const lessonId = params?.id as string

 const [lesson, setLesson] = useState<LessonData | null>(null)
 const [creator, setCreator] = useState<CreatorProfile | null>(null)
 const [loading, setLoading] = useState(true)
 const [error, setError] = useState<string | null>(null)
 const [viewsIncremented, setViewsIncremented] = useState(false)
 const [isCompleted, setIsCompleted] = useState(false)
 const [isMarking, setIsMarking] = useState(false)

 // If user is not authenticated, show preview mode
 if (!user) {
  return <LessonPreview lessonId={lessonId} />
 }

 useEffect(() => {
  if (lessonId) {
   fetchLesson()
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
   
   // Increment view count and mark lesson as started (only once per session)
   if (!viewsIncremented) {
    try {
     // Increment view count
     await updateDoc(doc(db, 'content', lessonId), {
      views: increment(1)
     })
     
     // Mark lesson as started for this athlete (if authenticated)
     if (user?.uid) {
      try {
       const token = await user.getIdToken()
       await fetch('/api/athlete/progress/start', {
        method: 'POST',
        headers: {
         'Authorization': `Bearer ${token}`,
         'Content-Type': 'application/json'
        },
        body: JSON.stringify({ lessonId })
       })
      } catch (startError) {
       console.warn('Could not mark lesson as started:', startError)
      }
     }
     
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


 if (loading) {
  return (
   <div className="min-h-screen bg-gradient-to-br from-cream via-cream to-sky-blue/10">
    <AppHeader />
    <div className="max-w-4xl mx-auto px-6 py-8">
     <div className="text-center py-20">
      <div className="w-16 h-16 border-4 border-sky-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-dark/60 text-lg">Loading lesson...</p>
     </div>
    </div>
   </div>
  )
 }

 if (error || !lesson) {
  return (
   <div className="min-h-screen bg-gradient-to-br from-cream via-cream to-sky-blue/10">
    <AppHeader />
    <div className="max-w-4xl mx-auto px-6 py-8">
     <div className="text-center py-20">
      <div className="w-16 h-16 bg-cardinal/10 rounded-full flex items-center justify-center mx-auto mb-4">
       <div className="text-cardinal text-2xl">!</div>
      </div>
      <h1 className="text-dark text-2xl font-heading mb-2">Lesson Not Found</h1>
      <p className="text-dark/60 mb-6">{error || 'This lesson could not be found.'}</p>
      <Link
       href="/lessons"
       className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-sky-blue to-black text-white rounded-xl hover:opacity-90 transition-opacity"
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
  <div className="min-h-screen bg-gradient-to-br from-cream via-cream to-sky-blue/10">
   <AppHeader />
   <div className="max-w-4xl mx-auto px-6 py-8">
    {/* Back Button */}
    <button
     onClick={() => router.back()}
     className="mb-6 inline-flex items-center gap-2 text-dark/60 hover:text-dark transition-colors"
    >
     <ArrowLeft className="w-5 h-5" />
     Back
    </button>

    {/* Lesson Header */}
    <div className="mb-8">
     <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
       <div className="px-3 py-1 rounded-full text-sm font-bold text-white" style={{ backgroundColor: lesson.level === 'intermediate' ? '#0A66C2' : lesson.level === 'advanced' ? '#FC0105' : '#00A651' }}>
        {lesson.level}
       </div>
       <div className="flex items-center gap-1 text-dark/60 text-sm">
        <Eye className="w-4 h-4" />
        {lesson.views || 0} views
       </div>
       <div className="flex items-center gap-1 text-dark/60 text-sm">
        <Calendar className="w-4 h-4" />
        {lesson.createdAt?.toDate ?
         lesson.createdAt.toDate().toLocaleDateString() :
         lesson.createdAt?.seconds ?
         new Date(lesson.createdAt.seconds * 1000).toLocaleDateString() :
         'Recently'
        }
       </div>
      </div>

      {/* Mark as Complete Button */}
      <button
       onClick={async () => {
        if (!user || isMarking) return
        setIsMarking(true)
        try {
         const token = await user.getIdToken()
         const res = await fetch('/api/athlete/progress/mark-complete', {
          method: 'POST',
          headers: {
           'Content-Type': 'application/json',
           'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ lessonId })
         })
         if (res.ok) {
          setIsCompleted(true)
         }
        } catch (e) {
         console.error('Failed to mark complete:', e)
        } finally {
         setIsMarking(false)
        }
       }}
       disabled={isMarking || isCompleted}
       className="px-4 py-2 rounded-lg font-bold text-white transition-all hover:opacity-90 disabled:opacity-50"
       style={{
        backgroundColor: isCompleted ? '#00A651' : '#FC0105',
        fontFamily: '"Open Sans", sans-serif'
       }}
      >
       {isCompleted ? '✓ Completed' : isMarking ? 'Marking...' : 'Mark as Complete'}
      </button>
     </div>

     <h1 className="text-4xl text-dark font-heading mb-4">{lesson.title}</h1>

     {creator && (
      <div className="flex items-center gap-3 mb-4">
       <div className="w-10 h-10 bg-gradient-to-br from-sky-blue to-black rounded-full overflow-hidden flex items-center justify-center">
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
        <p className="text-sm text-dark/60">By</p>
        <p className="font-medium text-dark">{creator.displayName || creator.name}</p>
       </div>
      </div>
     )}

     <p className="text-dark/60 text-lg leading-relaxed mb-6">{lesson.description}</p>

    </div>

    {/* Lesson Content */}
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-8">
     {/* Only show video player if there's video content */}
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
      <div className="mb-6 p-4 rounded-xl border-2" style={{ backgroundColor: 'rgba(252, 1, 5, 0.05)', borderColor: 'rgba(252, 1, 5, 0.2)' }}>
       <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(to bottom right, #FC0105, #000000)' }}>
         <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
         </svg>
        </div>
        <div>
         <h4 className="text-dark font-medium">Text-Based Lesson</h4>
         <p className="text-dark/60 text-sm">This lesson focuses on written content and detailed explanations</p>
        </div>
       </div>
      </div>
     )}

     {lesson.longDescription && (
      <div className="prose max-w-none mb-6">
       <h3 className="text-2xl font-heading text-dark mb-4">Lesson Details</h3>
       <div className="text-dark/80 text-lg leading-relaxed whitespace-pre-wrap">
        {lesson.longDescription}
       </div>
      </div>
     )}

     {lesson.content && (
      <div className="prose max-w-none mt-6">
       <h3 className="text-2xl font-heading text-dark mb-4">Lesson Content</h3>
       <div className="text-dark/80 text-lg leading-relaxed whitespace-pre-wrap">
        {lesson.content}
       </div>
      </div>
     )}

     {/* Display sections if they exist */}
     {lesson.sections && lesson.sections.length > 0 && lesson.sections.map((section, index) => (
      <div key={index} className="prose max-w-none mt-6">
       {section.title && (
        <h3 className="text-2xl font-heading text-dark mb-4">{section.title}</h3>
       )}
       {section.content && (
        <div className="text-dark/80 text-lg leading-relaxed whitespace-pre-wrap">
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

     {/* Show message if no content is available */}
     {!lesson.longDescription && !lesson.content && !lesson.videoUrl && !lesson.videoId && (!lesson.sections || lesson.sections.length === 0) && (
      <div className="mt-6 p-6 bg-sky-blue/10 rounded-xl border border-sky-blue/20 text-center">
       <p className="text-dark/70 text-lg">
        📝 This lesson is still being prepared. Check back soon for the full content!
       </p>
      </div>
     )}

     {lesson.tags && lesson.tags.length > 0 && (
      <div className="mt-8 pt-6 border-t" style={{ borderColor: 'rgba(0, 0, 0, 0.1)' }}>
       <h4 className="text-sm font-medium text-dark mb-3">Tags</h4>
       <div className="flex flex-wrap gap-2">
        {lesson.tags.map((tag, index) => (
         <span
          key={index}
          className="px-3 py-1 rounded-full text-sm font-semibold"
          style={{ backgroundColor: 'rgba(252, 1, 5, 0.1)', color: '#FC0105' }}
         >
          {tag}
         </span>
        ))}
       </div>
      </div>
     )}
    </div>

    {/* Related Actions */}
    <div className="mt-8 flex flex-col sm:flex-row gap-4">
     <Link
      href="/lessons"
      className="flex-1 sm:flex-none px-6 py-3 text-white rounded-xl text-center hover:opacity-90 transition-opacity font-bold"
      style={{ background: 'linear-gradient(to right, #FC0105, #000000)', fontFamily: '"Open Sans", sans-serif' }}
     >
      Browse More Lessons
     </Link>
     {creator && (
      <Link
       href={`/lessons?coach=${lesson.creatorUid}`}
       className="flex-1 sm:flex-none px-6 py-3 bg-white/80 backdrop-blur-sm text-dark border-2 border-black rounded-xl text-center hover:bg-white transition-colors font-bold"
       style={{ fontFamily: '"Open Sans", sans-serif' }}
      >
       More from {creator.displayName || creator.name}
      </Link>
     )}
    </div>
   </div>
  </div>
 )
}
