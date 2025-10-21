'use client'

/**
 * Athlete Home / Today Dashboard
 * Landing page that shows daily overview, quick actions, and upcoming activities
 */

import { useSearchParams } from 'next/navigation'
import AthleteOverview from '@/components/athlete/AthleteOverview'
import AthleteQuickActions from '@/components/athlete/AthleteQuickActions'
import UpcomingActivities from '@/components/athlete/UpcomingActivities'

export default function AthleteHomePage() {
  const searchParams = useSearchParams()
  const isEmbedded = searchParams?.get('embedded') === 'true'

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8" style={{ backgroundColor: isEmbedded ? 'white' : '#E8E6D8' }}>
      <div className="w-full mx-auto space-y-6">
        {/* Header Overview */}
        <AthleteOverview />

        {/* Quick Actions */}
        <AthleteQuickActions />

        {/* Upcoming Activities */}
        <UpcomingActivities />

        {/* Motivational Tips */}
        <div className="bg-gradient-to-r from-slate-600 to-slate-700 rounded-xl p-6 text-white shadow-lg">
          <h3 className="font-bold text-lg mb-2">💪 Daily Motivation</h3>
          <p className="text-slate-200 text-sm">
            Consistency is key to improvement. Check your lessons, practice the drills, and don't hesitate to ask your coach questions.
            Every small step forward counts toward your goals!
          </p>
        </div>
      </div>
    </div>
  )
}
