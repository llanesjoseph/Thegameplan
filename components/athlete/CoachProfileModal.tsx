'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import HeroCoachProfile from '@/components/coach/HeroCoachProfile'

interface CoachProfileModalProps {
  isOpen: boolean
  onClose: () => void
  coachId: string
  coachSlug?: string
}

export default function CoachProfileModal({ isOpen, onClose, coachId, coachSlug }: CoachProfileModalProps) {
  const [coach, setCoach] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalLessons, setTotalLessons] = useState(0)
  const [totalAthletes, setTotalAthletes] = useState(0)
  const [lessons, setLessons] = useState<any[]>([])

  useEffect(() => {
    if (isOpen && (coachSlug || coachId)) {
      fetchCoachProfile()
    }
  }, [isOpen, coachSlug, coachId])

  const fetchCoachProfile = async () => {
    try {
      setLoading(true)
      setError(null)

      // Use slug if available, otherwise use ID
      const identifier = coachSlug || coachId
      const response = await fetch(`/api/coach-profile/${identifier}`)
      const result = await response.json()

      if (!result.success) {
        setError(result.error || 'Coach not found')
        return
      }

      const coachProfile = result.data
      setCoach(coachProfile)

      // Fetch additional data
      await fetchCoachStats(coachProfile.uid)

    } catch (error) {
      console.error('Error fetching coach profile:', error)
      setError('Failed to load coach profile')
    } finally {
      setLoading(false)
    }
  }

  const fetchCoachStats = async (coachUid: string) => {
    try {
      const response = await fetch(`/api/coach/${coachUid}/stats`)
      if (response.ok) {
        const data = await response.json()
        setTotalLessons(data.totalLessons || 0)
        setTotalAthletes(data.totalAthletes || 0)
        setLessons(data.lessons || [])
      }
    } catch (error) {
      console.error('Error fetching coach stats:', error)
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="sticky top-4 right-4 z-10 ml-auto mr-4 mt-4 p-2 rounded-full bg-black/80 hover:bg-black text-white transition-colors"
          aria-label="Close"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-black mx-auto mb-4"></div>
              <p style={{ color: '#000000' }}>Loading coach profile...</p>
            </div>
          </div>
        ) : error || !coach ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <p className="text-red-600 mb-4">{error || 'Coach not found'}</p>
              <button
                onClick={onClose}
                className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <div className="pb-6">
            <HeroCoachProfile
              coach={coach}
              totalLessons={totalLessons}
              totalAthletes={totalAthletes}
              lessons={lessons}
              isInIframe={true}
              onBack={onClose}
            />
          </div>
        )}
      </div>
    </div>
  )
}
