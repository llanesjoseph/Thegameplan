'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Shield, CheckCircle, AlertCircle, Loader2, Crown } from 'lucide-react'
import { createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth'
import { auth } from '@/lib/firebase.client'

interface InvitationData {
  code: string
  recipientName: string
  recipientEmail: string
  role: 'admin' | 'superadmin'
  customMessage: string
  status: string
  expiresAt: { _seconds: number }
  createdByName: string
}

export default function AdminOnboardingPage({ params }: { params: { code: string } }) {
  const router = useRouter()
  const [invitation, setInvitation] = useState<InvitationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
    agreeToTerms: false
  })

  useEffect(() => {
    loadInvitation()
  }, [params.code])

  const loadInvitation = async () => {
    try {
      const response = await fetch(`/api/admin/verify-invitation/${params.code}`)
      const result = await response.json()

      if (!result.success) {
        const errorMsg = result.error || 'Invalid invitation'

        // If invitation was already used, redirect to sign-in after 3 seconds
        if (errorMsg.toLowerCase().includes('already been used')) {
          setError('This invitation has already been used. Redirecting you to sign in...')
          setTimeout(() => {
            router.push('/sign-in')
          }, 3000)
          return
        }

        // If invitation expired, show friendly message with sign-in option
        if (errorMsg.toLowerCase().includes('expired')) {
          setError('This invitation has expired. Please contact an administrator for a new invitation or sign in if you already have an account.')
          return
        }

        setError(errorMsg)
        return
      }

      setInvitation(result.data)
    } catch (err) {
      setError('Failed to load invitation')
      console.error('Error loading invitation:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    if (!formData.agreeToTerms) {
      alert('You must agree to the terms and conditions')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const provider = new GoogleAuthProvider()
      provider.setCustomParameters({
        prompt: 'select_account',
        login_hint: invitation!.recipientEmail
      })

      // Sign in with Google
      const userCredential = await signInWithPopup(auth, provider)

      // Verify the email matches the invitation
      if (userCredential.user.email?.toLowerCase() !== invitation!.recipientEmail.toLowerCase()) {
        await userCredential.user.delete() // Clean up the wrong account
        throw new Error(`Please sign in with the invited email: ${invitation!.recipientEmail}`)
      }

      // Get ID token
      const token = await userCredential.user.getIdToken()

      // Complete onboarding via API
      const response = await fetch('/api/admin/complete-onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          invitationCode: params.code,
          displayName: invitation!.recipientName
        })
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to complete onboarding')
      }

      // Success - force a full page reload to clear any cached role data
      alert('✅ Welcome to the PLAYBOOKD admin team! Redirecting to your dashboard...')
      // Use window.location.href for full page reload to ensure role is re-fetched
      window.location.href = '/dashboard/admin'
    } catch (err: any) {
      console.error('Google sign-in error:', err)
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Sign in was cancelled')
      } else if (err.code === 'auth/popup-blocked') {
        setError('Popup was blocked. Please allow popups and try again.')
      } else {
        setError(err.message || 'Failed to sign in with Google')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match')
      return
    }

    if (formData.password.length < 8) {
      alert('Password must be at least 8 characters')
      return
    }

    if (!formData.agreeToTerms) {
      alert('You must agree to the terms and conditions')
      return
    }

    setSubmitting(true)

    try {
      // Create Firebase auth user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        invitation!.recipientEmail,
        formData.password
      )

      // Get ID token
      const token = await userCredential.user.getIdToken()

      // Complete onboarding via API
      const response = await fetch('/api/admin/complete-onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          invitationCode: params.code,
          displayName: invitation!.recipientName
        })
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to complete onboarding')
      }

      // Success - force a full page reload to clear any cached role data
      alert('✅ Welcome to the PLAYBOOKD admin team! Redirecting to your dashboard...')
      // Use window.location.href for full page reload to ensure role is re-fetched
      window.location.href = '/dashboard/admin'
    } catch (err: any) {
      console.error('Onboarding error:', err)
      if (err.code === 'auth/email-already-in-use') {
        setError('This email is already registered. Please sign in instead.')
      } else {
        setError(err.message || 'Failed to complete registration')
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#E8E6D8' }}>
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    )
  }

  if (error || !invitation) {
    const isAlreadyUsed = error?.toLowerCase().includes('already been used')
    const isExpired = error?.toLowerCase().includes('expired')

    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: '#E8E6D8' }}>
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
          <div className="text-center">
            {isAlreadyUsed ? (
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            ) : (
              <AlertCircle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
            )}
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {isAlreadyUsed ? 'Invitation Already Used' : isExpired ? 'Invitation Expired' : 'Invalid Invitation'}
            </h1>
            <p className="text-gray-600 mb-6">{error || 'This invitation link is invalid or has expired.'}</p>
            <div className="flex gap-3 justify-center">
              {(isAlreadyUsed || isExpired) && (
                <button
                  onClick={() => router.push('/sign-in')}
                  className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
                >
                  Sign In
                </button>
              )}
              <button
                onClick={() => router.push('/')}
                className={`px-6 py-3 ${(isAlreadyUsed || isExpired) ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' : 'bg-purple-600 text-white hover:bg-purple-700'} rounded-lg font-medium`}
              >
                Return Home
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: '#E8E6D8' }}>
      <div className="max-w-2xl w-full bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-8 text-center">
          {invitation.role === 'superadmin' ? (
            <Crown className="w-16 h-16 text-white mx-auto mb-4" />
          ) : (
            <Shield className="w-16 h-16 text-white mx-auto mb-4" />
          )}
          <h1 className="text-3xl font-bold text-white mb-2">
            Join PLAYBOOKD Admin Team
          </h1>
          <p className="text-purple-100">
            You've been invited as {invitation.role === 'superadmin' ? 'a Super Administrator' : 'an Administrator'}
          </p>
        </div>

        {/* Content */}
        <div className="p-8">
          {/* Welcome Message */}
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Welcome, {invitation.recipientName}!
            </h2>
            <p className="text-gray-600">
              {invitation.createdByName} has invited you to help manage the PLAYBOOKD platform.
            </p>
          </div>

          {/* Custom Message */}
          {invitation.customMessage && (
            <div className="bg-purple-50 border-l-4 border-purple-600 p-4 mb-6 rounded">
              <p className="text-gray-700 italic">"{invitation.customMessage}"</p>
            </div>
          )}

          {/* Responsibilities */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <h3 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Your Admin Responsibilities
            </h3>
            <ul className="text-sm text-blue-800 space-y-2 list-disc list-inside">
              {invitation.role === 'superadmin' ? (
                <>
                  <li>Full platform access and system configuration</li>
                  <li>Manage all users, coaches, athletes, and content</li>
                  <li>Configure features and platform settings</li>
                  <li>Manage other administrators</li>
                  <li>Monitor platform health and analytics</li>
                </>
              ) : (
                <>
                  <li>Manage users, coaches, and athletes</li>
                  <li>Review and moderate content for safety</li>
                  <li>Monitor compliance and safety systems</li>
                  <li>Handle support requests and platform issues</li>
                  <li>Access platform analytics and reporting</li>
                </>
              )}
            </ul>
          </div>

          {/* Terms Agreement - Must be checked before proceeding */}
          <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg mb-6 border border-gray-200">
            <input
              type="checkbox"
              id="agreeToTerms"
              checked={formData.agreeToTerms}
              onChange={(e) => setFormData(prev => ({ ...prev, agreeToTerms: e.target.checked }))}
              className="mt-1"
            />
            <label htmlFor="agreeToTerms" className="text-sm text-gray-700">
              I agree to the Terms of Service and Privacy Policy. I understand my responsibilities as a platform administrator and will use my access appropriately.
            </label>
          </div>

          {/* Google Sign-In Option */}
          <div className="mb-6">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={submitting || !formData.agreeToTerms}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 rounded-lg shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span>Continue with Google</span>
                </>
              )}
            </button>
            <p className="text-xs text-gray-500 text-center mt-2">
              Sign in with the Google account for {invitation.recipientEmail}
            </p>
          </div>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-gray-300"></div>
            <span className="text-sm text-gray-500">or create password</span>
            <div className="flex-1 h-px bg-gray-300"></div>
          </div>

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email (Auto-filled)
              </label>
              <input
                type="email"
                value={invitation.recipientEmail}
                disabled
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Create Password *
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="Minimum 8 characters"
                required
                minLength={8}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password *
              </label>
              <input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="Re-enter password"
                required
                minLength={8}
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Setting up your admin account...
                </>
              ) : (
                <>
                  <Shield className="w-5 h-5" />
                  Complete Setup & Join Admin Team
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
