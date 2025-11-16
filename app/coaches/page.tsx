'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronDown, ArrowLeft } from 'lucide-react'
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
          {user && (
            <button
              onClick={handleSignOut}
              className="px-4 py-2 rounded-lg text-white font-bold text-sm transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#000000', fontFamily: '"Open Sans", sans-serif' }}
            >
              Sign Out
            </button>
          )}
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
        <div className="space-y-6">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif', fontWeight: 700 }}>
                Browse Coaches
              </h1>
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
                {SPORTS.map(sport => (
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
              {coaches.map((coach) => (
                <Link
                  key={coach.id}
                  href={`/coach-profile/${coach.slug || coach.id}`}
                  className="group block"
                >
                  {/* Coach Card */}
                  <div className="space-y-2">
                    {/* Profile Image */}
                    <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-gray-100 ring-2 ring-transparent group-hover:ring-black transition-all">
                      {(() => {
                        // Check multiple possible image field names
                        const imageUrl = coach.profileImageUrl ||
                                        (coach as any).photoURL ||
                                        (coach as any).profileImage ||
                                        coach.bannerUrl ||
                                        (coach as any).heroImageUrl ||
                                        (coach as any).coverImageUrl

                        return imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={imageUrl}
                            alt={coach.displayName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: '#8B7D7B' }}>
                            <img src="/brand/athleap-logo-colored.png" alt="AthLeap" className="w-1/2 opacity-90" />
                          </div>
                        )
                      })()}

                      {/* Featured Badge */}
                      {coach.featured && (
                        <div className="absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-bold text-white" style={{ backgroundColor: '#FC0105' }}>
                          Featured
                        </div>
                      )}
                    </div>

                    {/* Coach Info */}
                    <div>
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
                  </div>
                </Link>
              ))}
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
      </main>
    </div>
  )
}
