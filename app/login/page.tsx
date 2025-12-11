'use client'

import { useEffect, useState, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { auth, db } from '@/lib/firebase.client'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import AuthButtons from '@/components/auth/AuthButtons'
import Link from 'next/link'

// FORCE DYNAMIC - NO STATIC GENERATION
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isChecking, setIsChecking] = useState(true)
  const hasRedirected = useRef(false)
  const mode = searchParams?.get('mode') || 'signin' // 'signin' or 'signup'

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

            console.log('[Login] User authenticated, fetching role')

            // Get user role using API (faster and more reliable)
            try {
              const response = await fetch('/api/user/role', {
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              })
              
              let role = 'athlete' // default
              if (response.ok) {
                const data = await response.json()
                if (data.success) {
                  role = data.data.role || 'athlete'
                }
              } else {
                // Fallback to direct Firestore fetch
                const userDoc = await getDoc(doc(db, 'users', user.uid))
                const userData = userDoc.data()
                role = userData?.role || 'athlete'
              }
              
              console.log('[Login] User role:', role)
              
              // Route directly to role-specific welcome/dashboard pages so the
              // sequence is SIGN IN -> WELCOME -> PROFILE.
              let redirectPath = '/dashboard/athlete/welcome'
              if (role === 'athlete') {
                redirectPath = '/dashboard/athlete/welcome'
              } else if (role === 'superadmin' || role === 'admin') {
                redirectPath = '/dashboard/admin'
              } else if (role === 'coach' || role === 'assistant_coach' || role === 'creator') {
                redirectPath = '/dashboard/coach/welcome'
              }
              
              console.log('[Login] Redirecting to:', redirectPath)
              window.location.href = redirectPath
            } catch (error) {
              console.error('[Login] Error fetching user role:', error)
              // Fallback to dashboard if role fetch fails
              window.location.href = '/dashboard'
            }
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
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#FFFFFF', fontFamily: '"Open Sans", sans-serif' }}>
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="text-2xl tracking-wider uppercase font-bold cursor-pointer transition-opacity hover:opacity-80"
              style={{ 
                fontFamily: '"Open Sans", sans-serif',
                fontWeight: 700,
                color: '#440102' 
              }}
            >
              ATHLEAP
            </Link>
            {mode === 'signin' && (
              <p className="text-sm font-bold" style={{ fontFamily: '"Open Sans", sans-serif', color: '#440102' }}>
                New here?{' '}
                <button
                  onClick={() => router.push('/login?mode=signup')}
                  className="font-bold transition-colors"
                  style={{ color: '#FC0105' }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#440102'}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#FC0105'}
                >
                  Join Now
                </button>
              </p>
            )}
            {mode === 'signup' && (
              <p className="text-sm font-bold" style={{ fontFamily: '"Open Sans", sans-serif', color: '#440102' }}>
                Already have an account?{' '}
                <button
                  onClick={() => router.push('/login?mode=signin')}
                  className="font-bold transition-colors"
                  style={{ color: '#FC0105' }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#440102'}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#FC0105'}
                >
                  Sign In
                </button>
              </p>
            )}
          </div>
        </div>
      </header>

      {/* Login Form */}
      <main className="flex-1 flex items-center justify-center px-4 py-12" style={{ backgroundColor: '#440102' }}>
        <div className="w-full max-w-md">
          <div className="bg-white rounded-xl shadow-2xl p-8" style={{ border: '3px solid #440102' }}>
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold mb-2" style={{ fontFamily: '"Open Sans", sans-serif', fontWeight: 700, color: '#440102' }}>
                {mode === 'signup' ? 'Join AthLeap' : 'Welcome Back'}
              </h1>
              <p className="text-sm font-semibold" style={{ fontFamily: '"Open Sans", sans-serif', color: '#FC0105', fontWeight: 700 }}>
                {mode === 'signup' 
                  ? 'Start your athletic journey today' 
                  : 'Let\'s get back to training'}
              </p>
            </div>

            {/* Auth Buttons */}
            <AuthButtons initialMode={mode === 'signup' ? 'signup' : 'signin'} />

            {/* Terms */}
            <div className="mt-6 text-center">
              <p className="text-xs" style={{ fontFamily: '"Open Sans", sans-serif', color: '#440102', opacity: 0.7 }}>
                By signing in, you agree to our{' '}
                <a href="/terms" className="font-bold" style={{ color: '#FC0105' }}>
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="/privacy" className="font-bold" style={{ color: '#FC0105' }}>
                  Privacy Policy
                </a>
              </p>
            </div>
          </div>

          {/* Back to home */}
          <div className="text-center mt-6">
            <button
              onClick={() => router.push('/')}
              className="text-sm font-bold transition-colors"
              style={{ fontFamily: '"Open Sans", sans-serif', color: '#FFFFFF' }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#FC0105'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#FFFFFF'}
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
      <LoginContent />
    </Suspense>
  )
}
