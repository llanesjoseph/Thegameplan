'use client'

import { ReactNode } from 'react'
import AuthGate from '@/components/auth/AuthGate'

export default function CreatorLayout({ children }: { children: ReactNode }) {
 return (
  <AuthGate allowedRoles={['creator', 'superadmin']}>
   {children}
  </AuthGate>
 )
}


