'use client'

/**
 * Mandatory Athlete Onboarding Modal
 * Appears on first login for athletes to capture critical profile data
 * Blocks dashboard access until completed
 */

import { useState } from 'react'
import { doc, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore'
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
  const [showSuccess, setShowSuccess] = useState(false)

  const isValid = formData.firstName.trim() !== '' &&
    formData.primarySport !== '' &&
    formData.experienceYears !== '' &&
    formData.typicalTrainingDay.trim() !== ''

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid) return

    setIsSubmitting(true)
    setError(null)

    let retries = 0
    const maxRetries = 3

    while (retries < maxRetries) {
      try {
        console.log(`🔄 Attempt ${retries + 1}/${maxRetries} to save onboarding...`)

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

        console.log('✅ Athlete onboarding completed successfully', {
          userId,
          displayName: formData.firstName.trim(),
          primarySport: formData.primarySport,
          attempt: retries + 1
        })

        // Verify the write by reading it back
        const verifyDoc = await getDoc(userRef)
        const verifyData = verifyDoc.data()

        if (verifyData?.onboardingComplete !== true) {
          throw new Error('Onboarding status not saved correctly - verification failed')
        }

        console.log('✅ Verified onboarding completion in Firestore')

        // Store onboarding completion in localStorage to prevent re-showing modal
        if (typeof window !== 'undefined') {
          localStorage.setItem(`onboarding_complete_${userId}`, 'true')
          console.log('💾 Saved onboarding completion to localStorage')
        }

        // Show success message briefly before closing
        setShowSuccess(true)
        setIsSubmitting(false)

        // Wait 2 seconds to show success message, then complete
        setTimeout(() => {
          onComplete()
        }, 2000)
        return

      } catch (err: any) {
        retries++
        console.error(`❌ Error saving onboarding data (attempt ${retries}/${maxRetries}):`, err)

        if (retries >= maxRetries) {
          // All retries failed
          setError(
            `Failed to save your information after ${maxRetries} attempts. ` +
            `Error: ${err.message || 'Unknown error'}. ` +
            `Please try again or contact support if this persists.`
          )
          setIsSubmitting(false)
          return
        }

        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * retries))
      }
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
          <h2 className="text-3xl mb-2" style={{ color: '#000000' }}>
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
          {/* Success Message */}
          {showSuccess && (
            <div className="p-6 rounded-lg text-center" style={{ backgroundColor: '#D1FAE5' }}>
              <div className="flex items-center justify-center gap-3 mb-2">
                <Trophy className="w-6 h-6" style={{ color: '#16A34A' }} />
                <p className="text-xl font-bold" style={{ color: '#16A34A' }}>Profile Saved Successfully!</p>
              </div>
              <p className="text-sm" style={{ color: '#16A34A' }}>Taking you to your dashboard...</p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-4 rounded-lg" style={{ backgroundColor: '#FEE2E2' }}>
              <p style={{ color: '#DC2626' }}>{error}</p>
              <a
                href={`mailto:support@playbookd.com?subject=Onboarding%20Issue&body=User%20ID:%20${userId}%0AEmail:%20${userEmail}%0AError:%20${encodeURIComponent(error)}`}
                className="text-sm underline mt-2 inline-block"
                style={{ color: '#DC2626' }}
              >
                Contact Support for Help
              </a>
            </div>
          )}

          {/* First Name */}
          <div>
            <label className="flex items-center gap-2 text-sm mb-2" style={{ color: '#000000' }}>
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
            <label className="flex items-center gap-2 text-sm mb-2" style={{ color: '#000000' }}>
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
            <label className="flex items-center gap-2 text-sm mb-2" style={{ color: '#000000' }}>
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
            <label className="flex items-center gap-2 text-sm mb-2" style={{ color: '#000000' }}>
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
              className="w-full py-4 px-6 rounded-xl text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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

          {/* Emergency Skip Option - Only show if there's an error */}
          {error && (
            <div className="pt-4 border-t" style={{ borderColor: '#E8E6D8' }}>
              <details className="text-sm">
                <summary className="cursor-pointer text-gray-600 hover:text-gray-900">
                  Having persistent issues? Emergency options
                </summary>
                <div className="mt-3 p-4 rounded-lg" style={{ backgroundColor: '#FEF3C7' }}>
                  <p className="text-xs mb-3" style={{ color: '#92400E' }}>
                    <strong>Warning:</strong> Only use this if you've tried multiple times and contacted support.
                    This will let you access the dashboard, but you'll need to complete your profile later.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm('Are you sure? You will need to complete your profile later. We recommend contacting support first.')) {
                        // Emergency bypass - mark as complete locally
                        if (typeof window !== 'undefined') {
                          localStorage.setItem(`onboarding_complete_${userId}`, 'true')
                        }
                        alert('Emergency skip activated. Please contact support to complete your profile.')
                        onComplete()
                      }
                    }}
                    className="px-4 py-2 text-sm rounded-lg"
                    style={{ backgroundColor: '#FCD34D', color: '#78350F' }}
                  >
                    Emergency Skip (Not Recommended)
                  </button>
                </div>
              </details>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}
