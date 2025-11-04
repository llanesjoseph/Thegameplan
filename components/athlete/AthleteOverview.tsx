'use client'

import { useState, useEffect, useCallback } from 'react'
import { BookOpen, Video, Calendar, Trophy } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { doc, getDoc, collection, query, where, getDocs, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase.client'
import { useSearchParams } from 'next/navigation'

export default function AthleteOverview() {
  const searchParams = useSearchParams()
  const isEmbedded = searchParams?.get('embedded') === 'true'
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
      let feedData: any = null
      try {
        const feedDoc = await getDoc(doc(db, 'athlete_feed', user.uid))
        if (feedDoc.exists()) {
          feedData = feedDoc.data()
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

      // Calculate training streak based on actual consecutive days of activity
      const calculateStreak = () => {
        if (!feedData?.completedLessons || feedData.completedLessons.length === 0) {
          return 0;
        }

        // Get completion dates from the new completionDates map
        const completionDates = feedData.completionDates || {};

        if (Object.keys(completionDates).length === 0) {
          // No completion dates tracked yet - fallback to checking lastActivity
          const lastActivity = feedData.lastActivity?.toDate?.();
          if (!lastActivity) return 0;

          const now = new Date();
          const hoursSinceLastActivity = (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60);
          const daysSinceLastActivity = Math.floor(hoursSinceLastActivity / 24);

          // If more than 1 day has passed, streak is broken
          return daysSinceLastActivity > 1 ? 0 : 1;
        }

        // Convert completion timestamps to dates (YYYY-MM-DD format for comparison)
        const completionDateStrings = Object.values(completionDates)
          .map((timestamp: any) => {
            const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
            return date.toISOString().split('T')[0]; // YYYY-MM-DD
          })
          .filter((date: string) => date); // Remove any invalid dates

        if (completionDateStrings.length === 0) return 0;

        // Get unique dates (in case multiple lessons completed on same day)
        const uniqueDates = [...new Set(completionDateStrings)].sort().reverse(); // Most recent first

        // Calculate consecutive days working backwards from today/yesterday
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayStr = today.toISOString().split('T')[0];

        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        // Start streak from today or yesterday (grace period)
        let streakStart = -1;
        if (uniqueDates.includes(todayStr)) {
          streakStart = 0; // Start from today
        } else if (uniqueDates.includes(yesterdayStr)) {
          streakStart = 1; // Start from yesterday
        } else {
          return 0; // No recent activity, streak broken
        }

        // Count consecutive days backwards
        let streak = 1;
        let currentDate = new Date(today);
        currentDate.setDate(currentDate.getDate() - streakStart);

        for (let i = streakStart; i < uniqueDates.length; i++) {
          const expectedDateStr = currentDate.toISOString().split('T')[0];

          if (uniqueDates[i] === expectedDateStr) {
            if (i > streakStart) streak++; // Don't double count the first day
            currentDate.setDate(currentDate.getDate() - 1); // Move to previous day
          } else {
            break; // Streak broken
          }
        }

        return streak;
      };

      setStats({
        lessonsCompleted: lessonsCompletedCount,
        lessonsTotal: totalLessons,
        upcomingEvents,
        trainingStreak: calculateStreak()
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

      {/* Compact Stats Grid - Horizontal Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total Lessons */}
        <button
          onClick={() => handleMetricClick('lessons')}
          className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:shadow-md hover:border-sky-blue/50 transition-all text-left cursor-pointer active:scale-95 group"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-sky-blue/10 flex items-center justify-center group-hover:bg-sky-blue/20 transition-colors flex-shrink-0">
              <BookOpen className="w-4 h-4" style={{ color: '#7B92C4' }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xl font-bold text-gray-900">{stats.lessonsTotal}</p>
              <p className="text-xs text-gray-600">Available Lessons</p>
            </div>
            {loading && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
            )}
          </div>
        </button>

        {/* Lessons Completed */}
        <button
          onClick={() => handleMetricClick('lessons')}
          className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:shadow-md hover:border-green-500/50 transition-all text-left cursor-pointer active:scale-95 group"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center group-hover:bg-green-500/20 transition-colors flex-shrink-0">
              <Trophy className="w-4 h-4 text-green-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xl font-bold text-gray-900">{stats.lessonsCompleted}</p>
              <p className="text-xs text-gray-600">Completed</p>
            </div>
            {loading && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
            )}
          </div>
        </button>

        {/* Upcoming Events */}
        <button
          onClick={() => handleMetricClick('coach-schedule')}
          className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:shadow-md hover:border-teal/50 transition-all text-left cursor-pointer active:scale-95 group"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-teal/10 flex items-center justify-center group-hover:bg-teal/20 transition-colors flex-shrink-0">
              <Calendar className="w-4 h-4" style={{ color: '#5A9A70' }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xl font-bold text-gray-900">{stats.upcomingEvents}</p>
              <p className="text-xs text-gray-600">Upcoming Events</p>
            </div>
            {loading && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
            )}
          </div>
        </button>

        {/* Training Streak */}
        <button
          onClick={() => handleMetricClick('lessons')}
          className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:shadow-md hover:border-orange/50 transition-all text-left cursor-pointer active:scale-95 group"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-orange/10 flex items-center justify-center group-hover:bg-orange/20 transition-colors flex-shrink-0">
              <Video className="w-4 h-4" style={{ color: '#FF6B35' }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xl font-bold text-gray-900">{stats.trainingStreak}</p>
              <p className="text-xs text-gray-600">Day Streak 🔥</p>
            </div>
            {loading && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
            )}
          </div>
        </button>
      </div>
    </div>
  )
}
