'use client'

import { useState } from 'react'
import { signInWithPopup, GoogleAuthProvider, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth'
import { auth } from '@/lib/firebase.client'

interface AuthButtonsProps {
  initialMode?: 'signin' | 'signup'
}

export default function AuthButtons({ initialMode = 'signin' }: AuthButtonsProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showEmailForm, setShowEmailForm] = useState(false)
  const [isSignUp, setIsSignUp] = useState(initialMode === 'signup')
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [resetEmailSent, setResetEmailSent] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const provider = new GoogleAuthProvider()
      provider.setCustomParameters({
        prompt: 'select_account'
      })

      const result = await signInWithPopup(auth, provider)
      console.log('[AuthButtons] Google sign-in successful')

      // Get token immediately (don't wait - let onAuthStateChanged handle redirect)
      // This allows immediate visual feedback
      result.user.getIdToken().catch(() => {
        // Token fetch will happen in onAuthStateChanged
      })

      // onAuthStateChanged in landing page will handle redirect
    } catch (error: any) {
      console.error('[AuthButtons] Google sign-in error:', error)
      setError(`Google sign-in failed: ${error.message}`)
      setIsLoading(false)
    }
  }

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      let result
      if (isSignUp) {
        result = await createUserWithEmailAndPassword(auth, email, password)
        console.log('[AuthButtons] Email sign-up successful')
      } else {
        result = await signInWithEmailAndPassword(auth, email, password)
        console.log('[AuthButtons] Email sign-in successful')
      }
      
      // Get token immediately (don't wait - let onAuthStateChanged handle redirect)
      result.user.getIdToken().catch(() => {
        // Token fetch will happen in onAuthStateChanged
      })
      
      // onAuthStateChanged in landing page will handle redirect
    } catch (error: any) {
      console.error('[AuthButtons] Email auth error:', error)
      setError(`Email authentication failed: ${error.message}`)
      setIsLoading(false)
    }
  }

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      await sendPasswordResetEmail(auth, email)
      console.log('[AuthButtons] Password reset email sent to:', email)
      setResetEmailSent(true)
      setIsLoading(false)
    } catch (error: any) {
      console.error('[AuthButtons] Password reset error:', error)
      let errorMessage = 'Failed to send password reset email'

      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email address'
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address'
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many requests. Please try again later'
      }

      setError(errorMessage)
      setIsLoading(false)
    }
  }

  if (showForgotPassword) {
    return (
      <div className="space-y-4">
        {resetEmailSent ? (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="text-lg font-semibold text-green-800 mb-2">Check Your Email</h3>
            <p className="text-sm text-green-700 mb-4">
              We've sent a password reset link to <strong>{email}</strong>.
              Click the link in the email to reset your password.
            </p>
            <button
              type="button"
              onClick={() => {
                setShowForgotPassword(false)
                setResetEmailSent(false)
                setEmail('')
              }}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white py-2 px-4 rounded-lg"
            >
              ← Back to Sign In
            </button>
          </div>
        ) : (
          <form onSubmit={handlePasswordReset} className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Reset Password</h3>
              <p className="text-sm text-gray-600 mb-4">
                Enter your email address and we'll send you a link to reset your password.
              </p>
              <label className="block text-sm text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                required
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white py-2 px-4 rounded-lg disabled:opacity-50"
            >
              {isLoading ? 'Sending...' : 'Send Reset Link'}
            </button>

            <button
              type="button"
              onClick={() => {
                setShowForgotPassword(false)
                setError(null)
              }}
              className="w-full text-sm text-gray-600 hover:text-teal-600"
            >
              ← Back to Sign In
            </button>
          </form>
        )}
      </div>
    )
  }

  if (showEmailForm) {
    return (
      <div className="space-y-5">
        <form onSubmit={handleEmailAuth} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ fontFamily: '"Open Sans", sans-serif', fontWeight: 600, color: '#440102' }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border rounded-lg transition-all focus:outline-none"
              style={{
                fontFamily: '"Open Sans", sans-serif',
                borderColor: '#D1D5DB',
                color: '#440102',
                backgroundColor: '#FFFFFF'
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#FC0105'
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(252, 1, 5, 0.1)'
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#D1D5DB'
                e.currentTarget.style.boxShadow = 'none'
              }}
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2" style={{ fontFamily: '"Open Sans", sans-serif', fontWeight: 600, color: '#440102' }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border rounded-lg transition-all focus:outline-none"
              style={{
                fontFamily: '"Open Sans", sans-serif',
                borderColor: '#D1D5DB',
                color: '#440102',
                backgroundColor: '#FFFFFF'
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#FC0105'
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(252, 1, 5, 0.1)'
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#D1D5DB'
                e.currentTarget.style.boxShadow = 'none'
              }}
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>

          {error && (
            <div className="p-3 border rounded-lg text-sm font-semibold" style={{ backgroundColor: '#FFF5F5', borderColor: '#FC0105', color: '#FC0105', fontFamily: '"Open Sans", sans-serif', fontWeight: 600 }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full text-white py-3 px-6 rounded-lg disabled:opacity-50 font-bold shadow-md hover:shadow-lg transition-all"
            style={{
              fontFamily: '"Open Sans", sans-serif',
              fontWeight: 700,
              backgroundColor: '#FC0105',
              fontSize: '15px'
            }}
            onMouseEnter={(e) => {
              if (!isLoading) {
                e.currentTarget.style.backgroundColor = '#440102'
              }
            }}
            onMouseLeave={(e) => {
              if (!isLoading) {
                e.currentTarget.style.backgroundColor = '#FC0105'
              }
            }}
          >
            {isLoading ? 'Processing...' : (isSignUp ? 'Create Account' : 'Sign In')}
          </button>

          <div className="flex flex-col gap-3">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="flex-1 text-sm font-bold transition-all hover:scale-105"
                style={{
                  fontFamily: '"Open Sans", sans-serif',
                  fontWeight: 700,
                  color: '#FC0105'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#440102'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#FC0105'
                }}
              >
                {isSignUp ? '↩️ Already have an account?' : '✨ Need an account?'}
              </button>
              <button
                type="button"
                onClick={() => setShowEmailForm(false)}
                className="flex-1 text-sm font-bold transition-all hover:scale-105"
                style={{
                  fontFamily: '"Open Sans", sans-serif',
                  fontWeight: 700,
                  color: '#440102'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#FC0105'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#440102'
                }}
              >
                ← Back
              </button>
            </div>
            {!isSignUp && (
              <button
                type="button"
                onClick={() => {
                  setShowForgotPassword(true)
                  setShowEmailForm(false)
                  setError(null)
                }}
                className="text-sm font-bold transition-all hover:scale-105 text-center"
                style={{
                  fontFamily: '"Open Sans", sans-serif',
                  fontWeight: 700,
                  color: '#FC0105'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#440102'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#FC0105'
                }}
              >
                🔑 Forgot Password?
              </button>
            )}
          </div>
        </form>
      </div>
    )
  }

  return (
    <div className="space-y-4 w-full">
      <button
        onClick={handleGoogleSignIn}
        disabled={isLoading}
        className="w-full text-white py-3 px-6 rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-3 shadow-md hover:shadow-lg font-bold"
        style={{
          fontFamily: '"Open Sans", sans-serif',
          fontWeight: 700,
          backgroundColor: '#FC0105',
          fontSize: '15px'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#440102'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#FC0105'
        }}
      >
        <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
          <path fill="#FFFFFF" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#FFFFFF" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FFFFFF" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#FFFFFF" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        <span>Continue with Google</span>
      </button>

      <div className="relative my-5">
       <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t" style={{ borderColor: '#E5E5E5' }}></div>
       </div>
       <div className="relative flex justify-center text-xs">
        <span className="px-3 bg-white font-semibold uppercase tracking-wide" style={{ fontFamily: '"Open Sans", sans-serif', fontWeight: 600, color: '#999' }}>
         or
        </span>
       </div>
      </div>

      <button
        onClick={() => setShowEmailForm(true)}
        className="w-full border py-3 px-6 rounded-lg transition-all flex items-center justify-center gap-3 shadow-sm hover:shadow-md font-bold"
        style={{
          fontFamily: '"Open Sans", sans-serif',
          fontWeight: 700,
          backgroundColor: 'transparent',
          borderColor: '#440102',
          color: '#440102',
          fontSize: '15px'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#440102'
          e.currentTarget.style.color = '#FFFFFF'
          e.currentTarget.style.borderColor = '#440102'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent'
          e.currentTarget.style.color = '#440102'
          e.currentTarget.style.borderColor = '#440102'
        }}
      >
       <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
       </svg>
       <span>Continue with Email</span>
      </button>

      {error && (
        <div className="p-3 border rounded-lg text-sm font-semibold" style={{ backgroundColor: '#FFF5F5', borderColor: '#FC0105', color: '#FC0105', fontFamily: '"Open Sans", sans-serif', fontWeight: 600 }}>
         {error}
        </div>
      )}
    </div>
  )
}
