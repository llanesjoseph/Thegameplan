'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useEnhancedRole } from '@/hooks/use-role-switcher'
import { Calendar, Clock, User, Plus, X, Save } from 'lucide-react'
import { useSearchParams } from 'next/navigation'

interface TrainingSession {
  id: string
  athleteId: string
  athleteName: string
  date: string
  time: string
  duration: number
  notes: string
  status: 'scheduled' | 'completed' | 'cancelled'
}

interface Athlete {
  id: string
  name: string
  email: string
}

export default function LiveSessionsPage() {
  const { user, loading: authLoading } = useAuth()
  const { role, loading: roleLoading } = useEnhancedRole()
  const searchParams = useSearchParams()
  const embedded = searchParams.get('embedded') === 'true'

  const [sessions, setSessions] = useState<TrainingSession[]>([])
  const [athletes, setAthletes] = useState<Athlete[]>([])
  const [showNewSessionModal, setShowNewSessionModal] = useState(false)
  const [loading, setLoading] = useState(true)

  // New session form state
  const [newSession, setNewSession] = useState({
    athleteId: '',
    date: '',
    time: '',
    duration: 60,
    notes: ''
  })

  // Load athletes and sessions
  useEffect(() => {
    const loadData = async () => {
      if (!user || authLoading || roleLoading) return

      try {
        const token = await user.getIdToken()

        // Load athletes
        const athletesResponse = await fetch('/api/coach/athletes', {
          headers: { 'Authorization': `Bearer ${token}` }
        })

        if (athletesResponse.ok) {
          const athletesData = await athletesResponse.json()
          setAthletes(athletesData.athletes || [])
        }

        // Load sessions from database
        const sessionsResponse = await fetch('/api/coach/sessions', {
          headers: { 'Authorization': `Bearer ${token}` }
        })

        if (sessionsResponse.ok) {
          const sessionsData = await sessionsResponse.json()
          setSessions(sessionsData.sessions || [])
        }
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [user, authLoading, roleLoading])

  const handleCreateSession = async () => {
    if (!newSession.athleteId || !newSession.date || !newSession.time) {
      alert('Please fill in all required fields')
      return
    }

    if (!user) {
      alert('You must be logged in to create a session')
      return
    }

    try {
      const token = await user.getIdToken()

      const response = await fetch('/api/coach/sessions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          athleteId: newSession.athleteId,
          date: newSession.date,
          time: newSession.time,
          duration: newSession.duration,
          notes: newSession.notes
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create session')
      }

      const data = await response.json()

      // Reload sessions
      const sessionsResponse = await fetch('/api/coach/sessions', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (sessionsResponse.ok) {
        const sessionsData = await sessionsResponse.json()
        setSessions(sessionsData.sessions || [])
      }

      setShowNewSessionModal(false)
      setNewSession({
        athleteId: '',
        date: '',
        time: '',
        duration: 60,
        notes: ''
      })

      alert('Session scheduled successfully!')
    } catch (error) {
      console.error('Error creating session:', error)
      alert(error instanceof Error ? error.message : 'Failed to create session')
    }
  }

  // Show loading state
  if (authLoading || roleLoading || loading) {
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
            1:1 Training Sessions
          </h1>
          <p style={{ color: '#666', fontFamily: '"Open Sans", sans-serif' }}>
            Schedule and manage one-on-one sessions with your athletes
          </p>
        </div>
      )}

      <div className={embedded ? '' : 'max-w-6xl mx-auto'}>
        {/* Schedule New Session Button */}
        <div className="mb-6">
          <button
            onClick={() => setShowNewSessionModal(true)}
            className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2 font-bold"
            style={{ fontFamily: '"Open Sans", sans-serif' }}
          >
            <Plus className="w-5 h-5" />
            Schedule New Session
          </button>
        </div>

        {/* Sessions List */}
        <div className="space-y-4">
          {sessions.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
              <Calendar className="w-16 h-16 mx-auto mb-4" style={{ color: '#666', opacity: 0.5 }} />
              <h3 className="text-lg font-bold mb-2" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif' }}>
                No sessions scheduled
              </h3>
              <p className="text-sm mb-4" style={{ color: '#666', fontFamily: '"Open Sans", sans-serif' }}>
                Click "Schedule New Session" to create your first 1:1 training session
              </p>
            </div>
          ) : (
            sessions.map((session) => (
              <div
                key={session.id}
                className="bg-white border-2 border-gray-200 rounded-lg p-4 hover:border-black transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <User className="w-5 h-5" style={{ color: '#000000' }} />
                      <h3 className="font-bold" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif' }}>
                        {session.athleteName}
                      </h3>
                    </div>
                    <div className="space-y-1 text-sm" style={{ color: '#666', fontFamily: '"Open Sans", sans-serif' }}>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(session.date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>{session.time} ({session.duration} minutes)</span>
                      </div>
                      {session.notes && (
                        <p className="mt-2">{session.notes}</p>
                      )}
                    </div>
                  </div>
                  <span
                    className="px-3 py-1 rounded-full text-xs font-bold"
                    style={{
                      backgroundColor: session.status === 'scheduled' ? '#E8F5E9' : '#FFF3E0',
                      color: session.status === 'scheduled' ? '#2E7D32' : '#E65100',
                      fontFamily: '"Open Sans", sans-serif'
                    }}
                  >
                    {session.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* New Session Modal */}
      {showNewSessionModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={() => setShowNewSessionModal(false)}
        >
          <div
            className="bg-white rounded-2xl p-8 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif' }}>
                Schedule Training Session
              </h2>
              <button
                onClick={() => setShowNewSessionModal(false)}
                className="text-gray-500 hover:text-black text-2xl font-bold"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Athlete Selection */}
              <div>
                <label className="block text-sm font-bold mb-2" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif' }}>
                  Select Athlete <span style={{ color: '#FC0105' }}>*</span>
                </label>
                <select
                  value={newSession.athleteId}
                  onChange={(e) => setNewSession({ ...newSession, athleteId: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                  style={{ fontFamily: '"Open Sans", sans-serif' }}
                >
                  <option value="">Select an athlete...</option>
                  {athletes.map((athlete) => (
                    <option key={athlete.id} value={athlete.id}>
                      {athlete.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-bold mb-2" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif' }}>
                  Date <span style={{ color: '#FC0105' }}>*</span>
                </label>
                <input
                  type="date"
                  value={newSession.date}
                  onChange={(e) => setNewSession({ ...newSession, date: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                  style={{ fontFamily: '"Open Sans", sans-serif' }}
                />
              </div>

              {/* Time */}
              <div>
                <label className="block text-sm font-bold mb-2" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif' }}>
                  Time <span style={{ color: '#FC0105' }}>*</span>
                </label>
                <input
                  type="time"
                  value={newSession.time}
                  onChange={(e) => setNewSession({ ...newSession, time: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                  style={{ fontFamily: '"Open Sans", sans-serif' }}
                />
              </div>

              {/* Duration */}
              <div>
                <label className="block text-sm font-bold mb-2" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif' }}>
                  Duration (minutes)
                </label>
                <input
                  type="number"
                  value={newSession.duration}
                  onChange={(e) => setNewSession({ ...newSession, duration: parseInt(e.target.value) || 60 })}
                  min="15"
                  max="240"
                  step="15"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                  style={{ fontFamily: '"Open Sans", sans-serif' }}
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-bold mb-2" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif' }}>
                  Session Notes (Optional)
                </label>
                <textarea
                  value={newSession.notes}
                  onChange={(e) => setNewSession({ ...newSession, notes: e.target.value })}
                  placeholder="Add any notes or focus areas for this session..."
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                  style={{ fontFamily: '"Open Sans", sans-serif' }}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleCreateSession}
                  className="flex-1 px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 font-bold"
                  style={{ fontFamily: '"Open Sans", sans-serif' }}
                >
                  <Save className="w-5 h-5" />
                  Schedule Session
                </button>
                <button
                  onClick={() => setShowNewSessionModal(false)}
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
