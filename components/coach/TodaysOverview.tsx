'use client'

import { useState, useEffect } from 'react'
import { Users, BookOpen, Calendar, TrendingUp } from 'lucide-react'
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-500 to-teal-600 rounded-xl p-6 sm:p-8 text-white shadow-lg">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl sm:text-3xl font-bold">
            {greeting()}, {user?.displayName?.split(' ')[0] || 'Coach'}! 👋
          </h1>
        </div>
        <p className="text-teal-50 text-sm sm:text-base">{formattedDate}</p>
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
