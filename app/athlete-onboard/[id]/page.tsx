'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { auth } from '@/lib/firebase.client'
import {
  GoogleAuthProvider,
  signInWithPopup,
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from 'firebase/auth'

interface InvitationData {
  id: string
  creatorUid: string
  coachId: string
  coachName?: string
  athleteEmail: string
  athleteName: string
  sport: string
}

const GOALS_OPTIONS = [
  'Support elite athlete as a fan',
  'Learn new technical skills',
  'Practice mental agility',
  'Train for next level of the game'
]

const SPORTS = [
  'Soccer',
  'Basketball',
  'Football',
  'Baseball',
  'Volleyball',
  'Track & Field',
  'Swimming',
  'Tennis',
  'Golf',
  'Other'
]

export default function AthleteOnboardingPage() {
  const { id } = useParams()
  const router = useRouter()
  const [invitation, setInvitation] = useState<InvitationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [isSigningIn, setIsSigningIn] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const invitationId = id as string

  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    primarySport: '',
    secondarySport: '',
    goals: [] as string[]
  })

  // Email auth state (for athletes without Google)
  const [showEmailForm, setShowEmailForm] = useState(false)
  const [isEmailSignUp, setIsEmailSignUp] = useState(true) // Default to sign-up for onboarding
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [emailError, setEmailError] = useState<string>('')
  const [isEmailProcessing, setIsEmailProcessing] = useState(false)

  useEffect(() => {
    const load = async () => {
      if (!invitationId) return
      try {
        const res = await fetch(`/api/validate-invitation?id=${invitationId}&type=athlete`, { cache: 'no-store' })
        const data = await res.json()
        if (res.ok && data.success && data.invitation) {
          setInvitation(data.invitation)
          // Pre-populate email and sport from invitation
          const inviteEmail = data.invitation.athleteEmail || ''
          setFormData(prev => ({
            ...prev,
            email: inviteEmail,
            primarySport: data.invitation.sport || '',
            firstName: data.invitation.athleteName?.split(' ')[0] || '',
            lastName: data.invitation.athleteName?.split(' ').slice(1).join(' ') || ''
          }))
          if (inviteEmail) {
            setEmail(inviteEmail)
          }
        } else if (data.alreadyUsed && data.shouldRedirect) {
          window.location.replace('/login?mode=signin')
          return
        } else {
          setError('Invalid or expired invitation.')
        }
      } catch {
        setError('Failed to load invitation.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [invitationId])

  const signInWithGoogle = async () => {
    if (!invitation) return
    try {
      setIsSigningIn(true)
      const provider = new GoogleAuthProvider()
      if (invitation.athleteEmail) {
        provider.setCustomParameters({ login_hint: invitation.athleteEmail, prompt: 'select_account' })
      }
      const result = await signInWithPopup(auth, provider)
      setCurrentUser(result.user)
      // Update email if different from invitation
      if (result.user.email) {
        setFormData(prev => ({ ...prev, email: result.user.email! }))
      }
    } catch (e: any) {
      alert(e?.message || 'Google sign-in failed. Please try again.')
      setIsSigningIn(false)
    }
  }

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!invitationId) return
    setIsEmailProcessing(true)
    setEmailError('')

    try {
      let result
      if (isEmailSignUp) {
        result = await createUserWithEmailAndPassword(auth, email, password)
      } else {
        result = await signInWithEmailAndPassword(auth, email, password)
      }

      const user = result.user
      setCurrentUser(user)

      const finalEmail = user.email || email
      if (finalEmail) {
        setFormData(prev => ({ ...prev, email: finalEmail }))
      }
    } catch (err: any) {
      console.error('Email auth error (athlete invite):', err)

      // Provide user-friendly error messages based on Firebase error codes
      const errorCode = err?.code || ''

      if (errorCode === 'auth/invalid-credential' || errorCode === 'auth/user-not-found') {
        setEmailError("This account doesn't exist yet. Click 'Need an account? Sign up' below to create one.")
        // Auto-switch to sign-up mode after 2 seconds
        setTimeout(() => setIsEmailSignUp(true), 2000)
      } else if (errorCode === 'auth/wrong-password') {
        setEmailError('Incorrect password. Please try again.')
      } else if (errorCode === 'auth/email-already-in-use') {
        setEmailError("This email is already registered. Click 'Already have an account? Sign in' below.")
        // Auto-switch to sign-in mode after 2 seconds
        setTimeout(() => setIsEmailSignUp(false), 2000)
      } else if (errorCode === 'auth/weak-password') {
        setEmailError('Password is too weak. Please use at least 6 characters.')
      } else if (errorCode === 'auth/invalid-email') {
        setEmailError('Invalid email address. Please check and try again.')
      } else {
        setEmailError(err?.message || 'Authentication failed. Please try again.')
      }
    } finally {
      setIsEmailProcessing(false)
    }
  }

  const toggleGoal = (goal: string) => {
    setFormData(prev => ({
      ...prev,
      goals: prev.goals.includes(goal)
        ? prev.goals.filter(g => g !== goal)
        : [...prev.goals, goal]
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUser || !invitation) return

    setIsSubmitting(true)
    try {
      // Complete athlete profile
      const response = await fetch('/api/complete-athlete-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invitationId,
          email: formData.email,
          coachId: invitation.coachId || invitation.creatorUid,
          firstName: formData.firstName,
          lastName: formData.lastName,
          primarySport: formData.primarySport,
          secondarySport: formData.secondarySport,
          goals: formData.goals
        })
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to complete profile setup')
      }

      // Set flag to show welcome popup
      try {
        localStorage.setItem('athleap_show_welcome_popup', '1')
      } catch {}

      // Force token refresh to get new custom claims, then redirect
      await currentUser.getIdToken(true)

      // Redirect to dashboard (user stays signed in)
      window.location.replace('/dashboard/athlete')
    } catch (e: any) {
      alert(e?.message || 'Failed to complete setup. Please try again.')
      setIsSubmitting(false)
    }
  }

  const isFormValid = formData.firstName.trim() &&
    formData.lastName.trim() &&
    formData.email.trim() &&
    formData.primarySport &&
    formData.goals.length > 0

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-gray-600">Loading…</div>
      </div>
    )
  }

  if (error || !invitation) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-xl mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-bold mb-2" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif' }}>
            Invitation Error
          </h1>
          <p className="text-gray-600">{error || 'Invalid invitation link.'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          {/* ATHLEAP Logo Banner - no tagline */}
          <div className="w-full h-40 rounded-lg flex items-center justify-center mb-6" style={{ backgroundColor: '#440102' }}>
            <img
              src="/brand/athleap-logo-colored.png"
              alt="ATHLEAP"
              className="h-24 w-auto"
            />
          </div>
          <h2 className="text-3xl font-bold mb-2" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif' }}>
            Join as an Athlete
          </h2>
          <p className="text-gray-600" style={{ fontFamily: '"Open Sans", sans-serif' }}>
            Tell Us About Yourself
          </p>
        </div>

        {/* Sign in first if not authenticated */}
        {!currentUser ? (
          <div className="max-w-md mx-auto">
            <div className="bg-gray-50 rounded-lg p-8 text-center border border-gray-200 space-y-4">
              <p className="text-gray-700" style={{ fontFamily: '"Open Sans", sans-serif' }}>
                First, sign in to create your account.
              </p>

              {/* Google Sign-in */}
              <button
                onClick={signInWithGoogle}
                disabled={isSigningIn || isEmailProcessing}
                className="w-full px-6 py-3 bg-white border-2 border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center gap-3 disabled:opacity-50"
                style={{ fontFamily: '"Open Sans", sans-serif' }}
              >
                {isSigningIn ? (
                  <>
                    <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Sign in with Google
                  </>
                )}
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-gray-500" style={{ fontFamily: '"Open Sans", sans-serif' }}>
                  or
                </span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              {/* Email auth toggle + form */}
              {!showEmailForm ? (
                <button
                  type="button"
                  onClick={() => setShowEmailForm(true)}
                  className="w-full text-sm font-semibold text-gray-700 underline"
                  style={{ fontFamily: '"Open Sans", sans-serif' }}
                >
                  Use email instead
                </button>
              ) : (
                <form onSubmit={handleEmailAuth} className="space-y-3 text-left">
                  <div>
                    <label className="block text-sm font-bold mb-1" style={{ fontFamily: '"Open Sans", sans-serif', color: '#000000' }}>
                      Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-black"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-1" style={{ fontFamily: '"Open Sans", sans-serif', color: '#000000' }}>
                      Password
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-black"
                      required
                      minLength={6}
                    />
                    {isEmailSignUp && (
                      <p className="text-xs text-gray-500 mt-1" style={{ fontFamily: '"Open Sans", sans-serif' }}>
                        Minimum 6 characters
                      </p>
                    )}
                  </div>
                  {emailError && (
                    <div className="text-sm font-semibold text-red-700 bg-red-50 border-2 border-red-300 rounded-lg px-4 py-3" style={{ fontFamily: '"Open Sans", sans-serif' }}>
                      {emailError}
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={isEmailProcessing || isSigningIn}
                    className="w-full px-6 py-3 rounded-lg text-white font-semibold disabled:opacity-50"
                    style={{ fontFamily: '"Open Sans", sans-serif', backgroundColor: '#000000' }}
                  >
                    {isEmailProcessing ? 'Processing...' : isEmailSignUp ? 'Create Account' : 'Sign In'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEmailSignUp(!isEmailSignUp)}
                    className="w-full text-xs text-gray-600 mt-1"
                    style={{ fontFamily: '"Open Sans", sans-serif' }}
                  >
                    {isEmailSignUp ? 'Already have an account? Sign in' : 'Need an account? Sign up'}
                  </button>
                </form>
              )}
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold mb-2" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif' }}>
                  First Name *
                </label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-black"
                  style={{ fontFamily: '"Open Sans", sans-serif' }}
                  required
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-2" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif' }}>
                  Last Name *
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-black"
                  style={{ fontFamily: '"Open Sans", sans-serif' }}
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-bold mb-2" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif' }}>
                Email *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-black bg-gray-50"
                style={{ fontFamily: '"Open Sans", sans-serif' }}
                required
                disabled={true}
              />
              <p className="text-xs text-gray-500 mt-1">From your Google account</p>
            </div>

            {/* Primary Sport - Locked from Coach */}
            <div>
              <label className="block text-sm font-bold mb-2" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif' }}>
                Primary Sport * {invitation.sport && <span className="text-xs text-gray-500 font-normal">(from your coach)</span>}
              </label>
              <select
                value={formData.primarySport}
                onChange={(e) => setFormData({ ...formData, primarySport: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-black"
                style={{ fontFamily: '"Open Sans", sans-serif', backgroundColor: invitation.sport ? '#F9FAFB' : 'white' }}
                required
                disabled={isSubmitting || !!invitation.sport}
              >
                <option value="">Select primary sport</option>
                {SPORTS.map(sport => (
                  <option key={sport} value={sport}>{sport}</option>
                ))}
              </select>
              {invitation.sport && (
                <p className="text-xs text-gray-500 mt-1">Your coach's sport is automatically selected</p>
              )}
            </div>

            {/* Secondary Sport */}
            <div>
              <label className="block text-sm font-bold mb-2" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif' }}>
                Secondary Sport (Optional)
              </label>
              <select
                value={formData.secondarySport}
                onChange={(e) => setFormData({ ...formData, secondarySport: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-black"
                style={{ fontFamily: '"Open Sans", sans-serif' }}
                disabled={isSubmitting}
              >
                <option value="">Select secondary sport</option>
                {SPORTS.map(sport => (
                  <option key={sport} value={sport}>{sport}</option>
                ))}
              </select>
            </div>

            {/* Goals */}
            <div>
              <label className="block text-sm font-bold mb-2" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif' }}>
                Goals * (Select all that apply)
              </label>
              <div className="space-y-2">
                {GOALS_OPTIONS.map(goal => (
                  <label
                    key={goal}
                    className="flex items-center gap-3 p-3 border-2 border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                    style={{
                      borderColor: formData.goals.includes(goal) ? '#000000' : '#E5E7EB',
                      backgroundColor: formData.goals.includes(goal) ? '#F9FAFB' : 'white'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={formData.goals.includes(goal)}
                      onChange={() => toggleGoal(goal)}
                      className="w-5 h-5"
                      disabled={isSubmitting}
                    />
                    <span style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif' }}>{goal}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!isFormValid || isSubmitting}
              className="w-full py-4 px-6 rounded-lg text-lg font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: isFormValid && !isSubmitting ? '#000000' : '#9CA3AF',
                color: '#FFFFFF',
                fontFamily: '"Open Sans", sans-serif'
              }}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Submitting Profile...
                </span>
              ) : (
                'Submit Profile'
              )}
            </button>
          </form>
        )}
      </main>
    </div>
  )
}
