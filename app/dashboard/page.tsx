'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getRedirectResult } from 'firebase/auth'
import { auth } from '@/lib/firebase.client'
import { useAuth } from '@/hooks/use-auth'
import SimpleAuth from '@/components/auth/SimpleAuth'
import { UserIdentity } from '@/components/user-identity'
import ProfileCompletionBanner from '@/components/ui/ProfileCompletionBanner'

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

  // REMOVED AGGRESSIVE REDIRECT - This was causing admin panel flickering
  // useEffect(() => {
  //   if (!loading && user) {
  //     // User is authenticated, redirect to dashboard overview
  //     console.log('User is authenticated, redirecting to dashboard overview')
  //     router.push('/dashboard/overview')
  //   }
  // }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* User controls at top */}
        <div className="flex justify-end p-4">
          <UserIdentity />
        </div>
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-center bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-cardinal mx-auto"></div>
            <p className="mt-4 text-gray-700">Loading your dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  // If user is authenticated, show overview directly (no redirect)
  if (user) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* User controls and profile completion banner at top */}
        <div className="space-y-0">
          <ProfileCompletionBanner />
          <div className="flex justify-end p-4">
            <UserIdentity />
          </div>
        </div>

        <div className="flex items-center justify-center min-h-[70vh]">
          <div className="text-center bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Welcome to PLAYBOOKD</h1>
            <p className="text-gray-600 mb-6">You're successfully signed in!</p>
            <button
              onClick={() => router.push('/dashboard/overview')}
              className="px-6 py-3 bg-cardinal text-white rounded-lg hover:bg-cardinal-dark transition-colors"
            >
              Go to Dashboard Overview
            </button>
          </div>
        </div>
      </div>
    )
  }

  // User is not authenticated (guest)
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="min-h-screen flex items-start sm:items-center justify-center pt-8 pb-12">
      <div className="text-center w-full max-w-lg mx-auto px-4 sm:px-6">
        <div className="bg-white/95 backdrop-blur rounded-2xl shadow-card-md border border-gray-200 p-6 sm:p-8">
          <div className="mb-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-cardinal rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">Welcome to PLAYBOOKD</h1>
            <p className="text-sm sm:text-base text-gray-600 mb-2">
              Sign in to access your personalized dashboard and start your training journey with elite athletes.
            </p>
            <div className="mb-6 p-3 bg-cardinal/10 border border-cardinal/20 rounded-lg">
              <p className="text-sm font-medium text-cardinal">
                <strong>Returning User?</strong> Use any sign-in method below to access your existing account
              </p>
            </div>
          </div>
          
          <div className="space-y-4 mb-4">
            <SimpleAuth />

          </div>
          
          <div className="text-center">
            <button 
              onClick={() => router.push('/contributors')}
              className="text-cardinal hover:text-cardinal-dark text-sm font-medium"
            >
              New to PLAYBOOKD? Explore our contributors
            </button>
          </div>
        </div>
      </div>
      </div>
    </div>
  )
}
