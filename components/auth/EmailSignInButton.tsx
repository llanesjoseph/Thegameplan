'use client'

import { useState } from 'react'
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth'
import { auth } from '@/lib/firebase.client'
import { useRouter } from 'next/navigation'
import { Mail, Eye, EyeOff } from 'lucide-react'
import { ClarityButton } from '@/components/ui/ClarityButton'

interface EmailSignInButtonProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'outline'
}

export default function EmailSignInButton({ 
  className = '', 
  size = 'md',
  variant = 'default' 
}: EmailSignInButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSignUp, setIsSignUp] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const router = useRouter()

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      // Validation
      if (!email || !password) {
        throw new Error('Please fill in all fields')
      }

      if (isSignUp && password !== confirmPassword) {
        throw new Error('Passwords do not match')
      }

      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters')
      }

      let result
      if (isSignUp) {
        result = await createUserWithEmailAndPassword(auth, email, password)
        console.log('Successfully created account:', result.user.email)
      } else {
        result = await signInWithEmailAndPassword(auth, email, password)
        console.log('Successfully signed in:', result.user.email)
      }
      
      // Redirect to onboarding for new users to complete their profile
      router.push('/onboarding')
      
    } catch (error: unknown) {
      console.error('Email authentication error:', error)
      
      // User-friendly error messages
      const errorCode = error && typeof error === 'object' && 'code' in error ? (error as any).code : null
      switch (errorCode) {
        case 'auth/user-not-found':
          setError('No account found with this email. Try signing up instead.')
          break
        case 'auth/wrong-password':
          setError('Incorrect password. Please try again.')
          break
        case 'auth/email-already-in-use':
          setError('An account with this email already exists. Try signing in instead.')
          break
        case 'auth/weak-password':
          setError('Password is too weak. Please choose a stronger password.')
          break
        case 'auth/invalid-email':
          setError('Please enter a valid email address.')
          break
        case 'auth/too-many-requests':
          setError('Too many failed attempts. Please wait a moment and try again.')
          break
        default:
          const errorMessage = error && typeof error === 'object' && 'message' in error ? (error as any).message : 'Authentication failed. Please try again.'
          setError(errorMessage)
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (!showForm) {
    return (
      <button
        onClick={() => setShowForm(true)}
        className={`w-full flex items-center justify-center gap-3 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-cardinal focus:ring-offset-2 px-4 py-3 text-base ${
          variant === 'outline'
            ? 'bg-transparent hover:bg-gray-50 text-gray-800 border border-gray-300'
            : 'bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 shadow-sm'
        } ${className}`}
      >
        <Mail className="w-5 h-5" />
        <span>Continue with Email</span>
      </button>
    )
  }

  return (
    <>
      {/* Modal Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800">
                {isSignUp ? 'Create Account' : 'Sign In'} with Email
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleEmailAuth} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-800 mb-2">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-white border border-gray-300 focus:ring-2 focus:ring-cardinal focus:border-cardinal transition-colors"
                  placeholder="your.email@example.com"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-800 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 pr-12 rounded-lg bg-white border border-gray-300 focus:ring-2 focus:ring-cardinal focus:border-cardinal transition-colors"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-gray-800"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {isSignUp && (
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-800 mb-2">
                    Confirm Password
                  </label>
                  <input
                    id="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg bg-white border border-gray-300 focus:ring-2 focus:ring-cardinal focus:border-cardinal transition-colors"
                    placeholder="••••••••"
                    required
                  />
                </div>
              )}

              {error && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-3 pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-cardinal hover:bg-cardinal-dark text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>{isSignUp ? 'Creating Account...' : 'Signing In...'}</span>
                    </div>
                  ) : (
                    <span>{isSignUp ? 'Create Account' : 'Sign In'}</span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(!isSignUp)
                    setError(null)
                    setPassword('')
                    setConfirmPassword('')
                  }}
                  className="w-full text-sm text-gray-600 hover:text-cardinal transition-colors py-2"
                >
                  {isSignUp
                    ? 'Already have an account? Sign in instead'
                    : 'Need an account? Sign up instead'
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}
