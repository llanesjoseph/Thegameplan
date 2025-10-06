'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore'
import { db } from '@/lib/firebase.client'
import Link from 'next/link'
import { Play, Clock, Eye, Video, FileVideo, Search, ArrowLeft, ArrowRight } from 'lucide-react'
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
}

function LessonsContent() {
 const router = useRouter()
 const searchParams = useSearchParams()
 const coachFilter = searchParams?.get('coach') || null

 const [lessons, setLessons] = useState<LessonData[]>([])
 const [loading, setLoading] = useState(true)
 const [searchTerm, setSearchTerm] = useState('')
 const [levelFilter, setLevelFilter] = useState('All')
 const [error, setError] = useState<string | null>(null)
 const [coachName, setCoachName] = useState<string>('')

 useEffect(() => {
  fetchPublishedLessons()
 }, [coachFilter])

 const fetchPublishedLessons = async () => {
  try {
   setLoading(true)
   console.log('🔍 Fetching lessons from content collection...', coachFilter ? `filtered by coach: ${coachFilter}` : '')

   // Build query - if coachFilter exists, filter by creatorUid
   let q
   if (coachFilter) {
    q = query(
     collection(db, 'content'),
     where('creatorUid', '==', coachFilter),
     orderBy('createdAt', 'desc')
    )
   } else {
    q = query(
     collection(db, 'content'),
     orderBy('createdAt', 'desc')
    )
   }

   const querySnapshot = await getDocs(q)
   console.log('📊 Total documents found:', querySnapshot.docs.length)

   const fetchedLessons = querySnapshot.docs
    .map(doc => {
     const data = doc.data()
     console.log('📄 Document data:', { id: doc.id, status: data.status, title: data.title, creatorUid: data.creatorUid })
     return {
      id: doc.id,
      ...data
     }
    })
    .filter(lesson => {
     // Include lessons that are published OR don't have a status field (for backward compatibility)
     return !(lesson as any).status || (lesson as any).status === 'published'
    }) as LessonData[]

   setLessons(fetchedLessons)
   console.log('📚 Fetched filtered lessons:', fetchedLessons.length)

   // If no lessons found, provide helpful message but don't set error
   if (fetchedLessons.length === 0) {
    console.log('ℹ️ No lessons found - this is normal for a new platform')
   }

   // If filtering by coach, try to get the coach name
   if (coachFilter && fetchedLessons.length > 0) {
    try {
     // Try to get coach name from creator_profiles
     const profileQuery = query(
      collection(db, 'creator_profiles'),
      where('uid', '==', coachFilter)
     )
     const profileSnapshot = await getDocs(profileQuery)
     if (!profileSnapshot.empty) {
      const profileData = profileSnapshot.docs[0].data()
      setCoachName(profileData.displayName || profileData.name || 'Coach')
     } else {
      setCoachName('Coach')
     }
    } catch (error) {
     console.warn('Could not fetch coach name:', error)
     setCoachName('Coach')
    }
   }
  } catch (error) {
   console.error('Error fetching lessons:', error)

   // Check if it's a permissions error or empty collection (common for new platforms)
   if (error instanceof Error && error.message.includes('Missing or insufficient permissions')) {
    // Instead of showing error, treat as empty state - new platforms often have no content yet
    console.log('ℹ️ No content collection found - treating as empty platform (normal for new deployment)')
    setLessons([]) // Show empty state instead of error
    setError(null) // Don't show error for empty platform
   } else {
    setError('Unable to load training content. Please try again later.')
   }
  } finally {
   setLoading(false)
  }
 }

 const filteredLessons = lessons.filter(lesson => {
  const matchesSearch = lesson.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
             lesson.description.toLowerCase().includes(searchTerm.toLowerCase())
  const matchesLevel = levelFilter === 'All' || lesson.level === levelFilter
  return matchesSearch && matchesLevel
 })

 if (loading) {
  return (
   <div className="min-h-screen bg-gradient-to-br from-cream via-cream to-sky-blue/10">
    <AppHeader />
    <div className="max-w-7xl mx-auto px-6 py-8">
     <div className="text-center py-20">
      <div className="w-16 h-16 border-4 border-sky-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-dark/60 text-lg">Loading lessons...</p>
     </div>
    </div>
   </div>
  )
 }

 if (error) {
  return (
   <div className="min-h-screen bg-gradient-to-br from-cream via-cream to-sky-blue/10">
    <AppHeader />
    <div className="max-w-7xl mx-auto px-6 py-8">
     <div className="text-center py-20">
      <div className="w-16 h-16 bg-cardinal/10 rounded-full flex items-center justify-center mx-auto mb-4">
       <div className="text-cardinal text-2xl">!</div>
      </div>
      <h1 className="text-dark text-2xl font-heading mb-2">Unable to Load Training</h1>
      <p className="text-dark/60 mb-6">{error}</p>
      <div className="space-x-4">
       <button
        onClick={fetchPublishedLessons}
        className="px-6 py-3 bg-gradient-to-r from-sky-blue to-black text-white rounded-xl hover:opacity-90 transition-opacity"
       >
        Try Again
       </button>
       {error.includes('sign in') && (
        <Link
         href="/dashboard"
         className="px-6 py-3 bg-white/80 backdrop-blur-sm text-dark border border-sky-blue/20 rounded-xl hover:bg-white transition-colors"
        >
         Sign In
        </Link>
       )}
      </div>
     </div>
    </div>
   </div>
  )
 }

 return (
  <div className="min-h-screen bg-gradient-to-br from-cream via-cream to-sky-blue/10">
   <AppHeader />
   <div className="max-w-7xl mx-auto px-6 py-8">
    {/* Back Button */}
    <button
     onClick={() => router.back()}
     className="mb-6 inline-flex items-center gap-2 text-dark/60 hover:text-dark transition-colors"
    >
     <ArrowLeft className="w-5 h-5" />
     Back
    </button>

    {/* Header */}
    <div className="mb-8">
     {coachFilter && (
      <Link href="/lessons" className="inline-flex items-center gap-2 text-sky-blue hover:text-black mb-4 transition-colors">
       <ArrowLeft className="w-4 h-4" />
       Back to All Training
      </Link>
     )}
     <h1 className="text-4xl text-dark font-heading mb-2">
      {coachFilter ? `${coachName}'s Training` : lessons.length === 0 ? 'Training Platform' : 'Browse Training'}
     </h1>
     <p className="text-dark/60">
      {coachFilter
       ? `Discover training content created by ${coachName}`
       : lessons.length === 0
       ? 'Your journey to athletic excellence starts here. Elite training content is coming soon!'
       : 'Discover training content created by our community of coaches'
      }
     </p>
    </div>

    {/* Filters - Only show when there are lessons */}
    {lessons.length > 0 && (
     <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-6 mb-8">
      <div className="flex flex-col md:flex-row gap-4">
       {/* Search */}
       <div className="flex-1 relative">
        <Search className="w-5 h-5 text-dark/60 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
         type="text"
         placeholder="Search lessons..."
         value={searchTerm}
         onChange={(e) => setSearchTerm(e.target.value)}
         className="w-full bg-white border-2 border-sky-blue/20 rounded-xl pl-10 pr-4 py-3 text-dark placeholder-dark/50 focus:border-sky-blue focus:ring-4 focus:ring-sky-blue/20 transition-all"
        />
       </div>

       {/* Level Filter */}
       <div className="min-w-[200px]">
        <select
         value={levelFilter}
         onChange={(e) => setLevelFilter(e.target.value)}
         className="w-full bg-white border-2 border-sky-blue/20 rounded-xl px-4 py-3 text-dark focus:border-sky-blue focus:ring-4 focus:ring-sky-blue/20 transition-all"
        >
         <option value="All">All Levels</option>
         <option value="Beginner">Beginner</option>
         <option value="Intermediate">Intermediate</option>
         <option value="Advanced">Advanced</option>
        </select>
       </div>
      </div>
     </div>
    )}

    {/* Results */}
    {filteredLessons.length === 0 ? (
     <div className="space-y-8">
      {/* Coming Soon Message */}
      <div className="bg-gradient-to-r from-cardinal to-cardinal-dark rounded-lg p-8 text-center text-white">
       <div className="max-w-2xl mx-auto">
        <div className="text-6xl mb-4">⚽</div>
        <h3 className="text-2xl mb-3">
         Welcome to the Future of Athletic Training!
        </h3>
        <p className="text-lg opacity-90">
         Our platform is currently in the starting lineup. Expert coaches and world-class training content are warming up behind the scenes. Get ready for game-changing lessons!
        </p>
       </div>
      </div>

      {/* Preview of What's Coming */}
      <div>
       <h4 className="text-xl  text-gray-800 mb-6 text-center">
        Preview: What You Can Expect
       </h4>
       <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Sample Preview Cards */}
        {[
         {
          title: "Advanced Ball Control Techniques",
          coach: "Expert Soccer Coach",
          level: "Intermediate",
          sport: "Soccer",
          description: "Master the essential skills of ball control with proven drills and techniques."
         },
         {
          title: "Mental Resilience Training",
          coach: "Sports Psychology Expert",
          level: "All Levels",
          sport: "Mental",
          description: "Develop the mental fortitude to perform under pressure and overcome challenges."
         },
         {
          title: "Tactical Awareness Workshop",
          coach: "Professional Coach",
          level: "Advanced",
          sport: "Soccer",
          description: "Learn to read the game and position yourself for maximum impact on the field."
         }
        ].map((preview, index) => (
         <div
          key={index}
          className="bg-white border border-gray-200 rounded-lg p-6 shadow-card opacity-75"
         >
          {/* Preview Badge */}
          <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg mb-4 flex items-center justify-center border-2 border-dashed border-gray-300">
           <div className="text-center">
            <Play className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <span className="text-gray-500 text-sm ">Coming Soon</span>
           </div>
          </div>

          <div>
           <div className="flex items-center gap-2 mb-2">
            <div className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs ">
             {preview.level}
            </div>
            <div className="px-2 py-1 bg-cardinal/10 text-cardinal rounded text-xs ">
             {preview.sport}
            </div>
           </div>

           <h3 className="text-lg  text-gray-800 mb-2">
            {preview.title}
           </h3>

           <p className="text-gray-600 text-sm mb-3">
            {preview.description}
           </p>

           <div className="text-xs text-gray-500">
            by {preview.coach}
           </div>
          </div>
         </div>
        ))}
       </div>
      </div>

      {/* Become a Coach CTA */}
      <div className="text-center mt-12">
       <Link
        href="/contributors"
        className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
        style={{color: '#8D9440'}}
       >
        <span className="text-lg font-semibold">Become a Coach</span>
        <ArrowRight className="w-5 h-5" />
       </Link>
      </div>
     </div>
    ) : (
     <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {filteredLessons.map((lesson) => (
       <Link
        key={lesson.id}
        href={`/lesson/${lesson.id}`}
        className="group bg-white/80 backdrop-blur-sm border-2 border-sky-blue/20 rounded-2xl p-6 shadow-lg hover:shadow-xl transition duration-300 hover:scale-[1.02] hover:border-sky-blue"
       >
        {/* Lesson Preview */}
        <div className="aspect-video bg-gradient-to-br from-sky-blue/10 to-cream rounded-xl mb-4 flex items-center justify-center border-2 border-sky-blue/20 relative overflow-hidden">
         {lesson.videoUrl || lesson.thumbnail ? (
          <div className="w-full h-full bg-gradient-to-br from-sky-blue/20 to-black/20 rounded-xl flex items-center justify-center">
           <Play className="w-12 h-12 text-sky-blue group-hover:text-black transition-colors" />
          </div>
         ) : (
          <div className="flex flex-col items-center">
           <FileVideo className="w-12 h-12 text-dark/40 mb-2" />
           <span className="text-dark/60 text-sm">Text Content</span>
          </div>
         )}
         
         {/* Media Indicator */}
         <div className="absolute top-3 right-3 flex flex-col gap-1">
          {lesson.hasMedia ? (
           <div className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs">
            <Video className="w-3 h-3 inline mr-1" />
            Video
           </div>
          ) : (
           <div className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">
            <FileVideo className="w-3 h-3 inline mr-1" />
            Text
           </div>
          )}

         </div>
        </div>

        {/* Lesson Info */}
        <div>
         <div className="flex items-center gap-2 mb-2">
          <div className="px-2 py-1 bg-sky-blue/20 text-sky-blue rounded-full text-xs font-medium">
           {lesson.level}
          </div>
          <div className="text-dark/60 text-xs flex items-center gap-1">
           <Eye className="w-3 h-3" />
           {lesson.views || 0}
          </div>
         </div>

         <h3 className="text-lg font-medium text-dark mb-2 group-hover:text-sky-blue transition-colors line-clamp-2">
          {lesson.title}
         </h3>

         <p className="text-dark/60 text-sm mb-3 line-clamp-3">
          {lesson.description}
         </p>

         <div className="flex items-center justify-between text-xs text-dark/60">
          <div className="flex items-center gap-1">
           <Clock className="w-3 h-3" />
           {lesson.createdAt?.toDate ?
            lesson.createdAt.toDate().toLocaleDateString() :
            lesson.createdAt?.seconds ?
            new Date(lesson.createdAt.seconds * 1000).toLocaleDateString() :
            'Recently'
           }
          </div>
          <div className="text-sky-blue group-hover:text-black transition-colors font-medium">
           View Lesson →
          </div>
         </div>
        </div>
       </Link>
      ))}
     </div>
    )}

    {/* Stats */}
    {filteredLessons.length > 0 && (
     <div className="mt-8 text-center">
      <div className="inline-flex items-center gap-4 bg-white/80 backdrop-blur-sm border border-sky-blue/20 rounded-xl px-6 py-3">
       <div className="text-dark/60 text-sm">
        Showing {filteredLessons.length} of {lessons.length} lessons
       </div>
       {searchTerm && (
        <button
         onClick={() => setSearchTerm('')}
         className="text-sky-blue hover:text-black text-sm transition-colors font-medium"
        >
         Clear search
        </button>
       )}
      </div>
     </div>
    )}

   </div>
  </div>
 )
}

export default function LessonsPage() {
 return (
  <Suspense fallback={
   <div className="min-h-screen bg-gradient-to-br from-cream via-cream to-sky-blue/10">
    <AppHeader />
    <div className="max-w-7xl mx-auto px-6 py-8">
     <div className="text-center py-20">
      <div className="w-16 h-16 border-4 border-sky-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-dark/60 text-lg">Loading lessons...</p>
     </div>
    </div>
   </div>
  }>
   <LessonsContent />
  </Suspense>
 )
}