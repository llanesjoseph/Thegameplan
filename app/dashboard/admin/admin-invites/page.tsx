'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import AppHeader from '@/components/ui/AppHeader'
import AdminInvitationManager from '@/components/admin/AdminInvitationManager'
import Link from 'next/link'

export default function AdminInvitesPage() {
  const { user, loading } = useAuth()
  const [mounted, setMounted] = useState(false)
  const [isAuthorized, setIsAuthorized] = useState(false)

  // Ensure client-side only rendering
  useEffect(() => {
    setMounted(true)
  }, [])

  // Check authorization after mounting and loading complete
  useEffect(() => {
    if (mounted && !loading && user) {
      const userRole = (user as any).role
      const authorized = userRole === 'admin' || userRole === 'superadmin'
      setIsAuthorized(authorized)

      if (!authorized) {
        console.log('🚫 Access denied to admin invites:', { role: userRole, email: user.email })
      }
    }
  }, [mounted, loading, user])

  // Don't render anything during SSR
  if (!mounted) {
    return null
  }

  // Show loading state while auth is loading
  if (loading) {
    return (
      <div style={{ backgroundColor: '#E8E6D8' }} className="min-h-screen">
        <AppHeader />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </div>
    )
  }

  // Show access denied screen if not authorized (no redirect)
  if (!isAuthorized) {
    return (
      <div style={{ backgroundColor: '#E8E6D8' }} className="min-h-screen">
        <AppHeader />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="max-w-md mx-auto text-center bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-8">
            <h1 className="text-2xl mb-4" style={{ color: '#000000' }}>Access Denied</h1>
            <p className="mb-6" style={{ color: '#000000', opacity: 0.7 }}>
              This page is only available to administrators.
            </p>
            <Link
              href="/dashboard/admin"
              className="inline-block px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              Back to Admin Dashboard
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ backgroundColor: '#E8E6D8' }} className="min-h-screen">
      <AppHeader />
      <div className="max-w-7xl mx-auto px-6 py-12">
        <AdminInvitationManager />
      </div>
    </div>
  )
}
