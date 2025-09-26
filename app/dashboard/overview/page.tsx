'use client'

import { useAuth } from '@/hooks/use-auth'
import { useEnhancedRole } from "@/hooks/use-role-switcher"
import Link from 'next/link'
import { useState } from 'react'
import WelcomeTour from '@/components/dashboard/WelcomeTour'
import CoachDashboard from '@/components/CoachDashboard'
import AthleteDashboard from '@/components/AthleteDashboard'

export default function DashboardOverview() {
  const { user } = useAuth()
  const { role, loading } = useEnhancedRole()
  const [showTour, setShowTour] = useState(false)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-playbookd-red mx-auto"></div>
          <p className="mt-2 text-playbookd-dark">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <h1 className="text-xl font-semibold mb-2 text-playbookd-dark">Sign In Required</h1>
          <p className="text-playbookd-dark mb-4">Please sign in to access your dashboard.</p>
          <Link href="/dashboard" className="btn-playbookd-primary">
            Sign In
          </Link>
        </div>
      </div>
    )
  }

  // For coaches/creators, show the comprehensive coach dashboard
  if (role === 'creator') {
    return <CoachDashboard />
  }

  // For regular users/athletes, show the comprehensive athlete dashboard
  return <AthleteDashboard />
}
