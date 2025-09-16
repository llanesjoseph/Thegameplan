'use client'

import { useState } from 'react'
import { signInWithPopup, signInWithRedirect, OAuthProvider } from 'firebase/auth'
import { auth } from '@/lib/firebase.client'
import { useRouter } from 'next/navigation'
import { ClarityButton } from '@/components/ui/ClarityButton'

interface AppleSignInButtonProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'outline'
}

export default function AppleSignInButton({ 
  className = '', 
  size = 'md',
  variant = 'default' 
}: AppleSignInButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleAppleSignIn = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const provider = new OAuthProvider('apple.com')
      
      // Request additional scopes if needed
      provider.addScope('email')
      provider.addScope('name')
      
      // Configure custom parameters
      provider.setCustomParameters({
        // Locale for Apple sign-in UI
        locale: 'en'
      })

      // Try popup first, fallback to redirect if popup fails
      try {
        const result = await signInWithPopup(auth, provider)
        const user = result.user

        console.log('Successfully signed in with Apple:', user.displayName || user.email)
        
        // Redirect to onboarding for new users to complete their profile
        router.push('/onboarding')
      } catch (popupError: unknown) {
        console.log('Apple popup failed, trying redirect method:', popupError)
        // If popup fails, try redirect method
        const errorCode = popupError && typeof popupError === 'object' && 'code' in popupError ? (popupError as any).code : null
        if (errorCode === 'auth/popup-blocked' || errorCode === 'auth/popup-closed-by-user') {
          console.log('Using redirect method instead')
          await signInWithRedirect(auth, provider)
          // Note: redirect will reload the page, so we don't need to handle the result here
          return
        } else {
          // Re-throw other errors to be handled by outer catch
          throw popupError
        }
      }
      
    } catch (error: unknown) {
      console.error('Apple sign in error:', error)
      
      // User-friendly error messages
      const errorCode = error && typeof error === 'object' && 'code' in error ? (error as any).code : null
      switch (errorCode) {
        case 'auth/account-exists-with-different-credential':
          setError('An account already exists with the same email address but different sign-in credentials.')
          break
        case 'auth/auth-domain-config-required':
          setError('Apple Sign-In is not properly configured. Please contact support.')
          break
        case 'auth/cancelled-popup-request':
          setError('Sign-in was cancelled. Please try again.')
          break
        case 'auth/operation-not-allowed':
          setError('Apple Sign-In is not enabled. Please contact support.')
          break
        case 'auth/popup-blocked':
          setError('Sign-in popup was blocked by your browser. Please allow popups and try again.')
          break
        case 'auth/popup-closed-by-user':
          setError('Sign-in was cancelled.')
          break
        case 'auth/unauthorized-domain':
          setError('This domain is not authorized for Apple Sign-In.')
          break
        default:
          setError('Apple Sign-In failed. Please try again or use a different method.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full">
      <ClarityButton
        onClick={handleAppleSignIn}
        loading={isLoading}
        variant={variant === 'outline' ? 'secondary' : 'primary'}
        size={size}
        className={`w-full bg-black hover:bg-gray-800 text-white border-black ${className}`}
        icon={
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
          </svg>
        }
      >
        Continue with Apple
      </ClarityButton>

      {error && (
        <div className="mt-3 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
          {error}
        </div>
      )}
    </div>
  )
}
