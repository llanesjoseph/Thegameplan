'use client'

/**
 * Live 1-on-1 Session Request Modal with Tabs
 * Allows athletes to request live video coaching sessions and view their sessions
 */

import { useState, useEffect } from 'react'
import { X, Video, Calendar, Clock, Send, FileText, AlertCircle, User } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'

interface Live1on1RequestModalProps {
  userId: string
  userEmail: string
  coachId?: string
  coachName?: string
  onClose: () => void
  onSuccess: () => void
}

interface SessionRequest {
  id: string
  athleteId: string
  athleteName: string
  coachId: string | null
  preferredDate: string
  preferredTime: string
  confirmedDate?: string
  confirmedTime?: string
  duration: number
  topic: string
  description: string
  specificGoals?: string
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'rejected'
  createdAt: any
}

export default function Live1on1RequestModal({
  userId,
  userEmail,
  coachId,
  coachName = 'Your Coach',
  onClose,
  onSuccess
}: Live1on1RequestModalProps) {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'request' | 'sessions'>('request')
  const [sessions, setSessions] = useState<SessionRequest[]>([])
  const [loadingSessions, setLoadingSessions] = useState(false)
  const [formData, setFormData] = useState({
    preferredDate: '',
    preferredTime: '',
    duration: '30',
    topic: '',
    description: '',
    specificGoals: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isValid = formData.preferredDate.trim() !== '' &&
                  formData.preferredTime.trim() !== '' &&
                  formData.topic.trim() !== '' &&
                  formData.description.trim() !== ''

  // Load athlete's sessions
  useEffect(() => {
    const loadSessions = async () => {
      if (!user || activeTab !== 'sessions') return

      setLoadingSessions(true)
      try {
        const token = await user.getIdToken()
        const response = await fetch('/api/athlete/live-session/list', {
          headers: { 'Authorization': `Bearer ${token}` }
        })

        if (response.ok) {
          const data = await response.json()
          setSessions(data.sessions || [])
        }
      } catch (error) {
        console.error('Error loading sessions:', error)
      } finally {
        setLoadingSessions(false)
      }
    }

    loadSessions()
  }, [user, activeTab])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid || !user) {
      if (!user) {
        setError('You must be signed in to request a session')
      }
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      // Get authentication token
      const token = await user.getIdToken()

      const response = await fetch('/api/athlete/live-session/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          athleteId: userId,
          athleteEmail: userEmail,
          coachId,
          preferredDate: formData.preferredDate,
          preferredTime: formData.preferredTime,
          duration: parseInt(formData.duration),
          topic: formData.topic.trim(),
          description: formData.description.trim(),
          specificGoals: formData.specificGoals.trim()
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || result.message || 'Failed to submit session request')
      }

      console.log('✅ Live session request submitted successfully:', result.sessionId)

      // Reset form
      setFormData({
        preferredDate: '',
        preferredTime: '',
        duration: '30',
        topic: '',
        description: '',
        specificGoals: ''
      })

      // Switch to sessions tab to show the new request
      setActiveTab('sessions')
      onSuccess()
    } catch (err) {
      console.error('❌ Error submitting live session request:', err)
      setError(err instanceof Error ? err.message : 'Failed to submit request. Please try again.')
      setIsSubmitting(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
      pending: { bg: '#FEF3C7', text: '#92400E', label: 'PENDING' },
      confirmed: { bg: '#DBEAFE', text: '#1E40AF', label: 'CONFIRMED' },
      completed: { bg: '#D1FAE5', text: '#065F46', label: 'COMPLETED' },
      cancelled: { bg: '#FEE2E2', text: '#991B1B', label: 'CANCELLED' },
      rejected: { bg: '#FEE2E2', text: '#991B1B', label: 'DECLINED' }
    }
    const config = statusConfig[status] || statusConfig.pending
    return (
      <span
        className="px-3 py-1 rounded-full text-xs font-bold"
        style={{ backgroundColor: config.bg, color: config.text, fontFamily: '"Open Sans", sans-serif' }}
      >
        {config.label}
      </span>
    )
  }

  // Get tomorrow's date as minimum
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const minDate = tomorrow.toISOString().split('T')[0]

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b" style={{ borderColor: '#E8E6D8' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-green-500 to-emerald-600">
                <Video className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif' }}>
                  1-on-1 Sessions
                </h3>
                <p className="text-sm" style={{ color: '#000000', opacity: 0.7, fontFamily: '"Open Sans", sans-serif' }}>
                  Request and manage sessions with {coachName.split(' ')[0]}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              disabled={isSubmitting}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 border-b-2 border-gray-200" style={{ marginBottom: '-24px', paddingBottom: '0' }}>
            <button
              onClick={() => setActiveTab('request')}
              className={`px-6 py-3 font-bold transition-colors ${
                activeTab === 'request'
                  ? 'border-b-4 border-black text-black'
                  : 'text-gray-500 hover:text-black'
              }`}
              style={{ fontFamily: '"Open Sans", sans-serif', marginBottom: '-2px' }}
            >
              Request Session
            </button>
            <button
              onClick={() => setActiveTab('sessions')}
              className={`px-6 py-3 font-bold transition-colors ${
                activeTab === 'sessions'
                  ? 'border-b-4 border-black text-black'
                  : 'text-gray-500 hover:text-black'
              }`}
              style={{ fontFamily: '"Open Sans", sans-serif', marginBottom: '-2px' }}
            >
              My Sessions ({sessions.length})
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'request' ? (
          /* Request Session Tab */
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Error Message */}
            {error && (
              <div className="p-4 rounded-lg bg-red-50 border-2 border-red-200">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-red-900 mb-1" style={{ fontFamily: '"Open Sans", sans-serif' }}>Error</h4>
                    <p className="text-red-700 text-sm" style={{ fontFamily: '"Open Sans", sans-serif' }}>{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Date and Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium mb-2" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif' }}>
                  <Calendar className="w-4 h-4" />
                  Preferred Date *
                </label>
                <input
                  type="date"
                  value={formData.preferredDate}
                  onChange={(e) => setFormData({ ...formData, preferredDate: e.target.value })}
                  min={minDate}
                  className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-green-500 transition-colors"
                  style={{ borderColor: '#E8E6D8', fontFamily: '"Open Sans", sans-serif' }}
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium mb-2" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif' }}>
                  <Clock className="w-4 h-4" />
                  Preferred Time *
                </label>
                <input
                  type="time"
                  value={formData.preferredTime}
                  onChange={(e) => setFormData({ ...formData, preferredTime: e.target.value })}
                  className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-green-500 transition-colors"
                  style={{ borderColor: '#E8E6D8', fontFamily: '"Open Sans", sans-serif' }}
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Duration */}
            <div>
              <label className="text-sm font-medium mb-2 block" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif' }}>
                Session Duration *
              </label>
              <select
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-green-500 transition-colors"
                style={{ borderColor: '#E8E6D8', fontFamily: '"Open Sans", sans-serif' }}
                required
                disabled={isSubmitting}
              >
                <option value="15">15 minutes</option>
                <option value="30">30 minutes</option>
                <option value="45">45 minutes</option>
                <option value="60">60 minutes</option>
              </select>
            </div>

            {/* Topic */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium mb-2" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif' }}>
                <FileText className="w-4 h-4" />
                Session Topic *
              </label>
              <input
                type="text"
                value={formData.topic}
                onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                placeholder="e.g., Pitching Form Breakdown, Game Strategy Review"
                className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-green-500 transition-colors"
                style={{ borderColor: '#E8E6D8', fontFamily: '"Open Sans", sans-serif' }}
                required
                disabled={isSubmitting}
              />
            </div>

            {/* Description */}
            <div>
              <label className="text-sm font-medium mb-2 block" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif' }}>
                Session Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe what you'd like to work on during this session..."
                rows={4}
                className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-green-500 transition-colors resize-none"
                style={{ borderColor: '#E8E6D8', fontFamily: '"Open Sans", sans-serif' }}
                required
                disabled={isSubmitting}
              />
            </div>

            {/* Specific Goals */}
            <div>
              <label className="text-sm font-medium mb-2 block" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif' }}>
                Specific Goals (Optional)
              </label>
              <textarea
                value={formData.specificGoals}
                onChange={(e) => setFormData({ ...formData, specificGoals: e.target.value })}
                placeholder="What specific outcomes or improvements are you hoping for?"
                rows={3}
                className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-green-500 transition-colors resize-none"
                style={{ borderColor: '#E8E6D8', fontFamily: '"Open Sans", sans-serif' }}
                disabled={isSubmitting}
              />
            </div>

            {/* Info Box */}
            <div className="p-4 rounded-lg bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200">
              <p className="text-sm" style={{ color: '#065F46', fontFamily: '"Open Sans", sans-serif' }}>
                <strong>📅 Note:</strong> Your coach will review your request and confirm the session time.
                You'll receive an email with the meeting link once approved.
              </p>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1 py-3 px-6 rounded-lg transition-colors font-bold"
                style={{ backgroundColor: '#E8E6D8', color: '#000000', fontFamily: '"Open Sans", sans-serif' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!isValid || isSubmitting}
                className="flex-1 py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 font-semibold"
                style={{
                  backgroundColor: isValid && !isSubmitting ? '#16A34A' : '#9CA3AF',
                  color: '#FFFFFF',
                  fontFamily: '"Open Sans", sans-serif'
                }}
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Request Session
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          /* My Sessions Tab */
          <div className="p-6 space-y-4">
            {loadingSessions ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-black mb-4"></div>
                <p style={{ color: '#000000', opacity: 0.7, fontFamily: '"Open Sans", sans-serif' }}>Loading sessions...</p>
              </div>
            ) : sessions.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                <Calendar className="w-16 h-16 mx-auto mb-4" style={{ color: '#666', opacity: 0.5 }} />
                <h3 className="text-lg font-bold mb-2" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif' }}>
                  No Sessions Yet
                </h3>
                <p className="text-sm mb-4" style={{ color: '#666', fontFamily: '"Open Sans", sans-serif' }}>
                  Request your first session to get started
                </p>
                <button
                  onClick={() => setActiveTab('request')}
                  className="px-6 py-2 rounded-lg bg-black text-white hover:bg-gray-800 transition-colors font-bold"
                  style={{ fontFamily: '"Open Sans", sans-serif' }}
                >
                  Request Session
                </button>
              </div>
            ) : (
              sessions.map((session) => (
                <div
                  key={session.id}
                  className="bg-white border-2 rounded-lg p-4 hover:border-black transition-all"
                  style={{ borderColor: session.status === 'pending' ? '#FCD34D' : '#E5E7EB' }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-bold" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif' }}>
                          {session.topic}
                        </h4>
                        {getStatusBadge(session.status)}
                      </div>
                      <p className="text-sm mb-2" style={{ color: '#666', fontFamily: '"Open Sans", sans-serif' }}>
                        {session.description}
                      </p>
                      <div className="space-y-1 text-sm" style={{ color: '#666', fontFamily: '"Open Sans", sans-serif' }}>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {session.status === 'confirmed' && session.confirmedDate
                              ? new Date(session.confirmedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
                              : new Date(session.preferredDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
                            }
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>
                            {session.status === 'confirmed' && session.confirmedTime ? session.confirmedTime : session.preferredTime} ({session.duration} minutes)
                          </span>
                        </div>
                        {session.specificGoals && (
                          <div className="mt-2 p-2 bg-gray-50 rounded">
                            <strong>Goals:</strong> {session.specificGoals}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  {session.status === 'pending' && (
                    <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-xs" style={{ color: '#92400E', fontFamily: '"Open Sans", sans-serif' }}>
                        ⏳ Waiting for coach approval. You'll receive an email once confirmed.
                      </p>
                    </div>
                  )}
                  {session.status === 'confirmed' && (
                    <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-xs" style={{ color: '#065F46', fontFamily: '"Open Sans", sans-serif' }}>
                        ✅ Session confirmed! Check your email for the meeting link.
                      </p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
