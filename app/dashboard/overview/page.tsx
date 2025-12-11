'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'

export default function DashboardOverview() {
 const { user, loading } = useAuth()
 const router = useRouter()

 useEffect(() => {
  if (!loading) {
   // Redirect to Coaches Locker Room - this is now the main hub
   console.log('Dashboard overview accessed, redirecting to Coaches Locker Room')
   router.replace('/dashboard/coach-unified')
  }
 }, [loading, router])

 // Show loading while redirecting
 return (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
   <div className="text-center">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
    <p className="mt-4 text-gray-600">Redirecting to Coaches Locker Room...</p>
   </div>
  </div>
 )
}