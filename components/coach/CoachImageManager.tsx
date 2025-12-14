'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { Camera, Upload, X, Plus, Trash2, Save, AlertCircle, CheckCircle, Play, Image as ImageIcon } from 'lucide-react'
import ImageUploader from '@/components/ImageUploader'
import { useAuth } from '@/hooks/use-auth'
import { db } from '@/lib/firebase.client'
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore'

interface CoachProfile {
  uid: string
  email: string
  displayName: string
  firstName: string
  lastName: string
  sport: string
  tagline: string
  credentials: string
  bio: string
  headshotUrl?: string
  heroImageUrl?: string
  actionPhotos: string[]
  highlightVideo?: string
  specialties: string[]
  achievements: string[]
  sampleQuestions: string[]
  profileCompleteness: number
  isActive: boolean
  createdAt: any
  updatedAt: any
}

interface CoachImageManagerProps {
  onProfileUpdate?: (profile: CoachProfile) => void
  className?: string
}

export default function CoachImageManager({ onProfileUpdate, className = '' }: CoachImageManagerProps) {
  const { user } = useAuth()
  const [profile, setProfile] = useState<CoachProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [uploading, setUploading] = useState<string | null>(null)

  // Local state for image URLs
  const [headshotUrl, setHeadshotUrl] = useState('')
  const [heroImageUrl, setHeroImageUrl] = useState('')
  const [actionPhotos, setActionPhotos] = useState<string[]>([])
  const [highlightVideo, setHighlightVideo] = useState('')

  useEffect(() => {
    if (user) {
      loadCoachProfile()
    }
  }, [user])

  const loadCoachProfile = async () => {
    if (!user?.uid) return

    try {
      setLoading(true)

      // FIX: Load from BOTH collections and merge data to ensure we see all images
      const coachProfileDoc = await getDoc(doc(db, 'coach_profiles', user.uid))
      const creatorProfileDoc = await getDoc(doc(db, 'creator_profiles', user.uid))

      const coachData = coachProfileDoc.exists() ? coachProfileDoc.data() : {}
      const creatorData = creatorProfileDoc.exists() ? creatorProfileDoc.data() : {}

      // Merge data: creator_profiles as base, coach_profiles overrides non-array fields
      let profileData: any = null
      if (Object.keys(coachData).length > 0 || Object.keys(creatorData).length > 0) {
        profileData = { 
          uid: user.uid, 
          ...creatorData, 
          ...coachData,
        }
        
        // Special handling for actionPhotos - merge from both collections
        const allActionPhotos = [
          ...(creatorData.actionPhotos || []),
          ...(coachData.actionPhotos || [])
        ]
        // STRICT: Remove duplicates, empty values, and placeholder images
        profileData.actionPhotos = [...new Set(allActionPhotos)]
          .filter(Boolean)
          .filter((url: string) => typeof url === 'string' && url.trim().length > 0 && !url.includes('placeholder'))
        
        // Also check for alternative image field names that might have been used during ingestion
        const alternativePhotos = [
          ...(creatorData.galleryPhotos || []),
          ...(coachData.galleryPhotos || []),
          ...(creatorData.mediaGallery || []),
          ...(coachData.mediaGallery || []),
        ]
          .filter(Boolean)
          .filter((url: string) => typeof url === 'string' && url.trim().length > 0 && !url.includes('placeholder'))
        
        // Merge alternative photos into actionPhotos (only real coach-uploaded photos)
        if (alternativePhotos.length > 0) {
          profileData.actionPhotos = [...new Set([...profileData.actionPhotos, ...alternativePhotos])]
            .filter((url: string) => typeof url === 'string' && url.trim().length > 0 && !url.includes('placeholder'))
        }
        
        console.log('Loaded merged profile with actionPhotos:', profileData.actionPhotos)
      }

      if (profileData) {
        setProfile(profileData as CoachProfile)
        // STRICT: Only set image URLs if they exist and are not placeholders
        const headshot = profileData.headshotUrl || profileData.photoURL || ''
        setHeadshotUrl(headshot && !headshot.includes('placeholder') ? headshot : '')
        const hero = profileData.heroImageUrl || ''
        setHeroImageUrl(hero && !hero.includes('placeholder') ? hero : '')
        setActionPhotos(profileData.actionPhotos || [])
        const video = profileData.highlightVideo || ''
        setHighlightVideo(video && !video.includes('placeholder') ? video : '')
      } else {
        // Create default profile if none exists
        const defaultProfile = {
          uid: user.uid,
          email: user.email || '',
          displayName: user.displayName || '',
          firstName: '',
          lastName: '',
          sport: '',
          tagline: '',
          credentials: '',
          bio: '',
          actionPhotos: [],
          specialties: [],
          achievements: [],
          sampleQuestions: [],
          profileCompleteness: 0,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
        setProfile(defaultProfile as CoachProfile)
      }
    } catch (error) {
      console.error('Error loading coach profile:', error)
      setError(error instanceof Error ? error.message : 'Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const saveProfileImages = async () => {
    if (!user?.uid) return

    try {
      setSaving(true)
      setError(null)

      // CRITICAL: Use API endpoint to ensure sync to Browse Coaches
      const token = await user.getIdToken()
      const response = await fetch('/api/coach-profile/update-images', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          headshotUrl: headshotUrl || undefined,
          heroImageUrl: heroImageUrl || undefined,
          actionPhotos: actionPhotos.length > 0 ? actionPhotos : undefined,
          highlightVideo: highlightVideo || undefined
        })
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to update profile images')
      }

      setSuccess('✅ Profile images updated successfully! Your changes will appear in Browse Coaches immediately.')

      // Reload profile to get updated data
      await loadCoachProfile()

      // Notify parent component
      if (onProfileUpdate && profile) {
        onProfileUpdate({
          ...profile,
          headshotUrl,
          heroImageUrl,
          actionPhotos,
          highlightVideo,
          profileCompleteness: calculateCompleteness()
        })
      }

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000)
    } catch (error) {
      console.error('Error updating profile images:', error)
      setError(error instanceof Error ? error.message : 'Failed to update profile images')
    } finally {
      setSaving(false)
    }
  }

  const calculateCompleteness = () => {
    let completeness = profile?.profileCompleteness || 0
    if (headshotUrl) completeness += 5
    if (heroImageUrl) completeness += 5
    if (actionPhotos.length > 0) completeness += 5
    if (highlightVideo) completeness += 5
    return Math.min(completeness, 100)
  }

  const handleImageUpload = (type: 'headshot' | 'hero' | 'action' | 'video', url: string) => {
    switch (type) {
      case 'headshot':
        setHeadshotUrl(url)
        break
      case 'hero':
        setHeroImageUrl(url)
        break
      case 'action':
        setActionPhotos(prev => [...prev, url])
        break
      case 'video':
        setHighlightVideo(url)
        break
    }
    setUploading(null)
  }

  const handleImageUploadError = (error: string) => {
    setError(`Upload failed: ${error}`)
    setUploading(null)
  }

  const removeActionPhoto = (index: number) => {
    setActionPhotos(prev => prev.filter((_, i) => i !== index))
  }

  const clearError = () => setError(null)

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading profile...</span>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className={`text-center p-8 ${className}`}>
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg text-gray-900 mb-2">Coach Profile Not Found</h3>
        <p className="text-gray-600">Only approved coaches can manage profile images.</p>
      </div>
    )
  }

  const hasChanges = headshotUrl !== (profile.headshotUrl || '') ||
                   heroImageUrl !== (profile.heroImageUrl || '') ||
                   JSON.stringify(actionPhotos) !== JSON.stringify(profile.actionPhotos || []) ||
                   highlightVideo !== (profile.highlightVideo || '')

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl text-gray-900">Manage Profile Images</h2>
          <p className="text-gray-600 mt-1">
            Customize your coaching profile with professional photos and videos
          </p>
        </div>

        {hasChanges && (
          <button
            onClick={saveProfileImages}
            disabled={saving}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {saving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        )}
      </div>

      {/* Profile Completeness */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-blue-800">Profile Completeness</span>
          <span className="text-sm text-blue-800">{profile.profileCompleteness}%</span>
        </div>
        <div className="w-full bg-blue-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${profile.profileCompleteness}%` }}
          />
        </div>
        <p className="text-xs text-blue-700 mt-2">
          Adding photos and videos increases your profile visibility and credibility
        </p>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-red-800 font-medium">Error</p>
            <p className="text-red-700 text-sm mt-1">{error}</p>
          </div>
          <button onClick={clearError} className="text-red-500 hover:text-red-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-500" />
          <p className="text-green-800 font-medium">{success}</p>
        </div>
      )}

      {/* Headshot Section */}
      <div className="space-y-4">
        <h3 className="text-lg text-gray-900">Profile Headshot</h3>
        <div className="flex items-start gap-6">
          <div className="relative">
            <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100 border-4 border-white shadow-lg">
              {headshotUrl ? (
                <Image
                  src={headshotUrl}
                  alt="Profile headshot"
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <Camera className="w-8 h-8" />
                </div>
              )}
            </div>
            <ImageUploader
              uploadPath={`coaches/${user?.uid}/headshot/headshot_${Date.now()}`}
              onUploadComplete={(url) => handleImageUpload('headshot', url)}
              onUploadError={handleImageUploadError}
              className="absolute -bottom-2 -right-2"
            />
          </div>
          <div className="flex-1">
            <h4 className="font-medium text-gray-900 mb-2">Professional Headshot</h4>
            <p className="text-sm text-gray-600 mb-3">
              Upload a clear, professional photo of yourself. This will be your main profile image.
            </p>
            <div className="text-xs text-gray-500">
              • Recommended: Square format, high resolution
              • Face should be clearly visible
              • Professional attire preferred
            </div>
          </div>
        </div>
      </div>

      {/* Hero Image Section */}
      <div className="space-y-4">
        <h3 className="text-lg text-gray-900">Hero Banner Image</h3>
        <div className="space-y-4">
          <div className="relative w-full h-48 rounded-lg overflow-hidden bg-gray-100 border-2 border-dashed border-gray-300">
            {heroImageUrl ? (
              <Image
                src={heroImageUrl}
                alt="Hero banner"
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                <ImageIcon className="w-12 h-12 mb-2" />
                <p className="text-sm">Hero banner image</p>
              </div>
            )}
            <ImageUploader
              uploadPath={`coaches/${user?.uid}/hero/hero_${Date.now()}`}
              onUploadComplete={(url) => handleImageUpload('hero', url)}
              onUploadError={handleImageUploadError}
              className="absolute top-4 right-4"
            />
          </div>
          <div className="text-sm text-gray-600">
            <p className="mb-2">This image appears at the top of your coaching profile page.</p>
            <div className="text-xs text-gray-500">
              • Recommended: 16:9 aspect ratio, high resolution
              • Should represent your sport or coaching style
              • Action shots or team photos work well
            </div>
          </div>
        </div>
      </div>

      {/* Action Photos Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg text-gray-900">Action Photos</h3>
          <div className="relative">
            <ImageUploader
              uploadPath={`coaches/${user?.uid}/action/action_${Date.now()}`}
              onUploadComplete={(url) => handleImageUpload('action', url)}
              onUploadError={handleImageUploadError}
            />
            <button className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors">
              <Plus className="w-4 h-4" />
              Add Photo
            </button>
          </div>
        </div>

        {actionPhotos.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {actionPhotos.map((photo, index) => (
              <div key={index} className="relative group">
                <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                  <Image
                    src={photo}
                    alt={`Action photo ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                </div>
                <button
                  onClick={() => removeActionPhoto(index)}
                  className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">No action photos yet</p>
            <p className="text-sm text-gray-500">Add photos of you coaching or playing your sport</p>
          </div>
        )}

        <div className="text-sm text-gray-600">
          <p className="mb-2">Showcase your coaching in action with multiple photos.</p>
          <div className="text-xs text-gray-500">
            • Show yourself coaching or playing
            • Include team interactions and training sessions
            • Maximum 10 photos recommended
          </div>
        </div>
      </div>

      {/* Highlight Video Section */}
      <div className="space-y-4">
        <h3 className="text-lg text-gray-900">Highlight Video</h3>
        <div className="space-y-4">
          <div className="relative w-full h-64 rounded-lg overflow-hidden bg-gray-100 border-2 border-dashed border-gray-300">
            {highlightVideo ? (
              <video
                src={highlightVideo}
                className="w-full h-full object-cover"
                controls
                poster={headshotUrl || undefined}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                <Play className="w-12 h-12 mb-2" />
                <p className="text-sm">Highlight video</p>
              </div>
            )}
            <ImageUploader
              uploadPath={`coaches/${user?.uid}/video/highlight_${Date.now()}`}
              onUploadComplete={(url) => handleImageUpload('video', url)}
              onUploadError={handleImageUploadError}
              className="absolute top-4 right-4"
            />
          </div>
          <div className="text-sm text-gray-600">
            <p className="mb-2">Upload a video showcasing your coaching style or athletic achievements.</p>
            <div className="text-xs text-gray-500">
              • Recommended: 30-90 seconds long
              • Good quality video and audio
              • Show your coaching or playing highlights
              • Maximum file size: 100MB
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}