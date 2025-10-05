'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw, LayoutDashboard } from 'lucide-react'

export default function DashboardError({
 error,
 reset,
}: {
 error: Error & { digest?: string }
 reset: () => void
}) {
 useEffect(() => {
  console.error('Dashboard error:', error)

  // Log to error monitoring
  if (typeof window !== 'undefined' && (window as any).Sentry) {
    (window as any).Sentry.captureException(error, {
      tags: { location: 'dashboard-error-boundary' }
    })
  }
 }, [error])

 return (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
   <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
    <div className="flex justify-center mb-4">
     <AlertTriangle className="h-16 w-16 text-orange-500" />
    </div>

    <h1 className="text-2xl font-bold text-gray-900 mb-2">
     Dashboard Error
    </h1>

    <p className="text-gray-600 mb-6">
     There was a problem loading your dashboard. Please try again.
    </p>

    {process.env.NODE_ENV === 'development' && (
     <div className="bg-orange-50 border border-orange-200 rounded-md p-4 mb-6 text-left">
      <p className="text-sm font-mono text-orange-800 break-all">
       {error.toString()}
      </p>
     </div>
    )}

    <div className="flex gap-3 justify-center">
     <button
      onClick={() => window.location.href = '/dashboard'}
      className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
     >
      <LayoutDashboard className="h-4 w-4" />
      Dashboard Home
     </button>

     <button
      onClick={reset}
      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
     >
      <RefreshCw className="h-4 w-4" />
      Try Again
     </button>
    </div>
   </div>
  </div>
 )
}
