'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Loader2, CheckCircle, AlertCircle, User, Award, Target, MessageSquare } from 'lucide-react'

interface IngestionData {
  organizationName: string
  inviterName: string
  sport: string
  description: string
  customMessage: string
  autoApprove: boolean
  expiresAt: string
  usesRemaining: number
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
    bio: ''
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
      const response = await fetch(`/api/coach-ingestion/validate?id=${ingestionId}`)
      const result = await response.json()

      if (!result.valid) {
        setError(result.error)
        setLoading(false)
        return
      }

      setIngestionData(result.data)
      setCoachData(prev => ({ ...prev, sport: result.data.sport }))
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
      const response = await fetch('/api/coach-ingestion/submit', {
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
    if (!userInfo.email || !userInfo.firstName || !userInfo.lastName) {
      setError('Please fill in all required personal information')
      return false
    }
    if (!coachData.experience || !coachData.bio) {
      setError('Please fill in your coaching experience and bio')
      return false
    }
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
              Continue to GamePlan
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Join as a Coach</h1>
          <p className="text-lg text-gray-600">
            You've been invited to join <span className="font-semibold">{ingestionData?.organizationName}</span> as a {ingestionData?.sport} coach
          </p>
          {ingestionData?.customMessage && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-blue-800">{ingestionData.customMessage}</p>
            </div>
          )}
        </div>

        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-4">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-300'}`}>
              <User className="h-4 w-4" />
            </div>
            <div className={`h-1 w-16 ${currentStep >= 2 ? 'bg-blue-600' : 'bg-gray-300'}`} />
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-300'}`}>
              <Award className="h-4 w-4" />
            </div>
            <div className={`h-1 w-16 ${currentStep >= 3 ? 'bg-blue-600' : 'bg-gray-300'}`} />
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${currentStep >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-300'}`}>
              <Target className="h-4 w-4" />
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              {currentStep === 1 && 'Personal Information'}
              {currentStep === 2 && 'Coaching Experience'}
              {currentStep === 3 && 'Profile Details'}
            </CardTitle>
            <CardDescription>
              {currentStep === 1 && 'Tell us about yourself'}
              {currentStep === 2 && 'Share your coaching background'}
              {currentStep === 3 && 'Complete your coach profile'}
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
                  <Input
                    id="sport"
                    value={coachData.sport}
                    onChange={(e) => setCoachData(prev => ({ ...prev, sport: e.target.value }))}
                    placeholder="Primary sport you coach"
                  />
                </div>
                <div>
                  <Label htmlFor="experience">Years of Experience *</Label>
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
                  <Label htmlFor="bio">Coaching Bio *</Label>
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

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800">{error}</p>
              </div>
            )}

            <div className="flex justify-between pt-4">
              {currentStep > 1 && (
                <Button variant="outline" onClick={() => setCurrentStep(prev => prev - 1)}>
                  Previous
                </Button>
              )}
              {currentStep < 3 ? (
                <Button
                  onClick={() => setCurrentStep(prev => prev + 1)}
                  className="ml-auto"
                  disabled={currentStep === 1 && (!userInfo.firstName || !userInfo.lastName || !userInfo.email)}
                >
                  Next
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="ml-auto"
                >
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Submit Application
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}