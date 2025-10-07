'use client'

import { useEffect, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { getRedirectResult } from 'firebase/auth'
import { auth } from '@/lib/firebase.client'
import { useAuth } from '@/hooks/use-auth'
import SimpleAuth from '@/components/auth/SimpleAuth'
import AppHeader from '@/components/ui/AppHeader'
import ProfileCompletionBanner from '@/components/ui/ProfileCompletionBanner'

export default function Dashboard() {
 const { user, loading } = useAuth()
 const router = useRouter()
 const pathname = usePathname()
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
 }, [])

 // Redirect authenticated users based on their role
 useEffect(() => {
  // Don't redirect while loading
  if (loading) return

  // Don't redirect if no user
  if (!user) return

  // Don't redirect if already redirected
  if (hasRedirected.current) return

  // Only redirect if we're on the base dashboard page
  if (pathname !== '/dashboard') return

  const userRole = (user as any).role

  // CRITICAL: Do not default to 'creator' if role is undefined - this causes athletes to see creator dashboard
  if (!userRole) {
   console.error('❌ ROLE NOT LOADED - Waiting for role to be available')
   return // Don't set hasRedirected, allow retry
  }

  // Mark as redirected BEFORE redirecting to prevent double-redirect
  hasRedirected.current = true

  // Use sessionStorage to prevent re-redirects on re-renders
  const redirectKey = `dashboard_redirect_${user.uid}`
  if (typeof window !== 'undefined') {
   const lastRedirect = sessionStorage.getItem(redirectKey)
   if (lastRedirect && Date.now() - parseInt(lastRedirect) < 5000) {
    return // Don't redirect again within 5 seconds
   }
   sessionStorage.setItem(redirectKey, Date.now().toString())
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
 }, [user, loading, pathname])

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
