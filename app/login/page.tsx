'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { auth } from '@/lib/firebase.client'
import { onAuthStateChanged } from 'firebase/auth'
import AuthButtons from '@/components/auth/AuthButtons'

// FORCE DYNAMIC - NO STATIC GENERATION
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export default function LoginPage() {
  const router = useRouter()
  const [isChecking, setIsChecking] = useState(true)
  const hasRedirected = useRef(false)

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      // Prevent multiple redirects
      if (hasRedirected.current) {
        return
      }

      if (user) {
        // Verify user has a valid token before redirecting
        try {
          const token = await user.getIdToken()
          if (token) {
            hasRedirected.current = true

            console.log('[Login] User authenticated, redirecting to dashboard')

            // Get redirect param from URL
            const params = new URLSearchParams(window.location.search)
            const redirect = params.get('redirect') || '/dashboard/coach-unified'

            console.log('[Login] Redirecting to:', redirect)

            // Use window.location.href for hard redirect
            window.location.href = redirect
          }
        } catch (error) {
          console.error('[Login] Token verification failed:', error)
          setIsChecking(false)
        }
      } else {
        // No user, show login form
        setIsChecking(false)
      }
    })

    return () => unsubscribe()
  }, [router])

  // Show loading while checking auth
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#E8E6D8' }}>
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mb-4"></div>
          <p className="text-gray-700">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#E8E6D8' }}>
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push('/')}
              className="text-2xl tracking-wider uppercase font-bold"
              style={{ 
                fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
                color: '#624A41' 
              }}
            >
              ATHLEAP
            </button>
            <p className="text-sm text-gray-600">
              New here?{' '}
              <button
                onClick={() => router.push('/signup')}
                className="text-teal-600 hover:text-teal-700 font-semibold"
              >
                Sign up
              </button>
            </p>
          </div>
        </div>
      </header>

      {/* Login Form */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-xl shadow-xl p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Welcome Back
              </h1>
              <p className="text-gray-600">
                Sign in to access your dashboard
              </p>
            </div>

            {/* Auth Buttons */}
            <AuthButtons />

            {/* Terms */}
            <div className="mt-6 text-center">
              <p className="text-xs text-gray-500">
                By signing in, you agree to our{' '}
                <a href="/terms" className="text-teal-600 hover:underline">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="/privacy" className="text-teal-600 hover:underline">
                  Privacy Policy
                </a>
              </p>
            </div>
          </div>

          {/* Back to home */}
          <div className="text-center mt-6">
            <button
              onClick={() => router.push('/')}
              className="text-gray-600 hover:text-gray-900 text-sm"
            >
              ← Back to home
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
