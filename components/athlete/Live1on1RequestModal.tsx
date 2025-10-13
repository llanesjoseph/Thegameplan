'use client'

/**
 * Live 1-on-1 Session Request Modal
 * Allows athletes to request live video coaching sessions
 */

import { useState } from 'react'
import { X, Video, Calendar, Clock, Send, FileText } from 'lucide-react'

interface Live1on1RequestModalProps {
  userId: string
  userEmail: string
  coachId?: string
  coachName?: string
  onClose: () => void
  onSuccess: () => void
}

export default function Live1on1RequestModal({
  userId,
  userEmail,
  coachId,
  coachName = 'Your Coach',
  onClose,
  onSuccess
}: Live1on1RequestModalProps) {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid) return

    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/athlete/live-session/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
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
        throw new Error(result.error || 'Failed to submit session request')
      }

      console.log('✅ Live session request submitted successfully')
      onSuccess()
      onClose()
    } catch (err) {
      console.error('❌ Error submitting live session request:', err)
      setError(err instanceof Error ? err.message : 'Failed to submit request. Please try again.')
      setIsSubmitting(false)
    }
  }

  // Get tomorrow's date as minimum
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const minDate = tomorrow.toISOString().split('T')[0]

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b flex items-center justify-between" style={{ borderColor: '#E8E6D8' }}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-green-500 to-emerald-600">
              <Video className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold" style={{ color: '#000000' }}>
                Request Live 1-on-1 Session
              </h3>
              <p className="text-sm" style={{ color: '#000000', opacity: 0.7 }}>
                Schedule a live video coaching session with {coachName.split(' ')[0]}
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error Message */}
          {error && (
            <div className="p-4 rounded-lg" style={{ backgroundColor: '#FEE2E2' }}>
              <p style={{ color: '#DC2626' }}>{error}</p>
            </div>
          )}

          {/* Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium mb-2" style={{ color: '#000000' }}>
                <Calendar className="w-4 h-4" />
                Preferred Date *
              </label>
              <input
                type="date"
                value={formData.preferredDate}
                onChange={(e) => setFormData({ ...formData, preferredDate: e.target.value })}
                min={minDate}
                className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-green-500 transition-colors"
                style={{ borderColor: '#E8E6D8' }}
                required
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium mb-2" style={{ color: '#000000' }}>
                <Clock className="w-4 h-4" />
                Preferred Time *
              </label>
              <input
                type="time"
                value={formData.preferredTime}
                onChange={(e) => setFormData({ ...formData, preferredTime: e.target.value })}
                className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-green-500 transition-colors"
                style={{ borderColor: '#E8E6D8' }}
                required
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Duration */}
          <div>
            <label className="text-sm font-medium mb-2 block" style={{ color: '#000000' }}>
              Session Duration *
            </label>
            <select
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
              className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-green-500 transition-colors"
              style={{ borderColor: '#E8E6D8' }}
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
            <label className="flex items-center gap-2 text-sm font-medium mb-2" style={{ color: '#000000' }}>
              <FileText className="w-4 h-4" />
              Session Topic *
            </label>
            <input
              type="text"
              value={formData.topic}
              onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
              placeholder="e.g., Pitching Form Breakdown, Game Strategy Review"
              className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-green-500 transition-colors"
              style={{ borderColor: '#E8E6D8' }}
              required
              disabled={isSubmitting}
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-medium mb-2 block" style={{ color: '#000000' }}>
              Session Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe what you'd like to work on during this session..."
              rows={4}
              className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-green-500 transition-colors resize-none"
              style={{ borderColor: '#E8E6D8' }}
              required
              disabled={isSubmitting}
            />
          </div>

          {/* Specific Goals */}
          <div>
            <label className="text-sm font-medium mb-2 block" style={{ color: '#000000' }}>
              Specific Goals (Optional)
            </label>
            <textarea
              value={formData.specificGoals}
              onChange={(e) => setFormData({ ...formData, specificGoals: e.target.value })}
              placeholder="What specific outcomes or improvements are you hoping for?"
              rows={3}
              className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-green-500 transition-colors resize-none"
              style={{ borderColor: '#E8E6D8' }}
              disabled={isSubmitting}
            />
          </div>

          {/* Info Box */}
          <div className="p-4 rounded-lg bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200">
            <p className="text-sm" style={{ color: '#065F46' }}>
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
              className="flex-1 py-3 px-6 rounded-lg transition-colors"
              style={{ backgroundColor: '#E8E6D8', color: '#000000' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isValid || isSubmitting}
              className="flex-1 py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 font-semibold"
              style={{
                backgroundColor: isValid && !isSubmitting ? '#16A34A' : '#9CA3AF',
                color: '#FFFFFF'
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
      </div>
    </div>
  )
}
