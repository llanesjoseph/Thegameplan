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
        // Fetch athlete feed for completion data
        const feedDoc = await getDoc(doc(db, 'athlete_feed', user.uid))
        let completedCount = 0
        let totalLessons = 0
        if (feedDoc.exists()) {
          const feedData = feedDoc.data()
          completedCount = feedData?.completedLessons?.length || 0
          // Get total lessons assigned (both completed and not completed)
          totalLessons = feedData?.lessons?.length || 0
        }

        // Calculate in-progress trainings (total assigned minus completed)
        const inProgressCount = Math.max(0, totalLessons - completedCount)

        // Fetch upcoming events
        const userDoc = await getDoc(doc(db, 'users', user.uid))
        const coachId = userDoc.data()?.coachId || userDoc.data()?.assignedCoachId

        let upcomingEventsData: Event[] = []
        if (coachId) {
          const now = Timestamp.now()
          const eventsQuery = query(
            collection(db, 'coach_schedule'),
            where('coachId', '==', coachId),
            where('eventDate', '>=', now)
          )
          const eventsSnap = await getDocs(eventsQuery)
          upcomingEventsData = eventsSnap.docs.map(doc => ({
            id: doc.id,
            title: doc.data().title || 'Event',
            description: doc.data().description,
            date: doc.data().eventDate?.toDate() || new Date(),
            location: doc.data().location,
            type: doc.data().type
          })).sort((a, b) => a.date.getTime() - b.date.getTime())
        }

        setEvents(upcomingEventsData)
        setStats({
          trainingsComplete: completedCount,
          trainingsInProgress: inProgressCount,
          upcomingEvents: upcomingEventsData.length
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
