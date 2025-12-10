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

        const allGalleryPhotos = extractGalleryPhotos(
          creatorData.galleryPhotos,
          creatorData.actionPhotos,
          creatorData.mediaGallery,
          creatorData.heroGallery,
          creatorData.gallery,
          userData.galleryPhotos
        )

        // Stock dashboard image to use when the coach has not created
        // a custom gallery yet (ignore ingestion photos in that case).
        const STOCK_DASHBOARD_IMAGE =
          'https://static.wixstatic.com/media/8bb438_3ae04589aef4480e89a24d7283c69798~mv2_d_2869_3586_s_4_2.jpg/v1/fill/w_428,h_570,q_90,enc_avif,quality_auto/8bb438_3ae04589aef4480e89a24d7283c69798~mv2_d_2869_3586_s_4_2.jpg'

        // For a brand new page (no explicit gallery set yet), we only show
        // a single STOCK photo. Once the coach has saved a custom gallery
        // (creator_profiles.galleryPhotos), we allow up to 10 images.
        let dashboardGalleryPhotos: string[] = []
        if (Array.isArray(creatorData.galleryPhotos) && creatorData.galleryPhotos.length > 0) {
          dashboardGalleryPhotos = allGalleryPhotos.slice(0, 10)
        } else {
          dashboardGalleryPhotos = [STOCK_DASHBOARD_IMAGE]
        }

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

        // CRITICAL: Read displayName from Firestore FIRST (where we save it)
        // Firebase Auth user.displayName is not updated by our save route
        // Priority: creator_profiles > users collection > Firebase Auth > fallback
        const displayName = creatorData.displayName || userData.displayName || user.displayName || 'Coach'
        
        const coach = {
          uid: user.uid,
          email: user.email || userData.email || '',
          displayName, // Use the prioritized displayName
          bio: creatorData.bio || userData.bio || '',
          sport,
          location: creatorData.location || userData.location || '',
          profileImageUrl,
          // Primary hero photos – if a custom gallery exists, use the first two;
          // otherwise just use the single primary image.
          showcasePhoto1: creatorData.showcasePhoto1 || userData.showcasePhoto1 || dashboardGalleryPhotos[0],
          showcasePhoto2: creatorData.showcasePhoto2 || userData.showcasePhoto2 || dashboardGalleryPhotos[1],
          instagram: creatorData.instagram || userData.instagram || '',
          youtube: creatorData.youtube || userData.youtube || '',
          linkedin: creatorData.linkedin || userData.linkedin || '',
          facebook: creatorData.facebook || userData.facebook || '',
          socialLinks: {
            instagram: creatorData.instagram || userData.instagram || '',
            linkedin: creatorData.linkedin || userData.linkedin || '',
            twitter: creatorData.twitter || userData.twitter || ''
          },
          // Dashboard gallery: one image on first build, up to 10 once the
          // coach has saved a custom gallery.
          galleryPhotos: dashboardGalleryPhotos
        }

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
