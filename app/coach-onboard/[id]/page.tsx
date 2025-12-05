'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Loader2, CheckCircle, AlertCircle, User, Award, Target, MessageSquare, Mic, Key, Mail, Lock, ArrowRight } from 'lucide-react'
import VoiceCaptureIntake from '@/components/coach/VoiceCaptureIntake'
import StreamlinedVoiceCapture from '@/components/coach/StreamlinedVoiceCapture'
import { auth } from '@/lib/firebase.client'
import {
  signInWithPopup,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signOut
} from 'firebase/auth'

interface IngestionData {
  organizationName: string
  inviterName: string
  sport: string
  description: string
  customMessage: string
  autoApprove: boolean
  expiresAt: string
  usesRemaining: number
  coachEmail?: string  // Email from invitation (may be empty for generic invitations)
  coachName?: string   // Name from invitation (may be empty for generic invitations)
  metadata?: {
    isTestInvitation?: boolean
    isJasmineSpecial?: boolean
    prePopulateData?: boolean
  }
}

interface UserInfo {
  email: string
  displayName: string
  firstName: string
  lastName: string
  phone: string
  location?: string
}

interface CoachData {
  sport: string
  experience: string
  credentials: string
  tagline: string
  philosophy: string
  specialties: string[]
  achievements: string[]
  references: string[]
  sampleQuestions: string[]
  bio: string
  voiceCaptureData?: any
}

export default function CoachOnboardPage() {
  const params = useParams()
  const router = useRouter()
  const ingestionId = params.id as string

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [ingestionData, setIngestionData] = useState<IngestionData | null>(null)
  const [currentStep, setCurrentStep] = useState(1)
  const [simpleProfileSubmitted, setSimpleProfileSubmitted] = useState(false)

  const [userInfo, setUserInfo] = useState<UserInfo>({
    email: '',
    displayName: '',
    firstName: '',
    lastName: '',
    phone: ''
  })

  const [coachData, setCoachData] = useState<CoachData>({
    sport: '',
    experience: '',
    credentials: '',
    tagline: '',
    philosophy: '',
    specialties: [],
    achievements: [],
    references: [],
    sampleQuestions: [],
    bio: '',
    voiceCaptureData: undefined
  })

  const [specialty, setSpecialty] = useState('')
  const [achievement, setAchievement] = useState('')
  const [reference, setReference] = useState('')
  const [sampleQuestion, setSampleQuestion] = useState('')

  // Authentication state
  const [hasGoogleAccount, setHasGoogleAccount] = useState<boolean | null>(null)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [isCreatingAccount, setIsCreatingAccount] = useState(false)

  // Detect simple invitation (new low-friction flow)
  const isSimpleInvitation = ingestionId.startsWith('inv_')

  useEffect(() => {
    // Parse URL parameters first
    const urlParams = new URLSearchParams(window.location.search)
    const emailParam = urlParams.get('email')
    const sportParam = urlParams.get('sport')
    const nameParam = urlParams.get('name')

    // Pre-populate from URL params if available
    if (emailParam) {
      setUserInfo(prev => ({ ...prev, email: decodeURIComponent(emailParam) }))
    }
    if (sportParam) {
      setCoachData(prev => ({ ...prev, sport: decodeURIComponent(sportParam) }))
    }
    if (nameParam) {
      const decodedName = decodeURIComponent(nameParam)
      setUserInfo(prev => ({ ...prev, displayName: decodedName }))
    }

    validateIngestionLink()
  }, [ingestionId])

  const validateIngestionLink = async () => {
    try {
      // Try mock validation first for test invitations
      let response: Response
      let result: any

      if (ingestionId.startsWith('test-') || ingestionId.startsWith('jasmine-special-')) {
        response = await fetch(`/api/mock-coach-validation?id=${ingestionId}`)
        result = await response.json()
        console.log('🧪 Using mock validation for test invitation')
      } else if (ingestionId.startsWith('inv_')) {
        // Handle simple invitations with the simple validation endpoint
        response = await fetch(`/api/validate-simple-invitation?id=${ingestionId}`)
        result = await response.json()
        console.log('📧 Using simple invitation validation')

        // Check if invitation was already used and should redirect
        if (result.alreadyUsed && result.shouldRedirect) {
          alert(result.message || 'This invitation has already been used. Your account was created successfully. Redirecting to sign in...')
          setTimeout(() => {
            router.push(result.redirectTo || '/dashboard')
          }, 2000)
          return
        }

        // Check if this is the wrong invitation type (e.g., athlete invitation used on coach page)
        if (result.wrongType && result.correctType) {
          const correctPage = result.correctType === 'athlete' ? 'athlete-onboard' : 'coach-onboard'
          setError(`This is a ${result.correctType} invitation link. You will be redirected to the correct page...`)
          setTimeout(() => {
            router.push(`/${correctPage}/${ingestionId}`)
          }, 3000)
          setLoading(false)
          return
        }

        // Transform the simple invitation response to match expected format
        if (result.success) {
          result = {
            valid: true,
            data: result.data
          }
        } else {
          result = {
            valid: false,
            error: result.error
          }
        }
      } else {
        response = await fetch(`/api/coach-ingestion/validate?id=${ingestionId}`)
        result = await response.json()
      }

      if (!result.valid) {
        setError(result.error)
        setLoading(false)
        return
      }

      setIngestionData(result.data)
      // Only pre-populate sport if it has a value
      if (result.data.sport) {
        setCoachData(prev => ({ ...prev, sport: result.data.sport }))
      }

      // Pre-populate email from invitation only if it has a value (not empty for generic invitations)
      if (result.data.coachEmail) {
        setUserInfo(prev => ({ ...prev, email: result.data.coachEmail }))
      }

      // Check if this is Jasmine's special onboarding and pre-populate data
      if (result.data.metadata?.isJasmineSpecial && result.data.metadata?.prePopulateData) {
        console.log('🎯 Detected Jasmine special onboarding - pre-populating data')

        // Pre-populate user info
        setUserInfo({
          email: '',
          displayName: 'Jasmine Aikey',
          firstName: 'Jasmine',
          lastName: 'Aikey',
          phone: ''
        })

        // Pre-populate coach data
        setCoachData(prev => ({
          ...prev,
          sport: 'Soccer',
          experience: '4+ years collegiate soccer at Stanford University',
          credentials: 'PAC-12 Champion and Midfielder of the Year, NCAA Division I Competitor',
          tagline: 'Elite soccer player at Stanford University',
          philosophy: 'I believe in developing the complete player - technically, tactically, physically, and mentally. Soccer is not just about individual skill, but about understanding the game, reading situations, and making smart decisions under pressure.',
          specialties: [
            'Midfield Play & Positioning',
            'Ball Control & First Touch',
            'Tactical Awareness',
            'Mental Preparation'
          ],
          achievements: [
            'PAC-12 Champion (Stanford University)',
            'PAC-12 Midfielder of the Year',
            'All-PAC-12 Conference Selection'
          ],
          sampleQuestions: [
            'How do I improve my first touch under pressure?',
            'What\'s the key to reading the game as a midfielder?',
            'How do you handle the mental pressure of big games?'
          ],
          bio: 'Stanford University soccer player with expertise in midfield play, technical development, and mental preparation. I specialize in helping athletes develop their tactical awareness, ball control, and competitive mindset through proven training methodologies.'
        }))
      }

      setLoading(false)
    } catch (err) {
      setError('Failed to validate invitation link')
      setLoading(false)
    }
  }

  const addSpecialty = () => {
    if (specialty.trim() && !coachData.specialties.includes(specialty.trim())) {
      setCoachData(prev => ({
        ...prev,
        specialties: [...prev.specialties, specialty.trim()]
      }))
      setSpecialty('')
    }
  }

  const removeSpecialty = (index: number) => {
    setCoachData(prev => ({
      ...prev,
      specialties: prev.specialties.filter((_, i) => i !== index)
    }))
  }

  const addAchievement = () => {
    if (achievement.trim()) {
      setCoachData(prev => ({
        ...prev,
        achievements: [...prev.achievements, achievement.trim()]
      }))
      setAchievement('')
    }
  }

  const removeAchievement = (index: number) => {
    setCoachData(prev => ({
      ...prev,
      achievements: prev.achievements.filter((_, i) => i !== index)
    }))
  }

  const addReference = () => {
    if (reference.trim()) {
      setCoachData(prev => ({
        ...prev,
        references: [...prev.references, reference.trim()]
      }))
      setReference('')
    }
  }

  const removeReference = (index: number) => {
    setCoachData(prev => ({
      ...prev,
      references: prev.references.filter((_, i) => i !== index)
    }))
  }

  const addSampleQuestion = () => {
    if (sampleQuestion.trim()) {
      setCoachData(prev => ({
        ...prev,
        sampleQuestions: [...prev.sampleQuestions, sampleQuestion.trim()]
      }))
      setSampleQuestion('')
    }
  }

  const removeSampleQuestion = (index: number) => {
    setCoachData(prev => ({
      ...prev,
      sampleQuestions: prev.sampleQuestions.filter((_, i) => i !== index)
    }))
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    setSubmitting(true)
    try {
      // Use different submit endpoints based on invitation type
      const submitEndpoint = ingestionId.startsWith('inv_')
        ? '/api/submit-simple-coach'
        : '/api/coach-ingestion/submit'

      const response = await fetch(submitEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ingestionId,
          userInfo,
          coachData
        })
      })

      const result = await response.json()

      if (!result.success) {
        setError(result.error)
        setSubmitting(false)
        return
      }

      if (ingestionId.startsWith('inv_')) {
        console.log('✅ Simple coach profile submitted successfully')
        setSimpleProfileSubmitted(true)
      } else {
        console.log('✅ Coach profile submitted successfully')
        // Move to success step (step 7) for full ingestion flow
        setCurrentStep(7)
      }
      setSubmitting(false)
    } catch (err) {
      setError('Failed to submit application')
      setSubmitting(false)
    }
  }

  // Auth handlers (matching athlete onboarding pattern)
  const handleGoogleSignIn = async () => {
    setAuthError('')
    setIsCreatingAccount(true)
    try {
      const provider = new GoogleAuthProvider()
      provider.setCustomParameters({
        login_hint: userInfo.email,
        prompt: 'select_account'
      })

      const result = await signInWithPopup(auth, provider)
      console.log('✅ Google account created:', result.user.email)

      // Complete the coach profile (links profile data to the account)
      console.log('🔗 Completing coach profile...')
      const completeResponse = await fetch('/api/complete-coach-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invitationId: ingestionId,
          email: userInfo.email
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
      const result = await createUserWithEmailAndPassword(auth, userInfo.email, password)
      console.log('✅ Email/password account created:', result.user.email)

      // Complete the coach profile (links profile data to the account)
      console.log('🔗 Completing coach profile...')
      const completeResponse = await fetch('/api/complete-coach-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invitationId: ingestionId,
          email: userInfo.email
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

  const validateForm = () => {
    // Only require the absolute minimum - email and name
    if (!userInfo.email || !userInfo.firstName || !userInfo.lastName) {
      setError('Please fill in your email, first name, and last name')
      return false
    }
    // Everything else is optional - take what we can get
    return true
  }

  // Simplified coach onboarding flow for simple invitations (inv_…)
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Validating invitation link...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <CardTitle className="text-red-600">Invalid Invitation</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-gray-600 mb-4">{error}</p>
            <Button onClick={() => router.push('/')} className="w-full">
              Return Home
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <CardTitle className="text-green-600">Application Submitted!</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-gray-600 mb-4">
              {ingestionData?.autoApprove
                ? 'Your coach application has been automatically approved! You should receive access shortly.'
                : 'Your coach application has been submitted successfully. You will receive an email when it has been reviewed.'}
            </p>
            <Button onClick={() => router.push('/dashboard/coach')} className="w-full">
              Go to Coach Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isSimpleInvitation) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-3xl mx-auto px-4 py-8">
          {/* Logo banner */}
          <div
            className="w-full h-32 rounded-lg flex items-center justify-center mb-8"
            style={{ backgroundColor: '#440102' }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/athleap-logo-colored.png"
              alt="ATHLEAP"
              className="h-20 w-auto"
            />
          </div>

          <h1
            className="text-3xl font-bold mb-2"
            style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif' }}
          >
            Join as a Coach
          </h1>
          <p
            className="text-gray-700 mb-6"
            style={{ fontFamily: '"Open Sans", sans-serif' }}
          >
            Tell us a few basics so we can set up your coaching profile.
          </p>

          {!simpleProfileSubmitted ? (
            <div className="space-y-6">
              {/* Name & Email */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstNameSimple">First Name *</Label>
                  <Input
                    id="firstNameSimple"
                    value={userInfo.firstName}
                    onChange={(e) =>
                      setUserInfo((prev) => ({ ...prev, firstName: e.target.value }))
                    }
                    placeholder="Enter your first name"
                  />
                </div>
                <div>
                  <Label htmlFor="lastNameSimple">Last Name *</Label>
                  <Input
                    id="lastNameSimple"
                    value={userInfo.lastName}
                    onChange={(e) =>
                      setUserInfo((prev) => ({ ...prev, lastName: e.target.value }))
                    }
                    placeholder="Enter your last name"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="emailSimple">Email *</Label>
                <Input
                  id="emailSimple"
                  type="email"
                  value={userInfo.email}
                  onChange={(e) =>
                    setUserInfo((prev) => ({ ...prev, email: e.target.value }))
                  }
                  disabled={!!ingestionData?.coachEmail}
                  className={
                    ingestionData?.coachEmail
                      ? 'bg-gray-50 text-gray-600 cursor-not-allowed'
                      : ''
                  }
                  placeholder="you@example.com"
                />
                {ingestionData?.coachEmail && (
                  <p className="text-xs text-gray-500 mt-1">
                    This email comes from your invitation and cannot be changed.
                  </p>
                )}
              </div>

              {/* Sport */}
              <div>
                <Label htmlFor="sportSimple">Sport *</Label>
                <select
                  id="sportSimple"
                  value={coachData.sport}
                  onChange={(e) =>
                    setCoachData((prev) => ({ ...prev, sport: e.target.value }))
                  }
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Select a sport</option>
                  <option value="Soccer">Soccer</option>
                  <option value="Basketball">Basketball</option>
                  <option value="Football">Football</option>
                  <option value="Baseball">Baseball</option>
                  <option value="Volleyball">Volleyball</option>
                  <option value="Track and Field">Track and Field</option>
                  <option value="Swimming">Swimming</option>
                  <option value="Tennis">Tennis</option>
                  <option value="Golf">Golf</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Years in Game */}
              <div>
                <Label htmlFor="yearsInGame">Years in Game *</Label>
                <Input
                  id="yearsInGame"
                  value={coachData.experience}
                  onChange={(e) =>
                    setCoachData((prev) => ({ ...prev, experience: e.target.value }))
                  }
                  placeholder="e.g., 4 years"
                />
              </div>

              {/* Short Bio */}
              <div>
                <Label htmlFor="shortBio">Short Bio *</Label>
                <Textarea
                  id="shortBio"
                  rows={4}
                  value={coachData.bio}
                  onChange={(e) =>
                    setCoachData((prev) => ({ ...prev, bio: e.target.value }))
                  }
                  placeholder="A few sentences about your playing or coaching background."
                />
              </div>

              {error && (
                <div className="p-3 rounded-md bg-red-50 border border-red-200 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="pt-2">
                <Button
                  onClick={handleSubmit}
                  disabled={
                    submitting ||
                    !userInfo.firstName ||
                    !userInfo.lastName ||
                    !userInfo.email ||
                    !coachData.sport ||
                    !coachData.experience ||
                    !coachData.bio
                  }
                  className="w-full"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting Profile...
                    </>
                  ) : (
                    'Submit Profile'
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="mt-6 space-y-6">
              <div className="text-center mb-4">
                <h2
                  className="text-2xl font-bold mb-2"
                  style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif' }}
                >
                  Create Your Account
                </h2>
                <p
                  className="text-gray-600"
                  style={{ fontFamily: '"Open Sans", sans-serif' }}
                >
                  One last step – choose how you want to sign in to Athleap.
                </p>
              </div>

              <div className="space-y-4">
                {/* Google sign-in option */}
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-gray-700 mb-2">
                    If you have a Google account with this email, you can sign in with
                    Google.
                  </p>
                  <p className="text-sm text-gray-600">{userInfo.email}</p>
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
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4 mr-2" />
                      Sign in with Google
                    </>
                  )}
                </Button>
              </div>

              <div className="space-y-4 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-700">
                  Or create a password for your Athleap account.
                </p>
                <div>
                  <Label htmlFor="auth-email-simple">Email</Label>
                  <Input
                    id="auth-email-simple"
                    type="email"
                    value={userInfo.email}
                    disabled
                    className="bg-gray-50 text-gray-600"
                  />
                </div>
                <div>
                  <Label htmlFor="auth-password-simple">
                    Password <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="auth-password-simple"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                  />
                </div>
                <div>
                  <Label htmlFor="auth-confirm-password-simple">
                    Confirm Password <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="auth-confirm-password-simple"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your password"
                  />
                </div>
                <Button
                  className="w-full"
                  onClick={handlePasswordSignUp}
                  disabled={isCreatingAccount || !password || !confirmPassword}
                >
                  {isCreatingAccount ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Create Account
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Legacy multi-step flow for full ingestion invitations has been archived.
  // For non-simple (non-inv_) links, show a simple message instead of the old wizard.
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <CardTitle className="text-red-600">Legacy Onboarding Link</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-gray-600 mb-4">
            This coach onboarding link uses an older flow that is no longer supported.
            Please request a new invitation email to continue.
          </p>
          <Button onClick={() => router.push('/')} className="w-full">
            Return Home
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}