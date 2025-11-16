'use client'

/**
 * Public Coach Profile Page - SECURE VERSION
 * Uses slugs instead of exposing creator IDs
 * Allows athletes and visitors to view coach information
 * READ-ONLY - No access to coach tools/dashboard
 */

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import HeroCoachProfile from '@/components/coach/HeroCoachProfile'
import AppHeader from '@/components/ui/AppHeader'

interface CoachProfile {
  uid: string
  displayName: string
  email: string
  bio?: string
  sport?: string
  yearsExperience?: number
  specialties?: string[]
  certifications?: string[] | string
  achievements?: string[] | string
  profileImageUrl?: string
  coverImageUrl?: string
  bannerUrl?: string
  tagline?: string
  title?: string
  location?: string
  websiteUrl?: string
  website?: string
  instagram?: string
  youtube?: string
  linkedin?: string
  facebook?: string
  socialLinks?: Record<string, string>
  verified?: boolean
  featured?: boolean
  isActive?: boolean
  profileComplete?: boolean
  status?: string
  slug?: string
}

interface Lesson {
  id: string
  title: string
  description?: string
  thumbnail?: string
  thumbnailUrl?: string
  videoUrl?: string
  duration?: string
  level?: string
  sport?: string
  createdAt: any
}

export default function CoachProfilePage() {
  const params = useParams()
  const router = useRouter()
  const slug = params?.slug as string
  const { user } = useAuth()

  const [coach, setCoach] = useState<CoachProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalLessons, setTotalLessons] = useState(0)
  const [totalAthletes, setTotalAthletes] = useState(0)
  const [isInIframe, setIsInIframe] = useState(false)
  const [lessons, setLessons] = useState<Lesson[]>([])

  // Detect if page is loaded in iframe
  useEffect(() => {
    setIsInIframe(window.self !== window.top)
  }, [])

  useEffect(() => {
    if (!slug) return
    fetchCoachProfile()
  }, [slug])

  const fetchCoachProfile = async () => {
    try {
      setLoading(true)

      // SECURITY: Use slug-based API to prevent ID exposure
      const response = await fetch(`/api/coach-profile/${slug}`)
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

  const fetchCoachStats = async (coachId: string) => {
    try {
      const response = await fetch(`/api/coach/${coachId}/stats`)
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

  const handleBack = () => {
    router.back()
  }

  if (loading) {
    return (
      <div style={{ backgroundColor: '#E8E6D8' }} className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-black mx-auto mb-4"></div>
          <p style={{ color: '#000000' }}>Loading coach profile...</p>
        </div>
      </div>
    )
  }

  if (error || !coach) {
    return (
      <div style={{ backgroundColor: '#E8E6D8' }} className="min-h-screen flex items-center justify-center">
        <div className="max-w-md mx-auto px-4">
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-red-200 p-8 text-center">
            <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center bg-red-100">
              <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-3" style={{ color: '#000000' }}>
              Coach Not Found
            </h2>
            <p className="mb-6" style={{ color: '#666' }}>
              {error || 'The coach you are looking for does not exist or has been removed.'}
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => router.push('/coaches')}
                className="px-6 py-3 rounded-lg text-white transition-colors"
                style={{ backgroundColor: '#91A6EB' }}
              >
                Browse Coaches
              </button>
              <button
                onClick={() => router.push('/')}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Go Home
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      {!isInIframe && <AppHeader title="Coach Profile" subtitle="View coach information and credentials" />}
      <HeroCoachProfile
        coach={coach}
        totalLessons={totalLessons}
        totalAthletes={totalAthletes}
        lessons={lessons}
        isInIframe={isInIframe}
        onBack={handleBack}
      />
    </>
  )
}
