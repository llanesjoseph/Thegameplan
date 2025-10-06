'use client'

import { useEffect, useRef } from 'react'
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
 const hasRedirected = useRef(false)

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

 // Redirect authenticated users based on their role
 useEffect(() => {
  if (!loading && user && !hasRedirected.current) {
   hasRedirected.current = true
   const userRole = (user as any).role

   // Debug logging
   console.log('🔍 DASHBOARD ROUTING DEBUG:', {
    email: user.email,
    uid: user.uid,
    detectedRole: userRole,
    roleType: typeof userRole,
    userObject: user
   })

   // CRITICAL: Do not default to 'creator' if role is undefined - this causes athletes to see creator dashboard
   if (!userRole) {
    console.error('❌ ROLE NOT LOADED - Waiting for role to be available')
    hasRedirected.current = false // Reset flag to allow retry
    return
   }

   // Route based on user role
   if (userRole === 'superadmin') {
    console.log('✅ Superadmin authenticated, redirecting to Admin Dashboard')
    router.replace('/dashboard/admin')
   } else if (userRole === 'admin') {
    console.log('✅ Admin authenticated, redirecting to Admin Dashboard')
    router.replace('/dashboard/admin')
   } else if (userRole === 'athlete') {
    console.log('✅ Athlete authenticated, redirecting to Progress Dashboard')
    router.replace('/dashboard/progress')
   } else if (userRole === 'creator' || userRole === 'coach' || userRole === 'assistant' || userRole === 'user') {
    console.log(`✅ ${userRole} authenticated, redirecting to Creator Dashboard`)
    router.replace('/dashboard/creator')
   } else {
    console.warn('⚠️ Unknown role:', userRole, '- defaulting to Creator Dashboard')
    router.replace('/dashboard/creator')
   }
  }
 }, [user, loading, router])

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
