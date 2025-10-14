'use client'

import { useState, useEffect } from 'react'
import { Calendar, Clock, MapPin, FileText, AlertCircle } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'

interface ScheduleEvent {
  id: string
  coachId: string
  coachName: string
  eventType: string
  eventDate: string
  eventDateTime: string
  location: string
  notes: string
  notifyAthletes: boolean
  createdAt: string
  updatedAt: string
}

export default function CoachScheduleView() {
  const { user } = useAuth()
  const [events, setEvents] = useState<ScheduleEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [infoMessage, setInfoMessage] = useState<string | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<ScheduleEvent | null>(null)

  useEffect(() => {
    if (user) {
      loadSchedule()
    }
  }, [user])

  const loadSchedule = async () => {
    if (!user) {
      setError('Please sign in to view your coach\'s schedule')
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)
    setInfoMessage(null)

    try {
      const token = await user.getIdToken()
      const response = await fetch('/api/athlete/coach-schedule', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (response.ok) {
        setEvents(data.events || [])
        // Store any informational message from the API
        if (data.message) {
          setInfoMessage(data.message)
        }
      } else {
        // Handle error responses
        setError(data.error || data.message || 'Failed to load schedule')
      }
    } catch (error) {
      console.error('Error loading schedule:', error)
      if (error instanceof TypeError && error.message.includes('fetch')) {
        setError('Network error: Unable to connect to the server. Please check your internet connection.')
      } else {
        setError('An unexpected error occurred while loading the schedule. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const formatDateTime = (dateTimeStr: string) => {
    const date = new Date(dateTimeStr)
    return {
      date: date.toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }),
      time: date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })
    }
  }

  const groupEventsByDate = () => {
    const grouped: { [key: string]: ScheduleEvent[] } = {}

    events.forEach(event => {
      const dateKey = new Date(event.eventDateTime).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })

      if (!grouped[dateKey]) {
        grouped[dateKey] = []
      }
      grouped[dateKey].push(event)
    })

    return grouped
  }

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-64"></div>
          <div className="h-24 bg-gray-200 rounded"></div>
          <div className="h-24 bg-gray-200 rounded"></div>
          <div className="h-24 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-start gap-3 mb-4">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-red-900 mb-1">Error Loading Schedule</h3>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
          <button
            onClick={loadSchedule}
            className="bg-red-100 hover:bg-red-200 text-red-700 px-4 py-2 rounded-lg font-semibold transition-colors text-sm"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  const groupedEvents = groupEventsByDate()
  const dateKeys = Object.keys(groupedEvents).sort((a, b) =>
    new Date(a).getTime() - new Date(b).getTime()
  )

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Coach's Schedule</h1>
        <p className="text-gray-600">View upcoming events and training sessions</p>
      </div>

      {/* No Events */}
      {events.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Upcoming Events</h3>
          <p className="text-gray-600 mb-4">
            {infoMessage || "Your coach hasn't published any upcoming events yet."}
          </p>
          {infoMessage && (
            <button
              onClick={loadSchedule}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-semibold transition-colors text-sm inline-flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Events Timeline */}
          <div className="space-y-8">
            {dateKeys.map(dateKey => (
              <div key={dateKey}>
                {/* Date Header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-gradient-to-r from-teal-500 to-teal-600 text-white px-4 py-2 rounded-lg font-semibold">
                    {dateKey}
                  </div>
                  <div className="flex-1 h-px bg-gray-200"></div>
                </div>

                {/* Events for this date */}
                <div className="space-y-3">
                  {groupedEvents[dateKey]
                    .sort((a, b) => new Date(a.eventDateTime).getTime() - new Date(b.eventDateTime).getTime())
                    .map(event => {
                      const { time } = formatDateTime(event.eventDateTime)

                      return (
                        <div
                          key={event.id}
                          onClick={() => setSelectedEvent(event)}
                          className="bg-white rounded-lg border border-gray-200 p-5 hover:border-teal-300 hover:shadow-lg transition-all cursor-pointer"
                        >
                          <div className="flex items-start gap-4">
                            {/* Time Badge */}
                            <div className="flex-shrink-0 text-center">
                              <div className="bg-teal-100 text-teal-700 px-3 py-2 rounded-lg font-semibold text-sm">
                                {time}
                              </div>
                            </div>

                            {/* Event Details */}
                            <div className="flex-1 min-w-0">
                              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                {event.eventType}
                              </h3>

                              <div className="space-y-2">
                                {event.location && (
                                  <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <MapPin className="w-4 h-4 flex-shrink-0" />
                                    <span>{event.location}</span>
                                  </div>
                                )}

                                {event.notes && (
                                  <div className="flex items-start gap-2 text-sm text-gray-600">
                                    <FileText className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                    <span className="line-clamp-2">{event.notes}</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Event Type Badge */}
                            <div className="flex-shrink-0">
                              <span className="inline-block bg-blue-100 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full">
                                {event.eventType}
                              </span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                </div>
              </div>
            ))}
          </div>

          {/* Summary Stats */}
          <div className="mt-8 bg-gradient-to-r from-teal-500 to-teal-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-teal-100 text-sm mb-1">Total Upcoming Events</p>
                <p className="text-3xl font-bold">{events.length}</p>
              </div>
              <Calendar className="w-12 h-12 text-teal-200" />
            </div>
          </div>
        </>
      )}

      {/* Event Detail Modal */}
      {selectedEvent && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedEvent(null)}
        >
          <div
            className="bg-white rounded-xl max-w-2xl w-full p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {selectedEvent.eventType}
              </h2>
              <div className="flex items-center gap-2 text-gray-600">
                <Clock className="w-4 h-4" />
                <span>{formatDateTime(selectedEvent.eventDateTime).date}</span>
                <span className="text-gray-400">•</span>
                <span>{formatDateTime(selectedEvent.eventDateTime).time}</span>
              </div>
            </div>

            {selectedEvent.location && (
              <div className="mb-4">
                <div className="flex items-center gap-2 text-gray-700 font-semibold mb-2">
                  <MapPin className="w-5 h-5" />
                  <span>Location</span>
                </div>
                <p className="text-gray-600 ml-7">{selectedEvent.location}</p>
              </div>
            )}

            {selectedEvent.notes && (
              <div className="mb-6">
                <div className="flex items-center gap-2 text-gray-700 font-semibold mb-2">
                  <FileText className="w-5 h-5" />
                  <span>Details</span>
                </div>
                <p className="text-gray-600 ml-7 whitespace-pre-wrap">{selectedEvent.notes}</p>
              </div>
            )}

            <div className="flex justify-end">
              <button
                onClick={() => setSelectedEvent(null)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-2 rounded-lg font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
