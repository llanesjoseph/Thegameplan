'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Loader2, CheckCircle, AlertCircle, User, Award, Target, MessageSquare, Mic } from 'lucide-react'
import VoiceCaptureIntake from '@/components/coach/VoiceCaptureIntake'
import StreamlinedVoiceCapture from '@/components/coach/StreamlinedVoiceCapture'

interface IngestionData {
  organizationName: string
  inviterName: string
  sport: string
  description: string
  customMessage: string
  autoApprove: boolean
  expiresAt: string
  usesRemaining: number
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

  useEffect(() => {
    validateIngestionLink()
  }, [ingestionId])

  const validateIngestionLink = async () => {
    try {
      // Try mock validation first for test invitations
      let response
      let result

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
          alert(result.message || 'Your account has already been created. Redirecting to sign in...')
          router.push(result.redirectTo || '/')
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
      setCoachData(prev => ({ ...prev, sport: result.data.sport }))

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

      setSubmitted(true)
      setSubmitting(false)
    } catch (err) {
      setError('Failed to submit application')
      setSubmitting(false)
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
            <Button onClick={() => router.push('/')} className="w-full">
              Continue to PLAYBOOKD
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {ingestionData?.metadata?.isJasmineSpecial ? 'Welcome to PLAYBOOKD, Jasmine!' : 'Join as a Coach'}
          </h1>
          <p className="text-lg text-gray-600">
            {ingestionData?.metadata?.isJasmineSpecial
              ? 'Complete your coach profile to start sharing your Stanford soccer expertise with athletes worldwide'
              : `You've been invited to join ${ingestionData?.organizationName} as a ${ingestionData?.sport} coach`
            }
          </p>
          {ingestionData?.customMessage && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-blue-800">{ingestionData.customMessage}</p>
            </div>
          )}
          {ingestionData?.metadata?.isJasmineSpecial && (
            <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg">
              <p className="text-gray-800">
                🏆 <strong>Special Invitation:</strong> We've pre-filled much of your profile with your Stanford career achievements.
                Review the information, make any updates, and complete the optional voice capture to create the most personalized AI coaching experience possible!
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-4">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-300'}`}>
              <User className="h-4 w-4" />
            </div>
            <div className={`h-1 w-12 ${currentStep >= 2 ? 'bg-blue-600' : 'bg-gray-300'}`} />
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-300'}`}>
              <Award className="h-4 w-4" />
            </div>
            <div className={`h-1 w-12 ${currentStep >= 3 ? 'bg-blue-600' : 'bg-gray-300'}`} />
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${currentStep >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-300'}`}>
              <Target className="h-4 w-4" />
            </div>
            <div className={`h-1 w-12 ${currentStep >= 4 ? 'bg-blue-600' : 'bg-gray-300'}`} />
            <div className={`flex items-center justify-center w-8 h-8 rounded-full relative ${currentStep >= 4 ? 'bg-blue-600 text-white' : 'bg-gray-300'}`}>
              <Mic className="h-4 w-4" />
              {currentStep === 4 && (
                <span className="absolute -top-1 -right-1 bg-yellow-400 text-yellow-900 text-xs px-1 rounded-full text-[10px] font-semibold">
                  OPT
                </span>
              )}
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              {currentStep === 1 && 'Personal Information'}
              {currentStep === 2 && 'Coaching Experience'}
              {currentStep === 3 && 'Profile Details'}
              {currentStep === 4 && 'Voice & Personality Capture (Optional)'}
            </CardTitle>
            <CardDescription>
              {currentStep === 1 && 'Tell us about yourself'}
              {currentStep === 2 && 'Share your coaching background'}
              {currentStep === 3 && 'Complete your coach profile'}
              {currentStep === 4 && 'Optional: Help us capture your authentic coaching voice for enhanced AI responses'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {currentStep === 1 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={userInfo.firstName}
                    onChange={(e) => setUserInfo(prev => ({ ...prev, firstName: e.target.value }))}
                    placeholder="Enter your first name"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={userInfo.lastName}
                    onChange={(e) => setUserInfo(prev => ({ ...prev, lastName: e.target.value }))}
                    placeholder="Enter your last name"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={userInfo.email}
                    onChange={(e) => setUserInfo(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Enter your email address"
                  />
                </div>
                <div>
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input
                    id="displayName"
                    value={userInfo.displayName}
                    onChange={(e) => setUserInfo(prev => ({ ...prev, displayName: e.target.value }))}
                    placeholder="How you'd like to be known"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={userInfo.phone}
                    onChange={(e) => setUserInfo(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="Your phone number"
                  />
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="sport">Sport</Label>
                  <select
                    id="sport"
                    value={coachData.sport}
                    onChange={(e) => setCoachData(prev => ({ ...prev, sport: e.target.value }))}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">Select a sport</option>
                    <option value="Soccer">Soccer</option>
                    <option value="Basketball">Basketball</option>
                    <option value="Baseball">Baseball</option>
                    <option value="Tennis">Tennis</option>
                    <option value="Brazilian Jiu-Jitsu">Brazilian Jiu-Jitsu</option>
                    <option value="Running">Running</option>
                    <option value="Volleyball">Volleyball</option>
                    <option value="Swimming">Swimming</option>
                    <option value="American Football">American Football</option>
                    <option value="Golf">Golf</option>
                    <option value="Boxing">Boxing</option>
                    <option value="Track & Field">Track & Field</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="experience">Years of Experience</Label>
                  <Input
                    id="experience"
                    value={coachData.experience}
                    onChange={(e) => setCoachData(prev => ({ ...prev, experience: e.target.value }))}
                    placeholder="e.g., 5 years"
                  />
                </div>
                <div>
                  <Label htmlFor="credentials">Certifications & Credentials</Label>
                  <Textarea
                    id="credentials"
                    value={coachData.credentials}
                    onChange={(e) => setCoachData(prev => ({ ...prev, credentials: e.target.value }))}
                    placeholder="List your coaching certifications, licenses, and relevant credentials"
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="bio">Coaching Bio</Label>
                  <Textarea
                    id="bio"
                    value={coachData.bio}
                    onChange={(e) => setCoachData(prev => ({ ...prev, bio: e.target.value }))}
                    placeholder="Tell us about your coaching background, philosophy, and what makes you unique"
                    rows={4}
                  />
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-6">
                <div>
                  <Label htmlFor="tagline">Coach Tagline</Label>
                  <Input
                    id="tagline"
                    value={coachData.tagline}
                    onChange={(e) => setCoachData(prev => ({ ...prev, tagline: e.target.value }))}
                    placeholder="A brief tagline that describes your coaching style"
                  />
                </div>

                <div>
                  <Label htmlFor="philosophy">Coaching Philosophy</Label>
                  <Textarea
                    id="philosophy"
                    value={coachData.philosophy}
                    onChange={(e) => setCoachData(prev => ({ ...prev, philosophy: e.target.value }))}
                    placeholder="Describe your coaching philosophy and approach"
                    rows={3}
                  />
                </div>

                <div>
                  <Label>Specialties</Label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      value={specialty}
                      onChange={(e) => setSpecialty(e.target.value)}
                      placeholder="Add a specialty"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSpecialty())}
                    />
                    <Button type="button" onClick={addSpecialty} variant="outline">Add</Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {coachData.specialties.map((spec, index) => (
                      <Badge key={index} variant="secondary" className="cursor-pointer" onClick={() => removeSpecialty(index)}>
                        {spec} ×
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Achievements</Label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      value={achievement}
                      onChange={(e) => setAchievement(e.target.value)}
                      placeholder="Add an achievement"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAchievement())}
                    />
                    <Button type="button" onClick={addAchievement} variant="outline">Add</Button>
                  </div>
                  <div className="space-y-1">
                    {coachData.achievements.map((achievement, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm">{achievement}</span>
                        <Button size="sm" variant="ghost" onClick={() => removeAchievement(index)}>×</Button>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>References</Label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      value={reference}
                      onChange={(e) => setReference(e.target.value)}
                      placeholder="Add a reference"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addReference())}
                    />
                    <Button type="button" onClick={addReference} variant="outline">Add</Button>
                  </div>
                  <div className="space-y-1">
                    {coachData.references.map((ref, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm">{ref}</span>
                        <Button size="sm" variant="ghost" onClick={() => removeReference(index)}>×</Button>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Sample Questions for Athletes</Label>
                  <p className="text-sm text-gray-600 mb-2">Add questions you might ask athletes to understand their needs</p>
                  <div className="flex gap-2 mb-2">
                    <Input
                      value={sampleQuestion}
                      onChange={(e) => setSampleQuestion(e.target.value)}
                      placeholder="Add a sample question"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSampleQuestion())}
                    />
                    <Button type="button" onClick={addSampleQuestion} variant="outline">Add</Button>
                  </div>
                  <div className="space-y-1">
                    {coachData.sampleQuestions.map((question, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm">{question}</span>
                        <Button size="sm" variant="ghost" onClick={() => removeSampleQuestion(index)}>×</Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-2">🎤 Enhanced AI Coaching (Optional)</h3>
                  <p className="text-blue-800 text-sm mb-3">
                    Help our AI capture your unique coaching voice and personality for highly personalized responses.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      onClick={() => setCurrentStep(5)}
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      ⚡ Quick Voice Capture (5-7 min)
                    </Button>
                    <Button
                      onClick={() => setCurrentStep(6)}
                      variant="outline"
                      size="sm"
                      className="text-blue-700 border-blue-300 hover:bg-blue-100"
                    >
                      📚 Detailed Voice Capture (12-15 min)
                    </Button>
                    <Button
                      onClick={handleSubmit}
                      variant="outline"
                      size="sm"
                      disabled={submitting}
                      className="text-gray-700"
                    >
                      {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Skip & Submit Application
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 5 && (
              <div>
                <StreamlinedVoiceCapture
                  onComplete={(data) => {
                    setCoachData(prev => ({ ...prev, voiceCaptureData: data }))
                    handleSubmit() // Auto-submit after streamlined capture
                  }}
                  onProgress={(progress) => {
                    console.log('Streamlined voice capture progress:', progress)
                  }}
                  existingProfile={{
                    sport: coachData.sport,
                    experience: coachData.experience,
                    bio: coachData.bio,
                    tagline: coachData.tagline
                  }}
                />
              </div>
            )}

            {currentStep === 6 && (
              <div>
                {ingestionData?.metadata?.isJasmineSpecial && (
                  <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-green-800 text-sm">
                      🎯 <strong>Pre-populated for Jasmine:</strong> We've pre-filled this section with your Stanford career details.
                      Feel free to review, edit, or add more information to make your AI coaching even more personalized!
                    </p>
                  </div>
                )}
                <VoiceCaptureIntake
                  onComplete={(data) => {
                    setCoachData(prev => ({ ...prev, voiceCaptureData: data }))
                  }}
                  onProgress={(progress) => {
                    // Handle progress updates if needed
                    console.log('Voice capture progress:', progress)
                  }}
                  prePopulatedData={ingestionData?.metadata?.isJasmineSpecial ? async () => {
                    try {
                      const response = await fetch(`/api/jasmine-voice-data?ingestionId=${ingestionId}`)
                      const result = await response.json()
                      return result.success ? result.data.coachData.voiceCaptureData : null
                    } catch (error) {
                      console.error('Failed to load pre-populated voice data:', error)
                      return null
                    }
                  } : undefined}
                />
              </div>
            )}

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800">{error}</p>
              </div>
            )}

            <div className="flex justify-between pt-4">
              {currentStep > 1 && currentStep !== 4 && currentStep !== 5 && (
                <Button variant="outline" onClick={() => setCurrentStep(prev => prev - 1)}>
                  Previous
                </Button>
              )}
              {(currentStep === 5 || currentStep === 6) && (
                <Button variant="outline" onClick={() => setCurrentStep(4)}>
                  Back to Voice Options
                </Button>
              )}
              {currentStep < 4 ? (
                <Button
                  onClick={() => setCurrentStep(prev => prev + 1)}
                  className="ml-auto"
                  disabled={currentStep === 1 && (!userInfo.firstName || !userInfo.lastName || !userInfo.email)}
                >
                  Next
                </Button>
              ) : currentStep === 6 ? (
                <Button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="ml-auto"
                >
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Submit Application
                </Button>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}