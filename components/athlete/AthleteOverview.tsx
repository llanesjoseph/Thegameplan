'use client'

import { useState, useEffect, useCallback } from 'react'
import { BookOpen, Calendar, Trophy } from 'lucide-react'
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
    upcomingEvents: 0
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

      setStats({
        lessonsCompleted: lessonsCompletedCount,
        lessonsTotal: totalLessons,
        upcomingEvents
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
    <div className="mb-3">
      {/* Welcome Header - Clean, no cards */}
      <h1 className="text-2xl sm:text-3xl font-bold mb-1" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif', fontWeight: 700 }}>
        Welcome to your game plan, {user?.displayName?.split(' ')[0] || 'Athlete'}!
      </h1>
      <p className="text-sm" style={{ color: '#666', fontFamily: '"Open Sans", sans-serif' }}>
        This is where you can keep track of your coaches, upcoming training and events, and manage your progress, on and off the field.
      </p>
    </div>
  )
}
