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
  const safeLocation = location && location.trim() ? location : 'Silicon Valley, California'
  const safeLevel = level && level.trim() ? level : ''
  const safeBio = bio && bio.trim() ? bio : 'This athlete has not added a bio yet.'
  const safeGoals =
    trainingGoals && trainingGoals.trim()
      ? trainingGoals
      : 'No specific training goals have been added yet.'
  const firstName = displayName.split(' ')[0] || 'this athlete'

  return (
    <section
      className="w-full overflow-hidden bg-[#4B0102] text-white"
      aria-label={`${displayName} athlete profile`}
    >
      {/* Hero content: text left, photo right, no inner card radius so it feels like the Wix stripe */}
      <div className="px-10 py-16 grid gap-12 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1.1fr)] items-center">
        {/* Left column: name, location, long bio */}
        <div className="space-y-6 max-w-xl">
          <div>
            <h2
              className="text-5xl font-bold mb-3"
              style={{ fontFamily: '"Open Sans", sans-serif' }}
            >
              {displayName}
            </h2>
            <p
              className="text-base"
              style={{ fontFamily: '"Open Sans", sans-serif', color: 'rgba(255,255,255,0.85)' }}
            >
              {safeLocation}
            </p>
          </div>

          <p
            className="text-base leading-relaxed max-w-xl"
            style={{ fontFamily: '"Open Sans", sans-serif', color: 'rgba(255,255,255,0.92)' }}
          >
            {safeBio}
          </p>
        </div>

        {/* Right column: hero image on neutral panel + quick facts row */}
        <div className="flex flex-col gap-5">
          <div className="w-full aspect-[4/5] overflow-hidden bg-gradient-to-r from-[#F2D4C3] to-[#FBE7DD] flex items-center justify-center">
            {profileImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profileImageUrl}
                alt={displayName}
                className="h-full w-auto object-cover"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-white">
                <User className="w-16 h-16 mb-4 opacity-90" />
                <span className="text-sm font-semibold" style={{ fontFamily: '"Open Sans", sans-serif' }}>
                  Profile photo coming soon
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-3 text-xs md:text-sm mt-1">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/15">
              <MapPin className="w-3 h-3" />
              <span style={{ fontFamily: '"Open Sans", sans-serif' }}>{safeLocation}</span>
            </div>
            {email && (
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/15">
                <Mail className="w-3 h-3" />
                <span className="truncate" style={{ fontFamily: '"Open Sans", sans-serif' }}>
                  {email}
                </span>
              </div>
            )}
            {safeLevel && (
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white text-black">
                <Target className="w-3 h-3" />
                <span className="font-semibold" style={{ fontFamily: '"Open Sans", sans-serif' }}>
                  {safeLevel}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}


