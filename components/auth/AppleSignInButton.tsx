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
   console.log('[AppleSignIn] Starting Apple Sign-In process...')
   console.log('[AppleSignIn] Auth domain:', process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN)
   console.log('[AppleSignIn] Project ID:', process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID)

   const provider = new OAuthProvider('apple.com')

   // Request additional scopes if needed
   provider.addScope('email')
   provider.addScope('name')

   // Configure custom parameters
   provider.setCustomParameters({
    // Locale for Apple sign-in UI
    locale: 'en'
   })

   console.log('[AppleSignIn] Provider configured, attempting popup...')

   // Try popup first, fallback to redirect if popup fails
   try {
    const result = await signInWithPopup(auth, provider)
    const user = result.user

    console.log('[AppleSignIn] ✓ Successfully signed in with Apple:', user.displayName || user.email)
    console.log('[AppleSignIn] User ID:', user.uid)
    console.log('[AppleSignIn] Provider Data:', user.providerData)

    // Redirect to onboarding for new users to complete their profile
    router.push('/onboarding')
   } catch (popupError: unknown) {
    const errorCode = popupError && typeof popupError === 'object' && 'code' in popupError ? (popupError as any).code : null
    const errorMessage = popupError && typeof popupError === 'object' && 'message' in popupError ? (popupError as any).message : 'Unknown error'

    console.error('[AppleSignIn] Popup error:', errorCode, errorMessage)

    // If popup fails, try redirect method
    if (errorCode === 'auth/popup-blocked' || errorCode === 'auth/popup-closed-by-user') {
     console.log('[AppleSignIn] Using redirect method instead...')
     await signInWithRedirect(auth, provider)
     // Note: redirect will reload the page, so we don't need to handle the result here
     return
    } else {
     // Re-throw other errors to be handled by outer catch
     throw popupError
    }
   }

  } catch (error: unknown) {
   const errorCode = error && typeof error === 'object' && 'code' in error ? (error as any).code : null
   const errorMessage = error && typeof error === 'object' && 'message' in error ? (error as any).message : 'Unknown error'

   console.error('[AppleSignIn] ✗ Sign-in failed')
   console.error('[AppleSignIn] Error code:', errorCode)
   console.error('[AppleSignIn] Error message:', errorMessage)
   console.error('[AppleSignIn] Full error:', error)

   // User-friendly error messages with diagnostic info
   switch (errorCode) {
    case 'auth/account-exists-with-different-credential':
     setError('An account already exists with this email using a different sign-in method. Try signing in with Google or Email instead.')
     break
    case 'auth/auth-domain-config-required':
     setError('⚠️ Configuration Error: Apple Sign-In is not properly configured in Firebase. Please contact support with error code: auth-domain-config')
     console.error('[AppleSignIn] ADMIN ACTION REQUIRED: Check Firebase Console > Authentication > Settings > Authorized domains')
     break
    case 'auth/cancelled-popup-request':
     setError('Sign-in was cancelled. Please try again.')
     break
    case 'auth/operation-not-allowed':
     setError('⚠️ Configuration Error: Apple Sign-In is disabled. Please contact support with error code: operation-not-allowed')
     console.error('[AppleSignIn] ADMIN ACTION REQUIRED: Enable Apple provider in Firebase Console > Authentication > Sign-in method')
     break
    case 'auth/popup-blocked':
     setError('Your browser blocked the sign-in popup. Please allow popups for this site and try again.')
     break
    case 'auth/popup-closed-by-user':
     setError('Sign-in was cancelled. Please try again.')
     break
    case 'auth/unauthorized-domain':
     setError('⚠️ Configuration Error: This domain is not authorized. Please contact support with error code: unauthorized-domain')
     console.error('[AppleSignIn] ADMIN ACTION REQUIRED: Add domain to Firebase Console > Authentication > Settings > Authorized domains')
     console.error('[AppleSignIn] Current domain:', window.location.hostname)
     break
    case 'auth/network-request-failed':
     setError('Network error. Please check your internet connection and try again.')
     break
    default:
     setError(`Apple Sign-In failed: ${errorMessage || 'Unknown error'}. Please try Google or Email sign-in instead, or contact support.`)
     console.error('[AppleSignIn] Unhandled error code:', errorCode)
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
