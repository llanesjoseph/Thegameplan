'use client'

import Link from 'next/link'
import { signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase.client'
import { useState } from 'react'
import CoachOverview from '@/components/coach/CoachOverview'
import CoachProfile from '@/components/coach/CoachProfile'
import CoachAthletes from '@/components/coach/CoachAthletes'
import CoachLessonLibrary from '@/components/coach/CoachLessonLibrary'
import CoachRecommendedGear from '@/components/coach/CoachRecommendedGear'

export default function CoachDashboard() {
  const [isSigningOut, setIsSigningOut] = useState(false)
  return (
    <div className="min-h-screen bg-white">
      <header className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex-shrink-0">
            <span className="text-2xl font-bold" style={{ color: '#440102', fontFamily: '\"Open Sans\", sans-serif', fontWeight: 700 }}>
              ATHLEAP
            </span>
          </Link>
          <nav className="flex items-center gap-4">
            <button
              onClick={async () => {
                if (isSigningOut) return
                setIsSigningOut(true)
                setTimeout(async () => {
                  try {
                    await signOut(auth)
                  } catch (e) {
                    console.error('Sign out failed:', e)
                  } finally {
                    window.location.href = '/'
                  }
                }, 900)
              }}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${isSigningOut ? 'bg-gray-800 text-white' : 'bg-black text-white hover:bg-gray-800'}`}
              style={{ fontFamily: '\"Open Sans\", sans-serif', fontWeight: 700 }}
              aria-live="polite"
            >
              {isSigningOut ? 'Goodbye…' : 'Sign Out'}
            </button>
          </nav>
        </div>
      </header>

      <main className="w-full">
        <div className="px-4 sm:px-6 lg:px-8 py-3">
          <div className="w-full max-w-5xl mx-auto space-y-5">
            <CoachOverview />
            <CoachProfile />
            <CoachAthletes />
            <CoachLessonLibrary />
            <CoachRecommendedGear />
          </div>
        </div>
      </main>
    </div>
  )
}
