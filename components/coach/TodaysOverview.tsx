'use client'

import { useState, useEffect } from 'react'
import { GraduationCap, Calendar, MessageSquare, Users, Video } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'

interface TodaysOverviewProps {
  onQuickAction?: (action: string) => void
}

interface QuickMetrics {
  lessonCount: number
  lessonViews: number
  feedLikes: number
  feedViews: number
  recentAthlete: string | null
}

export default function TodaysOverview({ onQuickAction }: TodaysOverviewProps) {
  const { user } = useAuth()
  const [metrics, setMetrics] = useState<QuickMetrics>({
    lessonCount: 0,
    lessonViews: 0,
    feedLikes: 0,
    feedViews: 0,
    recentAthlete: null
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.uid) {
      loadMetrics()
    }
  }, [user])

  const loadMetrics = async () => {
    try {
      setLoading(true)
      const token = await user?.getIdToken()

      // Load metrics in parallel
      const [lessonsRes, postsRes, athletesRes] = await Promise.all([
        fetch('/api/coach/lessons/list', {
          headers: { 'Authorization': `Bearer ${token}` }
        }).catch(() => null),
        fetch('/api/coach/posts', {
          headers: { 'Authorization': `Bearer ${token}` }
        }).catch(() => null),
        fetch('/api/coach/athletes', {
          headers: { 'Authorization': `Bearer ${token}` }
        }).catch(() => null)
      ])

      let lessonCount = 0
      let lessonViews = 0
      let feedLikes = 0
      let feedViews = 0
      let recentAthlete: string | null = null

      // Load lessons stats
      if (lessonsRes?.ok) {
        const lessonsData = await lessonsRes.json()
        lessonCount = lessonsData.count || 0
        // Calculate total views from lessons if available
        if (lessonsData.lessons && Array.isArray(lessonsData.lessons)) {
          lessonViews = lessonsData.lessons.reduce((sum: number, lesson: any) => sum + (lesson.views || 0), 0)
        }
      }

      // Load posts stats and calculate totals
      if (postsRes?.ok) {
        const postsData = await postsRes.json()
        if (postsData.posts && Array.isArray(postsData.posts)) {
          feedLikes = postsData.posts.reduce((sum: number, post: any) => sum + (post.likes || 0), 0)
          feedViews = postsData.posts.reduce((sum: number, post: any) => sum + (post.views || 0), 0)
        }
      }

      // Load recent athlete
      if (athletesRes?.ok) {
        const athletesData = await athletesRes.json()
        if (athletesData.athletes && athletesData.athletes.length > 0) {
          // Find most recently active athlete
          const sortedAthletes = athletesData.athletes.sort((a: any, b: any) => {
            const aTime = a.lastActive ? new Date(a.lastActive).getTime() : 0
            const bTime = b.lastActive ? new Date(b.lastActive).getTime() : 0
            return bTime - aTime
          })
          recentAthlete = sortedAthletes[0]?.displayName || sortedAthletes[0]?.email || null
        }
      }

      setMetrics({
        lessonCount,
        lessonViews,
        feedLikes,
        feedViews,
        recentAthlete
      })
    } catch (error) {
      console.error('Error loading metrics:', error)
    } finally {
      setLoading(false)
    }
  }

  const today = new Date()
  const formattedDate = today.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  const greeting = () => {
    const hour = today.getHours()
    if (hour < 12) return 'Good Morning'
    if (hour < 18) return 'Good Afternoon'
    return 'Good Evening'
  }

  const quickActions = [
    {
      id: 'create-lesson',
      label: 'Create Lesson',
      icon: GraduationCap,
      description: 'Build new training',
      metric: loading ? '...' : (
        metrics.lessonCount > 0
          ? `${metrics.lessonCount} lesson${metrics.lessonCount === 1 ? '' : 's'}${metrics.lessonViews > 0 ? ` • ${metrics.lessonViews} views` : ''}`
          : 'No lessons yet'
      )
    },
    {
      id: 'schedule-session',
      label: 'Schedule Session',
      icon: Calendar,
      description: 'Add to calendar',
      metric: null
    },
    {
      id: 'post-update',
      label: 'Post Update',
      icon: MessageSquare,
      description: 'Share with athletes',
      metric: loading ? '...' : (
        metrics.feedLikes > 0
          ? `${metrics.feedLikes} like${metrics.feedLikes === 1 ? '' : 's'}${metrics.feedViews > 0 ? ` • ${metrics.feedViews} views` : ''}`
          : 'No posts yet'
      )
    },
    {
      id: 'view-athletes',
      label: 'My Athletes',
      icon: Users,
      description: 'Manage athletes',
      metric: loading ? '...' : (metrics.recentAthlete ? `Recent: ${metrics.recentAthlete}` : 'No athletes yet')
    },
    {
      id: 'add-video',
      label: 'Add Video',
      icon: Video,
      description: 'Upload content',
      metric: null
    }
  ]

  return (
    <div className="space-y-4">
      {/* Header with Greeting */}
      <div className="bg-gradient-to-r from-teal-500 to-teal-600 rounded-xl p-5 sm:p-6 text-white shadow-lg">
        <h1 className="text-2xl sm:text-3xl font-bold mb-1">
          {greeting()}, {user?.displayName?.split(' ')[0] || 'Coach'}! 👋
        </h1>
        <p className="text-teal-50 text-sm sm:text-base">{formattedDate}</p>

        {/* Expanded Quick Actions Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 mt-4">
          {quickActions.map((action) => {
            const Icon = action.icon
            return (
              <button
                key={action.id}
                onClick={() => onQuickAction?.(action.id)}
                className="group bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg p-3 transition-all hover:scale-105 active:scale-95 touch-manipulation border border-white/20 hover:border-white/40 text-left"
              >
                <div className="flex flex-col">
                  <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center mb-2">
                    <Icon className="w-4.5 h-4.5 text-white" />
                  </div>
                  <h3 className="text-white font-semibold text-sm mb-0.5">
                    {action.label}
                  </h3>
                  <p className="text-teal-50 text-xs opacity-90">
                    {action.description}
                  </p>
                  {action.metric && (
                    <p className="text-white/70 text-xs mt-1.5 pt-1.5 border-t border-white/20 font-medium">
                      {action.metric}
                    </p>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
