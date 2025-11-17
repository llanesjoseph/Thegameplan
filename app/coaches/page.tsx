'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronDown, ArrowLeft, UserPlus, UserCheck, Instagram, Youtube, Linkedin } from 'lucide-react'
import { SPORTS } from '@/lib/constants/sports'

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
  const router = useRouter()
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

  const handleFollowToggle = async (coachId: string, e: React.MouseEvent) => {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSport])

  useEffect(() => {
    loadAvailableSports()
    loadTopAthletes()
    if (user?.uid) {
      loadFollowingList()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid])

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream via-cream to-sky-blue/10">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-white/50 px-4 sm:px-6 lg:px-8 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex-shrink-0">
            <span className="text-2xl font-bold" style={{ color: '#440102', fontFamily: '"Open Sans", sans-serif', fontWeight: 700 }}>
              ATHLEAP
            </span>
          </Link>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 rounded-lg text-white font-bold text-sm transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#000000', fontFamily: '"Open Sans", sans-serif' }}
          >
            Back
          </button>
        </div>
      </header>

      {/* Back Button */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-black hover:text-gray-600 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-bold" style={{ fontFamily: '"Open Sans", sans-serif' }}>Back</span>
        </button>
      </div>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

          {/* All Coaches by Sport Section */}
          <div>
            {/* Section Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold mb-2" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif', fontWeight: 700 }}>
                  All Coaches by Sport
                </h2>
                <p className="text-sm" style={{ color: '#666', fontFamily: '"Open Sans", sans-serif' }}>
                  {totalCount} {totalCount === 1 ? 'coach' : 'coaches'} available
                </p>
              </div>

              {/* Sport Filter */}
              <div className="relative">
                <select
                  value={selectedSport}
                  onChange={(e) => setSelectedSport(e.target.value)}
                  className="appearance-none px-4 py-2 pr-10 rounded-lg border-2 border-black focus:outline-none focus:ring-2 focus:ring-black cursor-pointer"
                  style={{ fontFamily: '"Open Sans", sans-serif', fontWeight: 600 }}
                >
                  <option value="all">All Sports</option>
                  {availableSports.map(sport => (
                    <option key={sport} value={sport}>{sport}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none" />
              </div>
            </div>

          {/* Coaches Grid */}
          {loading && coaches.length === 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="w-full aspect-square rounded-lg bg-gray-200 animate-pulse" />
                  <div className="h-4 bg-gray-200 rounded animate-pulse" />
                  <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3" />
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
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {coaches.map((coach) => {
                const isFollowing = followingSet.has(coach.id)
                const isLoading = followingLoading.has(coach.id)

                if (coaches.indexOf(coach) === 0) {
                  console.log('🔍 Current followingSet size:', followingSet.size, 'IDs:', Array.from(followingSet))
                  console.log('🔍 First coach ID:', coach.id, 'isFollowing:', isFollowing)
                }

                return (
                  <div key={coach.id} className="group block">
                    {/* Coach Card */}
                    <div className="space-y-2">
                      {/* Profile Image - wrapped in Link */}
                      <Link href={`/coach-profile/${coach.slug || coach.id}`}>
                        <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-gray-100 ring-2 ring-transparent group-hover:ring-black transition-all cursor-pointer">
                          {coach.profileImageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={coach.profileImageUrl}
                              alt={coach.displayName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: '#8B7D7B' }}>
                              <img src="/brand/athleap-logo-colored.png" alt="AthLeap" className="w-1/2 opacity-90" />
                            </div>
                          )}

                          {/* Featured Badge */}
                          {coach.featured && (
                            <div className="absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-bold text-white" style={{ backgroundColor: '#FC0105' }}>
                              Featured
                            </div>
                          )}

                          {/* Follow Button Overlay - shows on hover */}
                          {user && (
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <button
                                onClick={(e) => handleFollowToggle(coach.id, e)}
                                disabled={isLoading}
                                className={`px-4 py-2 rounded-lg font-bold text-sm transition-all flex items-center gap-2 ${
                                  isFollowing
                                    ? 'bg-white text-black hover:bg-gray-100'
                                    : 'bg-black text-white hover:bg-gray-800 border-2 border-white'
                                }`}
                                style={{ fontFamily: '"Open Sans", sans-serif' }}
                              >
                                {isLoading ? (
                                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                ) : isFollowing ? (
                                  <>
                                    <UserCheck className="w-4 h-4" />
                                    Following
                                  </>
                                ) : (
                                  <>
                                    <UserPlus className="w-4 h-4" />
                                    Follow
                                  </>
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      </Link>

                      {/* Coach Info - wrapped in Link */}
                      <Link href={`/coach-profile/${coach.slug || coach.id}`}>
                        <div className="cursor-pointer">
                          <p className="font-bold text-sm line-clamp-1" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif' }}>
                            {coach.displayName}
                          </p>
                          {(coach.specialties?.[0] || coach.sport) && (
                            <p className="text-xs line-clamp-1" style={{ color: '#666', fontFamily: '"Open Sans", sans-serif' }}>
                              {coach.specialties?.[0] || coach.sport}
                            </p>
                          )}
                          {coach.tagline && (
                            <p className="text-xs line-clamp-1 italic" style={{ color: '#999', fontFamily: '"Open Sans", sans-serif' }}>
                              {coach.tagline}
                            </p>
                          )}
                        </div>
                      </Link>
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
                style={{ background: 'linear-gradient(to right, #FC0105, #000000)', fontFamily: '"Open Sans", sans-serif' }}
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

          {/* Social Media Icons */}
          <div className="flex items-center gap-4 pt-8">
            <a
              href="https://instagram.com/athleap"
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110"
              style={{ backgroundColor: '#E4405F' }}
              title="Instagram"
            >
              <Instagram className="w-5 h-5 text-white" />
            </a>
            <a
              href="https://youtube.com/@athleap"
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110"
              style={{ backgroundColor: '#FF0000' }}
              title="YouTube"
            >
              <Youtube className="w-5 h-5 text-white" />
            </a>
            <a
              href="https://linkedin.com/company/athleap"
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110"
              style={{ backgroundColor: '#0A66C2' }}
              title="LinkedIn"
            >
              <Linkedin className="w-5 h-5 text-white" />
            </a>
          </div>
        </div>
      </main>
    </div>
  )
}
