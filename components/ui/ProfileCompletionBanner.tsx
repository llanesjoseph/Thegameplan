'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { db } from '@/lib/firebase.client'
import { doc, getDoc } from 'firebase/firestore'
import { useRouter } from 'next/navigation'
import { X, User, AlertCircle, ArrowRight } from 'lucide-react'
import ClarityButton from './NexusButton'

interface UserProfile {
 firstName?: string
 lastName?: string
 displayName?: string
 primarySport?: string
 specialties?: string[]
 experienceLevel?: string
 experience?: string
 location?: string
 bio?: string
 onboardingCompleted?: boolean
 profileComplete?: boolean
}

export default function ProfileCompletionBanner() {
 const { user } = useAuth()
 const router = useRouter()
 const [profile, setProfile] = useState<UserProfile | null>(null)
 const [showBanner, setShowBanner] = useState(false)
 const [, setDismissed] = useState(false)
 const [loading, setLoading] = useState(true)

 useEffect(() => {
  const checkProfile = async () => {
   if (!user) {
    setLoading(false)
    return
   }

   try {
    const userDoc = await getDoc(doc(db, 'users', user.uid))
    if (userDoc.exists()) {
     const userData = userDoc.data() as UserProfile
     setProfile(userData)

     // Check if profile is incomplete
     const hasName = userData.firstName && userData.lastName || userData.displayName
     const hasSports = userData.primarySport || (userData.specialties && userData.specialties.length > 0)
     const hasExperience = userData.experienceLevel || userData.experience
     const hasLocation = userData.location
     const hasBio = userData.bio

     const isIncomplete = !hasName || !hasSports || !hasExperience || !hasLocation || !hasBio

     // Only show banner if profile is incomplete and not dismissed
     const dismissKey = `profile-banner-dismissed-${user.uid}`
     const wasDismissed = localStorage.getItem(dismissKey) === 'true'

     setShowBanner(isIncomplete && !wasDismissed)
     setDismissed(wasDismissed)
    }
   } catch (error) {
    console.error('Error checking profile:', error)
   } finally {
    setLoading(false)
   }
  }

  checkProfile()
 }, [user])

 const handleDismiss = () => {
  if (!user) return

  const dismissKey = `profile-banner-dismissed-${user.uid}`
  localStorage.setItem(dismissKey, 'true')
  setShowBanner(false)
  setDismissed(true)
 }

 const handleCompleteProfile = () => {
  router.push('/dashboard/profile')
 }

 const getCompletionPercentage = () => {
  if (!profile) return 0

  let completed = 0
  const totalFields = 5

  // Check for name (firstName & lastName OR displayName)
  if ((profile.firstName && profile.lastName) || profile.displayName) completed++

  // Check for sports (primarySport OR specialties array)
  if (profile.primarySport || (profile.specialties && profile.specialties.length > 0)) completed++

  // Check for experience (experienceLevel OR experience)
  if (profile.experienceLevel || profile.experience) completed++

  // Check for location
  if (profile.location) completed++

  // Check for bio
  if (profile.bio) completed++

  return Math.round((completed / totalFields) * 100)
 }

 const getMissingFields = () => {
  if (!profile) return ['basic information', 'sports background', 'experience', 'location', 'bio']

  const missing = []

  // Check for name
  if (!((profile.firstName && profile.lastName) || profile.displayName)) {
   missing.push('name')
  }

  // Check for sports
  if (!(profile.primarySport || (profile.specialties && profile.specialties.length > 0))) {
   missing.push('sports interests')
  }

  // Check for experience
  if (!(profile.experienceLevel || profile.experience)) {
   missing.push('experience level')
  }

  // Check for location
  if (!profile.location) {
   missing.push('location')
  }

  // Check for bio
  if (!profile.bio) {
   missing.push('bio')
  }

  return missing
 }

 if (loading || !user || !showBanner) {
  return null
 }

 const completionPercentage = getCompletionPercentage()
 const missingFields = getMissingFields()

 return (
  <div className="sticky top-0 z-50 bg-gradient-to-r from-orange to-black text-white shadow-lg">
   <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
    <div className="flex items-center justify-between">
     <div className="flex items-center gap-4">
      <div className="flex-shrink-0">
       <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
        <User className="w-6 h-6" />
       </div>
      </div>

      <div className="flex-1">
       <div className="flex items-center gap-2 mb-1">
        <AlertCircle className="w-4 h-4" />
        <h3 className="font-semibold text-sm sm:text-base">
         Complete Your PLAYBOOKD Profile
        </h3>
       </div>

       <div className="text-xs sm:text-sm text-white/90 mb-2">
        Your profile is {completionPercentage}% complete.
        {missingFields.length > 0 && (
         <span className="ml-1">
          Missing: {missingFields.join(', ')}
         </span>
        )}
       </div>

       {/* Progress Bar */}
       <div className="w-full max-w-xs bg-white/20 rounded-full h-2">
        <div
         className="bg-white rounded-full h-2 transition-all duration-300"
         style={{ width: `${completionPercentage}%` }}
        ></div>
       </div>
      </div>
     </div>

     <div className="flex items-center gap-3">
      <ClarityButton
       variant="secondary"
       size="sm"
       onClick={handleCompleteProfile}
       className="bg-white text-orange hover:bg-white/90 border-white font-medium text-xs sm:text-sm"
      >
       <span className="hidden sm:inline">Complete Profile</span>
       <span className="sm:hidden">Complete</span>
       <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 ml-1" />
      </ClarityButton>

      <button
       onClick={handleDismiss}
       className="p-1 hover:bg-white/20 rounded-full transition-colors"
       aria-label="Dismiss"
      >
       <X className="w-4 h-4" />
      </button>
     </div>
    </div>
   </div>
  </div>
 )
}