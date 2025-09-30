'use client'

import { useEffect, useState, Suspense } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore'
import { db } from '@/lib/firebase.client'
import Link from 'next/link'
import { ArrowLeft, Play, Clock, Eye, User, Calendar, ExternalLink } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import AppHeader from '@/components/ui/AppHeader'

interface LessonData {
 id: string
 title: string
 description: string
 longDescription?: string
 level: string
 creatorUid: string
 videoUrl?: string
 thumbnail?: string
 views: number
 createdAt: any
 status: string
 hasMedia?: boolean
 content?: string
 tags?: string[]
}

interface CreatorProfile {
 displayName: string
 name: string
 bio?: string
 avatar?: string
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
     <div className="flex items-center gap-2 mb-4">
      <div className="px-3 py-1 bg-sky-blue/20 text-sky-blue rounded-full text-sm font-medium">
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

     <h1 className="text-4xl text-dark font-heading mb-4">{lesson.title}</h1>

     {creator && (
      <div className="flex items-center gap-3 mb-4">
       <div className="w-10 h-10 bg-gradient-to-br from-sky-blue to-black rounded-full flex items-center justify-center">
        <User className="w-5 h-5 text-white" />
       </div>
       <div>
        <p className="font-medium text-dark">{creator.displayName || creator.name}</p>
        {creator.bio && (
         <p className="text-sm text-dark/60">{creator.bio}</p>
        )}
       </div>
      </div>
     )}

     <p className="text-dark/60 text-lg leading-relaxed mb-6">{lesson.description}</p>

    </div>

    {/* Lesson Content */}
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-8">
     {lesson.videoUrl ? (
      <div className="aspect-video bg-gradient-to-br from-sky-blue/10 to-cream rounded-xl mb-6 flex items-center justify-center border-2 border-sky-blue/20">
       <div className="text-center">
        <Play className="w-16 h-16 text-sky-blue mx-auto mb-4" />
        <p className="text-dark/60">Video content would be displayed here</p>
        <p className="text-sm text-dark/50 mt-2">Video URL: {lesson.videoUrl}</p>
       </div>
      </div>
     ) : (
      <div className="aspect-video bg-gradient-to-br from-sky-blue/10 to-cream rounded-xl mb-6 flex items-center justify-center border-2 border-sky-blue/20">
       <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-sky-blue to-black rounded-full flex items-center justify-center mx-auto mb-4">
         <Play className="w-8 h-8 text-white" />
        </div>
        <p className="text-dark/60">Text-based lesson content</p>
       </div>
      </div>
     )}
     
     {lesson.longDescription && (
      <div className="prose max-w-none">
       <h3 className="text-xl font-heading text-dark mb-4">Lesson Details</h3>
       <div className="text-dark/70 leading-relaxed whitespace-pre-wrap">
        {lesson.longDescription}
       </div>
      </div>
     )}

     {lesson.content && (
      <div className="prose max-w-none mt-6">
       <h3 className="text-xl font-heading text-dark mb-4">Content</h3>
       <div className="text-dark/70 leading-relaxed whitespace-pre-wrap">
        {lesson.content}
       </div>
      </div>
     )}

     {lesson.tags && lesson.tags.length > 0 && (
      <div className="mt-8 pt-6 border-t border-sky-blue/20">
       <h4 className="text-sm font-medium text-dark mb-3">Tags</h4>
       <div className="flex flex-wrap gap-2">
        {lesson.tags.map((tag, index) => (
         <span
          key={index}
          className="px-3 py-1 bg-sky-blue/20 text-sky-blue rounded-full text-sm"
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
      className="flex-1 sm:flex-none px-6 py-3 bg-gradient-to-r from-sky-blue to-black text-white rounded-xl text-center hover:opacity-90 transition-opacity font-medium"
     >
      Browse More Lessons
     </Link>
     {creator && (
      <Link
       href={`/lessons?coach=${lesson.creatorUid}`}
       className="flex-1 sm:flex-none px-6 py-3 bg-white/80 backdrop-blur-sm text-dark border border-sky-blue/20 rounded-xl text-center hover:bg-white transition-colors font-medium"
      >
       More from {creator.displayName || creator.name}
      </Link>
     )}
    </div>
   </div>
  </div>
 )
}
