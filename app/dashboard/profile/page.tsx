'use client'

import { useAuth } from '@/hooks/use-auth'
import { auth, db } from '@/lib/firebase.client'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { useEnhancedRole } from "@/hooks/use-role-switcher"
import { useState, useEffect } from 'react'
import Link from 'next/link'
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
 Music
} from 'lucide-react'
import { DiscordIcon } from '@/components/icons/DiscordIcon'
import { TikTokIcon } from '@/components/icons/TikTokIcon'
import AssistantCoachManager from '@/components/AssistantCoachManager'
import ImageUploader from '@/components/ImageUploader'
import AppHeader from '@/components/ui/AppHeader'
import StreamlinedVoiceCapture from '@/components/coach/StreamlinedVoiceCapture'
import VoiceCaptureIntake from '@/components/coach/VoiceCaptureIntake'

// Comprehensive sports list from the app
const SPORTS_OPTIONS = [
 'Brazilian Jiu-Jitsu (BJJ)',
 'Mixed Martial Arts (MMA)',
 'Soccer',
 'American Football',
 'Basketball',
 'Tennis',
 'Baseball',
 'Volleyball',
 'Golf',
 'Swimming',
 'Boxing',
 'Wrestling',
 'Track & Field',
 'Gymnastics',
 'Hockey',
 'Cricket',
 'Rugby',
 'Softball',
 'Badminton',
 'Table Tennis',
 'Martial Arts',
 'CrossFit',
 'Weightlifting',
 'Running',
 'Cycling',
 'Rock Climbing',
 'Skiing',
 'Snowboarding',
 'Surfing',
 'Skateboarding',
 'Other'
].sort()

export default function ProfilePage() {
 const { user } = useAuth()
 const { role, loading } = useEnhancedRole()
 const [isEditing, setIsEditing] = useState(false)
 const [saveStatus, setSaveStatus] = useState<string | null>(null) // 'saving', 'success', 'error'
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
  // Coach-specific fields
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
  // Voice capture data
  voiceCaptureData: null as any,
  voiceCaptureCompleteness: 'none' as 'none' | 'quick' | 'detailed'
 })

 // Load profile data from database on component mount
 useEffect(() => {
  const loadProfile = async () => {
   if (user?.uid && role) {
    // First, initialize with user's basic information
    setProfileData(prev => ({
     ...prev,
     displayName: user.displayName || prev.displayName,
     email: user.email || prev.email
    }))

    try {
     // Use different collections based on role
     const collection = role === 'creator' ? 'creator_profiles' : 'users'
     const docRef = doc(db, collection, user.uid)
     const docSnap = await getDoc(docRef)

     if (docSnap.exists()) {
      const savedProfile = docSnap.data()
      console.log('Loaded profile from Firestore:', savedProfile)
      setProfileData(prev => ({
       ...prev,
       ...savedProfile,
       // Ensure user's current email/displayName takes precedence
       displayName: savedProfile.displayName || user.displayName || prev.displayName,
       email: user.email || savedProfile.email || prev.email
      }))
      return
     } else {
      console.log('No existing profile found in Firestore')
     }
    } catch (error) {
     console.warn('Firestore access failed, using localStorage:', error instanceof Error ? error.message : error)
    }

    // Fallback to localStorage
    try {
     const key = role === 'creator' ? `creator_profile_${user.uid}` : `user_profile_${user.uid}`
     const savedProfile = localStorage.getItem(key)
     if (savedProfile) {
      const parsedProfile = JSON.parse(savedProfile)
      console.log('Loaded profile from localStorage:', parsedProfile)
      setProfileData(prev => ({
       ...prev,
       ...parsedProfile,
       // Ensure user's current email/displayName takes precedence
       displayName: parsedProfile.displayName || user.displayName || prev.displayName,
       email: user.email || parsedProfile.email || prev.email
      }))
     } else {
      console.log('No profile found in localStorage, using defaults')
     }
    } catch (error) {
     console.error('Error loading from localStorage:', error)
    }
   }
  }

  loadProfile()
 }, [user?.uid, role, user?.displayName, user?.email])

 if (loading) {
  return (
   <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
     <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-500 mx-auto"></div>
     <p className="mt-4 text-brand-grey">Loading profile...</p>
    </div>
   </div>
  )
 }

 if (!user) {
  return (
   <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
     <h1 className="text-2xl mb-4">Sign In Required</h1>
     <p className="text-brand-grey mb-6">Please sign in to access your profile.</p>
     <Link href="/dashboard" className="btn btn-accent">
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

  // Auto-save the voice data
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
   // Add metadata
   const profileWithMetadata = {
    ...profileData,
    userId: user.uid,
    updatedAt: new Date().toISOString(),
    createdAt: profileData.createdAt || new Date().toISOString(),
   }

   // Try to save to Firestore first
   try {
    const collection = role === 'creator' ? 'creator_profiles' : 'users'
    const docRef = doc(db, collection, user.uid)
    await setDoc(docRef, profileWithMetadata, { merge: true })

    // For creators, also update the creators index for discoverability
    if (role === 'creator') {
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
    
    console.log('Profile saved to Firestore successfully:', profileWithMetadata)
   } catch (firestoreError) {
    console.warn('Firestore save failed, using localStorage:', firestoreError instanceof Error ? firestoreError.message : firestoreError)
    
    // Fallback to localStorage
    const key = role === 'creator' ? `creator_profile_${user.uid}` : `user_profile_${user.uid}`
    localStorage.setItem(key, JSON.stringify(profileWithMetadata))
    
    // For creators, also save to creators index for discovery
    if (role === 'creator') {
     const creatorsIndex = JSON.parse(localStorage.getItem('creators_index') || '{}')
     creatorsIndex[user.uid] = {
      displayName: profileData.displayName,
      bio: profileData.bio,
      location: profileData.location,
      specialties: profileData.specialties,
      experience: profileData.experience,
      lastUpdated: new Date().toISOString(),
      profileUrl: `/contributors/${user.uid}`,
      isActive: true
     }
     localStorage.setItem('creators_index', JSON.stringify(creatorsIndex))
    }
    
    console.log('Profile saved to localStorage successfully:', profileWithMetadata)
   }
   
   setSaveStatus('success')
   setIsEditing(false)
   
   // Clear success message after 3 seconds
   setTimeout(() => setSaveStatus(null), 3000)
   
  } catch (error) {
   console.error('Error saving profile:', error)
   setSaveStatus('error')
   
   // Clear error message after 5 seconds
   setTimeout(() => setSaveStatus(null), 5000)
  }
 }

 return (
  <main className="min-h-screen bg-gradient-to-br from-cream via-cream to-sky-blue/10">
   <AppHeader />
   <div className="max-w-6xl mx-auto px-6 py-8">
    {/* Page Header */}
    <div className="flex items-center justify-between mb-8">
     <div className="flex items-center gap-4">
      <Link href="/dashboard" className="p-3 hover:bg-white/80 rounded-xl transition-colors shadow-sm backdrop-blur-sm border border-white/20">
       <ArrowLeft className="w-5 h-5 text-dark" />
      </Link>
      <div>
       <h1 className="text-4xl text-dark font-heading">
        {role === 'creator' ? 'Coach Profile' : 'Athlete Profile'}
       </h1>
       <p className="text-dark/60 ">Manage your sports profile and showcase your expertise</p>
      </div>
     </div>
     
     <div className="flex items-center gap-3">
      {/* Save Status Indicator */}
      {saveStatus && (
       <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm  backdrop-blur-sm border shadow-sm ${
        saveStatus === 'saving' ? 'bg-sky-blue/20 text-sky-blue border-sky-blue/30' :
        saveStatus === 'success' ? 'bg-green/20 text-green border-green/30' :
        'bg-orange/20 text-orange border-orange/30'
       }`}>
        {saveStatus === 'saving' && (
         <>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-sky-blue"></div>
          Saving Profile...
         </>
        )}
        {saveStatus === 'success' && (
         <>
          <CheckCircle className="w-4 h-4" />
          Profile Saved!
         </>
        )}
        {saveStatus === 'error' && (
         <>
          <AlertCircle className="w-4 h-4" />
          Save Failed
         </>
        )}
       </div>
      )}
      
      {isEditing ? (
       <>
        <button
         onClick={() => {
          setIsEditing(false)
          setSaveStatus(null)
         }}
         className="px-6 py-3 border-2 border-dark/20 bg-white/80 text-dark rounded-xl hover:bg-white transition-all  backdrop-blur-sm shadow-sm"
         disabled={saveStatus === 'saving'}
        >
         Cancel
        </button>
        <button
         onClick={handleSave}
         disabled={saveStatus === 'saving'}
         className="px-6 py-3 bg-gradient-to-r from-black to-black/90 text-white rounded-xl hover:from-black/90 hover:to-black transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed  shadow-lg"
        >
         {saveStatus === 'saving' ? (
          <>
           <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
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
      ) : (
       <button
        onClick={() => setIsEditing(true)}
        className="px-6 py-3 bg-gradient-to-r from-sky-blue to-sky-blue/90 text-white rounded-xl hover:from-sky-blue/90 hover:to-sky-blue transition-all flex items-center gap-2  shadow-lg"
       >
        <SettingsIcon className="w-4 h-4" />
        Edit Profile
       </button>
      )}
     </div>
    </div>

    {/* Profile Header */}
    <div className="bg-gradient-to-r from-white via-white to-sky-blue/5 rounded-3xl shadow-lg border border-white/50 p-8 mb-8 backdrop-blur-sm">
     <div className="flex items-start gap-8">
      <div className="relative">
       {profileData.profileImageUrl ? (
        <div className="w-32 h-32 rounded-2xl overflow-hidden shadow-lg">
         <img
          src={profileData.profileImageUrl}
          alt={profileData.displayName || 'Profile'}
          className="w-full h-full object-cover"
         />
        </div>
       ) : (
        <div className="w-32 h-32 bg-gradient-to-br from-black to-sky-blue rounded-2xl flex items-center justify-center text-white text-4xl shadow-lg">
         {profileData.displayName?.charAt(0) || user?.displayName?.charAt(0) || 'U'}
        </div>
       )}
       {isEditing && (
        <ImageUploader
         onUploadComplete={(url) => {
          setProfileData(prev => ({ ...prev, profileImageUrl: url }))
         }}
         onUploadError={(error) => {
          console.error('Profile image upload failed:', error)
         }}
         currentImageUrl={profileData.profileImageUrl}
         uploadPath={`users/${user?.uid}/profile/avatar_${Date.now()}`}
        />
       )}
      </div>
      
      <div className="flex-1">
       {isEditing ? (
        <div className="space-y-6">
         <input
          type="text"
          value={profileData.displayName}
          onChange={(e) => setProfileData(prev => ({ ...prev, displayName: e.target.value }))}
          className="text-3xl w-full border-2 border-sky-blue/20 bg-white/80 rounded-xl p-4 text-dark placeholder-dark/50 focus:border-sky-blue focus:ring-4 focus:ring-sky-blue/20 transition-all backdrop-blur-sm"
          placeholder="Your Name"
         />
         <textarea
          value={profileData.bio}
          onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
          className="w-full border-2 border-sky-blue/20 bg-white/80 rounded-xl p-4 text-dark placeholder-dark/50 focus:border-sky-blue focus:ring-4 focus:ring-sky-blue/20 transition-all backdrop-blur-sm resize-none"
          rows={4}
          placeholder="Tell us about your athletic background and coaching expertise..."
         />
         <div className="grid grid-cols-2 gap-4">
          <input
           type="text"
           value={profileData.location}
           onChange={(e) => setProfileData(prev => ({ ...prev, location: e.target.value }))}
           className="border-2 border-sky-blue/20 bg-white/80 rounded-xl p-3 text-dark placeholder-dark/50 focus:border-sky-blue focus:ring-4 focus:ring-sky-blue/20 transition-all backdrop-blur-sm"
           placeholder="Location (e.g., Los Angeles, CA)"
          />
          <input
           type="text"
           value={profileData.experience}
           onChange={(e) => setProfileData(prev => ({ ...prev, experience: e.target.value }))}
           className="border-2 border-sky-blue/20 bg-white/80 rounded-xl p-3 text-dark placeholder-dark/50 focus:border-sky-blue focus:ring-4 focus:ring-sky-blue/20 transition-all backdrop-blur-sm"
           placeholder="Experience (e.g., 12 years)"
          />
         </div>
         <div>
          <input
           type="email"
           value={profileData.email}
           onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
           className="w-full border-2 border-sky-blue/20 bg-white/80 rounded-xl p-3 text-dark placeholder-dark/50 focus:border-sky-blue focus:ring-4 focus:ring-sky-blue/20 transition-all backdrop-blur-sm"
           placeholder="Email address"
          />
         </div>
        </div>
       ) : (
        <div>
         <h2 className="text-4xl text-dark mb-3 font-heading">{profileData.displayName || user?.displayName || 'User Name'}</h2>
         {profileData.bio ? (
          <p className="text-dark/70 mb-6 text-lg leading-relaxed">{profileData.bio}</p>
         ) : (
          <p className="text-dark/40 mb-6 text-lg leading-relaxed italic">Click "Edit Profile" to add your coaching bio and credentials</p>
         )}
         <div className="flex items-center gap-6 text-dark/60 flex-wrap">
          <div className="flex items-center gap-2 bg-sky-blue/10 px-4 py-2 rounded-xl">
           <MapPin className="w-4 h-4 text-sky-blue" />
           <span className="">{profileData.location || 'Location not set'}</span>
          </div>
          <div className="flex items-center gap-2 bg-green/10 px-4 py-2 rounded-xl">
           <Calendar className="w-4 h-4 text-green" />
           <span className="">{profileData.experience || 'Experience not set'} experience</span>
          </div>
         </div>
        </div>
       )}
      </div>
     </div>
    </div>

    <div className="grid lg:grid-cols-2 gap-8">
     {/* Left Column */}
     <div className="space-y-8">
      {/* Interests/Specialties - Sports for users, Specialties for creators */}
      <div className="bg-gradient-to-br from-white to-sky-blue/5 rounded-2xl shadow-lg border border-white/50 p-8 backdrop-blur-sm">
       <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
         <div className="w-8 h-8 bg-gradient-to-r from-sky-blue to-black rounded-lg flex items-center justify-center">
          <Star className="w-4 h-4 text-white" />
         </div>
         <h3 className="text-xl text-dark font-heading">
          {role === 'creator' ? 'Sports Specialties' : 'Sports Interests'}
         </h3>
        </div>
       </div>

       {role === 'creator' ? (
        // Coach specialties - allow custom text inputs plus sport selection
        <>
         <div className="space-y-4">
          {/* Sports Dropdown for Coaches */}
          {isEditing && (
           <div className="mb-4">
            <h4 className="text-sm  text-slate-700 mb-3">Sports Specialties</h4>
            <select
             onChange={(e) => {
              const selectedSport = e.target.value
              if (selectedSport && !profileData.specialties.includes(selectedSport)) {
               setProfileData(prev => ({
                ...prev,
                specialties: [...prev.specialties, selectedSport]
               }))
              }
              e.target.value = '' // Reset dropdown
             }}
             className="w-full border border-slate-300 rounded-lg p-2 text-sm mb-3"
             value=""
            >
             <option value="">Select a sport to add...</option>
             {SPORTS_OPTIONS.map((sport) => (
              <option
               key={sport}
               value={sport}
               disabled={profileData.specialties.includes(sport)}
              >
               {sport} {profileData.specialties.includes(sport) ? '(Already added)' : ''}
              </option>
             ))}
            </select>

            {profileData.specialties.length > 0 && (
             <div className="flex flex-wrap gap-2 mb-4">
              {profileData.specialties.map((sport, index) => (
               <span
                key={index}
                className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm"
               >
                {sport}
                <button
                 type="button"
                 onClick={() => {
                  setProfileData(prev => ({
                   ...prev,
                   specialties: prev.specialties.filter(s => s !== sport)
                  }))
                 }}
                 className="ml-1 text-purple-500 hover:text-purple-700"
                >
                 ×
                </button>
               </span>
              ))}
             </div>
            )}
           </div>
          )}

          {/* Custom Specialties for Coaches */}
          {isEditing && (
           <div>
            <div className="flex items-center justify-between mb-3">
             <h4 className="text-sm  text-slate-700">Additional Specialties</h4>
             <button
              onClick={() => setProfileData(prev => ({
               ...prev,
               specialties: [...prev.specialties, 'New Specialty']
              }))}
              className="text-purple-600 hover:text-purple-700 text-sm flex items-center gap-1"
             >
              <Upload className="w-4 h-4" />
              Add Custom
             </button>
            </div>
            <div className="space-y-2">
             {profileData.specialties.filter(s => !['Soccer', 'Basketball', 'Tennis', 'Baseball', 'Football'].includes(s)).map((specialty, index) => (
              <div key={index} className="flex items-center gap-2">
               <input
                type="text"
                value={specialty}
                onChange={(e) => {
                 const newSpecialties = [...profileData.specialties]
                 const actualIndex = profileData.specialties.indexOf(specialty)
                 newSpecialties[actualIndex] = e.target.value
                 setProfileData(prev => ({ ...prev, specialties: newSpecialties }))
                }}
                className="flex-1 border border-slate-300 rounded p-2"
               />
               <button
                onClick={() => {
                 const newSpecialties = profileData.specialties.filter(s => s !== specialty)
                 setProfileData(prev => ({ ...prev, specialties: newSpecialties }))
                }}
                className="text-red-500 hover:text-red-700 text-sm"
               >
                Remove
               </button>
              </div>
             ))}
            </div>
           </div>
          )}

          {/* Display view for coaches */}
          {!isEditing && (
           <div className="flex flex-wrap gap-2">
            {profileData.specialties.length > 0 ? (
             profileData.specialties.map((specialty, index) => (
              <span key={index} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
               {specialty}
              </span>
             ))
            ) : (
             <p className="text-dark/40 italic">Click "Edit Profile" to add your sports specialties</p>
            )}
           </div>
          )}
         </div>
        </>
       ) : (
        // Athlete sports interests - use dropdown selection
        <>
         {isEditing ? (
          <div className="space-y-4">
           <div>
            <label className="block text-sm  text-slate-700 mb-2">
             Add Sport Interest
            </label>
            <select
             onChange={(e) => {
              const selectedSport = e.target.value
              if (selectedSport && !profileData.specialties.includes(selectedSport)) {
               setProfileData(prev => ({
                ...prev,
                specialties: [...prev.specialties, selectedSport]
               }))
              }
              e.target.value = '' // Reset dropdown
             }}
             className="w-full border border-slate-300 rounded-lg p-2 text-sm"
             value=""
            >
             <option value="">Select a sport to add...</option>
             {SPORTS_OPTIONS.map((sport) => (
              <option
               key={sport}
               value={sport}
               disabled={profileData.specialties.includes(sport)}
              >
               {sport} {profileData.specialties.includes(sport) ? '(Already added)' : ''}
              </option>
             ))}
            </select>
           </div>

           {profileData.specialties.length > 0 && (
            <div>
             <label className="block text-sm  text-slate-700 mb-2">
              Selected Sports
             </label>
             <div className="flex flex-wrap gap-2">
              {profileData.specialties.map((sport, index) => (
               <span
                key={index}
                className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
               >
                {sport}
                <button
                 type="button"
                 onClick={() => {
                  setProfileData(prev => ({
                   ...prev,
                   specialties: prev.specialties.filter(s => s !== sport)
                  }))
                 }}
                 className="ml-1 text-blue-500 hover:text-blue-700"
                >
                 ×
                </button>
               </span>
              ))}
             </div>
            </div>
           )}
          </div>
         ) : (
          <div className="flex flex-wrap gap-2">
           {profileData.specialties.length > 0 ? (
            profileData.specialties.map((sport, index) => (
             <span key={index} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
              {sport}
             </span>
            ))
           ) : (
            <p className="text-slate-500 text-sm">No sports selected yet</p>
           )}
          </div>
         )}
        </>
       )}
      </div>

      {/* Certifications - Only for creators */}
      {role === 'creator' && (
      <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6">
       <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
         <div className="w-8 h-8 bg-gradient-to-r from-orange to-black rounded-lg flex items-center justify-center">
          <Award className="w-4 h-4 text-white" />
         </div>
         <h3 className="text-lg  font-heading" style={{ color: '#000000' }}>Certifications</h3>
        </div>
        {isEditing && (
         <button 
          onClick={() => setProfileData(prev => ({ 
           ...prev, 
           certifications: [...prev.certifications, 'New Certification'] 
          }))}
          className="text-orange-600 hover:text-orange-700 text-sm flex items-center gap-1"
         >
          <Upload className="w-4 h-4" />
          Add Certification
         </button>
        )}
       </div>
       <div className="space-y-3">
        {profileData.certifications.map((cert, index) => (
         <div key={index} className="flex items-center gap-3">
          <Award className="w-5 h-5 text-orange-500" />
          {isEditing ? (
           <div className="flex items-center gap-2 flex-1">
            <input
             type="text"
             value={cert}
             onChange={(e) => {
              const newCertifications = [...profileData.certifications]
              newCertifications[index] = e.target.value
              setProfileData(prev => ({ ...prev, certifications: newCertifications }))
             }}
             className="flex-1 border border-slate-300 rounded p-2"
            />
            <button
             onClick={() => {
              const newCertifications = profileData.certifications.filter((_, i) => i !== index)
              setProfileData(prev => ({ ...prev, certifications: newCertifications }))
             }}
             className="text-red-500 hover:text-red-700 text-sm"
            >
             Remove
            </button>
           </div>
          ) : (
           <span className="text-slate-700">{cert}</span>
          )}
         </div>
        ))}
       </div>
      </div>
      )}

      {/* Coaching Details - Only for creators */}
      {role === 'creator' && (
       <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
       <h3 className="text-lg  text-slate-900 mb-4">Coaching Details</h3>
       <div className="space-y-4">
        <div>
         <label className="block text-sm  text-slate-700 mb-2">Availability</label>
         {isEditing ? (
          <input
           type="text"
           value={profileData.availability}
           onChange={(e) => setProfileData(prev => ({ ...prev, availability: e.target.value }))}
           className="w-full border border-slate-300 rounded p-2"
           placeholder="e.g., Weekends and Evenings"
          />
         ) : (
          <span className="text-slate-700">{profileData.availability || 'Not specified'}</span>
         )}
        </div>
        <div>
         <label className="block text-sm  text-slate-700 mb-2">Languages</label>
         {isEditing ? (
          <input
           type="text"
           value={profileData.languages.join(', ')}
           onChange={(e) => setProfileData(prev => ({ ...prev, languages: e.target.value.split(', ').filter(lang => lang.trim()) }))}
           className="w-full border border-slate-300 rounded p-2"
           placeholder="e.g., English, Spanish (comma separated)"
          />
         ) : (
          <div className="flex flex-wrap gap-2">
           {profileData.languages.map((language, index) => (
            <span key={index} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm">
             {language}
            </span>
           ))}
          </div>
         )}
        </div>
       </div>
       </div>
      )}

      {/* Coaching Philosophy - Only for creators */}
      {role === 'creator' && (
       <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6">
       <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 bg-gradient-to-r from-black to-sky-blue rounded-lg flex items-center justify-center">
         <MessageSquare className="w-4 h-4 text-white" />
        </div>
        <h3 className="text-lg  font-heading" style={{ color: '#000000' }}>Coaching Philosophy</h3>
       </div>
       {isEditing ? (
        <textarea
         value={profileData.coachingPhilosophy}
         onChange={(e) => setProfileData(prev => ({ ...prev, coachingPhilosophy: e.target.value }))}
         className="w-full border border-white/50 rounded p-3 bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-sky-blue"
         style={{ color: '#000000' }}
         rows={4}
         placeholder="Describe your coaching philosophy and approach..."
        />
       ) : (
        <p style={{ color: '#000000' }}>{profileData.coachingPhilosophy || 'Click "Edit Profile" to add your coaching philosophy'}</p>
       )}
       </div>
      )}

      {/* Achievements */}
      <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6">
       <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
         <div className="w-8 h-8 bg-gradient-to-r from-orange to-black rounded-lg flex items-center justify-center">
          <Trophy className="w-4 h-4 text-white" />
         </div>
         <h3 className="text-lg  font-heading" style={{ color: '#000000' }}>Achievements & Awards</h3>
        </div>
        {isEditing && (
         <button 
          onClick={() => setProfileData(prev => ({ 
           ...prev, 
           achievements: [...prev.achievements, 'New Achievement'] 
          }))}
          className="text-orange-600 hover:text-orange-700 text-sm flex items-center gap-1"
         >
          <Upload className="w-4 h-4" />
          Add Achievement
         </button>
        )}
       </div>
       {isEditing ? (
        <div className="space-y-2">
         {profileData.achievements.map((achievement, index) => (
          <div key={index} className="flex items-center gap-2">
           <input
            type="text"
            value={achievement}
            onChange={(e) => {
             const newAchievements = [...profileData.achievements]
             newAchievements[index] = e.target.value
             setProfileData(prev => ({ ...prev, achievements: newAchievements }))
            }}
            className="flex-1 border border-slate-300 rounded p-2"
           />
           <button
            onClick={() => {
             const newAchievements = profileData.achievements.filter((_, i) => i !== index)
             setProfileData(prev => ({ ...prev, achievements: newAchievements }))
            }}
            className="text-red-500 hover:text-red-700 text-sm"
           >
            Remove
           </button>
          </div>
         ))}
        </div>
       ) : (
        <div className="space-y-2">
         {profileData.achievements.length > 0 ? (
          profileData.achievements.map((achievement, index) => (
           <div key={index} className="flex items-center gap-3">
            <Award className="w-4 h-4 text-yellow-500" />
            <span className="text-slate-700">{achievement}</span>
           </div>
          ))
         ) : (
          <p className="text-dark/40 italic">Click "Edit Profile" to add your achievements and awards</p>
         )}
        </div>
       )}
      </div>
     </div>

     {/* Right Column */}
     <div className="space-y-8">
      {/* Gear Recommendations - Only for creators */}
      {role === 'creator' && (
       <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
       <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg  text-slate-900">Gear Recommendations</h3>
        {isEditing && (
         <button 
          onClick={() => setProfileData(prev => ({ 
           ...prev, 
           gearRecommendations: [...prev.gearRecommendations, { name: 'New Gear', category: 'Category', link: '#', description: '' }] 
          }))}
          className="text-purple-600 hover:text-purple-700 text-sm flex items-center gap-1"
         >
          <Upload className="w-4 h-4" />
          Add Item
         </button>
        )}
       </div>
       <div className="space-y-3">
        {profileData.gearRecommendations.map((gear, index) => (
         <div key={index} className="p-3 border border-slate-200 rounded-lg">
          {isEditing ? (
           <div className="space-y-2">
            <div className="flex items-center gap-2">
             <input
              type="text"
              value={gear.name}
              onChange={(e) => {
               const newGear = [...profileData.gearRecommendations]
               newGear[index] = { ...newGear[index], name: e.target.value }
               setProfileData(prev => ({ ...prev, gearRecommendations: newGear }))
              }}
              placeholder="Gear name"
              className="flex-1 border border-slate-300 rounded p-2 "
             />
             <button
              onClick={() => {
               const newGear = profileData.gearRecommendations.filter((_, i) => i !== index)
               setProfileData(prev => ({ ...prev, gearRecommendations: newGear }))
              }}
              className="text-red-500 hover:text-red-700 text-sm"
             >
              Remove
             </button>
            </div>
            <div className="flex items-center gap-2">
             <input
              type="text"
              value={gear.category}
              onChange={(e) => {
               const newGear = [...profileData.gearRecommendations]
               newGear[index] = { ...newGear[index], category: e.target.value }
               setProfileData(prev => ({ ...prev, gearRecommendations: newGear }))
              }}
              placeholder="Category"
              className="flex-1 border border-slate-300 rounded p-2 text-sm"
             />
             <input
              type="text"
              value={gear.link}
              onChange={(e) => {
               const newGear = [...profileData.gearRecommendations]
               newGear[index] = { ...newGear[index], link: e.target.value }
               setProfileData(prev => ({ ...prev, gearRecommendations: newGear }))
              }}
              placeholder="Link URL"
              className="flex-1 border border-slate-300 rounded p-2 text-sm"
             />
            </div>
            <input
             type="text"
             value={gear.description || ''}
             onChange={(e) => {
              const newGear = [...profileData.gearRecommendations]
              newGear[index] = { ...newGear[index], description: e.target.value }
              setProfileData(prev => ({ ...prev, gearRecommendations: newGear }))
             }}
             placeholder="Description (why you recommend this)"
             className="w-full border border-slate-300 rounded p-2 text-sm"
            />
           </div>
          ) : (
           <div className="flex items-center justify-between">
            <div className="flex-1">
             <div className=" text-slate-900">{gear.name}</div>
             <div className="text-sm text-slate-500">{gear.category}</div>
             {gear.description && (
              <div className="text-sm text-slate-600 mt-1">{gear.description}</div>
             )}
            </div>
            <ExternalLink className="w-4 h-4 text-slate-400 hover:text-slate-600 cursor-pointer" />
           </div>
          )}
         </div>
        ))}
       </div>
       </div>
      )}

      {/* Social Links - Only for creators/coaches */}
      {role === 'creator' && (
      <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6">
       <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 bg-gradient-to-r from-sky-blue to-black rounded-lg flex items-center justify-center">
         <Globe className="w-4 h-4 text-white" />
        </div>
        <h3 className="text-lg  font-heading" style={{ color: '#000000' }}>Social Links</h3>
       </div>
       <div className="space-y-3">
        <div className="flex items-center gap-3">
         <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-orange-500 rounded-lg flex items-center justify-center">
          <Instagram className="w-4 h-4 text-white" />
         </div>
         {isEditing ? (
          <input
           type="text"
           value={profileData.socialLinks.instagram}
           onChange={(e) => setProfileData(prev => ({
            ...prev,
            socialLinks: { ...prev.socialLinks, instagram: e.target.value }
           }))}
           className="flex-1 border border-slate-300 rounded p-2 text-sm"
           placeholder="@username or full URL"
          />
         ) : (
          <span className="text-slate-700">{profileData.socialLinks.instagram || 'Not added yet'}</span>
         )}
        </div>
        <div className="flex items-center gap-3">
         <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
          <Twitter className="w-4 h-4 text-white" />
         </div>
         {isEditing ? (
          <input
           type="text"
           value={profileData.socialLinks.twitter}
           onChange={(e) => setProfileData(prev => ({
            ...prev,
            socialLinks: { ...prev.socialLinks, twitter: e.target.value }
           }))}
           className="flex-1 border border-slate-300 rounded p-2 text-sm"
           placeholder="@username or full URL"
          />
         ) : (
          <span className="text-slate-700">{profileData.socialLinks.twitter || 'Not added yet'}</span>
         )}
        </div>
        <div className="flex items-center gap-3">
         <div className="w-8 h-8 bg-blue-700 rounded-lg flex items-center justify-center">
          <Linkedin className="w-4 h-4 text-white" />
         </div>
         {isEditing ? (
          <input
           type="text"
           value={profileData.socialLinks.linkedin}
           onChange={(e) => setProfileData(prev => ({
            ...prev,
            socialLinks: { ...prev.socialLinks, linkedin: e.target.value }
           }))}
           className="flex-1 border border-slate-300 rounded p-2 text-sm"
           placeholder="LinkedIn profile URL"
          />
         ) : (
          <span className="text-slate-700">{profileData.socialLinks.linkedin || 'Not added yet'}</span>
         )}
        </div>
        <div className="flex items-center gap-3">
         <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
          <Youtube className="w-4 h-4 text-white" />
         </div>
         {isEditing ? (
          <input
           type="text"
           value={profileData.socialLinks.youtube}
           onChange={(e) => setProfileData(prev => ({
            ...prev,
            socialLinks: { ...prev.socialLinks, youtube: e.target.value }
           }))}
           className="flex-1 border border-slate-300 rounded p-2 text-sm"
           placeholder="YouTube channel URL"
          />
         ) : (
          <span className="text-slate-700">{profileData.socialLinks.youtube || 'Not added yet'}</span>
         )}
        </div>
        <div className="flex items-center gap-3">
         <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
          <TikTokIcon size={16} className="text-white" />
         </div>
         {isEditing ? (
          <input
           type="text"
           value={profileData.socialLinks.tiktok}
           onChange={(e) => setProfileData(prev => ({
            ...prev,
            socialLinks: { ...prev.socialLinks, tiktok: e.target.value }
           }))}
           className="flex-1 border border-slate-300 rounded p-2 text-sm"
           placeholder="@username or full URL"
          />
         ) : (
          <span className="text-slate-700">{profileData.socialLinks.tiktok || 'Not added yet'}</span>
         )}
        </div>
        <div className="flex items-center gap-3">
         <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
          <DiscordIcon size={16} className="text-white" />
         </div>
         {isEditing ? (
          <input
           type="text"
           value={profileData.socialLinks.discord}
           onChange={(e) => setProfileData(prev => ({
            ...prev,
            socialLinks: { ...prev.socialLinks, discord: e.target.value }
           }))}
           className="flex-1 border border-slate-300 rounded p-2 text-sm"
           placeholder="Discord username or server invite"
          />
         ) : (
          <span className="text-slate-700">{profileData.socialLinks.discord || 'Not added yet'}</span>
         )}
        </div>
        <div className="flex items-center gap-3">
         <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
          <Globe className="w-4 h-4 text-white" />
         </div>
         {isEditing ? (
          <input
           type="text"
           value={profileData.socialLinks.website}
           onChange={(e) => setProfileData(prev => ({
            ...prev,
            socialLinks: { ...prev.socialLinks, website: e.target.value }
           }))}
           className="flex-1 border border-slate-300 rounded p-2 text-sm"
           placeholder="Website URL"
          />
         ) : (
          <span className="text-slate-700">{profileData.socialLinks.website || 'Not added yet'}</span>
         )}
        </div>
       </div>
      </div>
      )}

      {/* Coach-Specific Sections */}
      {role === 'creator' && (
       <>
        {/* AI Voice Capture Section */}
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl shadow-lg border border-blue-200 p-8">
         <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
           <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
            <Mic className="w-4 h-4 text-white" />
           </div>
           <h3 className="text-xl text-dark font-heading">AI Voice Capture</h3>
          </div>
          {profileData.voiceCaptureCompleteness !== 'none' && (
           <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-sm text-green-700 font-medium capitalize">
             {profileData.voiceCaptureCompleteness} Capture Complete
            </span>
           </div>
          )}
         </div>

         <div className="space-y-4">
          <p className="text-dark/70 leading-relaxed">
           Enhance your AI coaching with personalized voice capture. Help our AI understand your unique coaching style,
           communication patterns, and teaching approach for more authentic responses.
          </p>

          {profileData.voiceCaptureCompleteness === 'none' ? (
           <div className="flex flex-col sm:flex-row gap-3">
            <button
             onClick={() => {
              setVoiceCaptureMode('quick')
              setShowVoiceCapture(true)
             }}
             className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg"
            >
             <Mic className="w-4 h-4" />
             ⚡ Quick Voice Capture (5-7 min)
            </button>
            <button
             onClick={() => {
              setVoiceCaptureMode('detailed')
              setShowVoiceCapture(true)
             }}
             className="flex items-center gap-2 px-4 py-3 border-2 border-purple-600 text-purple-600 rounded-xl hover:bg-purple-50 transition-all"
            >
             <MessageSquare className="w-4 h-4" />
             📚 Detailed Voice Capture (12-15 min)
            </button>
           </div>
          ) : (
           <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex items-center gap-2 px-4 py-3 bg-green-50 text-green-700 rounded-xl border border-green-200">
             <CheckCircle className="w-4 h-4" />
             Voice capture completed ({profileData.voiceCaptureCompleteness})
            </div>
            <button
             onClick={() => {
              setVoiceCaptureMode('detailed')
              setShowVoiceCapture(true)
             }}
             className="flex items-center gap-2 px-4 py-3 border-2 border-sky-blue text-sky-blue rounded-xl hover:bg-sky-blue/5 transition-all"
            >
             <Upload className="w-4 h-4" />
             Enhance Voice Profile
            </button>
           </div>
          )}
         </div>
        </div>

        {/* Coaching Philosophy Section */}
        <div className="bg-gradient-to-br from-white to-black/5 rounded-2xl shadow-lg border border-white/50 p-8">
         <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 bg-gradient-to-r from-black to-sky-blue rounded-lg flex items-center justify-center">
           <Trophy className="w-4 h-4 text-white" />
          </div>
          <h3 className="text-xl text-dark font-heading">Coaching Philosophy</h3>
         </div>

         {isEditing ? (
          <div className="space-y-4">
           <div>
            <label className="block text-sm  text-dark mb-2">Philosophy Title</label>
            <input
             type="text"
             value={profileData.philosophy.title}
             onChange={(e) => setProfileData(prev => ({
              ...prev,
              philosophy: { ...prev.philosophy, title: e.target.value }
             }))}
             className="w-full border-2 border-sky-blue/20 bg-white/80 rounded-xl p-3 text-dark placeholder-dark/50 focus:border-sky-blue focus:ring-4 focus:ring-sky-blue/20 transition-all backdrop-blur-sm"
             placeholder="e.g., Excellence Through Mental Mastery"
            />
           </div>

           <div>
            <label className="block text-sm  text-dark mb-2">Philosophy Description</label>
            <textarea
             value={profileData.philosophy.description}
             onChange={(e) => setProfileData(prev => ({
              ...prev,
              philosophy: { ...prev.philosophy, description: e.target.value }
             }))}
             className="w-full border-2 border-sky-blue/20 bg-white/80 rounded-xl p-4 text-dark placeholder-dark/50 focus:border-sky-blue focus:ring-4 focus:ring-sky-blue/20 transition-all backdrop-blur-sm resize-none"
             rows={4}
             placeholder="Describe your coaching philosophy and approach..."
            />
           </div>

           <div>
            <label className="block text-sm  text-dark mb-2">Coaching Tagline</label>
            <input
             type="text"
             value={profileData.tagline}
             onChange={(e) => setProfileData(prev => ({ ...prev, tagline: e.target.value }))}
             className="w-full border-2 border-sky-blue/20 bg-white/80 rounded-xl p-3 text-dark placeholder-dark/50 focus:border-sky-blue focus:ring-4 focus:ring-sky-blue/20 transition-all backdrop-blur-sm"
             placeholder="e.g., Elevating mental game through tactical intelligence"
             maxLength={120}
            />
           </div>

           <div>
            <label className="block text-sm  text-dark mb-2">Credentials & Certifications</label>
            <textarea
             value={profileData.coachingCredentials}
             onChange={(e) => setProfileData(prev => ({ ...prev, coachingCredentials: e.target.value }))}
             className="w-full border-2 border-sky-blue/20 bg-white/80 rounded-xl p-3 text-dark placeholder-dark/50 focus:border-sky-blue focus:ring-4 focus:ring-sky-blue/20 transition-all backdrop-blur-sm resize-none"
             rows={3}
             placeholder="List your coaching credentials, certifications, and professional background..."
            />
           </div>
          </div>
         ) : (
          <div className="space-y-4">
           {profileData.tagline && (
            <div className="bg-sky-blue/10 rounded-xl p-4 border border-sky-blue/20">
             <p className="text-lg  text-dark italic">"{profileData.tagline}"</p>
            </div>
           )}

           {profileData.philosophy.title && (
            <div>
             <h4 className="text-xl text-dark mb-2">{profileData.philosophy.title}</h4>
             {profileData.philosophy.description && (
              <p className="text-dark/70 leading-relaxed">{profileData.philosophy.description}</p>
             )}
            </div>
           )}

           {profileData.coachingCredentials && (
            <div>
             <h5 className=" text-dark mb-2">Credentials & Certifications</h5>
             <p className="text-dark/70">{profileData.coachingCredentials}</p>
            </div>
           )}

           {!profileData.philosophy.title && !profileData.tagline && !profileData.coachingCredentials && (
            <p className="text-dark/50 text-center py-6">Click "Edit Profile" to add your coaching philosophy and credentials</p>
           )}
          </div>
         )}
        </div>

        {/* Assistant Coach Management */}
        <AssistantCoachManager
         coachId={user?.uid || ''}
         currentAssistants={profileData.assistantCoaches}
         onUpdate={() => {
          // Reload profile data when assistants are updated
          if (user?.uid && role) {
           // Trigger a reload - you could implement a more sophisticated state update
           window.location.reload()
          }
         }}
        />

        {/* Coach Stats */}
        <div className="bg-gradient-to-br from-white to-green/5 rounded-2xl shadow-lg border border-white/50 p-8">
         <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 bg-gradient-to-r from-green to-green/80 rounded-lg flex items-center justify-center">
           <Star className="w-4 h-4 text-white" />
          </div>
          <h3 className="text-xl text-dark font-heading">Coaching Impact</h3>
         </div>

         <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center">
           <div className="text-3xl text-green mb-2">{profileData.lessonCount}</div>
           <div className="text-sm text-dark/60">Published Lessons</div>
          </div>
          <div className="text-center">
           <div className="text-3xl text-sky-blue mb-2">{profileData.studentsHelped}</div>
           <div className="text-sm text-dark/60">Students Helped</div>
          </div>
          <div className="text-center">
           <div className="text-3xl text-black mb-2">{profileData.averageRating.toFixed(1)}★</div>
           <div className="text-sm text-dark/60">Average Rating</div>
          </div>
          <div className="text-center">
           <div className="text-3xl text-orange mb-2">{profileData.assistantCoaches.length}</div>
           <div className="text-sm text-dark/60">Assistant Coaches</div>
          </div>
         </div>

         {/* Badges */}
         {profileData.badges.length > 0 && (
          <div className="mt-6 pt-6 border-t border-dark/10">
           <h4 className=" text-dark mb-3">Achievements & Badges</h4>
           <div className="flex flex-wrap gap-2">
            {profileData.badges.map((badge, index) => (
             <span
              key={index}
              className="px-3 py-1 bg-gradient-to-r from-black/20 to-sky-blue/20 text-black rounded-full text-sm  border border-black/30"
             >
              {badge}
             </span>
            ))}
           </div>
          </div>
         )}
        </div>
       </>
      )}
     </div>
    </div>
   </div>

   {/* Voice Capture Modal */}
   {showVoiceCapture && (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
     <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-auto">
      <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b p-4 flex items-center justify-between">
       <h2 className="text-xl font-heading text-dark">AI Voice Capture</h2>
       <button
        onClick={() => {
         setShowVoiceCapture(false)
         setVoiceCaptureMode(null)
        }}
        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
       >
        <ArrowLeft className="w-5 h-5" />
       </button>
      </div>
      <div className="p-6">
       {voiceCaptureMode === 'quick' ? (
        <StreamlinedVoiceCapture
         onComplete={handleVoiceCaptureComplete}
         onProgress={(progress) => {
          console.log('Voice capture progress:', progress)
         }}
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
         onProgress={(progress) => {
          console.log('Voice capture progress:', progress)
         }}
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