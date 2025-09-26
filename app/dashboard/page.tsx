'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getRedirectResult } from 'firebase/auth'
import { auth } from '@/lib/firebase.client'
import { useAuth } from '@/hooks/use-auth'
import SimpleAuth from '@/components/auth/SimpleAuth'
import AppHeader from '@/components/ui/AppHeader'
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
 //  if (!loading && user) {
 //   // User is authenticated, redirect to dashboard overview
 //   console.log('User is authenticated, redirecting to dashboard overview')
 //   router.push('/dashboard/overview')
 //  }
 // }, [user, loading, router])

 if (loading) {
  return (
   <div className="min-h-screen bg-gray-50">
    <AppHeader />
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
    <AppHeader />
    <ProfileCompletionBanner />

    <div className="flex items-center justify-center min-h-[70vh]">
     <div className="text-center bg-white rounded-xl shadow-sm border border-gray-200 p-8">
      <h1 className="text-2xl text-gray-900 mb-4">Welcome to PLAYBOOKD</h1>
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

 // If user is not authenticated, show auth form
 return (
  <div className="min-h-screen bg-gray-50">
   <AppHeader />
   <div className="flex items-center justify-center min-h-[80vh]">
    <div className="w-full max-w-md">
     <SimpleAuth />
    </div>
   </div>
  </div>
 )
}
