'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { CheckCircle, RefreshCw, Calendar, MapPin, Clock, X } from 'lucide-react'
import { doc, getDoc, collection, query, where, getDocs, Timestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase.client'

interface Event {
  id: string
  title: string
  description?: string
  date: Date
  location?: string
  type?: string
}

export default function AthleteProgress() {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    trainingsComplete: 0,
    trainingsInProgress: 0,
    upcomingEvents: 0
  })
  const [loading, setLoading] = useState(true)
  const [showEventsModal, setShowEventsModal] = useState(false)
  const [events, setEvents] = useState<Event[]>([])

  useEffect(() => {
    const loadProgress = async () => {
      if (!user?.uid) {
        setLoading(false)
        return
      }

      try {
        console.log('🔍 Loading athlete progress for user:', user.uid)

        // Use aggregated API endpoint for accurate metrics from all coaches
        let useDirectCalculation = false
        try {
          const token = await user.getIdToken()
          const response = await fetch('/api/athlete/progress/aggregate', {
            headers: {
              Authorization: `Bearer ${token}`
            }
          })

          if (response.ok) {
            const data = await response.json()
            if (data.success && data.progress) {
              const progress = data.progress
              console.log('✅ Loaded aggregated progress:', progress)
              
              // Load events separately
              let upcomingEventsData: Event[] = []
              const userDoc = await getDoc(doc(db, 'users', user.uid))
              const assignedCoachId = userDoc.data()?.coachId || userDoc.data()?.assignedCoachId
              
              if (assignedCoachId) {
                try {
                  const eventsQuery = query(
                    collection(db, 'coach_schedule'),
                    where('coachId', '==', assignedCoachId)
                  )
                  const eventsSnap = await getDocs(eventsQuery)
                  const now = new Date()
                  
                  upcomingEventsData = eventsSnap.docs
                    .map(doc => ({
                      id: doc.id,
                      title: doc.data().title || 'Event',
                      description: doc.data().description,
                      date: doc.data().eventDate?.toDate() || new Date(),
                      location: doc.data().location,
                      type: doc.data().type
                    }))
                    .filter(event => event.date >= now)
                    .sort((a, b) => a.date.getTime() - b.date.getTime())
                } catch (eventError) {
                  console.warn('⚠️ Could not fetch upcoming events:', eventError)
                }
              }
              
              setEvents(upcomingEventsData)
              setStats({
                trainingsComplete: progress.completedLessons || 0,
                trainingsInProgress: progress.inProgressLessons || 0,
                upcomingEvents: upcomingEventsData.length
              })
              return // Success - exit early
            }
          }
          useDirectCalculation = true
        } catch (apiError) {
          console.warn('⚠️ Could not use aggregated API, falling back to direct calculation:', apiError)
          useDirectCalculation = true
        }

        // Fallback: Direct calculation if API fails
        if (useDirectCalculation) {

        // CRITICAL: Aggregate lessons from ALL followed coaches, not just one
        // 1. Get all followed coaches
        const followsQuery = query(
          collection(db, 'coach_followers'),
          where('athleteId', '==', user.uid)
        )
        const followsSnapshot = await getDocs(followsQuery)
        const followedCoachIds = followsSnapshot.docs.map(doc => doc.data().coachId)
        
        // 2. Get assigned coach if exists
        const userDoc = await getDoc(doc(db, 'users', user.uid))
        const userData = userDoc.data()
        const assignedCoachId = userData?.coachId || userData?.assignedCoachId
        
        // Combine all coach IDs (assigned + followed, no duplicates)
        const allCoachIds = new Set<string>()
        if (assignedCoachId) {
          allCoachIds.add(assignedCoachId)
        }
        followedCoachIds.forEach(coachId => allCoachIds.add(coachId))
        
        console.log('📊 Coaches:', Array.from(allCoachIds))

        // 3. Fetch athlete feed for completion tracking
        const feedDoc = await getDoc(doc(db, 'athlete_feed', user.uid))
        const feedData = feedDoc.exists() ? feedDoc.data() : {}
        const completedLessons = new Set<string>(feedData?.completedLessons || [])
        const startedLessons = new Set<string>(feedData?.startedLessons || [])
        
        // 4. Aggregate ALL lessons from ALL coaches
        const allAvailableLessons = new Set<string>()
        
        // Get lessons from athlete_feed (already aggregated from all coaches)
        const feedAvailableLessons = feedData?.availableLessons || feedData?.lessons || []
        feedAvailableLessons.forEach((lessonId: string) => allAvailableLessons.add(lessonId))
        
        // Also fetch directly from all coaches to ensure we have everything
        for (const coachId of allCoachIds) {
          try {
            const lessonsQuery = query(
              collection(db, 'content'),
              where('creatorUid', '==', coachId),
              where('status', '==', 'published')
            )
            const lessonsSnapshot = await getDocs(lessonsQuery)
            lessonsSnapshot.docs.forEach(doc => {
              allAvailableLessons.add(doc.id)
            })
          } catch (error) {
            console.warn(`⚠️ Could not fetch lessons for coach ${coachId}:`, error)
          }
        }
        
        // Calculate metrics from aggregated data
        const totalLessons = allAvailableLessons.size
        const completedCount = Array.from(completedLessons).filter(id => allAvailableLessons.has(id)).length
        
        // CRITICAL FIX: In progress = lessons that are started but NOT completed
        const startedButNotCompleted = Array.from(startedLessons).filter(
          (lessonId: string) => allAvailableLessons.has(lessonId) && !completedLessons.has(lessonId)
        )
        const inProgressCount = startedButNotCompleted.length

        console.log('📊 Aggregated Progress Data:')
        console.log('  - Total Coaches:', allCoachIds.size)
        console.log('  - Total Lessons (all coaches):', totalLessons)
        console.log('  - Started:', startedLessons.size)
        console.log('  - Completed:', completedCount)
        console.log('  - In Progress (started but not completed):', inProgressCount)

        // Fetch upcoming events
        const userDoc = await getDoc(doc(db, 'users', user.uid))
        const coachId = userDoc.data()?.coachId || userDoc.data()?.assignedCoachId

        let upcomingEventsData: Event[] = []
        if (coachId) {
          try {
            console.log('📅 Fetching all events for coach:', coachId)
            // Get all events for this coach (without date filter to avoid index requirement)
            const eventsQuery = query(
              collection(db, 'coach_schedule'),
              where('coachId', '==', coachId)
            )
            const eventsSnap = await getDocs(eventsQuery)
            const now = new Date()

            // Filter in memory for upcoming events
            upcomingEventsData = eventsSnap.docs
              .map(doc => ({
                id: doc.id,
                title: doc.data().title || 'Event',
                description: doc.data().description,
                date: doc.data().eventDate?.toDate() || new Date(),
                location: doc.data().location,
                type: doc.data().type
              }))
              .filter(event => event.date >= now)
              .sort((a, b) => a.date.getTime() - b.date.getTime())

            console.log('  - Found', upcomingEventsData.length, 'upcoming events')
          } catch (eventError) {
            console.warn('⚠️ Could not fetch upcoming events:', eventError)
            // Continue without events data
          }
        }

        setEvents(upcomingEventsData)
        const finalStats = {
          trainingsComplete: completedCount,
          trainingsInProgress: inProgressCount,
          upcomingEvents: upcomingEventsData.length
        }
        console.log('✅ Final stats:', finalStats)
        setStats(finalStats)
      } catch (error) {
        console.error('❌ Error loading progress:', error)
      } finally {
        setLoading(false)
      }
    }

    loadProgress()
  }, [user])

  return (
    <div>
      <h2 className="text-xl font-bold mb-2" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif', fontWeight: 700 }}>
        Your Progress
      </h2>

      {/* Sharp rectangle button row - spaced to align with coach photos below */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {/* Trainings Complete */}
        <button
          type="button"
          className="group relative bg-black text-white px-5 py-3 flex items-center justify-center gap-2.5 transition-colors hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black/50"
          style={{ fontFamily: '"Open Sans", sans-serif' }}
        >
          <CheckCircle className="w-5 h-5 flex-shrink-0" strokeWidth={2.5} />
          <span className="text-sm font-bold group-hover:hidden whitespace-nowrap">
            Training Complete
          </span>
          <span className="text-sm font-bold hidden group-hover:inline whitespace-nowrap">
            {stats.trainingsComplete} Complete
          </span>
        </button>

        {/* Trainings In Progress */}
        <button
          type="button"
          className="group relative bg-black text-white px-5 py-3 flex items-center justify-center gap-2.5 transition-colors hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black/50"
          style={{ fontFamily: '"Open Sans", sans-serif' }}
        >
          <RefreshCw className="w-5 h-5 flex-shrink-0" strokeWidth={2.5} />
          <span className="text-sm font-bold group-hover:hidden whitespace-nowrap">
            Trainings in Progress
          </span>
          <span className="text-sm font-bold hidden group-hover:inline whitespace-nowrap">
            {stats.trainingsInProgress} In Progress
          </span>
        </button>

        {/* Upcoming Event */}
        <button
          type="button"
          onClick={() => {
            if (stats.upcomingEvents > 0) {
              setShowEventsModal(true)
            }
          }}
          className="group relative bg-black text-white px-5 py-3 flex items-center justify-center gap-2.5 transition-colors hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black/50"
          style={{ fontFamily: '"Open Sans", sans-serif' }}
        >
          <Calendar className="w-5 h-5 flex-shrink-0" strokeWidth={2.5} />
          <span className="text-sm font-bold group-hover:hidden whitespace-nowrap">
            Upcoming Event
          </span>
          <span className="text-sm font-bold hidden group-hover:inline whitespace-nowrap">
            {stats.upcomingEvents} Upcoming
          </span>
        </button>
      </div>

      {/* Events Modal */}
      {showEventsModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={() => setShowEventsModal(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 sm:p-8 max-w-3xl w-full mx-4 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
              <h2 className="text-2xl font-bold" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif', fontWeight: 700 }}>
                Upcoming Events
              </h2>
              <button
                onClick={() => setShowEventsModal(false)}
                className="text-gray-500 hover:text-black transition-colors"
                aria-label="Close"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Events List */}
            <div className="space-y-4">
              {events.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="w-16 h-16 mx-auto mb-4" style={{ color: '#666', opacity: 0.5 }} />
                  <p className="text-lg font-bold mb-2" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif' }}>
                    No upcoming events
                  </p>
                  <p className="text-sm" style={{ color: '#666', fontFamily: '"Open Sans", sans-serif' }}>
                    Check back later for scheduled events
                  </p>
                </div>
              ) : (
                events.map((event) => (
                  <div
                    key={event.id}
                    className="border-2 border-gray-200 rounded-lg p-4 sm:p-5 hover:border-black transition-colors"
                  >
                    {/* Event Title */}
                    <h3 className="text-lg font-bold mb-3" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif', fontWeight: 700 }}>
                      {event.title}
                    </h3>

                    {/* Event Details */}
                    <div className="space-y-2">
                      {/* Date and Time */}
                      <div className="flex items-start gap-2">
                        <Clock className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#666' }} />
                        <div>
                          <p className="text-sm font-semibold" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif' }}>
                            {event.date.toLocaleDateString('en-US', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                          <p className="text-sm" style={{ color: '#666', fontFamily: '"Open Sans", sans-serif' }}>
                            {event.date.toLocaleTimeString('en-US', {
                              hour: 'numeric',
                              minute: '2-digit',
                              hour12: true
                            })}
                          </p>
                        </div>
                      </div>

                      {/* Location */}
                      {event.location && (
                        <div className="flex items-start gap-2">
                          <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#666' }} />
                          <p className="text-sm" style={{ color: '#666', fontFamily: '"Open Sans", sans-serif' }}>
                            {event.location}
                          </p>
                        </div>
                      )}

                      {/* Type Badge */}
                      {event.type && (
                        <div className="pt-1">
                          <span
                            className="inline-block px-3 py-1 rounded-full bg-black text-white text-xs font-bold"
                            style={{ fontFamily: '"Open Sans", sans-serif' }}
                          >
                            {event.type}
                          </span>
                        </div>
                      )}

                      {/* Description */}
                      {event.description && (
                        <div className="pt-2 mt-2 border-t border-gray-100">
                          <p className="text-sm" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif' }}>
                            {event.description}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
