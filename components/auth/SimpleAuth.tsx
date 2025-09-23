'use client'

import { useState } from 'react'
import { signInWithPopup, GoogleAuthProvider, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '@/lib/firebase.client'
import { useRouter } from 'next/navigation'
import { trackNewUser, notifyAdminsOfNewUser } from '@/lib/user-tracking-service'

export default function SimpleAuth() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showEmailForm, setShowEmailForm] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const router = useRouter()

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const provider = new GoogleAuthProvider()
      provider.setCustomParameters({
        prompt: 'select_account'
      })

      const result = await signInWithPopup(auth, provider)
      const user = result.user
      const isNewUser = (result as any).additionalUserInfo?.isNewUser || false

      console.log('Google sign-in successful:', user.email, isNewUser ? '(New User)' : '(Returning User)')

      // Track user signup/login
      const trackingData = {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || '',
        photoURL: user.photoURL || '',
        signUpMethod: 'google' as const,
        isNewUser
      }

      const tracked = await trackNewUser(trackingData)
      if (tracked && isNewUser) {
        // Notify admins of new user
        await notifyAdminsOfNewUser({ ...trackingData, timestamp: new Date() })
        // Redirect new users to onboarding
        router.push('/onboarding')
      } else {
        // Existing users go to dashboard
        router.push('/dashboard/overview')
      }
    } catch (error: any) {
      console.error('Google sign-in error:', error)
      setError(`Google sign-in failed: ${error.message}`)
    } finally {
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
        console.log('Email sign-up successful:', result.user.email)
      } else {
        result = await signInWithEmailAndPassword(auth, email, password)
        console.log('Email sign-in successful:', result.user.email)
      }

      const user = result.user
      const isNewUser = isSignUp

      // Track user signup/login
      const trackingData = {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || email.split('@')[0], // Use email prefix as display name
        photoURL: user.photoURL || '',
        signUpMethod: 'email' as const,
        isNewUser
      }

      const tracked = await trackNewUser(trackingData)
      if (tracked && isNewUser) {
        // Notify admins of new user
        await notifyAdminsOfNewUser({ ...trackingData, timestamp: new Date() })
        // Redirect new users to onboarding
        router.push('/onboarding')
      } else {
        // Existing users go to dashboard
        router.push('/dashboard/overview')
      }
    } catch (error: any) {
      console.error('Email auth error:', error)
      setError(`Email authentication failed: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  if (showEmailForm) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">
              {isSignUp ? 'Create Account' : 'Sign In'} with Email
            </h2>
            <button
              onClick={() => setShowEmailForm(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleEmailAuth} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cardinal focus:border-cardinal"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cardinal focus:border-cardinal"
                required
                minLength={6}
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
              className="w-full bg-cardinal hover:bg-cardinal-dark text-white py-2 px-4 rounded-lg font-medium disabled:opacity-50"
            >
              {isLoading ? 'Processing...' : (isSignUp ? 'Create Account' : 'Sign In')}
            </button>

            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="w-full text-sm text-gray-600 hover:text-cardinal"
            >
              {isSignUp ? 'Already have an account? Sign in' : 'Need an account? Sign up'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3 w-full">
      <button
        onClick={handleGoogleSignIn}
        disabled={isLoading}
        className="w-full bg-gradient-to-r from-sky-blue to-green hover:from-sky-blue/90 hover:to-green/90 text-white border border-sky-blue/30 py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2 sm:gap-3 shadow-lg hover:shadow-xl transform hover:scale-[1.02] text-sm sm:text-base"
      >
        <svg className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" viewBox="0 0 24 24">
          <path fill="#FFFFFF" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#E8E6D8" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FFFFFF" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#E8E6D8" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        <span className="truncate">Sign in with Google</span>
      </button>

      <button
        onClick={() => setShowEmailForm(true)}
        className="w-full bg-gradient-to-r from-orange to-deep-plum hover:from-orange/90 hover:to-deep-plum/90 text-white border border-orange/30 py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 sm:gap-3 shadow-lg hover:shadow-xl transform hover:scale-[1.02] text-sm sm:text-base"
      >
        <svg className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        <span className="truncate">Sign in with Email</span>
      </button>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          {error}
        </div>
      )}
    </div>
  )
}