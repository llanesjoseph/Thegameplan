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
  Settings as SettingsIcon,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Instagram,
  Twitter,
  Linkedin,
  Youtube,
  Globe
} from 'lucide-react'

export default function ProfilePage() {
  const { user } = useAuth()
  const { role, loading } = useEnhancedRole()
  const [isEditing, setIsEditing] = useState(false)
  const [saveStatus, setSaveStatus] = useState<string | null>(null) // 'saving', 'success', 'error'
  const [profileData, setProfileData] = useState({
    displayName: user?.displayName || '',
    bio: '',
    location: '',
    phone: '',
    email: user?.email || '',
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
      tiktok: ''
    },
    preferences: {
      profileVisibility: 'public',
      allowDirectBooking: true,
      showContactInfo: true
    }
  })

  // Load profile data from database on component mount
  useEffect(() => {
    const loadProfile = async () => {
      if (user?.uid) {
        try {
          // Use different collections based on role
          const collection = role === 'creator' ? 'creator_profiles' : 'users'
          const docRef = doc(db, collection, user.uid)
          const docSnap = await getDoc(docRef)
          
          if (docSnap.exists()) {
            const savedProfile = docSnap.data()
            setProfileData(prev => ({ ...prev, ...savedProfile }))
            return
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
            setProfileData(prev => ({ ...prev, ...parsedProfile }))
          }
        } catch (error) {
          console.error('Error loading from localStorage:', error)
        }
      }
    }

    loadProfile()
  }, [user?.uid, role])

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
          <h1 className="text-2xl font-bold mb-4">Sign In Required</h1>
          <p className="text-brand-grey mb-6">Please sign in to access your profile.</p>
          <Link href="/dashboard" className="btn btn-accent">
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
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
        
        console.log('Profile saved to Firestore successfully')
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
        
        console.log('Profile saved to localStorage successfully')
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
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="p-2 hover:bg-white rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-3xl font-bold text-slate-900">
              {role === 'creator' ? 'Coach Profile' : 'Athlete Profile'}
            </h1>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Save Status Indicator */}
            {saveStatus && (
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
                saveStatus === 'saving' ? 'bg-blue-100 text-blue-700' :
                saveStatus === 'success' ? 'bg-green-100 text-green-700' :
                'bg-red-100 text-red-700'
              }`}>
                {saveStatus === 'saving' && (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-700"></div>
                    Saving...
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
                  className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                  disabled={saveStatus === 'saving'}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saveStatus === 'saving'}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
              >
                <SettingsIcon className="w-4 h-4" />
                Edit Profile
              </button>
            )}
          </div>
        </div>

        {/* Profile Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 mb-8">
          <div className="flex items-start gap-6">
            <div className="relative">
              <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                {profileData.displayName?.charAt(0) || 'J'}
              </div>
              {isEditing && (
                <button
                  type="button"
                  onClick={() => alert('Avatar upload feature coming soon!')}
                  className="absolute -bottom-1 -right-1 w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white hover:bg-purple-700 transition-colors"
                >
                  <Camera className="w-4 h-4" />
                </button>
              )}
            </div>
            
            <div className="flex-1">
              {isEditing ? (
                <div className="space-y-4">
                  <input
                    type="text"
                    value={profileData.displayName}
                    onChange={(e) => setProfileData(prev => ({ ...prev, displayName: e.target.value }))}
                    className="text-2xl font-bold w-full border border-slate-300 rounded-lg p-2"
                    placeholder="Your Name"
                  />
                  <textarea
                    value={profileData.bio}
                    onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                    className="w-full border border-slate-300 rounded-lg p-3"
                    rows={3}
                    placeholder="Tell us about your athletic background and coaching expertise..."
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      value={profileData.location}
                      onChange={(e) => setProfileData(prev => ({ ...prev, location: e.target.value }))}
                      className="border border-slate-300 rounded-lg p-2"
                      placeholder="Location (e.g., Los Angeles, CA)"
                    />
                    <input
                      type="text"
                      value={profileData.experience}
                      onChange={(e) => setProfileData(prev => ({ ...prev, experience: e.target.value }))}
                      className="border border-slate-300 rounded-lg p-2"
                      placeholder="Experience (e.g., 12 years)"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                      className="border border-slate-300 rounded-lg p-2"
                      placeholder="Email address"
                    />
                    <input
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                      className="border border-slate-300 rounded-lg p-2"
                      placeholder="Phone number"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">{profileData.displayName}</h2>
                  <p className="text-slate-600 mb-4">{profileData.bio}</p>
                  <div className="flex items-center gap-4 text-sm text-slate-500 flex-wrap">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {profileData.location}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {profileData.experience} experience
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
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900">
                  {role === 'creator' ? 'Sports Specialties' : 'Sports Interests'}
                </h3>
              </div>

              {role === 'creator' ? (
                // Coach specialties - allow custom text inputs plus sport selection
                <>
                  <div className="space-y-4">
                    {/* Sport Checkboxes for Coaches too */}
                    {isEditing && (
                      <div>
                        <h4 className="text-sm font-medium text-slate-700 mb-3">Core Sports</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                          {['Soccer', 'Basketball', 'Tennis', 'Baseball', 'Football'].map((sport) => (
                            <label key={sport} className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={profileData.specialties.includes(sport)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setProfileData(prev => ({
                                      ...prev,
                                      specialties: [...prev.specialties, sport]
                                    }))
                                  } else {
                                    setProfileData(prev => ({
                                      ...prev,
                                      specialties: prev.specialties.filter(s => s !== sport)
                                    }))
                                  }
                                }}
                                className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                              />
                              <span className="text-sm text-slate-700">{sport}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Custom Specialties for Coaches */}
                    {isEditing && (
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-sm font-medium text-slate-700">Additional Specialties</h4>
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
                        {profileData.specialties.map((specialty, index) => (
                          <span key={index} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                            {specialty}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                // Athlete sports interests - use checkbox selection only
                <>
                  {isEditing ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {['Soccer', 'Basketball', 'Tennis', 'Baseball', 'Football'].map((sport) => (
                        <label key={sport} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={profileData.specialties.includes(sport)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setProfileData(prev => ({
                                  ...prev,
                                  specialties: [...prev.specialties, sport]
                                }))
                              } else {
                                setProfileData(prev => ({
                                  ...prev,
                                  specialties: prev.specialties.filter(s => s !== sport)
                                }))
                              }
                            }}
                            className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                          />
                          <span className="text-sm text-slate-700">{sport}</span>
                        </label>
                      ))}
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
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900">Certifications</h3>
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
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Coaching Details</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Availability</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={profileData.availability}
                      onChange={(e) => setProfileData(prev => ({ ...prev, availability: e.target.value }))}
                      className="w-full border border-slate-300 rounded p-2"
                      placeholder="e.g., Weekends and Evenings"
                    />
                  ) : (
                    <span className="text-slate-700">{profileData.availability}</span>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Languages</label>
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
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Coaching Philosophy</h3>
              {isEditing ? (
                <textarea
                  value={profileData.coachingPhilosophy}
                  onChange={(e) => setProfileData(prev => ({ ...prev, coachingPhilosophy: e.target.value }))}
                  className="w-full border border-slate-300 rounded p-3"
                  rows={4}
                  placeholder="Describe your coaching philosophy and approach..."
                />
              ) : (
                <p className="text-slate-700">{profileData.coachingPhilosophy}</p>
              )}
              </div>
            )}

            {/* Achievements */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900">Achievements & Awards</h3>
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
                  {profileData.achievements.map((achievement, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <Award className="w-4 h-4 text-yellow-500" />
                      <span className="text-slate-700">{achievement}</span>
                    </div>
                  ))}
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
                <h3 className="text-lg font-semibold text-slate-900">Gear Recommendations</h3>
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
                            className="flex-1 border border-slate-300 rounded p-2 font-medium"
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
                          <div className="font-medium text-slate-900">{gear.name}</div>
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

            {/* Social Links */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Social Links</h3>
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
                    <Video className="w-4 h-4 text-white" />
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

            {/* Profile Preferences */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Profile Settings</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-slate-900">Profile Visibility</div>
                    <div className="text-sm text-slate-500">Who can see your profile</div>
                  </div>
                  {isEditing ? (
                    <select
                      value={profileData.preferences.profileVisibility}
                      onChange={(e) => setProfileData(prev => ({ 
                        ...prev, 
                        preferences: { ...prev.preferences, profileVisibility: e.target.value }
                      }))}
                      className="border border-slate-300 rounded p-2"
                    >
                      <option value="public">Public</option>
                      <option value="private">Private</option>
                      <option value="members">Members Only</option>
                    </select>
                  ) : (
                    <span className="capitalize text-slate-700">{profileData.preferences.profileVisibility}</span>
                  )}
                </div>
                
                {/* Creator-only settings */}
                {role === 'creator' && (
                  <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-slate-900">Direct Booking</div>
                    <div className="text-sm text-slate-500">Allow students to book sessions directly</div>
                  </div>
                  {isEditing ? (
                    <input
                      type="checkbox"
                      checked={profileData.preferences.allowDirectBooking}
                      onChange={(e) => setProfileData(prev => ({ 
                        ...prev, 
                        preferences: { ...prev.preferences, allowDirectBooking: e.target.checked }
                      }))}
                      className="w-4 h-4"
                    />
                  ) : (
                    <span className="text-slate-700">{profileData.preferences.allowDirectBooking ? 'Enabled' : 'Disabled'}</span>
                  )}
                  </div>
                )}
                
                {role === 'creator' && (
                  <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-slate-900">Show Contact Info</div>
                    <div className="text-sm text-slate-500">Display email and phone to students</div>
                  </div>
                  {isEditing ? (
                    <input
                      type="checkbox"
                      checked={profileData.preferences.showContactInfo}
                      onChange={(e) => setProfileData(prev => ({ 
                        ...prev, 
                        preferences: { ...prev.preferences, showContactInfo: e.target.checked }
                      }))}
                      className="w-4 h-4"
                    />
                  ) : (
                    <span className="text-slate-700">{profileData.preferences.showContactInfo ? 'Visible' : 'Hidden'}</span>
                  )}
                  </div>
                )}
                
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}