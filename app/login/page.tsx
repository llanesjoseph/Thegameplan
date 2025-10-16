'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { auth } from '@/lib/firebase.client'
import { onAuthStateChanged } from 'firebase/auth'
import AuthButtons from '@/components/auth/AuthButtons'

// FORCE DYNAMIC - NO STATIC GENERATION
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export default function LoginPage() {
  const router = useRouter()

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // User is signed in, redirect to dashboard
        console.log('[Login] User authenticated, redirecting to dashboard')

        // Get redirect param from URL
        const params = new URLSearchParams(window.location.search)
        const redirect = params.get('redirect') || '/dashboard/coach-unified'

        router.push(redirect)
      }
    })

    return () => unsubscribe()
  }, [router])

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#E8E6D8' }}>
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push('/')}
              className="text-2xl tracking-wider uppercase font-bold"
              style={{ color: '#624A41' }}
            >
              PLAYBOOKD
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
