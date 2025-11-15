'use client'

import { useState, useRef, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '@/lib/firebase.client'
import toast from 'react-hot-toast'
import { User } from 'lucide-react'

interface Props {
  isOpen: boolean
  onClose: () => void
}

export default function ProfileQuickSetupModal({ isOpen, onClose }: Props) {
  const { user } = useAuth()
  const [bio, setBio] = useState('')
  const [location, setLocation] = useState('')
  const [trainingGoals, setTrainingGoals] = useState('')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string>('')
  const [currentPhotoURL, setCurrentPhotoURL] = useState<string>('')
  const [isSaving, setIsSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const load = async () => {
      if (!user?.uid || !isOpen) return
      try {
        const snap = await getDoc(doc(db, 'users', user.uid))
        if (snap.exists()) {
          const d = snap.data() as any
          setBio(d?.bio || d?.about || '')
          const loc = d?.location || [d?.city, d?.state].filter(Boolean).join(', ') || ''
          setLocation(loc)
          const goals = Array.isArray(d?.trainingGoals) ? d.trainingGoals.join(', ') : (d?.trainingGoals || '')
          setTrainingGoals(goals)
          const photoUrl = d?.profileImageUrl || d?.photoURL || user.photoURL || ''
          setCurrentPhotoURL(photoUrl)
          setPhotoPreview(photoUrl)
        }
      } catch (e) {
        console.error('Failed to load profile:', e)
      }
    }
    load()
  }, [user, isOpen])

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB')
      return
    }

    setPhotoFile(file)

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPhotoPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleSave = async () => {
    if (!user?.uid) return

    // Validation
    if (!bio.trim()) {
      toast.error('Please add a short bio')
      return
    }

    if (!location.trim()) {
      toast.error('Please add your location')
      return
    }

    if (!trainingGoals.trim()) {
      toast.error('Please add your training goals')
      return
    }

    setIsSaving(true)

    try {
      let photoURL = currentPhotoURL

      // Upload photo if a new one was selected
      if (photoFile) {
        const storageRef = ref(storage, `users/${user.uid}/profile-photo.jpg`)
        await uploadBytes(storageRef, photoFile)
        photoURL = await getDownloadURL(storageRef)
      }

      // Update user document
      const updates: any = {
        bio: bio.trim(),
        location: location.trim(),
        trainingGoals: trainingGoals.trim(),
      }

      if (photoURL) {
        updates.profileImageUrl = photoURL
        updates.photoURL = photoURL
      }

      await updateDoc(doc(db, 'users', user.uid), updates)

      toast.success('Profile updated successfully!')

      // Mark profile as complete
      try {
        localStorage.removeItem('athleap_show_quick_profile_setup')
        localStorage.removeItem('athlete_profile_incomplete')
      } catch {}

      onClose()
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Failed to update profile')
    } finally {
      setIsSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50"
      style={{ backgroundColor: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(2px)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSaving) onClose()
      }}
    >
      <div
        className="fixed right-4 bottom-4 sm:right-6 sm:bottom-6 w-[92vw] sm:w-[500px] max-w-[540px] max-h-[85vh] rounded-2xl shadow-2xl overflow-hidden bg-white"
        style={{ animation: 'slideInChat .28s ease-out forwards' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3" style={{ background: '#FC0105' }}>
          <div>
            <h3 className="text-white font-bold" style={{ fontFamily: '"Open Sans", sans-serif' }}>
              Complete Your Profile
            </h3>
            <p className="text-white/90 text-xs">Add a photo, bio, and goals</p>
          </div>
          <button
            onClick={onClose}
            disabled={isSaving}
            className="text-white/90 hover:text-white px-2 py-1 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4 overflow-y-auto" style={{ maxHeight: 'calc(85vh - 60px)' }}>
          {/* Profile Photo */}
          <div>
            <label className="block text-sm font-bold mb-2" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif' }}>
              Profile Photo
            </label>
            <div className="flex items-center gap-4">
              <div
                className="w-24 h-24 rounded-lg overflow-hidden border-2 border-black flex items-center justify-center"
                style={{ backgroundColor: photoPreview ? 'transparent' : '#8B7D7B' }}
              >
                {photoPreview ? (
                  <img src={photoPreview} alt="Profile preview" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-12 h-12 text-white" />
                )}
              </div>
              <div className="flex-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoSelect}
                  className="hidden"
                  id="profile-photo-upload"
                  disabled={isSaving}
                />
                <label
                  htmlFor="profile-photo-upload"
                  className={`inline-flex items-center px-4 py-2 bg-black text-white font-bold rounded-lg hover:bg-gray-800 transition-colors ${isSaving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  style={{ fontFamily: '"Open Sans", sans-serif' }}
                >
                  {photoPreview ? 'Change Photo' : 'Upload Photo'}
                </label>
                <p className="mt-1 text-xs" style={{ color: '#666', fontFamily: '"Open Sans", sans-serif' }}>
                  JPG, PNG or GIF • Max 5MB
                </p>
              </div>
            </div>
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-bold mb-2" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif' }}>
              Short Bio <span style={{ color: '#FC0105' }}>*</span>
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us a bit about yourself..."
              className="w-full px-3 py-2 border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              style={{ fontFamily: '"Open Sans", sans-serif' }}
              rows={3}
              maxLength={200}
              disabled={isSaving}
            />
            <p className="text-xs mt-1 text-right" style={{ color: '#666', fontFamily: '"Open Sans", sans-serif' }}>
              {bio.length}/200
            </p>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-bold mb-2" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif' }}>
              Location <span style={{ color: '#FC0105' }}>*</span>
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="City, State or Country"
              className="w-full px-3 py-2 border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              style={{ fontFamily: '"Open Sans", sans-serif' }}
              maxLength={100}
              disabled={isSaving}
            />
            <p className="text-xs mt-1 text-right" style={{ color: '#666', fontFamily: '"Open Sans", sans-serif' }}>
              {location.length}/100
            </p>
          </div>

          {/* Training Goals */}
          <div>
            <label className="block text-sm font-bold mb-2" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif' }}>
              Training Goals <span style={{ color: '#FC0105' }}>*</span>
            </label>
            <textarea
              value={trainingGoals}
              onChange={(e) => setTrainingGoals(e.target.value)}
              placeholder="What do you want to achieve?"
              className="w-full px-3 py-2 border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              style={{ fontFamily: '"Open Sans", sans-serif' }}
              rows={3}
              maxLength={200}
              disabled={isSaving}
            />
            <p className="text-xs mt-1 text-right" style={{ color: '#666', fontFamily: '"Open Sans", sans-serif' }}>
              {trainingGoals.length}/200
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 bg-white text-black border-2 border-black rounded-lg font-bold hover:bg-gray-50 transition-colors disabled:opacity-50"
              style={{ fontFamily: '"Open Sans", sans-serif' }}
            >
              Skip for Now
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving || !bio.trim() || !location.trim() || !trainingGoals.trim()}
              className="px-4 py-2 bg-black text-white rounded-lg font-bold hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ fontFamily: '"Open Sans", sans-serif' }}
            >
              {isSaving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes slideInChat {
          from { transform: translateY(12px) scale(0.98); opacity: 0; }
          to { transform: translateY(0) scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
