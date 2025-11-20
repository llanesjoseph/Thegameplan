'use client'

import { useEffect, useMemo, useRef, useState, type WheelEvent } from 'react'
import Link from 'next/link'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { storage } from '@/lib/firebase.client'

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
    accent: '#FC0105',
    overlay: 'linear-gradient(90deg, rgba(252,1,5,0.12) 0%, rgba(252,1,5,0.06) 100%)',
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

const DEFAULT_GALLERY_IMAGES = [
  'https://static.wixstatic.com/media/8bb438_3ae04589aef4480e89a24d7283c69798~mv2_d_2869_3586_s_4_2.jpg/v1/fill/w_428,h_570,q_90,enc_avif,quality_auto/8bb438_3ae04589aef4480e89a24d7283c69798~mv2_d_2869_3586_s_4_2.jpg',
  'https://static.wixstatic.com/media/8bb438_734b8f436e944886b4185aa6f72b5cad~mv2_d_3000_2000_s_2.jpg/v1/fill/w_428,h_570,q_90,enc_avif,quality_auto/8bb438_734b8f436e944886b4185aa6f72b5cad~mv2_d_3000_2000_s_2.jpg',
  'https://static.wixstatic.com/media/8bb438_b596f0cc1c134605b59843a052cd8f37~mv2_d_3000_2930_s_4_2.jpg/v1/fill/w_428,h_570,q_90,enc_avif,quality_auto/8bb438_b596f0cc1c134605b59843a052cd8f37~mv2_d_3000_2930_s_4_2.jpg',
  'https://static.wixstatic.com/media/8bb438_288176fe374c49949c53917e808c1410~mv2_d_8192_7754_s_4_2.jpg/v1/fill/w_428,h_570,q_90,enc_avif,quality_auto/8bb438_288176fe374c49949c53917e808c1410~mv2_d_8192_7754_s_4_2.jpg',
  'https://static.wixstatic.com/media/8bb438_ec9a72099f9648dfb08d9412804a464a~mv2_d_3000_2000_s_2.jpg/v1/fill/w_428,h_570,q_90,enc_avif,quality_auto/8bb438_ec9a72099f9648dfb08d9412804a464a~mv2_d_3000_2000_s_2.jpg',
  'https://static.wixstatic.com/media/8bb438_cb8e4681180a4bf39d73b69a7d51f086~mv2_d_3000_1688_s_2.jpg/v1/fill/w_428,h_570,q_90,enc_avif,quality_auto/8bb438_cb8e4681180a4bf39d73b69a7d51f086~mv2_d_3000_1688_s_2.jpg',
  'https://static.wixstatic.com/media/8bb438_852a4859469e429895c88eecaac7f466~mv2_d_3000_1995_s_2.jpg/v1/fill/w_428,h_570,q_90,enc_avif,quality_auto/8bb438_852a4859469e429895c88eecaac7f466~mv2_d_3000_1995_s_2.jpg',
  'https://static.wixstatic.com/media/8bb438_1821368fde7d4eb1afed09b1fdb53532~mv2_d_3000_1946_s_2.jpg/v1/fill/w_428,h_570,q_90,enc_avif,quality_auto/8bb438_1821368fde7d4eb1afed09b1fdb53532~mv2_d_3000_1946_s_2.jpg',
  'https://static.wixstatic.com/media/8bb438_5ae585140ab442d49138ef3ccbf8fdb8~mv2_d_3000_3000_s_4_2.jpg/v1/fill/w_428,h_570,q_90,enc_avif,quality_auto/8bb438_5ae585140ab442d49138ef3ccbf8fdb8~mv2_d_3000_3000_s_4_2.jpg',
  'https://static.wixstatic.com/media/8bb438_ac2af14459894a6cbce641b7d8af9dc9~mv2_d_3000_2000_s_2.jpg/v1/fill/w_428,h_570,q_90,enc_avif,quality_auto/8bb438_ac2af14459894a6cbce641b7d8af9dc9~mv2_d_3000_2000_s_2.jpg'
]

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
    socialLinks?: {
      twitter?: string
      instagram?: string
      linkedin?: string
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
}

export default function HeroCoachProfile({
  coach,
  lessons,
  isInIframe = false,
  onBack,
  hideLessons = false,
  initialGearItems
}: HeroCoachProfileProps) {
  const { user: authUser } = useAuth()
  const [gearItems, setGearItems] = useState<GearItem[]>(initialGearItems || [])
  const [gearLoading, setGearLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [displayCoach, setDisplayCoach] = useState(coach)
  const [editableCoach, setEditableCoach] = useState(coach)
  const [uploadingPhotoField, setUploadingPhotoField] = useState<string | null>(null)

  useEffect(() => {
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
    const deduped = Array.from(new Set(photos.filter((url) => typeof url === 'string' && url.trim().length > 0)))
    return deduped.length > 0 ? deduped : DEFAULT_GALLERY_IMAGES
  }, [activeCoach.showcasePhoto1, activeCoach.showcasePhoto2, activeCoach.galleryPhotos])

  const sportLabel = SPORT_LABEL_OVERRIDES[normalizedSport] || activeCoach.sport || 'Coach'
  const location = activeCoach.location?.trim()
  const bio = activeCoach.bio?.trim()

  const socialLinks: SocialLinks = {
    linkedin: activeCoach.linkedin || activeCoach.socialLinks?.linkedin,
    facebook: activeCoach.facebook,
    instagram: activeCoach.instagram || activeCoach.socialLinks?.instagram,
    youtube: activeCoach.youtube,
    twitter: activeCoach.socialLinks?.twitter
  }

  const handleEditField = (field: keyof HeroCoachProfileProps['coach'], value: string) => {
    setEditableCoach((prev) => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSaveEdits = () => {
    setDisplayCoach(editableCoach)
    setIsEditing(false)
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

  const canManageGear = !!authUser && authUser.uid === coach.uid

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
                  <button
                    type="button"
                    className="flex items-center gap-2 rounded-full bg-white border border-gray-200 px-3 py-1 text-xs sm:text-sm"
                    aria-label="Coach account"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={activeCoach.profileImageUrl || 'https://static.wixstatic.com/media/75fa07_5ce2a239003845288e36fdda83cb0851~mv2.webp/v1/fill/w_225,h_225,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/Alana-Beard-Headshot-500x.webp'}
                      alt={`${activeCoach.displayName} avatar`}
                      className="h-6 w-6 rounded-full object-cover"
                    />
                    <span
                      className="text-[11px] uppercase tracking-[0.18em] text-gray-600"
                      style={{ fontFamily: '"Open Sans", sans-serif' }}
                    >
                      Hello
                    </span>
                    <span className="text-sm" style={{ fontFamily: '"Open Sans", sans-serif' }}>
                      {activeCoach.displayName}
                    </span>
                    <span className="text-xs text-gray-400">|</span>
                    <span className="text-xs text-gray-700 underline" style={{ fontFamily: '"Open Sans", sans-serif' }}>
                      Sign out
                    </span>
                  </button>

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
              <div className="w-full max-w-6xl mx-auto px-8 py-3">
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
      />

      {galleryPhotos.length > 0 && <CoachGallery photos={galleryPhotos} />}

      {!hideLessons && lessons?.length > 0 && <TrainingLibrarySection coachName={activeCoach.displayName} lessons={lessons} />}

      {!gearLoading && (gearItems.length > 0 || canManageGear) && (
        <RecommendedGearSection items={gearItems} canManage={canManageGear} onGearAdded={(item) => setGearItems((prev) => [item, ...prev])} />
      )}

      <FooterSocialBar socialLinks={socialLinks} />

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
  theme
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
}) {
  const embossClasses =
    'px-5 py-2 rounded-md text-sm font-semibold uppercase tracking-wide text-white shadow-[0px_6px_16px_rgba(0,0,0,0.4)]'
  const primaryButtonStyles = {
    backgroundColor: '#C40000',
    border: '1px solid rgba(255,255,255,0.25)'
  }
  const secondaryButtonStyles = {
    backgroundColor: 'rgba(255,255,255,0.12)',
    border: '1px solid rgba(255,255,255,0.35)'
  }

  return (
    <section className="relative w-full overflow-hidden" style={{ backgroundColor: '#4B0102' }}>
      <div
        className="absolute inset-0 pointer-events-none opacity-90"
        style={{ background: theme.overlay }}
      />
      {theme.media && (
        <div
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage: `url(${theme.media})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'grayscale(100%)'
          }}
        />
      )}

      <div className="relative max-w-6xl mx-auto px-8 py-16 grid gap-10 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1.1fr)] items-center">
        <div className="space-y-6">
          <div className="space-y-2">
            {isEditing ? (
              <input
                value={editingCoach.displayName || ''}
                onChange={(e) => onFieldChange('displayName', e.target.value)}
                className="w-full bg-white/10 border border-white/30 rounded-md px-4 py-2 text-white text-3xl font-bold"
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
            {isEditing ? (
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
            {isEditing ? (
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
        </div>

        <div className="flex justify-center md:justify-end">
          <div className="flex flex-col items-center gap-4 w-full max-w-md">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={coach.profileImageUrl || '/brand/athleap-logo-colored.png'}
            alt={coach.displayName}
            className="w-[347px] h-[359px] object-cover rounded-lg bg-white"
          />
            <div className="flex flex-wrap items-center justify-center gap-3">
              {!isEditing ? (
                <button
                  type="button"
                  onClick={onEditToggle}
                  className={embossClasses}
                  style={primaryButtonStyles}
                >
                  Edit Profile
                </button>
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
            {isEditing && (
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
          </div>
        </div>
      </div>
    </section>
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
          const target =
            key.startsWith('gallery-')
              ? key === 'gallery-new'
                ? { type: 'gallery', append: true }
                : { type: 'gallery', index: Number(key.replace('gallery-', '')) }
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

function CoachGallery({ photos }: { photos: string[] }) {
  const rowRef = useRef<HTMLDivElement>(null)
  const scrollByAmount = 3 * (214 + 10)
  const hasOverflow = photos.length > 4

  const handlePrev = () => rowRef.current?.scrollBy({ left: -scrollByAmount, behavior: 'smooth' })
  const handleNext = () => rowRef.current?.scrollBy({ left: scrollByAmount, behavior: 'smooth' })

  return (
    <section className="w-full bg-white">
      <div className="max-w-6xl mx-auto px-8 py-8">
        <div className={`flex items-center ${hasOverflow ? 'gap-4' : ''}`}>
          {hasOverflow && (
            <button
              onClick={handlePrev}
              aria-label="Previous"
              className="hidden sm:flex flex-shrink-0 w-10 h-10 rounded-full bg-white shadow items-center justify-center hover:bg-gray-50"
            >
              <ArrowRight className="w-5 h-5 rotate-180" />
            </button>
          )}

          <div className="flex-1">
            <div
              ref={rowRef}
              className={`flex gap-3 py-2 ${hasOverflow ? 'w-full overflow-x-auto overflow-y-hidden scroll-smooth' : 'w-full justify-between'}`}
            >
              {photos.map((src, idx) => (
                <div
                  key={`${src}-${idx}`}
                  className={`${hasOverflow ? 'shrink-0 w-[214px]' : 'flex-1 min-w-[180px] max-w-[240px]'} h-[260px] md:h-[285px] rounded-md overflow-hidden bg-gray-100`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt={`Gallery image ${idx + 1}`} className="w-full h-full object-cover" loading={idx < 4 ? 'eager' : 'lazy'} />
                </div>
              ))}
            </div>
          </div>

          {hasOverflow && (
            <button
              onClick={handleNext}
              aria-label="Next"
              className="hidden sm:flex flex-shrink-0 w-10 h-10 rounded-full bg-white shadow items-center justify-center hover:bg-gray-50"
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

function TrainingLibrarySection({ lessons, coachName }: { lessons: Lesson[]; coachName: string }) {
  const listRef = useRef<HTMLDivElement>(null)
  const MAX_VISIBLE = 4
  const filteredLessons = lessons.filter((lesson) => !!lesson && !!lesson.title?.trim?.())
  const totalLessons = filteredLessons.length
  const hasOverflow = totalLessons > MAX_VISIBLE
  const scrollByAmount = 160

  const handleScroll = (direction: 'up' | 'down') => {
    if (!listRef.current) return
    const delta = direction === 'up' ? -scrollByAmount : scrollByAmount
    listRef.current.scrollBy({ top: delta, behavior: 'smooth' })
  }

  const handleWheel = (event: WheelEvent<HTMLDivElement>) => {
    if (!hasOverflow) {
      return
    }
    event.preventDefault()
    if (typeof window !== 'undefined') {
      window.scrollBy({ top: event.deltaY, behavior: 'auto' })
    }
  }

  return (
    <section className="w-full bg-white">
      <div className="max-w-6xl mx-auto px-8 py-10">
        <div className="flex items-center justify-between mb-2">
          <h2 style={{ fontFamily: '"Open Sans", sans-serif', fontSize: '25px', color: '#000000' }}>
            {coachName}&apos;s Training Library
          </h2>
          {hasOverflow && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleScroll('up')}
                aria-label="Scroll lessons up"
                className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50"
              >
                <ArrowRight className="w-4 h-4 rotate-90" />
              </button>
              <button
                onClick={() => handleScroll('down')}
                aria-label="Scroll lessons down"
                className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50"
              >
                <ArrowRight className="w-4 h-4 -rotate-90" />
              </button>
            </div>
          )}
        </div>
        {hasOverflow && (
          <p className="text-sm text-gray-500 mb-4" style={{ fontFamily: '"Open Sans", sans-serif' }}>
            Showing 4 lessons at a time. Use the controls to browse the full library.
          </p>
        )}

        <div
          ref={listRef}
          className={`border-t border-gray-300 ${hasOverflow ? 'max-h-[520px] overflow-y-auto pr-2 scroll-smooth no-scrollbar' : ''}`}
          onWheel={handleWheel}
          style={hasOverflow ? { scrollbarWidth: 'none', msOverflowStyle: 'none' } : undefined}
        >
          {filteredLessons.map((lesson) => (
            <div key={lesson.id} className="flex items-center gap-6 py-6 border-b border-gray-200 last:border-b-0">
              <div className="w-24 h-24 rounded-full bg-[#5A0202] flex items-center justify-center overflow-hidden flex-shrink-0">
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
            </div>
          ))}
        </div>
      </div>
    </section>
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
  const hasOverflow = items.length > 4

  const canSubmitGear = canManage && !!user

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
              className="group relative flex items-center justify-center h-12 w-12 rounded-2xl border border-white/40 shadow-[inset_0_3px_6px_rgba(255,255,255,0.28),inset_0_-4px_6px_rgba(0,0,0,0.4),0_6px_14px_rgba(0,0,0,0.35)] text-white focus:outline-none focus:ring-2 focus:ring-white/60 transition-all duration-300 ease-out overflow-hidden"
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
              className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow hover:bg-gray-50"
            >
              <ArrowRight className="w-5 h-5 rotate-180" />
            </button>
          )}

          <div
            ref={rowRef}
            className="flex-1 flex gap-5 overflow-x-auto scroll-smooth px-4 py-2 no-scrollbar"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {items.length === 0 && canManage ? (
              <div className="text-white/80" style={{ fontFamily: '"Open Sans", sans-serif' }}>
                No gear added yet. Click “Add item” to paste your first product link.
              </div>
            ) : (
              items.map((item) => (
                <div key={item.id} className="w-[150px] flex-shrink-0">
                  <a href={item.link || '#'} target={item.link ? '_blank' : '_self'} rel="noreferrer">
                    <div className="w-[150px] h-[150px] rounded-lg overflow-hidden bg-[#5A0202] flex items-center justify-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} className="w-[150px] h-[150px] object-cover" />
                      ) : (
                        <img src="/brand/athleap-logo-colored.png" alt="Athleap" className="w-14 h-14 opacity-90" />
                      )}
                    </div>
                    <p className="mt-2" style={{ fontFamily: '"Open Sans", sans-serif', fontSize: '14px', color: '#FFFFFF' }}>
                      {item.name}
                    </p>
                    {item.price && (
                      <p className="text-sm font-semibold" style={{ fontFamily: '"Open Sans", sans-serif', color: '#FF0000' }}>
                        {item.price}
                      </p>
                    )}
                  </a>
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

function FooterSocialBar({ socialLinks }: { socialLinks: SocialLinks }) {
  const normalizeSocialUrl = (network: string, value?: string) => {
    if (!value) return ''
    const trimmed = value.trim()
    if (!trimmed) return ''
    if (/^https?:\/\//i.test(trimmed)) {
      return trimmed
    }

    const handle = trimmed.replace(/^@/, '')

    switch (network) {
      case 'linkedin':
        return `https://www.linkedin.com/in/${handle}`
      case 'facebook':
        return `https://www.facebook.com/${handle}`
      case 'twitter':
        return `https://twitter.com/${handle}`
      case 'instagram':
        return `https://www.instagram.com/${handle}`
      case 'youtube':
        return `https://www.youtube.com/${handle}`
      default:
        return trimmed
    }
  }

  const icons = [
    {
      key: 'linkedin',
      url: normalizeSocialUrl('linkedin', socialLinks.linkedin),
      icon: 'https://static.wixstatic.com/media/6ea5b4a88f0b4f91945b40499aa0af00.png/v1/fill/w_24,h_24,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/6ea5b4a88f0b4f91945b40499aa0af00.png',
      label: 'LinkedIn'
    },
    {
      key: 'facebook',
      url: normalizeSocialUrl('facebook', socialLinks.facebook),
      icon: 'https://static.wixstatic.com/media/0fdef751204647a3bbd7eaa2827ed4f9.png/v1/fill/w_24,h_24,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/0fdef751204647a3bbd7eaa2827ed4f9.png',
      label: 'Facebook'
    },
    {
      key: 'twitter',
      url: normalizeSocialUrl('twitter', socialLinks.twitter),
      icon: 'https://static.wixstatic.com/media/c7d035ba85f6486680c2facedecdcf4d.png/v1/fill/w_24,h_24,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/c7d035ba85f6486680c2facedecdcf4d.png',
      label: 'Twitter'
    },
    {
      key: 'instagram',
      url: normalizeSocialUrl('instagram', socialLinks.instagram),
      icon: 'https://static.wixstatic.com/media/01c3aff52f2a4dffa526d7a9843d46ea.png/v1/fill/w_24,h_24,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/01c3aff52f2a4dffa526d7a9843d46ea.png',
      label: 'Instagram'
    },
    {
      key: 'youtube',
      url: normalizeSocialUrl('youtube', socialLinks.youtube),
      icon: 'https://static.wixstatic.com/media/52a3a9_1b857a6e8f4746379382bbdf0cb70b43~mv2.png/v1/fill/w_24,h_24,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/52a3a9_1b857a6e8f4746379382bbdf0cb70b43~mv2.png',
      label: 'YouTube'
    }
  ]

  const visibleIcons = icons.filter((icon) => !!icon.url)
  if (visibleIcons.length === 0) {
    return null
  }

  return (
    <footer className="w-full bg-white border-t border-gray-200">
      <div className="max-w-6xl mx-auto px-8 py-6 flex items-center justify-end">
        <ul className="flex items-center gap-4" aria-label="Social Bar">
          {visibleIcons.map((icon) => (
            <li key={icon.key}>
              <a href={icon.url as string} target="_blank" rel="noreferrer" aria-label={icon.label} className="block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={icon.icon} alt={icon.label} className="w-6 h-6 object-cover" />
              </a>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  )
}


