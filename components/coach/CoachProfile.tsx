'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { db, storage } from '@/lib/firebase.client'
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { Edit2, MapPin, Award, Camera, Instagram, Youtube, Linkedin, Facebook } from 'lucide-react'

// Expand sport abbreviations to full names
const expandSportName = (sport: string): string => {
  const expansions: Record<string, string> = {
    'BJJ': 'Brazilian Jiu-Jitsu',
    'MMA': 'Mixed Martial Arts',
    'JKD': 'Jeet Kune Do'
  }
  return expansions[sport] || sport
}

export default function CoachProfile() {
  const { user } = useAuth()
  const [sports, setSports] = useState<string[]>([])
  const [bio, setBio] = useState<string>('')
  const [primarySport, setPrimarySport] = useState<string>('')
  const [photoUrl, setPhotoUrl] = useState<string>('')
  const [bannerUrl, setBannerUrl] = useState<string>('')
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [isHoveringBadge, setIsHoveringBadge] = useState(false)

  // Display state
  const [location, setLocation] = useState<string>('')
  const [achievements, setAchievements] = useState<string>('')
  const [instagram, setInstagram] = useState<string>('')
  const [youtube, setYoutube] = useState<string>('')
  const [linkedin, setLinkedin] = useState<string>('')
  const [facebook, setFacebook] = useState<string>('')

  // Edit form state
  const [editBio, setEditBio] = useState('')
  const [editLocation, setEditLocation] = useState('')
  const [editAchievements, setEditAchievements] = useState('')
  const [editInstagram, setEditInstagram] = useState('')
  const [editYoutube, setEditYoutube] = useState('')
  const [editLinkedin, setEditLinkedin] = useState('')
  const [editFacebook, setEditFacebook] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [isBioExpanded, setIsBioExpanded] = useState(false)
  const [isAchievementsExpanded, setIsAchievementsExpanded] = useState(false)

  useEffect(() => {
    const load = async () => {
      if (!user?.uid) return
      try {
        const snap = await getDoc(doc(db, 'users', user.uid))
        if (snap.exists()) {
          const data = snap.data() as any
          const list: string[] = []
          if (Array.isArray(data?.sports)) list.push(...data.sports)
          if (typeof data?.sport === 'string') list.push(data.sport)
          if (Array.isArray(data?.specialties)) list.push(...data.specialties)
          const unique = Array.from(new Set(list.map(s => String(s).trim()))).filter(Boolean)
          const expanded = unique.map(expandSportName)
          setSports(expanded)

          // Ensure we always have a primary sport - fallback chain:
          // 1. data.sport (primary sport field)
          // 2. data.primarySport (alternate field)
          // 3. data.inviteSport (sport from invite)
          // 4. expanded[0] (first from sports array)
          // 5. "Sport" (ultimate fallback)
          const sportValue =
            (data?.sport as string) ||
            (data?.primarySport as string) ||
            (data?.inviteSport as string) ||
            expanded[0] ||
            'Sport'
          setPrimarySport(expandSportName(sportValue))
          const bioText = (data?.bio as string) || (data?.about as string) || ''
          const locationText = (data?.location as string) || ''
          const achievementsText = (data?.achievements as string) || ''
          const instagramText = (data?.instagram as string) || ''
          const youtubeText = (data?.youtube as string) || ''
          const linkedinText = (data?.linkedin as string) || ''
          const facebookText = (data?.facebook as string) || ''

          // Set display state
          setBio(bioText)
          setLocation(locationText)
          setAchievements(achievementsText)
          setInstagram(instagramText)
          setYoutube(youtubeText)
          setLinkedin(linkedinText)
          setFacebook(facebookText)

          // Load edit form data
          setEditBio(bioText)
          setEditLocation(locationText)
          setEditAchievements(achievementsText)
          setEditInstagram(instagramText)
          setEditYoutube(youtubeText)
          setEditLinkedin(linkedinText)
          setEditFacebook(facebookText)

          // Prefer explicit profile image fields, then auth photoURL
          const raw =
            (data?.profileImageUrl as string) ||
            (data?.headshotUrl as string) ||
            (data?.photoURL as string) ||
            user.photoURL ||
            ''

          // Resolve storage paths like 'users/uid/photo.jpg' or 'gs://'
          let resolvedPhotoUrl = ''
          const isHttp = /^https?:\/\//i.test(raw)
          if (!raw) {
            resolvedPhotoUrl = ''
            setPhotoUrl('')
          } else if (isHttp) {
            resolvedPhotoUrl = raw
            setPhotoUrl(raw)
          } else {
            try {
              const url = await getDownloadURL(ref(storage, raw))
              resolvedPhotoUrl = url
              setPhotoUrl(url)
            } catch {
              resolvedPhotoUrl = ''
              setPhotoUrl('')
            }
          }

          // Banner: prefer bannerUrl/cover/hero
          const rawBanner =
            (data?.bannerUrl as string) ||
            (data?.coverUrl as string) ||
            (data?.heroImageUrl as string) ||
            ''
          const bannerHttp = /^https?:\/\//i.test(rawBanner || '')
          if (!rawBanner) {
            // Fallback to profile image as banner if none provided
            if (resolvedPhotoUrl) {
              setBannerUrl(resolvedPhotoUrl)
            } else {
              setBannerUrl('')
            }
          } else if (bannerHttp) {
            setBannerUrl(rawBanner)
          } else {
            try {
              const url = await getDownloadURL(ref(storage, rawBanner))
              setBannerUrl(url)
            } catch {
              if (resolvedPhotoUrl) setBannerUrl(resolvedPhotoUrl)
              else setBannerUrl('')
            }
          }
        }
      } catch (e) {
        console.warn('Failed to load coach profile:', e)
      }
    }
    load()
  }, [user])

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    setUploadingPhoto(true)
    try {
      const storageRef = ref(storage, `users/${user.uid}/profile-photo.jpg`)
      await uploadBytes(storageRef, file)
      const url = await getDownloadURL(storageRef)

      await updateDoc(doc(db, 'users', user.uid), {
        profileImageUrl: url,
        photoURL: url
      })

      setPhotoUrl(url)
      alert('Profile photo updated!')
    } catch (error) {
      console.error('Error uploading photo:', error)
      alert('Failed to upload photo. Please try again.')
    } finally {
      setUploadingPhoto(false)
    }
  }

  const handleSaveProfile = async () => {
    if (!user) return

    setIsSaving(true)
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        bio: editBio,
        location: editLocation,
        achievements: editAchievements,
        instagram: editInstagram,
        youtube: editYoutube,
        linkedin: editLinkedin,
        facebook: editFacebook
      })

      // Update display state
      setBio(editBio)
      setLocation(editLocation)
      setAchievements(editAchievements)
      setInstagram(editInstagram)
      setYoutube(editYoutube)
      setLinkedin(editLinkedin)
      setFacebook(editFacebook)

      setIsEditingProfile(false)
      alert('Profile updated successfully!')
    } catch (error) {
      console.error('Error saving profile:', error)
      alert('Failed to save profile. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Banner with overlay profile */}
      <div className="relative">
        <div className="h-36 sm:h-44 md:h-56 rounded-xl overflow-hidden bg-gray-100">
          {bannerUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={bannerUrl} alt="Coach banner" className="w-full h-full object-cover" />
          ) : (
            <div className="relative w-full h-full bg-white">
              {/* Thin, light gray guide line when no banner is set */}
              <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-px bg-gray-300" />
            </div>
          )}
        </div>
        {/* Profile photo fixed near top-right; matches card grid sizing */}
        <div className="absolute top-6 right-6 w-[calc(50%-0.75rem)] sm:w-[calc(33.333%-0.667rem)] lg:w-[calc(25%-0.75rem)]">
          <div className="w-full rounded-lg overflow-hidden ring-4 ring-white shadow-xl bg-gray-100" style={{ aspectRatio: '1/1' }}>
            {photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photoUrl} alt={user?.displayName || 'Coach'} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: '#8B7D7B' }}>
                <img src="/brand/athleap-logo-colored.png" alt="AthLeap" className="w-1/2 opacity-90" />
              </div>
            )}
          </div>

          {/* Social Media Icons - Below Profile Photo */}
          {(instagram || youtube || linkedin || facebook) && (
            <div className="mt-4">
              <h4 className="text-xs font-bold mb-2 text-center" style={{ color: '#000000', fontFamily: '\"Open Sans\", sans-serif' }}>
                Connect
              </h4>
              <div className="flex justify-center gap-2">
                {instagram && (
                  <a
                    href={`https://instagram.com/${instagram.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-lg flex items-center justify-center transition-all hover:scale-110"
                    style={{ backgroundColor: '#E4405F' }}
                    title="Instagram"
                  >
                    <Instagram className="w-4 h-4 text-white" />
                  </a>
                )}
                {youtube && (
                  <a
                    href={youtube.startsWith('http') ? youtube : `https://youtube.com/${youtube}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-lg flex items-center justify-center transition-all hover:scale-110"
                    style={{ backgroundColor: '#FF0000' }}
                    title="YouTube"
                  >
                    <Youtube className="w-4 h-4 text-white" />
                  </a>
                )}
                {linkedin && (
                  <a
                    href={linkedin.startsWith('http') ? linkedin : `https://linkedin.com/in/${linkedin}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-lg flex items-center justify-center transition-all hover:scale-110"
                    style={{ backgroundColor: '#0A66C2' }}
                    title="LinkedIn"
                  >
                    <Linkedin className="w-4 h-4 text-white" />
                  </a>
                )}
                {facebook && (
                  <a
                    href={facebook.startsWith('http') ? facebook : `https://facebook.com/${facebook}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-lg flex items-center justify-center transition-all hover:scale-110"
                    style={{ backgroundColor: '#1877F2' }}
                    title="Facebook"
                  >
                    <Facebook className="w-4 h-4 text-white" />
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Text content below banner (profile photo remains in banner corner) */}
      <div className="pt-6 sm:pt-8 space-y-4">
        {/* Name and Location Row */}
        <div>
          <h2
            className="text-2xl sm:text-3xl font-bold mb-1"
            style={{ color: '#000000', fontFamily: '\"Open Sans\", sans-serif', fontWeight: 700 }}
          >
            {user?.displayName || 'Coach'}
          </h2>
          {location && (
            <div className="flex items-center gap-1.5 text-sm" style={{ color: '#666', fontFamily: '\"Open Sans\", sans-serif' }}>
              <MapPin className="w-4 h-4" />
              <span>{location}</span>
            </div>
          )}
        </div>

        {/* Specialties and Actions */}
        <div>
          <span className="text-sm font-bold block mb-2" style={{ color: '#000000', fontFamily: '\"Open Sans\", sans-serif' }}>
            Specialties:
          </span>
          <button
            onClick={() => setIsEditingProfile(!isEditingProfile)}
            onMouseEnter={() => setIsHoveringBadge(true)}
            onMouseLeave={() => setIsHoveringBadge(false)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-bold transition-all"
            style={{
              fontFamily: '\"Open Sans\", sans-serif',
              fontWeight: 700,
              backgroundColor: isHoveringBadge ? '#FC0105' : '#000'
            }}
          >
            {isHoveringBadge ? (
              <>
                <Edit2 className="w-4 h-4" />
                Edit Profile
              </>
            ) : (
              primarySport
            )}
          </button>
        </div>

        {/* Content Section */}
        <div className="max-w-4xl space-y-4">
          {/* Bio */}
          {bio && (
            <div>
              <h4 className="text-sm font-bold mb-2" style={{ color: '#000000', fontFamily: '\"Open Sans\", sans-serif' }}>
                About
              </h4>
              <div>
                <p className="text-sm leading-relaxed" style={{ color: '#000000', fontFamily: '\"Open Sans\", sans-serif' }}>
                  {bio.length > 150 && !isBioExpanded
                    ? `${bio.slice(0, 150)}...`
                    : bio}
                </p>
                {bio.length > 150 && (
                  <button
                    onClick={() => setIsBioExpanded(!isBioExpanded)}
                    className="text-sm font-semibold mt-1 hover:underline"
                    style={{ color: '#FC0105', fontFamily: '\"Open Sans\", sans-serif' }}
                  >
                    {isBioExpanded ? 'Read less' : 'Read more'}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Achievements */}
          {achievements && (
            <div>
              <h4 className="text-sm font-bold mb-2 flex items-center gap-1.5" style={{ color: '#000000', fontFamily: '\"Open Sans\", sans-serif' }}>
                <Award className="w-4 h-4" />
                Achievements
              </h4>
              <div>
                <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: '#000000', fontFamily: '\"Open Sans\", sans-serif' }}>
                  {achievements.length > 150 && !isAchievementsExpanded
                    ? `${achievements.slice(0, 150)}...`
                    : achievements}
                </p>
                {achievements.length > 150 && (
                  <button
                    onClick={() => setIsAchievementsExpanded(!isAchievementsExpanded)}
                    className="text-sm font-semibold mt-1 hover:underline"
                    style={{ color: '#FC0105', fontFamily: '\"Open Sans\", sans-serif' }}
                  >
                    {isAchievementsExpanded ? 'Read less' : 'Read more'}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Inline Profile Editor */}
        {isEditingProfile && (
          <div className="mt-4 p-6 rounded-xl border-2 bg-white space-y-4" style={{ borderColor: '#000' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold" style={{ color: '#000000', fontFamily: '\"Open Sans\", sans-serif' }}>
                Edit Profile
              </h3>
              <button
                onClick={() => setIsEditingProfile(false)}
                className="text-gray-500 hover:text-black text-xl font-bold"
              >
                ✕
              </button>
            </div>

            {/* Photo Upload */}
            <div>
              <label className="block text-sm font-bold mb-2 flex items-center gap-2" style={{ color: '#000000', fontFamily: '\"Open Sans\", sans-serif' }}>
                <Camera className="w-4 h-4" />
                Profile Photo
              </label>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100">
                  {photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={photoUrl} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: '#8B7D7B' }}>
                      <Camera className="w-8 h-8 text-white" />
                    </div>
                  )}
                </div>
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                    disabled={uploadingPhoto}
                  />
                  <span className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-bold"
                    style={{ fontFamily: '\"Open Sans\", sans-serif', cursor: uploadingPhoto ? 'not-allowed' : 'pointer', opacity: uploadingPhoto ? 0.7 : 1 }}>
                    {uploadingPhoto ? 'Uploading...' : 'Upload Photo'}
                  </span>
                </label>
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-bold mb-2 flex items-center gap-2" style={{ color: '#000000', fontFamily: '\"Open Sans\", sans-serif' }}>
                <MapPin className="w-4 h-4" />
                Location
              </label>
              <input
                type="text"
                value={editLocation}
                onChange={(e) => setEditLocation(e.target.value)}
                placeholder="City, State"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm"
                style={{ fontFamily: '\"Open Sans\", sans-serif' }}
              />
            </div>

            {/* Bio */}
            <div>
              <label className="block text-sm font-bold mb-2" style={{ color: '#000000', fontFamily: '\"Open Sans\", sans-serif' }}>
                Bio
              </label>
              <textarea
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                placeholder="Tell athletes about your coaching philosophy and experience..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black resize-none text-sm"
                style={{ fontFamily: '\"Open Sans\", sans-serif' }}
              />
            </div>

            {/* Achievements */}
            <div>
              <label className="block text-sm font-bold mb-2 flex items-center gap-2" style={{ color: '#000000', fontFamily: '\"Open Sans\", sans-serif' }}>
                <Award className="w-4 h-4" />
                Achievements
              </label>
              <textarea
                value={editAchievements}
                onChange={(e) => setEditAchievements(e.target.value)}
                placeholder="List your notable achievements, certifications, and awards..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black resize-none text-sm"
                style={{ fontFamily: '\"Open Sans\", sans-serif' }}
              />
            </div>

            {/* Social Media */}
            <div>
              <label className="block text-sm font-bold mb-2" style={{ color: '#000000', fontFamily: '\"Open Sans\", sans-serif' }}>
                Social Media
              </label>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Instagram className="w-4 h-4" />
                  <input
                    type="text"
                    value={editInstagram}
                    onChange={(e) => setEditInstagram(e.target.value)}
                    placeholder="Instagram username"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm"
                    style={{ fontFamily: '\"Open Sans\", sans-serif' }}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Youtube className="w-4 h-4" />
                  <input
                    type="text"
                    value={editYoutube}
                    onChange={(e) => setEditYoutube(e.target.value)}
                    placeholder="YouTube channel URL"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm"
                    style={{ fontFamily: '\"Open Sans\", sans-serif' }}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Linkedin className="w-4 h-4" />
                  <input
                    type="text"
                    value={editLinkedin}
                    onChange={(e) => setEditLinkedin(e.target.value)}
                    placeholder="LinkedIn profile URL"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm"
                    style={{ fontFamily: '\"Open Sans\", sans-serif' }}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Facebook className="w-4 h-4" />
                  <input
                    type="text"
                    value={editFacebook}
                    onChange={(e) => setEditFacebook(e.target.value)}
                    placeholder="Facebook page URL"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm"
                    style={{ fontFamily: '\"Open Sans\", sans-serif' }}
                  />
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex gap-2 pt-4">
              <button
                onClick={() => setIsEditingProfile(false)}
                className="px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-100 transition-colors"
                style={{ color: '#000', fontFamily: '\"Open Sans\", sans-serif' }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProfile}
                disabled={isSaving}
                className="flex-1 px-6 py-2 rounded-lg text-white text-sm font-bold transition-colors"
                style={{
                  backgroundColor: isSaving ? '#666' : '#000',
                  fontFamily: '\"Open Sans\", sans-serif',
                  cursor: isSaving ? 'not-allowed' : 'pointer',
                  opacity: isSaving ? 0.7 : 1
                }}
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        )}

        {/* Coach Locker Room button */}
        <div>
          <a
            href="/dashboard/coach/locker-room"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-4 py-2.5 rounded-lg text-white text-sm font-bold transition-colors"
            style={{
              fontFamily: '\"Open Sans\", sans-serif',
              fontWeight: 700,
              backgroundColor: '#000',
              minWidth: '180px',
              textAlign: 'center'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#FC0105'
              e.currentTarget.querySelector('span')!.textContent = 'Enter'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#000'
              e.currentTarget.querySelector('span')!.textContent = 'Coach Locker Room'
            }}
          >
            <span>Coach Locker Room</span>
          </a>
        </div>
      </div>
    </div>
  )
}


