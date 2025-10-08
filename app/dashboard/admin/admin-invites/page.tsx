'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { useEnhancedRole } from '@/hooks/use-role-switcher'
import AppHeader from '@/components/ui/AppHeader'
import AdminInvitationManager from '@/components/admin/AdminInvitationManager'

export default function AdminInvitesPage() {
  const { user, loading } = useAuth()
  const { role } = useEnhancedRole()
  const router = useRouter()

  // Redirect non-admins (only after everything is fully loaded)
  useEffect(() => {
    // Only redirect if we're done loading AND have confirmed non-admin status
    if (!loading && user && role !== 'admin' && role !== 'superadmin') {
      console.log('🚫 Access denied, redirecting non-admin user:', { role, user: user.email })
      router.replace('/dashboard')
    }
  }, [role, loading, router, user])

  // Show loading state while auth/role is loading
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

  // Don't render if not admin (will redirect via useEffect)
  if (role !== 'admin' && role !== 'superadmin') {
    return null
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
