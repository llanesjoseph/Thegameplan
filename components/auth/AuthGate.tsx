'use client'

import { ReactNode, useMemo } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import type { UserRole } from '@/types'
import AuthProvider from '@/components/auth/AuthProvider'

interface AuthGateProps {
  allowedRoles?: UserRole[]
  children: ReactNode
}

export default function AuthGate({ allowedRoles = ['user', 'creator', 'admin', 'superadmin'], children }: AuthGateProps) {
  const { user, loading } = useAuth()
  const role = (user as { role?: UserRole })?.role
  const router = useRouter()
  const pathname = usePathname()

  const isAuthorized = useMemo(() => {
    if (!role) return false
    return allowedRoles.includes(role)
  }, [role, allowedRoles])

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
    return (
      <div className="min-h-screen flex items-center justify-center nexus-bg">
        <div className="nexus-card nexus-card-primary p-8 text-center">
          <h2 className="text-2xl font-semibold mb-2">Insufficient permissions</h2>
          <p className="opacity-80">Your role does not allow access to this page.</p>
          <button
            className="mt-6 nexus-button"
            onClick={() => router.push('/dashboard/overview')}
          >
            Go to dashboard
          </button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}


