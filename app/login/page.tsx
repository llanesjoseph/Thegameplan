'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import SimpleAuth from '@/components/auth/SimpleAuth'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

function LoginPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading } = useAuth()
  const [redirectPath, setRedirectPath] = useState('/dashboard/coach-unified')

  useEffect(() => {
    // Get the redirect parameter from URL
    const redirect = searchParams.get('redirect')
    if (redirect) {
      setRedirectPath(redirect)
    }
  }, [searchParams])

  useEffect(() => {
    // If user is already logged in, redirect them
    if (!loading && user) {
      router.push(redirectPath)
    }
  }, [user, loading, router, redirectPath])

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#E8E6D8' }}>
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mb-4"></div>
          <p className="text-gray-700">Loading...</p>
        </div>
      </div>
    )
  }

  // If user is logged in, don't show the form (will redirect via useEffect)
  if (user) {
    return null
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

            {/* Use the existing SimpleAuth component */}
            <SimpleAuth />

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

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#E8E6D8' }}>
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mb-4"></div>
          <p className="text-gray-700">Loading...</p>
        </div>
      </div>
    }>
      <LoginPageContent />
    </Suspense>
  )
}
