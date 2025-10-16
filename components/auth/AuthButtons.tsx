'use client'

import { useState } from 'react'
import { signInWithPopup, GoogleAuthProvider, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '@/lib/firebase.client'

export default function AuthButtons() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showEmailForm, setShowEmailForm] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
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

      // Wait for token to be generated
      const token = await result.user.getIdToken()
      console.log('[AuthButtons] Token received, auth complete')

      // onAuthStateChanged in login page will handle redirect
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
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password)
        console.log('[AuthButtons] Email sign-up successful')
      } else {
        await signInWithEmailAndPassword(auth, email, password)
        console.log('[AuthButtons] Email sign-in successful')
      }
      // onAuthStateChanged in login page will handle redirect
    } catch (error: any) {
      console.error('[AuthButtons] Email auth error:', error)
      setError(`Email authentication failed: ${error.message}`)
      setIsLoading(false)
    }
  }

  if (showEmailForm) {
    return (
      <div className="space-y-4">
        <form onSubmit={handleEmailAuth} className="space-y-4">
          <div>
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

          <div>
            <label className="block text-sm text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
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
            className="w-full bg-teal-600 hover:bg-teal-700 text-white py-2 px-4 rounded-lg disabled:opacity-50"
          >
            {isLoading ? 'Processing...' : (isSignUp ? 'Create Account' : 'Sign In')}
          </button>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="flex-1 text-sm text-gray-600 hover:text-teal-600"
            >
              {isSignUp ? 'Already have an account?' : 'Need an account?'}
            </button>
            <button
              type="button"
              onClick={() => setShowEmailForm(false)}
              className="flex-1 text-sm text-gray-600 hover:text-teal-600"
            >
              ← Back to options
            </button>
          </div>
        </form>
      </div>
    )
  }

  return (
    <div className="space-y-3 w-full">
      <button
        onClick={handleGoogleSignIn}
        disabled={isLoading}
        className="w-full bg-gradient-to-r from-sky-blue to-green hover:from-sky-blue/90 hover:to-green/90 text-white border border-sky-blue/30 py-3 px-4 rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
      >
        <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
          <path fill="#FFFFFF" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#E8E6D8" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FFFFFF" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#E8E6D8" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        <span>Sign in with Google</span>
      </button>

      <button
        onClick={() => setShowEmailForm(true)}
        className="w-full bg-gradient-to-r from-orange to-black hover:from-orange/90 hover:to-black/90 text-white border border-orange/30 py-3 px-4 rounded-lg transition-all flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
      >
        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        <span>Sign in with Email</span>
      </button>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          {error}
        </div>
      )}
    </div>
  )
}
