'use client'

import { useAuth } from '@/hooks/use-auth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function CoachDashboard() {
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Redirect coaches to the overview page which is the main coach dashboard
    if (user) {
      router.replace('/dashboard/overview')
    }
  }, [user, router])

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#E8E6D8' }}>
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-blue mx-auto mb-4"></div>
        <p className="text-dark">Redirecting to coach dashboard...</p>
      </div>
    </div>
  )
}