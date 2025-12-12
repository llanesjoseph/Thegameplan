'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
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

      const identifier = coachSlug || coachId
      const response = await fetch(`/api/coach-profile/${identifier}`)
      const result = await response.json()

      if (!result.success) {
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
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-7xl max-h-[95vh] overflow-hidden flex flex-col shadow-2xl"
        style={{ borderRadius: '0' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button - Fixed in top right */}
        <button
          onClick={onClose}
          className="fixed top-4 right-4 z-50 p-3 rounded-full bg-white shadow-lg hover:bg-gray-100 transition-colors"
          aria-label="Close modal"
          style={{ zIndex: 9999 }}
        >
          <X className="w-6 h-6" style={{ color: '#000000' }} />
        </button>

        {/* Content - Full HeroCoachProfile */}
        <div className="overflow-y-auto flex-1" style={{ maxHeight: '95vh' }}>
          {loading ? (
            <div className="flex items-center justify-center py-20 min-h-[400px]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-black mx-auto mb-4"></div>
                <p style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif' }}>Loading coach profile...</p>
              </div>
            </div>
          ) : error || !coach ? (
            <div className="flex items-center justify-center py-20 min-h-[400px]">
              <div className="text-center">
                <p className="text-red-600 mb-4" style={{ fontFamily: '"Open Sans", sans-serif' }}>
                  {error || 'Coach not found'}
                </p>
                <button
                  onClick={onClose}
                  className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                  style={{ fontFamily: '"Open Sans", sans-serif' }}
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            <div style={{ minHeight: '100%' }}>
              <HeroCoachProfile
                coach={coach}
                totalLessons={totalLessons}
                totalAthletes={totalAthletes}
                lessons={lessons}
                isInIframe={true}
                onBack={onClose}
                hideLessons={hideLessons}
                forceReadOnly={true}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
