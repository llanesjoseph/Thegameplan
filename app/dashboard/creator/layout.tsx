import { ReactNode } from 'react'
import AuthGate from '@/components/auth/AuthGate'

// Force dynamic rendering to support URL-based role switching
export const dynamic = 'force-dynamic'

export default function CreatorLayout({ children }: { children: ReactNode }) {
 return (
  <AuthGate allowedRoles={['user', 'creator', 'coach', 'assistant', 'admin', 'superadmin']}>
   {children}
  </AuthGate>
 )
}


