'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function CoachingRedirect() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to new coach dashboard with card navigation
    router.replace('/dashboard/coach')
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#E8E6D8' }}>
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4"></div>
        <p style={{ color: '#000000' }}>Redirecting to coach dashboard...</p>
      </div>
    </div>
  )
}
