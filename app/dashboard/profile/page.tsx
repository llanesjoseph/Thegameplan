'use client'

import { useAuth } from '@/hooks/use-auth'
import { auth, db } from '@/lib/firebase.client'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { useEnhancedRole } from "@/hooks/use-role-switcher"
import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import {
  User,
  Camera,
  Save,
  ArrowLeft,
  Upload,
  Video,
  Star,
  MapPin,
  Calendar,
  Award,
  Trophy,
  Settings as SettingsIcon,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Instagram,
  Twitter,
  Linkedin,
  Youtube,
  Globe,
  MessageSquare,
  Music,
  Mic,
  X,
  FileText,
  Briefcase,
  Users
} from 'lucide-react'
import { DiscordIcon } from '@/components/icons/DiscordIcon'
import { TikTokIcon } from '@/components/icons/TikTokIcon'
import AssistantCoachManager from '@/components/AssistantCoachManager'
import ImageUploader from '@/components/ImageUploader'
import AppHeader from '@/components/ui/AppHeader'
import StreamlinedVoiceCapture from '@/components/coach/StreamlinedVoiceCapture'
import VoiceCaptureIntake from '@/components/coach/VoiceCaptureIntake'
import { SPORTS } from '@/lib/constants/sports'

function ProfilePageContent() {
  const { user } = useAuth()
  const { role, loading } = useEnhancedRole()
  const searchParams = useSearchParams()
  const embedded = searchParams.get('embedded') === 'true'
  const [activeSection, setActiveSection] = useState<string | null>(null)
  const [saveStatus, setSaveStatus] = useState<string | null>(null)
  const [showVoiceCapture, setShowVoiceCapture] = useState(false)
  const [voiceCaptureMode, setVoiceCaptureMode] = useState<'quick' | 'detailed' | null>(null)
  const [profileData, setProfileData] = useState({
    displayName: '',
    bio: '',
    location: '',
    email: '',
    profileImageUrl: '',
    specialties: [] as string[],
    experience: '',
    availability: '',
    languages: [] as string[],
    coachingPhilosophy: '',
    achievements: [] as string[],
    certifications: [] as string[],
    gearRecommendations: [] as Array<{name: string; category: string; link: string; description: string}>,
    createdAt: new Date().toISOString(),
    socialLinks: {
      instagram: '',
      twitter: '',
      linkedin: '',
      youtube: '',
      website: '',
      tiktok: '',
      discord: ''
    },
    coachingCredentials: '',
    tagline: '',
    philosophy: {
      title: '',
      description: '',
      points: [] as Array<{title: string; description: string}>
    },
    assistantCoaches: [] as string[],
    lessonCount: 0,
    studentsHelped: 0,
    averageRating: 0,
    verified: false,
    featured: false,
    badges: [] as string[],
    voiceCaptureData: null as any,
    voiceCaptureCompleteness: 'none' as 'none' | 'quick' | 'detailed'
  })

  // Load profile data from database on component mount
  useEffect(() => {
    const loadProfile = async () => {
      if (user?.uid && role) {
        setProfileData(prev => ({
          ...prev,
          displayName: user.displayName || prev.displayName,
          email: user.email || prev.email
        }))

        try {
          const collection = role === 'creator' ? 'creator_profiles' : 'users'
          const docRef = doc(db, collection, user.uid)
          const docSnap = await getDoc(docRef)

          if (docSnap.exists()) {
            const savedProfile = docSnap.data()
            console.log('Loaded profile from Firestore:', savedProfile)

            setProfileData(prev => ({
              ...prev,
              ...savedProfile,
              displayName: savedProfile.displayName || user.displayName || prev.displayName,
              email: user.email || savedProfile.email || prev.email
            }))
            return
          }
        } catch (error) {
          console.warn('Firestore access failed:', error)
        }
      }
    }

    loadProfile()
  }, [user?.uid, role, user?.displayName, user?.email])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: embedded ? 'transparent' : '#E8E6D8' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p style={{ color: '#000000', opacity: 0.7 }}>Loading profile...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: embedded ? 'transparent' : '#E8E6D8' }}>
        <div className="text-center">
          <h1 className="text-2xl mb-4" style={{ color: '#000000' }}>Sign In Required</h1>
          <p className="mb-6" style={{ color: '#000000', opacity: 0.7 }}>Please sign in to access your profile.</p>
          <Link href="/dashboard" className="px-6 py-3 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors">
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  const handleVoiceCaptureComplete = async (voiceData: any) => {
    const completeness = voiceData.captureMode || 'detailed'
    setProfileData(prev => ({
      ...prev,
      voiceCaptureData: voiceData,
      voiceCaptureCompleteness: completeness
    }))
    setShowVoiceCapture(false)
    setVoiceCaptureMode(null)

    setSaveStatus('saving')
    try {
      const profileWithVoice = {
        ...profileData,
        voiceCaptureData: voiceData,
        voiceCaptureCompleteness: completeness,
        userId: user?.uid,
        updatedAt: new Date().toISOString()
      }

      const collection = role === 'creator' ? 'creator_profiles' : 'users'
      const docRef = doc(db, collection, user.uid)
      await setDoc(docRef, profileWithVoice, { merge: true })

      setSaveStatus('success')
      setTimeout(() => setSaveStatus(null), 3000)
    } catch (error) {
      console.error('Error saving voice data:', error)
      setSaveStatus('error')
      setTimeout(() => setSaveStatus(null), 5000)
    }
  }

  const handleSave = async () => {
    if (!user?.uid) return
    setSaveStatus('saving')

    try {
      const profileWithMetadata = {
        ...profileData,
        userId: user.uid,
        uid: user.uid,
        updatedAt: new Date().toISOString(),
        createdAt: profileData.createdAt || new Date().toISOString(),
      }

      const usersRef = doc(db, 'users', user.uid)
      await setDoc(usersRef, {
        displayName: profileData.displayName,
        bio: profileData.bio,
        email: profileData.email,
        photoURL: profileData.profileImageUrl,
        location: profileData.location,
        experience: profileData.experience,
        sport: profileData.specialties[0] || '',
        specialties: profileData.specialties,
        updatedAt: new Date().toISOString()
      }, { merge: true })

      if (role === 'creator') {
        const creatorProfileRef = doc(db, 'creator_profiles', user.uid)
        await setDoc(creatorProfileRef, profileWithMetadata, { merge: true })

        const creatorsIndexRef = doc(db, 'creators_index', user.uid)
        await setDoc(creatorsIndexRef, {
          displayName: profileData.displayName,
          bio: profileData.bio,
          location: profileData.location,
          specialties: profileData.specialties,
          experience: profileData.experience,
          lastUpdated: new Date().toISOString(),
          profileUrl: `/contributors/${user.uid}`,
          isActive: true
        }, { merge: true })
      }

      setSaveStatus('success')
      setTimeout(() => {
        setSaveStatus(null)
        setActiveSection(null)
      }, 2000)

    } catch (error) {
      console.error('Error saving profile:', error)
      setSaveStatus('error')
      setTimeout(() => setSaveStatus(null), 5000)
    }
  }

  const profileCards = [
    {
      id: 'basic-info',
      title: 'Basic Information',
      description: 'Name, bio, location, and contact',
      icon: User,
      color: '#91A6EB'
    },
    {
      id: 'specialties',
      title: role === 'creator' ? 'Sports Specialties' : 'Sports Interests',
      description: 'Your sport focus areas',
      icon: Star,
      color: '#20B2AA'
    },
    {
      id: 'certifications',
      title: 'Certifications',
      description: 'Professional credentials',
      icon: Award,
      color: '#FF6B35',
      coachOnly: true
    },
    {
      id: 'achievements',
      title: 'Achievements & Awards',
      description: 'Your accomplishments',
      icon: Trophy,
      color: '#000000'
    },
    {
      id: 'social-links',
      title: 'Social Media',
      description: 'Connect your profiles',
      icon: Globe,
      color: '#91A6EB',
      coachOnly: true
    },
    {
      id: 'philosophy',
      title: 'Coaching Philosophy',
      description: 'Your approach and values',
      icon: Briefcase,
      color: '#20B2AA',
      coachOnly: true
    },
    {
      id: 'voice-capture',
      title: 'AI Voice Capture',
      description: 'Train your coaching AI',
      icon: Mic,
      color: '#FF6B35',
      coachOnly: true
    },
    {
      id: 'coaching-details',
      title: 'Coaching Details',
      description: 'Availability and languages',
      icon: Calendar,
      color: '#000000',
      coachOnly: true
    }
  ]

  const filteredCards = profileCards.filter(card =>
    role === 'creator' ? true : !card.coachOnly
  )

  const renderSectionContent = () => {
    if (!activeSection) return null

    switch (activeSection) {
      case 'basic-info':
        return (
          <div className="p-8 space-y-6">
            <div className="flex items-start gap-8 mb-8">
              <div className="relative">
                {profileData.profileImageUrl ? (
                  <div className="w-32 h-32 rounded-2xl overflow-hidden shadow-lg">
                    <img src={profileData.profileImageUrl} alt={profileData.displayName || 'Profile'} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-32 h-32 bg-gradient-to-br from-black to-sky-blue rounded-2xl flex items-center justify-center text-white text-4xl shadow-lg">
                    {profileData.displayName?.charAt(0) || user?.displayName?.charAt(0) || 'U'}
                  </div>
                )}
                <ImageUploader
                  onUploadComplete={(url) => setProfileData(prev => ({ ...prev, profileImageUrl: url }))}
                  onUploadError={(error) => console.error('Profile image upload failed:', error)}
                  currentImageUrl={profileData.profileImageUrl}
                  uploadPath={`users/${user?.uid}/profile/avatar_${Date.now()}`}
                />
              </div>
              <div className="flex-1 space-y-4">
                <input
                  type="text"
                  value={profileData.displayName}
                  onChange={(e) => setProfileData(prev => ({ ...prev, displayName: e.target.value }))}
                  className="text-2xl w-full border-2 rounded-xl p-4 focus:border-sky-blue focus:ring-4 focus:ring-sky-blue/20 transition-all"
                  style={{ borderColor: 'rgba(145, 166, 235, 0.2)', backgroundColor: 'rgba(255, 255, 255, 0.8)' }}
                  placeholder="Your Name"
                />
                <input
                  type="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full border-2 rounded-xl p-3 focus:border-sky-blue focus:ring-4 focus:ring-sky-blue/20 transition-all"
                  style={{ borderColor: 'rgba(145, 166, 235, 0.2)', backgroundColor: 'rgba(255, 255, 255, 0.8)' }}
                  placeholder="Email address"
                />
              </div>
            </div>

            <textarea
              value={profileData.bio}
              onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
              className="w-full border-2 rounded-xl p-4 resize-none focus:border-sky-blue focus:ring-4 focus:ring-sky-blue/20 transition-all"
              style={{ borderColor: 'rgba(145, 166, 235, 0.2)', backgroundColor: 'rgba(255, 255, 255, 0.8)' }}
              rows={4}
              placeholder="Tell us about your athletic background and coaching expertise..."
            />

            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                value={profileData.location}
                onChange={(e) => setProfileData(prev => ({ ...prev, location: e.target.value }))}
                className="border-2 rounded-xl p-3 focus:border-sky-blue focus:ring-4 focus:ring-sky-blue/20 transition-all"
                style={{ borderColor: 'rgba(145, 166, 235, 0.2)', backgroundColor: 'rgba(255, 255, 255, 0.8)' }}
                placeholder="Location (e.g., Los Angeles, CA)"
              />
              <input
                type="text"
                value={profileData.experience}
                onChange={(e) => setProfileData(prev => ({ ...prev, experience: e.target.value }))}
                className="border-2 rounded-xl p-3 focus:border-sky-blue focus:ring-4 focus:ring-sky-blue/20 transition-all"
                style={{ borderColor: 'rgba(145, 166, 235, 0.2)', backgroundColor: 'rgba(255, 255, 255, 0.8)' }}
                placeholder="Experience (e.g., 12 years)"
              />
            </div>
          </div>
        )

      case 'specialties':
        return (
          <div className="p-8 space-y-6">
            <h3 className="text-xl mb-4" style={{ color: '#000000' }}>
              {role === 'creator' ? 'Sports Specialties' : 'Sports Interests'}
            </h3>

            <div className="space-y-4">
              {profileData.specialties.map((specialty, index) => (
                <div key={index} className="flex items-center gap-3">
                  <input
                    type="text"
                    value={specialty}
                    onChange={(e) => {
                      const newSpecialties = [...profileData.specialties]
                      newSpecialties[index] = e.target.value
                      setProfileData(prev => ({ ...prev, specialties: newSpecialties }))
                    }}
                    className="flex-1 border-2 rounded-xl p-3 focus:border-sky-blue focus:ring-4 focus:ring-sky-blue/20 transition-all"
                    style={{ borderColor: 'rgba(145, 166, 235, 0.2)', backgroundColor: 'rgba(255, 255, 255, 0.8)' }}
                    placeholder="Sport name"
                  />
                  <button
                    onClick={() => {
                      const newSpecialties = profileData.specialties.filter((_, i) => i !== index)
                      setProfileData(prev => ({ ...prev, specialties: newSpecialties }))
                    }}
                    className="p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              ))}

              <button
                onClick={() => setProfileData(prev => ({ ...prev, specialties: [...prev.specialties, ''] }))}
                className="w-full p-4 border-2 border-dashed rounded-xl hover:bg-sky-blue/5 transition-colors flex items-center justify-center gap-2"
                style={{ borderColor: 'rgba(145, 166, 235, 0.3)', color: '#91A6EB' }}
              >
                <Upload className="w-5 h-5" />
                Add Sport
              </button>
            </div>
          </div>
        )

      case 'certifications':
        return (
          <div className="p-8 space-y-6">
            <h3 className="text-xl mb-4" style={{ color: '#000000' }}>Certifications</h3>

            {profileData.certifications.map((cert, index) => (
              <div key={index} className="flex items-center gap-3">
                <Award className="w-5 h-5" style={{ color: '#FF6B35' }} />
                <input
                  type="text"
                  value={cert}
                  onChange={(e) => {
                    const newCerts = [...profileData.certifications]
                    newCerts[index] = e.target.value
                    setProfileData(prev => ({ ...prev, certifications: newCerts }))
                  }}
                  className="flex-1 border-2 rounded-xl p-3 focus:border-sky-blue focus:ring-4 focus:ring-sky-blue/20 transition-all"
                  style={{ borderColor: 'rgba(145, 166, 235, 0.2)', backgroundColor: 'rgba(255, 255, 255, 0.8)' }}
                  placeholder="Certification name"
                />
                <button
                  onClick={() => {
                    const newCerts = profileData.certifications.filter((_, i) => i !== index)
                    setProfileData(prev => ({ ...prev, certifications: newCerts }))
                  }}
                  className="p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors"
                >
                  Remove
                </button>
              </div>
            ))}

            <button
              onClick={() => setProfileData(prev => ({ ...prev, certifications: [...prev.certifications, ''] }))}
              className="w-full p-4 border-2 border-dashed rounded-xl hover:bg-sky-blue/5 transition-colors flex items-center justify-center gap-2"
              style={{ borderColor: 'rgba(145, 166, 235, 0.3)', color: '#91A6EB' }}
            >
              <Upload className="w-5 h-5" />
              Add Certification
            </button>
          </div>
        )

      case 'achievements':
        return (
          <div className="p-8 space-y-6">
            <h3 className="text-xl mb-4" style={{ color: '#000000' }}>Achievements & Awards</h3>

            {profileData.achievements.map((achievement, index) => (
              <div key={index} className="flex items-center gap-3">
                <Trophy className="w-5 h-5" style={{ color: '#FFD700' }} />
                <input
                  type="text"
                  value={achievement}
                  onChange={(e) => {
                    const newAchievements = [...profileData.achievements]
                    newAchievements[index] = e.target.value
                    setProfileData(prev => ({ ...prev, achievements: newAchievements }))
                  }}
                  className="flex-1 border-2 rounded-xl p-3 focus:border-sky-blue focus:ring-4 focus:ring-sky-blue/20 transition-all"
                  style={{ borderColor: 'rgba(145, 166, 235, 0.2)', backgroundColor: 'rgba(255, 255, 255, 0.8)' }}
                  placeholder="Achievement description"
                />
                <button
                  onClick={() => {
                    const newAchievements = profileData.achievements.filter((_, i) => i !== index)
                    setProfileData(prev => ({ ...prev, achievements: newAchievements }))
                  }}
                  className="p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors"
                >
                  Remove
                </button>
              </div>
            ))}

            <button
              onClick={() => setProfileData(prev => ({ ...prev, achievements: [...prev.achievements, ''] }))}
              className="w-full p-4 border-2 border-dashed rounded-xl hover:bg-sky-blue/5 transition-colors flex items-center justify-center gap-2"
              style={{ borderColor: 'rgba(145, 166, 235, 0.3)', color: '#91A6EB' }}
            >
              <Upload className="w-5 h-5" />
              Add Achievement
            </button>
          </div>
        )

      case 'social-links':
        return (
          <div className="p-8 space-y-4">
            <h3 className="text-xl mb-4" style={{ color: '#000000' }}>Social Media Links</h3>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-orange-500 rounded-lg flex items-center justify-center">
                <Instagram className="w-5 h-5 text-white" />
              </div>
              <input
                type="text"
                value={profileData.socialLinks.instagram}
                onChange={(e) => setProfileData(prev => ({ ...prev, socialLinks: { ...prev.socialLinks, instagram: e.target.value } }))}
                className="flex-1 border-2 rounded-xl p-3 focus:border-sky-blue focus:ring-4 focus:ring-sky-blue/20 transition-all"
                style={{ borderColor: 'rgba(145, 166, 235, 0.2)', backgroundColor: 'rgba(255, 255, 255, 0.8)' }}
                placeholder="Instagram username or URL"
              />
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                <Twitter className="w-5 h-5 text-white" />
              </div>
              <input
                type="text"
                value={profileData.socialLinks.twitter}
                onChange={(e) => setProfileData(prev => ({ ...prev, socialLinks: { ...prev.socialLinks, twitter: e.target.value } }))}
                className="flex-1 border-2 rounded-xl p-3 focus:border-sky-blue focus:ring-4 focus:ring-sky-blue/20 transition-all"
                style={{ borderColor: 'rgba(145, 166, 235, 0.2)', backgroundColor: 'rgba(255, 255, 255, 0.8)' }}
                placeholder="Twitter/X username or URL"
              />
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-700 rounded-lg flex items-center justify-center">
                <Linkedin className="w-5 h-5 text-white" />
              </div>
              <input
                type="text"
                value={profileData.socialLinks.linkedin}
                onChange={(e) => setProfileData(prev => ({ ...prev, socialLinks: { ...prev.socialLinks, linkedin: e.target.value } }))}
                className="flex-1 border-2 rounded-xl p-3 focus:border-sky-blue focus:ring-4 focus:ring-sky-blue/20 transition-all"
                style={{ borderColor: 'rgba(145, 166, 235, 0.2)', backgroundColor: 'rgba(255, 255, 255, 0.8)' }}
                placeholder="LinkedIn profile URL"
              />
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
                <Youtube className="w-5 h-5 text-white" />
              </div>
              <input
                type="text"
                value={profileData.socialLinks.youtube}
                onChange={(e) => setProfileData(prev => ({ ...prev, socialLinks: { ...prev.socialLinks, youtube: e.target.value } }))}
                className="flex-1 border-2 rounded-xl p-3 focus:border-sky-blue focus:ring-4 focus:ring-sky-blue/20 transition-all"
                style={{ borderColor: 'rgba(145, 166, 235, 0.2)', backgroundColor: 'rgba(255, 255, 255, 0.8)' }}
                placeholder="YouTube channel URL"
              />
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center">
                <TikTokIcon size={20} className="text-white" />
              </div>
              <input
                type="text"
                value={profileData.socialLinks.tiktok}
                onChange={(e) => setProfileData(prev => ({ ...prev, socialLinks: { ...prev.socialLinks, tiktok: e.target.value } }))}
                className="flex-1 border-2 rounded-xl p-3 focus:border-sky-blue focus:ring-4 focus:ring-sky-blue/20 transition-all"
                style={{ borderColor: 'rgba(145, 166, 235, 0.2)', backgroundColor: 'rgba(255, 255, 255, 0.8)' }}
                placeholder="TikTok username or URL"
              />
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                <Globe className="w-5 h-5 text-white" />
              </div>
              <input
                type="text"
                value={profileData.socialLinks.website}
                onChange={(e) => setProfileData(prev => ({ ...prev, socialLinks: { ...prev.socialLinks, website: e.target.value } }))}
                className="flex-1 border-2 rounded-xl p-3 focus:border-sky-blue focus:ring-4 focus:ring-sky-blue/20 transition-all"
                style={{ borderColor: 'rgba(145, 166, 235, 0.2)', backgroundColor: 'rgba(255, 255, 255, 0.8)' }}
                placeholder="Website URL"
              />
            </div>
          </div>
        )

      case 'philosophy':
        return (
          <div className="p-8 space-y-6">
            <h3 className="text-xl mb-4" style={{ color: '#000000' }}>Coaching Philosophy</h3>

            <div>
              <label className="block text-sm mb-2" style={{ color: '#000000', opacity: 0.7 }}>Philosophy Title</label>
              <input
                type="text"
                value={profileData.philosophy.title}
                onChange={(e) => setProfileData(prev => ({ ...prev, philosophy: { ...prev.philosophy, title: e.target.value } }))}
                className="w-full border-2 rounded-xl p-3 focus:border-sky-blue focus:ring-4 focus:ring-sky-blue/20 transition-all"
                style={{ borderColor: 'rgba(145, 166, 235, 0.2)', backgroundColor: 'rgba(255, 255, 255, 0.8)' }}
                placeholder="e.g., Excellence Through Mental Mastery"
              />
            </div>

            <div>
              <label className="block text-sm mb-2" style={{ color: '#000000', opacity: 0.7 }}>Philosophy Description</label>
              <textarea
                value={profileData.philosophy.description}
                onChange={(e) => setProfileData(prev => ({ ...prev, philosophy: { ...prev.philosophy, description: e.target.value } }))}
                className="w-full border-2 rounded-xl p-4 resize-none focus:border-sky-blue focus:ring-4 focus:ring-sky-blue/20 transition-all"
                style={{ borderColor: 'rgba(145, 166, 235, 0.2)', backgroundColor: 'rgba(255, 255, 255, 0.8)' }}
                rows={4}
                placeholder="Describe your coaching philosophy and approach..."
              />
            </div>

            <div>
              <label className="block text-sm mb-2" style={{ color: '#000000', opacity: 0.7 }}>Coaching Tagline</label>
              <input
                type="text"
                value={profileData.tagline}
                onChange={(e) => setProfileData(prev => ({ ...prev, tagline: e.target.value }))}
                className="w-full border-2 rounded-xl p-3 focus:border-sky-blue focus:ring-4 focus:ring-sky-blue/20 transition-all"
                style={{ borderColor: 'rgba(145, 166, 235, 0.2)', backgroundColor: 'rgba(255, 255, 255, 0.8)' }}
                placeholder="e.g., Elevating mental game through tactical intelligence"
                maxLength={120}
              />
            </div>

            <div>
              <label className="block text-sm mb-2" style={{ color: '#000000', opacity: 0.7 }}>Credentials & Background</label>
              <textarea
                value={profileData.coachingCredentials}
                onChange={(e) => setProfileData(prev => ({ ...prev, coachingCredentials: e.target.value }))}
                className="w-full border-2 rounded-xl p-3 resize-none focus:border-sky-blue focus:ring-4 focus:ring-sky-blue/20 transition-all"
                style={{ borderColor: 'rgba(145, 166, 235, 0.2)', backgroundColor: 'rgba(255, 255, 255, 0.8)' }}
                rows={3}
                placeholder="List your coaching credentials, certifications, and professional background..."
              />
            </div>
          </div>
        )

      case 'coaching-details':
        return (
          <div className="p-8 space-y-6">
            <h3 className="text-xl mb-4" style={{ color: '#000000' }}>Coaching Details</h3>

            <div>
              <label className="block text-sm mb-2" style={{ color: '#000000', opacity: 0.7 }}>Availability</label>
              <input
                type="text"
                value={profileData.availability}
                onChange={(e) => setProfileData(prev => ({ ...prev, availability: e.target.value }))}
                className="w-full border-2 rounded-xl p-3 focus:border-sky-blue focus:ring-4 focus:ring-sky-blue/20 transition-all"
                style={{ borderColor: 'rgba(145, 166, 235, 0.2)', backgroundColor: 'rgba(255, 255, 255, 0.8)' }}
                placeholder="e.g., Weekends and Evenings"
              />
            </div>

            <div>
              <label className="block text-sm mb-2" style={{ color: '#000000', opacity: 0.7 }}>Languages (comma separated)</label>
              <input
                type="text"
                value={profileData.languages.join(', ')}
                onChange={(e) => setProfileData(prev => ({ ...prev, languages: e.target.value.split(', ').filter(lang => lang.trim()) }))}
                className="w-full border-2 rounded-xl p-3 focus:border-sky-blue focus:ring-4 focus:ring-sky-blue/20 transition-all"
                style={{ borderColor: 'rgba(145, 166, 235, 0.2)', backgroundColor: 'rgba(255, 255, 255, 0.8)' }}
                placeholder="e.g., English, Spanish"
              />
            </div>
          </div>
        )

      case 'voice-capture':
        return (
          <div className="p-8">
            <h3 className="text-xl mb-4" style={{ color: '#000000' }}>AI Voice Capture</h3>
            <p className="mb-6" style={{ color: '#000000', opacity: 0.7 }}>
              Enhance your AI coaching with personalized voice capture. Help our AI understand your unique coaching style.
            </p>

            {profileData.voiceCaptureCompleteness === 'none' ? (
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => {
                    setVoiceCaptureMode('quick')
                    setShowVoiceCapture(true)
                  }}
                  className="flex items-center gap-2 px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg"
                >
                  <Mic className="w-5 h-5" />
                  ⚡ Quick Voice Capture (5-7 min)
                </button>
                <button
                  onClick={() => {
                    setVoiceCaptureMode('detailed')
                    setShowVoiceCapture(true)
                  }}
                  className="flex items-center gap-2 px-6 py-4 border-2 border-purple-600 text-purple-600 rounded-xl hover:bg-purple-50 transition-all"
                >
                  <MessageSquare className="w-5 h-5" />
                  📚 Detailed Voice Capture (12-15 min)
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2 px-4 py-3 bg-green-50 text-green-700 rounded-xl border border-green-200">
                  <CheckCircle className="w-5 h-5" />
                  Voice capture completed ({profileData.voiceCaptureCompleteness})
                </div>
                <button
                  onClick={() => {
                    setVoiceCaptureMode('detailed')
                    setShowVoiceCapture(true)
                  }}
                  className="flex items-center gap-2 px-6 py-4 border-2 text-sky-blue rounded-xl hover:bg-sky-blue/5 transition-all"
                  style={{ borderColor: '#20B2AA' }}
                >
                  <Upload className="w-5 h-5" />
                  Enhance Voice Profile
                </button>
              </div>
            )}
          </div>
        )

      default:
        return null
    }
  }

  return (
    <main style={{ backgroundColor: embedded ? 'transparent' : '#E8E6D8' }} className={embedded ? 'p-4' : 'min-h-screen'}>
      {!embedded && <AppHeader />}

      <div className={`w-full ${embedded ? '' : 'max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6'}`}>
        {/* Header */}
        {embedded && (
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <User className="w-8 h-8" style={{ color: '#91A6EB' }} />
              <h1 className="text-3xl" style={{ color: '#000000' }}>My Profile</h1>
            </div>
            <p style={{ color: '#000000', opacity: 0.7 }}>
              Manage your profile information and settings
            </p>
          </div>
        )}

        {!embedded && (
          <div className="flex items-center gap-4 mb-8">
            <Link href="/dashboard" className="p-3 bg-white/80 hover:bg-white rounded-xl transition-colors shadow-sm border border-white/20">
              <ArrowLeft className="w-5 h-5" style={{ color: '#000000' }} />
            </Link>
            <div>
              <h1 className="text-4xl" style={{ color: '#000000' }}>
                {role === 'creator' ? 'Coach Profile' : 'Athlete Profile'}
              </h1>
              <p style={{ color: '#000000', opacity: 0.6 }}>Manage your profile information and settings</p>
            </div>
          </div>
        )}

        {/* Inline Section Editor */}
        {activeSection && (
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-2xl border border-white/50 relative overflow-hidden mb-6">
            <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'rgba(0, 0, 0, 0.1)' }}>
              <h2 className="text-xl" style={{ color: '#000000' }}>
                {profileCards.find(c => c.id === activeSection)?.title}
              </h2>
              <div className="flex items-center gap-2">
                {saveStatus && (
                  <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm ${
                    saveStatus === 'saving' ? 'bg-sky-blue/20 text-sky-blue' :
                    saveStatus === 'success' ? 'bg-green/20 text-green' :
                    'bg-orange/20 text-orange'
                  }`}>
                    {saveStatus === 'saving' && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-sky-blue"></div>}
                    {saveStatus === 'success' && <CheckCircle className="w-4 h-4" />}
                    {saveStatus === 'error' && <AlertCircle className="w-4 h-4" />}
                    {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'success' ? 'Saved!' : 'Error'}
                  </div>
                )}
                <button
                  onClick={handleSave}
                  disabled={saveStatus === 'saving'}
                  className="px-6 py-2 bg-gradient-to-r from-black to-black/90 text-white rounded-xl hover:from-black/90 hover:to-black transition-all flex items-center gap-2 disabled:opacity-50 shadow-lg"
                >
                  <Save className="w-4 h-4" />
                  Save Changes
                </button>
                <button
                  onClick={() => setActiveSection(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" style={{ color: '#000000' }} />
                </button>
              </div>
            </div>
            {renderSectionContent()}
          </div>
        )}

        {/* Profile Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
          {filteredCards.map((card, index) => {
            const Icon = card.icon
            const isActive = activeSection === card.id

            return (
              <button
                key={index}
                onClick={() => setActiveSection(card.id)}
                className={`block group cursor-pointer text-left transition-all ${isActive ? 'ring-2 ring-black ring-offset-2' : ''}`}
              >
                <div className={`bg-white/90 backdrop-blur-sm rounded-lg sm:rounded-xl shadow-lg border border-white/50 p-3 sm:p-4 h-full transition-all hover:shadow-2xl hover:scale-105 ${isActive ? 'bg-white shadow-2xl' : ''}`}>
                  <div className="flex flex-col h-full min-h-[100px] sm:min-h-[120px]">
                    <div
                      className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg mb-2 sm:mb-3 flex items-center justify-center shadow-md"
                      style={{ backgroundColor: card.color }}
                    >
                      <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>

                    <h3 className="text-xs sm:text-sm mb-1 line-clamp-2" style={{ color: '#000000' }}>
                      {card.title}
                    </h3>

                    <p className="text-[10px] sm:text-xs flex-grow line-clamp-2" style={{ color: '#000000', opacity: 0.6 }}>
                      {card.description}
                    </p>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Voice Capture Modal */}
      {showVoiceCapture && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b p-4 flex items-center justify-between">
              <h2 className="text-xl" style={{ color: '#000000' }}>AI Voice Capture</h2>
              <button
                onClick={() => {
                  setShowVoiceCapture(false)
                  setVoiceCaptureMode(null)
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              {voiceCaptureMode === 'quick' ? (
                <StreamlinedVoiceCapture
                  onComplete={handleVoiceCaptureComplete}
                  onProgress={(progress) => console.log('Voice capture progress:', progress)}
                  existingProfile={{
                    sport: profileData.specialties[0] || '',
                    experience: profileData.experience,
                    bio: profileData.bio,
                    tagline: profileData.tagline
                  }}
                />
              ) : (
                <VoiceCaptureIntake
                  onComplete={handleVoiceCaptureComplete}
                  onProgress={(progress) => console.log('Voice capture progress:', progress)}
                  prePopulatedData={undefined}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

export default function ProfilePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#E8E6D8' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p style={{ color: '#000000' }}>Loading profile...</p>
        </div>
      </div>
    }>
      <ProfilePageContent />
    </Suspense>
  )
}
