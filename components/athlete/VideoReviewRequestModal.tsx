'use client'

/**
 * Video Review Request Modal
 * Allows athletes to submit video clips for coach review
 */

import { useState } from 'react'
import { X, Upload, Video, FileText, Send } from 'lucide-react'

interface VideoReviewRequestModalProps {
  userId: string
  userEmail: string
  coachId?: string
  onClose: () => void
  onSuccess: () => void
}

export default function VideoReviewRequestModal({
  userId,
  userEmail,
  coachId,
  onClose,
  onSuccess
}: VideoReviewRequestModalProps) {
  const [formData, setFormData] = useState({
    videoUrl: '',
    title: '',
    description: '',
    specificQuestions: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isValid = formData.videoUrl.trim() !== '' &&
    formData.title.trim() !== '' &&
    formData.description.trim() !== ''

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid) return

    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/athlete/video-review/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          athleteId: userId,
          coachId,
          videoUrl: formData.videoUrl.trim(),
          title: formData.title.trim(),
          description: formData.description.trim(),
          specificQuestions: formData.specificQuestions.trim()
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit video review request')
      }

      console.log('✅ Video review request submitted successfully')
      onSuccess()
      onClose()
    } catch (err) {
      console.error('❌ Error submitting video review request:', err)
      setError(err instanceof Error ? err.message : 'Failed to submit request. Please try again.')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b flex items-center justify-between" style={{ borderColor: '#E8E6D8' }}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#91A6EB' }}>
              <Video className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-heading" style={{ color: '#000000' }}>
                Request Video Review
              </h3>
              <p className="text-sm" style={{ color: '#000000', opacity: 0.7 }}>
                Get personalized feedback from your coach
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

          {/* Video URL */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold mb-2" style={{ color: '#000000' }}>
              <Upload className="w-4 h-4" />
              Video URL *
            </label>
            <input
              type="url"
              value={formData.videoUrl}
              onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
              placeholder="https://youtube.com/watch?v=... or https://vimeo.com/..."
              className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-black transition-colors"
              style={{ borderColor: '#E8E6D8' }}
              required
              disabled={isSubmitting}
            />
            <p className="text-xs mt-1" style={{ color: '#000000', opacity: 0.6 }}>
              YouTube, Vimeo, or Google Drive link to your video
            </p>
          </div>

          {/* Title */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold mb-2" style={{ color: '#000000' }}>
              <FileText className="w-4 h-4" />
              Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Pitching Form Review - Fastball"
              className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-black transition-colors"
              style={{ borderColor: '#E8E6D8' }}
              required
              disabled={isSubmitting}
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-semibold mb-2 block" style={{ color: '#000000' }}>
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe what's in the video and what aspect of your performance you'd like reviewed..."
              rows={4}
              className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-black transition-colors resize-none"
              style={{ borderColor: '#E8E6D8' }}
              required
              disabled={isSubmitting}
            />
          </div>

          {/* Specific Questions */}
          <div>
            <label className="text-sm font-semibold mb-2 block" style={{ color: '#000000' }}>
              Specific Questions (Optional)
            </label>
            <textarea
              value={formData.specificQuestions}
              onChange={(e) => setFormData({ ...formData, specificQuestions: e.target.value })}
              placeholder="Any specific questions or areas you want your coach to focus on?"
              rows={3}
              className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-black transition-colors resize-none"
              style={{ borderColor: '#E8E6D8' }}
              disabled={isSubmitting}
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 py-3 px-6 rounded-lg font-semibold transition-colors"
              style={{ backgroundColor: '#E8E6D8', color: '#000000' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isValid || isSubmitting}
              className="flex-1 py-3 px-6 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
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
                  Submit for Review
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
