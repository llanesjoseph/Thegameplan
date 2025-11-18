'use client'

import { Mail, MapPin, Target, User } from 'lucide-react'

export interface AthleteShowcaseProps {
  displayName: string
  email?: string
  sport?: string | null
  location?: string | null
  level?: string | null
  bio?: string | null
  trainingGoals?: string | null
  profileImageUrl?: string | null
}

export default function AthleteShowcaseCard({
  displayName,
  email,
  sport,
  location,
  level,
  bio,
  trainingGoals,
  profileImageUrl
}: AthleteShowcaseProps) {
  const safeSport = sport && sport.trim() ? sport : 'Athlete'
  const safeLocation = location && location.trim() ? location : 'Location not set'
  const safeLevel = level && level.trim() ? level : ''
  const safeBio = bio && bio.trim() ? bio : 'This athlete has not added a bio yet.'
  const safeGoals =
    trainingGoals && trainingGoals.trim()
      ? trainingGoals
      : 'No specific training goals have been added yet.'

  return (
    <section
      className="w-full bg-[#F3F0EB] rounded-3xl overflow-hidden shadow-sm border border-gray-200"
      aria-label={`${displayName} athlete profile`}
    >
      {/* Top banner */}
      <div className="bg-[#440102] text-white px-8 py-4 flex items-center justify-between">
        <div>
          <p
            className="text-xs tracking-[0.25em] uppercase mb-1"
            style={{ fontFamily: '"Open Sans", sans-serif', letterSpacing: '0.25em' }}
          >
            Athleap Athlete
          </p>
          <h2
            className="text-2xl font-bold"
            style={{ fontFamily: '"Open Sans", sans-serif', letterSpacing: '0.03em' }}
          >
            {displayName}
          </h2>
        </div>
        {sport && (
          <div className="hidden sm:flex items-center gap-2">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-white/10 border border-white/30">
              {safeSport}
            </span>
            {safeLevel && (
              <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-white text-black">
                {safeLevel}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Main content */}
      <div className="px-8 py-8 grid gap-8 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1.2fr)] items-start">
        {/* Left: photo + quick facts */}
        <div className="space-y-6">
          {/* Photo */}
          <div className="w-full rounded-3xl overflow-hidden bg-gray-200 aspect-[4/5] relative">
            {profileImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profileImageUrl}
                alt={displayName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-white bg-[#8B7D7B]">
                <User className="w-16 h-16 mb-4 opacity-90" />
                <span className="text-sm font-semibold" style={{ fontFamily: '"Open Sans", sans-serif' }}>
                  Profile photo coming soon
                </span>
              </div>
            )}
          </div>

          {/* Quick details */}
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2" style={{ color: '#555', fontFamily: '"Open Sans", sans-serif' }}>
              <MapPin className="w-4 h-4" />
              <span>{safeLocation}</span>
            </div>
            {email && (
              <div className="flex items-center gap-2" style={{ color: '#555', fontFamily: '"Open Sans", sans-serif' }}>
                <Mail className="w-4 h-4" />
                <span className="truncate">{email}</span>
              </div>
            )}
            {safeLevel && (
              <div className="flex items-center gap-2" style={{ color: '#555', fontFamily: '"Open Sans", sans-serif' }}>
                <Target className="w-4 h-4" />
                <span>{safeLevel}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right: story & goals */}
        <div className="space-y-6">
          {/* About */}
          <div>
            <h3
              className="text-sm font-bold mb-2 tracking-wide uppercase"
              style={{ color: '#000', fontFamily: '"Open Sans", sans-serif' }}
            >
              About {displayName.split(' ')[0] || 'this athlete'}
            </h3>
            <p
              className="text-sm leading-relaxed"
              style={{ color: '#333', fontFamily: '"Open Sans", sans-serif' }}
            >
              {safeBio}
            </p>
          </div>

          {/* Training goals */}
          <div>
            <h3
              className-w="text-sm font-bold mb-2 tracking-wide uppercase"
              style={{ color: '#000', fontFamily: '"Open Sans", sans-serif' }}
            >
              Training Focus
            </h3>
            <p
              className="text-sm leading-relaxed"
              style={{ color: '#333', fontFamily: '"Open Sans", sans-serif' }}
            >
              {safeGoals}
            </p>
          </div>

          {/* CTA strip */}
          <div className="mt-4">
            <div className="rounded-2xl bg-white border border-dashed border-[#44010233] p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p
                  className="text-sm font-semibold mb-1"
                  style={{ color: '#000', fontFamily: '"Open Sans", sans-serif' }}
                >
                  Ready to build their next highlight?
                </p>
                <p className="text-xs" style={{ color: '#666', fontFamily: '"Open Sans", sans-serif' }}>
                  Use this profile to align training plans, session notes, and video reviews.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="px-4 py-2 rounded-full text-xs font-semibold border border-black bg-black text-white hover:bg-white hover:text-black transition-colors"
                  style={{ fontFamily: '"Open Sans", sans-serif' }}
                >
                  Open Coaching Dashboard
                </button>
                <button
                  type="button"
                  className="px-4 py-2 rounded-full text-xs font-semibold border border-gray-300 text-gray-800 hover:bg-gray-100 transition-colors"
                  style={{ fontFamily: '"Open Sans", sans-serif' }}
                >
                  View Recent Sessions
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}


