'use client'

import { ReactNode, useMemo, Suspense } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { useUrlEnhancedRole } from '@/hooks/use-url-role-switcher'
import type { UserRole } from '@/types'
import dynamic from 'next/dynamic'

// Dynamically import AuthProvider with no SSR to ensure it's fully client-side
const AuthProvider = dynamic(() => import('@/components/auth/AuthProvider'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center nexus-bg">
      <div className="text-center nexus-card nexus-card-primary p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-nexus-primary mx-auto"></div>
        <p className="mt-4 nexus-body-text">Loading sign in...</p>
      </div>
    </div>
  )
})

interface AuthGateProps {
 allowedRoles?: UserRole[]
 children: ReactNode
}

function AuthGateInner({ allowedRoles = ['user', 'athlete', 'creator', 'superadmin'], children }: AuthGateProps) {
 const { user, loading } = useAuth()
 const { effectiveRole, loading: roleLoading } = useUrlEnhancedRole()
 const role = effectiveRole
 const router = useRouter()
 const pathname = usePathname()

 const isAuthorized = useMemo(() => {
  // During loading, assume authorized to prevent flashing error
  if (loading || roleLoading) return true

  // If no role yet but user exists, default to 'user' role
  const actualRole = role || (user ? 'user' : null)
  if (!actualRole) return false

  return allowedRoles.includes(actualRole)
 }, [role, allowedRoles, loading, roleLoading, user])

 if (loading) {
  return (
   <div className="min-h-screen flex items-center justify-center nexus-bg">
    <div className="text-center nexus-card nexus-card-primary p-8">
     <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-nexus-primary mx-auto"></div>
     <p className="mt-4 nexus-body-text">Loading...</p>
    </div>
   </div>
  )
 }

 if (!user) {
  return (
   <div className="min-h-screen nexus-bg">
    <div className="max-w-md mx-auto pt-24">
     <AuthProvider title="Sign in to continue" subtitle={`Access to ${pathname} requires an account.`} />
    </div>
   </div>
  )
 }

 if (!isAuthorized) {
  // Get the actual user role for better error messaging
  const actualRole = role || (user ? 'user' : 'guest')

  return (
   <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="bg-white rounded-xl border border-gray-200 p-8 text-center max-w-md shadow-sm">
     <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
      <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
     </div>
     <h2 className="text-2xl text-gray-900 mb-2">Access Restricted</h2>
     <p className="text-gray-600 mb-4">
      Your current role ({actualRole}) does not have permission to access this page.
     </p>
     <p className="text-sm text-gray-500 mb-6">
      Required roles: {allowedRoles.join(', ')}
     </p>
     <div className="space-y-3">
      <button
       className="w-full bg-cardinal text-white px-4 py-2 rounded-lg hover:bg-cardinal-dark transition-colors"
       onClick={() => {
        // Redirect based on user's actual role
        if (actualRole === 'user' || actualRole === 'athlete' || actualRole === 'creator' || actualRole === 'coach' || actualRole === 'assistant') {
         router.push('/dashboard/progress')
        } else if (actualRole === 'admin' || actualRole === 'superadmin') {
         router.push('/dashboard/admin')
        } else {
         router.push('/dashboard')
        }
       }}
      >
       Go to your dashboard
      </button>
      <button
       className="w-full border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
       onClick={() => router.push('/')}
      >
       Return home
      </button>
     </div>
    </div>
   </div>
  )
 }

 return <>{children}</>
}

export default function AuthGate(props: AuthGateProps) {
 return (
  <Suspense fallback={
   <div className="min-h-screen flex items-center justify-center nexus-bg">
    <div className="text-center nexus-card nexus-card-primary p-8">
     <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-nexus-primary mx-auto"></div>
     <p className="mt-4 nexus-body-text">Loading...</p>
    </div>
   </div>
  }>
   <AuthGateInner {...props} />
  </Suspense>
 )
}


