'use client'

import { useEffect, useMemo, useRef, useState, type WheelEvent, type ReactNode } from 'react'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Facebook, Instagram, Linkedin, Twitter, X, Youtube, ChevronUp, ChevronDown, Trash2, Minus } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { signOut } from 'firebase/auth'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { auth, storage } from '@/lib/firebase.client'

interface Lesson {
  id: string
  title: string
  status?: string
  sport?: string
  thumbnailUrl?: string
}

interface GearItem {
  id: string
  name: string
  price?: string
  imageUrl?: string
  link?: string
}

interface SocialLinks {
  linkedin?: string
  facebook?: string
  instagram?: string
  youtube?: string
  twitter?: string
}

interface SportTheme {
  accent: string
  overlay: string
  media?: string
}

const SPORT_THEMES: Record<string, SportTheme> = {
  soccer: {
    accent: '#0B6E4F',
    overlay: 'linear-gradient(90deg, rgba(11,110,79,0.12) 0%, rgba(11,110,79,0.06) 100%)',
    media:
      'https://static.wixstatic.com/media/75fa07_89696d9feff94ff090dc1ba88679a8bf~mv2.jpg/v1/fill/w_1600,h_600,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/75fa07_89696d9feff94ff090dc1ba88679a8bf~mv2.jpg'
  },
  basketball: {
    accent: '#440102',
    overlay: 'linear-gradient(90deg, rgba(68,1,2,0.12) 0%, rgba(68,1,2,0.06) 100%)',
    media: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?q=80&w=1600&auto=format&fit=crop'
  },
  volleyball: {
    accent: '#154089',
    overlay: 'linear-gradient(90deg, rgba(21,64,137,0.12) 0%, rgba(21,64,137,0.06) 100%)',
    media: 'https://images.unsplash.com/photo-1512428559087-560fa5ceab42?q=80&w=1600&auto=format&fit=crop'
  },
  baseball: {
    accent: '#8B0000',
    overlay: 'linear-gradient(90deg, rgba(139,0,0,0.12) 0%, rgba(139,0,0,0.06) 100%)',
    media: 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?q=80&w=1600&auto=format&fit=crop'
  },
  default: {
    accent: '#4B0102',
    overlay: 'linear-gradient(90deg, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.03) 100%)'
  }
}

const SPORT_LABEL_OVERRIDES: Record<string, string> = {
  bjj: 'Brazilian Jiu-Jitsu',
  'brazilian jiu-jitsu': 'Brazilian Jiu-Jitsu',
  jiujitsu: 'Brazilian Jiu-Jitsu',
  mma: 'Mixed Martial Arts'
}

// REMOVED: DEFAULT_GALLERY_IMAGES - coaches should only see photos they upload themselves
// No hardcoded fallback images to ensure strict control over displayed photos

const ATHLEAP_SOCIAL_LINKS: SocialLinks = {
  linkedin: 'https://www.linkedin.com/company/athleap',
  facebook: 'https://www.facebook.com/athleap',
  instagram: 'https://www.instagram.com/athleap',
  twitter: 'https://twitter.com/athleap',
  youtube: 'https://www.youtube.com/@athleap'
}

type SocialPlatform = keyof SocialLinks
type CoachSocialField = Extract<keyof HeroCoachProfileProps['coach'], SocialPlatform>

const SOCIAL_FIELD_CONFIG: Array<{
  key: CoachSocialField
  label: string
  placeholder: string
}> = [
  { key: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/athleap' },
  { key: 'facebook', label: 'Facebook', placeholder: 'https://facebook.com/athleap' },
  { key: 'twitter', label: 'Twitter / X', placeholder: 'https://twitter.com/athleap' },
  { key: 'linkedin', label: 'LinkedIn', placeholder: 'https://www.linkedin.com/in/coach' },
  { key: 'youtube', label: 'YouTube', placeholder: 'https://youtube.com/@coach' }
]

const SOCIAL_LABELS: Record<SocialPlatform, string> = {
  instagram: 'Instagram',
  facebook: 'Facebook',
  twitter: 'Twitter',
  linkedin: 'LinkedIn',
  youtube: 'YouTube'
}

const SOCIAL_ICON_MAP: Record<SocialPlatform, LucideIcon> = {
  instagram: Instagram,
  facebook: Facebook,
  twitter: Twitter,
  linkedin: Linkedin,
  youtube: Youtube
}

function normalizeSocialUrl(platform: SocialPlatform, value?: string) {
  if (!value) return ''
  const trimmed = value.trim()
  if (!trimmed) return ''
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  const handle = trimmed.replace(/^@/, '')
  switch (platform) {
    case 'instagram':
      return `https://www.instagram.com/${handle}`
    case 'facebook':
      return `https://www.facebook.com/${handle}`
    case 'twitter':
      return `https://twitter.com/${handle}`
    case 'linkedin':
      return `https://www.linkedin.com/in/${handle}`
    case 'youtube':
      return `https://www.youtube.com/${handle}`
    default:
      return trimmed
  }
}

interface HeroCoachProfileProps {
  coach: {
    uid: string
    displayName: string
    email: string
    bio?: string
    sport?: string
    profileImageUrl?: string
    showcasePhoto1?: string
    showcasePhoto2?: string
    location?: string
    instagram?: string
    youtube?: string
    linkedin?: string
    facebook?: string
    twitter?: string
    socialLinks?: {
      twitter?: string
      instagram?: string
      linkedin?: string
      facebook?: string
      youtube?: string
    }
    galleryPhotos?: string[]
  }
  totalLessons: number
  totalAthletes: number
  lessons: Lesson[]
  isInIframe?: boolean
  onBack?: () => void
  hideLessons?: boolean
  initialGearItems?: GearItem[]
  forceReadOnly?: boolean
}

export default function HeroCoachProfile({
  coach,
  lessons,
  isInIframe = false,
  onBack,
  hideLessons = false,
  initialGearItems,
  forceReadOnly = false
}: HeroCoachProfileProps) {
  const { user: authUser } = useAuth()
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [gearItems, setGearItems] = useState<GearItem[]>(initialGearItems || [])
  const [gearLoading, setGearLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [displayCoach, setDisplayCoach] = useState(coach)
  const [editableCoach, setEditableCoach] = useState(coach)
  const [uploadingPhotoField, setUploadingPhotoField] = useState<string | null>(null)
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null)

  useEffect(() => {
    console.log('[HERO-COACH-PROFILE] Coach prop changed, updating state:', coach.displayName)
    setDisplayCoach(coach)
    setEditableCoach(coach)
  }, [coach])

  const activeCoach = isEditing ? editableCoach : displayCoach

  const normalizedSport = activeCoach.sport?.trim().toLowerCase() || 'default'
  const theme = SPORT_THEMES[normalizedSport] || SPORT_THEMES.default

  const galleryPhotos = useMemo(() => {
    const photos: string[] = []
    if (activeCoach.showcasePhoto1) photos.push(activeCoach.showcasePhoto1)
    if (activeCoach.showcasePhoto2) photos.push(activeCoach.showcasePhoto2)
    if (activeCoach.galleryPhotos?.length) {
      activeCoach.galleryPhotos.forEach((url) => {
        if (typeof url === 'string' && url.trim().length > 0) {
          photos.push(url)
        }
      })
    }
    // STRICT: Only return photos that the coach has actually uploaded - no hardcoded fallbacks
    const deduped = Array.from(new Set(photos.filter((url) => typeof url === 'string' && url.trim().length > 0)))
    return deduped
  }, [activeCoach.showcasePhoto1, activeCoach.showcasePhoto2, activeCoach.galleryPhotos])

  const sportLabel = SPORT_LABEL_OVERRIDES[normalizedSport] || activeCoach.sport || 'Coach'
  const location = activeCoach.location?.trim()
  const bio = activeCoach.bio?.trim()

  // Only show coach socials that are explicitly set in the editable profile fields.
  // We intentionally ignore legacy nested `socialLinks` here so that clearing a field
  // in the editor truly removes the icon from the hero.
  const socialLinks: SocialLinks = {
    linkedin: activeCoach.linkedin,
    facebook: activeCoach.facebook,
    instagram: activeCoach.instagram,
    youtube: activeCoach.youtube,
    twitter: activeCoach.twitter
  }
  const isAthleteReadOnlyView = !!forceReadOnly
  const visibleSocialLinks = isAthleteReadOnlyView ? ATHLEAP_SOCIAL_LINKS : socialLinks

  const handleEditField = (field: keyof HeroCoachProfileProps['coach'], value: string) => {
    console.log(`[HERO-COACH-PROFILE] Field changed: ${field} = "${value}"`)
    setEditableCoach((prev) => {
      const updated = {
        ...prev,
        [field]: value
      }
      console.log(`[HERO-COACH-PROFILE] Updated editableCoach.${field}:`, updated[field])
      return updated
    })
  }

  const handleSaveEdits = async () => {
    // Persist edits to backend so they survive refresh
    try {
      console.log('[HERO-COACH-PROFILE] Save clicked, current editableCoach:', editableCoach)
      console.log('[HERO-COACH-PROFILE] displayName value:', editableCoach.displayName)
      
      if (!authUser) {
        throw new Error('You must be signed in to save changes')
      }

      // Helper function to get a fresh token with retry logic
      const getValidToken = async (retries = 3): Promise<string> => {
        for (let i = 0; i < retries; i++) {
          try {
            // Force token refresh every time to ensure it's valid
            const token = await authUser.getIdToken(true)
            if (token && token.length > 0) {
              console.log(`[HERO-COACH-PROFILE] Got valid token (attempt ${i + 1})`)
              return token
            }
          } catch (error) {
            console.error(`[HERO-COACH-PROFILE] Token refresh attempt ${i + 1} failed:`, error)
            if (i < retries - 1) {
              // Wait a bit before retrying
              await new Promise(resolve => setTimeout(resolve, 500))
            }
          }
        }
        throw new Error('Unable to get a valid authentication token. Please sign out and sign back in.')
      }

      const body = {
        displayName: editableCoach.displayName || '', // Ensure it's always a string, never undefined
        bio: editableCoach.bio,
        location: editableCoach.location,
        sport: editableCoach.sport,
        profileImageUrl: editableCoach.profileImageUrl,
        showcasePhoto1: editableCoach.showcasePhoto1,
        showcasePhoto2: editableCoach.showcasePhoto2,
        galleryPhotos: editableCoach.galleryPhotos || [],
        instagram: editableCoach.instagram,
        facebook: editableCoach.facebook,
        twitter: editableCoach.twitter,
        linkedin: editableCoach.linkedin,
        youtube: editableCoach.youtube,
        // Persist a flat `socialLinks` object that mirrors the editable fields.
        // This keeps older consumers working but ensures "clearing" in the UI
        // actually removes links from the rendered profile.
        socialLinks: {
          twitter: editableCoach.twitter,
          instagram: editableCoach.instagram,
          linkedin: editableCoach.linkedin,
          facebook: editableCoach.facebook,
          youtube: editableCoach.youtube
        }
      }
      
      // Debug logging to verify name is being sent
      console.log('[HERO-COACH-PROFILE] Saving profile with displayName:', body.displayName)

      // Helper function to make API call with automatic token refresh on 401
      const makeApiCall = async (retries = 2): Promise<Response> => {
        for (let i = 0; i <= retries; i++) {
          // Get a fresh token before each attempt
          const token = await getValidToken()
          
          const response = await fetch('/api/coach-profile/save', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(body)
          })

          // If we get 401, try refreshing token and retry
          if (response.status === 401 && i < retries) {
            console.log('[HERO-COACH-PROFILE] Got 401, refreshing token and retrying...')
            await new Promise(resolve => setTimeout(resolve, 300))
            continue
          }

          return response
        }
        throw new Error('Max retries exceeded')
      }

      const response = await makeApiCall()
      const result = await response.json()

      if (!response.ok || !result.success) {
        const errorMsg = result.error || 'Failed to save profile'
        if (errorMsg.includes('token') || errorMsg.includes('Invalid token') || errorMsg.includes('Unauthorized')) {
          throw new Error('Authentication error. Please refresh the page and try again.')
        }
        throw new Error(errorMsg)
      }

      console.log('[HERO-COACH-PROFILE] Save successful, response:', result)
      console.log('[HERO-COACH-PROFILE] Saved displayName:', body.displayName)

      // Only update local state and close edit mode after successful save
      setDisplayCoach(editableCoach)
      setIsEditing(false)
      
      // CRITICAL: Wait longer to ensure all database writes (including creators_index) are fully committed
      // Firestore writes are eventually consistent, so we need to wait for propagation
      // Then reload the page to ensure all data is fresh from the database
      // This ensures the name change is reflected everywhere
      console.log('[HERO-COACH-PROFILE] Waiting for database writes to complete...')
      await new Promise(resolve => setTimeout(resolve, 1000))
      console.log('[HERO-COACH-PROFILE] Reloading page to show updated name')
      window.location.reload()
    } catch (error) {
      // Show error to user and keep edit mode open so they can retry
      console.error('Failed to save coach profile edits:', error)
      alert(`Failed to save profile: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`)
      // Don't close edit mode on error - let user retry
    }
  }

  const handleCancelEdits = () => {
    setEditableCoach(displayCoach)
    setIsEditing(false)
  }

  const uploadPhotoForField = async (
    file: File,
    target:
      | { type: 'field'; field: keyof HeroCoachProfileProps['coach'] }
      | { type: 'gallery'; index?: number; append?: boolean }
  ) => {
    const ownerUid = coach.uid || authUser?.uid
    if (!ownerUid) {
      window.alert('You must be signed in as this coach to upload photos.')
      return
    }

    const targetKey =
      target.type === 'field'
        ? target.field
        : `gallery-${typeof target.index === 'number' ? target.index : 'new'}`

    setUploadingPhotoField(targetKey as string)

    try {
      const sanitizedName = file.name.replace(/\s+/g, '-').toLowerCase()
      const storagePath = `coaches/${ownerUid}/photos/${Date.now()}-${sanitizedName}`
      const storageRef = ref(storage, storagePath)
      const snapshot = await uploadBytes(storageRef, file)
      const downloadURL = await getDownloadURL(snapshot.ref)

      if (target.type === 'field') {
        handleEditField(target.field, downloadURL)
      } else if (target.type === 'gallery') {
        if (target.append || typeof target.index !== 'number') {
          setEditableCoach((prev) => ({
            ...prev,
            galleryPhotos: [...(prev.galleryPhotos || []), downloadURL]
          }))
        } else {
          handleGalleryPhotoChange(target.index, downloadURL)
        }
      }
    } catch (error) {
      console.error('Failed to upload photo', error)
      window.alert('Failed to upload image. Please try again.')
    } finally {
      setUploadingPhotoField(null)
    }
  }

  const handleGalleryPhotoChange = (index: number, value: string) => {
    setEditableCoach((prev) => {
      const gallery = [...(prev.galleryPhotos || [])]
      gallery[index] = value
      return {
        ...prev,
        galleryPhotos: gallery
      }
    })
  }

  const handleAddGalleryPhoto = () => {
    setEditableCoach((prev) => ({
      ...prev,
      galleryPhotos: [...(prev.galleryPhotos || []), '']
    }))
  }

  const handleRemoveGalleryPhoto = (index: number) => {
    setEditableCoach((prev) => {
      const gallery = [...(prev.galleryPhotos || [])]
      gallery.splice(index, 1)
      return {
        ...prev,
        galleryPhotos: gallery
      }
    })
  }

  useEffect(() => {
    if (!coach.uid && !coach.email) {
      return
    }

    let isMounted = true

    async function loadGear() {
      try {
        setGearLoading(true)
        const params = new URLSearchParams()
        if (coach.uid) {
          params.set('uid', coach.uid)
        } else if (coach.email) {
          params.set('email', coach.email)
        }

        const res = await fetch(`/api/gear/coach?${params.toString()}`)
        if (!res.ok) throw new Error('Failed to load gear')
        const data = await res.json()
        if (isMounted) setGearItems(data.gearItems || [])
      } catch (error) {
        console.error('Failed to load coach gear', error)
        if (isMounted) setGearItems([])
      } finally {
        if (isMounted) setGearLoading(false)
      }
    }

    loadGear()
    return () => {
      isMounted = false
    }
  }, [coach.uid, coach.email])

  const authUserRole = (authUser as unknown as { role?: string })?.role
  const allowedEditRoles = new Set(['coach', 'creator', 'admin', 'superadmin'])
  const isOwner = !!authUser && !!coach.uid && authUser.uid === coach.uid
  const canEditProfile = !forceReadOnly && isOwner && (!!authUserRole && allowedEditRoles.has(authUserRole))
  const canManageGear = canEditProfile
  const shouldShowLessons = canEditProfile && !hideLessons && lessons?.length > 0

  useEffect(() => {
    if (!canEditProfile && isEditing) {
      setIsEditing(false)
      setEditableCoach(displayCoach)
    }
  }, [canEditProfile, isEditing, displayCoach])

  return (
    <main className="min-h-screen bg-[#f5f5f5]">
      {!isInIframe && (
        <div className="sticky top-0 z-40 shadow-sm">
          <div className="w-full bg-white">
            <header className="w-full bg-white">
              <div className="max-w-6xl mx-auto px-8 py-5 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-3 flex-shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="https://static.wixstatic.com/media/75fa07_66efa272a9a64facbc09f3da71757528~mv2.png/v1/fill/w_68,h_64,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/75fa07_66efa272a9a64facbc09f3da71757528~mv2.png"
                    alt="Athleap logo"
                    className="h-8 w-auto"
                  />
                  <span className="text-xl font-semibold tracking-[0.02em]" style={{ fontFamily: '"Open Sans", sans-serif' }}>
                    ATHLEAP
                  </span>
                </Link>

                <div className="flex items-center gap-6">
                  {authUser && (
                    <button
                      type="button"
                      className="flex items-center gap-2 rounded-full bg-white border border-gray-200 px-3 py-1 text-xs sm:text-sm"
                      aria-label="Coach account"
                      onClick={async () => {
                        if (isSigningOut) return
                        setIsSigningOut(true)
                        setTimeout(async () => {
                          try {
                            await signOut(auth)
                          } catch (e) {
                            console.error('Sign out failed:', e)
                          } finally {
                            window.location.href = '/'
                          }
                        }, 300)
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={
                          activeCoach.profileImageUrl ||
                          (authUser as any)?.photoURL ||
                          '/athleap-logo-transparent.png'
                        }
                        alt={activeCoach.displayName || (authUser as any)?.displayName || 'Athleap Coach'}
                        className="h-6 w-6 rounded-full object-cover"
                      />
                      <span
                        className="text-[11px] uppercase tracking-[0.18em] text-gray-600"
                        style={{ fontFamily: '"Open Sans", sans-serif' }}
                      >
                        Hello
                      </span>
                      <span className="text-sm" style={{ fontFamily: '"Open Sans", sans-serif' }}>
                        {activeCoach.displayName || (authUser as any)?.displayName || 'Athleap Coach'}
                      </span>
                      <span className="text-xs text-gray-400">|</span>
                      <span
                        className="text-xs text-gray-700 underline"
                        style={{ fontFamily: '"Open Sans", sans-serif' }}
                      >
                        {isSigningOut ? 'Signing out…' : 'Sign out'}
                      </span>
                    </button>
                  )}

                  {onBack && (
                    <button
                      onClick={onBack}
                      className="inline-flex items-center gap-2 text-xs font-semibold text-gray-700 hover:text-black"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Back
                    </button>
                  )}
                </div>
              </div>
            </header>

            <section aria-label="Coach Community Bar" className="w-full" style={{ backgroundColor: '#FC0105' }}>
              <div className="w-full max-w-6xl mx-auto px-8 py-2">
                <p
                  className="text-right"
                  style={{
                    fontFamily: '"Open Sans", sans-serif',
                    fontSize: '15px',
                    lineHeight: 'normal',
                    letterSpacing: '0.01em',
                    color: '#FFFFFF',
                    fontWeight: 700
                  }}
                >
                  Coach Community - {sportLabel}
                </p>
              </div>
            </section>
          </div>
        </div>
      )}

      <HeroSection
        coach={activeCoach}
        editingCoach={editableCoach}
        isEditing={isEditing}
        onFieldChange={handleEditField}
        onGalleryPhotoChange={handleGalleryPhotoChange}
        onAddGalleryPhoto={handleAddGalleryPhoto}
        onRemoveGalleryPhoto={handleRemoveGalleryPhoto}
        onPhotoUpload={uploadPhotoForField}
        uploadingPhotoField={uploadingPhotoField}
        onEditToggle={() => setIsEditing((prev) => !prev)}
        onSave={handleSaveEdits}
        onCancel={handleCancelEdits}
        theme={theme}
      canEditProfile={canEditProfile}
      socialLinks={visibleSocialLinks}
      />

      {galleryPhotos.length > 0 && (
        <CoachGallery 
          photos={galleryPhotos} 
          galleryPhotosOnly={activeCoach.galleryPhotos || []}
          showcasePhoto1={activeCoach.showcasePhoto1}
          showcasePhoto2={activeCoach.showcasePhoto2}
          canEdit={canEditProfile}
          onPhotoDeleted={() => {
            // Reload the page to refresh the coach data
            window.location.reload()
          }}
        />
      )}

      {shouldShowLessons && (
        <TrainingLibrarySection coachName={activeCoach.displayName} lessons={lessons} onSelectLesson={setSelectedLesson} />
      )}

      {!gearLoading && (gearItems.length > 0 || canManageGear) && (
        <RecommendedGearSection items={gearItems} canManage={canManageGear} onGearAdded={(item) => setGearItems((prev) => [item, ...prev])} />
      )}

      {selectedLesson && <LessonDetailModal lesson={selectedLesson} onClose={() => setSelectedLesson(null)} />}

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </main>
  )
}

function HeroSection({
  coach,
  editingCoach,
  isEditing,
  onFieldChange,
  onGalleryPhotoChange,
  onAddGalleryPhoto,
  onRemoveGalleryPhoto,
  onPhotoUpload,
  uploadingPhotoField,
  onEditToggle,
  onSave,
  onCancel,
  theme,
  canEditProfile,
  socialLinks
}: {
  coach: HeroCoachProfileProps['coach']
  editingCoach: HeroCoachProfileProps['coach']
  isEditing: boolean
  onFieldChange: (field: keyof HeroCoachProfileProps['coach'], value: string) => void
  onGalleryPhotoChange: (index: number, value: string) => void
  onAddGalleryPhoto: () => void
  onRemoveGalleryPhoto: (index: number) => void
  onPhotoUpload: (
    file: File,
    target:
      | { type: 'field'; field: keyof HeroCoachProfileProps['coach'] }
      | { type: 'gallery'; index?: number; append?: boolean }
  ) => void
  uploadingPhotoField: string | null
  onEditToggle: () => void
  onSave: () => void
  onCancel: () => void
  theme: SportTheme
  canEditProfile: boolean
  socialLinks: SocialLinks
}) {
  const editingEnabled = canEditProfile && isEditing
  const embossClasses =
    'px-5 py-2 rounded-md text-sm font-semibold uppercase tracking-wide text-white'
  const primaryButtonStyles = {
    backgroundColor: '#C40000',
    border: '1px solid rgba(255,255,255,0.25)'
  }
  const secondaryButtonStyles = {
    backgroundColor: 'rgba(255,255,255,0.12)',
    border: '1px solid rgba(255,255,255,0.35)'
  }

  return (
    <section className="relative w-full overflow-hidden" style={{ backgroundColor: '#440102' }}>
      {/* Solid sport-themed overlay, no background images */}

      <div className="relative max-w-6xl mx-auto px-8 py-16 grid gap-10 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1.1fr)] items-center">
        <div className="space-y-6">
          <div className="space-y-2">
            {editingEnabled ? (
              <input
                type="text"
                value={editingCoach.displayName || ''}
                onChange={(e) => onFieldChange('displayName', e.target.value)}
                placeholder="Enter your name"
                className="w-full bg-white/20 border-2 border-white/50 rounded-md px-4 py-3 text-white text-3xl font-bold focus:outline-none focus:ring-2 focus:ring-white/80 focus:bg-white/30"
                style={{ fontFamily: '"Open Sans", sans-serif' }}
              />
            ) : (
              <h2
                className="font-bold text-white"
                style={{ fontFamily: '"Open Sans", sans-serif', fontSize: '54px', lineHeight: 'normal', margin: 0, marginBottom: '6px' }}
              >
                {coach.displayName}
              </h2>
            )}
            {editingEnabled ? (
              <div className="flex flex-col gap-2">
                <input
                  value={editingCoach.location || ''}
                  onChange={(e) => onFieldChange('location', e.target.value)}
                  placeholder="Location"
                  className="w-full bg-white/10 border border-white/30 rounded-md px-4 py-2 text-white"
                  style={{ fontFamily: '"Open Sans", sans-serif' }}
                />
                <input
                  value={editingCoach.sport || ''}
                  onChange={(e) => onFieldChange('sport', e.target.value)}
                  placeholder="Primary sport"
                  className="w-full bg-white/10 border border-white/30 rounded-md px-4 py-2 text-white"
                  style={{ fontFamily: '"Open Sans", sans-serif' }}
                />
              </div>
            ) : (
              <>
                {coach.location && (
                  <h5 className="text-white" style={{ fontFamily: '"Open Sans", sans-serif', fontSize: '18px', margin: 0, marginTop: '4px' }}>
                    {coach.location}
                  </h5>
                )}
                {coach.sport && (
                  <p className="text-white/70" style={{ fontFamily: '"Open Sans", sans-serif', fontSize: '16px' }}>
                    {coach.sport}
                  </p>
                )}
              </>
            )}
          </div>

          <div>
            {editingEnabled ? (
              <textarea
                value={editingCoach.bio || ''}
                onChange={(e) => onFieldChange('bio', e.target.value)}
                className="w-full min-h-[140px] bg-white/10 border border-white/30 rounded-md px-4 py-3 text-white"
                style={{ fontFamily: '"Open Sans", sans-serif', fontSize: '18px', lineHeight: '1.4em' }}
              />
            ) : (
              coach.bio && (
                <p
                  className="text-white"
                  style={{
                    fontFamily: '"Open Sans", sans-serif',
                    fontSize: '21px',
                    lineHeight: '1.3em'
                  }}
                >
                  {coach.bio}
                </p>
              )
            )}
          </div>

          {!editingEnabled && <CoachSocialLinkRow socialLinks={socialLinks} />}
        </div>

        <div className="flex justify-center md:justify-end">
          <div className="flex flex-col items-center gap-4 w-full max-w-md">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={coach.profileImageUrl || '/brand/athleap-logo-colored.png'}
            alt={coach.displayName}
            className="w-[347px] h-[359px] object-cover rounded-lg bg-white"
          />
            {canEditProfile && (
              <div className="flex flex-wrap items-center justify-center gap-3">
                {!editingEnabled ? (
                  <div className="w-[347px] flex items-center gap-4">
                    <button
                      type="button"
                      onClick={onEditToggle}
                      className="flex-1 h-12 rounded-2xl border border-white/40 bg-[#C40000] text-white text-sm font-semibold uppercase tracking-wide focus:outline-none"
                      style={{ backgroundColor: '#C40000', fontFamily: '"Open Sans", sans-serif' }}
                    >
                      Edit Profile
                    </button>
                    <Link
                      href="/dashboard/coach/locker-room"
                      className="flex-1 h-12 rounded-2xl border border-white/40 bg-[#C40000] text-white text-sm font-semibold uppercase tracking-wide flex items-center justify-center focus:outline-none"
                      style={{ backgroundColor: '#C40000', fontFamily: '"Open Sans", sans-serif' }}
                    >
                      Locker Room
                    </Link>
                  </div>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={onCancel}
                      className={embossClasses}
                      style={secondaryButtonStyles}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={onSave}
                      className={embossClasses}
                      style={primaryButtonStyles}
                    >
                      Save Changes
                    </button>
                  </>
                )}
              </div>
            )}
            {editingEnabled && (
              <PhotoEditPanel
                editingCoach={editingCoach}
                onFieldChange={onFieldChange}
                onGalleryPhotoChange={onGalleryPhotoChange}
                onAddGalleryPhoto={onAddGalleryPhoto}
                onRemoveGalleryPhoto={onRemoveGalleryPhoto}
                onPhotoUpload={onPhotoUpload}
                uploadingPhotoField={uploadingPhotoField}
              />
            )}
            {editingEnabled && (
              <SocialLinksEditor editingCoach={editingCoach} onFieldChange={onFieldChange} />
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

function CoachSocialLinkRow({ socialLinks }: { socialLinks: SocialLinks }) {
  const entries = (Object.keys(socialLinks) as SocialPlatform[])
    .map((platform) => {
      const url = normalizeSocialUrl(platform, socialLinks[platform])
      return url ? { platform, url } : null
    })
    .filter((entry): entry is { platform: SocialPlatform; url: string } => !!entry)

  if (!entries.length) {
    return null
  }

  return (
    <div className="flex flex-wrap items-center gap-4 pt-2">
      {entries.map(({ platform, url }) => {
        const Icon = SOCIAL_ICON_MAP[platform]
        return (
          <a
            key={platform}
            href={url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-white/30 px-4 py-1 text-white/80 text-sm font-semibold hover:text-white hover:border-white transition-colors"
          >
            <Icon className="w-4 h-4" />
            <span>{SOCIAL_LABELS[platform]}</span>
          </a>
        )
      })}
    </div>
  )
}

function SocialLinksEditor({
  editingCoach,
  onFieldChange
}: {
  editingCoach: HeroCoachProfileProps['coach']
  onFieldChange: (field: keyof HeroCoachProfileProps['coach'], value: string) => void
}) {
  return (
    <div className="w-full space-y-4">
      <h4
        className="text-sm uppercase tracking-[0.2em] text-white/70"
        style={{ fontFamily: '"Open Sans", sans-serif' }}
      >
        Social Links
      </h4>
      <div className="grid gap-4 md:grid-cols-2 w-full">
        {SOCIAL_FIELD_CONFIG.map(({ key, label, placeholder }) => (
          <label key={key} className="flex flex-col gap-2 text-white/80 text-xs uppercase tracking-[0.18em]">
            <span>{label}</span>
            <input
              type="text"
              value={(editingCoach[key] as string) || ''}
              onChange={(e) => onFieldChange(key, e.target.value)}
              placeholder={placeholder}
              className="w-full bg-white/10 border border-white/30 rounded-md px-4 py-2 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/60"
            />
          </label>
        ))}
      </div>
    </div>
  )
}

function PhotoEditPanel({
  editingCoach,
  onFieldChange,
  onGalleryPhotoChange,
  onAddGalleryPhoto,
  onRemoveGalleryPhoto,
  onPhotoUpload,
  uploadingPhotoField
}: {
  editingCoach: HeroCoachProfileProps['coach']
  onFieldChange: (field: keyof HeroCoachProfileProps['coach'], value: string) => void
  onGalleryPhotoChange: (index: number, value: string) => void
  onAddGalleryPhoto: () => void
  onRemoveGalleryPhoto: (index: number) => void
  onPhotoUpload: (
    file: File,
    target:
      | { type: 'field'; field: keyof HeroCoachProfileProps['coach'] }
      | { type: 'gallery'; index?: number; append?: boolean }
  ) => void
  uploadingPhotoField: string | null
}) {
  const galleryPhotos = editingCoach.galleryPhotos || []
  const uploadInputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  const triggerFileDialog = (key: string) => {
    uploadInputRefs.current[key]?.click()
  }

  const handleFileSelected = (
    event: React.ChangeEvent<HTMLInputElement>,
    target:
      | { type: 'field'; field: keyof HeroCoachProfileProps['coach'] }
      | { type: 'gallery'; index?: number; append?: boolean }
  ) => {
    const file = event.target.files?.[0]
    if (file) {
      onPhotoUpload(file, target)
    }
    event.target.value = ''
  }

  const setUploadInputRef = (key: string) => (el: HTMLInputElement | null) => {
    uploadInputRefs.current[key] = el
  }

  const renderUploadButton = (key: string, label = 'Upload') => (
    <div>
      <input
        type="file"
        accept="image/*"
        className="hidden"
        ref={setUploadInputRef(key)}
        onChange={(e) => {
          const target: { type: 'field'; field: keyof HeroCoachProfileProps['coach'] } | { type: 'gallery'; index?: number; append?: boolean } =
            key === 'gallery-new'
              ? { type: 'gallery', append: true }
              : key.startsWith('gallery-')
                ? { type: 'gallery', index: Number(key.replace('gallery-', '')) }
                : { type: 'field', field: key as keyof HeroCoachProfileProps['coach'] }
          handleFileSelected(e, target)
        }}
      />
      <button
        type="button"
        onClick={() => triggerFileDialog(key)}
        className="px-3 py-2 rounded-md border border-white/30 text-white text-xs font-semibold"
      >
        {uploadingPhotoField === key ? 'Uploading...' : label}
      </button>
    </div>
  )

  return (
    <div className="w-full bg-white/5 border border-white/20 rounded-xl p-4 space-y-4 text-left">
      <div className="space-y-2">
        <label className="block text-xs font-semibold tracking-wide text-white/70" style={{ fontFamily: '"Open Sans", sans-serif' }}>
          Profile Image URL
        </label>
        <div className="flex gap-2">
          <input
            value={editingCoach.profileImageUrl || ''}
            onChange={(e) => onFieldChange('profileImageUrl', e.target.value)}
            className="flex-1 bg-white/10 border border-white/25 rounded-md px-3 py-2 text-white text-sm"
            placeholder="https://..."
          />
          {renderUploadButton('profileImageUrl')}
        </div>
      </div>
      <div className="space-y-2">
        <label className="block text-xs font-semibold tracking-wide text-white/70" style={{ fontFamily: '"Open Sans", sans-serif' }}>
          Feature Photo 1
        </label>
        <div className="flex gap-2">
          <input
            value={editingCoach.showcasePhoto1 || ''}
            onChange={(e) => onFieldChange('showcasePhoto1', e.target.value)}
            className="flex-1 bg-white/10 border border-white/25 rounded-md px-3 py-2 text-white text-sm"
            placeholder="https://..."
          />
          {renderUploadButton('showcasePhoto1')}
        </div>
      </div>
      <div className="space-y-2">
        <label className="block text-xs font-semibold tracking-wide text-white/70" style={{ fontFamily: '"Open Sans", sans-serif' }}>
          Feature Photo 2
        </label>
        <div className="flex gap-2">
          <input
            value={editingCoach.showcasePhoto2 || ''}
            onChange={(e) => onFieldChange('showcasePhoto2', e.target.value)}
            className="flex-1 bg-white/10 border border-white/25 rounded-md px-3 py-2 text-white text-sm"
            placeholder="https://..."
          />
          {renderUploadButton('showcasePhoto2')}
        </div>
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold tracking-wide text-white/70" style={{ fontFamily: '"Open Sans", sans-serif' }}>
            Gallery Photos
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onAddGalleryPhoto}
              className="px-3 py-1 rounded-md border border-white/30 text-white text-xs font-semibold"
            >
              + Add Photo
            </button>
            {renderUploadButton('gallery-new', 'Upload New')}
          </div>
        </div>
        <div className="space-y-2">
          {galleryPhotos.length === 0 && <p className="text-white/60 text-xs">No gallery photos yet.</p>}
          {galleryPhotos.map((url, idx) => (
            <div key={`gallery-edit-${idx}`} className="flex items-center gap-2">
              <input
                value={url}
                onChange={(e) => onGalleryPhotoChange(idx, e.target.value)}
                className="flex-1 bg-white/10 border border-white/25 rounded-md px-3 py-2 text-white text-sm"
                placeholder={`Photo ${idx + 1} URL`}
              />
              <div className="flex items-center gap-2">
                {renderUploadButton(`gallery-${idx}`)}
                <button
                  type="button"
                  onClick={() => onRemoveGalleryPhoto(idx)}
                  className="px-3 py-2 rounded-md border border-white/30 text-white text-xs font-semibold"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function CoachGallery({
  showcasePhoto1,
  showcasePhoto2, 
  photos, 
  galleryPhotosOnly = [],
  canEdit = false,
  onPhotoDeleted 
}: { 
  photos: string[]
  showcasePhoto1?: string
  showcasePhoto2?: string
  galleryPhotosOnly?: string[]
  canEdit?: boolean
  onPhotoDeleted?: () => void
}) {
  const { user } = useAuth()
  const rowRef = useRef<HTMLDivElement>(null)
  const photoWidth = 250
  const photoGap = 12
  const maxVisiblePhotos = 4
  const scrollByAmount = photoWidth + photoGap
  const hasOverflow = photos.length > maxVisiblePhotos
  const [deletingPhotoUrl, setDeletingPhotoUrl] = useState<string | null>(null)

  const handlePrev = () => {
    if (rowRef.current) {
      rowRef.current.scrollBy({ left: -scrollByAmount, behavior: 'smooth' })
    }
  }

  const handleNext = () => {
    if (rowRef.current) {
      rowRef.current.scrollBy({ left: scrollByAmount, behavior: 'smooth' })
    }
  }

  const handleDeletePhoto = async (photoUrl: string) => {
    if (!user || !confirm('Are you sure you want to delete this photo?')) return

    setDeletingPhotoUrl(photoUrl)
    
    // Aggressive token refresh with retry logic
    const getValidToken = async (retries = 3): Promise<string | null> => {
      for (let i = 0; i < retries; i++) {
        try {
          // Force token refresh every time
          const token = await user.getIdToken(true)
          if (token && token.length > 0) {
            return token
          }
        } catch (error) {
          console.error(`Token refresh attempt ${i + 1} failed:`, error)
          if (i < retries - 1) {
            // Wait a bit before retrying
            await new Promise(resolve => setTimeout(resolve, 500))
          }
        }
      }
      return null
    }

    try {
      // Get a fresh token with retry logic
      let token = await getValidToken()
      
      if (!token) {
        alert('Unable to get a valid authentication token. Please sign out and sign back in, then try again.')
        setDeletingPhotoUrl(null)
        return
      }
      
      // Check if it's a showcase photo
      const isShowcasePhoto1 = showcasePhoto1 === photoUrl
      const isShowcasePhoto2 = showcasePhoto2 === photoUrl
      
      // Helper function to make API calls with automatic token refresh on 401
      const makeApiCall = async (url: string, options: RequestInit, retries = 2): Promise<Response> => {
        for (let i = 0; i <= retries; i++) {
          // Refresh token before each attempt
          token = await getValidToken()
          if (!token) {
            throw new Error('Unable to get valid token')
          }
          
          const response = await fetch(url, {
            ...options,
            headers: {
              ...options.headers,
              Authorization: `Bearer ${token}`
            }
          })
          
          // If we get 401, try refreshing token and retry
          if (response.status === 401 && i < retries) {
            console.log('Got 401, refreshing token and retrying...')
            await new Promise(resolve => setTimeout(resolve, 300))
            continue
          }
          
          return response
        }
        throw new Error('Max retries exceeded')
      }
      
      if (isShowcasePhoto1 || isShowcasePhoto2) {
        // Delete showcase photo by clearing the field
        const updateData: { showcasePhoto1?: string; showcasePhoto2?: string } = {}
        if (isShowcasePhoto1) updateData.showcasePhoto1 = ''
        if (isShowcasePhoto2) updateData.showcasePhoto2 = ''
        
        const res = await makeApiCall('/api/coach-profile/save', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(updateData)
        })
        
        const data = await res.json()
        if (data?.success || res.ok) {
          if (onPhotoDeleted) {
            onPhotoDeleted()
          } else {
            window.location.reload()
          }
          return
        } else {
          const errorMsg = data?.error || 'Unknown error'
          console.error('Failed to delete showcase photo:', errorMsg, data)
          if (errorMsg.includes('token') || errorMsg.includes('Unauthorized')) {
            alert('Authentication error. Please refresh the page and try again.')
            window.location.reload()
          } else {
            alert(`Failed to delete photo: ${errorMsg}`)
          }
          setDeletingPhotoUrl(null)
          return
        }
      }
      
      // If not a showcase photo, delete from gallery photos
      const params = new URLSearchParams({ photoUrl })
      const res = await makeApiCall(`/api/coach-profile/delete-gallery-photo?${params.toString()}`, {
        method: 'DELETE'
      })

      const data = await res.json()
      if (data?.success) {
        // Refresh the page to show updated photos
        if (onPhotoDeleted) {
          onPhotoDeleted()
        } else {
          window.location.reload()
        }
      } else {
        const errorMsg = data?.error || 'Unknown error'
        console.error('Failed to delete photo:', errorMsg, data)
        if (errorMsg.includes('token') || errorMsg.includes('Invalid token') || errorMsg.includes('Unauthorized')) {
          alert('Authentication error. Refreshing page...')
          window.location.reload()
        } else {
          alert(`Failed to delete photo: ${errorMsg}`)
        }
      }
    } catch (error: any) {
      console.error('Failed to delete photo:', error)
      const errorMsg = error?.message || 'Unknown error'
      if (errorMsg.includes('token') || errorMsg.includes('auth')) {
        alert('Authentication error. Please refresh the page and try again.')
        window.location.reload()
      } else {
        alert(`Failed to delete photo: ${errorMsg}. Please try refreshing the page.`)
      }
    } finally {
      setDeletingPhotoUrl(null)
    }
  }

  // Calculate max width to show exactly 4 photos
  const maxContainerWidth = maxVisiblePhotos * photoWidth + (maxVisiblePhotos - 1) * photoGap

  // SECURITY: Only allow deletion if user is the owner and has edit permissions
  const canDelete = canEdit && !!user

  return (
    <section className="w-full bg-white">
      <div className="max-w-6xl mx-auto px-8 py-8">
        <div className={`flex items-center ${hasOverflow ? 'gap-4' : ''}`}>
          {hasOverflow && (
            <button
              onClick={handlePrev}
              aria-label="Previous"
              className="hidden sm:flex flex-shrink-0 w-10 h-10 rounded-full bg-white shadow items-center justify-center hover:bg-gray-50 z-10"
            >
              <ArrowRight className="w-5 h-5 rotate-180" />
            </button>
          )}

          <div className="flex-1" style={hasOverflow ? { maxWidth: `${maxContainerWidth}px` } : undefined}>
            <div
              ref={rowRef}
              className={`flex gap-3 ${
                hasOverflow
                  ? 'overflow-x-auto overflow-y-hidden scroll-smooth no-scrollbar'
                  : 'w-full justify-between'
              }`}
            >
              {photos.map((src, idx) => {
                const isDeleting = deletingPhotoUrl === src
                
                return (
                  <div
                    key={`${src}-${idx}`}
                    className={`relative ${
                      hasOverflow ? 'shrink-0' : 'flex-1 min-w-[180px] max-w-[240px]'
                    } h-[260px] md:h-[285px] rounded-md overflow-hidden bg-gray-100 group`}
                    style={hasOverflow ? { width: `${photoWidth}px` } : undefined}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt={`Gallery image ${idx + 1}`} className="w-full h-full object-cover" loading={idx < 4 ? 'eager' : 'lazy'} />
                    
                    {/* Delete button - show for all photos */}
                    {canDelete && (
                      <button
                        onClick={() => handleDeletePhoto(src)}
                        disabled={isDeleting}
                        className="absolute top-2 right-2 w-10 h-10 rounded-full bg-[#C40000] text-white flex items-center justify-center hover:bg-[#a00000] transition-all disabled:opacity-50 shadow-2xl z-20 border-2 border-white"
                        aria-label="Delete photo"
                      >
                        {isDeleting ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Minus className="w-5 h-5 stroke-[3]" />
                        )}
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {hasOverflow && (
            <button
              onClick={handleNext}
              aria-label="Next"
              className="hidden sm:flex flex-shrink-0 w-10 h-10 rounded-full bg-white shadow items-center justify-center hover:bg-gray-50 z-10"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
          )}
        </div>

        {hasOverflow && (
          <div className="sm:hidden mt-4 flex items-center justify-center gap-6">
            <button
              onClick={handlePrev}
              aria-label="Previous"
              className="w-10 h-10 rounded-full bg-white shadow flex items-center justify-center hover:bg-gray-50"
            >
              <ArrowRight className="w-5 h-5 rotate-180" />
            </button>
            <button
              onClick={handleNext}
              aria-label="Next"
              className="w-10 h-10 rounded-full bg-white shadow flex items-center justify-center hover:bg-gray-50"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </section>
  )
}

function TrainingLibrarySection({
  lessons,
  coachName,
  onSelectLesson
}: {
  lessons: Lesson[]
  coachName: string
  onSelectLesson?: (lesson: Lesson) => void
}) {
  const filteredLessons = lessons.filter((lesson) => !!lesson && !!lesson.title?.trim?.())
  const pageSize = 4
  const [page, setPage] = useState(0)

  const totalPages = Math.max(1, Math.ceil(filteredLessons.length / pageSize))
  const start = page * pageSize
  const visibleLessons = filteredLessons.slice(start, start + pageSize)

  return (
    <section className="w-full" style={{ backgroundColor: '#EDEDED' }}>
      <div className="max-w-6xl mx-auto px-8 py-12">
        <div className="flex items-center justify-between mb-2">
          <h2 style={{ fontFamily: '"Open Sans", sans-serif', fontSize: '25px', color: '#000000' }}>
            {coachName}&apos;s Training Library
          </h2>
        </div>
        <div className="border-t border-gray-300">
          {visibleLessons.map((lesson) => (
            <button
              type="button"
              key={lesson.id}
              onClick={() => onSelectLesson?.(lesson)}
              className="w-full flex items-center gap-6 py-6 border-b border-gray-200 last:border-b-0 text-left hover:bg-gray-50 transition-colors"
            >
              <div className="w-24 h-24 rounded-full bg-[#440102] flex items-center justify-center overflow-hidden flex-shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {lesson.thumbnailUrl ? (
                  <img src={lesson.thumbnailUrl} alt={lesson.title} className="w-full h-full object-cover" />
                ) : (
                  <img src="/brand/athleap-logo-colored.png" alt="Athleap" className="w-12 h-12 opacity-90" />
                )}
              </div>
              <div className="flex-1 flex items-center justify-between gap-4">
                <p style={{ fontFamily: '"Open Sans", sans-serif', fontSize: '18px', color: '#000000' }}>
                  {lesson.title}
                </p>
                <p className="text-sm" style={{ fontFamily: '"Open Sans", sans-serif', color: '#555555' }}>
                  {lesson.status || 'Published'}
                </p>
              </div>
            </button>
          ))}
        </div>

        {/* Pagination arrows - only show when there are more than 4 lessons */}
        {filteredLessons.length > pageSize && (
          <div className="mt-6 flex items-center justify-center gap-4">
            <button
              type="button"
              aria-label="Previous lessons"
              onClick={() => setPage((prev) => Math.max(0, prev - 1))}
              disabled={page === 0}
              className={`w-9 h-9 rounded-full border flex items-center justify-center transition-colors ${
                page === 0
                  ? 'border-gray-300 text-gray-400 cursor-not-allowed opacity-60'
                  : 'border-black text-black hover:bg-black hover:text-white'
              }`}
            >
              <ChevronUp className="w-4 h-4" />
            </button>
            <span
              className="text-xs"
              style={{ fontFamily: '"Open Sans", sans-serif', color: '#555555' }}
            >
              Page {page + 1} of {totalPages}
            </span>
            <button
              type="button"
              aria-label="Next lessons"
              onClick={() => setPage((prev) => Math.min(totalPages - 1, prev + 1))}
              disabled={page >= totalPages - 1}
              className={`w-9 h-9 rounded-full border flex items-center justify-center transition-colors ${
                page >= totalPages - 1
                  ? 'border-gray-300 text-gray-400 cursor-not-allowed opacity-60'
                  : 'border-black text-black hover:bg-black hover:text-white'
              }`}
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </section>
  )
}

function LessonDetailModal({ lesson, onClose }: { lesson: Lesson; onClose: () => void }) {
  return (
    <ModalShell
      title={`Edit Lesson – ${lesson.title}`}
      onClose={onClose}
      widthClass="max-w-5xl"
    >
      <div className="space-y-4" style={{ fontFamily: '"Open Sans", sans-serif' }}>
        <p className="text-sm text-gray-600">
          Status: {lesson.status || 'Published'}
        </p>
        <div className="w-full h-[70vh] rounded-2xl overflow-hidden border border-gray-200 bg-white">
          <iframe
            src={`/dashboard/coach/lessons/${lesson.id}/edit?embedded=true`}
            className="w-full h-full border-0"
            title={`Edit lesson ${lesson.title}`}
          />
        </div>
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-full border border-gray-300 text-gray-700 text-sm font-semibold hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </ModalShell>
  )
}

function ModalShell({
  title,
  children,
  onClose,
  widthClass = 'max-w-3xl'
}: {
  title: string
  children: ReactNode
  onClose: () => void
  widthClass?: string
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={onClose}
    >
      <div
        className={`bg-white rounded-2xl w-full ${widthClass} max-h-[90vh] overflow-hidden`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-2xl font-bold" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif' }}>
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto max-h-[80vh]">{children}</div>
      </div>
    </div>
  )
}

function RecommendedGearSection({
  items,
  canManage,
  onGearAdded
}: {
  items: GearItem[]
  canManage: boolean
  onGearAdded: (item: GearItem) => void
}) {
  const rowRef = useRef<HTMLDivElement>(null)
  const { user } = useAuth()
  const [showAdd, setShowAdd] = useState(false)
  const [gearUrl, setGearUrl] = useState('')
  const [gearSaving, setGearSaving] = useState(false)
  const [gearError, setGearError] = useState<string | null>(null)
  const [gearItems, setGearItems] = useState<GearItem[]>(items)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const hasOverflow = gearItems.length > 4

  const canSubmitGear = canManage && !!user

  // Update local state when items prop changes
  useEffect(() => {
    setGearItems(items)
  }, [items])

  const handlePrev = () => rowRef.current?.scrollBy({ left: -400, behavior: 'smooth' })
  const handleNext = () => rowRef.current?.scrollBy({ left: 400, behavior: 'smooth' })

  const handleAddGear = async () => {
    if (!gearUrl.trim() || !canSubmitGear) {
      return
    }
    setGearSaving(true)
    setGearError(null)
    try {
      const token = await user!.getIdToken()
      const res = await fetch('/api/gear/add-from-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ url: gearUrl.trim() })
      })
      const data = await res.json()
      if (!res.ok || !data?.success) {
        throw new Error('Unable to add gear')
      }
      const newItem: GearItem = { id: data.id, ...(data.data || {}) }
      setGearItems(prev => [newItem, ...prev])
      onGearAdded(newItem)
      setGearUrl('')
      setShowAdd(false)
    } catch (error) {
      console.error('Failed to add gear from URL', error)
      setGearError('Could not add that product. Please double-check the URL.')
    } finally {
      setGearSaving(false)
    }
  }

  const handleRemoveGear = async (itemId: string, itemSource?: string) => {
    if (!canManage || !user || !confirm('Are you sure you want to remove this gear item?')) {
      return
    }
    
    setDeletingId(itemId)
    try {
      const token = await user.getIdToken()
      const params = new URLSearchParams({ id: itemId })
      if (itemSource) params.set('source', itemSource)
      
      const res = await fetch(`/api/gear/delete?${params.toString()}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      
      const data = await res.json()
      if (data?.success) {
        setGearItems(prev => prev.filter(item => item.id !== itemId))
      } else {
        alert('Failed to remove gear item. Please try again.')
      }
    } catch (error) {
      console.error('Failed to remove gear item:', error)
      alert('Failed to remove gear item. Please try again.')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <section className="w-full" style={{ backgroundColor: '#4B0102' }}>
      <div className="max-w-6xl mx-auto px-8 py-12 space-y-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <h1 style={{ fontFamily: '"Open Sans", sans-serif', fontSize: '25px', color: '#FFFFFF', fontWeight: 700 }}>
            Your Recommended Gear
          </h1>
          {canManage && (
            <button
              type="button"
              onClick={() => setShowAdd(true)}
              className="group relative flex items-center justify-center h-12 w-12 rounded-2xl border border-white/40 text-white focus:outline-none transition-all duration-300 ease-out overflow-hidden"
              style={{ backgroundColor: '#C40000', width: '48px' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.width = '150px'
                e.currentTarget.classList.add('justify-start', 'pl-4')
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.width = '48px'
                e.currentTarget.classList.remove('justify-start', 'pl-4')
              }}
            >
              <span className="text-2xl leading-none transition-all duration-300 group-hover:translate-x-1">+</span>
              <span
                className="ml-0 group-hover:ml-2 whitespace-nowrap text-sm font-semibold uppercase tracking-wide opacity-0 max-w-0 group-hover:opacity-100 group-hover:max-w-[120px] transition-all duration-300 ease-out"
                style={{ fontFamily: '"Open Sans", sans-serif' }}
              >
                Add Gear
              </span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-4">
          {hasOverflow && (
            <button
              onClick={handlePrev}
              aria-label="Previous Product"
              className="w-12 h-12 rounded-full bg-white flex items-center justify-center hover:bg-gray-50"
            >
              <ArrowRight className="w-5 h-5 rotate-180" />
            </button>
          )}

          <div
            ref={rowRef}
            className="flex-1 flex gap-5 overflow-x-auto scroll-smooth px-4 py-2 no-scrollbar"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {gearItems.length === 0 && canManage ? (
              <div className="text-white/80" style={{ fontFamily: '"Open Sans", sans-serif' }}>
                No gear added yet. Click "Add item" to paste your first product link.
              </div>
            ) : (
              gearItems.map((item) => (
                <div key={item.id} className="w-[150px] flex-shrink-0 relative group">
                  <a href={item.link || '#'} target={item.link ? '_blank' : '_self'} rel="noreferrer">
                    <div className="w-[150px] h-[150px] rounded-lg overflow-hidden bg-[#5A0202] flex items-center justify-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} className="w-[150px] h-[150px] object-cover" />
                      ) : (
                        <img src="/brand/athleap-logo-colored.png" alt="Athleap" className="w-14 h-14 opacity-90" />
                      )}
                    </div>
                  </a>
                  {canManage && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        handleRemoveGear(item.id, (item as any).source)
                      }}
                      disabled={deletingId === item.id}
                      className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-[#C40000] text-white flex items-center justify-center hover:bg-[#a00000] transition-colors disabled:opacity-50 shadow-lg z-10"
                      aria-label="Remove gear item"
                    >
                      {deletingId === item.id ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Minus className="w-5 h-5 stroke-[3]" />
                      )}
                    </button>
                  )}
                </div>
              ))
            )}
          </div>

          {hasOverflow && (
            <button
              onClick={handleNext}
              aria-label="Next Product"
              className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow hover:bg-gray-50"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
          )}
        </div>

        {canManage && showAdd && (
          <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 px-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowAdd(false)
            }}
          >
            <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden">
              <div className="px-5 py-4" style={{ backgroundColor: '#FC0105' }}>
                <h3 className="text-white font-semibold" style={{ fontFamily: '"Open Sans", sans-serif' }}>
                  Add Recommended Gear
                </h3>
              </div>
              <div className="p-5 space-y-4">
                <label className="block text-sm font-semibold text-gray-700" style={{ fontFamily: '"Open Sans", sans-serif' }}>
                  Paste a product URL
                </label>
                <input
                  type="url"
                  value={gearUrl}
                  onChange={(e) => setGearUrl(e.target.value)}
                  placeholder="https://example.com/product"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#FC0105]"
                />
                {gearError && (
                  <p className="text-sm text-red-600" style={{ fontFamily: '"Open Sans", sans-serif' }}>
                    {gearError}
                  </p>
                )}
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAdd(false)
                      setGearUrl('')
                      setGearError(null)
                    }}
                    className="px-4 py-2 rounded-full border border-gray-300 text-gray-700 text-sm font-semibold"
                    style={{ fontFamily: '"Open Sans", sans-serif' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleAddGear}
                    disabled={gearSaving || !gearUrl.trim()}
                    className="px-5 py-2 rounded-full text-sm font-semibold text-white disabled:opacity-50"
                    style={{ backgroundColor: '#C40000', fontFamily: '"Open Sans", sans-serif' }}
                  >
                    {gearSaving ? 'Adding…' : 'Add item'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
