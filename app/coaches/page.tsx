'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import Link from 'next/link'
import { ChevronDown } from 'lucide-react'
import { SPORTS } from '@/lib/constants/sports'
import CoachProfileModal from '@/components/athlete/CoachProfileModal'

type Coach = {
  id: string
  displayName: string
  slug?: string
  sport?: string
  specialties?: string[]
  profileImageUrl?: string
  bannerUrl?: string
  tagline?: string
  bio?: string
  location?: string
  yearsExperience?: number | string
  verified?: boolean
  featured?: boolean
}

export default function BrowseCoachesPage() {
  const { user } = useAuth()
  const [coaches, setCoaches] = useState<Coach[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSport, setSelectedSport] = useState<string>('all')
  const [totalCount, setTotalCount] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [offset, setOffset] = useState(0)
  const [followingSet, setFollowingSet] = useState<Set<string>>(new Set())
  const [followingLoading, setFollowingLoading] = useState<Set<string>>(new Set())
  const [availableSports, setAvailableSports] = useState<string[]>([])
  const [topAthletes, setTopAthletes] = useState<any[]>([])
  const [previewCoach, setPreviewCoach] = useState<Coach | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)

  const handleSignOut = async () => {
    try {
      const { signOut } = await import('firebase/auth')
      const { auth } = await import('@/lib/firebase.client')
      await signOut(auth)
      window.location.href = '/'
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  const loadFollowingList = async () => {
    if (!user?.uid) return

    try {
      console.log('🔍 Fetching followed coaches...')
      const token = await user.getIdToken()
      const response = await fetch('/api/athlete/following', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      console.log('📡 Following API response status:', response.status)
      const data = await response.json()
      console.log('📊 Following data:', data)

      if (data.success && data.following) {
        const followedCoachIds = new Set<string>(data.following.map((f: any) => f.coachId))
        console.log(`✅ Found ${followedCoachIds.size} followed coaches:`, Array.from(followedCoachIds))
        setFollowingSet(followedCoachIds)
      } else {
        console.log('⚠️ No following data or unsuccessful response')
      }
    } catch (error) {
      console.error('❌ Error loading following list:', error)
    }
  }

  const handleFollowToggle = async (coachId: string, e: any) => {
    e.preventDefault()
    e.stopPropagation()

    if (!user?.uid) {
      alert('Please sign in to follow coaches')
      return
    }

    // Add to loading set
    setFollowingLoading(prev => new Set(prev).add(coachId))

    try {
      const token = await user.getIdToken()
      const isFollowing = followingSet.has(coachId)

      console.log(`🔄 ${isFollowing ? 'Unfollowing' : 'Following'} coach ${coachId}...`)

      const response = await fetch('/api/athlete/follow-coach', {
        method: isFollowing ? 'DELETE' : 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ coachId })
      })

      const data = await response.json()
      console.log('Follow response:', data)

      if (data.success || response.ok) {
        // Update following set
        setFollowingSet(prev => {
          const newSet = new Set(prev)
          if (isFollowing) {
            newSet.delete(coachId)
            console.log(`✅ Successfully unfollowed coach ${coachId}`)
          } else {
            newSet.add(coachId)
            console.log(`✅ Successfully followed coach ${coachId}`)
          }
          return newSet
        })

        // Reload the following list to sync
        await loadFollowingList()
      } else {
        console.error('Follow failed:', data)
        alert(data.error || 'Failed to update follow status')
      }
    } catch (error) {
      console.error('Error toggling follow:', error)
      alert('Failed to update follow status. Please try again.')
    } finally {
      // Remove from loading set
      setFollowingLoading(prev => {
        const newSet = new Set(prev)
        newSet.delete(coachId)
        return newSet
      })
    }
  }

  const loadAvailableSports = async () => {
    try {
      const response = await fetch('/api/coaches/available-sports', { cache: 'no-store' })
      const data = await response.json()
      if (data.success && data.sports) {
        setAvailableSports(data.sports)
      }
    } catch (error) {
      console.error('Error loading available sports:', error)
    }
  }

  const loadTopAthletes = async () => {
    try {
      const response = await fetch('/api/athletes/top?limit=3', { cache: 'no-store' })
      const data = await response.json()
      if (data.success && data.athletes) {
        setTopAthletes(data.athletes)
      }
    } catch (error) {
      console.error('Error loading top athletes:', error)
    }
  }

  const loadCoaches = async (reset = false) => {
    setLoading(true)
    try {
      const currentOffset = reset ? 0 : offset
      const url = `/api/coaches/public?sport=${selectedSport}&limit=50&offset=${currentOffset}`

      const response = await fetch(url, { cache: 'no-store' })
      const data = await response.json()

      if (data.success) {
        if (reset) {
          setCoaches(data.coaches || [])
        } else {
          setCoaches(prev => [...prev, ...(data.coaches || [])])
        }
        setTotalCount(data.pagination?.total || 0)
        setHasMore(data.pagination?.hasMore || false)
        setOffset(reset ? 50 : currentOffset + 50)
      }
    } catch (error) {
      console.error('Error loading coaches:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCoaches(true)
    loadAvailableSports()
    loadTopAthletes()
    if (user?.uid) {
      loadFollowingList()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSport, user?.uid])

  return (
    <div className="min-h-screen bg-[#EDEDED] flex flex-col">
      {/* Sticky app header (match Gear Store) */}
      <div className="sticky top-0 z-40 shadow-sm">
        <div className="w-full bg-white">
          <header className="w-full bg-white">
            <div className="max-w-6xl mx-auto px-6 lg:px-8 py-4 flex items-center justify-between">
              {/* Left: logo + ATHLEAP wordmark */}
              <Link href="/" className="flex items-center gap-3 flex-shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/athleap-logo-transparent.png"
                  alt="Athleap logo"
                  className="h-8 w-auto"
                />
                <span
                  className="text-xl font-semibold tracking-[0.02em]"
                  style={{ fontFamily: '"Open Sans", sans-serif', color: '#181818' }}
                >
                  ATHLEAP
                </span>
              </Link>

              {/* Right: signed-in chip or Sign in link */}
              <div className="flex items-center gap-6">
                {user ? (
                  <button
                    type="button"
                    className="flex items-center gap-2 rounded-full bg-white border border-gray-200 px-3 py-1 text-xs sm:text-sm"
                    aria-label="Account"
                    onClick={handleSignOut}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={
                        user.photoURL ||
                        'https://static.wixstatic.com/media/75fa07_66efa272a9a64facbc09f3da71757528~mv2.png/v1/fill/w_68,h_64,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/75fa07_66efa272a9a64facbc09f3da71757528~mv2.png'
                      }
                      alt={user.displayName || user.email || 'Athleap User'}
                      className="h-6 w-6 rounded-full object-cover"
                    />
                    <span
                      className="text-[11px] uppercase tracking-[0.18em] text-gray-600"
                      style={{ fontFamily: '"Open Sans", sans-serif' }}
                    >
                      Hello
                    </span>
                    <span
                      className="text-sm"
                      style={{ fontFamily: '"Open Sans", sans-serif' }}
                    >
                      {user.displayName || user.email || 'Athleap User'}
                    </span>
                    <span className="text-xs text-gray-400">|</span>
                    <span
                      className="text-xs text-gray-700 underline"
                      style={{ fontFamily: '"Open Sans", sans-serif' }}
                    >
                      Sign out
                    </span>
                  </button>
                ) : (
                  <Link
                    href="/onboarding/auth"
                    className="text-xs sm:text-sm text-gray-700 underline"
                    style={{ fontFamily: '"Open Sans", sans-serif' }}
                  >
                    Sign in
                  </Link>
                )}
              </div>
            </div>
          </header>
          {/* Red community bar */}
          <section aria-label="Browse coaches banner" className="w-full" style={{ backgroundColor: '#FC0105' }}>
            <div className="max-w-6xl mx-auto px-6 lg:px-8 py-3 flex justify-end">
              <p
                className="text-[15px] leading-none font-bold text-white"
                style={{ fontFamily: '"Open Sans", sans-serif', letterSpacing: '0.01em' }}
              >
                Browse Coaches
              </p>
            </div>
          </section>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 w-full">
        {/* Hero banner – maroon band with centered logo + title (match Gear Store) */}
        <section className="w-full bg-[#4B0102]">
          <div className="max-w-6xl mx-auto px-4 sm:px-10 py-10 text-center">
            <div className="flex justify-center mb-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/athleap-logo-transparent.png"
                alt="Athleap mark"
                className="h-32 w-auto object-contain"
              />
            </div>
            <h1
              className="text-4xl md:text-5xl font-bold"
              style={{ fontFamily: '"Open Sans", sans-serif', letterSpacing: '-0.05em', color: '#FFFFFF' }}
            >
              Browse Coaches
            </h1>
            {user && (
              <div className="mt-6 flex justify-center">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center justify-center px-10 py-3 rounded-full text-white text-sm font-semibold transition-all"
                  style={{ fontFamily: '"Open Sans", sans-serif', backgroundColor: '#C40000', letterSpacing: '0.08em' }}
                >
                  <span>View Your Profile</span>
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 60 60"
                    fill="currentColor"
                    aria-hidden="true"
                    className="ml-2"
                  >
                    <path d="M46.5 28.9L20.6 3c-.6-.6-1.6-.6-2.2 0l-4.8 4.8c-.6.6-.6 1.6 0 2.2l19.8 20-19.9 19.9c-.6.6-.6 1.6 0 2.2l4.8 4.8c.6.6 1.6.6 2.2 0l21-21 4.8-4.8c.8-.6.8-1.6.2-2.2z" />
                  </svg>
                </Link>
              </div>
            )}
          </div>
        </section>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-10">
          {/* Top Athletes Section */}
          {topAthletes.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold mb-4" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif', fontWeight: 700 }}>
                Top Athletes
              </h2>
              <p className="text-sm mb-4" style={{ color: '#666', fontFamily: '"Open Sans", sans-serif' }}>
                Based on activity and engagement
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {topAthletes.map((athlete) => (
                  <div key={athlete.id} className="group block">
                    <div className="space-y-2">
                      <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-gray-100 ring-2 ring-transparent group-hover:ring-black transition-all">
                        {athlete.photoURL ? (
                          <img
                            src={athlete.photoURL}
                            alt={athlete.displayName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: '#8B7D7B' }}>
                            <img src="/brand/athleap-logo-colored.png" alt="AthLeap" className="w-1/2 opacity-90" />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-sm line-clamp-1" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif' }}>
                          {athlete.displayName}
                        </p>
                        {athlete.sport && (
                          <p className="text-xs line-clamp-1" style={{ color: '#666', fontFamily: '"Open Sans", sans-serif' }}>
                            {athlete.sport}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

      {/* All Coaches by Sport Section (Wix-style "Coaches by Sport" block) */}
          <div>
        {/* Section Header - centered like Wix "Coaches by Sport" */}
        <div className="mb-8">
          <h2
            className="text-center"
            style={{
              fontFamily: '"Open Sans", sans-serif',
              fontSize: '25px',
              fontWeight: 700,
              letterSpacing: '0.05em',
              color: '#000000'
            }}
          >
            Coaches by Sport
          </h2>
          <p
            className="mt-2 text-center text-sm"
            style={{ fontFamily: '"Open Sans", sans-serif', color: '#666666' }}
          >
            {totalCount} {totalCount === 1 ? 'coach available' : 'coaches available'}
          </p>
        </div>

        {/* Sport Filter - left-aligned under heading */}
        <div className="mt-4 mb-10 flex justify-start">
          <div className="relative inline-block">
            <select
              value={selectedSport}
              onChange={(e) => setSelectedSport(e.target.value)}
              className="appearance-none px-4 py-2 pr-10 rounded-lg border border-black focus:outline-none cursor-pointer"
              style={{ fontFamily: '"Open Sans", sans-serif', fontWeight: 600 }}
            >
              <option value="all">All Sports</option>
              {availableSports.map((sport) => (
                <option key={sport} value={sport}>
                  {sport}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none" />
          </div>
        </div>

        {/* Coaches Row - circular avatars like Wix */}
          {loading && coaches.length === 0 ? (
            <div className="flex flex-wrap justify-center gap-10">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="flex flex-col items-center text-center space-y-3">
                  <div className="w-[225px] h-[225px] rounded-full bg-gray-200 animate-pulse" />
                  <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
                  <div className="h-3 w-40 bg-gray-200 rounded animate-pulse" />
                </div>
              ))}
            </div>
          ) : coaches.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-lg" style={{ color: '#666', fontFamily: '"Open Sans", sans-serif' }}>
                No coaches found{selectedSport !== 'all' ? ` for ${selectedSport}` : ''}.
              </p>
            </div>
          ) : (
            <div className="flex flex-wrap justify-center gap-10">
              {coaches.map((coach) => {
                const subtitle =
                  coach.tagline ||
                  coach.specialties?.[0] ||
                  coach.sport ||
                  ''

                return (
                  <div
                    key={coach.id}
                    className="group flex flex-col items-center text-center space-y-3 cursor-pointer"
                    onClick={() => {
                      setPreviewCoach(coach)
                      setIsPreviewOpen(true)
                    }}
                  >
                    {/* Profile Image - circular avatar */}
                    <div className="relative w-[225px] h-[225px] rounded-full overflow-hidden bg-gray-100">
                      {coach.profileImageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={coach.profileImageUrl}
                          alt={coach.displayName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div
                          className="w-full h-full flex items-center justify-center"
                          style={{ backgroundColor: '#8B7D7B' }}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src="/brand/athleap-logo-colored.png"
                            alt="AthLeap"
                            className="w-1/2 opacity-90"
                          />
                        </div>
                      )}
                    </div>

                    {/* Coach Info */}
                    <div>
                      <p
                        style={{
                          fontFamily: '"Open Sans", sans-serif',
                          fontSize: '27px',
                          lineHeight: 'normal',
                          color: '#000000'
                        }}
                      >
                        {coach.displayName}
                      </p>
                      {subtitle && (
                        <p
                          style={{
                            fontFamily: '"Open Sans", sans-serif',
                            fontSize: '16px',
                            color: '#000000'
                          }}
                        >
                          {subtitle}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Load More Button */}
          {hasMore && !loading && (
            <div className="flex justify-center pt-6">
              <button
                onClick={() => loadCoaches(false)}
                className="px-6 py-3 rounded-lg text-white font-bold transition-opacity hover:opacity-90"
                style={{ backgroundColor: '#C40000', fontFamily: '"Open Sans", sans-serif' }}
              >
                Load More Coaches
              </button>
            </div>
          )}

          {/* Loading More Indicator */}
          {loading && coaches.length > 0 && (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          </div>
        </div>
      </div>
      </main>

      {previewCoach && (
        <CoachProfileModal
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          coachId={previewCoach.id}
          coachSlug={previewCoach.slug}
          hideLessons={true}
        />
      )}
    </div>
  )
}
