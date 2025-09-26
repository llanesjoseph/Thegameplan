'use client'

import { ReactNode } from 'react'
import AuthGate from '@/components/auth/AuthGate'

export default function SuperAdminLayout({ children }: { children: ReactNode }) {
 return (
  <AuthGate allowedRoles={['superadmin']}>
   {children}
  </AuthGate>
 )
}


