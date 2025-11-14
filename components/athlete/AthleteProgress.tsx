'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { CheckCircle, RefreshCw, Calendar } from 'lucide-react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase.client'

export default function AthleteProgress() {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    trainingsComplete: 0,
    trainingsInProgress: 0,
    upcomingEvents: 0
  })
  const [loading, setLoading] = useState(true)
  const [active, setActive] = useState<null | 'complete' | 'progress' | 'upcoming'>(null)
  const revertTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const triggerMorph = (key: 'complete' | 'progress' | 'upcoming') => {
    if (revertTimer.current) clearTimeout(revertTimer.current)
    setActive(key)
    revertTimer.current = setTimeout(() => setActive(null), 5000)
  }

  useEffect(() => {
    return () => {
      if (revertTimer.current) clearTimeout(revertTimer.current)
    }
  }, [])

  useEffect(() => {
    const loadProgress = async () => {
      if (!user?.uid) {
        setLoading(false)
        return
      }

      try {
        // Fetch athlete feed for completion data
        const feedDoc = await getDoc(doc(db, 'athlete_feed', user.uid))
        let completedCount = 0
        if (feedDoc.exists()) {
          const feedData = feedDoc.data()
          completedCount = feedData?.completedLessons?.length || 0
        }

        // TODO: Fetch in-progress trainings and upcoming events
        setStats({
          trainingsComplete: completedCount,
          trainingsInProgress: 0,
          upcomingEvents: 0
        })
      } catch (error) {
        console.error('Error loading progress:', error)
      } finally {
        setLoading(false)
      }
    }

    loadProgress()
  }, [user])

  return (
    <div>
      <h2 className="text-xl font-bold mb-2" style={{ color: '#000000', fontFamily: 'Open Sans, sans-serif', fontWeight: 700 }}>
        Your Progress
      </h2>

      {/* Clean minimal button row */}
      <div className="relative">
        <div className="flex flex-wrap gap-3">
          {/* Trainings Complete */}
          <button
            type="button"
            aria-pressed={active === 'complete'}
            onClick={() => triggerMorph('complete')}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && triggerMorph('complete')}
            className={`transition-all duration-300 ease-out rounded-full px-4 py-2.5 flex items-center gap-2.5 focus:outline-none focus:ring-2 focus:ring-black/20 ${active === 'complete' ? 'bg-black text-white shadow-lg scale-105' : 'bg-white text-black border-2 border-black hover:bg-gray-50'}`}
          >
            <CheckCircle className="w-5 h-5" strokeWidth={2.5} />
            <span className="text-sm font-bold" style={{ fontFamily: 'Open Sans, sans-serif' }}>
              {active === 'complete' ? `${stats.trainingsComplete} Complete` : 'Training Complete'}
            </span>
          </button>

          {/* Trainings In Progress */}
          <button
            type="button"
            aria-pressed={active === 'progress'}
            onClick={() => triggerMorph('progress')}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && triggerMorph('progress')}
            className={`transition-all duration-300 ease-out rounded-full px-4 py-2.5 flex items-center gap-2.5 focus:outline-none focus:ring-2 focus:ring-black/20 ${active === 'progress' ? 'bg-black text-white shadow-lg scale-105' : 'bg-white text-black border-2 border-black hover:bg-gray-50'}`}
          >
            <RefreshCw className="w-5 h-5" strokeWidth={2.5} />
            <span className="text-sm font-bold" style={{ fontFamily: 'Open Sans, sans-serif' }}>
              {active === 'progress' ? `${stats.trainingsInProgress} In Progress` : 'Trainings in Progress'}
            </span>
          </button>

          {/* Upcoming Event */}
          <button
            type="button"
            aria-pressed={active === 'upcoming'}
            onClick={() => triggerMorph('upcoming')}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && triggerMorph('upcoming')}
            className={`transition-all duration-300 ease-out rounded-full px-4 py-2.5 flex items-center gap-2.5 focus:outline-none focus:ring-2 focus:ring-black/20 ${active === 'upcoming' ? 'bg-black text-white shadow-lg scale-105' : 'bg-white text-black border-2 border-black hover:bg-gray-50'}`}
          >
            <Calendar className="w-5 h-5" strokeWidth={2.5} />
            <span className="text-sm font-bold" style={{ fontFamily: 'Open Sans, sans-serif' }}>
              {active === 'upcoming' ? `${stats.upcomingEvents} Upcoming` : 'Upcoming Event'}
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}

