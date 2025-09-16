'use client'

import { useState } from 'react'
import { signInWithPopup, signInWithRedirect, GoogleAuthProvider } from 'firebase/auth'
import { auth } from '@/lib/firebase.client'
import { useRouter } from 'next/navigation'

interface GoogleSignInButtonProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'outline'
}

export default function GoogleSignInButton({ 
  className = '', 
  size = 'md',
  variant = 'default' 
}: GoogleSignInButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-3 text-base',
    lg: 'px-6 py-4 text-lg'
  }

  const variantClasses = {
    default: 'bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 shadow-sm',
    outline: 'bg-transparent hover:bg-gray-50 text-gray-800 border border-gray-300'
  }

  const handleGoogleSignIn = async () => {
    console.log('🔥 BUTTON CLICKED - Google sign-in triggered!')
    setIsLoading(true)
    setError(null)

    console.log('🚀 Starting Google sign-in process...')

    try {
      // Check if auth is initialized
      if (!auth) {
        throw new Error('Firebase auth not initialized')
      }

      console.log('🔧 Creating Google Auth Provider...')
      const provider = new GoogleAuthProvider()

      // Request additional scopes if needed
      provider.addScope('profile')
      provider.addScope('email')

      // Configure custom parameters
      provider.setCustomParameters({
        prompt: 'select_account'
      })

      console.log('🎯 Attempting popup sign-in...')

      // Try popup first, fallback to redirect if popup fails (for blockers, extensions, or strict browsers)
      try {
        const result = await signInWithPopup(auth, provider)
        const user = result.user

        console.log('✅ Successfully signed in:', {
          displayName: user.displayName,
          email: user.email,
          uid: user.uid
        })

        // Small delay to ensure Firebase auth state is updated
        await new Promise(resolve => setTimeout(resolve, 500))

        // Redirect to onboarding for new users to complete their profile
        router.push('/onboarding')
      } catch (popupError: unknown) {
        console.log('⚠️ Popup sign-in failed, attempting redirect fallback...', popupError)
        // Always attempt redirect as a robust fallback since some environments misclassify popup errors
        await signInWithRedirect(auth, provider)
        return
      }
      
    } catch (error: unknown) {
      // Handle different types of errors
      const errorCode = error && typeof error === 'object' && 'code' in error ? (error as any).code : null
      const errorMessage = error && typeof error === 'object' && 'message' in error ? (error as any).message : 'Unknown error'
      
      console.error('Google sign in error:', error)
      console.error('Error code:', errorCode)
      console.error('Error message:', errorMessage)
      
      if (errorCode === 'auth/popup-closed-by-user') {
        setError('Sign in was cancelled')
      } else if (errorCode === 'auth/popup-blocked') {
        setError('Popup was blocked. Please allow popups and try again.')
      } else if (errorCode === 'auth/unauthorized-domain') {
        setError('This domain is not authorized for OAuth operations. Please contact support.')
      } else if (errorCode === 'auth/operation-not-allowed') {
        setError('Google sign in is not enabled. Please contact support.')
      } else if (errorCode === 'auth/internal-error') {
        setError('Internal error occurred. This is usually due to domain authorization issues.')
      } else {
        setError(`Failed to sign in: ${errorMessage}`)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full">
      <button
        onClick={handleGoogleSignIn}
        disabled={isLoading}
        type="button"
        className={`
          w-full flex items-center justify-center gap-3 rounded-lg font-medium
          transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
          hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-cardinal focus:ring-offset-2
          ${sizeClasses[size]} ${variantClasses[variant]} ${className}
        `}
      >
        {isLoading ? (
          <>
            <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
            <span>Signing in...</span>
          </>
        ) : (
          <>
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span>Continue with Google</span>
          </>
        )}
      </button>
      
      {error && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
    </div>
  )
}