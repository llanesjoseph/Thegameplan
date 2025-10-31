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
import ContactCoachModal from '@/components/coach/ContactCoachModal'
import {
  ArrowLeft,
  Award,
  BookOpen,
  Star,
  Video,
  Mail,
  Calendar,
  MapPin,
  Clock,
  Users,
  Trophy,
  Target,
  CheckCircle,
  ExternalLink,
  Play,
  Heart,
  Share2,
  MessageCircle,
  UserPlus,
  Shield,
  Badge
} from 'lucide-react'
import AppHeader from '@/components/ui/AppHeader'
import Image from 'next/image'
import Link from 'next/link'

interface CoachProfile {
  uid: string
  displayName: string
  email: string
  bio: string
  sport: string
  yearsExperience: string
  specialties: string[]
  certifications: string[]
  achievements: string[]
  profileImageUrl: string
  coverImageUrl: string
  socialLinks: Record<string, string>
  verified: boolean
  featured: boolean
  isActive: boolean
  profileComplete: boolean
  status: string
  tagline: string
  slug: string
}

interface Lesson {
  id: string
  title: string
  description: string
  thumbnail: string
  duration: string
  level: string
  sport: string
  createdAt: string
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
  const [showContactModal, setShowContactModal] = useState(false)

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

  const handleContactCoach = () => {
    if (!user) {
      router.push('/login?redirect=/coach-profile/' + slug)
      return
    }
    // TODO: Implement contact functionality
    alert('Contact functionality coming soon!')
  }

  const handleFollowCoach = () => {
    if (!user) {
      router.push('/login?redirect=/coach-profile/' + slug)
      return
    }
    // TODO: Implement follow functionality
    alert('Follow functionality coming soon!')
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
              <UserPlus className="w-10 h-10 text-red-600" />
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
    <div style={{ backgroundColor: '#E8E6D8' }} className="min-h-screen">
      {!isInIframe && <AppHeader title="Coach Profile" subtitle="View coach information and credentials" />}

      <main className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Coaches
          </button>
        </div>

        {/* Coach Header */}
        <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 overflow-hidden mb-8">
          {/* Cover Image */}
          <div className="relative h-64 bg-gradient-to-r from-blue-600 to-purple-600">
            {coach.coverImageUrl ? (
              <Image
                src={coach.coverImageUrl}
                alt={`${coach.displayName} cover`}
                fill
                className="object-cover"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600" />
            )}
            <div className="absolute inset-0 bg-black/20" />
          </div>

          {/* Profile Section - Horizontal Layout */}
          <div className="relative px-6 pb-6 pt-6">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              {/* Profile Image - Overlapping the header */}
              <div className="-mt-28 flex-shrink-0">
                <div className="relative">
                  <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg overflow-hidden bg-gray-100">
                    {coach.profileImageUrl ? (
                      <Image
                        src={coach.profileImageUrl}
                        alt={coach.displayName}
                        width={128}
                        height={128}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-200">
                        <UserPlus className="w-12 h-12 text-gray-400" />
                      </div>
                    )}
                  </div>
                  {/* Verification Badge */}
                  {coach.verified && (
                    <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-white" />
                    </div>
                  )}
                </div>
              </div>

              {/* Coach Info - Centered/Left */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold" style={{ color: '#000000' }}>
                    {coach.displayName}
                  </h1>
                  {coach.verified && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm text-white bg-blue-600">
                      <Shield className="w-4 h-4 mr-1" />
                      Verified
                    </span>
                  )}
                  {coach.featured && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm text-white bg-gradient-to-r from-yellow-400 to-orange-500">
                      <Star className="w-4 h-4 mr-1" />
                      Featured
                    </span>
                  )}
                </div>

                <p className="text-xl text-blue-600 font-semibold mb-2">{coach.sport}</p>

                {coach.tagline && (
                  <p className="text-gray-600 text-lg">{coach.tagline}</p>
                )}
              </div>

              {/* Action Buttons - Right side */}
              <div className="flex flex-col gap-3 flex-shrink-0">
                <button
                  onClick={handleContactCoach}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
                >
                  <Mail className="w-4 h-4" />
                  Contact Coach
                </button>
                <button
                  onClick={handleFollowCoach}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap"
                >
                  <Heart className="w-4 h-4" />
                  Follow
                </button>
                <button className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap">
                  <Share2 className="w-4 h-4" />
                  Share
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left Column - Coach Details */}
          <div className="lg:col-span-2 space-y-4">
            {/* About Section */}
            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-4">
              <h2 className="text-xl font-bold mb-3" style={{ color: '#000000' }}>
                About {coach.displayName}
              </h2>
              {coach.bio ? (
                <p className="text-gray-600 leading-relaxed">{coach.bio}</p>
              ) : (
                <p className="text-gray-500 italic">No bio available</p>
              )}
            </div>

            {/* Specialties */}
            {coach.specialties && coach.specialties.length > 0 && (
              <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-4">
                <h3 className="text-lg font-semibold mb-3" style={{ color: '#000000' }}>
                  Specialties
                </h3>
                <div className="flex flex-wrap gap-2">
                  {coach.specialties.map((specialty, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                    >
                      {specialty}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Achievements */}
            {coach.achievements && coach.achievements.length > 0 && (
              <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-4">
                <h3 className="text-lg font-semibold mb-3" style={{ color: '#000000' }}>
                  Achievements
                </h3>
                <ul className="space-y-2">
                  {coach.achievements.map((achievement, index) => (
                    <li key={index} className="flex items-center gap-2 text-gray-600">
                      <Trophy className="w-4 h-4 text-yellow-500" />
                      {achievement}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Lessons */}
            {lessons.length > 0 && (
              <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-4">
                <h3 className="text-lg font-semibold mb-3" style={{ color: '#000000' }}>
                  Available Lessons
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {lessons.slice(0, 4).map((lesson) => (
                    <div key={lesson.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-3 mb-2">
                        <Video className="w-5 h-5 text-blue-600" />
                        <h4 className="font-medium" style={{ color: '#000000' }}>
                          {lesson.title}
                        </h4>
                      </div>
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                        {lesson.description}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {lesson.duration}
                        </span>
                        <span className="flex items-center gap-1">
                          <Target className="w-3 h-3" />
                          {lesson.level}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                {lessons.length > 4 && (
                  <p className="text-sm text-gray-500 mt-4">
                    And {lessons.length - 4} more lessons...
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Right Column - Stats & Info */}
          <div className="space-y-4">
            {/* Stats */}
            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-4">
              <h3 className="text-base font-semibold mb-3" style={{ color: '#000000' }}>
                Coach Stats
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Lessons</span>
                  <span className="font-semibold" style={{ color: '#000000' }}>
                    {totalLessons}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Athletes</span>
                  <span className="font-semibold" style={{ color: '#000000' }}>
                    {totalAthletes}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Experience</span>
                  <span className="font-semibold" style={{ color: '#000000' }}>
                    {coach.yearsExperience} years
                  </span>
                </div>
              </div>
            </div>

            {/* Certifications */}
            {coach.certifications && coach.certifications.length > 0 && (
              <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-4">
                <h3 className="text-base font-semibold mb-3" style={{ color: '#000000' }}>
                  Certifications
                </h3>
                <ul className="space-y-2">
                  {coach.certifications.map((cert, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm text-gray-600">
                      <Award className="w-4 h-4 text-green-500" />
                      {cert}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Contact Info */}
            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-4">
              <h3 className="text-base font-semibold mb-3" style={{ color: '#000000' }}>
                Contact Information
              </h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm">Available for online coaching</span>
                </div>
                <div className="mt-3">
                  <button
                    onClick={() => setShowContactModal(true)}
                    className="w-full bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Mail className="w-4 h-4 inline mr-2" />
                    Contact Coach
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Contact Modal */}
      {coach && (
        <ContactCoachModal
          isOpen={showContactModal}
          onClose={() => setShowContactModal(false)}
          coachId={coach.uid}
          coachName={coach.displayName}
          athleteId={user?.uid}
        />
      )}
    </div>
  )
}
