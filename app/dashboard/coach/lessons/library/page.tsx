'use client'

import { useState, useEffect, Suspense } from 'react'
import AppHeader from '@/components/ui/AppHeader'
import { useAuth } from '@/hooks/use-auth'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  BookOpen,
  Search,
  Filter,
  Edit,
  Copy,
  Trash2,
  Eye,
  Users,
  Clock,
  Star,
  Plus,
  AlertCircle
} from 'lucide-react'

interface Lesson {
  id: string
  title: string
  sport: string
  level: 'beginner' | 'intermediate' | 'advanced'
  duration: number
  sections: any[]
  tags: string[]
  visibility: string
  status: string
  createdAt: string
  updatedAt: string
  viewCount: number
  completionCount: number
  averageRating: number
}

function LessonLibraryPageContent() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const embedded = searchParams.get('embedded') === 'true'

  const [lessons, setLessons] = useState<Lesson[]>([])
  const [filteredLessons, setFilteredLessons] = useState<Lesson[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [sportFilter, setSportFilter] = useState('all')
  const [levelFilter, setLevelFilter] = useState('all')

  // Authentication check
  useEffect(() => {
    if (authLoading) return

    if (!user) {
      console.warn('[LessonLibrary] Unauthorized access attempt - no user')
      if (!embedded) {
        router.push('/')
      }
    }
  }, [user, authLoading, embedded, router])

  // Load lessons
  useEffect(() => {
    if (user) {
      loadLessons()
    }
  }, [user])

  // Filter lessons
  useEffect(() => {
    let filtered = lessons

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(lesson =>
        lesson.title.toLowerCase().includes(query) ||
        lesson.tags.some(tag => tag.toLowerCase().includes(query))
      )
    }

    // Sport filter
    if (sportFilter !== 'all') {
      filtered = filtered.filter(lesson => lesson.sport === sportFilter)
    }

    // Level filter
    if (levelFilter !== 'all') {
      filtered = filtered.filter(lesson => lesson.level === levelFilter)
    }

    setFilteredLessons(filtered)
  }, [lessons, searchQuery, sportFilter, levelFilter])

  const loadLessons = async () => {
    setLoading(true)
    try {
      if (!user) { console.error('No user found'); return; }

      if (!user) { console.error('No user found'); return; }
      const token = await user.getIdToken()
      const response = await fetch('/api/coach/lessons/list', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to load lessons')
      }

      const data = await response.json()
      setLessons(data.lessons || [])
    } catch (error) {
      console.error('Error loading lessons:', error)
      alert('Failed to load lessons')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (lessonId: string) => {
    if (embedded) {
      router.push(`/dashboard/coach/lessons/${lessonId}/edit?embedded=true`)
    } else {
      router.push(`/dashboard/coach/lessons/${lessonId}/edit`)
    }
  }

  const handleDuplicate = async (lessonId: string) => {
    if (!confirm('Create a copy of this lesson?')) return

    try {
      if (!user) { console.error('No user found'); return; }

      if (!user) { console.error('No user found'); return; }
      const token = await user.getIdToken()
      const response = await fetch('/api/coach/lessons/duplicate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ lessonId })
      })

      if (!response.ok) {
        throw new Error('Failed to duplicate lesson')
      }

      alert('Lesson duplicated successfully!')
      loadLessons()
    } catch (error) {
      console.error('Error duplicating lesson:', error)
      alert('Failed to duplicate lesson')
    }
  }

  const handleDelete = async (lessonId: string, lessonTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${lessonTitle}"? This cannot be undone.`)) return

    try {
      if (!user) { console.error('No user found'); return; }

      if (!user) { console.error('No user found'); return; }
      const token = await user.getIdToken()
      const response = await fetch('/api/coach/lessons/delete', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ lessonId })
      })

      if (!response.ok) {
        throw new Error('Failed to delete lesson')
      }

      alert('Lesson deleted successfully')
      loadLessons()
    } catch (error) {
      console.error('Error deleting lesson:', error)
      alert('Failed to delete lesson')
    }
  }

  const getLevelBadgeColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'bg-green-100 text-green-800'
      case 'intermediate': return 'bg-yellow-100 text-yellow-800'
      case 'advanced': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getSportColor = (sport: string) => {
    const colors: Record<string, string> = {
      'baseball': '#91A6EB',
      'basketball': '#FF6B35',
      'football': '#20B2AA',
      'soccer': '#000000',
      'softball': '#91A6EB',
      'volleyball': '#FF6B35',
      'other': '#666666'
    }
    return colors[sport] || '#000000'
  }

  // Show loading state while checking auth
  if (authLoading) {
    return (
      <div style={{ backgroundColor: embedded ? 'transparent' : '#E8E6D8' }} className={embedded ? 'p-12' : 'min-h-screen flex items-center justify-center'}>
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-black mb-4"></div>
          <p style={{ color: '#000000', opacity: 0.7 }}>Verifying access...</p>
        </div>
      </div>
    )
  }

  // Show error if not authenticated
  if (!user) {
    return (
      <div style={{ backgroundColor: embedded ? 'transparent' : '#E8E6D8' }} className={embedded ? 'p-12' : 'min-h-screen flex items-center justify-center'}>
        <div className="text-center bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-8 max-w-md">
          <AlertCircle className="w-16 h-16 mx-auto mb-4" style={{ color: '#FF6B35' }} />
          <h2 className="text-2xl mb-2" style={{ color: '#000000' }}>Access Denied</h2>
          <p className="mb-6" style={{ color: '#000000', opacity: 0.7 }}>
            You must be logged in as a coach to access this page.
          </p>
          {!embedded && (
            <button
              onClick={() => router.push('/')}
              className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              Return to Login
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div style={{ backgroundColor: embedded ? 'transparent' : '#E8E6D8' }} className={embedded ? '' : 'min-h-screen'}>
      {!embedded && (
        <AppHeader title="Lesson Library" subtitle="View and manage all your training lessons" />
      )}

      <main className={`w-full ${embedded ? 'p-4' : 'max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6'} space-y-6`}>
        {/* Header */}
        {embedded && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <BookOpen className="w-8 h-8" style={{ color: '#000000' }} />
                <h1 className="text-3xl" style={{ color: '#000000' }}>Lesson Library</h1>
              </div>
              <button
                onClick={() => router.push(embedded ? '/dashboard/coach/lessons/create?embedded=true' : '/dashboard/coach/lessons/create')}
                className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Create Lesson
              </button>
            </div>
            <p style={{ color: '#000000', opacity: 0.7 }}>
              View and manage all your training lessons
            </p>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border border-white/50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm" style={{ color: '#000000', opacity: 0.7 }}>Total Lessons</p>
                <p className="text-3xl" style={{ color: '#000000' }}>{lessons.length}</p>
              </div>
              <BookOpen className="w-10 h-10" style={{ color: '#91A6EB', opacity: 0.3 }} />
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border border-white/50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm" style={{ color: '#000000', opacity: 0.7 }}>Total Views</p>
                <p className="text-3xl" style={{ color: '#000000' }}>
                  {lessons.reduce((sum, l) => sum + (l.viewCount || 0), 0)}
                </p>
              </div>
              <Eye className="w-10 h-10" style={{ color: '#20B2AA', opacity: 0.3 }} />
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border border-white/50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm" style={{ color: '#000000', opacity: 0.7 }}>Completions</p>
                <p className="text-3xl" style={{ color: '#000000' }}>
                  {lessons.reduce((sum, l) => sum + (l.completionCount || 0), 0)}
                </p>
              </div>
              <Users className="w-10 h-10" style={{ color: '#FF6B35', opacity: 0.3 }} />
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border border-white/50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm" style={{ color: '#000000', opacity: 0.7 }}>Avg Rating</p>
                <p className="text-3xl" style={{ color: '#000000' }}>
                  {lessons.length > 0
                    ? (lessons.reduce((sum, l) => sum + (l.averageRating || 0), 0) / lessons.length).toFixed(1)
                    : '0.0'
                  }
                </p>
              </div>
              <Star className="w-10 h-10" style={{ color: '#000000', opacity: 0.3 }} />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border border-white/50 p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ opacity: 0.5 }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search lessons by title or tags..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            {/* Sport Filter */}
            <select
              value={sportFilter}
              onChange={(e) => setSportFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
            >
              <option value="all">All Sports</option>
              <option value="baseball">Baseball</option>
              <option value="basketball">Basketball</option>
              <option value="football">Football</option>
              <option value="soccer">Soccer</option>
              <option value="softball">Softball</option>
              <option value="volleyball">Volleyball</option>
              <option value="other">Other</option>
            </select>

            {/* Level Filter */}
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
            >
              <option value="all">All Levels</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
        </div>

        {/* Lessons Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
            <p className="mt-4" style={{ color: '#000000', opacity: 0.7 }}>Loading lessons...</p>
          </div>
        ) : filteredLessons.length === 0 ? (
          <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border border-white/50 p-12 text-center">
            <BookOpen className="w-16 h-16 mx-auto mb-4" style={{ opacity: 0.3 }} />
            <h3 className="text-xl mb-2" style={{ color: '#000000' }}>
              {lessons.length === 0 ? 'No lessons yet' : 'No lessons match your filters'}
            </h3>
            <p className="mb-6" style={{ color: '#000000', opacity: 0.7 }}>
              {lessons.length === 0
                ? 'Create your first lesson to get started'
                : 'Try adjusting your search or filters'
              }
            </p>
            {lessons.length === 0 && (
              <button
                onClick={() => router.push(embedded ? '/dashboard/coach/lessons/create?embedded=true' : '/dashboard/coach/lessons/create')}
                className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors inline-flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Create Your First Lesson
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredLessons.map((lesson) => (
              <div
                key={lesson.id}
                className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border border-white/50 overflow-hidden hover:shadow-2xl transition-all"
              >
                {/* Header with sport color */}
                <div className="h-2" style={{ backgroundColor: getSportColor(lesson.sport) }} />

                <div className="p-5">
                  {/* Title and badges */}
                  <div className="mb-3">
                    <h3 className="text-lg mb-2 line-clamp-2" style={{ color: '#000000' }}>
                      {lesson.title}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      <span className="text-xs px-2 py-1 bg-gray-100 rounded capitalize">
                        {lesson.sport}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded capitalize ${getLevelBadgeColor(lesson.level)}`}>
                        {lesson.level}
                      </span>
                      <span className="text-xs px-2 py-1 bg-gray-100 rounded flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {lesson.duration} min
                      </span>
                    </div>
                  </div>

                  {/* Tags */}
                  {lesson.tags.length > 0 && (
                    <div className="mb-3 flex flex-wrap gap-1">
                      {lesson.tags.slice(0, 3).map((tag, idx) => (
                        <span key={idx} className="text-xs px-2 py-0.5 bg-sky-blue/10 rounded-full" style={{ color: '#91A6EB' }}>
                          #{tag}
                        </span>
                      ))}
                      {lesson.tags.length > 3 && (
                        <span className="text-xs px-2 py-0.5" style={{ color: '#000000', opacity: 0.5 }}>
                          +{lesson.tags.length - 3} more
                        </span>
                      )}
                    </div>
                  )}

                  {/* Stats */}
                  <div className="mb-4 flex items-center gap-4 text-sm" style={{ color: '#000000', opacity: 0.6 }}>
                    <span className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      {lesson.viewCount || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {lesson.completionCount || 0}
                    </span>
                    {lesson.averageRating > 0 && (
                      <span className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        {lesson.averageRating.toFixed(1)}
                      </span>
                    )}
                  </div>

                  {/* Sections count */}
                  <p className="text-sm mb-4" style={{ color: '#000000', opacity: 0.6 }}>
                    {lesson.sections?.length || 0} sections
                  </p>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(lesson.id)}
                      className="flex-1 px-3 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 text-sm"
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDuplicate(lesson.id)}
                      className="px-3 py-2 bg-gray-100 text-black rounded-lg hover:bg-gray-200 transition-colors"
                      title="Duplicate"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(lesson.id, lesson.title)}
                      className="px-3 py-2 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" style={{ color: '#FF6B35' }} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

export default function LessonLibraryPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen" style={{ backgroundColor: '#E8E6D8' }}>
        <div className="flex items-center justify-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
        </div>
      </div>
    }>
      <LessonLibraryPageContent />
    </Suspense>
  )
}
