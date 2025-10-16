'use client'

import { useState, useEffect } from 'react'
import { Users, BookOpen, Calendar, TrendingUp, GraduationCap, MessageSquare, Video } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'

interface TodaysOverviewProps {
  onQuickAction?: (action: string) => void
}

export default function TodaysOverview({ onQuickAction }: TodaysOverviewProps) {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    totalAthletes: 0,
    activeLessons: 0,
    upcomingSessions: 0,
    pendingRequests: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.uid) {
      loadStats()
    }
  }, [user])

  const loadStats = async () => {
    try {
      setLoading(true)
      const token = await user?.getIdToken()

      // Load various stats in parallel
      const [sessionsRes, athletesRes, lessonsRes, scheduleRes] = await Promise.all([
        fetch('/api/coach/live-sessions/count', {
          headers: { 'Authorization': `Bearer ${token}` }
        }).catch(() => null),
        fetch('/api/coach/athletes', {
          headers: { 'Authorization': `Bearer ${token}` }
        }).catch(() => null),
        fetch('/api/coach/lessons/list', {
          headers: { 'Authorization': `Bearer ${token}` }
        }).catch(() => null),
        fetch('/api/coach/schedule', {
          headers: { 'Authorization': `Bearer ${token}` }
        }).catch(() => null)
      ])

      let totalAthletes = 0
      let activeLessons = 0
      let upcomingSessions = 0
      let pendingRequests = 0

      // Load athletes count
      if (athletesRes?.ok) {
        const athletesData = await athletesRes.json()
        totalAthletes = athletesData.athletes?.length || 0
      }

      // Load lessons count
      if (lessonsRes?.ok) {
        const lessonsData = await lessonsRes.json()
        activeLessons = lessonsData.count || 0
      }

      // Load today's sessions count
      if (scheduleRes?.ok) {
        const scheduleData = await scheduleRes.json()
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const tomorrow = new Date(today)
        tomorrow.setDate(tomorrow.getDate() + 1)

        upcomingSessions = (scheduleData.events || []).filter((event: any) => {
          const eventDate = new Date(event.eventDateTime || event.eventDate)
          return eventDate >= today && eventDate < tomorrow
        }).length
      }

      // Load pending requests
      if (sessionsRes?.ok) {
        const sessionsData = await sessionsRes.json()
        pendingRequests = sessionsData.pendingCount || 0
      }

      // Update stats
      setStats({
        totalAthletes,
        activeLessons,
        upcomingSessions,
        pendingRequests
      })
    } catch (error) {
      console.error('Error loading stats:', error)
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
      description: 'Build new training'
    },
    {
      id: 'schedule-session',
      label: 'Schedule Session',
      icon: Calendar,
      description: 'Add to calendar'
    },
    {
      id: 'post-update',
      label: 'Post Update',
      icon: MessageSquare,
      description: 'Share with athletes'
    },
    {
      id: 'view-athletes',
      label: 'My Athletes',
      icon: Users,
      description: 'Manage athletes'
    },
    {
      id: 'add-video',
      label: 'Add Video',
      icon: Video,
      description: 'Upload content'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header with Integrated Quick Actions */}
      <div className="bg-gradient-to-r from-teal-500 to-teal-600 rounded-xl p-6 sm:p-8 text-white shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-1">
              {greeting()}, {user?.displayName?.split(' ')[0] || 'Coach'}! 👋
            </h1>
            <p className="text-teal-50 text-sm sm:text-base">{formattedDate}</p>
          </div>

          {/* Quick Actions - Compact Icon Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {quickActions.map((action) => {
              const Icon = action.icon
              return (
                <button
                  key={action.id}
                  onClick={() => onQuickAction?.(action.id)}
                  className="group relative bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg p-3 transition-all hover:scale-105 active:scale-95 touch-manipulation"
                  title={action.label}
                  style={{ minHeight: '44px', minWidth: '44px' }}
                >
                  <Icon className="w-5 h-5 text-white" />
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                    {action.label}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Athletes */}
        <div className="bg-white rounded-xl p-5 shadow-sm border-2 border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-sky-blue/10 flex items-center justify-center">
              <Users className="w-5 h-5" style={{ color: '#91A6EB' }} />
            </div>
            {loading && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
            )}
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.totalAthletes}</p>
          <p className="text-xs text-gray-600 mt-1">Total Athletes</p>
        </div>

        {/* Active Lessons */}
        <div className="bg-white rounded-xl p-5 shadow-sm border-2 border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-teal/10 flex items-center justify-center">
              <BookOpen className="w-5 h-5" style={{ color: '#20B2AA' }} />
            </div>
            {loading && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
            )}
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.activeLessons}</p>
          <p className="text-xs text-gray-600 mt-1">Active Lessons</p>
        </div>

        {/* Upcoming Sessions */}
        <div className="bg-white rounded-xl p-5 shadow-sm border-2 border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-green-600" />
            </div>
            {loading && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
            )}
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.upcomingSessions}</p>
          <p className="text-xs text-gray-600 mt-1">Today's Sessions</p>
        </div>

        {/* Pending Requests */}
        <div
          className="bg-white rounded-xl p-5 shadow-sm border-2 border-gray-100 hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => onQuickAction?.('live-sessions')}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-orange/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" style={{ color: '#FF6B35' }} />
            </div>
            {stats.pendingRequests > 0 && (
              <div className="bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                {stats.pendingRequests}
              </div>
            )}
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.pendingRequests}</p>
          <p className="text-xs text-gray-600 mt-1">Pending Requests</p>
        </div>
      </div>
    </div>
  )
}
