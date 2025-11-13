'use client'

import Link from 'next/link'
import { useAuth } from '@/hooks/use-auth'
import CoachOverview from '@/components/coach/CoachOverview'
import CoachProfile from '@/components/coach/CoachProfile'
import CoachAthletes from '@/components/coach/CoachAthletes'
import CoachLessonLibrary from '@/components/coach/CoachLessonLibrary'
import CoachRecommendedGear from '@/components/coach/CoachRecommendedGear'

export default function CoachRebrandPreview() {
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex-shrink-0">
            <span className="text-2xl font-bold" style={{ color: '#440102', fontFamily: '\"Open Sans\", sans-serif', fontWeight: 700 }}>
              ATHLEAP
            </span>
          </Link>

        <nav className="flex items-center gap-4">
            <Link
              href="/dashboard/coach-unified"
              className="text-sm font-semibold hover:opacity-80 transition-opacity"
              style={{ color: '#000000', fontFamily: '\"Open Sans\", sans-serif', fontWeight: 600 }}
            >
              Back to current coach dashboard
            </Link>
          </nav>
        </div>
      </header>

      {/* Main */}
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


