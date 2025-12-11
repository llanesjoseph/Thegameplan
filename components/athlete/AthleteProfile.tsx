'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '@/lib/firebase.client'
import { Edit2, Save, X, User } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AthleteProfile() {
  const { user } = useAuth()
  const [profileData, setProfileData] = useState({
    displayName: '',
    location: '',
    bio: '',
    trainingGoals: '',
    profileImageUrl: ''
  })
  const [loading, setLoading] = useState(true)
  const [sports, setSports] = useState<string[]>([])
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editedData, setEditedData] = useState({
    location: '',
    bio: '',
    trainingGoals: ''
  })
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isBioExpanded, setIsBioExpanded] = useState(false)
  const [isGoalsExpanded, setIsGoalsExpanded] = useState(false)

  useEffect(() => {
    const init = async () => {
      if (user?.uid) {
        try {
          const snap = await getDoc(doc(db, 'users', user.uid))
          let data: any = {}
          if (snap.exists()) data = snap.data()

          // Map common profile fields – leave blank if missing
          const mappedDisplayName =
            (data.displayName as string) || user.displayName || ''
          const mappedLocation =
            (data.location as string) ||
            [data.city, data.state].filter(Boolean).join(', ') ||
            ''
          const mappedBio =
            (data.bio as string) ||
            (data.about as string) ||
            ''
          const mappedTrainingGoals =
            (Array.isArray(data.trainingGoals) ? data.trainingGoals.join(', ') : data.trainingGoals) ||
            (Array.isArray(data.goals) ? data.goals.join(', ') : data.goals) ||
            ''
          const mappedImage =
            (data.profileImageUrl as string) ||
            (data.photoURL as string) ||
            user.photoURL ||
            ''

          setProfileData({
            displayName: mappedDisplayName,
            location: mappedLocation,
            bio: mappedBio,
            trainingGoals: mappedTrainingGoals,
            profileImageUrl: mappedImage
          })

          // Sports extraction from several shapes
          const extracted: string[] = []
          if (Array.isArray(data?.sports)) {
            extracted.push(...data.sports.filter((s: any) => typeof s === 'string' && s))
          }
          if (typeof data?.sport === 'string' && data.sport.trim()) {
            extracted.push(data.sport.trim())
          }
          if (Array.isArray(data?.selectedSports)) {
            extracted.push(...data.selectedSports.filter((s: any) => typeof s === 'string' && s))
          }
          if (data?.sports && !Array.isArray(data.sports) && typeof data.sports === 'object') {
            Object.entries(data.sports).forEach(([key, value]) => {
              if (value) extracted.push(key)
            })
          }
          const unique = Array.from(new Set(extracted.map((s) => String(s).trim()))).filter(Boolean)
          setSports(unique)

          // Set a reminder flag if profile is incomplete (checked on next login)
          const incomplete =
            !mappedLocation || !mappedBio || !mappedTrainingGoals || unique.length === 0 || !mappedImage
          try {
            if (incomplete) {
              localStorage.setItem('athlete_profile_incomplete', '1')
            } else {
              localStorage.removeItem('athlete_profile_incomplete')
            }
          } catch {}
        } catch (err) {
          console.error('Error loading athlete profile:', err)
        }
      }
      setLoading(false)
    }

    init()
  }, [user])

  // Allow header "Edit Profile" button to trigger inline edit
  useEffect(() => {
    const handleExternalEdit = () => {
      if (!isEditing) {
        handleEditClick()
        try {
          const el = document.getElementById('athlete-profile-section')
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }
        } catch {
          // ignore scroll errors
        }
      }
    }

    window.addEventListener('athlete-edit-profile', handleExternalEdit as EventListener)
    return () => {
      window.removeEventListener('athlete-edit-profile', handleExternalEdit as EventListener)
    }
  }, [isEditing])

  const handleEditClick = () => {
    setEditedData({
      location: profileData.location,
      bio: profileData.bio,
      trainingGoals: profileData.trainingGoals
    })
    setPhotoPreview(profileData.profileImageUrl)
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditedData({
      location: '',
      bio: '',
      trainingGoals: ''
    })
    setPhotoFile(null)
    setPhotoPreview('')
  }

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB')
      return
    }

    setPhotoFile(file)

    const reader = new FileReader()
    reader.onloadend = () => {
      setPhotoPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleSave = async () => {
    if (!user?.uid) return

    if (!editedData.location.trim()) {
      toast.error('Location is required')
      return
    }

    if (!editedData.bio.trim()) {
      toast.error('Bio is required')
      return
    }

    if (!editedData.trainingGoals.trim()) {
      toast.error('Training goals are required')
      return
    }

    setIsSaving(true)

    try {
      let photoURL = profileData.profileImageUrl

      if (photoFile) {
        const storageRef = ref(storage, `users/${user.uid}/profile-photo.jpg`)
        await uploadBytes(storageRef, photoFile)
        photoURL = await getDownloadURL(storageRef)
      }

      const updates: any = {
        location: editedData.location.trim(),
        bio: editedData.bio.trim(),
        trainingGoals: editedData.trainingGoals.trim(),
      }

      if (photoURL) {
        updates.profileImageUrl = photoURL
        updates.photoURL = photoURL
      }

      await updateDoc(doc(db, 'users', user.uid), updates)

      setProfileData(prev => ({
        ...prev,
        location: editedData.location.trim(),
        bio: editedData.bio.trim(),
        trainingGoals: editedData.trainingGoals.trim(),
        profileImageUrl: photoURL
      }))

      toast.success('Profile updated successfully!')
      setIsEditing(false)
      setPhotoFile(null)
      setPhotoPreview('')

      try {
        localStorage.removeItem('athlete_profile_incomplete')
      } catch {}
    } catch (error) {
      console.error('Error saving profile:', error)
      toast.error('Failed to save profile')
    } finally {
      setIsSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-20 bg-gray-200 rounded mb-4"></div>
        </div>
      </div>
    )
  }

  return (
    <div id="athlete-profile-section">
      {/* Header with Save/Cancel buttons (Edit triggered from header or sport tag) */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif', fontWeight: 700 }}>
          Your Profile
        </h2>
        <div className="flex gap-2">
          {isEditing && (
            <>
              <button
                onClick={handleCancelEdit}
                disabled={isSaving}
                className="flex items-center gap-2 px-4 py-2 border-2 border-black rounded-lg hover:bg-gray-100 transition-colors font-bold text-sm disabled:opacity-50"
                style={{ color: '#000', fontFamily: '"Open Sans", sans-serif', fontWeight: 700 }}
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-bold text-sm disabled:opacity-50"
                style={{ fontFamily: '"Open Sans", sans-serif', fontWeight: 700 }}
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
        {/* LEFT SIDE - Text Content */}
        <div className="flex-1 max-w-2xl space-y-4">
          {/* Name (not editable) */}
          <div>
            <h3 className="text-2xl sm:text-3xl font-bold mb-1" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif', fontWeight: 700 }}>
              {profileData.displayName || user?.displayName || 'Athlete'}
            </h3>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-bold mb-1" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif', fontWeight: 700 }}>
              Location
            </label>
            {isEditing ? (
              <input
                type="text"
                value={editedData.location}
                onChange={(e) => setEditedData(prev => ({ ...prev, location: e.target.value }))}
                placeholder="City, State or Country"
                className="w-full px-3 py-2 border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm"
                style={{ fontFamily: '"Open Sans", sans-serif' }}
                maxLength={100}
              />
            ) : (
              <p className="text-sm" style={{ color: '#666', fontFamily: '"Open Sans", sans-serif' }}>
                {profileData.location || 'Not set'}
              </p>
            )}
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-bold mb-1" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif', fontWeight: 700 }}>
              About Me
            </label>
            {isEditing ? (
              <textarea
                value={editedData.bio}
                onChange={(e) => setEditedData(prev => ({ ...prev, bio: e.target.value }))}
                placeholder="Tell us about yourself..."
                className="w-full px-3 py-2 border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm"
                style={{ fontFamily: '"Open Sans", sans-serif' }}
                rows={3}
              />
            ) : (
              <div>
                <p className="text-sm leading-relaxed" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif' }}>
                  {profileData.bio && profileData.bio.length > 150 && !isBioExpanded
                    ? `${profileData.bio.slice(0, 150)}...`
                    : profileData.bio || 'No bio yet'}
                </p>
                {profileData.bio && profileData.bio.length > 150 && (
                  <button
                    onClick={() => setIsBioExpanded(!isBioExpanded)}
                    className="text-sm font-semibold mt-1 hover:underline"
                    style={{ color: '#FC0105', fontFamily: '"Open Sans", sans-serif' }}
                  >
                    {isBioExpanded ? 'Read less' : 'Read more'}
                  </button>
                )}
              </div>
            )}
            {isEditing && (
              <p className="text-xs mt-1 text-right" style={{ color: '#666', fontFamily: '"Open Sans", sans-serif' }}>
                {editedData.bio.length} characters
              </p>
            )}
          </div>

          {/* Training Goals */}
          <div>
            <label className="block text-sm font-bold mb-1" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif', fontWeight: 700 }}>
              Training Goals
            </label>
            {isEditing ? (
              <textarea
                value={editedData.trainingGoals}
                onChange={(e) => setEditedData(prev => ({ ...prev, trainingGoals: e.target.value }))}
                placeholder="What do you want to achieve?"
                className="w-full px-3 py-2 border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm"
                style={{ fontFamily: '"Open Sans", sans-serif' }}
                rows={3}
              />
            ) : (
              <div>
                <p className="text-sm" style={{ color: '#666', fontFamily: '"Open Sans", sans-serif' }}>
                  {profileData.trainingGoals && profileData.trainingGoals.length > 150 && !isGoalsExpanded
                    ? `${profileData.trainingGoals.slice(0, 150)}...`
                    : profileData.trainingGoals || 'No training goals set'}
                </p>
                {profileData.trainingGoals && profileData.trainingGoals.length > 150 && (
                  <button
                    onClick={() => setIsGoalsExpanded(!isGoalsExpanded)}
                    className="text-sm font-semibold mt-1 hover:underline"
                    style={{ color: '#FC0105', fontFamily: '"Open Sans", sans-serif' }}
                  >
                    {isGoalsExpanded ? 'Read less' : 'Read more'}
                  </button>
                )}
              </div>
            )}
            {isEditing && (
              <p className="text-xs mt-1 text-right" style={{ color: '#666', fontFamily: '"Open Sans", sans-serif' }}>
                {editedData.trainingGoals.length} characters
              </p>
            )}
          </div>
        </div>

        {/* RIGHT SIDE - Square Profile Image and sport tags */}
        <div className="flex-shrink-0 w-[calc(50%-0.75rem)] sm:w-[calc(33.333%-0.667rem)] lg:w-[calc(25%-0.75rem)] flex flex-col gap-3">
          {/* Profile Photo */}
          <div className="w-full rounded-lg overflow-hidden bg-gray-100 relative" style={{ aspectRatio: '1/1' }}>
            {(isEditing ? photoPreview : profileData.profileImageUrl) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={isEditing ? photoPreview : profileData.profileImageUrl}
                alt={profileData.displayName || 'Profile'}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: '#8B7D7B' }}>
                <User className="w-1/3 h-1/3 text-white opacity-90" />
              </div>
            )}
            {isEditing && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoSelect}
                  className="hidden"
                  id="athlete-photo-upload"
                />
                <label
                  htmlFor="athlete-photo-upload"
                  className="px-4 py-2 bg-white text-black font-bold rounded-lg hover:bg-gray-100 transition-colors cursor-pointer text-sm"
                  style={{ fontFamily: '"Open Sans", sans-serif' }}
                >
                  Change Photo
                </label>
              </div>
            )}
          </div>

          {/* Sport Tags - Hover to Edit Profile */}
          <div className="w-full space-y-2">
            {sports.length > 0 ? (
              sports.map((sport) => (
                <button
                  key={sport}
                  onClick={!isEditing ? handleEditClick : undefined}
                  disabled={isEditing}
                  className="w-full group relative overflow-hidden py-2.5 font-bold text-sm text-center transition-all duration-300 disabled:cursor-not-allowed"
                  style={{ fontFamily: '"Open Sans", sans-serif', fontWeight: 700 }}
                >
                  {/* Default State - Black background with sport name */}
                  <span className="absolute inset-0 bg-black transition-opacity duration-300 group-hover:opacity-0"></span>
                  <span className="absolute inset-0 flex items-center justify-center text-white transition-opacity duration-300 group-hover:opacity-0">
                    {sport}
                  </span>

                  {/* Hover State - Red background with "Edit Profile" */}
                  <span className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" style={{ backgroundColor: '#FC0105' }}></span>
                  <span className="absolute inset-0 flex items-center justify-center text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    Edit Profile
                  </span>

                  {/* Invisible text for layout */}
                  <span className="invisible">{sport}</span>
                </button>
              ))
            ) : (
              <button
                onClick={!isEditing ? handleEditClick : undefined}
                disabled={isEditing}
                className="w-full group relative overflow-hidden py-2.5 font-bold text-sm text-center transition-all duration-300 disabled:cursor-not-allowed"
                style={{ fontFamily: '"Open Sans", sans-serif', fontWeight: 700 }}
              >
                {/* Default State - Black background with "Sport" */}
                <span className="absolute inset-0 bg-black transition-opacity duration-300 group-hover:opacity-0"></span>
                <span className="absolute inset-0 flex items-center justify-center text-white transition-opacity duration-300 group-hover:opacity-0">
                  Sport
                </span>

                {/* Hover State - Red background with "Edit Profile" */}
                <span className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" style={{ backgroundColor: '#FC0105' }}></span>
                <span className="absolute inset-0 flex items-center justify-center text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  Edit Profile
                </span>

                {/* Invisible text for layout */}
                <span className="invisible">Sport</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

