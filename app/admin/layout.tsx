'use client'

import { ReactNode, Suspense } from 'react'
import AuthGate from '@/components/auth/AuthGate'

// Force dynamic rendering for all admin pages
export const dynamic = 'force-dynamic'

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGate allowedRoles={['superadmin', 'admin']}>
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="text-gray-600">Loading...</div></div>}>
        {children}
      </Suspense>
    </AuthGate>
  )
}
