'use client'

import { ReactNode } from 'react'
import AuthGate from '@/components/auth/AuthGate'

export default function AdminLayout({ children }: { children: ReactNode }) {
 return (
  <AuthGate allowedRoles={['superadmin', 'admin']}>
   {children}
  </AuthGate>
 )
}


