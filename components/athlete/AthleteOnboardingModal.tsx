'use client'

/**
 * Mandatory Athlete Onboarding Modal
 * Appears on first login for athletes to capture critical profile data
 * Blocks dashboard access until completed
 */

import { useState } from 'react'
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase.client'
import { X, UserCircle, Trophy, Calendar, FileText } from 'lucide-react'

interface AthleteOnboardingModalProps {
  userId: string
  userEmail: string
  onComplete: () => void
}

const SPORTS_LIST = [
  'Brazilian Jiu-Jitsu',
  'Mixed Martial Arts',
  'Boxing',
  'Wrestling',
  'Soccer',
  'American Football',
  'Basketball',
  'Baseball',
  'Tennis',
  'Golf',
  'Track & Field',
  'Swimming',
  'Volleyball',
  'Hockey',
  'Gymnastics',
  'Other'
]

export default function AthleteOnboardingModal({ userId, userEmail, onComplete }: AthleteOnboardingModalProps) {
  const [formData, setFormData] = useState({
    firstName: '',
    primarySport: '',
    experienceYears: '',
    typicalTrainingDay: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isValid = formData.firstName.trim() !== '' &&
    formData.primarySport !== '' &&
    formData.experienceYears !== '' &&
    formData.typicalTrainingDay.trim() !== ''

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid) return

    setIsSubmitting(true)
    setError(null)

    try {
      // Update user profile in Firestore
      const userRef = doc(db, 'users', userId)

      await updateDoc(userRef, {
        displayName: formData.firstName.trim(),
        preferredSports: [formData.primarySport],
        experienceYears: parseInt(formData.experienceYears, 10),
        athleteProfile: {
          typicalTrainingDay: formData.typicalTrainingDay.trim(),
          onboardedAt: serverTimestamp()
        },
        onboardingComplete: true,
        updatedAt: serverTimestamp()
      })

      console.log('✅ Athlete onboarding completed successfully')
      onComplete()
    } catch (err) {
      console.error('❌ Error saving onboarding data:', err)
      setError('Failed to save your information. Please try again.')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        style={{ backgroundColor: '#FFFFFF' }}
      >
        {/* Header */}
        <div
          className="p-8 text-center border-b"
          style={{ borderColor: '#E8E6D8' }}
        >
          <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
            style={{ backgroundColor: '#91A6EB' }}>
            <Trophy className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-heading mb-2" style={{ color: '#000000' }}>
            Welcome to PLAYBOOKD!
          </h2>
          <p className="text-lg" style={{ color: '#000000', opacity: 0.7 }}>
            Let's set up your athlete profile to get started
          </p>
          <p className="text-sm mt-2" style={{ color: '#FF6B35' }}>
            * Required to access your dashboard
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {/* Error Message */}
          {error && (
            <div className="p-4 rounded-lg" style={{ backgroundColor: '#FEE2E2' }}>
              <p style={{ color: '#DC2626' }}>{error}</p>
            </div>
          )}

          {/* First Name */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold mb-2" style={{ color: '#000000' }}>
              <UserCircle className="w-4 h-4" />
              First Name *
            </label>
            <input
              type="text"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              placeholder="Enter your first name"
              className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-black transition-colors"
              style={{ borderColor: '#E8E6D8', backgroundColor: '#FFFFFF' }}
              required
              disabled={isSubmitting}
            />
            <p className="text-xs mt-1" style={{ color: '#000000', opacity: 0.6 }}>
              How your coach will address you
            </p>
          </div>

          {/* Primary Sport */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold mb-2" style={{ color: '#000000' }}>
              <Trophy className="w-4 h-4" />
              Primary Sport *
            </label>
            <select
              value={formData.primarySport}
              onChange={(e) => setFormData({ ...formData, primarySport: e.target.value })}
              className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-black transition-colors"
              style={{ borderColor: '#E8E6D8', backgroundColor: '#FFFFFF' }}
              required
              disabled={isSubmitting}
            >
              <option value="">Select your primary sport</option>
              {SPORTS_LIST.map(sport => (
                <option key={sport} value={sport}>{sport}</option>
              ))}
            </select>
          </div>

          {/* Years of Experience */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold mb-2" style={{ color: '#000000' }}>
              <Calendar className="w-4 h-4" />
              Years of Experience *
            </label>
            <select
              value={formData.experienceYears}
              onChange={(e) => setFormData({ ...formData, experienceYears: e.target.value })}
              className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-black transition-colors"
              style={{ borderColor: '#E8E6D8', backgroundColor: '#FFFFFF' }}
              required
              disabled={isSubmitting}
            >
              <option value="">Select years of experience</option>
              <option value="0">Less than 1 year</option>
              <option value="1">1 year</option>
              <option value="2">2 years</option>
              <option value="3">3 years</option>
              <option value="4">4 years</option>
              <option value="5">5 years</option>
              <option value="6">6-10 years</option>
              <option value="11">10+ years</option>
            </select>
          </div>

          {/* Typical Training Day */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold mb-2" style={{ color: '#000000' }}>
              <FileText className="w-4 h-4" />
              Typical Training & Engagement Day *
            </label>
            <textarea
              value={formData.typicalTrainingDay}
              onChange={(e) => setFormData({ ...formData, typicalTrainingDay: e.target.value })}
              placeholder="Describe a typical day of training for you. When do you train? What does your routine look like? What are your goals?"
              rows={5}
              className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-black transition-colors resize-none"
              style={{ borderColor: '#E8E6D8', backgroundColor: '#FFFFFF' }}
              required
              disabled={isSubmitting}
            />
            <p className="text-xs mt-1" style={{ color: '#000000', opacity: 0.6 }}>
              Help your coach understand your schedule and commitment level
            </p>
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={!isValid || isSubmitting}
              className="w-full py-4 px-6 rounded-xl font-bold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: isValid && !isSubmitting ? '#16A34A' : '#9CA3AF',
                color: '#FFFFFF'
              }}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Saving Profile...
                </span>
              ) : (
                'Complete Setup & Enter Dashboard'
              )}
            </button>
          </div>

          {/* Info Box */}
          <div className="p-4 rounded-lg" style={{ backgroundColor: '#F0F9FF', borderLeft: '4px solid #91A6EB' }}>
            <p className="text-sm" style={{ color: '#000000', opacity: 0.8 }}>
              <strong>Privacy Note:</strong> This information is only shared with your assigned coach to provide personalized training.
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}
