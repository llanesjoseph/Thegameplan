'use client'

import { useEffect, useMemo, useState } from 'react'
import { db } from '@/lib/firebase.client'
import { collection, getDocs, query, where, orderBy, limit, startAfter, type QueryDocumentSnapshot, type DocumentData } from 'firebase/firestore'
import Link from 'next/link'
import Image from 'next/image'

type Contributor = {
  id: string
  name: string
  firstName?: string
  sport: string
  tagline?: string
  heroImageUrl?: string
  headshotUrl?: string
  badges?: string[]
  lessonCount?: number
  specialties?: string[]
  experience?: 'college' | 'pro' | 'olympic' | 'coach' | 'analyst'
  verified?: boolean
  featured?: boolean
}

type FilterState = {
  search: string
  sport: string
  experience: string
  specialty: string
  verified: boolean
  featured: boolean
}

const SPORTS = [
  'soccer', 'basketball', 'football', 'baseball', 'tennis', 'volleyball',
  'hockey', 'lacrosse', 'rugby', 'cricket', 'golf', 'swimming',
  'track', 'cross-country', 'wrestling', 'boxing', 'mma', 'other'
]

const EXPERIENCES = [
  'college', 'pro', 'olympic', 'coach', 'analyst'
]

const SPECIALTIES = [
  'technical', 'tactical', 'mental', 'physical', 'recovery', 'leadership',
  'goalkeeping', 'defense', 'midfield', 'attack', 'conditioning', 'nutrition'
]

const ITEMS_PER_PAGE = 12

// Featured Contributors - Static data
const FEATURED_CONTRIBUTORS: Contributor[] = [
  {
    id: 'jasmine-aikey',
    name: 'Jasmine Aikey',
    firstName: 'Jasmine',
    sport: 'soccer',
    tagline: 'Elite Performance Training - The Intersection of Intellect and Intensity',
    heroImageUrl: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
    headshotUrl: 'https://images.unsplash.com/photo-1494790108755-2616b612b77c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
    badges: ['National Player of the Year', 'Stanford Cardinal', 'U-20 World Cup'],
    lessonCount: 15,
    specialties: ['tactical', 'mental', 'leadership', 'technical'],
    experience: 'college' as const,
    verified: true,
    featured: true
  }
]

export default function ContributorsPage() {
  const [contributors, setContributors] = useState<Contributor[]>([])
  const [loading, setLoading] = useState(true)
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [totalCount, setTotalCount] = useState(0)

  const [filters, setFilters] = useState<FilterState>({
    search: '',
    sport: '',
    experience: '',
    specialty: '',
    verified: false,
    featured: false
  })

  const loadContributors = async (reset = false) => {
    setLoading(true)
    try {
      let q = query(collection(db, 'creatorPublic'))
      if (filters.sport) q = query(q, where('sport', '==', filters.sport))
      if (filters.experience) q = query(q, where('experience', '==', filters.experience))
      if (filters.verified) q = query(q, where('verified', '==', true))
      if (filters.featured) q = query(q, where('featured', '==', true))

      q = query(q, orderBy('featured', 'desc'), orderBy('name'))
      if (!reset && lastDoc) q = query(q, startAfter(lastDoc))
      q = query(q, limit(ITEMS_PER_PAGE))

      const snapshot = await getDocs(q)
      const newItems = snapshot.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as Contributor[]
      if (reset) {
        setContributors(newItems)
      } else {
        setContributors(prev => [...prev, ...newItems])
      }
      setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null)
      setHasMore(snapshot.docs.length === ITEMS_PER_PAGE)

      if (reset) {
        const countSnap = await getDocs(collection(db, 'creatorPublic'))
        setTotalCount(countSnap.size)
      }
    } catch (e) {
      // Graceful fallback (no DB): keep empty list; page still renders
      if (reset) {
        setContributors([])
        setTotalCount(0)
      }
      setHasMore(false)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadContributors(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const applyFilters = () => {
    setLastDoc(null)
    loadContributors(true)
  }

  const clearFilters = () => {
    setFilters({ search: '', sport: '', experience: '', specialty: '', verified: false, featured: false })
    setLastDoc(null)
    loadContributors(true)
  }

  const loadMore = () => {
    if (!loading && hasMore) loadContributors(false)
  }

  // Combine featured contributors with database contributors
  const allContributors = useMemo(() => {
    return [...FEATURED_CONTRIBUTORS, ...contributors]
  }, [contributors])

  const filteredContributors = useMemo(() => {
    if (!filters.search) return allContributors
    const s = filters.search.toLowerCase()
    return allContributors.filter(c =>
      c.name?.toLowerCase().includes(s) ||
      c.sport?.toLowerCase().includes(s) ||
      c.tagline?.toLowerCase().includes(s) ||
      c.specialties?.some(x => x.toLowerCase().includes(s)) ||
      c.badges?.some(x => x.toLowerCase().includes(s))
    )
  }, [allContributors, filters.search])

  const specialtyFiltered = useMemo(() => {
    if (!filters.specialty) return filteredContributors
    return filteredContributors.filter(c => c.specialties?.includes(filters.specialty))
  }, [filteredContributors, filters.specialty])

  return (
    <main className="max-w-7xl mx-auto px-6 py-10">
      <div className="text-center mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold text-clarity-text-primary mb-3">Contributors</h1>
        <p className="text-clarity-text-secondary">Learn from elite contributors and coaches across sports.</p>
      </div>

      <div className="bg-clarity-surface border border-clarity-text-secondary/10 rounded-2xl p-6 mb-8">
        <div className="grid lg:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2 text-clarity-text-secondary">Search</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search by name, sport, specialty..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="w-full bg-clarity-background p-3 rounded-xl border border-clarity-text-secondary/20 pr-10 outline-none focus:ring-2 focus:ring-clarity-accent/30"
              />
            </div>
          </div>
          <div className="flex gap-3 items-end">
            <button onClick={applyFilters} className="px-4 py-2 rounded-lg bg-clarity-accent text-white">Apply Filters</button>
            <button onClick={clearFilters} className="px-4 py-2 rounded-lg border border-clarity-text-secondary/20 text-clarity-text-secondary">Clear All</button>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <div>
            <label className="block text-sm font-medium mb-2 text-clarity-text-secondary">Sport</label>
            <select
              value={filters.sport}
              onChange={(e) => setFilters(prev => ({ ...prev, sport: e.target.value }))}
              className="w-full bg-clarity-background p-3 rounded-xl border border-clarity-text-secondary/20"
            >
              <option value="">All Sports</option>
              {SPORTS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-clarity-text-secondary">Experience</label>
            <select
              value={filters.experience}
              onChange={(e) => setFilters(prev => ({ ...prev, experience: e.target.value }))}
              className="w-full bg-clarity-background p-3 rounded-xl border border-clarity-text-secondary/20"
            >
              <option value="">All Levels</option>
              {EXPERIENCES.map(exp => <option key={exp} value={exp}>{exp.charAt(0).toUpperCase() + exp.slice(1)}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-clarity-text-secondary">Specialty</label>
            <select
              value={filters.specialty}
              onChange={(e) => setFilters(prev => ({ ...prev, specialty: e.target.value }))}
              className="w-full bg-clarity-background p-3 rounded-xl border border-clarity-text-secondary/20"
            >
              <option value="">All Specialties</option>
              {SPECIALTIES.map(sp => <option key={sp} value={sp}>{sp.replace('-', ' ')}</option>)}
            </select>
          </div>
          <div className="space-y-3 pt-7">
            <label className="flex items-center gap-2 text-clarity-text-secondary">
              <input type="checkbox" checked={filters.verified} onChange={(e) => setFilters(prev => ({ ...prev, verified: e.target.checked }))} />
              <span className="text-sm">Verified only</span>
            </label>
            <label className="flex items-center gap-2 text-clarity-text-secondary">
              <input type="checkbox" checked={filters.featured} onChange={(e) => setFilters(prev => ({ ...prev, featured: e.target.checked }))} />
              <span className="text-sm">Featured only</span>
            </label>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center mb-6 text-clarity-text-secondary">
        <p>Showing {specialtyFiltered.length} of {totalCount} contributors</p>
        <Link href="/contributors/apply" className="px-4 py-2 rounded-lg bg-clarity-accent text-white">Become a Contributor</Link>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {specialtyFiltered.map((c) => (
          <Link key={c.id} href={`/contributors/${c.id}`} className="group block">
            <article className="bg-clarity-surface border border-clarity-text-secondary/10 rounded-2xl p-4 hover:border-clarity-accent/30 transition-all">
              <div className="relative mb-4">
                <div className="aspect-square rounded-xl overflow-hidden bg-clarity-background">
                  <Image src={c.headshotUrl || c.heroImageUrl || '/logo-gp.svg'} alt={c.name} width={300} height={300} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                </div>
                {c.verified && (
                  <div className="absolute top-2 right-2 bg-clarity-accent text-white px-2 py-1 rounded-full text-xs">Verified</div>
                )}
                {c.featured && (
                  <div className="absolute top-2 left-2 bg-clarity-accent/20 text-clarity-accent px-2 py-1 rounded-full text-xs border border-clarity-accent/30">Featured</div>
                )}
              </div>
              <div>
                <h3 className="font-semibold text-clarity-text-primary mb-1 group-hover:text-clarity-accent transition-colors">{c.name}</h3>
                <p className="text-sm text-clarity-text-secondary mb-2 capitalize">{c.sport}</p>
                {c.tagline && (
                  <p className="text-sm text-clarity-text-secondary/90 line-clamp-2 mb-3">{c.tagline}</p>
                )}
                {c.specialties && c.specialties.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {c.specialties.slice(0, 3).map((s, i) => (
                      <span key={i} className="text-xs px-2 py-1 bg-clarity-background rounded-full border border-clarity-text-secondary/20">{s}</span>
                    ))}
                    {c.specialties.length > 3 && (
                      <span className="text-xs px-2 py-1 bg-clarity-background rounded-full border border-clarity-text-secondary/20">+{c.specialties.length - 3}</span>
                    )}
                  </div>
                )}
                <div className="flex justify-between items-center text-xs text-clarity-text-secondary">
                  <span>{c.lessonCount || 0} lessons</span>
                  <span>{c.badges?.length || 0} achievements</span>
                </div>
              </div>
            </article>
          </Link>
        ))}
      </div>

      {hasMore && (
        <div className="text-center mt-12">
          <button onClick={loadMore} disabled={loading} className="px-6 py-2 rounded-lg border border-clarity-text-secondary/20 text-clarity-text-secondary hover:border-clarity-accent/40">
            {loading ? 'Loading…' : 'Load More Contributors'}
          </button>
        </div>
      )}

      {!loading && specialtyFiltered.length === 0 && (
        <div className="text-center py-16 text-clarity-text-secondary">
          <div className="text-5xl mb-3">🏃‍♀️</div>
          <h3 className="text-xl font-semibold mb-2 text-clarity-text-primary">No contributors found</h3>
          <p className="mb-6">Try adjusting your filters or search terms</p>
          <button onClick={clearFilters} className="px-4 py-2 rounded-lg border border-clarity-text-secondary/20">Clear All Filters</button>
        </div>
      )}
    </main>
  )
}