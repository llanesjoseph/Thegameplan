'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { db } from '@/lib/firebase.client'
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import {
 User,
 Calendar,
 Trophy,
 Target,
 ChevronRight,
 ChevronLeft,
 CheckCircle,
 Sparkles
} from 'lucide-react'
import ClarityButton from '@/components/ui/NexusButton'

interface OnboardingData {
 firstName: string
 lastName: string
 displayName: string
 primarySport: string
 experienceLevel: 'beginner' | 'intermediate' | 'advanced' | 'elite'
 yearsExperience: string
 goals: string[]
 interests: string[]
 coachingInterest: boolean
}

const SPORTS_OPTIONS = [
 'Soccer',
 'Basketball',
 'Baseball',
 'Tennis',
 'Brazilian Jiu-Jitsu',
 'Running',
 'Volleyball',
 'Swimming',
 'American Football',
 'Golf',
 'Boxing',
 'Track & Field'
]

const GOALS_OPTIONS = [
 'Improve technique',
 'Increase fitness',
 'Compete professionally',
 'Learn fundamentals',
 'Become a coach',
 'Stay active/recreational',
 'Injury recovery',
 'Mental training'
]

const INTERESTS_OPTIONS = [
 'Video lessons',
 'Live coaching',
 'Training plans',
 'Nutrition advice',
 'Equipment reviews',
 'Community discussions',
 'Competition prep',
 'Injury prevention'
]

export default function OnboardingPage() {
 const { user } = useAuth()
 const router = useRouter()
 const [currentStep, setCurrentStep] = useState(1)
 const [loading, setLoading] = useState(false)
 const [data, setData] = useState<OnboardingData>({
  firstName: '',
  lastName: '',
  displayName: '',
  primarySport: '',
  experienceLevel: 'beginner',
  yearsExperience: '',
  goals: [],
  interests: [],
  coachingInterest: false
 })

 useEffect(() => {
  if (!user) {
   router.push('/dashboard')
   return
  }

  // Pre-fill some data if available
  if (user.displayName) {
   const nameParts = user.displayName.split(' ')
   setData(prev => ({
    ...prev,
    displayName: user.displayName || '',
    firstName: nameParts[0] || '',
    lastName: nameParts.slice(1).join(' ') || ''
   }))
  }
 }, [user, router])

 const updateField = (field: keyof OnboardingData, value: any) => {
  setData(prev => ({ ...prev, [field]: value }))
 }

 const toggleArrayField = (field: 'goals' | 'interests', value: string) => {
  setData(prev => ({
   ...prev,
   [field]: prev[field].includes(value)
    ? prev[field].filter(item => item !== value)
    : [...prev[field], value]
  }))
 }

 const handleComplete = async () => {
  if (!user) return

  setLoading(true)
  try {
   // Update user profile in Firebase
   await updateDoc(doc(db, 'users', user.uid), {
    firstName: data.firstName,
    lastName: data.lastName,
    displayName: data.displayName || `${data.firstName} ${data.lastName}`,
    primarySport: data.primarySport,
    experienceLevel: data.experienceLevel,
    yearsExperience: data.yearsExperience,
    goals: data.goals,
    interests: data.interests,
    coachingInterest: data.coachingInterest,
    onboardingCompleted: true,
    onboardingCompletedAt: serverTimestamp(),
    profileComplete: true,
    lastUpdatedAt: serverTimestamp()
   })

   // Create/update profile document
   await updateDoc(doc(db, 'profiles', user.uid), {
    firstName: data.firstName,
    lastName: data.lastName,
    displayName: data.displayName || `${data.firstName} ${data.lastName}`,
    primarySport: data.primarySport,
    experienceLevel: data.experienceLevel,
    bio: `${data.experienceLevel} ${data.primarySport} athlete with ${data.yearsExperience} years of experience`,
    sports: [data.primarySport],
    goals: data.goals,
    interests: data.interests,
    isPublic: false, // Let them decide later
    updatedAt: serverTimestamp()
   })

   console.log('✅ Onboarding completed successfully')
   router.push('/dashboard?welcome=true')
  } catch (error) {
   console.error('❌ Error completing onboarding:', error)
  } finally {
   setLoading(false)
  }
 }

 const canProceed = () => {
  switch (currentStep) {
   case 1:
    return data.firstName && data.lastName
   case 2:
    return data.primarySport && data.experienceLevel && data.yearsExperience
   case 3:
    return data.goals.length > 0
   default:
    return true
  }
 }

 if (!user) {
  return <div className="min-h-screen flex items-center justify-center">Loading...</div>
 }

 return (
  <div className="min-h-screen bg-gradient-to-br from-cream to-sky-blue/10 flex items-center justify-center p-4">
   <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-sky-blue/20 overflow-hidden">

    {/* Header */}
    <div className="bg-gradient-to-r from-sky-blue to-green text-white p-6">
     <div className="flex items-center gap-3 mb-4">
      <Sparkles className="w-8 h-8" />
      <h1 className="text-2xl ">Welcome to PLAYBOOKD!</h1>
     </div>
     <p className="text-sky-100">Let&apos;s set up your profile to personalize your experience</p>

     {/* Progress Bar */}
     <div className="mt-6">
      <div className="flex justify-between text-sm text-sky-100 mb-2">
       <span>Step {currentStep} of 4</span>
       <span>{Math.round((currentStep / 4) * 100)}% Complete</span>
      </div>
      <div className="w-full bg-sky-blue/30 rounded-full h-2">
       <div
        className="bg-white rounded-full h-2 transition-all duration-300"
        style={{ width: `${(currentStep / 4) * 100}%` }}
       ></div>
      </div>
     </div>
    </div>

    {/* Content */}
    <div className="p-8">
     {/* Step 1: Basic Information */}
     {currentStep === 1 && (
      <div className="space-y-6">
       <div className="text-center mb-8">
        <User className="w-16 h-16 text-sky-blue mx-auto mb-4" />
        <h2 className="text-2xl text-dark mb-2">Tell us about yourself</h2>
        <p className="text-gray-600">We&apos;ll use this to personalize your PLAYBOOKD experience</p>
       </div>

       <div className="grid md:grid-cols-2 gap-6">
        <div>
         <label className="block text-sm  text-gray-700 mb-2">
          First Name *
         </label>
         <input
          type="text"
          value={data.firstName}
          onChange={(e) => updateField('firstName', e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-blue focus:border-sky-blue"
          placeholder="Enter your first name"
         />
        </div>

        <div>
         <label className="block text-sm  text-gray-700 mb-2">
          Last Name *
         </label>
         <input
          type="text"
          value={data.lastName}
          onChange={(e) => updateField('lastName', e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-blue focus:border-sky-blue"
          placeholder="Enter your last name"
         />
        </div>
       </div>

       <div>
        <label className="block text-sm  text-gray-700 mb-2">
         Display Name
        </label>
        <input
         type="text"
         value={data.displayName}
         onChange={(e) => updateField('displayName', e.target.value)}
         className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-blue focus:border-sky-blue"
         placeholder="How should we display your name? (Optional)"
        />
        <p className="text-sm text-gray-500 mt-1">Leave blank to use &quot;First Last&quot;</p>
       </div>
      </div>
     )}

     {/* Step 2: Sports Background */}
     {currentStep === 2 && (
      <div className="space-y-6">
       <div className="text-center mb-8">
        <Trophy className="w-16 h-16 text-sky-blue mx-auto mb-4" />
        <h2 className="text-2xl text-dark mb-2">Your Sports Background</h2>
        <p className="text-gray-600">Help us understand your athletic experience</p>
       </div>

       <div>
        <label className="block text-sm  text-gray-700 mb-2">
         Primary Sport *
        </label>
        <select
         value={data.primarySport}
         onChange={(e) => updateField('primarySport', e.target.value)}
         className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-blue focus:border-sky-blue"
        >
         <option value="">Select your primary sport</option>
         {SPORTS_OPTIONS.map(sport => (
          <option key={sport} value={sport}>{sport}</option>
         ))}
        </select>
       </div>

       <div className="grid md:grid-cols-2 gap-6">
        <div>
         <label className="block text-sm  text-gray-700 mb-2">
          Experience Level *
         </label>
         <select
          value={data.experienceLevel}
          onChange={(e) => updateField('experienceLevel', e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-blue focus:border-sky-blue"
         >
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
          <option value="elite">Elite/Professional</option>
         </select>
        </div>

        <div>
         <label className="block text-sm  text-gray-700 mb-2">
          Years of Experience *
         </label>
         <select
          value={data.yearsExperience}
          onChange={(e) => updateField('yearsExperience', e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-blue focus:border-sky-blue"
         >
          <option value="">Select years</option>
          <option value="Less than 1 year">Less than 1 year</option>
          <option value="1-2 years">1-2 years</option>
          <option value="3-5 years">3-5 years</option>
          <option value="6-10 years">6-10 years</option>
          <option value="10+ years">10+ years</option>
         </select>
        </div>
       </div>
      </div>
     )}

     {/* Step 3: Goals */}
     {currentStep === 3 && (
      <div className="space-y-6">
       <div className="text-center mb-8">
        <Target className="w-16 h-16 text-sky-blue mx-auto mb-4" />
        <h2 className="text-2xl text-dark mb-2">What are your goals?</h2>
        <p className="text-gray-600">Select all that apply to help us recommend content</p>
       </div>

       <div className="grid md:grid-cols-2 gap-3">
        {GOALS_OPTIONS.map(goal => (
         <button
          key={goal}
          onClick={() => toggleArrayField('goals', goal)}
          className={`p-4 text-left border-2 rounded-lg transition-all ${
           data.goals.includes(goal)
            ? 'border-sky-blue bg-sky-blue/10 text-sky-blue'
            : 'border-gray-200 hover:border-sky-blue/50'
          }`}
         >
          <div className="flex items-center justify-between">
           <span className="">{goal}</span>
           {data.goals.includes(goal) && (
            <CheckCircle className="w-5 h-5 text-sky-blue" />
           )}
          </div>
         </button>
        ))}
       </div>
      </div>
     )}

     {/* Step 4: Interests & Coaching */}
     {currentStep === 4 && (
      <div className="space-y-6">
       <div className="text-center mb-8">
        <Calendar className="w-16 h-16 text-sky-blue mx-auto mb-4" />
        <h2 className="text-2xl text-dark mb-2">What interests you most?</h2>
        <p className="text-gray-600">Help us curate the perfect content for you</p>
       </div>

       <div>
        <h3 className=" text-gray-900 mb-4">Content Interests</h3>
        <div className="grid md:grid-cols-2 gap-3">
         {INTERESTS_OPTIONS.map(interest => (
          <button
           key={interest}
           onClick={() => toggleArrayField('interests', interest)}
           className={`p-3 text-left border-2 rounded-lg transition-all ${
            data.interests.includes(interest)
             ? 'border-sky-blue bg-sky-blue/10 text-sky-blue'
             : 'border-gray-200 hover:border-sky-blue/50'
           }`}
          >
           <div className="flex items-center justify-between">
            <span>{interest}</span>
            {data.interests.includes(interest) && (
             <CheckCircle className="w-4 h-4 text-sky-blue" />
            )}
           </div>
          </button>
         ))}
        </div>
       </div>

       <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className=" text-gray-900 mb-3">Coaching Interest</h3>
        <label className="flex items-center gap-3 cursor-pointer">
         <input
          type="checkbox"
          checked={data.coachingInterest}
          onChange={(e) => updateField('coachingInterest', e.target.checked)}
          className="w-5 h-5 text-sky-blue border-2 border-gray-300 rounded focus:ring-sky-blue"
         />
         <span>I&apos;m interested in creating coaching content and lessons</span>
        </label>
        <p className="text-sm text-gray-600 mt-2">
         Check this if you&apos;d like to become a content creator on PLAYBOOKD
        </p>
       </div>
      </div>
     )}

     {/* Navigation */}
     <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
      <ClarityButton
       variant="ghost"
       onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
       disabled={currentStep === 1}
       className="flex items-center gap-2"
      >
       <ChevronLeft className="w-4 h-4" />
       Previous
      </ClarityButton>

      {currentStep < 4 ? (
       <ClarityButton
        variant="primary"
        onClick={() => setCurrentStep(prev => prev + 1)}
        disabled={!canProceed()}
        className="flex items-center gap-2"
       >
        Next
        <ChevronRight className="w-4 h-4" />
       </ClarityButton>
      ) : (
       <ClarityButton
        variant="primary"
        onClick={handleComplete}
        disabled={loading || data.goals.length === 0}
        className="flex items-center gap-2"
       >
        {loading ? 'Saving...' : 'Complete Setup'}
        <CheckCircle className="w-4 h-4" />
       </ClarityButton>
      )}
     </div>
    </div>
   </div>
  </div>
 )
}