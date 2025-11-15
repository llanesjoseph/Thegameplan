'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useEnhancedRole } from '@/hooks/use-role-switcher'
import { Calendar, MapPin, Clock, Users, Plus, X, Save, Trash2, Edit2 } from 'lucide-react'
import { useSearchParams } from 'next/navigation'

interface Event {
  id: string
  title: string
  type: 'game' | 'practice' | 'tournament' | 'training' | 'other'
  date: string
  time: string
  location: string
  description: string
  notifyAthletes: boolean
  createdAt: number
}

const EVENT_TYPES = [
  { value: 'game', label: 'Game', color: '#2E7D32' },
  { value: 'practice', label: 'Practice', color: '#1976D2' },
  { value: 'tournament', label: 'Tournament', color: '#D32F2F' },
  { value: 'training', label: 'Training Session', color: '#F57C00' },
  { value: 'other', label: 'Other', color: '#7B1FA2' }
]

export default function CoachEventsPage() {
  const { user, loading: authLoading } = useAuth()
  const { role, loading: roleLoading } = useEnhancedRole()
  const searchParams = useSearchParams()
  const embedded = searchParams.get('embedded') === 'true'

  const [events, setEvents] = useState<Event[]>([])
  const [showNewEventModal, setShowNewEventModal] = useState(false)
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(false)

  // New/Edit event form state
  const [eventForm, setEventForm] = useState({
    title: '',
    type: 'game' as Event['type'],
    date: '',
    time: '',
    location: '',
    description: '',
    notifyAthletes: true
  })

  // Load events from database
  useEffect(() => {
    const loadEvents = async () => {
      if (!user || authLoading || roleLoading) return

      try {
        const token = await user.getIdToken()

        const response = await fetch('/api/coach/events', {
          headers: { 'Authorization': `Bearer ${token}` }
        })

        if (response.ok) {
          const data = await response.json()
          setEvents(data.events || [])
        }
      } catch (error) {
        console.error('Error loading events:', error)
      }
    }

    loadEvents()
  }, [user, authLoading, roleLoading])

  // Reload events from database
  const reloadEvents = async () => {
    if (!user) return
    try {
      const token = await user.getIdToken()

      const response = await fetch('/api/coach/events', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setEvents(data.events || [])
      }
    } catch (error) {
      console.error('Error reloading events:', error)
    }
  }

  const handleCreateEvent = async () => {
    if (!eventForm.title || !eventForm.date || !eventForm.time) {
      alert('Please fill in all required fields')
      return
    }

    if (!user) {
      alert('You must be logged in to create an event')
      return
    }

    try {
      const token = await user.getIdToken()

      const response = await fetch('/api/coach/events', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: eventForm.title,
          type: eventForm.type,
          date: eventForm.date,
          time: eventForm.time,
          location: eventForm.location,
          description: eventForm.description,
          notifyAthletes: eventForm.notifyAthletes
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create event')
      }

      await reloadEvents()
      resetForm()
      setShowNewEventModal(false)

      if (eventForm.notifyAthletes) {
        alert('Event created! Your athletes will be notified.')
      } else {
        alert('Event created successfully!')
      }
    } catch (error) {
      console.error('Error creating event:', error)
      alert(error instanceof Error ? error.message : 'Failed to create event')
    }
  }

  const handleUpdateEvent = async () => {
    if (!editingEvent || !eventForm.title || !eventForm.date || !eventForm.time) {
      alert('Please fill in all required fields')
      return
    }

    if (!user) {
      alert('You must be logged in to update an event')
      return
    }

    try {
      const token = await user.getIdToken()

      const response = await fetch('/api/coach/events', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: editingEvent.id,
          title: eventForm.title,
          type: eventForm.type,
          date: eventForm.date,
          time: eventForm.time,
          location: eventForm.location,
          description: eventForm.description,
          notifyAthletes: eventForm.notifyAthletes
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update event')
      }

      await reloadEvents()
      resetForm()
      setEditingEvent(null)
      alert('Event updated successfully!')
    } catch (error) {
      console.error('Error updating event:', error)
      alert(error instanceof Error ? error.message : 'Failed to update event')
    }
  }

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event?')) {
      return
    }

    if (!user) {
      alert('You must be logged in to delete an event')
      return
    }

    try {
      const token = await user.getIdToken()

      const response = await fetch(`/api/coach/events?id=${eventId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete event')
      }

      await reloadEvents()
      alert('Event deleted successfully')
    } catch (error) {
      console.error('Error deleting event:', error)
      alert(error instanceof Error ? error.message : 'Failed to delete event')
    }
  }

  const openEditModal = (event: Event) => {
    setEditingEvent(event)
    setEventForm({
      title: event.title,
      type: event.type,
      date: event.date,
      time: event.time,
      location: event.location,
      description: event.description,
      notifyAthletes: event.notifyAthletes
    })
  }

  const resetForm = () => {
    setEventForm({
      title: '',
      type: 'game',
      date: '',
      time: '',
      location: '',
      description: '',
      notifyAthletes: true
    })
  }

  // Sort events by date
  const sortedEvents = [...events].sort((a, b) => {
    const dateA = new Date(`${a.date} ${a.time}`).getTime()
    const dateB = new Date(`${b.date} ${b.time}`).getTime()
    return dateA - dateB
  })

  // Show loading state
  if (authLoading || roleLoading) {
    return (
      <div className={embedded ? 'p-8' : 'min-h-screen flex items-center justify-center bg-white'}>
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-black mb-4"></div>
          <p style={{ color: '#000000', opacity: 0.7, fontFamily: '"Open Sans", sans-serif' }}>Loading...</p>
        </div>
      </div>
    )
  }

  // Check access
  if (!user || (role !== 'coach' && role !== 'creator' && role !== 'superadmin' && role !== 'admin')) {
    return (
      <div className={embedded ? 'p-8' : 'min-h-screen flex items-center justify-center bg-white'}>
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif' }}>Access Denied</h2>
          <p style={{ color: '#666', fontFamily: '"Open Sans", sans-serif' }}>This area is for coaches only.</p>
        </div>
      </div>
    )
  }

  return (
    <div className={embedded ? 'p-6' : 'min-h-screen bg-white p-8'}>
      {/* Header */}
      {!embedded && (
        <div className="max-w-6xl mx-auto mb-6">
          <h1 className="text-3xl font-bold mb-2" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif' }}>
            Event Schedule
          </h1>
          <p style={{ color: '#666', fontFamily: '"Open Sans", sans-serif' }}>
            Share games, tournaments, and important training events with your athletes
          </p>
        </div>
      )}

      <div className={embedded ? '' : 'max-w-6xl mx-auto'}>
        {/* Create New Event Button */}
        <div className="mb-6">
          <button
            onClick={() => {
              resetForm()
              setShowNewEventModal(true)
            }}
            className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2 font-bold"
            style={{ fontFamily: '"Open Sans", sans-serif' }}
          >
            <Plus className="w-5 h-5" />
            Create New Event
          </button>
        </div>

        {/* Events List */}
        <div className="space-y-4">
          {sortedEvents.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
              <Calendar className="w-16 h-16 mx-auto mb-4" style={{ color: '#666', opacity: 0.5 }} />
              <h3 className="text-lg font-bold mb-2" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif' }}>
                No events scheduled
              </h3>
              <p className="text-sm mb-4" style={{ color: '#666', fontFamily: '"Open Sans", sans-serif' }}>
                Click "Create New Event" to share games and important dates with your athletes
              </p>
            </div>
          ) : (
            sortedEvents.map((event) => {
              const eventType = EVENT_TYPES.find(t => t.value === event.type)
              return (
                <div
                  key={event.id}
                  className="bg-white border-2 border-gray-200 rounded-lg p-6 hover:border-black transition-colors"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span
                          className="px-3 py-1 rounded-full text-xs font-bold text-white"
                          style={{
                            backgroundColor: eventType?.color || '#666',
                            fontFamily: '"Open Sans", sans-serif'
                          }}
                        >
                          {eventType?.label || event.type}
                        </span>
                        <h3 className="text-xl font-bold" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif' }}>
                          {event.title}
                        </h3>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEditModal(event)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Edit event"
                      >
                        <Edit2 className="w-5 h-5" style={{ color: '#000000' }} />
                      </button>
                      <button
                        onClick={() => handleDeleteEvent(event.id)}
                        className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                        title="Delete event"
                      >
                        <Trash2 className="w-5 h-5" style={{ color: '#FC0105' }} />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm" style={{ color: '#666', fontFamily: '"Open Sans", sans-serif' }}>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>{event.time}</span>
                    </div>
                    {event.location && (
                      <div className="flex items-center gap-2 md:col-span-2">
                        <MapPin className="w-4 h-4" />
                        <span>{event.location}</span>
                      </div>
                    )}
                  </div>

                  {event.description && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-sm" style={{ color: '#000000', opacity: 0.8, fontFamily: '"Open Sans", sans-serif' }}>
                        {event.description}
                      </p>
                    </div>
                  )}

                  {event.notifyAthletes && (
                    <div className="mt-4 flex items-center gap-2 text-xs" style={{ color: '#2E7D32', fontFamily: '"Open Sans", sans-serif' }}>
                      <Users className="w-4 h-4" />
                      <span>Athletes notified</span>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* New/Edit Event Modal */}
      {(showNewEventModal || editingEvent) && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={() => {
            setShowNewEventModal(false)
            setEditingEvent(null)
            resetForm()
          }}
        >
          <div
            className="bg-white rounded-2xl p-8 max-w-2xl w-full mx-4 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif' }}>
                {editingEvent ? 'Edit Event' : 'Create New Event'}
              </h2>
              <button
                onClick={() => {
                  setShowNewEventModal(false)
                  setEditingEvent(null)
                  resetForm()
                }}
                className="text-gray-500 hover:text-black text-2xl font-bold"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Event Title */}
              <div>
                <label className="block text-sm font-bold mb-2" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif' }}>
                  Event Title <span style={{ color: '#FC0105' }}>*</span>
                </label>
                <input
                  type="text"
                  value={eventForm.title}
                  onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                  placeholder="e.g., Championship Game vs. Eagles"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                  style={{ fontFamily: '"Open Sans", sans-serif' }}
                />
              </div>

              {/* Event Type */}
              <div>
                <label className="block text-sm font-bold mb-2" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif' }}>
                  Event Type <span style={{ color: '#FC0105' }}>*</span>
                </label>
                <select
                  value={eventForm.type}
                  onChange={(e) => setEventForm({ ...eventForm, type: e.target.value as Event['type'] })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                  style={{ fontFamily: '"Open Sans", sans-serif' }}
                >
                  {EVENT_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date and Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-2" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif' }}>
                    Date <span style={{ color: '#FC0105' }}>*</span>
                  </label>
                  <input
                    type="date"
                    value={eventForm.date}
                    onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                    style={{ fontFamily: '"Open Sans", sans-serif' }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif' }}>
                    Time <span style={{ color: '#FC0105' }}>*</span>
                  </label>
                  <input
                    type="time"
                    value={eventForm.time}
                    onChange={(e) => setEventForm({ ...eventForm, time: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                    style={{ fontFamily: '"Open Sans", sans-serif' }}
                  />
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-bold mb-2" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif' }}>
                  Location (Optional)
                </label>
                <input
                  type="text"
                  value={eventForm.location}
                  onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
                  placeholder="e.g., Main Stadium, 123 Sports Ave"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                  style={{ fontFamily: '"Open Sans", sans-serif' }}
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-bold mb-2" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif' }}>
                  Description (Optional)
                </label>
                <textarea
                  value={eventForm.description}
                  onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                  placeholder="Add any important details, requirements, or notes for your athletes..."
                  rows={4}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                  style={{ fontFamily: '"Open Sans", sans-serif' }}
                />
              </div>

              {/* Notify Athletes Checkbox */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="notifyAthletes"
                  checked={eventForm.notifyAthletes}
                  onChange={(e) => setEventForm({ ...eventForm, notifyAthletes: e.target.checked })}
                  className="w-5 h-5 rounded border-2 border-gray-200"
                  style={{ accentColor: '#000000' }}
                />
                <label htmlFor="notifyAthletes" className="text-sm font-bold cursor-pointer" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif' }}>
                  Notify athletes about this event
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={editingEvent ? handleUpdateEvent : handleCreateEvent}
                  className="flex-1 px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 font-bold"
                  style={{ fontFamily: '"Open Sans", sans-serif' }}
                >
                  <Save className="w-5 h-5" />
                  {editingEvent ? 'Update Event' : 'Create Event'}
                </button>
                <button
                  onClick={() => {
                    setShowNewEventModal(false)
                    setEditingEvent(null)
                    resetForm()
                  }}
                  className="px-6 py-3 bg-gray-100 text-black rounded-lg hover:bg-gray-200 transition-colors font-bold"
                  style={{ fontFamily: '"Open Sans", sans-serif' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
