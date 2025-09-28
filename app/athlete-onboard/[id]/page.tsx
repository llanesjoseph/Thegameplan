'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import AppHeader from '@/components/ui/AppHeader'
import {
  CheckCircle,
  User,
  Mail,
  Calendar,
  Target,
  Trophy,
  Users,
  ArrowRight,
  Star
} from 'lucide-react'

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

export default function AthleteOnboardingPage() {
  const params = useParams()
  const invitationId = params.id as string
  const [invitation, setInvitation] = useState<InvitationData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    experience: '',
    goals: '',
    medicalConditions: '',
    emergencyContact: '',
    emergencyPhone: ''
  })

  useEffect(() => {
    if (invitationId) {
      fetchInvitation()
    }
  }, [invitationId])

  const fetchInvitation = async () => {
    try {
      setIsLoading(true)

      // Check if it's in our global cache (for testing)
      if (typeof window !== 'undefined' && globalThis.athleteInvitations) {
        const invitation = globalThis.athleteInvitations.get(invitationId)
        if (invitation) {
          setInvitation(invitation)
          setFormData(prev => ({
            ...prev,
            email: invitation.athleteEmail,
            firstName: invitation.athleteName.split(' ')[0] || '',
            lastName: invitation.athleteName.split(' ').slice(1).join(' ') || ''
          }))
          setIsLoading(false)
          return
        }
      }

      // In production, this would fetch from your API
      const response = await fetch(`/api/athlete/validate-invitation?id=${invitationId}`)
      if (response.ok) {
        const data = await response.json()
        setInvitation(data.invitation)
        setFormData(prev => ({
          ...prev,
          email: data.invitation.athleteEmail,
          firstName: data.invitation.athleteName.split(' ')[0] || '',
          lastName: data.invitation.athleteName.split(' ').slice(1).join(' ') || ''
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
      // In production, this would submit to your API
      await new Promise(resolve => setTimeout(resolve, 2000)) // Simulate API call
      setStep(4) // Success step
    } catch (error) {
      console.error('Error submitting:', error)
      alert('Failed to complete onboarding. Please try again.')
    } finally {
      setIsSubmitting(false)
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
            <Button onClick={() => window.location.href = '/'}>
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
        <div className="max-w-2xl mx-auto">

          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to PLAYBOOKD!</h1>
            <p className="text-gray-600">Complete your athlete profile to get started</p>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Step {step} of 3</span>
              <span className="text-sm text-gray-500">{Math.round((step / 3) * 100)}% Complete</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(step / 3) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Invitation Details */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Training Invitation</h3>
                  <p className="text-gray-600">{invitation.sport} • Coach Training Program</p>
                  <p className="text-sm text-gray-500 mt-1">{invitation.customMessage}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Step Content */}
          {step === 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Personal Information
                </CardTitle>
                <CardDescription>Tell us about yourself</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">First Name</label>
                    <Input
                      value={formData.firstName}
                      onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                      placeholder="John"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Last Name</label>
                    <Input
                      value={formData.lastName}
                      onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                      placeholder="Smith"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="john@example.com"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Phone</label>
                    <Input
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      placeholder="(555) 123-4567"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Date of Birth</label>
                    <Input
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => setFormData({...formData, dateOfBirth: e.target.value})}
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={() => setStep(2)} className="flex items-center gap-2">
                    Next <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 2 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Athletic Background
                </CardTitle>
                <CardDescription>Help us understand your experience and goals</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Experience Level</label>
                  <select
                    value={formData.experience}
                    onChange={(e) => setFormData({...formData, experience: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Select your experience level</option>
                    <option value="beginner">Beginner (0-1 years)</option>
                    <option value="intermediate">Intermediate (2-5 years)</option>
                    <option value="advanced">Advanced (5+ years)</option>
                    <option value="elite">Elite/Professional</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Goals & Objectives</label>
                  <Textarea
                    value={formData.goals}
                    onChange={(e) => setFormData({...formData, goals: e.target.value})}
                    placeholder="What do you hope to achieve through this training program?"
                    rows={4}
                  />
                </div>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setStep(1)}>
                    Back
                  </Button>
                  <Button onClick={() => setStep(3)} className="flex items-center gap-2">
                    Next <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 3 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Emergency & Medical Information
                </CardTitle>
                <CardDescription>Important information for your safety</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Medical Conditions or Allergies</label>
                  <Textarea
                    value={formData.medicalConditions}
                    onChange={(e) => setFormData({...formData, medicalConditions: e.target.value})}
                    placeholder="Any medical conditions, injuries, or allergies we should know about?"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Emergency Contact Name</label>
                    <Input
                      value={formData.emergencyContact}
                      onChange={(e) => setFormData({...formData, emergencyContact: e.target.value})}
                      placeholder="Parent/Guardian name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Emergency Contact Phone</label>
                    <Input
                      value={formData.emergencyPhone}
                      onChange={(e) => setFormData({...formData, emergencyPhone: e.target.value})}
                      placeholder="(555) 123-4567"
                    />
                  </div>
                </div>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setStep(2)}>
                    Back
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Completing...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Complete Registration
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 4 && (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to the Team!</h2>
                <p className="text-gray-600 mb-6">
                  Your athlete profile has been created successfully. Your coach will be notified and will reach out to you soon to begin your training journey.
                </p>
                <div className="space-y-3">
                  <Button className="w-full" onClick={() => window.location.href = '/dashboard'}>
                    Access Your Dashboard
                  </Button>
                  <Button variant="outline" className="w-full">
                    Download Mobile App
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}