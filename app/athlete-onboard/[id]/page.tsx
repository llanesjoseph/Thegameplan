'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import AppHeader from '@/components/ui/AppHeader'
import { SPORTS } from '@/lib/constants/sports'
import {
  CheckCircle,
  User,
  Mail,
  Trophy,
  ArrowRight,
  ArrowLeft,
  Star,
  Target,
  Clock,
  Calendar,
  Activity,
  BookOpen,
  Lock,
  Key
} from 'lucide-react'
import { auth } from '@/lib/firebase.client'
import {
  signInWithPopup,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signOut
} from 'firebase/auth'

interface InvitationData {
  id: string
  coachId: string
  athleteEmail: string
  athleteName: string
  sport: string
  customMessage: string
  status: string
  expiresAt: string
}

// Skill levels
const SKILL_LEVELS = [
  { value: 'beginner', label: 'Beginner', description: 'Just starting out' },
  { value: 'intermediate', label: 'Intermediate', description: '1-3 years experience' },
  { value: 'advanced', label: 'Advanced', description: '3+ years experience' },
  { value: 'elite', label: 'Elite', description: 'Competitive/Professional level' }
]

// Learning styles
const LEARNING_STYLES = [
  { value: 'visual', label: 'Visual Learner', description: 'Learn best through demonstrations and videos' },
  { value: 'hands-on', label: 'Hands-On', description: 'Learn best through practice and doing' },
  { value: 'analytical', label: 'Analytical', description: 'Learn best through understanding concepts and strategy' },
  { value: 'collaborative', label: 'Collaborative', description: 'Learn best through group training and teamwork' }
]

export default function AthleteOnboardingPage() {
  const params = useParams()
  const router = useRouter()
  const invitationId = params.id as string
  const [invitation, setInvitation] = useState<InvitationData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [step, setStep] = useState(1)
  const totalSteps = 4

  // Authentication state
  const [hasGoogleAccount, setHasGoogleAccount] = useState<boolean | null>(null)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [isCreatingAccount, setIsCreatingAccount] = useState(false)

  // Form data with all new fields
  const [formData, setFormData] = useState({
    // Basic Info
    firstName: '',
    lastName: '',
    email: '',

    // Athletic Profile
    primarySport: '',
    secondarySports: [] as string[],
    skillLevel: '',

    // Training Info
    trainingGoals: '',
    achievements: '',
    learningStyle: '',

    // Availability & Notes
    availability: {
      monday: { available: false, timeSlots: '' },
      tuesday: { available: false, timeSlots: '' },
      wednesday: { available: false, timeSlots: '' },
      thursday: { available: false, timeSlots: '' },
      friday: { available: false, timeSlots: '' },
      saturday: { available: false, timeSlots: '' },
      sunday: { available: false, timeSlots: '' }
    },
    specialNotes: ''
  })

  // Validation for each step
  const validateStep = (stepNumber: number): boolean => {
    switch(stepNumber) {
      case 1:
        return formData.firstName.trim() !== '' &&
               formData.lastName.trim() !== '' &&
               formData.email.trim() !== ''
      case 2:
        return formData.primarySport !== '' &&
               formData.skillLevel !== ''
      case 3:
        return formData.trainingGoals.trim() !== '' &&
               formData.learningStyle !== ''
      case 4:
        // At least one day should be selected
        return Object.values(formData.availability).some(day => day.available)
      default:
        return true
    }
  }

  useEffect(() => {
    if (invitationId) {
      fetchInvitation()
    }
  }, [invitationId])

  const fetchInvitation = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/validate-invitation?id=${invitationId}&type=athlete`)
      const data = await response.json()

      // Check if invitation was already used and should redirect
      if (data.alreadyUsed && data.shouldRedirect) {
        // Show friendly message and redirect to dashboard
        alert(data.message || 'This invitation has already been used. Your account was created successfully. Redirecting to sign in...')
        setTimeout(() => {
          router.push(data.redirectTo || '/dashboard')
        }, 2000)
        return
      }

      if (response.ok && data.success && data.invitation) {
        setInvitation(data.invitation)
        setFormData(prev => ({
          ...prev,
          email: data.invitation.athleteEmail,
          firstName: data.invitation.athleteName.split(' ')[0] || '',
          lastName: data.invitation.athleteName.split(' ').slice(1).join(' ') || '',
          primarySport: data.invitation.sport || ''
        }))
      } else {
        console.error('Invalid or expired invitation')
      }
    } catch (error) {
      console.error('Error fetching invitation:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      // Prepare availability data as a more readable format
      const availabilityData = Object.entries(formData.availability)
        .filter(([_, dayData]) => dayData.available)
        .map(([day, dayData]) => ({
          day,
          timeSlots: dayData.timeSlots || 'Flexible'
        }))

      const response = await fetch('/api/submit-athlete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invitationId,
          athleteProfile: {
            // Basic info
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            displayName: `${formData.firstName} ${formData.lastName}`,

            // Athletic profile
            primarySport: formData.primarySport,
            secondarySports: formData.secondarySports,
            skillLevel: formData.skillLevel,

            // Training info
            trainingGoals: formData.trainingGoals,
            achievements: formData.achievements,
            learningStyle: formData.learningStyle,

            // Availability
            availability: availabilityData,

            // Special notes
            specialNotes: formData.specialNotes
          }
        })
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to submit application')
      }

      console.log('Athlete profile created successfully:', result.data)
      setStep(totalSteps + 1) // Success step
    } catch (error) {
      console.error('Error submitting:', error)
      alert(error instanceof Error ? error.message : 'Failed to complete onboarding. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSecondarySporsToggle = (sport: string) => {
    setFormData(prev => ({
      ...prev,
      secondarySports: prev.secondarySports.includes(sport)
        ? prev.secondarySports.filter(s => s !== sport)
        : [...prev.secondarySports, sport]
    }))
  }

  const handleAvailabilityToggle = (day: string) => {
    setFormData(prev => ({
      ...prev,
      availability: {
        ...prev.availability,
        [day]: {
          ...prev.availability[day as keyof typeof prev.availability],
          available: !prev.availability[day as keyof typeof prev.availability].available
        }
      }
    }))
  }

  const handleTimeSlotChange = (day: string, timeSlots: string) => {
    setFormData(prev => ({
      ...prev,
      availability: {
        ...prev.availability,
        [day]: {
          ...prev.availability[day as keyof typeof prev.availability],
          timeSlots
        }
      }
    }))
  }

  // Authentication handlers
  const handleGoogleSignIn = async () => {
    setAuthError('')
    setIsCreatingAccount(true)
    try {
      const provider = new GoogleAuthProvider()
      provider.setCustomParameters({
        login_hint: formData.email,
        prompt: 'select_account'
      })

      const result = await signInWithPopup(auth, provider)
      console.log('✅ Google account created:', result.user.email)

      // Complete the athlete profile (links profile data to the account)
      console.log('🔗 Completing athlete profile...')
      const completeResponse = await fetch('/api/complete-athlete-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invitationId,
          email: formData.email,
          coachId: invitation?.coachId // 🔒 LOCKED IN: Pass coach UID directly from invitation
        })
      })

      const completeResult = await completeResponse.json()

      if (!completeResult.success) {
        throw new Error(completeResult.error || 'Failed to complete profile')
      }

      console.log('✅ Profile completed successfully')

      // Sign them out immediately
      await signOut(auth)
      console.log('🔓 Signed out - redirecting to sign-in page')

      // Show success and redirect to sign-in
      alert('Account created successfully! Please sign in to continue.')
      router.push('/')
    } catch (error: any) {
      console.error('❌ Google sign-in error:', error)
      setAuthError(error.message || 'Failed to create account with Google. Please try again.')
    } finally {
      setIsCreatingAccount(false)
    }
  }

  const handlePasswordSignUp = async () => {
    setAuthError('')

    // Validation
    if (!password || password.length < 6) {
      setAuthError('Password must be at least 6 characters long')
      return
    }

    if (password !== confirmPassword) {
      setAuthError('Passwords do not match')
      return
    }

    setIsCreatingAccount(true)
    try {
      const result = await createUserWithEmailAndPassword(auth, formData.email, password)
      console.log('✅ Email/password account created:', result.user.email)

      // Complete the athlete profile (links profile data to the account)
      console.log('🔗 Completing athlete profile...')
      const completeResponse = await fetch('/api/complete-athlete-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invitationId,
          email: formData.email,
          coachId: invitation?.coachId // 🔒 LOCKED IN: Pass coach UID directly from invitation
        })
      })

      const completeResult = await completeResponse.json()

      if (!completeResult.success) {
        throw new Error(completeResult.error || 'Failed to complete profile')
      }

      console.log('✅ Profile completed successfully')

      // Sign them out immediately
      await signOut(auth)
      console.log('🔓 Signed out - redirecting to sign-in page')

      // Show success and redirect to sign-in
      alert('Account created successfully! Please sign in with your new password.')
      router.push('/')
    } catch (error: any) {
      console.error('❌ Password sign-up error:', error)
      let errorMessage = 'Failed to create account. Please try again.'

      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'An account with this email already exists. Please sign in instead.'
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak. Please use a stronger password.'
      }

      setAuthError(errorMessage)
    } finally {
      setIsCreatingAccount(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#E8E6D8' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading invitation...</p>
        </div>
      </div>
    )
  }

  if (!invitation) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#E8E6D8' }}>
        <AppHeader />
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="max-w-md mx-auto">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Invalid Invitation</h1>
            <p className="text-gray-600 mb-6">
              This invitation link is invalid or has expired. Please contact your coach for a new invitation.
            </p>
            <Button onClick={() => router.push('/')}>
              Return to Home
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#E8E6D8' }}>
      <AppHeader />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">

          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Your Athlete Profile</h1>
            <p className="text-gray-600">Help your coach understand your training needs and goals</p>
          </div>

          {/* Progress Bar */}
          {step <= totalSteps && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Step {step} of {totalSteps}</span>
                <span className="text-sm text-gray-500">{Math.round((step / totalSteps) * 100)}% Complete</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(step / totalSteps) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Invitation Details */}
          {step <= totalSteps && (
            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <Trophy className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Training Invitation</h3>
                    <p className="text-gray-600">{invitation.sport} Training Program</p>
                    {invitation.customMessage && (
                      <p className="text-sm text-gray-500 mt-1">{invitation.customMessage}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 1: Basic Information */}
          {step === 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Basic Information
                </CardTitle>
                <CardDescription>Let's start with your basic details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">First Name *</label>
                    <Input
                      value={formData.firstName}
                      onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                      placeholder="John"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Last Name *</label>
                    <Input
                      value={formData.lastName}
                      onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                      placeholder="Smith"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Email (From Invitation)</label>
                  <Input
                    type="email"
                    value={formData.email}
                    disabled
                    className="bg-gray-50 text-gray-600 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500 mt-1">This email is locked to your invitation and cannot be changed</p>
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={() => setStep(2)}
                    disabled={!validateStep(1)}
                    className="flex items-center gap-2"
                  >
                    Next <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Athletic Profile */}
          {step === 2 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Athletic Profile
                </CardTitle>
                <CardDescription>Tell us about your sports experience</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Primary Sport *</label>
                  <select
                    value={formData.primarySport}
                    onChange={(e) => setFormData({...formData, primarySport: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    required
                  >
                    <option value="">Select your main sport</option>
                    {SPORTS.map(sport => (
                      <option key={sport} value={sport}>{sport}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Secondary Sports/Interests</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {SPORTS.filter(s => s !== formData.primarySport).map(sport => (
                      <label key={sport} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.secondarySports.includes(sport)}
                          onChange={() => handleSecondarySporsToggle(sport)}
                          className="rounded border-gray-300"
                        />
                        <span className="text-sm">{sport}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Skill Level *</label>
                  <div className="space-y-2">
                    {SKILL_LEVELS.map(level => (
                      <label key={level.value} className="flex items-start space-x-3 cursor-pointer p-3 border rounded-lg hover:bg-gray-50">
                        <input
                          type="radio"
                          name="skillLevel"
                          value={level.value}
                          checked={formData.skillLevel === level.value}
                          onChange={(e) => setFormData({...formData, skillLevel: e.target.value})}
                          className="mt-1"
                        />
                        <div>
                          <div className="font-medium">{level.label}</div>
                          <div className="text-sm text-gray-500">{level.description}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setStep(1)}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                  <Button
                    onClick={() => setStep(3)}
                    disabled={!validateStep(2)}
                    className="flex items-center gap-2"
                  >
                    Next <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Training Goals & Style */}
          {step === 3 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Training Goals & Learning Style
                </CardTitle>
                <CardDescription>Help your coach understand how to train you best</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Training Goals *</label>
                  <Textarea
                    value={formData.trainingGoals}
                    onChange={(e) => setFormData({...formData, trainingGoals: e.target.value})}
                    placeholder="What do you want to achieve? (e.g., improve speed, master specific techniques, prepare for tryouts, etc.)"
                    rows={4}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Current Achievements</label>
                  <Textarea
                    value={formData.achievements}
                    onChange={(e) => setFormData({...formData, achievements: e.target.value})}
                    placeholder="What have you accomplished so far? (e.g., team captain, tournament wins, personal records, etc.)"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Preferred Learning Style *</label>
                  <div className="space-y-2">
                    {LEARNING_STYLES.map(style => (
                      <label key={style.value} className="flex items-start space-x-3 cursor-pointer p-3 border rounded-lg hover:bg-gray-50">
                        <input
                          type="radio"
                          name="learningStyle"
                          value={style.value}
                          checked={formData.learningStyle === style.value}
                          onChange={(e) => setFormData({...formData, learningStyle: e.target.value})}
                          className="mt-1"
                        />
                        <div>
                          <div className="font-medium">{style.label}</div>
                          <div className="text-sm text-gray-500">{style.description}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setStep(2)}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                  <Button
                    onClick={() => setStep(4)}
                    disabled={!validateStep(3)}
                    className="flex items-center gap-2"
                  >
                    Next <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 4: Availability & Special Notes */}
          {step === 4 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Availability & Special Notes
                </CardTitle>
                <CardDescription>When can you train and any special requirements</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Training Availability *</label>
                  <p className="text-xs text-gray-500 mb-3">Select the days you're available and add preferred time slots</p>
                  <div className="space-y-2">
                    {Object.keys(formData.availability).map((day) => (
                      <div key={day} className="border rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.availability[day as keyof typeof formData.availability].available}
                              onChange={() => handleAvailabilityToggle(day)}
                              className="rounded border-gray-300"
                            />
                            <span className="font-medium capitalize">{day}</span>
                          </label>
                          {formData.availability[day as keyof typeof formData.availability].available && (
                            <Input
                              type="text"
                              placeholder="e.g., 3pm-5pm, Evening, Flexible"
                              value={formData.availability[day as keyof typeof formData.availability].timeSlots}
                              onChange={(e) => handleTimeSlotChange(day, e.target.value)}
                              className="w-48"
                            />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Special Notes or Requirements</label>
                  <Textarea
                    value={formData.specialNotes}
                    onChange={(e) => setFormData({...formData, specialNotes: e.target.value})}
                    placeholder="Any injuries, equipment needs, dietary restrictions, or other information your coach should know?"
                    rows={4}
                  />
                </div>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setStep(3)}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting || !validateStep(4)}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Creating Profile...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Complete Profile
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Success Step */}
          {step === totalSteps + 1 && (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Profile Created Successfully!</h2>
                <p className="text-gray-600 mb-6">
                  Your athlete profile has been created and your coach has been notified.
                  Now let's set up your account so you can sign in.
                </p>
                <div className="space-y-3">
                  <Button className="w-full" onClick={() => setStep(totalSteps + 2)}>
                    Continue to Account Setup <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Authentication Step */}
          {step === totalSteps + 2 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="w-5 h-5" />
                  Create Your Account
                </CardTitle>
                <CardDescription>
                  Set up your login credentials to access your athlete dashboard
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Step 1: Ask about Google account */}
                {hasGoogleAccount === null && (
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="font-medium text-gray-900 mb-1">
                        Do you have a Google account with this email?
                      </p>
                      <p className="text-sm text-gray-600">{formData.email}</p>
                    </div>

                    <div className="grid gap-3">
                      <Button
                        variant="outline"
                        className="w-full h-auto py-4 flex items-start gap-3"
                        onClick={() => setHasGoogleAccount(true)}
                      >
                        <Mail className="w-5 h-5 mt-1 flex-shrink-0" />
                        <div className="text-left">
                          <div className="font-medium">Yes, I have a Google account</div>
                          <div className="text-sm text-gray-500">
                            Sign in with your existing Google account
                          </div>
                        </div>
                      </Button>

                      <Button
                        variant="outline"
                        className="w-full h-auto py-4 flex items-start gap-3"
                        onClick={() => setHasGoogleAccount(false)}
                      >
                        <Lock className="w-5 h-5 mt-1 flex-shrink-0" />
                        <div className="text-left">
                          <div className="font-medium">No, I don't have a Google account</div>
                          <div className="text-sm text-gray-500">
                            Create a password for your account
                          </div>
                        </div>
                      </Button>
                    </div>
                  </div>
                )}

                {/* Step 2a: Google Sign-In */}
                {hasGoogleAccount === true && (
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm text-gray-700">
                        Click the button below to sign in with your Google account.
                        After creating your account, you'll be asked to sign in again to confirm.
                      </p>
                    </div>

                    {authError && (
                      <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                        <p className="text-sm text-red-700">{authError}</p>
                      </div>
                    )}

                    <Button
                      className="w-full"
                      onClick={handleGoogleSignIn}
                      disabled={isCreatingAccount}
                    >
                      {isCreatingAccount ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Creating Account...
                        </>
                      ) : (
                        <>
                          <Mail className="w-4 h-4 mr-2" />
                          Sign in with Google
                        </>
                      )}
                    </Button>

                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        setHasGoogleAccount(null)
                        setAuthError('')
                      }}
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back
                    </Button>
                  </div>
                )}

                {/* Step 2b: Password Creation */}
                {hasGoogleAccount === false && (
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm text-gray-700">
                        Create a password for your account. You'll use this email and password to sign in.
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Email</label>
                      <Input
                        type="email"
                        value={formData.email}
                        disabled
                        className="bg-gray-50 text-gray-600"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Password <span className="text-red-500">*</span>
                      </label>
                      <Input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="At least 6 characters"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Confirm Password <span className="text-red-500">*</span>
                      </label>
                      <Input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter your password"
                        required
                      />
                    </div>

                    {authError && (
                      <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                        <p className="text-sm text-red-700">{authError}</p>
                      </div>
                    )}

                    <Button
                      className="w-full"
                      onClick={handlePasswordSignUp}
                      disabled={isCreatingAccount || !password || !confirmPassword}
                    >
                      {isCreatingAccount ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Creating Account...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Create Account
                        </>
                      )}
                    </Button>

                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        setHasGoogleAccount(null)
                        setPassword('')
                        setConfirmPassword('')
                        setAuthError('')
                      }}
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}