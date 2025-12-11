'use client'

import { useState, useEffect } from 'react'
import { Calendar, Plus, Clock, MapPin, FileText, X, Edit2, Trash2, Bell } from 'lucide-react'
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

export default function CoachSchedulePage() {
  const { user } = useAuth()
  const [events, setEvents] = useState<ScheduleEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showEventModal, setShowEventModal] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<ScheduleEvent | null>(null)
  const [currentDate, setCurrentDate] = useState(new Date())

  // Load events
  useEffect(() => {
    if (user) {
      loadEvents()
    }
  }, [user])

  const loadEvents = async () => {
    if (!user) return

    setIsLoading(true)
    try {
      const token = await user.getIdToken()
      const response = await fetch('/api/coach/schedule', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setEvents(data.events || [])
      }
    } catch (error) {
      console.error('Error loading events:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteEvent = async (eventId: string) => {
    if (!user || !confirm('Are you sure you want to delete this event?')) return

    try {
      const token = await user.getIdToken()
      const response = await fetch('/api/coach/schedule', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ eventId })
      })

      if (response.ok) {
        setEvents(events.filter(e => e.id !== eventId))
        setSelectedEvent(null)
      } else {
        alert('Failed to delete event')
      }
    } catch (error) {
      console.error('Error deleting event:', error)
      alert('Failed to delete event')
    }
  }

  // Get days in current month
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days: (Date | null)[] = []

    // Add empty slots for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }

    // Add all days in month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day))
    }

    return days
  }

  // Get events for a specific date
  const getEventsForDate = (date: Date | null) => {
    if (!date) return []

    const dateStr = date.toISOString().split('T')[0]
    return events.filter(event => {
      if (!event.eventDateTime) return false
      const eventDateStr = new Date(event.eventDateTime).toISOString().split('T')[0]
      return eventDateStr === dateStr
    })
  }

  // Navigate months
  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-8"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Schedule Publisher</h1>
          <p className="text-gray-600">Manage your events and sessions</p>
        </div>
        <button
          onClick={() => {
            setSelectedEvent(null)
            setShowEventModal(true)
          }}
          className="bg-gradient-to-r from-teal-500 to-teal-600 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 hover:from-teal-600 hover:to-teal-700 transition-all shadow-lg hover:shadow-xl"
        >
          <Plus className="w-5 h-5" />
          New Event
        </button>
      </div>

      {/* Calendar Navigation */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-teal-500 to-teal-600 p-6 flex items-center justify-between">
          <button
            onClick={previousMonth}
            className="text-white hover:bg-white/20 p-2 rounded-lg transition"
          >
            ←
          </button>
          <h2 className="text-2xl font-bold text-white">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <button
            onClick={nextMonth}
            className="text-white hover:bg-white/20 p-2 rounded-lg transition"
          >
            →
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="p-6">
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {dayNames.map(day => (
              <div key={day} className="text-center font-semibold text-gray-600 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7 gap-2">
            {getDaysInMonth(currentDate).map((date, index) => {
              const dayEvents = date ? getEventsForDate(date) : []
              const isToday = date && date.toDateString() === new Date().toDateString()

              return (
                <div
                  key={index}
                  className={`min-h-28 p-2 border rounded-lg ${
                    date
                      ? isToday
                        ? 'bg-teal-50 border-teal-300'
                        : 'bg-white border-gray-200 hover:border-teal-200 hover:bg-gray-50'
                      : 'bg-gray-50 border-gray-100'
                  } transition-colors`}
                >
                  {date && (
                    <>
                      <div className={`text-sm font-semibold mb-1 ${
                        isToday ? 'text-teal-600' : 'text-gray-700'
                      }`}>
                        {date.getDate()}
                      </div>
                      <div className="space-y-1">
                        {dayEvents.map(event => (
                          <button
                            key={event.id}
                            onClick={() => {
                              setSelectedEvent(event)
                              setShowEventModal(true)
                            }}
                            className="w-full text-left text-xs bg-teal-100 hover:bg-teal-200 text-teal-800 px-2 py-1 rounded truncate transition-colors"
                          >
                            {event.eventType}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Upcoming Events List */}
      <div className="mt-8">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Upcoming Events</h3>
        {events.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No events scheduled</p>
            <p className="text-sm text-gray-400 mt-2">Create your first event to get started</p>
          </div>
        ) : (
          <div className="space-y-3">
            {events.slice(0, 5).map(event => (
              <div
                key={event.id}
                onClick={() => {
                  setSelectedEvent(event)
                  setShowEventModal(true)
                }}
                className="bg-white rounded-lg border border-gray-200 p-4 hover:border-teal-300 hover:shadow-md transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-2">{event.eventType}</h4>
                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        {new Date(event.eventDateTime).toLocaleString()}
                      </div>
                      {event.location && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          {event.location}
                        </div>
                      )}
                    </div>
                  </div>
                  {event.notifyAthletes && (
                    <div className="flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                      <Bell className="w-3 h-3" />
                      Notified
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Event Modal */}
      {showEventModal && (
        <EventModal
          event={selectedEvent}
          onClose={() => {
            setShowEventModal(false)
            setSelectedEvent(null)
          }}
          onSave={(savedEvent) => {
            if (selectedEvent) {
              // Update existing event
              setEvents(events.map(e => e.id === savedEvent.id ? savedEvent : e))
            } else {
              // Add new event
              setEvents([...events, savedEvent])
            }
            setShowEventModal(false)
            setSelectedEvent(null)
            loadEvents() // Refresh to get server data
          }}
          onDelete={handleDeleteEvent}
        />
      )}
    </div>
  )
}

// Event Modal Component
interface EventModalProps {
  event: ScheduleEvent | null
  onClose: () => void
  onSave: (event: ScheduleEvent) => void
  onDelete: (eventId: string) => void
}

function EventModal({ event, onClose, onSave, onDelete }: EventModalProps) {
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    eventType: event?.eventType || '',
    eventDate: event?.eventDateTime?.split('T')[0] || '',
    eventTime: event?.eventDateTime?.split('T')[1]?.substring(0, 5) || '',
    location: event?.location || '',
    notes: event?.notes || '',
    notifyAthletes: event?.notifyAthletes || false
  })
  const [isSaving, setIsSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setIsSaving(true)
    try {
      const token = await user.getIdToken()
      const method = event ? 'PUT' : 'POST'
      const body: any = {
        eventType: formData.eventType,
        eventDate: formData.eventDate,
        eventTime: formData.eventTime,
        location: formData.location,
        notes: formData.notes,
        notifyAthletes: formData.notifyAthletes
      }

      if (event) {
        body.eventId = event.id
      }

      const response = await fetch('/api/coach/schedule', {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      })

      if (response.ok) {
        const data = await response.json()
        onSave({
          id: event?.id || data.eventId,
          ...body,
          eventDateTime: `${formData.eventDate}T${formData.eventTime}`,
          coachId: user.uid,
          coachName: user.displayName || '',
          createdAt: event?.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        } as ScheduleEvent)
      } else {
        alert('Failed to save event')
      }
    } catch (error) {
      console.error('Error saving event:', error)
      alert('Failed to save event')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-xl font-bold text-gray-900">
            {event ? 'Edit Event' : 'Create New Event'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Event Type */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Event Type *
            </label>
            <select
              value={formData.eventType}
              onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              required
            >
              <option value="">Select event type</option>
              <option value="Training Session">Training Session</option>
              <option value="Group Practice">Group Practice</option>
              <option value="1-on-1 Coaching">1-on-1 Coaching</option>
              <option value="Team Meeting">Team Meeting</option>
              <option value="Competition">Competition</option>
              <option value="Workshop">Workshop</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Date *
              </label>
              <input
                type="date"
                value={formData.eventDate}
                onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Time
              </label>
              <input
                type="time"
                value={formData.eventTime}
                onChange={(e) => setFormData({ ...formData, eventTime: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Location
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="e.g., Main Gym, Field #2"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional details about this event..."
              rows={4}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Notify Athletes */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="notifyAthletes"
              checked={formData.notifyAthletes}
              onChange={(e) => setFormData({ ...formData, notifyAthletes: e.target.checked })}
              className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
            />
            <label htmlFor="notifyAthletes" className="text-sm text-gray-700">
              Send notification to assigned athletes
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div>
              {event && (
                <button
                  type="button"
                  onClick={() => onDelete(event.id)}
                  className="text-red-600 hover:text-red-700 font-semibold flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Event
                </button>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="bg-gradient-to-r from-teal-500 to-teal-600 text-white px-6 py-2 rounded-lg font-semibold hover:from-teal-600 hover:to-teal-700 disabled:opacity-50 transition-all"
              >
                {isSaving ? 'Saving...' : event ? 'Update Event' : 'Create Event'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
