'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

export default function Error({
 error,
 reset,
}: {
 error: Error & { digest?: string }
 reset: () => void
}) {
 useEffect(() => {
  // Log to console for development
  console.error('Global error:', error)

  // Log to external error monitoring service
  if (typeof window !== 'undefined' && (window as any).Sentry) {
    (window as any).Sentry.captureException(error, {
      tags: { location: 'app-error-boundary' }
    })
  }
 }, [error])

 return (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
   <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
    <div className="flex justify-center mb-4">
     <AlertTriangle className="h-16 w-16 text-red-500" />
    </div>

    <h1 className="text-2xl text-gray-900 mb-2">
     Something went wrong
    </h1>

    <p className="text-gray-600 mb-6">
     We encountered an unexpected error. Our team has been notified.
    </p>

    {process.env.NODE_ENV === 'development' && (
     <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6 text-left">
      <p className="text-sm font-mono text-red-800 break-all">
       {error.toString()}
      </p>
      {error.digest && (
       <p className="text-xs text-red-600 mt-2">
        Error ID: {error.digest}
       </p>
      )}
     </div>
    )}

    <div className="flex gap-3 justify-center">
     <button
      onClick={() => window.location.href = '/'}
      className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
     >
      <Home className="h-4 w-4" />
      Go Home
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