'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Crown, ArrowRight } from 'lucide-react'

export default function RolesRedirect() {
  const router = useRouter()

  useEffect(() => {
    // Redirect after 2 seconds
    const timer = setTimeout(() => {
      router.push('/dashboard/admin/users')
    }, 2000)

    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#E8E6D8' }}>
      <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-2xl border border-white/50 p-8 max-w-md mx-4 text-center">
        <Crown className="w-16 h-16 mx-auto mb-4 text-purple-600 animate-bounce" />

        <h1 className="text-2xl mb-3" style={{ color: '#000000' }}>
          Page Consolidated
        </h1>

        <p className="mb-6" style={{ color: '#666' }}>
          Role management has been merged into the User Management interface for a better experience.
        </p>

        <div className="flex items-center justify-center gap-2 mb-6 text-sm" style={{ color: '#000000', opacity: 0.7 }}>
          <span>Redirecting to unified interface</span>
          <ArrowRight className="w-4 h-4 animate-pulse" />
        </div>

        <button
          onClick={() => router.push('/dashboard/admin/users')}
          className="w-full px-6 py-3 rounded-lg text-white transition-all hover:opacity-90"
          style={{ background: 'linear-gradient(to right, #20B2AA, #91A6EB)' }}
        >
          Go to User & Role Management
        </button>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800">
            <strong>New Features:</strong> Inline role editing, detailed statistics, and unified user management all in one place!
          </p>
        </div>
      </div>
    </div>
  )
}
