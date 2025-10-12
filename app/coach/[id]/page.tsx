'use client'

/**
 * Public Coach Profile Page
 * Allows athletes and visitors to view coach information
 * READ-ONLY - No access to coach tools/dashboard
 */

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { doc, getDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore'
import { db } from '@/lib/firebase.client'
import {
  ArrowLeft,
  Award,
  BookOpen,
  Star,
  Video,
  Mail,
  Calendar,
  Users,
  Trophy,
  Sparkles,
  MessageCircle
} from 'lucide-react'
import AppHeader from '@/components/ui/AppHeader'
import AIAssistant from '@/components/AIAssistant'
import Link from 'next/link'
import { useAuth } from '@/hooks/use-auth'

interface CoachProfile {
  uid: string
  displayName: string
  email: string
  bio?: string
  sport?: string
  yearsExperience?: number
  specialties?: string[]
  certifications?: string[]
  achievements?: string[]
  profileImageUrl?: string
  coverImageUrl?: string
  socialLinks?: {
    twitter?: string
    instagram?: string
    linkedin?: string
  }
}

interface Lesson {
  id: string
  title: string
  description?: string
  sport?: string
  level?: string
  createdAt: any
  videoUrl?: string
  thumbnailUrl?: string
}

export default function CoachProfilePage() {
  const params = useParams()
  const router = useRouter()
  const coachId = params?.id as string
  const { user } = useAuth()

  const [coach, setCoach] = useState<CoachProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalLessons, setTotalLessons] = useState(0)
  const [totalAthletes, setTotalAthletes] = useState(0)
  const [isInIframe, setIsInIframe] = useState(false)
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [showAIChat, setShowAIChat] = useState(false)

  // Detect if page is loaded in iframe
  useEffect(() => {
    setIsInIframe(window.self !== window.top)
  }, [])

  useEffect(() => {
    if (!coachId) return
    fetchCoachProfile()
  }, [coachId])

  const fetchCoachProfile = async () => {
    try {
      setLoading(true)

      // Get coach user data
      const userRef = doc(db, 'users', coachId)
      const userSnap = await getDoc(userRef)

      if (!userSnap.exists()) {
        setError('Coach not found')
        return
      }

      const userData = userSnap.data()

      // Check if user is actually a coach (includes legacy 'creator' role)
      const validCoachRoles = ['coach', 'creator', 'assistant_coach']
      if (!validCoachRoles.includes(userData.role)) {
        setError('This user is not a coach')
        return
      }

      // Try to get extended profile from creator_profiles
      let profileData: any = {}
      try {
        const profileQuery = query(
          collection(db, 'creator_profiles'),
          where('uid', '==', coachId)
        )
        const profileSnap = await getDocs(profileQuery)

        if (!profileSnap.empty) {
          profileData = profileSnap.docs[0].data()
        }
      } catch (err) {
        console.warn('Could not fetch creator profile:', err)
      }

      // Combine data
      const coachProfile: CoachProfile = {
        uid: coachId,
        displayName: userData.displayName || profileData.displayName || userData.email || 'Coach',
        email: userData.email || '',
        bio: profileData.bio || userData.bio || '',
        sport: profileData.sport || userData.sport || 'General Athletics',
        yearsExperience: profileData.yearsExperience || userData.yearsExperience || 0,
        specialties: profileData.specialties || userData.specialties || [],
        certifications: profileData.certifications || userData.certifications || [],
        achievements: profileData.achievements || userData.achievements || [],
        profileImageUrl: profileData.profileImageUrl || userData.photoURL || '',
        coverImageUrl: profileData.coverImageUrl || '',
        socialLinks: profileData.socialLinks || {}
      }

      setCoach(coachProfile)

      // Get statistics
      await fetchCoachStats()

    } catch (err) {
      console.error('Error fetching coach profile:', err)
      setError('Failed to load coach profile')
    } finally {
      setLoading(false)
    }
  }

  const fetchCoachStats = async () => {
    try {
      // First, get the TOTAL count of all published lessons (without limit)
      const totalLessonsQuery = query(
        collection(db, 'content'),
        where('creatorUid', '==', coachId),
        where('status', '==', 'published')
      )
      const totalLessonsSnap = await getDocs(totalLessonsQuery)
      setTotalLessons(totalLessonsSnap.size)

      // Then, fetch the most recent 6 lessons for display
      const recentLessonsQuery = query(
        collection(db, 'content'),
        where('creatorUid', '==', coachId),
        where('status', '==', 'published'),
        orderBy('createdAt', 'desc'),
        limit(6)  // Show up to 6 lessons
      )
      const recentLessonsSnap = await getDocs(recentLessonsQuery)

      const lessonsData: Lesson[] = recentLessonsSnap.docs.map(doc => ({
        id: doc.id,
        title: doc.data().title || 'Untitled Lesson',
        description: doc.data().description,
        sport: doc.data().sport,
        level: doc.data().level,
        createdAt: doc.data().createdAt,
        videoUrl: doc.data().videoUrl,
        thumbnailUrl: doc.data().thumbnailUrl
      }))

      setLessons(lessonsData)

      // Count athletes assigned to this coach
      const athletesQuery = query(
        collection(db, 'users'),
        where('assignedCoachId', '==', coachId)
      )
      const athletesSnap = await getDocs(athletesQuery)
      setTotalAthletes(athletesSnap.size)

    } catch (err) {
      console.warn('Could not fetch coach stats:', err)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#E8E6D8' }}>
        {!isInIframe && <AppHeader />}
        <div className="max-w-5xl mx-auto px-6 py-12">
          <div className="text-center py-20">
            <div className="w-16 h-16 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4" style={{ borderColor: '#20B2AA' }}></div>
            <p style={{ color: '#000000', opacity: 0.7 }}>Loading coach profile...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !coach) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#E8E6D8' }}>
        {!isInIframe && <AppHeader />}
        <div className="max-w-5xl mx-auto px-6 py-12">
          {!isInIframe && (
            <button
              onClick={() => router.back()}
              className="mb-6 inline-flex items-center gap-2 hover:opacity-70 transition-opacity"
              style={{ color: '#000000' }}
            >
              <ArrowLeft className="w-5 h-5" />
              Back
            </button>
          )}

          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-12 text-center">
            <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: '#FF6B35' }}>
              <div className="text-2xl text-white">!</div>
            </div>
            <h1 className="text-2xl font-heading mb-2" style={{ color: '#000000' }}>
              {error || 'Coach Not Found'}
            </h1>
            <p style={{ color: '#000000', opacity: 0.7 }}>
              We couldn't find this coach's profile. They may have been removed or the link is incorrect.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#E8E6D8' }}>
      {!isInIframe && <AppHeader />}

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Back Button - Only show when not in iframe */}
        {!isInIframe && (
          <button
            onClick={() => router.back()}
            className="mb-6 inline-flex items-center gap-2 hover:opacity-70 transition-opacity"
            style={{ color: '#000000' }}
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
        )}

        {/* Cover Image */}
        {coach.coverImageUrl && (
          <div className="relative h-48 sm:h-64 rounded-2xl overflow-hidden mb-6 shadow-lg">
            <img
              src={coach.coverImageUrl}
              alt={`${coach.displayName} cover`}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
          </div>
        )}

        {/* Profile Header */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-8 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            {/* Profile Image */}
            <div className="w-24 h-24 rounded-full overflow-hidden shadow-lg flex-shrink-0" style={{ backgroundColor: '#20B2AA' }}>
              {coach.profileImageUrl ? (
                <img
                  src={coach.profileImageUrl}
                  alt={coach.displayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white text-3xl font-heading">
                  {coach.displayName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            {/* Coach Info */}
            <div className="flex-1">
              <h1 className="text-3xl font-heading mb-2" style={{ color: '#000000' }}>
                {coach.displayName}
              </h1>
              <p className="text-lg mb-3" style={{ color: '#20B2AA' }}>
                {coach.sport}
              </p>
              {coach.yearsExperience && coach.yearsExperience > 0 && (
                <div className="flex items-center gap-2 text-sm" style={{ color: '#000000', opacity: 0.7 }}>
                  <Trophy className="w-4 h-4" />
                  {coach.yearsExperience} years of coaching experience
                </div>
              )}
            </div>

            {/* Contact Button */}
            <Link
              href={`mailto:${coach.email}`}
              className="px-6 py-3 rounded-xl text-white font-semibold hover:opacity-90 transition-opacity shadow-lg"
              style={{ backgroundColor: '#20B2AA' }}
            >
              <Mail className="w-4 h-4 inline mr-2" />
              Contact Coach
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6 text-center">
            <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center" style={{ backgroundColor: '#91A6EB' }}>
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div className="text-3xl font-heading mb-1" style={{ color: '#000000' }}>
              {totalLessons}
            </div>
            <p className="text-sm" style={{ color: '#000000', opacity: 0.7 }}>Lessons Created</p>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6 text-center">
            <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center" style={{ backgroundColor: '#20B2AA' }}>
              <Users className="w-6 h-6 text-white" />
            </div>
            <div className="text-3xl font-heading mb-1" style={{ color: '#000000' }}>
              {totalAthletes}
            </div>
            <p className="text-sm" style={{ color: '#000000', opacity: 0.7 }}>Athletes Coached</p>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6 text-center">
            <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center" style={{ backgroundColor: '#FF6B35' }}>
              <Star className="w-6 h-6 text-white" />
            </div>
            <div className="text-3xl font-heading mb-1" style={{ color: '#000000' }}>
              5.0
            </div>
            <p className="text-sm" style={{ color: '#000000', opacity: 0.7 }}>Rating</p>
          </div>
        </div>

        {/* About Section */}
        {coach.bio && (
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-8 mb-6">
            <h2 className="text-2xl font-heading mb-4" style={{ color: '#000000' }}>
              About
            </h2>
            <p className="text-base leading-relaxed" style={{ color: '#000000', opacity: 0.8 }}>
              {coach.bio}
            </p>
          </div>
        )}

        {/* Specialties */}
        {coach.specialties && coach.specialties.length > 0 && (
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-8 mb-6">
            <h2 className="text-2xl font-heading mb-4" style={{ color: '#000000' }}>
              Specialties
            </h2>
            <div className="flex flex-wrap gap-2">
              {coach.specialties.map((specialty, index) => (
                <span
                  key={index}
                  className="px-4 py-2 rounded-full text-white text-sm font-medium"
                  style={{ backgroundColor: '#91A6EB' }}
                >
                  {specialty}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Certifications & Achievements */}
        <div className="grid sm:grid-cols-2 gap-6">
          {/* Certifications */}
          {coach.certifications && coach.certifications.length > 0 && (
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-8">
              <div className="flex items-center gap-2 mb-4">
                <Award className="w-6 h-6" style={{ color: '#20B2AA' }} />
                <h2 className="text-xl font-heading" style={{ color: '#000000' }}>
                  Certifications
                </h2>
              </div>
              <ul className="space-y-2">
                {coach.certifications.map((cert, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-xl" style={{ color: '#20B2AA' }}>•</span>
                    <span style={{ color: '#000000', opacity: 0.8 }}>{cert}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Achievements */}
          {coach.achievements && coach.achievements.length > 0 && (
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-8">
              <div className="flex items-center gap-2 mb-4">
                <Trophy className="w-6 h-6" style={{ color: '#FF6B35' }} />
                <h2 className="text-xl font-heading" style={{ color: '#000000' }}>
                  Achievements
                </h2>
              </div>
              <ul className="space-y-2">
                {coach.achievements.map((achievement, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-xl" style={{ color: '#FF6B35' }}>•</span>
                    <span style={{ color: '#000000', opacity: 0.8 }}>{achievement}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Lessons Section */}
        {lessons.length > 0 && (
          <div className="mt-8 bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-heading" style={{ color: '#000000' }}>
                Recent Lessons
              </h2>
              <Link
                href={`/lessons?coach=${coachId}`}
                className="text-sm hover:opacity-70 transition-opacity"
                style={{ color: '#91A6EB' }}
              >
                View All →
              </Link>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {lessons.map((lesson) => (
                <Link
                  key={lesson.id}
                  href={`/lesson/${lesson.id}`}
                  className="group block bg-white rounded-xl shadow-md hover:shadow-xl transition-all overflow-hidden border border-gray-100"
                >
                  {/* Thumbnail */}
                  {lesson.thumbnailUrl ? (
                    <div className="h-40 overflow-hidden">
                      <img
                        src={lesson.thumbnailUrl}
                        alt={lesson.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                  ) : (
                    <div className="h-40 flex items-center justify-center" style={{ backgroundColor: '#91A6EB' }}>
                      <BookOpen className="w-12 h-12 text-white opacity-50" />
                    </div>
                  )}

                  {/* Content */}
                  <div className="p-4">
                    <h3 className="font-semibold mb-2 line-clamp-2" style={{ color: '#000000' }}>
                      {lesson.title}
                    </h3>
                    {lesson.description && (
                      <p className="text-sm mb-3 line-clamp-2" style={{ color: '#000000', opacity: 0.6 }}>
                        {lesson.description}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {lesson.sport && (
                        <span className="text-xs px-2 py-1 rounded-full text-white" style={{ backgroundColor: '#91A6EB' }}>
                          {lesson.sport}
                        </span>
                      )}
                      {lesson.level && (
                        <span className="text-xs px-2 py-1 rounded-full text-white" style={{ backgroundColor: '#20B2AA' }}>
                          {lesson.level}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* AI Coach Chat Section */}
        <div className="mt-8 bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 overflow-hidden">
          {/* Chat Header/Toggle */}
          <button
            onClick={() => setShowAIChat(!showAIChat)}
            className="w-full px-8 py-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: '#9333EA' }}>
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div className="text-left">
                <h2 className="text-xl font-heading" style={{ color: '#000000' }}>
                  Chat with {coach.displayName}'s AI Assistant
                </h2>
                <p className="text-sm" style={{ color: '#000000', opacity: 0.6 }}>
                  Get instant answers about their training philosophy and methods
                </p>
              </div>
            </div>
            <MessageCircle className={`w-6 h-6 transition-transform ${showAIChat ? 'rotate-180' : ''}`} style={{ color: '#9333EA' }} />
          </button>

          {/* AI Chat */}
          {showAIChat && user && (
            <div className="border-t border-gray-200 p-6" style={{ height: '600px' }}>
              <AIAssistant
                mode="inline"
                userId={user.uid}
                userEmail={user.email || ''}
                title={`${coach.displayName}'s AI Assistant`}
                context={`You are ${coach.displayName}'s AI coaching assistant specializing in ${coach.sport}. ${coach.bio ? `Coach background: ${coach.bio}. ` : ''}

CRITICAL INSTRUCTIONS:
- Answer the SPECIFIC question asked - don't give general philosophy
- Provide TECHNICAL, STEP-BY-STEP instructions for techniques
- For ${coach.sport} questions, give detailed breakdowns with key points
- Use numbered steps, specific body positions, and timing cues
- Be direct and actionable - what should they DO right now
- Only discuss general philosophy if specifically asked about mindset/approach

Example: If asked about single leg takedowns, explain:
1. Setup and penetration step
2. Hand placement and grip
3. Head position
4. Finish variations (running the pipe, dump, etc.)
5. Common mistakes to avoid

Keep responses focused, technical, and immediately useful for training.`}
                placeholder={`Ask about ${coach.sport} techniques...`}
                requireLegalConsent={true}
                sport={coach.sport}
                creatorId={coachId}
                creatorName={coach.displayName}
              />
            </div>
          )}

          {!showAIChat && (
            <div className="px-8 pb-6 text-center" style={{ color: '#000000', opacity: 0.6 }}>
              Click above to start chatting
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
