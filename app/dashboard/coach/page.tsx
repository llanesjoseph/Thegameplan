'use client'

import { useEffect, useState } from 'react'
import HeroCoachProfile from '@/components/coach/HeroCoachProfile'
import { useAuth } from '@/hooks/use-auth'
import { db } from '@/lib/firebase.client'
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore'

type Lesson = {
  id: string
  title: string
  status?: string
  sport?: string
  thumbnailUrl?: string
  createdAt?: any
  publishedAt?: any
  contentType?: 'standard' | 'link'
  externalLinkUrl?: string
}

type GearItem = {
  id: string
  name: string
  price?: string
  imageUrl?: string
  link?: string
}

const extractGalleryPhotos = (...sources: any[]): string[] => {
  const flatten = (value: any): string[] => {
    if (!value) return []
    if (typeof value === 'string') return [value]
    if (Array.isArray(value)) return value.flatMap(flatten)
    if (typeof value === 'object') {
      const direct = value.url || value.imageUrl || value.src || value.path || value.photoURL || value.downloadURL
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

export default function CoachDashboard() {
  const { user } = useAuth()
  const [coachProfile, setCoachProfile] = useState<Parameters<typeof HeroCoachProfile>[0]['coach'] | null>(null)
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [totalLessons, setTotalLessons] = useState(0)
  const [totalAthletes, setTotalAthletes] = useState(0)
  const [gearItems, setGearItems] = useState<GearItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user?.uid) return

    let isMounted = true
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const userSnap = await getDoc(doc(db, 'users', user.uid))
        const userData = userSnap.exists() ? (userSnap.data() as any) : {}

        let creatorData: any = {}
        try {
          const creatorSnap = await getDocs(query(collection(db, 'creator_profiles'), where('uid', '==', user.uid)))
          if (!creatorSnap.empty) {
            creatorData = creatorSnap.docs[0].data()
          }
        } catch (creatorErr) {
          console.warn('Unable to load creator profile:', creatorErr)
        }

        // STRICT: Only use galleryPhotos from creator_profiles - these are photos uploaded by the coach
        // Do NOT merge from other sources (actionPhotos, mediaGallery, etc.) to prevent hard-coded images
        // Do NOT use stock/default images - only show photos the coach explicitly uploaded
        let dashboardGalleryPhotos: string[] = []
        if (Array.isArray(creatorData.galleryPhotos) && creatorData.galleryPhotos.length > 0) {
          // Only use galleryPhotos - filter out any empty or invalid URLs
          dashboardGalleryPhotos = creatorData.galleryPhotos
            .filter((url: any) => typeof url === 'string' && url.trim().length > 0)
            .slice(0, 10)
        }
        // If no galleryPhotos exist, leave it empty - do NOT add stock images

        const profileImageUrl =
          creatorData.headshotUrl ||
          userData.profileImageUrl ||
          userData.photoURL ||
          user.photoURL ||
          ''

        const sport =
          creatorData.sport ||
          userData.sport ||
          userData.primarySport ||
          'Coach'

        // CRITICAL: Read ALL fields from Firestore FIRST (where we save them)
        // Priority: creator_profiles > users collection > Firebase Auth > fallback
        // This ensures we read the LATEST saved data, not stale cached data
        const displayName = creatorData.displayName || userData.displayName || user.displayName || 'Coach'
        const bio = creatorData.bio || userData.bio || ''
        const location = creatorData.location || userData.location || ''
        const twitter = creatorData.twitter || userData.twitter || creatorData.socialLinks?.twitter || userData.socialLinks?.twitter || ''
        const instagram = creatorData.instagram || userData.instagram || creatorData.socialLinks?.instagram || userData.socialLinks?.instagram || ''
        const facebook = creatorData.facebook || userData.facebook || creatorData.socialLinks?.facebook || userData.socialLinks?.facebook || ''
        const linkedin = creatorData.linkedin || userData.linkedin || creatorData.socialLinks?.linkedin || userData.socialLinks?.linkedin || ''
        const youtube = creatorData.youtube || userData.youtube || creatorData.socialLinks?.youtube || userData.socialLinks?.youtube || ''
        
        const coach = {
          uid: user.uid,
          email: user.email || userData.email || '',
          displayName, // Use the prioritized displayName
          bio, // Use the prioritized bio
          sport,
          location, // Use the prioritized location
          profileImageUrl,
          // Primary hero photos – only use explicitly set showcase photos or gallery photos
          // Do NOT fall back to stock images
          showcasePhoto1: creatorData.showcasePhoto1 || userData.showcasePhoto1 || dashboardGalleryPhotos[0] || '',
          showcasePhoto2: creatorData.showcasePhoto2 || userData.showcasePhoto2 || dashboardGalleryPhotos[1] || '',
          instagram, // Use the prioritized instagram
          youtube, // Use the prioritized youtube
          linkedin, // Use the prioritized linkedin
          facebook, // Use the prioritized facebook
          twitter, // Use the prioritized twitter
          socialLinks: {
            instagram,
            linkedin,
            twitter,
            facebook,
            youtube
          },
          // Dashboard gallery: one image on first build, up to 10 once the
          // coach has saved a custom gallery.
          galleryPhotos: dashboardGalleryPhotos
        }
        
        console.log('[COACH-DASHBOARD] Loaded profile data:', {
          displayName: coach.displayName,
          bio: coach.bio?.substring(0, 50) + '...',
          twitter: coach.twitter,
          instagram: coach.instagram,
          source: creatorData.displayName ? 'creator_profiles' : userData.displayName ? 'users' : 'fallback'
        })

        if (isMounted) {
          setCoachProfile(coach)
        }

        const [statsRes, gearRes] = await Promise.all([
          fetch(`/api/coach/${user.uid}/stats`),
          fetch(`/api/gear/coach?uid=${user.uid}`)
        ])

        if (statsRes.ok) {
          const stats = await statsRes.json()
          if (isMounted) {
            setLessons(stats.lessons || [])
            setTotalLessons(stats.totalLessons || 0)
            setTotalAthletes(stats.totalAthletes || 0)
          }
        }

        if (gearRes.ok) {
          const gear = await gearRes.json()
          if (isMounted) {
            setGearItems(gear.gearItems || [])
          }
        }
      } catch (err) {
        console.error('Failed to load coach dashboard:', err)
        if (isMounted) {
          setError('Unable to load your profile right now.')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    load()
    return () => {
      isMounted = false
    }
  }, [user])

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f5f5]">
        <p className="text-gray-600">Please sign in to view your coach dashboard.</p>
      </div>
    )
  }

  if (loading || !coachProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f5f5]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-t-transparent border-black rounded-full animate-spin mx-auto" />
          <p className="text-sm text-gray-600">Loading your dashboard…</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f5f5]">
        <p className="text-red-600 text-sm">{error}</p>
      </div>
    )
  }

  return (
    <HeroCoachProfile
      coach={coachProfile}
      lessons={lessons}
      totalLessons={totalLessons}
      totalAthletes={totalAthletes}
      initialGearItems={gearItems}
    />
  )
}
