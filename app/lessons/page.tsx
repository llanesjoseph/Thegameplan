'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore'
import { db } from '@/lib/firebase.client'
import Link from 'next/link'
import { Play, Clock, Eye, Video, FileVideo, Search, ArrowLeft } from 'lucide-react'

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
          return !lesson.status || lesson.status === 'published'
        }) as LessonData[]
      
      setLessons(fetchedLessons)
      console.log('📚 Fetched filtered lessons:', fetchedLessons.length)
      
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
      setError('Failed to load lessons. Please try again.')
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
      <div className="min-h-screen bg-white pt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center py-20">
            <div className="w-16 h-16 border-4 border-cardinal border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 text-lg">Loading lessons...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white pt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <div className="text-red-600 text-2xl">!</div>
            </div>
            <h1 className="text-gray-800 text-2xl font-bold mb-2">Error Loading Lessons</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <button 
              onClick={fetchPublishedLessons}
              className="px-6 py-3 bg-cardinal hover:bg-cardinal-dark text-white rounded-lg font-medium transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white pt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          {coachFilter && (
            <Link href="/lessons" className="inline-flex items-center gap-2 text-cardinal hover:text-cardinal-dark mb-4 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Back to All Lessons
            </Link>
          )}
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            {coachFilter ? `${coachName}'s Lessons` : 'Browse Lessons'}
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            {coachFilter 
              ? `Discover educational content created by ${coachName}`
              : 'Discover educational content created by our community of instructors'
            }
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8 shadow-card">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="w-5 h-5 text-gray-600 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search lessons..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-lg pl-10 pr-4 py-3 text-gray-800 placeholder-gray-500 focus:border-cardinal focus:outline-none focus:ring-2 focus:ring-cardinal/20 transition"
              />
            </div>
            
            {/* Level Filter */}
            <div className="min-w-[200px]">
              <select
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-800 focus:border-cardinal focus:outline-none focus:ring-2 focus:ring-cardinal/20 transition"
              >
                <option value="All">All Levels</option>
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results */}
        {filteredLessons.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg p-8 text-center shadow-card">
            <div className="text-center py-12">
              <FileVideo className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                {lessons.length === 0 ? 'No lessons published yet' : 'No lessons match your search'}
              </h3>
              <p className="text-gray-600">
                {lessons.length === 0 
                  ? 'Be the first to create and publish content!'
                  : 'Try adjusting your search terms or filters'
                }
              </p>
            </div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredLessons.map((lesson) => (
              <Link
                key={lesson.id}
                href={`/lesson/${lesson.id}`}
                className="group bg-white border border-gray-200 rounded-lg p-6 shadow-card hover:shadow-card-md transition duration-300 hover:scale-[1.02]"
              >
                {/* Lesson Preview */}
                <div className="aspect-video bg-gray-100 rounded-lg mb-4 flex items-center justify-center border border-gray-200 relative overflow-hidden">
                  {lesson.videoUrl || lesson.thumbnail ? (
                    <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center">
                      <Play className="w-12 h-12 text-cardinal group-hover:text-cardinal-dark transition-colors" />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <FileVideo className="w-12 h-12 text-gray-500 mb-2" />
                      <span className="text-gray-500 text-sm">Text Content</span>
                    </div>
                  )}
                  
                  {/* Media Indicator */}
                  <div className="absolute top-3 right-3">
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
                    <div className="px-2 py-1 bg-cardinal/10 text-cardinal rounded text-xs font-medium">
                      {lesson.level}
                    </div>
                    <div className="text-gray-600 text-xs flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {lesson.views || 0}
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-800 mb-2 group-hover:text-cardinal transition-colors line-clamp-2">
                    {lesson.title}
                  </h3>
                  
                  <p className="text-gray-600 text-sm mb-3 line-clamp-3">
                    {lesson.description}
                  </p>
                  
                  <div className="flex items-center justify-between text-xs text-gray-600">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {lesson.createdAt?.toDate ? 
                        lesson.createdAt.toDate().toLocaleDateString() : 
                        lesson.createdAt?.seconds ? 
                        new Date(lesson.createdAt.seconds * 1000).toLocaleDateString() :
                        'Recently'
                      }
                    </div>
                    <div className="text-cardinal group-hover:text-cardinal-dark transition-colors">
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
            <div className="inline-flex items-center gap-4 bg-slate-800/30 backdrop-blur-sm border border-slate-600/20 rounded-xl px-6 py-3">
              <div className="text-slate-300 text-sm">
                Showing {filteredLessons.length} of {lessons.length} lessons
              </div>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="text-purple-400 hover:text-purple-300 text-sm transition-colors"
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
      <div className="min-h-screen bg-white p-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-cardinal border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading lessons...</p>
          </div>
        </div>
      </div>
    }>
      <LessonsContent />
    </Suspense>
  )
}