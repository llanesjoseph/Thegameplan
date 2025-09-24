'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useEnhancedRole } from '@/hooks/use-role-switcher'
import { db } from '@/lib/firebase'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { ArrowLeft, Upload, Star, Trophy, Target, Users, CheckCircle, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

// Sports list from existing profile
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

interface ApplicationData {
  sport: string
  experience: string
  credentials: string
  tagline: string
  philosophy: {
    title: string
    description: string
    points: Array<{
      title: string
      description: string
    }>
  }
  specialties: string[]
  achievements: string[]
  references: string[]
  sampleQuestions: string[]
}

export default function ApplyCoachPage() {
  const { user } = useAuth()
  const { role } = useEnhancedRole()
  const [applicationData, setApplicationData] = useState<ApplicationData>({
    sport: '',
    experience: '',
    credentials: '',
    tagline: '',
    philosophy: {
      title: '',
      description: '',
      points: [
        { title: '', description: '' },
        { title: '', description: '' },
        { title: '', description: '' }
      ]
    },
    specialties: [],
    achievements: [''],
    references: [''],
    sampleQuestions: ['', '', '', '']
  })

  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'success' | 'error' | null>(null)
  const [existingApplication, setExistingApplication] = useState<any>(null)

  // Check for existing application
  useEffect(() => {
    const checkExistingApplication = async () => {
      if (user?.uid) {
        try {
          const appDoc = await getDoc(doc(db, 'coach_applications', user.uid))
          if (appDoc.exists()) {
            setExistingApplication(appDoc.data())
          }
        } catch (error) {
          console.error('Error checking existing application:', error)
        }
      }
    }

    checkExistingApplication()
  }, [user])

  const handleSubmitApplication = async () => {
    if (!user?.uid) return

    setIsSubmitting(true)

    try {
      const application = {
        userId: user.uid,
        email: user.email,
        displayName: user.displayName || '',
        currentRole: role,
        requestedRole: 'creator',
        applicationData,
        status: 'pending',
        submittedAt: new Date().toISOString()
      }

      await setDoc(doc(db, 'coach_applications', user.uid), application)
      setSubmitStatus('success')
    } catch (error) {
      console.error('Error submitting application:', error)
      setSubmitStatus('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  // If user is already a coach
  if (role === 'creator') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cream via-cream to-sky-blue/10 flex items-center justify-center px-4">
        <div className="max-w-md mx-auto text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-green to-green/80 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-dark mb-4">You're Already a Coach!</h1>
          <p className="text-dark/70 mb-6">You already have coach privileges on the platform.</p>
          <div className="space-y-3">
            <Link
              href="/dashboard/profile"
              className="block w-full bg-gradient-to-r from-sky-blue to-deep-plum text-white py-3 rounded-xl font-medium"
            >
              Manage Your Profile
            </Link>
            <Link
              href="/dashboard"
              className="block w-full border-2 border-dark/20 text-dark py-3 rounded-xl font-medium"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Show existing application status
  if (existingApplication) {
    const statusConfig = {
      pending: { color: 'sky-blue', icon: AlertTriangle, title: 'Application Under Review' },
      under_review: { color: 'orange', icon: AlertTriangle, title: 'Application Being Reviewed' },
      approved: { color: 'green', icon: CheckCircle, title: 'Application Approved!' },
      rejected: { color: 'orange', icon: AlertTriangle, title: 'Application Not Approved' }
    }

    const config = statusConfig[existingApplication.status as keyof typeof statusConfig]

    return (
      <div className="min-h-screen bg-gradient-to-br from-cream via-cream to-sky-blue/10 flex items-center justify-center px-4">
        <div className="max-w-md mx-auto text-center">
          <div className={`w-16 h-16 bg-gradient-to-r from-${config.color} to-${config.color}/80 rounded-2xl flex items-center justify-center mx-auto mb-6`}>
            <config.icon className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-dark mb-4">{config.title}</h1>
          <p className="text-dark/70 mb-6">
            {existingApplication.status === 'pending' && 'Your application is being reviewed by our team. We\'ll notify you once a decision has been made.'}
            {existingApplication.status === 'under_review' && 'Our team is currently reviewing your application. This typically takes 3-5 business days.'}
            {existingApplication.status === 'approved' && 'Congratulations! Your coach application has been approved. Your account will be upgraded shortly.'}
            {existingApplication.status === 'rejected' && 'Your application needs some improvements. Please contact support for detailed feedback.'}
          </p>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 mb-6 text-left">
            <div className="text-sm text-dark/60 mb-2">Submitted on:</div>
            <div className="font-medium text-dark">
              {new Date(existingApplication.submittedAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>
          </div>
          <Link
            href="/dashboard"
            className="block w-full bg-gradient-to-r from-sky-blue to-deep-plum text-white py-3 rounded-xl font-medium"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  if (submitStatus === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cream via-cream to-sky-blue/10 flex items-center justify-center px-4">
        <div className="max-w-md mx-auto text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-green to-green/80 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-dark mb-4">Application Submitted!</h1>
          <p className="text-dark/70 mb-6">
            Thank you for applying to become a coach. Our team will review your application and get back to you within 3-5 business days.
          </p>
          <Link
            href="/dashboard"
            className="block w-full bg-gradient-to-r from-sky-blue to-deep-plum text-white py-3 rounded-xl font-medium"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-cream via-cream to-sky-blue/10">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/dashboard" className="p-3 hover:bg-white/80 rounded-xl transition-colors shadow-sm backdrop-blur-sm border border-white/20">
            <ArrowLeft className="w-5 h-5 text-dark" />
          </Link>
          <div>
            <h1 className="text-4xl font-bold text-dark font-heading">Apply to Become a Coach</h1>
            <p className="text-dark/60 font-medium">Share your expertise and help athletes reach their potential</p>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-8 mb-8">
          <div className="flex items-center justify-between mb-8">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                  currentStep >= step
                    ? 'bg-gradient-to-r from-sky-blue to-deep-plum text-white'
                    : 'bg-dark/10 text-dark/40'
                }`}>
                  {step}
                </div>
                {step < 4 && (
                  <div className={`w-16 h-1 mx-4 transition-all ${
                    currentStep > step ? 'bg-gradient-to-r from-sky-blue to-deep-plum' : 'bg-dark/10'
                  }`} />
                )}
              </div>
            ))}
          </div>

          <div className="text-center">
            <h2 className="text-xl font-bold text-dark mb-2">
              {currentStep === 1 && 'Basic Information'}
              {currentStep === 2 && 'Coaching Philosophy'}
              {currentStep === 3 && 'Experience & Credentials'}
              {currentStep === 4 && 'Review & Submit'}
            </h2>
            <p className="text-dark/60">
              {currentStep === 1 && 'Tell us about your sport and coaching background'}
              {currentStep === 2 && 'Share your coaching philosophy and approach'}
              {currentStep === 3 && 'Provide your credentials and experience'}
              {currentStep === 4 && 'Review your application before submitting'}
            </p>
          </div>
        </div>

        {/* Application Form Steps */}
        <div className="bg-gradient-to-br from-white to-sky-blue/5 rounded-2xl shadow-lg border border-white/50 p-8">
          {/* Step 1: Basic Information */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-dark mb-2">Primary Sport *</label>
                <select
                  value={applicationData.sport}
                  onChange={(e) => setApplicationData(prev => ({ ...prev, sport: e.target.value }))}
                  className="w-full border-2 border-sky-blue/20 bg-white/80 rounded-xl p-3 text-dark focus:border-sky-blue focus:ring-4 focus:ring-sky-blue/20 transition-all backdrop-blur-sm"
                  required
                >
                  <option value="">Select your primary sport...</option>
                  {SPORTS_OPTIONS.map(sport => (
                    <option key={sport} value={sport}>{sport}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-dark mb-2">Coaching Tagline *</label>
                <input
                  type="text"
                  value={applicationData.tagline}
                  onChange={(e) => setApplicationData(prev => ({ ...prev, tagline: e.target.value }))}
                  className="w-full border-2 border-sky-blue/20 bg-white/80 rounded-xl p-3 text-dark placeholder-dark/50 focus:border-sky-blue focus:ring-4 focus:ring-sky-blue/20 transition-all backdrop-blur-sm"
                  placeholder="e.g., Elevating mental game through tactical intelligence and confidence building"
                  maxLength={120}
                  required
                />
                <div className="text-xs text-dark/50 mt-1">{applicationData.tagline.length}/120 characters</div>
              </div>

              <div>
                <label className="block text-sm font-medium text-dark mb-2">Years of Experience *</label>
                <input
                  type="text"
                  value={applicationData.experience}
                  onChange={(e) => setApplicationData(prev => ({ ...prev, experience: e.target.value }))}
                  className="w-full border-2 border-sky-blue/20 bg-white/80 rounded-xl p-3 text-dark placeholder-dark/50 focus:border-sky-blue focus:ring-4 focus:ring-sky-blue/20 transition-all backdrop-blur-sm"
                  placeholder="e.g., 10+ years professional soccer experience"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-dark mb-2">Add Specialties</label>
                <select
                  onChange={(e) => {
                    const specialty = e.target.value
                    if (specialty && !applicationData.specialties.includes(specialty)) {
                      setApplicationData(prev => ({
                        ...prev,
                        specialties: [...prev.specialties, specialty]
                      }))
                    }
                    e.target.value = ''
                  }}
                  className="w-full border-2 border-sky-blue/20 bg-white/80 rounded-xl p-3 text-dark focus:border-sky-blue focus:ring-4 focus:ring-sky-blue/20 transition-all backdrop-blur-sm mb-3"
                >
                  <option value="">Select specialties...</option>
                  <option value="Mental Conditioning">Mental Conditioning</option>
                  <option value="Tactical Awareness">Tactical Awareness</option>
                  <option value="Confidence Building">Confidence Building</option>
                  <option value="Technical Skills">Technical Skills</option>
                  <option value="Physical Conditioning">Physical Conditioning</option>
                  <option value="Team Leadership">Team Leadership</option>
                  <option value="Performance Analysis">Performance Analysis</option>
                  <option value="Injury Prevention">Injury Prevention</option>
                </select>

                {applicationData.specialties.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {applicationData.specialties.map((specialty, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-sky-blue/20 text-sky-blue rounded-full text-sm border border-sky-blue/30"
                      >
                        {specialty}
                        <button
                          type="button"
                          onClick={() => {
                            setApplicationData(prev => ({
                              ...prev,
                              specialties: prev.specialties.filter(s => s !== specialty)
                            }))
                          }}
                          className="ml-1 text-sky-blue hover:text-sky-blue/70"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Philosophy */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-dark mb-2">Philosophy Title *</label>
                <input
                  type="text"
                  value={applicationData.philosophy.title}
                  onChange={(e) => setApplicationData(prev => ({
                    ...prev,
                    philosophy: { ...prev.philosophy, title: e.target.value }
                  }))}
                  className="w-full border-2 border-sky-blue/20 bg-white/80 rounded-xl p-3 text-dark placeholder-dark/50 focus:border-sky-blue focus:ring-4 focus:ring-sky-blue/20 transition-all backdrop-blur-sm"
                  placeholder="e.g., Excellence Through Mental Mastery"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-dark mb-2">Philosophy Description *</label>
                <textarea
                  value={applicationData.philosophy.description}
                  onChange={(e) => setApplicationData(prev => ({
                    ...prev,
                    philosophy: { ...prev.philosophy, description: e.target.value }
                  }))}
                  className="w-full border-2 border-sky-blue/20 bg-white/80 rounded-xl p-4 text-dark placeholder-dark/50 focus:border-sky-blue focus:ring-4 focus:ring-sky-blue/20 transition-all backdrop-blur-sm resize-none"
                  rows={4}
                  placeholder="Explain your coaching philosophy and approach..."
                  required
                />
              </div>

              {/* Philosophy Points */}
              <div>
                <label className="block text-sm font-medium text-dark mb-4">Three Key Coaching Points</label>
                {applicationData.philosophy.points.map((point, index) => (
                  <div key={index} className="mb-4 p-4 bg-white/60 rounded-xl border border-sky-blue/10">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-sky-blue to-deep-plum rounded-lg flex items-center justify-center text-white font-bold">
                        {index + 1}
                      </div>
                      <input
                        type="text"
                        value={point.title}
                        onChange={(e) => {
                          const newPoints = [...applicationData.philosophy.points]
                          newPoints[index].title = e.target.value
                          setApplicationData(prev => ({
                            ...prev,
                            philosophy: { ...prev.philosophy, points: newPoints }
                          }))
                        }}
                        className="flex-1 border-2 border-sky-blue/20 bg-white/80 rounded-lg p-2 text-dark placeholder-dark/50 focus:border-sky-blue focus:ring-2 focus:ring-sky-blue/20 transition-all"
                        placeholder={`Point ${index + 1} title...`}
                      />
                    </div>
                    <textarea
                      value={point.description}
                      onChange={(e) => {
                        const newPoints = [...applicationData.philosophy.points]
                        newPoints[index].description = e.target.value
                        setApplicationData(prev => ({
                          ...prev,
                          philosophy: { ...prev.philosophy, points: newPoints }
                        }))
                      }}
                      className="w-full border-2 border-sky-blue/20 bg-white/80 rounded-lg p-3 text-dark placeholder-dark/50 focus:border-sky-blue focus:ring-2 focus:ring-sky-blue/20 transition-all resize-none"
                      rows={2}
                      placeholder={`Describe point ${index + 1}...`}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t border-sky-blue/20">
            <button
              onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
              disabled={currentStep === 1}
              className="px-6 py-3 border-2 border-dark/20 bg-white/80 text-dark rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white transition-all"
            >
              Previous
            </button>

            {currentStep < 4 ? (
              <button
                onClick={() => setCurrentStep(prev => prev + 1)}
                className="px-6 py-3 bg-gradient-to-r from-sky-blue to-deep-plum text-white rounded-xl font-medium hover:opacity-90 transition-all"
              >
                Next Step
              </button>
            ) : (
              <button
                onClick={handleSubmitApplication}
                disabled={isSubmitting}
                className="px-8 py-3 bg-gradient-to-r from-green to-green/90 text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-all flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Submit Application
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}