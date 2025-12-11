'use client'

import React from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useRole } from '@/hooks/use-role'
import { useRouter } from 'next/navigation'

interface Props {
  allow: Array<'admin'|'superadmin'|'coach'|'assistant_coach'|'athlete'|'user'|'guest'>
  children: React.ReactNode
  fallback?: React.ReactNode
  redirectTo?: string
}

export default function RequireRole({ allow, children, fallback, redirectTo }: Props) {
  const { user, loading: authLoading } = useAuth()
  const { role, loading: roleLoading } = useRole()
  const router = useRouter()

  // ALWAYS show loading while auth or role is resolving
  if (authLoading || roleLoading) {
    console.log('RequireRole: Loading...', { authLoading, roleLoading, currentRole: role })
    return (
      <div style={{ backgroundColor: '#E8E6D8' }} className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-24 w-24 border-b-2 border-black mx-auto mb-4"></div>
          <p style={{ color: '#000000' }} className="text-lg">Verifying access…</p>
          <p style={{ color: '#666' }} className="text-sm mt-2">Please wait</p>
        </div>
      </div>
    )
  }

  // Check if user has required role
  const hasAccess = allow.includes(role as any)
  console.log('RequireRole: Access check', { role, allow, hasAccess })

  if (!hasAccess) {
    if (redirectTo) {
      router.push(redirectTo)
      return null
    }

    return fallback ?? (
      <div style={{ backgroundColor: '#E8E6D8' }} className="min-h-screen flex items-center justify-center">
        <div className="max-w-md mx-auto px-4">
          <div className="text-center bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-red-200 p-8">
            <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center bg-red-100">
              <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold mb-4" style={{ color: '#000000' }}>Access Denied</h1>
            <p style={{ color: '#666' }} className="mb-2">
              You don't have permission to access this page.
            </p>
            <p style={{ color: '#999' }} className="text-sm mb-6">
              Your role: <strong>{role}</strong> | Required: <strong>{allow.join(', ')}</strong>
            </p>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-6 py-3 rounded-lg text-white transition-colors bg-blue-600 hover:bg-blue-700"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
