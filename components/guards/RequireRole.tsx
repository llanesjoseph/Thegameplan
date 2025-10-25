'use client'

import React from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useRole } from '@/hooks/use-role'

interface Props {
  allow: Array<'admin'|'superadmin'|'coach'|'assistant_coach'|'athlete'|'user'|'guest'>
  children: React.ReactNode
  fallback?: React.ReactNode
}

export default function RequireRole({ allow, children, fallback }: Props) {
  const { loading: authLoading } = useAuth()
  const { role, loading: roleLoading } = useRole()

  if (authLoading || roleLoading) {
    return (
      <div style={{ backgroundColor: '#E8E6D8' }} className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-24 w-24 border-b-2 border-black mx-auto mb-4"></div>
          <p style={{ color: '#000000' }}>Verifying access…</p>
        </div>
      </div>
    )
  }

  if (!allow.includes(role as any)) {
    return fallback ?? (
      <div style={{ backgroundColor: '#E8E6D8' }} className="min-h-screen flex items-center justify-center">
        <div className="text-center bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-8">
          <h1 className="text-2xl mb-4" style={{ color: '#000000' }}>Access Denied</h1>
          <p style={{ color: '#000000', opacity: 0.7 }}>You don't have permission to access this page.</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}


