'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import SimpleAuth from '@/components/auth/SimpleAuth'

export default function OnboardingAuthPage() {
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!user) return
    // If already signed in and role stored via user doc, skip to dashboard
    // Actual routing by role happens in /dashboard
    router.replace('/dashboard')
  }, [user, router])

  return (
    <div className="min-h-screen bg-[#E8E6D8] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-200 p-8 space-y-6">
        <h1 className="text-2xl font-semibold" style={{ fontFamily: '"Open Sans", sans-serif' }}>
          Sign in to continue
        </h1>
        <p className="text-sm text-gray-600" style={{ fontFamily: '"Open Sans", sans-serif' }}>
          Finish signing in so we can create your athlete or coach profile.
        </p>
        <SimpleAuth />
      </div>
    </div>
  )
}


