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
  Trophy
} from 'lucide-react'
import AppHeader from '@/components/ui/AppHeader'
import Link from 'next/link'
import { useAuth } from '@/hooks/use-auth'
import CoachProfilePlaceholder from '@/components/coach/CoachProfilePlaceholder'
import HeroCoachProfile from '@/components/coach/HeroCoachProfile'
import { createJasmineCoachProfile, isJasmineAikey } from '@/lib/jasmine-profile-client'

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

/**
 * Helper function to check if a coach profile is "minimal" (needs placeholder view)
 * A profile is considered minimal if it lacks substantive content beyond basic info
 */
function isProfileMinimal(
  coach: CoachProfile | null,
  totalLessons: number,
  totalAthletes: number
): boolean {
  if (!coach) return true

  // Profile is minimal if ALL of these are true:
  const hasNoBio = !coach.bio || coach.bio.trim().length < 50
  const hasNoSpecialties = !coach.specialties || coach.specialties.length === 0
  const hasNoCertifications = !coach.certifications || coach.certifications.length === 0
  const hasNoAchievements = !coach.achievements || coach.achievements.length === 0
  const hasNoLessons = totalLessons === 0

  // Show placeholder if they have no bio AND no lessons AND no professional credentials
  return hasNoBio && hasNoLessons && hasNoCertifications && hasNoAchievements
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

      // Check if this is Jasmine Aikey and use her comprehensive profile
      let coachProfile: CoachProfile
      
      if (isJasmineAikey(userData.email)) {
        // Use Jasmine's comprehensive profile data
        const jasmineProfile = createJasmineCoachProfile(coachId, userData.email)
        coachProfile = {
          uid: coachId,
          displayName: jasmineProfile.displayName,
          email: userData.email || '',
          bio: jasmineProfile.bio,
          sport: jasmineProfile.sport,
          yearsExperience: 4, // From her profile
          specialties: jasmineProfile.specialties,
          certifications: jasmineProfile.credentials ? [jasmineProfile.credentials] : [],
          achievements: jasmineProfile.achievements,
          profileImageUrl: jasmineProfile.headshotUrl,
          coverImageUrl: jasmineProfile.heroImageUrl,
          socialLinks: {}
        }
      } else {
        // Try to get extended profile from creator_profiles for other coaches
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

        // Combine data for other coaches
        coachProfile = {
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
    <div className="min-h-screen">
      {!isInIframe && <AppHeader />}
      
      {/* Use the new hero layout for all coaches */}
      <HeroCoachProfile
        coach={coach}
        totalLessons={totalLessons}
        totalAthletes={totalAthletes}
        lessons={lessons}
        isInIframe={isInIframe}
        onBack={() => router.back()}
      />
    </div>
  )
}
