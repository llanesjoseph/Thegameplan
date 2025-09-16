'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getRedirectResult } from 'firebase/auth'
import { auth } from '@/lib/firebase.client'
import { useAuth } from '@/hooks/use-auth'
import AuthProvider from '@/components/auth/AuthProvider'

export default function Dashboard() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Handle OAuth redirect result
    const handleRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth)
        if (result) {
          console.log('Successfully signed in via redirect:', result.user.displayName)
          // Redirect to onboarding for new users to complete their profile
          router.push('/onboarding')
        }
      } catch (error) {
        console.error('Redirect sign-in error:', error)
      }
    }

    handleRedirectResult()
  }, [router])

  useEffect(() => {
    if (!loading && user) {
      // User is authenticated, redirect to dashboard overview
      console.log('User is authenticated, redirecting to dashboard overview')
      router.push('/dashboard/overview')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-cardinal mx-auto"></div>
          <p className="mt-4 text-gray-700">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  // If user is authenticated, show loading while redirecting
  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-cardinal mx-auto"></div>
          <p className="mt-4 text-gray-700">Redirecting to dashboard...</p>
        </div>
      </div>
    )
  }

  // User is not authenticated (guest)
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-md mx-auto px-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="mb-8">
            <div className="w-20 h-20 mx-auto mb-6 bg-cardinal rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Welcome to Game Plan</h1>
            <p className="text-lg text-gray-600 mb-2">
              Sign in to access your personalized dashboard and start your training journey with elite athletes.
            </p>
            <div className="mb-6 p-3 bg-cardinal/10 border border-cardinal/20 rounded-lg">
              <p className="text-sm font-medium text-cardinal">
                <strong>Returning User?</strong> Use any sign-in method below to access your existing account
              </p>
            </div>
          </div>
          
          <div className="space-y-4 mb-6">
            <AuthProvider variant="compact" returnUserPrompt={true} />
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">or</span>
              </div>
            </div>
            
            <button 
              onClick={() => router.push('/')}
              className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-900 border border-gray-300 rounded-lg font-medium transition-colors"
            >
              Browse as Guest
            </button>
          </div>
          
          <div className="text-center">
            <button 
              onClick={() => router.push('/contributors')}
              className="text-cardinal hover:text-cardinal-dark text-sm font-medium"
            >
              New to Game Plan? Explore our contributors
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
