'use client'

import { useState, useEffect } from 'react'
import { Calendar, Clock, MapPin, Video, Plus } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'

interface TodaysScheduleProps {
  onAddEvent?: () => void
  onViewEvent?: (eventId: string) => void
}

interface ScheduleEvent {
  id: string
  time: string
  title: string
  type: 'training' | 'video_call' | 'in_person' | 'other'
  location?: string
  duration?: string
}

export default function TodaysSchedule({ onAddEvent, onViewEvent }: TodaysScheduleProps) {
  const { user } = useAuth()
  const [events, setEvents] = useState<ScheduleEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.uid) {
      loadTodaysEvents()
    }
  }, [user])

  const loadTodaysEvents = async () => {
    try {
      setLoading(true)
      // TODO: Load today's events from API
      // For now, showing placeholder
      setEvents([])
    } catch (error) {
      console.error('Error loading today\'s events:', error)
    } finally {
      setLoading(false)
    }
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'video_call':
        return Video
      case 'in_person':
        return MapPin
      default:
        return Calendar
    }
  }

  const getColor = (type: string) => {
    switch (type) {
      case 'video_call':
        return '#16A34A'
      case 'in_person':
        return '#91A6EB'
      case 'training':
        return '#20B2AA'
      default:
        return '#666'
    }
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border-2 border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900">Today's Schedule</h2>
        <button
          onClick={onAddEvent}
          className="flex items-center gap-2 px-3 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors text-sm font-semibold touch-manipulation"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Add Event</span>
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-8">
          <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-gray-900">No events scheduled</p>
          <p className="text-xs text-gray-500 mt-1">Your day is clear!</p>
          <button
            onClick={onAddEvent}
            className="mt-4 text-sm text-teal-600 hover:text-teal-700 font-medium"
          >
            Add an event →
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((event) => {
            const Icon = getIcon(event.type)
            const color = getColor(event.type)

            return (
              <button
                key={event.id}
                onClick={() => onViewEvent?.(event.id)}
                className="w-full flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors border-2 border-transparent hover:border-gray-200 text-left touch-manipulation"
              >
                <div className="flex flex-col items-center gap-1 flex-shrink-0">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center shadow-sm"
                    style={{ backgroundColor: color }}
                  >
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-xs font-semibold text-gray-700">
                    {event.time}
                  </span>
                </div>
                <div className="flex-1 min-w-0 pt-1">
                  <p className="text-sm font-semibold text-gray-900 truncate mb-1">
                    {event.title}
                  </p>
                  {event.location && (
                    <div className="flex items-center gap-1 text-xs text-gray-600">
                      <MapPin className="w-3 h-3" />
                      <span className="truncate">{event.location}</span>
                    </div>
                  )}
                  {event.duration && (
                    <div className="flex items-center gap-1 text-xs text-gray-600 mt-1">
                      <Clock className="w-3 h-3" />
                      <span>{event.duration}</span>
                    </div>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* Quick Timeline View */}
      {events.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between text-xs text-gray-600">
            <span>📅 {events.length} {events.length === 1 ? 'event' : 'events'} today</span>
            <button
              className="text-teal-600 hover:text-teal-700 font-medium"
              onClick={() => onViewEvent?.('all')}
            >
              View full calendar →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
