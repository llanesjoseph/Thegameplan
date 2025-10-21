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
import { SPORTS } from '@/lib/constants/sports'

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
  headshotUrl: 'https://res.cloudinary.com/dr0jtjwlh/image/upload/v1756675588/ja2_swxnai.webp',
  badges: ['National Player of the Year', 'Stanford Cardinal', 'U-20 World Cup'],
  lessonCount: 15,
  specialties: ['tactical', 'mental', 'leadership', 'technical'],
  experience: 'college' as const,
  verified: true,
  featured: true
 }
]

export default function ContributorsPage() {
 const { user } = useAuth()
 const [contributors, setContributors] = useState<Contributor[]>([])
 const [loading, setLoading] = useState(true)
 const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null)
 const [hasMore, setHasMore] = useState(true)
 const [totalCount, setTotalCount] = useState(0)
 const [activeCoachCount, setActiveCoachCount] = useState(0)
 const [userPreferences, setUserPreferences] = useState<{ sports: string[]; level: string }>({ sports: [], level: 'all' })

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
   // Query creators_index instead of coaches (this is where profile saves write to)
   let q = query(
    collection(db, 'creators_index'),
    where('isActive', '==', true) // Only show active coach profiles
   )

   // Apply filters
   if (filters.sport) {
    // Match sport in specialties array
    q = query(q, where('specialties', 'array-contains', filters.sport))
   }
   if (filters.experience) q = query(q, where('experience', '==', filters.experience))
   if (filters.verified) q = query(q, where('verified', '==', true))
   if (filters.featured) q = query(q, where('featured', '==', true))

   // Simplified orderBy to avoid composite index requirement
   q = query(q, orderBy('displayName'))
   if (!reset && lastDoc) q = query(q, startAfter(lastDoc))
   q = query(q, limit(ITEMS_PER_PAGE))

   const snapshot = await getDocs(q)
   const newItems = snapshot.docs.map(d => {
    const data = d.data()
    return {
     id: d.id,
     name: data.displayName,
     sport: data.specialties?.[0] || '', // Use first specialty as primary sport
     ...(data as any)
    }
   }) as Contributor[]

   if (reset) {
    setContributors(newItems)
   } else {
    setContributors(prev => [...prev, ...newItems])
   }
   setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null)
   setHasMore(snapshot.docs.length === ITEMS_PER_PAGE)

   // Load cached coach count instead of counting in real-time
   if (reset) {
    try {
     const cacheDoc = await getDoc(doc(db, 'system_cache', 'coach_count'))
     if (cacheDoc.exists()) {
      const cacheData = cacheDoc.data()
      setActiveCoachCount(cacheData.activeCoaches || 0)
      setTotalCount(cacheData.totalCoaches || 0)
      console.log(`📊 Loaded cached coach count: ${cacheData.activeCoaches} active`)
     } else {
      // Fallback: count in real-time if cache doesn't exist
      const countSnap = await getDocs(collection(db, 'creators_index'))
      setTotalCount(countSnap.size)
      setActiveCoachCount(countSnap.size)
     }
    } catch (cacheError) {
     console.warn('Failed to load cached count, falling back to real-time count:', cacheError)
     const countSnap = await getDocs(collection(db, 'creators_index'))
     setTotalCount(countSnap.size)
     setActiveCoachCount(countSnap.size)
    }
   }
  } catch (e) {
   // Graceful fallback (no DB): keep empty list; page still renders
   console.warn('Error loading contributors:', e)
   if (reset) {
    setContributors([])
    setTotalCount(0)
    setActiveCoachCount(0)
   }
   setHasMore(false)
  } finally {
   setLoading(false)
  }
 }

 useEffect(() => {
  const loadUserPreferences = async () => {
   if (!user?.uid) {
    // For non-authenticated users, show all contributors
    loadContributors(true)
    return
   }

   try {
    // Get user profile to determine sports preferences
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
    
    loadContributors(true)
    
   } catch (error) {
    console.warn('Failed to load user preferences:', error)
    loadContributors(true)
   }
  }

  loadUserPreferences()
  // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [user?.uid])

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
  const combined = [...FEATURED_CONTRIBUTORS, ...contributors]
  // Sort featured first, then by name
  return combined.sort((a, b) => {
   if (a.featured && !b.featured) return -1
   if (!a.featured && b.featured) return 1
   return (a.name || '').localeCompare(b.name || '')
  })
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
  <div className="min-h-screen" style={{ backgroundColor: '#E8E6D8' }}>
   <AppHeader />

   <main className="pb-20">
   {/* Hero Section */}
   <div className="text-center py-12 px-6">
    <h1 className="text-4xl mb-4" style={{ color: '#000000' }}>
     Browse {activeCoachCount > 0 ? `${activeCoachCount} ` : ''}Elite Coaches
    </h1>
    <p className="text-lg max-w-3xl mx-auto" style={{ color: '#000000' }}>
     {user
      ? `Discover coaches and athletes in your sports: ${userPreferences.sports.length > 0 ? userPreferences.sports.join(', ').toUpperCase() : 'All Sports'}`
      : 'Learn from world-class athletes, coaches, and sports performance experts who are shaping the future of competitive sports.'
     }
    </p>

    {user && userPreferences.sports.length > 0 && (
     <div className="mt-6 bg-white/80 backdrop-blur border border-gray-200 rounded-lg p-4 max-w-2xl mx-auto">
      <div className="flex items-center gap-2 justify-center mb-2" style={{ color: '#000000' }}>
       <User className="w-4 h-4" />
       <span>Personalized for you</span>
      </div>
      <p className="text-sm" style={{ color: '#000000' }}>
       Showing coaches based on your sports preferences. Change filters to explore other sports.
      </p>
     </div>
    )}
   </div>

   {/* Search and Filters Section */}
   <div className="max-w-7xl mx-auto px-6 mb-8">
    <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6">
     <div className="grid lg:grid-cols-3 gap-6 items-end">
      <div className="lg:col-span-2">
       <label className="block text-sm mb-3" style={{ color: '#000000' }}>Find Coaches</label>
       <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
         type="text"
         placeholder="Search by name, sport, specialty, or achievement..."
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
        {SPORTS.map(s => <option key={s} value={s}>{s}</option>)}
       </select>
      </div>
      <div>
       <label htmlFor="filter-experience" className="block text-sm mb-3" style={{ color: '#000000' }}>Experience Level</label>
       <select
        id="filter-experience"
        value={filters.experience}
        onChange={(e) => setFilters(prev => ({ ...prev, experience: e.target.value }))}
        className="w-full bg-white p-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        style={{ color: '#000000' }}
       >
        <option value="">All Levels</option>
        {EXPERIENCES.map(exp => <option key={exp} value={exp}>{exp.charAt(0).toUpperCase() + exp.slice(1)}</option>)}
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
       {specialtyFiltered.length} {specialtyFiltered.length === 1 ? 'coach' : 'coaches'}
       {totalCount > 0 && ` of ${totalCount} total`}
      </span>
     </div>
     <Link
      href="/coaches/apply"
      className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
      style={{ boxShadow: '0 0 0 2px rgba(0,0,0,0.06) inset' }}
     >
      <Star className="w-4 h-4" />
      Become a Coach
     </Link>
    </div>
   </div>

   {/* Contributors Grid */}
   <div className="max-w-7xl mx-auto px-6">
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
     {specialtyFiltered.map((c) => (
      <div key={c.id} className="group block">
       <article className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6 hover:shadow-xl transition-all">
        <Link href={`/coaches/${c.id}`} className="block">
         <div className="relative mb-6">
          <div className="aspect-square rounded-lg overflow-hidden bg-gray-50">
           <Image
            src={c.headshotUrl || c.heroImageUrl || '/logo-gp.svg'}
            alt={c.name}
            width={300}
            height={300}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
           />
          </div>
          <div className="absolute top-3 right-3 flex flex-col gap-2">
           {c.verified && (
            <div className="bg-green-600 text-white px-3 py-1 rounded-full text-xs flex items-center gap-1">
             <CheckCircle className="w-3 h-3" />
             Verified
            </div>
           )}
           {c.featured && (
            <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1 rounded-full text-xs flex items-center gap-1">
             <Star className="w-3 h-3" />
             Featured
            </div>
           )}
          </div>
          {/* Follow Button - Top Left */}
          <div className="absolute top-3 left-3" onClick={(e) => e.preventDefault()}>
           <FollowButton coachId={c.id} coachName={c.name} variant="icon-only" />
          </div>
         </div>
        </Link>

        <div className="space-y-4">
         <div>
          <h3 className="text-xl mb-2 group-hover:text-blue-600 transition-colors" style={{ color: '#000000' }}>
           {c.name}
          </h3>
          <p className="text-blue-600 text-sm uppercase tracking-wider">{c.sport}</p>
         </div>

         {c.tagline && (
          <p className="text-gray-600 leading-relaxed text-sm line-clamp-3">
           {c.tagline}
          </p>
         )}

         {c.specialties && c.specialties.length > 0 && (
          <div className="flex flex-wrap gap-2">
           {c.specialties.slice(0, 3).map((s, i) => (
            <span
             key={i}
             className="text-xs px-3 py-1 bg-blue-100 text-blue-700 rounded-full"
            >
             {s}
            </span>
           ))}
           {c.specialties.length > 3 && (
            <span className="text-xs px-3 py-1 bg-gray-100 text-gray-600 rounded-full">
             +{c.specialties.length - 3} more
            </span>
           )}
          </div>
         )}

         <div className="flex justify-between items-center pt-4 border-t border-gray-200">
          <div className="flex items-center gap-1 text-gray-600">
           <Trophy className="w-4 h-4" />
           <span className="text-sm">{c.lessonCount || 0} lessons</span>
          </div>
          <div className="flex items-center gap-1 text-gray-600">
           <Star className="w-4 h-4" />
           <span className="text-sm">{c.badges?.length || 0} achievements</span>
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
      className="px-8 py-4 rounded-lg border-2 border-gray-300 text-gray-600 hover:border-cardinal hover:text-cardinal hover:bg-cardinal/5 transition disabled:opacity-50 disabled:cursor-not-allowed"
     >
      {loading ? (
       <div className="flex items-center gap-2">
        <div className="w-5 h-5 border-2 border-gray-300 border-top:text-cardinal rounded-full animate-spin"></div>
        Loading Contributors...
       </div>
      ) : (
       'Load More Contributors'
      )}
     </button>
    </div>
   )}

   {!loading && specialtyFiltered.length === 0 && (
    <div className="max-w-7xl mx-auto px-6">
     <div className="text-center py-20">
      <div className="w-32 h-32 mx-auto mb-8 bg-blue-100 rounded-full flex items-center justify-center">
       <Users className="w-16 h-16 text-blue-600" />
      </div>
      <h3 className="text-2xl mb-4" style={{ color: '#000000' }}>No coaches found</h3>
      <p className="text-gray-600 mb-8 max-w-md mx-auto leading-relaxed">
       We couldn't find any coaches matching your search criteria. Try adjusting your filters or search terms.
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