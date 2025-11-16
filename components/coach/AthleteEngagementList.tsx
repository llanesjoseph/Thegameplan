'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { ChevronDown, ChevronUp, Video, BookOpen, Clock, TrendingUp, Calendar, MessageSquare } from 'lucide-react'

interface Athlete {
  uid: string
  displayName: string
  email: string
  profileImageUrl?: string
  slug?: string
}

interface AthleteMetrics {
  submissions: number
  videosAwaiting: number
  lessonsCompleted: number
  lessonsUnfinished: number
  lastActivity?: string
  upcomingSessions?: number
  messagesUnread?: number
}

export default function AthleteEngagementList() {
  const { user } = useAuth()
  const [athletes, setAthletes] = useState<Athlete[]>([])
  const [metricsMap, setMetricsMap] = useState<Record<string, AthleteMetrics>>({})
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadAthletes = async () => {
      if (!user?.uid) return

      try {
        const res = await fetch('/api/coach/athletes')
        const data = await res.json()

        if (data.success) {
          setAthletes(data.athletes || [])

          // Load metrics for each athlete
          const metrics: Record<string, AthleteMetrics> = {}
          for (const athlete of data.athletes || []) {
            try {
              const metricsRes = await fetch(`/api/coach/athletes/${athlete.slug || athlete.uid}`)
              const metricsData = await metricsRes.json()

              if (metricsData.success) {
                metrics[athlete.uid] = {
                  submissions: metricsData.submissions?.total || 0,
                  videosAwaiting: metricsData.submissions?.pending || 0,
                  lessonsCompleted: metricsData.progress?.completed || 0,
                  lessonsUnfinished: metricsData.progress?.inProgress || 0,
                  lastActivity: metricsData.lastActivity,
                  upcomingSessions: 0, // TODO: Add sessions endpoint
                  messagesUnread: 0 // TODO: Add messages endpoint
                }
              }
            } catch (e) {
              console.warn(`Failed to load metrics for ${athlete.displayName}:`, e)
            }
          }
          setMetricsMap(metrics)
        }
      } catch (error) {
        console.error('Failed to load athletes:', error)
      } finally {
        setLoading(false)
      }
    }

    loadAthletes()
  }, [user])

  const toggleExpand = (athleteId: string) => {
    setExpandedId(expandedId === athleteId ? null : athleteId)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-12 w-12 rounded-full border-4 border-black border-t-transparent animate-spin" />
      </div>
    )
  }

  if (athletes.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500" style={{ fontFamily: '"Open Sans", sans-serif' }}>
          No athletes yet
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {athletes.map((athlete) => {
        const metrics = metricsMap[athlete.uid]
        const isExpanded = expandedId === athlete.uid

        return (
          <div
            key={athlete.uid}
            className="border-2 border-gray-200 rounded-lg overflow-hidden transition-all duration-200 hover:border-black"
          >
            {/* Collapsed Row */}
            <button
              onClick={() => toggleExpand(athlete.uid)}
              className="w-full p-4 flex items-center gap-4 bg-white hover:bg-gray-50 transition-colors"
            >
              {/* Profile Photo */}
              <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
                {athlete.profileImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={athlete.profileImageUrl}
                    alt={athlete.displayName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xl font-bold" style={{ backgroundColor: '#8B7D7B', color: '#fff' }}>
                    {athlete.displayName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              {/* Athlete Name & Quick Stats */}
              <div className="flex-1 text-left">
                <h3 className="font-bold text-base" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif' }}>
                  {athlete.displayName}
                </h3>
                <div className="flex items-center gap-4 mt-1 text-xs" style={{ color: '#666', fontFamily: '"Open Sans", sans-serif' }}>
                  {metrics && (
                    <>
                      {metrics.videosAwaiting > 0 && (
                        <span className="flex items-center gap-1">
                          <Video className="w-3 h-3" style={{ color: '#FC0105' }} />
                          {metrics.videosAwaiting} pending
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <BookOpen className="w-3 h-3" />
                        {metrics.lessonsCompleted} completed
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Expand Icon */}
              <div className="flex-shrink-0">
                {isExpanded ? (
                  <ChevronUp className="w-5 h-5" style={{ color: '#000000' }} />
                ) : (
                  <ChevronDown className="w-5 h-5" style={{ color: '#000000' }} />
                )}
              </div>
            </button>

            {/* Expanded Content */}
            {isExpanded && metrics && (
              <div className="px-4 pb-4 bg-gray-50 border-t-2 border-gray-200">
                <div className="grid grid-cols-2 gap-4 mt-4">
                  {/* Video Submissions */}
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center gap-2 mb-3">
                      <Video className="w-5 h-5" style={{ color: '#FC0105' }} />
                      <h4 className="text-sm font-bold" style={{ color: '#666', fontFamily: '"Open Sans", sans-serif' }}>
                        Video Submissions
                      </h4>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs" style={{ color: '#666', fontFamily: '"Open Sans", sans-serif' }}>
                          Awaiting Review
                        </span>
                        <span className="text-xl font-bold" style={{ color: '#FC0105', fontFamily: '"Open Sans", sans-serif' }}>
                          {metrics.videosAwaiting}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs" style={{ color: '#666', fontFamily: '"Open Sans", sans-serif' }}>
                          Total Submissions
                        </span>
                        <span className="text-xl font-bold" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif' }}>
                          {metrics.submissions}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Lessons Progress */}
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center gap-2 mb-3">
                      <TrendingUp className="w-5 h-5" style={{ color: '#00A651' }} />
                      <h4 className="text-sm font-bold" style={{ color: '#666', fontFamily: '"Open Sans", sans-serif' }}>
                        Training Progress
                      </h4>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs" style={{ color: '#666', fontFamily: '"Open Sans", sans-serif' }}>
                          Completed
                        </span>
                        <span className="text-xl font-bold" style={{ color: '#00A651', fontFamily: '"Open Sans", sans-serif' }}>
                          {metrics.lessonsCompleted}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs" style={{ color: '#666', fontFamily: '"Open Sans", sans-serif' }}>
                          In Progress
                        </span>
                        <span className="text-xl font-bold" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif' }}>
                          {metrics.lessonsUnfinished}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Last Activity */}
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center gap-2 mb-3">
                      <Clock className="w-5 h-5" style={{ color: '#666' }} />
                      <h4 className="text-sm font-bold" style={{ color: '#666', fontFamily: '"Open Sans", sans-serif' }}>
                        Last Activity
                      </h4>
                    </div>
                    <p className="text-sm" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif' }}>
                      {metrics.lastActivity
                        ? new Date(metrics.lastActivity).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })
                        : 'No recent activity'}
                    </p>
                  </div>

                  {/* Quick Actions */}
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <h4 className="text-sm font-bold mb-3" style={{ color: '#666', fontFamily: '"Open Sans", sans-serif' }}>
                      Quick Actions
                    </h4>
                    <div className="flex flex-col gap-2">
                      <a
                        href={`/dashboard/coach/athletes/${athlete.slug || athlete.uid}`}
                        className="text-xs px-3 py-2 rounded bg-black text-white font-bold text-center hover:bg-gray-800 transition-colors"
                        style={{ fontFamily: '"Open Sans", sans-serif' }}
                      >
                        View Full Profile
                      </a>
                      {metrics.videosAwaiting > 0 && (
                        <a
                          href="/dashboard/coach/queue"
                          className="text-xs px-3 py-2 rounded border-2 border-black text-black font-bold text-center hover:bg-gray-50 transition-colors"
                          style={{ fontFamily: '"Open Sans", sans-serif' }}
                        >
                          Review Videos
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
