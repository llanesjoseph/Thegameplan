'use client'

import { ReactNode, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import AuthGate from '@/components/auth/AuthGate'

// Force dynamic rendering for all dashboard admin pages
export const dynamic = 'force-dynamic'

function EmbeddedViewDetector() {
 const searchParams = useSearchParams()
 const isEmbedded = searchParams.get('embedded') === 'true'

 useEffect(() => {
  // Add embedded-view class to body when page is loaded in iframe
  if (isEmbedded) {
   document.body.classList.add('embedded-view')
  } else {
   document.body.classList.remove('embedded-view')
  }

  return () => {
   document.body.classList.remove('embedded-view')
  }
 }, [isEmbedded])

 return null
}

export default function AdminLayout({ children }: { children: ReactNode }) {
 return (
  <AuthGate allowedRoles={['superadmin', 'admin']}>
   <Suspense fallback={null}>
    <EmbeddedViewDetector />
   </Suspense>
   {children}
  </AuthGate>
 )
}


