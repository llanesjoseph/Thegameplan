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
      <ClarityButton
        onClick={() => setShowForm(true)}
        variant={variant === 'outline' ? 'secondary' : 'primary'}
        size={size}
        icon={<Mail className="w-5 h-5" />}
        className={`w-full ${className}`}
      >
        Continue with Email
      </ClarityButton>
    )
  }

  return (
    <div className="w-full space-y-4">
      <form onSubmit={handleEmailAuth} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-clarity-text-primary mb-2">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-clarity-surface border border-clarity-text-secondary/20 focus:ring-2 focus:ring-clarity-accent focus:border-clarity-accent transition-colors"
            placeholder="your.email@example.com"
            required
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-clarity-text-primary mb-2">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 pr-12 rounded-lg bg-clarity-surface border border-clarity-text-secondary/20 focus:ring-2 focus:ring-clarity-accent focus:border-clarity-accent transition-colors"
              placeholder="••••••••"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-clarity-text-secondary hover:text-clarity-text-primary"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {isSignUp && (
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-clarity-text-primary mb-2">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-clarity-surface border border-clarity-text-secondary/20 focus:ring-2 focus:ring-clarity-accent focus:border-clarity-accent transition-colors"
              placeholder="••••••••"
              required
            />
          </div>
        )}

        {error && (
          <div className="p-3 rounded-lg bg-clarity-error/10 border border-clarity-error/20 text-clarity-error text-sm">
            {error}
          </div>
        )}

        <div className="space-y-3">
          <ClarityButton
            type="submit"
            loading={isLoading}
            className="w-full"
            variant="primary"
          >
            {isSignUp ? 'Create Account' : 'Sign In'}
          </ClarityButton>

          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp)
              setError(null)
              setPassword('')
              setConfirmPassword('')
            }}
            className="w-full text-sm text-clarity-text-secondary hover:text-clarity-accent transition-colors"
          >
            {isSignUp 
              ? 'Already have an account? Sign in instead' 
              : 'Need an account? Sign up instead'
            }
          </button>

          <button
            type="button"
            onClick={() => setShowForm(false)}
            className="w-full text-sm text-clarity-text-secondary hover:text-clarity-accent transition-colors"
          >
            ← Back to other options
          </button>
        </div>
      </form>
    </div>
  )
}
