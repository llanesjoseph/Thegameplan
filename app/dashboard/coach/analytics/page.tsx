'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import AppHeader from '@/components/ui/AppHeader'
import {
  BarChart3,
  TrendingUp,
  Users,
  Eye,
  CheckCircle,
  Star,
  Calendar,
  Award
,
  AlertCircle
} from 'lucide-react'

function AnalyticsPageContent() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const embedded = searchParams.get('embedded') === 'true'

  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d')
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalLessons: 0,
    totalViews: 0,
    totalCompletions: 0,
    averageRating: 0,
    activeAthletes: 0,
    lessonCompletionRate: 0,
    avgTimePerLesson: 0
  })
  const [topLessons, setTopLessons] = useState<any[]>([])
  const [athleteActivity, setAthleteActivity] = useState<any[]>([])
  const [trends, setTrends] = useState({
    weekGrowth: 0,
    monthGrowth: 0,
    newAthletesMonth: 0,
    avgEngagement: 0
  })

  // Authentication check
  useEffect(() => {
    if (authLoading) return

    if (!user) {
      console.warn('[Analytics] Unauthorized access attempt - no user')
      if (!embedded) {
        router.push('/')
      }
    }
  }, [user, authLoading, embedded, router])

  // Load analytics data
  useEffect(() => {
    if (user) {
      loadAnalytics()
    }
  }, [user, timeRange])

  const loadAnalytics = async () => {
    setLoading(true)
    try {
      if (!user) {
        console.error('No user found when loading analytics')
        return
      }
      if (!user) { console.error('No user found'); return; }

      if (!user) { console.error('No user found'); return; }
      const token = await user.getIdToken()
      const response = await fetch('/api/coach/analytics', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to load analytics')
      }

      const data = await response.json()
      if (data.analytics) {
        setStats(data.analytics.stats)
        setTopLessons(data.analytics.topLessons || [])
        setAthleteActivity(data.analytics.athleteActivity || [])
        setTrends(data.analytics.trends || {
          weekGrowth: 0,
          monthGrowth: 0,
          newAthletesMonth: 0,
          avgEngagement: 0
        })
      }
    } catch (error) {
      console.error('Error loading analytics:', error)
    } finally {
      setLoading(false)
    }
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
          <h2 className="text-2xl font-heading mb-2" style={{ color: '#000000' }}>Access Denied</h2>
          <p className="mb-6" style={{ color: '#000000', opacity: 0.7 }}>
            You must be logged in as a coach to access this page.
          </p>
          {!embedded && (
            <button
              onClick={() => router.push('/')}
              className="px-6 py-3 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition-colors"
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
        <AppHeader title="Analytics" subtitle="Track engagement and athlete progress" />
      )}

      {loading ? (
        <div className={`w-full ${embedded ? 'p-12' : 'max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-12'} text-center`}>
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-black mb-4"></div>
          <p style={{ color: '#000000', opacity: 0.7 }}>Loading analytics...</p>
        </div>
      ) : (
        <main className={`w-full ${embedded ? 'p-4' : 'max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6'} space-y-6`}>
        {/* Header */}
        {embedded && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <BarChart3 className="w-8 h-8" style={{ color: '#20B2AA' }} />
                <h1 className="text-3xl font-heading" style={{ color: '#000000' }}>Analytics</h1>
              </div>
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as any)}
                className="px-4 py-2 border border-gray-300/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="all">All time</option>
              </select>
            </div>
            <p style={{ color: '#000000', opacity: 0.7 }}>
              Track engagement and athlete progress
            </p>
          </div>
        )}

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border border-white/50 p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(145, 166, 235, 0.2)' }}>
                <Eye className="w-5 h-5" style={{ color: '#91A6EB' }} />
              </div>
              <div>
                <p className="text-2xl font-heading" style={{ color: '#000000' }}>{stats.totalViews}</p>
                <p className="text-xs" style={{ color: '#000000', opacity: 0.6 }}>Total Views</p>
              </div>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border border-white/50 p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(32, 178, 170, 0.2)' }}>
                <CheckCircle className="w-5 h-5" style={{ color: '#20B2AA' }} />
              </div>
              <div>
                <p className="text-2xl font-heading" style={{ color: '#000000' }}>{stats.totalCompletions}</p>
                <p className="text-xs" style={{ color: '#000000', opacity: 0.6 }}>Completions</p>
              </div>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border border-white/50 p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(255, 107, 53, 0.2)' }}>
                <Star className="w-5 h-5" style={{ color: '#FF6B35' }} />
              </div>
              <div>
                <p className="text-2xl font-heading" style={{ color: '#000000' }}>{stats.averageRating}</p>
                <p className="text-xs" style={{ color: '#000000', opacity: 0.6 }}>Avg Rating</p>
              </div>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border border-white/50 p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-black/10">
                <Users className="w-5 h-5" style={{ color: '#000000' }} />
              </div>
              <div>
                <p className="text-2xl font-heading" style={{ color: '#000000' }}>{stats.activeAthletes}</p>
                <p className="text-xs" style={{ color: '#000000', opacity: 0.6 }}>Active Athletes</p>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5" style={{ color: '#20B2AA' }} />
              <h2 className="text-lg font-heading" style={{ color: '#000000' }}>Performance</h2>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span style={{ color: '#000000', opacity: 0.7 }}>Completion Rate</span>
                  <span className="font-semibold" style={{ color: '#20B2AA' }}>{stats.lessonCompletionRate}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="h-2 rounded-full"
                    style={{ width: `${stats.lessonCompletionRate}%`, backgroundColor: '#20B2AA' }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span style={{ color: '#000000', opacity: 0.7 }}>Avg Time/Lesson</span>
                  <span className="font-semibold" style={{ color: '#000000' }}>{stats.avgTimePerLesson}min</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span style={{ color: '#000000', opacity: 0.7 }}>Total Lessons</span>
                  <span className="font-semibold" style={{ color: '#000000' }}>{stats.totalLessons}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="lg:col-span-2 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-5 h-5" style={{ color: '#91A6EB' }} />
              <h2 className="text-lg font-heading" style={{ color: '#000000' }}>Engagement Trends</h2>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(145, 166, 235, 0.1)' }}>
                <p className="text-sm mb-1" style={{ color: '#000000', opacity: 0.7 }}>This Week</p>
                <p className="text-2xl font-heading mb-1" style={{ color: '#91A6EB' }}>+{trends.weekGrowth}%</p>
                <p className="text-xs" style={{ color: '#000000', opacity: 0.6 }}>vs last week</p>
              </div>

              <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(32, 178, 170, 0.1)' }}>
                <p className="text-sm mb-1" style={{ color: '#000000', opacity: 0.7 }}>This Month</p>
                <p className="text-2xl font-heading mb-1" style={{ color: '#20B2AA' }}>+{trends.monthGrowth}%</p>
                <p className="text-xs" style={{ color: '#000000', opacity: 0.6 }}>vs last month</p>
              </div>

              <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(255, 107, 53, 0.1)' }}>
                <p className="text-sm mb-1" style={{ color: '#000000', opacity: 0.7 }}>New Athletes</p>
                <p className="text-2xl font-heading mb-1" style={{ color: '#FF6B35' }}>+{trends.newAthletesMonth}</p>
                <p className="text-xs" style={{ color: '#000000', opacity: 0.6 }}>this month</p>
              </div>

              <div className="p-4 rounded-lg bg-black/5">
                <p className="text-sm mb-1" style={{ color: '#000000', opacity: 0.7 }}>Avg Engagement</p>
                <p className="text-2xl font-heading mb-1" style={{ color: '#000000' }}>{trends.avgEngagement}hrs</p>
                <p className="text-xs" style={{ color: '#000000', opacity: 0.6 }}>per athlete/week</p>
              </div>
            </div>
          </div>
        </div>

        {/* Top Performing Lessons */}
        <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Award className="w-5 h-5" style={{ color: '#FF6B35' }} />
            <h2 className="text-lg font-heading" style={{ color: '#000000' }}>Top Performing Lessons</h2>
          </div>

          <div className="space-y-3">
            {topLessons.map((lesson, index) => (
              <div
                key={lesson.id}
                className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold" style={{ backgroundColor: index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : index === 2 ? '#CD7F32' : 'rgba(0,0,0,0.1)', color: index < 3 ? '#FFFFFF' : '#000000' }}>
                  {index + 1}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate" style={{ color: '#000000' }}>
                    {lesson.title}
                  </h3>
                  <div className="flex items-center gap-4 text-sm" style={{ color: '#000000', opacity: 0.6 }}>
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {lesson.views}
                    </span>
                    <span className="flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      {lesson.completions}
                    </span>
                    <span className="flex items-center gap-1">
                      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                      {lesson.rating}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-sm font-semibold" style={{ color: '#20B2AA' }}>
                    {((lesson.completions / lesson.views) * 100).toFixed(0)}%
                  </p>
                  <p className="text-xs" style={{ color: '#000000', opacity: 0.5 }}>completion</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Most Active Athletes */}
        <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5" style={{ color: '#91A6EB' }} />
            <h2 className="text-lg font-heading" style={{ color: '#000000' }}>Most Active Athletes</h2>
          </div>

          <div className="space-y-3">
            {athleteActivity.map((athlete, index) => (
              <div
                key={index}
                className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <div className="w-10 h-10 rounded-full flex items-center justify-center font-semibold text-white" style={{ background: 'linear-gradient(135deg, #91A6EB 0%, #000000 100%)' }}>
                  {athlete.name.split(' ').map((n: string) => n[0]).join('')}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold" style={{ color: '#000000' }}>
                    {athlete.name}
                  </h3>
                  <div className="flex items-center gap-4 text-sm" style={{ color: '#000000', opacity: 0.6 }}>
                    <span>{athlete.completions} completions</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {athlete.lastActive}
                    </span>
                  </div>
                </div>

                <div className="w-32">
                  <div className="flex justify-between text-xs mb-1">
                    <span style={{ color: '#000000', opacity: 0.6 }}>Progress</span>
                    <span className="font-semibold" style={{ color: '#000000' }}>{athlete.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full"
                      style={{ width: `${athlete.progress}%`, backgroundColor: '#91A6EB' }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
      )}
    </div>
  )
}

export default function AnalyticsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen" style={{ backgroundColor: '#E8E6D8' }}>
        <div className="flex items-center justify-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
        </div>
      </div>
    }>
      <AnalyticsPageContent />
    </Suspense>
  )
}
