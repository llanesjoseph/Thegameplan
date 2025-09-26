'use client'

import React, { useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { db } from '@/lib/firebase.client'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { 
  User, 
  MapPin, 
  Clock, 
  Star, 
  Globe, 
  Award, 
  DollarSign,
  Calendar,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  Plus,
  X
} from 'lucide-react'

interface CoachApplicationFormProps {
  onSuccess?: () => void
  onCancel?: () => void
}

const CoachApplicationForm: React.FC<CoachApplicationFormProps> = ({
  onSuccess,
  onCancel
}) => {
  const { user } = useAuth()
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string>('')

  const [formData, setFormData] = useState({
    bio: '',
    specialties: [''],
    sports: [''],
    credentials: [''],
    experience: '',
    location: '',
    hourlyRate: 50,
    availability: {
      monday: false,
      tuesday: false,
      wednesday: false,
      thursday: false,
      friday: false,
      saturday: false,
      sunday: false
    },
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    languages: ['English'],
    certifications: [''],
    socialLinks: {
      instagram: '',
      youtube: '',
      website: ''
    },
    coachingPhilosophy: '',
    achievements: [''],
    applicationReason: ''
  })

  const sports = [
    'Brazilian Jiu-Jitsu', 'Mixed Martial Arts (MMA)', 'Boxing', 'Wrestling',
    'Judo', 'Muay Thai', 'Karate', 'Taekwondo', 'Soccer', 'Basketball',
    'Tennis', 'Baseball', 'Football', 'Volleyball', 'Swimming', 'Track and Field',
    'Golf', 'Hockey', 'Rugby', 'Lacrosse', 'Other'
  ]

  const commonSpecialties = [
    'Beginner Training', 'Advanced Techniques', 'Competition Preparation',
    'Youth Development', 'Adult Training', 'Injury Recovery', 'Mental Coaching',
    'Strength & Conditioning', 'Technique Analysis', 'Game Strategy',
    'Leadership Development', 'Team Building', 'Other'
  ]

  const addArrayItem = (field: keyof typeof formData, value: string = '') => {
    setFormData(prev => ({
      ...prev,
      [field]: [...(prev[field] as string[]), value]
    }))
  }

  const removeArrayItem = (field: keyof typeof formData, index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: (prev[field] as string[]).filter((_, i) => i !== index)
    }))
  }

  const updateArrayItem = (field: keyof typeof formData, index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: (prev[field] as string[]).map((item, i) => i === index ? value : item)
    }))
  }

  const handleSubmit = async () => {
    if (!user) {
      setError('You must be logged in to apply')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      // Clean up empty array items
      const cleanedData = {
        ...formData,
        specialties: formData.specialties.filter(s => s.trim()),
        sports: formData.sports.filter(s => s.trim()),
        credentials: formData.credentials.filter(c => c.trim()),
        certifications: formData.certifications.filter(c => c.trim()),
        achievements: formData.achievements.filter(a => a.trim()),
        languages: formData.languages.filter(l => l.trim())
      }

      await addDoc(collection(db, 'coach_applications'), {
        userId: user.uid,
        email: user.email,
        displayName: user.displayName || user.email?.split('@')[0],
        photoURL: user.photoURL,
        ...cleanedData,
        status: 'pending',
        submittedAt: serverTimestamp()
      })

      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      console.error('Error submitting coach application:', error)
      setError('Failed to submit application. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const nextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const steps = [
    { number: 1, title: 'Basic Info', icon: User },
    { number: 2, title: 'Expertise', icon: Star },
    { number: 3, title: 'Availability', icon: Calendar },
    { number: 4, title: 'Final Details', icon: CheckCircle }
  ]

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg border border-gray-200">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Become a Coach</h2>
            <p className="text-gray-600 mt-1">Share your expertise and help others achieve their goals</p>
          </div>
          {onCancel && (
            <button
              onClick={onCancel}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mt-6">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                currentStep >= step.number
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'border-gray-300 text-gray-400'
              }`}>
                <step.icon className="w-5 h-5" />
              </div>
              <div className="ml-3">
                <p className={`text-sm font-medium ${
                  currentStep >= step.number ? 'text-blue-600' : 'text-gray-400'
                }`}>
                  Step {step.number}
                </p>
                <p className={`text-xs ${
                  currentStep >= step.number ? 'text-gray-900' : 'text-gray-400'
                }`}>
                  {step.title}
                </p>
              </div>
              {index < steps.length - 1 && (
                <div className={`w-16 h-0.5 ml-6 ${
                  currentStep > step.number ? 'bg-blue-600' : 'bg-gray-300'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="p-6">
        {/* Step 1: Basic Info */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bio / About You *
              </label>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Tell us about your background, experience, and what makes you a great coach..."
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  Location *
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="City, State/Country"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <DollarSign className="w-4 h-4 inline mr-1" />
                  Hourly Rate (USD)
                </label>
                <input
                  type="number"
                  value={formData.hourlyRate}
                  onChange={(e) => setFormData(prev => ({ ...prev, hourlyRate: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Experience Summary *
              </label>
              <textarea
                value={formData.experience}
                onChange={(e) => setFormData(prev => ({ ...prev, experience: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Summarize your coaching and playing experience..."
              />
            </div>
          </div>
        )}

        {/* Step 2: Expertise */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sports You Coach *
              </label>
              {formData.sports.map((sport, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <select
                    value={sport}
                    onChange={(e) => updateArrayItem('sports', index, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select a sport</option>
                    {sports.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => removeArrayItem('sports', index)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => addArrayItem('sports')}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm"
              >
                <Plus className="w-4 h-4" />
                Add Sport
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Specialties *
              </label>
              {formData.specialties.map((specialty, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <select
                    value={specialty}
                    onChange={(e) => updateArrayItem('specialties', index, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select a specialty</option>
                    {commonSpecialties.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => removeArrayItem('specialties', index)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => addArrayItem('specialties')}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm"
              >
                <Plus className="w-4 h-4" />
                Add Specialty
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Credentials & Qualifications
              </label>
              {formData.credentials.map((credential, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={credential}
                    onChange={(e) => updateArrayItem('credentials', index, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., NASM Certified, Former Pro Player, etc."
                  />
                  <button
                    type="button"
                    onClick={() => removeArrayItem('credentials', index)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => addArrayItem('credentials')}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm"
              >
                <Plus className="w-4 h-4" />
                Add Credential
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Availability */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">
                <Calendar className="w-4 h-4 inline mr-1" />
                Weekly Availability
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(formData.availability).map(([day, available]) => (
                  <label key={day} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={available}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        availability: {
                          ...prev.availability,
                          [day]: e.target.checked
                        }
                      }))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 capitalize">{day}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Globe className="w-4 h-4 inline mr-1" />
                  Time Zone
                </label>
                <input
                  type="text"
                  value={formData.timeZone}
                  onChange={(e) => setFormData(prev => ({ ...prev, timeZone: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Languages
                </label>
                <input
                  type="text"
                  value={formData.languages.join(', ')}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    languages: e.target.value.split(',').map(l => l.trim()).filter(l => l)
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="English, Spanish, etc."
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Final Details */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Coaching Philosophy
              </label>
              <textarea
                value={formData.coachingPhilosophy}
                onChange={(e) => setFormData(prev => ({ ...prev, coachingPhilosophy: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="What's your approach to coaching? What do you believe in?"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Why do you want to become a coach on our platform? *
              </label>
              <textarea
                value={formData.applicationReason}
                onChange={(e) => setFormData(prev => ({ ...prev, applicationReason: e.target.value }))}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Tell us about your motivation and what you hope to achieve..."
              />
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Instagram
                </label>
                <input
                  type="url"
                  value={formData.socialLinks.instagram}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    socialLinks: { ...prev.socialLinks, instagram: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://instagram.com/..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  YouTube
                </label>
                <input
                  type="url"
                  value={formData.socialLinks.youtube}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    socialLinks: { ...prev.socialLinks, youtube: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://youtube.com/..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Website
                </label>
                <input
                  type="url"
                  value={formData.socialLinks.website}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    socialLinks: { ...prev.socialLinks, website: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://yourwebsite.com"
                />
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
          <button
            onClick={prevStep}
            disabled={currentStep === 1}
            className="px-6 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>

          {currentStep < 4 ? (
            <button
              onClick={nextStep}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !formData.bio || !formData.applicationReason}
              className="px-8 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
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
  )
}

export default CoachApplicationForm
