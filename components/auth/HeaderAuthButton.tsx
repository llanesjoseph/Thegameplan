'use client'

import { useState } from 'react'
import { signInWithPopup, GoogleAuthProvider, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '@/lib/firebase.client'
import { useRouter } from 'next/navigation'
import { User, Mail, X } from 'lucide-react'

export default function HeaderAuthButton() {
  const [showModal, setShowModal] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const router = useRouter()

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const provider = new GoogleAuthProvider()
      provider.setCustomParameters({ prompt: 'select_account' })

      const result = await signInWithPopup(auth, provider)
      console.log('Google sign-in successful:', result.user.email)
      setShowModal(false)
      router.push('/dashboard/overview')
    } catch (error: any) {
      console.error('Google sign-in error:', error)
      setError('Sign-in failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      if (isSignUp) {
        const result = await createUserWithEmailAndPassword(auth, email, password)
        console.log('Email sign-up successful:', result.user.email)
      } else {
        const result = await signInWithEmailAndPassword(auth, email, password)
        console.log('Email sign-in successful:', result.user.email)
      }
      setShowModal(false)
      router.push('/dashboard/overview')
    } catch (error: any) {
      console.error('Email auth error:', error)
      if (error.code === 'auth/user-not-found') {
        setError('No account found with this email. Try signing up instead.')
      } else if (error.code === 'auth/wrong-password') {
        setError('Incorrect password. Please try again.')
      } else if (error.code === 'auth/email-already-in-use') {
        setError('Account already exists. Try signing in instead.')
      } else {
        setError('Authentication failed. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="inline-flex items-center gap-2 px-6 py-3 bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 rounded-lg font-medium transition-all duration-200 hover:scale-105 shadow-sm"
      >
        <User className="w-4 h-4" />
        Sign In
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">
                  {isSignUp ? 'Create Account' : 'Welcome Back'}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              {/* Google Sign-In */}
              <button
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 py-3 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-3 mb-4"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </button>

              {/* Divider */}
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">or</span>
                </div>
              </div>

              {/* Email Form */}
              <form onSubmit={handleEmailAuth} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cardinal focus:border-cardinal transition-colors"
                    placeholder="your@email.com"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cardinal focus:border-cardinal transition-colors"
                    placeholder="••••••••"
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
                  className="w-full bg-cardinal hover:bg-cardinal-dark text-white py-3 px-4 rounded-lg font-medium disabled:opacity-50 transition-colors"
                >
                  {isLoading ? 'Processing...' : (isSignUp ? 'Create Account' : 'Sign In')}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(!isSignUp)
                    setError(null)
                    setEmail('')
                    setPassword('')
                  }}
                  className="w-full text-sm text-gray-600 hover:text-cardinal transition-colors py-2"
                >
                  {isSignUp
                    ? 'Already have an account? Sign in'
                    : 'Need an account? Create one'
                  }
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  )
}