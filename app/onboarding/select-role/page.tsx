'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'

export default function SelectRolePage() {
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  // If role was preselected via query (?role=athlete|coach), respect it
  useEffect(() => {
    const presetRole = searchParams.get('role')
    if (presetRole === 'athlete' || presetRole === 'coach') {
      handleSelect(presetRole)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSelect = (role: 'athlete' | 'coach') => {
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem('athleap_selected_role', role)
    }
    // If already authenticated, go straight to role-specific onboarding
    if (user) {
      router.replace(role === 'coach' ? '/onboarding/coach' : '/onboarding/athlete')
    } else {
      // Otherwise continue to auth flow
      router.replace('/onboarding/auth')
    }
  }

  return (
    <div className="min-h-screen bg-[#E8E6D8] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-xl border border-gray-200 p-8 space-y-6">
        <h1 className="text-2xl font-semibold" style={{ fontFamily: '"Open Sans", sans-serif' }}>
          How do you want to join Athleap?
        </h1>
        <p className="text-sm text-gray-600" style={{ fontFamily: '"Open Sans", sans-serif' }}>
          Pick the role that best matches how you plan to use the platform. You can always work with
          us later if you need to change it.
        </p>

        <div className="space-y-4">
          <button
            type="button"
            onClick={() => handleSelect('athlete')}
            className="w-full text-left px-5 py-4 rounded-xl border border-gray-300 hover:border-black hover:bg-gray-50 transition-colors"
          >
            <h2 className="text-base font-semibold" style={{ fontFamily: '"Open Sans", sans-serif' }}>
              I am an athlete
            </h2>
            <p className="text-sm text-gray-600 mt-1" style={{ fontFamily: '"Open Sans", sans-serif' }}>
              Get training content, ask AI questions, and follow your coaches.
            </p>
          </button>

          <button
            type="button"
            onClick={() => handleSelect('coach')}
            className="w-full text-left px-5 py-4 rounded-xl border border-gray-300 hover:border-black hover:bg-gray-50 transition-colors"
          >
            <h2 className="text-base font-semibold" style={{ fontFamily: '"Open Sans", sans-serif' }}>
              I am a coach
            </h2>
            <p className="text-sm text-gray-600 mt-1" style={{ fontFamily: '"Open Sans", sans-serif' }}>
              Build your profile, upload lessons, manage athletes, and use AI to extend your reach.
            </p>
          </button>
        </div>
      </div>
    </div>
  )
}


