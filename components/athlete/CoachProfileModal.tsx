'use client'

import { useState, useEffect } from 'react'
import HeroCoachProfile from '@/components/coach/HeroCoachProfile'

interface CoachProfileModalProps {
  isOpen: boolean
  onClose: () => void
  coachId: string
  coachSlug?: string
  hideLessons?: boolean
}

export default function CoachProfileModal({ isOpen, onClose, coachId, coachSlug, hideLessons = false }: CoachProfileModalProps) {
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

      console.log('🔍 CoachProfileModal - Fetching coach profile')
      console.log('  - coachId:', coachId)
      console.log('  - coachSlug:', coachSlug)

      // Use slug if available, otherwise use ID
      const identifier = coachSlug || coachId
      console.log('  - Using identifier:', identifier)

      const response = await fetch(`/api/coach-profile/${identifier}`)
      console.log('  - Response status:', response.status)

      const result = await response.json()
      console.log('  - Response data:', result)

      if (!result.success) {
        console.error('❌ Coach profile fetch failed:', result.error)
        setError(result.error || 'Coach not found')
        return
      }

      const coachProfile = result.data
      setCoach(coachProfile)

      // Fetch additional data only if not hiding lessons
      if (!hideLessons) {
        await fetchCoachStats(coachProfile.uid)
      }

    } catch (error) {
      console.error('❌ Error fetching coach profile:', error)
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
      className="fixed inset-0 z-50 flex items-center justify-center py-2 px-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-4xl max-h-[98vh] overflow-y-auto relative"
        onClick={(e) => e.stopPropagation()}
      >
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
          <HeroCoachProfile
            coach={coach}
            totalLessons={totalLessons}
            totalAthletes={totalAthletes}
            lessons={lessons}
            isInIframe={true}
            onBack={onClose}
            hideLessons={hideLessons}
          />
        )}
      </div>
    </div>
  )
}
