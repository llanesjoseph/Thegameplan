'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { getRedirectResult } from 'firebase/auth'
import { auth, db } from '@/lib/firebase.client'
import { useAuth } from '@/hooks/use-auth'
import { usePageAnalytics } from '@/hooks/use-page-analytics'
import SimpleAuth from '@/components/auth/SimpleAuth'
import AppHeader from '@/components/ui/AppHeader'

/**
 * BULLETPROOF ROUTING SYSTEM
 *
 * This is the SINGLE SOURCE OF TRUTH for all dashboard routing.
 * NO other page should have redirect logic - they just render content.
 *
 * Rules:
 * 1. ALWAYS wait for real role from Firestore (never use 'guest' or undefined)
 * 2. DIRECT routing to correct dashboard based on actual role
 * 3. Athletes (role: 'athlete') ALWAYS go to /dashboard/athlete
 * 4. Coaches (role: 'coach' or 'assistant_coach') ALWAYS go to /dashboard/coach
 * 5. Admins (role: 'admin' or 'superadmin') ALWAYS go to /dashboard/admin
 */
export default function Dashboard() {
 const { user, loading: authLoading } = useAuth()
 const router = useRouter()
 const pathname = usePathname()
 const hasRedirected = useRef(false)
 const [actualRole, setActualRole] = useState<string | null>(null)
 const [roleLoading, setRoleLoading] = useState(true)

 // Track page analytics (time on page, scroll depth, interactions)
 usePageAnalytics()

 // Fetch role directly from Firestore - BULLETPROOF approach
 useEffect(() => {
  if (!user?.uid) {
   setRoleLoading(false)
   setActualRole(null)
   return
  }

  const fetchRole = async () => {
   try {
    console.log('🔍 FETCHING ROLE for:', user.email)
    
    // Use secure API to get user role instead of client-side Firebase
    const token = await user.getIdToken()
    const response = await fetch('/api/user/role', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })

    if (response.ok) {
      const data = await response.json()
      if (data.success) {
        const role = data.data.role || null
        console.log('✅ ROLE FETCHED:', role, 'for', user.email)

        // If role is 'user' or 'creator', wait a bit for auto-upgrade to complete
        if (role === 'user' || role === 'creator') {
          console.log('⏳ Detected legacy role, waiting for auto-upgrade...')
          // Wait 2 seconds for user initialization to upgrade the role
          await new Promise(resolve => setTimeout(resolve, 2000))
          // Refetch the role
          const updatedResponse = await fetch('/api/user/role', {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          })
          if (updatedResponse.ok) {
            const updatedData = await updatedResponse.json()
            const updatedRole = updatedData.success ? updatedData.data.role : null
            console.log('🔄 REFETCHED ROLE:', updatedRole, 'for', user.email)
            setActualRole(updatedRole)
          } else {
            setActualRole(role)
          }
        } else {
          setActualRole(role)
        }
      } else {
        console.warn('⚠️ API returned error for role fetch')
        setActualRole(null)
      }
    } else {
      console.warn('⚠️ Failed to fetch role via API')
      setActualRole(null)
    }
   } catch (error) {
    console.error('❌ Error fetching role:', error)
    setActualRole(null)
   } finally {
    setRoleLoading(false)
   }
  }

  fetchRole()
 }, [user?.uid, user?.email])

 useEffect(() => {
  // Handle OAuth redirect result
  const handleRedirectResult = async () => {
   try {
    const result = await getRedirectResult(auth)
    if (result) {
     console.log('Successfully signed in via redirect:', result.user.displayName)
     router.push('/onboarding')
    }
   } catch (error) {
    console.error('Redirect sign-in error:', error)
   }
  }

  handleRedirectResult()
 }, [])

 // BULLETPROOF ROUTING - Wait for actual role, then route correctly
 useEffect(() => {
  // Must have user and actual role loaded
  if (authLoading || roleLoading) {
   console.log('⏳ Waiting for auth and role to load...')
   return
  }

  // Must be on base dashboard page
  if (pathname !== '/dashboard') {
   return
  }

  // Must have user
  if (!user) {
   console.log('👤 No user - showing auth form')
   return
  }

  // Must have actual role (not null, not undefined, not guest)
  if (!actualRole || actualRole === 'guest') {
   console.warn('⚠️ No valid role yet - waiting...', { actualRole, email: user.email })
   return
  }

  // Prevent double redirect
  if (hasRedirected.current) {
   return
  }

  // Mark as redirected
  hasRedirected.current = true

  // BULLETPROOF ROUTING LOGIC - Based on actual role from Firestore
  console.log('🎯 ROUTING USER:', { email: user.email, role: actualRole })

  if (actualRole === 'athlete') {
   console.log('🏃 ATHLETE DETECTED - Routing to /dashboard/athlete')
   router.replace('/dashboard/athlete')
  } else if (actualRole === 'superadmin') {
   console.log('👑 SUPERADMIN DETECTED - Routing to /dashboard/admin')
   router.replace('/dashboard/admin')
  } else if (actualRole === 'admin') {
   console.log('🛡️ ADMIN DETECTED - Routing to /dashboard/admin')
   router.replace('/dashboard/admin')
  } else if (actualRole === 'coach' || actualRole === 'assistant_coach') {
  console.log('👨‍🏫 COACH DETECTED - Routing to /dashboard/coach')
  router.replace('/dashboard/coach')
  } else {
  console.warn('❓ UNKNOWN ROLE - Defaulting to /dashboard/coach', { role: actualRole })
  router.replace('/dashboard/coach')
  }
 }, [user, authLoading, roleLoading, actualRole, pathname, router])

 // Show loading state while auth or role is loading
 if (authLoading || roleLoading) {
  return (
   <div className="min-h-screen" style={{ backgroundColor: '#440102' }}>
    <div className="flex items-center justify-center min-h-screen">
     <div className="text-center">
      <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-white border-t-transparent mb-4"></div>
      <p className="text-white font-bold text-lg" style={{ fontFamily: '"Open Sans", sans-serif' }}>
       Loading your dashboard...
      </p>
      <p className="text-white text-sm mt-2 opacity-80" style={{ fontFamily: '"Open Sans", sans-serif' }}>
       {authLoading ? 'Authenticating...' : 'Loading role...'}
      </p>
     </div>
    </div>
   </div>
  )
 }

 // If user is not authenticated, redirect to home (don't show auth form here)
 // The landing page modal handles authentication
 useEffect(() => {
  if (!authLoading && !user) {
   console.log('[Dashboard] No user detected, redirecting to home')
   window.location.href = '/'
  }
 }, [user, authLoading])

 if (!user && !authLoading) {
  return (
   <div className="min-h-screen" style={{ backgroundColor: '#440102' }}>
    <div className="flex items-center justify-center min-h-screen">
     <div className="text-center">
      <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-white border-t-transparent mb-4"></div>
      <p className="text-white font-bold text-lg" style={{ fontFamily: '"Open Sans", sans-serif' }}>
       Redirecting...
      </p>
     </div>
    </div>
   </div>
  )
 }

 // This should never be reached due to routing logic above, but just in case
 return (
  <div className="min-h-screen" style={{ backgroundColor: '#440102' }}>
   <div className="flex items-center justify-center min-h-screen">
    <div className="text-center">
     <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-white border-t-transparent mb-4"></div>
     <p className="text-white font-bold text-lg" style={{ fontFamily: '"Open Sans", sans-serif' }}>
      Loading...
     </p>
    </div>
   </div>
  </div>
 )
}
