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

function AuthGateInner({ allowedRoles = ['user', 'creator', 'superadmin'], children }: AuthGateProps) {
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
   <div className="min-h-screen flex items-center justify-center nexus-bg">
    <div className="nexus-card nexus-card-primary p-8 text-center max-w-md">
     <h2 className="text-2xl mb-2">Access Restricted</h2>
     <p className="opacity-80 mb-4">
      Your current role ({actualRole}) does not have permission to access this page.
     </p>
     <p className="text-sm opacity-60 mb-6">
      Required roles: {allowedRoles.join(', ')}
     </p>
     <div className="space-y-3">
      <button
       className="w-full nexus-button"
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
       className="w-full nexus-button-secondary"
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


