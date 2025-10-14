'use client'

import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { db } from '@/lib/firebase.client'
import { collection, getDocs, query, where, orderBy, limit, startAfter, doc, getDoc, type QueryDocumentSnapshot, type DocumentData } from 'firebase/firestore'
import Link from 'next/link'
import Image from 'next/image'
import { Search, Filter, Star, CheckCircle, Users, Trophy, User, Facebook, Instagram, Twitter } from 'lucide-react'
import AppHeader from '@/components/ui/AppHeader'
import FollowButton from '@/components/coach/FollowButton'

type Athlete = {
  id: string
  name: string
  firstName?: string
  sport: string
  tagline?: string
  heroImageUrl?: string
  headshotUrl?: string
  badges?: string[]
  specialties?: string[]
  level?: 'youth' | 'high-school' | 'college' | 'pro' | 'recreational'
  verified?: boolean
  featured?: boolean
  achievements?: string[]
}

type FilterState = {
  search: string
  sport: string
  level: string
  specialty: string
  verified: boolean
  featured: boolean
}

const SPORTS = [
  'soccer', 'basketball', 'football', 'baseball', 'tennis', 'volleyball',
  'hockey', 'lacrosse', 'rugby', 'cricket', 'golf', 'swimming',
  'track', 'cross-country', 'wrestling', 'boxing', 'mma', 'BJJ', 'other'
]

const LEVELS = [
  'youth', 'high-school', 'college', 'pro', 'recreational'
]

const SPECIALTIES = [
  'technical', 'tactical', 'mental', 'physical', 'recovery', 'leadership',
  'goalkeeping', 'defense', 'midfield', 'attack', 'conditioning', 'nutrition'
]

const ITEMS_PER_PAGE = 12

export default function AthletesPage() {
  const { user } = useAuth()
  const [athletes, setAthletes] = useState<Athlete[]>([])
  const [loading, setLoading] = useState(true)
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [totalCount, setTotalCount] = useState(0)
  const [activeAthleteCount, setActiveAthleteCount] = useState(0)
  const [userPreferences, setUserPreferences] = useState<{ sports: string[]; level: string }>({ sports: [], level: 'all' })

  const [filters, setFilters] = useState<FilterState>({
    search: '',
    sport: '',
    level: '',
    specialty: '',
    verified: false,
    featured: false
  })

  const loadAthletes = async (reset = false) => {
    setLoading(true)
    try {
      // Query users with athlete role
      let q = query(
        collection(db, 'users'),
        where('role', '==', 'athlete')
      )

      // Apply filters
      if (filters.sport && filters.sport !== 'all') {
        q = query(q, where('preferredSports', 'array-contains', filters.sport))
      }
      if (filters.verified) q = query(q, where('verified', '==', true))

      // Order by displayName
      q = query(q, orderBy('displayName'))
      if (!reset && lastDoc) q = query(q, startAfter(lastDoc))
      q = query(q, limit(ITEMS_PER_PAGE))

      const snapshot = await getDocs(q)
      const newItems = snapshot.docs.map(d => {
        const data = d.data()
        return {
          id: d.id,
          name: data.displayName || data.email || 'Athlete',
          sport: data.preferredSports?.[0] || 'athlete',
          tagline: data.bio || '',
          headshotUrl: data.photoURL || '',
          specialties: data.preferredSports || [],
          level: data.skillLevel || 'recreational',
          verified: data.verified || false,
          featured: data.featured || false,
          achievements: data.achievements || []
        }
      }) as Athlete[]

      if (reset) {
        setAthletes(newItems)
      } else {
        setAthletes(prev => [...prev, ...newItems])
      }
      setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null)
      setHasMore(snapshot.docs.length === ITEMS_PER_PAGE)

      // Count athletes
      if (reset) {
        try {
          const countSnap = await getDocs(query(collection(db, 'users'), where('role', '==', 'athlete')))
          setTotalCount(countSnap.size)
          setActiveAthleteCount(countSnap.size)
        } catch (error) {
          console.warn('Failed to count athletes:', error)
          setTotalCount(newItems.length)
          setActiveAthleteCount(newItems.length)
        }
      }
    } catch (e) {
      console.warn('Error loading athletes:', e)
      if (reset) {
        setAthletes([])
        setTotalCount(0)
        setActiveAthleteCount(0)
      }
      setHasMore(false)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const loadUserPreferences = async () => {
      if (!user?.uid) {
        loadAthletes(true)
        return
      }

      try {
        const userDocRef = doc(db, 'users', user.uid)
        const userDoc = await getDoc(userDocRef)

        let preferences = { sports: [], level: 'all' }

        if (userDoc.exists()) {
          const userData = userDoc.data()
          preferences = {
            sports: userData.preferredSports || [],
            level: userData.skillLevel || 'all'
          }
        }

        setUserPreferences(preferences)

        // If user has sport preferences, pre-filter by their primary sport
        if (preferences.sports.length > 0 && preferences.sports[0] !== 'all') {
          setFilters(prev => ({ ...prev, sport: preferences.sports[0] }))
        }

        loadAthletes(true)

      } catch (error) {
        console.warn('Failed to load user preferences:', error)
        loadAthletes(true)
      }
    }

    loadUserPreferences()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid])

  const applyFilters = () => {
    setLastDoc(null)
    loadAthletes(true)
  }

  const clearFilters = () => {
    setFilters({ search: '', sport: '', level: '', specialty: '', verified: false, featured: false })
    setLastDoc(null)
    loadAthletes(true)
  }

  const loadMore = () => {
    if (!loading && hasMore) loadAthletes(false)
  }

  const filteredAthletes = useMemo(() => {
    if (!filters.search && !filters.level && !filters.specialty) return athletes

    let filtered = athletes

    // Text search
    if (filters.search) {
      const s = filters.search.toLowerCase()
      filtered = filtered.filter(a =>
        a.name?.toLowerCase().includes(s) ||
        a.sport?.toLowerCase().includes(s) ||
        a.tagline?.toLowerCase().includes(s) ||
        a.specialties?.some(x => x.toLowerCase().includes(s)) ||
        a.achievements?.some(x => x.toLowerCase().includes(s))
      )
    }

    // Level filter
    if (filters.level) {
      filtered = filtered.filter(a => a.level === filters.level)
    }

    // Specialty filter
    if (filters.specialty) {
      filtered = filtered.filter(a => a.specialties?.includes(filters.specialty))
    }

    return filtered
  }, [athletes, filters.search, filters.level, filters.specialty])

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#E8E6D8' }}>
      <AppHeader />

      <main className="pb-20">
        {/* Hero Section */}
        <div className="text-center py-12 px-6">
          <h1 className="text-4xl mb-4" style={{ color: '#000000' }}>
            Discover {activeAthleteCount > 0 ? `${activeAthleteCount} ` : ''}Athletes
          </h1>
          <p className="text-lg max-w-3xl mx-auto" style={{ color: '#000000' }}>
            {user
              ? `Connect with athletes in your sports: ${userPreferences.sports.length > 0 ? userPreferences.sports.join(', ').toUpperCase() : 'All Sports'}`
              : 'Connect with athletes from around the world who are pushing the boundaries of sports performance.'
            }
          </p>

          {user && userPreferences.sports.length > 0 && (
            <div className="mt-6 bg-white/80 backdrop-blur border border-gray-200 rounded-lg p-4 max-w-2xl mx-auto">
              <div className="flex items-center gap-2 justify-center mb-2" style={{ color: '#000000' }}>
                <User className="w-4 h-4" />
                <span>Personalized for you</span>
              </div>
              <p className="text-sm" style={{ color: '#000000' }}>
                Showing athletes based on your sports preferences. Change filters to explore other sports.
              </p>
            </div>
          )}
        </div>

        {/* Search and Filters Section */}
        <div className="max-w-7xl mx-auto px-6 mb-8">
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6">
            <div className="grid lg:grid-cols-3 gap-6 items-end">
              <div className="lg:col-span-2">
                <label htmlFor="athlete-search" className="block text-sm mb-3" style={{ color: '#000000' }}>Find Athletes</label>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="athlete-search"
                    type="text"
                    placeholder="Search by name, sport, or achievement..."
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    className="w-full bg-white pl-12 pr-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    style={{ color: '#000000' }}
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={applyFilters}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Apply Filters
                </button>
                <button
                  onClick={clearFilters}
                  className="px-6 py-3 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 transition"
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-6 pt-6 border-t border-gray-200">
              <div>
                <label htmlFor="filter-sport" className="block text-sm mb-3" style={{ color: '#000000' }}>Sport</label>
                <select
                  id="filter-sport"
                  value={filters.sport}
                  onChange={(e) => setFilters(prev => ({ ...prev, sport: e.target.value }))}
                  className="w-full bg-white p-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  style={{ color: '#000000' }}
                >
                  <option value="">All Sports</option>
                  {SPORTS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="filter-level" className="block text-sm mb-3" style={{ color: '#000000' }}>Level</label>
                <select
                  id="filter-level"
                  value={filters.level}
                  onChange={(e) => setFilters(prev => ({ ...prev, level: e.target.value }))}
                  className="w-full bg-white p-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  style={{ color: '#000000' }}
                >
                  <option value="">All Levels</option>
                  {LEVELS.map(lvl => <option key={lvl} value={lvl}>{lvl.replace('-', ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="filter-specialty" className="block text-sm mb-3" style={{ color: '#000000' }}>Specialty</label>
                <select
                  id="filter-specialty"
                  value={filters.specialty}
                  onChange={(e) => setFilters(prev => ({ ...prev, specialty: e.target.value }))}
                  className="w-full bg-white p-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  style={{ color: '#000000' }}
                >
                  <option value="">All Specialties</option>
                  {SPECIALTIES.map(sp => <option key={sp} value={sp}>{sp.replace('-', ' ')}</option>)}
                </select>
              </div>
              <div className="space-y-4">
                <label className="block text-sm mb-3" style={{ color: '#000000' }}>Filters</label>
                <label className="flex items-center gap-3 cursor-pointer hover:opacity-80">
                  <input
                    type="checkbox"
                    checked={filters.verified}
                    onChange={(e) => setFilters(prev => ({ ...prev, verified: e.target.checked }))}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm" style={{ color: '#000000' }}>Verified only</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer hover:opacity-80">
                  <input
                    type="checkbox"
                    checked={filters.featured}
                    onChange={(e) => setFilters(prev => ({ ...prev, featured: e.target.checked }))}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <Star className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm" style={{ color: '#000000' }}>Featured only</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Results Header */}
        <div className="max-w-7xl mx-auto px-6 mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-2" style={{ color: '#000000' }}>
              <Users className="w-5 h-5" />
              <span className="text-lg">
                {filteredAthletes.length} {filteredAthletes.length === 1 ? 'athlete' : 'athletes'}
                {totalCount > 0 && ` of ${totalCount} total`}
              </span>
            </div>
            <Link
              href="/dashboard/athlete"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
              style={{ boxShadow: '0 0 0 2px rgba(0,0,0,0.06) inset' }}
            >
              <Trophy className="w-4 h-4" />
              Athlete Dashboard
            </Link>
          </div>
        </div>

        {/* Athletes Grid */}
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredAthletes.map((athlete) => (
              <div key={athlete.id} className="group block">
                <article className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6 hover:shadow-xl transition-all">
                  <div className="relative mb-6">
                    <div className="aspect-square rounded-lg overflow-hidden bg-gray-50">
                      <Image
                        src={athlete.headshotUrl || athlete.heroImageUrl || '/logo-gp.svg'}
                        alt={athlete.name}
                        width={300}
                        height={300}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                    </div>
                    <div className="absolute top-3 right-3 flex flex-col gap-2">
                      {athlete.verified && (
                        <div className="bg-green-600 text-white px-3 py-1 rounded-full text-xs flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Verified
                        </div>
                      )}
                      {athlete.featured && (
                        <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1 rounded-full text-xs flex items-center gap-1">
                          <Star className="w-3 h-3" />
                          Featured
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h3 className="text-xl mb-2 group-hover:text-blue-600 transition-colors" style={{ color: '#000000' }}>
                        {athlete.name}
                      </h3>
                      <p className="text-blue-600 text-sm uppercase tracking-wider">{athlete.sport}</p>
                      {athlete.level && (
                        <p className="text-gray-500 text-xs mt-1">
                          {athlete.level.replace('-', ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                        </p>
                      )}
                    </div>

                    {athlete.tagline && (
                      <p className="text-gray-600 leading-relaxed text-sm line-clamp-3">
                        {athlete.tagline}
                      </p>
                    )}

                    {athlete.specialties && athlete.specialties.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {athlete.specialties.slice(0, 3).map((s, i) => (
                          <span
                            key={i}
                            className="text-xs px-3 py-1 bg-blue-100 text-blue-700 rounded-full"
                          >
                            {s}
                          </span>
                        ))}
                        {athlete.specialties.length > 3 && (
                          <span className="text-xs px-3 py-1 bg-gray-100 text-gray-600 rounded-full">
                            +{athlete.specialties.length - 3} more
                          </span>
                        )}
                      </div>
                    )}

                    <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                      <div className="flex items-center gap-1 text-gray-600">
                        <Trophy className="w-4 h-4" />
                        <span className="text-sm">{athlete.achievements?.length || 0} achievements</span>
                      </div>
                    </div>
                  </div>
                </article>
              </div>
            ))}
          </div>
        </div>

        {hasMore && (
          <div className="text-center mt-16">
            <button
              onClick={loadMore}
              disabled={loading}
              className="px-8 py-4 rounded-lg border-2 border-gray-300 text-gray-600 hover:border-blue-600 hover:text-blue-600 hover:bg-blue-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                  Loading Athletes...
                </div>
              ) : (
                'Load More Athletes'
              )}
            </button>
          </div>
        )}

        {!loading && filteredAthletes.length === 0 && (
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center py-20">
              <div className="w-32 h-32 mx-auto mb-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Users className="w-16 h-16 text-blue-600" />
              </div>
              <h3 className="text-2xl mb-4" style={{ color: '#000000' }}>No athletes found</h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto leading-relaxed">
                We couldn't find any athletes matching your search criteria. Try adjusting your filters or search terms.
              </p>
              <button
                onClick={clearFilters}
                className="px-6 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
              >
                Clear All Filters
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white py-8 border-t">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <Link href="/coaches" className="text-gray-600 hover:text-gray-900 transition-colors">
                Coaches
              </Link>
              <Link href="/athletes" className="text-gray-600 hover:text-gray-900 transition-colors">
                Athletes
              </Link>
              <Link href="/lessons" className="text-gray-600 hover:text-gray-900 transition-colors">
                Lessons
              </Link>
              <Link href="/gear" className="text-gray-600 hover:text-gray-900 transition-colors">
                Gear
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <a href="https://facebook.com/playbookd" className="text-gray-600 hover:text-gray-900 transition-colors" aria-label="PlayBookd on Facebook">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="https://instagram.com/playbookd" className="text-gray-600 hover:text-gray-900 transition-colors" aria-label="PlayBookd on Instagram">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="https://twitter.com/playbookd" className="text-gray-600 hover:text-gray-900 transition-colors" aria-label="PlayBookd on Twitter">
                <Twitter className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
