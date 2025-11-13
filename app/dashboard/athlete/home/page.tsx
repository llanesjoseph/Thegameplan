'use client'

/**
 * Athlete Home / Profile Page
 * Single point of truth for athlete journey - matches design mockup
 */

import { useSearchParams } from 'next/navigation'
import AthleteOverview from '@/components/athlete/AthleteOverview'
import AthleteProfile from '@/components/athlete/AthleteProfile'
import AthleteProgress from '@/components/athlete/AthleteProgress'
import AthleteCoaches from '@/components/athlete/AthleteCoaches'
import AthleteTrainingLibrary from '@/components/athlete/AthleteTrainingLibrary'
import AthleteRecommendedGear from '@/components/athlete/AthleteRecommendedGear'

export default function AthleteHomePage() {
  const searchParams = useSearchParams()
  const isEmbedded = searchParams?.get('embedded') === 'true'

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8" style={{ backgroundColor: '#FFFFFF' }}>
      <div className="w-full max-w-7xl mx-auto space-y-8">
        {/* Header Overview */}
        <AthleteOverview />

        {/* Athlete Profile Section */}
        <AthleteProfile />

        {/* Your Progress Section */}
        <AthleteProgress />

        {/* Your Coaches Section with Action Buttons */}
        <AthleteCoaches />

        {/* Your Training Library Section */}
        <AthleteTrainingLibrary />

        {/* Recommended Gear Section */}
        <AthleteRecommendedGear />
      </div>
    </div>
  )
}
