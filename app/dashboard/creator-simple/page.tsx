'use client'

import { useEffect, useState } from 'react'
import { collection, query, getDocs, orderBy, deleteDoc, doc } from 'firebase/firestore'
import { db } from '@/lib/firebase.client'
import { useAuth } from "@/hooks/use-auth"
import Link from 'next/link'
import { 
 Play, 
 Eye,
 Clock,
 Video,
 FileVideo,
 Trash2,
 ExternalLink,
 Plus,
 RefreshCw
} from 'lucide-react'

interface LessonData {
 id: string
 title: string
 description: string
 level: string
 creatorUid: string
 videoUrl?: string
 thumbnail?: string
 views: number
 createdAt: any
 status: string
 hasMedia?: boolean
}

export default function SimpleCreatorDashboard() {
 const { user: authUser } = useAuth()
 const [lessons, setLessons] = useState<LessonData[]>([])
 const [loading, setLoading] = useState(true)

 useEffect(() => {
  fetchAllLessons()
 }, [])

 const fetchAllLessons = async () => {
  setLoading(true)
  try {
   console.log('🔍 Fetching lessons from Firebase...')
   const q = query(collection(db, 'content'), orderBy('createdAt', 'desc'))
   const querySnapshot = await getDocs(q)
   
   const fetchedLessons = querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
   })) as LessonData[]
   
   setLessons(fetchedLessons)
   console.log('✅ Lessons fetched:', fetchedLessons.length)
   console.log('📊 Lessons data:', fetchedLessons)
   
   if (authUser?.uid) {
    const userLessons = fetchedLessons.filter(lesson => lesson.creatorUid === authUser.uid)
    console.log('👤 Your lessons:', userLessons.length)
   }
  } catch (error) {
   console.error('❌ Error fetching lessons:', error)
  } finally {
   setLoading(false)
  }
 }

 const deleteLesson = async (lessonId: string) => {
  if (!confirm('Delete this lesson permanently?')) return
  
  try {
   await deleteDoc(doc(db, 'content', lessonId))
   setLessons(prev => prev.filter(lesson => lesson.id !== lessonId))
   console.log('🗑️ Lesson deleted:', lessonId)
  } catch (error) {
   console.error('❌ Delete failed:', error)
   alert('Failed to delete lesson')
  }
 }

 const userLessons = authUser?.uid 
  ? lessons.filter(lesson => lesson.creatorUid === authUser.uid)
  : []

 return (
  <div className="min-h-screen bg-gray-50 p-6">
   <div className="max-w-6xl mx-auto">
    
    {/* Header */}
    <div className="flex items-center justify-between mb-8">
     <div>
      <h1 className="text-3xl text-gray-900 mb-2">Creator Dashboard</h1>
      <p className="text-gray-600">Manage your educational content</p>
     </div>
     
     <div className="flex gap-4">
      <button
       onClick={fetchAllLessons}
       disabled={loading}
       className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg flex items-center gap-2 transition-colors"
      >
       <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
       Refresh
      </button>
      
      <Link
       href="/dashboard/creator"
       className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center gap-2 transition-colors"
      >
       <Plus className="w-4 h-4" />
       Create Lesson
      </Link>
     </div>
    </div>

    {/* Stats Cards */}
    <div className="grid md:grid-cols-3 gap-6 mb-8">
     <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
      <div className="text-3xl text-blue-600 mb-2">{lessons.length}</div>
      <div className="text-gray-900 font-medium">Total Lessons</div>
      <div className="text-gray-500 text-sm">In database</div>
     </div>
     
     <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
      <div className="text-3xl text-green-600 mb-2">{userLessons.length}</div>
      <div className="text-gray-900 font-medium">Your Lessons</div>
      <div className="text-gray-500 text-sm">{authUser?.uid ? 'Published by you' : 'Sign in to see yours'}</div>
     </div>
     
     <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
      <div className="text-3xl text-purple-600 mb-2">
       {lessons.reduce((total, lesson) => total + (lesson.views || 0), 0)}
      </div>
      <div className="text-gray-900 font-medium">Total Views</div>
      <div className="text-gray-500 text-sm">All lessons combined</div>
     </div>
    </div>

    {/* Debug Info */}
    <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6 shadow-sm">
     <h3 className="text-gray-900 font-medium mb-2">🔍 Debug Info</h3>
     <div className="text-sm space-y-1">
      <div className="text-gray-600">Auth User: {authUser?.uid || 'Not authenticated'}</div>
      <div className="text-gray-600">Email: {authUser?.email || 'No email'}</div>
      <div className="text-gray-600">Loading: {loading ? 'Yes' : 'No'}</div>
      <div className="text-gray-600">Total Lessons Found: {lessons.length}</div>
      <div className="text-gray-600">Your Lessons: {userLessons.length}</div>
     </div>
    </div>

    {/* Lessons List */}
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
     <div className="flex items-center justify-between mb-6">
      <h2 className="text-xl text-gray-900">All Lessons</h2>
      <div className="text-gray-500 text-sm">
       {loading ? 'Loading...' : `${lessons.length} lessons found`}
      </div>
     </div>

     {loading ? (
      <div className="text-center py-12">
       <div className="w-12 h-12 border-4 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
       <p className="text-gray-900">Loading lessons...</p>
      </div>
     ) : lessons.length === 0 ? (
      <div className="text-center py-12">
       <FileVideo className="w-16 h-16 text-gray-400 mx-auto mb-4" />
       <h3 className="text-xl font-semibold text-gray-900 mb-2">No lessons found</h3>
       <p className="text-gray-600 mb-6">Check your Firebase connection</p>
       <button
        onClick={fetchAllLessons}
        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
       >
        Try Again
       </button>
      </div>
     ) : (
      <div className="space-y-4">
       {lessons.map((lesson) => {
        const isYourLesson = authUser?.uid && lesson.creatorUid === authUser.uid
        
        return (
         <div 
          key={lesson.id} 
          className={`border rounded-xl p-4 transition-all hover:bg-gray-50 ${
           isYourLesson 
            ? 'bg-purple-50 border-purple-200' 
            : 'bg-white border-gray-200'
          }`}
         >
          <div className="flex items-start justify-between">
           {/* Lesson Info */}
           <div className="flex-1 min-w-0 mr-4">
            <div className="flex items-center gap-3 mb-2">
             <h3 className="text-lg font-semibold text-gray-900 truncate">
              {lesson.title || 'Untitled'}
             </h3>
             
             <div className="flex items-center gap-2">
              {isYourLesson && (
               <div className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-xs font-medium">
                YOUR LESSON
               </div>
              )}
              
              <div className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs font-medium">
               {lesson.level || 'No Level'}
              </div>
              
              <div className={`px-2 py-1 rounded text-xs font-medium ${
               lesson.status === 'published' 
                ? 'bg-green-500/20 text-green-400' 
                : 'bg-yellow-500/20 text-yellow-400'
              }`}>
               {lesson.status || 'published'}
              </div>
             </div>
            </div>
            
            <p className="text-gray-600 text-sm mb-3">
             {lesson.description || 'No description'}
            </p>
            
            <div className="flex items-center gap-4 text-xs text-gray-500">
             <div className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              {lesson.views || 0} views
             </div>
             
             <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {lesson.createdAt?.toDate?.() ? 
               lesson.createdAt.toDate().toLocaleDateString() : 
               lesson.createdAt?.seconds ? 
               new Date(lesson.createdAt.seconds * 1000).toLocaleDateString() :
               'No date'
              }
             </div>
             
             <div className="flex items-center gap-1">
              {lesson.hasMedia || lesson.videoUrl ? (
               <>
                <Video className="w-3 h-3 text-green-600" />
                <span className="text-green-600">Has Media</span>
               </>
              ) : (
               <>
                <FileVideo className="w-3 h-3" />
                <span>Text Only</span>
               </>
              )}
             </div>
             
             <div className="text-gray-400 font-mono text-xs">
              ID: {lesson.id}
             </div>
             
             <div className="text-gray-400 font-mono text-xs">
              Creator: {lesson.creatorUid}
             </div>
            </div>
           </div>

           {/* Actions */}
           <div className="flex items-center gap-2">
            <Link
             href={`/lesson/${lesson.id}`}
             className="p-2 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-lg transition-colors"
             title="View Lesson"
            >
             <ExternalLink className="w-4 h-4" />
            </Link>
            
            {isYourLesson && (
             <button
              onClick={() => deleteLesson(lesson.id)}
              className="p-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-colors"
              title="Delete Lesson"
             >
              <Trash2 className="w-4 h-4" />
             </button>
            )}
           </div>
          </div>
         </div>
        )
       })}
      </div>
     )}
    </div>

    {/* Quick Actions */}
    <div className="mt-8 grid md:grid-cols-3 gap-4">
     <Link
      href="/lessons"
      className="p-4 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl transition-colors shadow-sm"
     >
      <h3 className="text-gray-900 font-medium mb-2">Browse All Lessons</h3>
      <p className="text-gray-500 text-sm">See public lesson catalog</p>
     </Link>
     
     <Link
      href="/dashboard/creator"
      className="p-4 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl transition-colors shadow-sm"
     >
      <h3 className="text-gray-900 font-medium mb-2">Create New Lesson</h3>
      <p className="text-gray-500 text-sm">Full creation studio</p>
     </Link>
     
     <button
      onClick={() => window.location.reload()}
      className="p-4 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl transition-colors shadow-sm text-left"
     >
      <h3 className="text-gray-900 font-medium mb-2">Reload Page</h3>
      <p className="text-gray-500 text-sm">Refresh everything</p>
     </button>
    </div>
   </div>
  </div>
 )
}