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
  showcasePhoto1?: string
  showcasePhoto2?: string
  galleryPhotos?: string[]
  location?: string
  instagram?: string
  youtube?: string
  linkedin?: string
  facebook?: string
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
  status?: string
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

const extractGalleryPhotos = (...sources: any[]): string[] => {
  const flatten = (value: any): string[] => {
    if (!value) return []
    if (typeof value === 'string') return [value]
    if (Array.isArray(value)) return value.flatMap(flatten)
    if (typeof value === 'object') {
      const direct =
        value.url ||
        value.imageUrl ||
        value.src ||
        value.path ||
        value.photoURL ||
        value.downloadURL

      if (typeof direct === 'string') {
        return [direct]
      }
      return Object.values(value).flatMap(flatten)
    }
    return []
  }

  const urls = sources.flatMap(flatten).map((url) => (typeof url === 'string' ? url.trim() : '')).filter(Boolean)
  return Array.from(new Set(urls))
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

      // For ALL coaches (including Jasmine), check database first, then use fallback data
      let coachProfile: CoachProfile
      const isJasmine = isJasmineAikey(userData.email)
      
      // Try to get extended profile from creator_profiles, coach_profiles, AND creators_index
      // This ensures we get all photos that the coach has uploaded from all sources
      let profileData: any = {}
      let coachProfileData: any = {}
      let creatorsIndexData: any = {}
      
      try {
        // Check creator_profiles collection
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

      try {
        // Also check coach_profiles collection
        const coachProfileDoc = await getDoc(doc(db, 'coach_profiles', coachId))
        if (coachProfileDoc.exists()) {
          coachProfileData = coachProfileDoc.data()
        }
      } catch (err) {
        console.warn('Could not fetch coach profile:', err)
      }

      try {
        // Also check creators_index (synced collection - most up-to-date)
        const creatorsIndexDoc = await getDoc(doc(db, 'creators_index', coachId))
        if (creatorsIndexDoc.exists()) {
          creatorsIndexData = creatorsIndexDoc.data()
        }
      } catch (err) {
        console.warn('Could not fetch creators_index:', err)
      }

      // Merge gallery photos from all collections (remove duplicates)
      // Include galleryPhotos, actionPhotos, and mediaGallery from all sources
      const creatorGalleryPhotos = Array.isArray(profileData.galleryPhotos) 
        ? profileData.galleryPhotos.filter((url: any) => typeof url === 'string' && url.trim().length > 0)
        : []
      const coachGalleryPhotos = Array.isArray(coachProfileData.galleryPhotos) 
        ? coachProfileData.galleryPhotos.filter((url: any) => typeof url === 'string' && url.trim().length > 0)
        : []
      const indexGalleryPhotos = Array.isArray(creatorsIndexData.galleryPhotos) 
        ? creatorsIndexData.galleryPhotos.filter((url: any) => typeof url === 'string' && url.trim().length > 0)
        : []
      
      // Also include actionPhotos (legacy field name that might have photos)
      const creatorActionPhotos = Array.isArray(profileData.actionPhotos) 
        ? profileData.actionPhotos.filter((url: any) => typeof url === 'string' && url.trim().length > 0)
        : []
      const coachActionPhotos = Array.isArray(coachProfileData.actionPhotos) 
        ? coachProfileData.actionPhotos.filter((url: any) => typeof url === 'string' && url.trim().length > 0)
        : []
      const indexActionPhotos = Array.isArray(creatorsIndexData.actionPhotos) 
        ? creatorsIndexData.actionPhotos.filter((url: any) => typeof url === 'string' && url.trim().length > 0)
        : []
      
      // Combine all photo sources and deduplicate
      const allGalleryPhotos = [...new Set([
        ...creatorGalleryPhotos, 
        ...coachGalleryPhotos, 
        ...indexGalleryPhotos,
        ...creatorActionPhotos,
        ...coachActionPhotos,
        ...indexActionPhotos
      ])]
      let galleryPhotos = allGalleryPhotos.filter((url: string) => 
        url && typeof url === 'string' && url.trim().length > 0 && !url.includes('placeholder')
      )

      // Get showcase photos from all collections (prefer creators_index, then creator_profiles)
      let showcasePhoto1 = creatorsIndexData.showcasePhoto1 || profileData.showcasePhoto1 || coachProfileData.showcasePhoto1 || userData.showcasePhoto1 || ''
      let showcasePhoto2 = creatorsIndexData.showcasePhoto2 || profileData.showcasePhoto2 || coachProfileData.showcasePhoto2 || userData.showcasePhoto2 || ''
      
      // If no showcase photos but we have gallery photos, use first two from gallery
      if (!showcasePhoto1 && galleryPhotos.length > 0) {
        showcasePhoto1 = galleryPhotos[0]
      }
      if (!showcasePhoto2 && galleryPhotos.length > 1) {
        showcasePhoto2 = galleryPhotos[1]
      }
      
      // For Jasmine: If database has no photos, use hardcoded fallback
      if (isJasmine && galleryPhotos.length === 0) {
        const jasmineProfile = createJasmineCoachProfile(coachId, userData.email)
        const jasmineGallery = extractGalleryPhotos(jasmineProfile.actionPhotos)
        galleryPhotos = [...galleryPhotos, ...jasmineGallery]
        if (!showcasePhoto1) showcasePhoto1 = jasmineProfile.actionPhotos?.[0] || jasmineProfile.heroImageUrl
        if (!showcasePhoto2) showcasePhoto2 = jasmineProfile.actionPhotos?.[1] || jasmineProfile.headshotUrl
      }
      
      // Debug logging to help identify photo loading issues
      console.log('[COACH-PROFILE] Photo loading summary:', {
        coachId,
        isJasmine,
        sources: {
          creator_profiles: {
            galleryPhotos: creatorGalleryPhotos.length,
            actionPhotos: creatorActionPhotos.length,
            hasData: Object.keys(profileData).length > 0
          },
          coach_profiles: {
            galleryPhotos: coachGalleryPhotos.length,
            actionPhotos: coachActionPhotos.length,
            hasData: Object.keys(coachProfileData).length > 0
          },
          creators_index: {
            galleryPhotos: indexGalleryPhotos.length,
            actionPhotos: indexActionPhotos.length,
            hasData: Object.keys(creatorsIndexData).length > 0
          }
        },
        merged: {
          totalPhotos: galleryPhotos.length,
          showcasePhoto1: showcasePhoto1 ? 'SET' : 'MISSING',
          showcasePhoto2: showcasePhoto2 ? 'SET' : 'MISSING',
          photoUrls: galleryPhotos.slice(0, 10) // Show first 10 for debugging
        }
      })

      // Combine data for all coaches - merge from all collections (prefer creators_index, then creator_profiles)
      // For Jasmine, merge database data with hardcoded fallback
      if (isJasmine) {
        const jasmineProfile = createJasmineCoachProfile(coachId, userData.email)
        coachProfile = {
          uid: coachId,
          displayName: creatorsIndexData.displayName || profileData.displayName || coachProfileData.displayName || jasmineProfile.displayName || userData.displayName || userData.email || 'Coach',
          email: userData.email || '',
          bio: creatorsIndexData.bio || profileData.bio || coachProfileData.bio || jasmineProfile.bio || userData.bio || '',
          sport: creatorsIndexData.sport || profileData.sport || coachProfileData.sport || jasmineProfile.sport || userData.sport || 'General Athletics',
          yearsExperience: creatorsIndexData.yearsExperience || profileData.yearsExperience || coachProfileData.yearsExperience || 4,
          specialties: creatorsIndexData.specialties || profileData.specialties || coachProfileData.specialties || jasmineProfile.specialties || userData.specialties || [],
          certifications: creatorsIndexData.certifications || profileData.certifications || coachProfileData.certifications || (jasmineProfile.credentials ? [jasmineProfile.credentials] : []) || userData.certifications || [],
          achievements: creatorsIndexData.achievements || profileData.achievements || coachProfileData.achievements || jasmineProfile.achievements || userData.achievements || [],
          profileImageUrl: creatorsIndexData.profileImageUrl || profileData.profileImageUrl || coachProfileData.profileImageUrl || jasmineProfile.headshotUrl || userData.photoURL || '',
          coverImageUrl: creatorsIndexData.coverImageUrl || profileData.coverImageUrl || coachProfileData.coverImageUrl || jasmineProfile.heroImageUrl || '',
          showcasePhoto1,
          showcasePhoto2,
          galleryPhotos,
          location: creatorsIndexData.location || profileData.location || coachProfileData.location || userData.location || 'Silicon Valley, California',
          instagram: creatorsIndexData.instagram || profileData.instagram || coachProfileData.instagram || userData.instagram || '',
          youtube: creatorsIndexData.youtube || profileData.youtube || coachProfileData.youtube || userData.youtube || '',
          linkedin: creatorsIndexData.linkedin || profileData.linkedin || coachProfileData.linkedin || userData.linkedin || '',
          facebook: creatorsIndexData.facebook || profileData.facebook || coachProfileData.facebook || userData.facebook || '',
          socialLinks: creatorsIndexData.socialLinks || profileData.socialLinks || coachProfileData.socialLinks || userData.socialLinks || {}
        }
      } else {
        // For non-Jasmine coaches, use database data only (already fetched above)
        coachProfile = {
          uid: coachId,
          displayName: creatorsIndexData.displayName || profileData.displayName || coachProfileData.displayName || userData.displayName || userData.email || 'Coach',
          email: userData.email || '',
          bio: creatorsIndexData.bio || profileData.bio || coachProfileData.bio || userData.bio || '',
          sport: creatorsIndexData.sport || profileData.sport || coachProfileData.sport || userData.sport || 'General Athletics',
          yearsExperience: creatorsIndexData.yearsExperience || profileData.yearsExperience || coachProfileData.yearsExperience || userData.yearsExperience || 0,
          specialties: creatorsIndexData.specialties || profileData.specialties || coachProfileData.specialties || userData.specialties || [],
          certifications: creatorsIndexData.certifications || profileData.certifications || coachProfileData.certifications || userData.certifications || [],
          achievements: creatorsIndexData.achievements || profileData.achievements || coachProfileData.achievements || userData.achievements || [],
          profileImageUrl: creatorsIndexData.profileImageUrl || profileData.profileImageUrl || coachProfileData.profileImageUrl || userData.photoURL || '',
          coverImageUrl: creatorsIndexData.coverImageUrl || profileData.coverImageUrl || coachProfileData.coverImageUrl || '',
          showcasePhoto1,
          showcasePhoto2,
          galleryPhotos,
          location: creatorsIndexData.location || profileData.location || coachProfileData.location || userData.location || '',
          instagram: creatorsIndexData.instagram || profileData.instagram || coachProfileData.instagram || userData.instagram || '',
          youtube: creatorsIndexData.youtube || profileData.youtube || coachProfileData.youtube || userData.youtube || '',
          linkedin: creatorsIndexData.linkedin || profileData.linkedin || coachProfileData.linkedin || userData.linkedin || '',
          facebook: creatorsIndexData.facebook || profileData.facebook || coachProfileData.facebook || userData.facebook || '',
          socialLinks: creatorsIndexData.socialLinks || profileData.socialLinks || coachProfileData.socialLinks || userData.socialLinks || {}
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
      // Use API endpoint to fetch coach stats (bypasses Firestore rules)
      const response = await fetch(`/api/coach/${coachId}/stats`)
      
      if (response.ok) {
        const data = await response.json()
        setTotalLessons(data.totalLessons)
        setTotalAthletes(data.totalAthletes)
        setLessons(data.lessons)
      } else {
        console.warn('Failed to fetch coach stats from API')
        // Fallback to direct Firestore access (might fail due to rules)
        const totalLessonsQuery = query(
          collection(db, 'content'),
          where('creatorUid', '==', coachId),
          where('status', '==', 'published')
        )
        const totalLessonsSnap = await getDocs(totalLessonsQuery)
        setTotalLessons(totalLessonsSnap.size)

        const athletesQuery = query(
          collection(db, 'users'),
          where('assignedCoachId', '==', coachId)
        )
        const athletesSnap = await getDocs(athletesQuery)
        setTotalAthletes(athletesSnap.size)
      }

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
