'use client'

import { useState, useEffect, useCallback } from 'react'
import { BookOpen, Video, Calendar, Trophy } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { doc, getDoc, collection, query, where, getDocs, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase.client'
import { useSearchParams } from 'next/navigation'

export default function AthleteOverview() {
  const searchParams = useSearchParams()
  const isEmbedded = searchParams.get('embedded') === 'true'
  const { user } = useAuth()
  const [stats, setStats] = useState({
    lessonsCompleted: 0,
    lessonsTotal: 0,
    upcomingEvents: 0,
    trainingStreak: 0
  })
  const [loading, setLoading] = useState(true)
  const [coachId, setCoachId] = useState<string | null>(null)

  useEffect(() => {
    const loadCoachId = async () => {
      if (!user?.uid) return

      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid))
        if (userDoc.exists()) {
          const userData = userDoc.data()
          setCoachId(userData?.coachId || userData?.assignedCoachId || null)
        }
      } catch (error) {
        console.error('Error loading coach ID:', error)
      }
    }

    loadCoachId()
  }, [user])

  // Memoize loadStats to prevent recreation on every render
  const loadStats = useCallback(async () => {
    if (!user?.uid || !coachId) return

    try {
      setLoading(true)

      // Fetch athlete feed to get accurate completion data
      let lessonsCompletedCount = 0
      try {
        const feedDoc = await getDoc(doc(db, 'athlete_feed', user.uid))
        if (feedDoc.exists()) {
          const feedData = feedDoc.data()
          lessonsCompletedCount = feedData?.completedLessons?.length || 0
        }
      } catch (error) {
        console.warn('Could not fetch athlete feed for completion count:', error)
      }

      // Count total lessons from coach
      const contentQuery = query(
        collection(db, 'content'),
        where('creatorUid', '==', coachId),
        where('status', '==', 'published')
      )
      const contentSnap = await getDocs(contentQuery)
      const totalLessons = contentSnap.size

      // Get today's date for upcoming events (simplified - would need actual event tracking)
      const upcomingEvents = 0 // Placeholder - would fetch from schedule

      setStats({
        lessonsCompleted: lessonsCompletedCount,
        lessonsTotal: totalLessons,
        upcomingEvents,
        trainingStreak: 0 // Placeholder - would calculate streak
      })
    } catch (error) {
      console.error('Error loading stats:', error)
    } finally {
      setLoading(false)
    }
  }, [user?.uid, coachId])  // Only recreate if user.uid or coachId changes

  useEffect(() => {
    if (user?.uid && coachId) {
      loadStats()
    }
  }, [user?.uid, coachId, loadStats])  // Include loadStats in dependencies

  // Real-time listener for athlete feed updates
  useEffect(() => {
    if (!user?.uid) return

    const feedDocRef = doc(db, 'athlete_feed', user.uid)

    const unsubscribe = onSnapshot(
      feedDocRef,
      (snapshot) => {
        if (snapshot.exists() && !snapshot.metadata.hasPendingWrites) {
          console.log('🔄 Athlete feed updated, refreshing stats...')
          // Reload stats when feed changes (new lessons or completion changes)
          loadStats()
        }
      },
      (error) => {
        // Silently handle permission errors for non-existent documents
        if (error.code !== 'permission-denied') {
          console.error('Error listening to athlete feed:', error)
        }
      }
    )

    return () => unsubscribe()
  }, [user?.uid, loadStats])  // Include loadStats in dependencies

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

  const handleMetricClick = (section: string) => {
    // If embedded in iframe, send message to parent to change section
    if (isEmbedded && window.parent !== window) {
      window.parent.postMessage(
        { type: 'CHANGE_SECTION', section },
        window.location.origin
      )
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-500 to-teal-600 rounded-xl p-6 sm:p-8 text-white shadow-lg">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl sm:text-3xl font-bold">
            {greeting()}, {user?.displayName?.split(' ')[0] || 'Athlete'}! 👋
          </h1>
        </div>
        <p className="text-teal-50 text-sm sm:text-base">{formattedDate}</p>
      </div>

      {/* Quick Stats Grid - Now Clickable */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Lessons */}
        <button
          onClick={() => handleMetricClick('lessons')}
          className="bg-white rounded-xl p-5 shadow-sm border-2 border-gray-100 hover:shadow-lg hover:border-sky-blue/50 transition-all text-left cursor-pointer active:scale-95 group"
          style={{ minHeight: '44px' }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-sky-blue/10 flex items-center justify-center group-hover:bg-sky-blue/20 transition-colors">
              <BookOpen className="w-5 h-5" style={{ color: '#7B92C4' }} />
            </div>
            {loading && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
            )}
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.lessonsTotal}</p>
          <p className="text-xs text-gray-600 mt-1">Available Lessons</p>
        </button>

        {/* Lessons Completed */}
        <button
          onClick={() => handleMetricClick('lessons')}
          className="bg-white rounded-xl p-5 shadow-sm border-2 border-gray-100 hover:shadow-lg hover:border-green-500/50 transition-all text-left cursor-pointer active:scale-95 group"
          style={{ minHeight: '44px' }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center group-hover:bg-green-500/20 transition-colors">
              <Trophy className="w-5 h-5 text-green-600" />
            </div>
            {loading && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
            )}
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.lessonsCompleted}</p>
          <p className="text-xs text-gray-600 mt-1">Completed</p>
        </button>

        {/* Upcoming Events */}
        <button
          onClick={() => handleMetricClick('coach-schedule')}
          className="bg-white rounded-xl p-5 shadow-sm border-2 border-gray-100 hover:shadow-lg hover:border-teal/50 transition-all text-left cursor-pointer active:scale-95 group"
          style={{ minHeight: '44px' }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-teal/10 flex items-center justify-center group-hover:bg-teal/20 transition-colors">
              <Calendar className="w-5 h-5" style={{ color: '#5A9A70' }} />
            </div>
            {loading && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
            )}
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.upcomingEvents}</p>
          <p className="text-xs text-gray-600 mt-1">Upcoming Events</p>
        </button>

        {/* Training Streak */}
        <button
          onClick={() => handleMetricClick('lessons')}
          className="bg-white rounded-xl p-5 shadow-sm border-2 border-gray-100 hover:shadow-lg hover:border-orange/50 transition-all text-left cursor-pointer active:scale-95 group"
          style={{ minHeight: '44px' }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-orange/10 flex items-center justify-center group-hover:bg-orange/20 transition-colors">
              <Video className="w-5 h-5" style={{ color: '#FF6B35' }} />
            </div>
            {loading && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
            )}
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.trainingStreak}</p>
          <p className="text-xs text-gray-600 mt-1">Day Streak 🔥</p>
        </button>
      </div>
    </div>
  )
}
