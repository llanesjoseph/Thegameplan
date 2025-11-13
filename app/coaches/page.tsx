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
 slug?: string
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

// Featured Contributors - Static data (removed Jasmine Aikey to prevent duplicates)
const FEATURED_CONTRIBUTORS: Contributor[] = [
 // Jasmine Aikey is now loaded from database via creators_index collection
 // No hardcoded profiles to prevent duplicates
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
     slug: data.slug, // Include slug for secure URLs
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

  // Force real-time count to ensure accuracy
  if (reset) {
   try {
    const countSnap = await getDocs(collection(db, 'creators_index'))
    const activeCount = countSnap.docs.filter(doc => {
      const data = doc.data()
      return data.isActive === true && data.profileComplete === true
    }).length
    setTotalCount(activeCount)
    setActiveCoachCount(activeCount)
    console.log(`📊 Real-time coach count: ${activeCount} active coaches`)
   } catch (countError) {
    console.warn('Failed to count coaches:', countError)
    // Don't set to 0, keep existing count to avoid confusion
    console.log('Using cached count due to permission error')
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

 // Frameless browse page (default)
 return (
   <div className="min-h-screen bg-white">
    <header className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-4">
     <div className="max-w-5xl mx-auto flex items-center justify-between">
      <Link href="/" className="flex-shrink-0">
       <span className="text-2xl font-bold" style={{ color: '#440102', fontFamily: '\"Open Sans\", sans-serif', fontWeight: 700 }}>
        ATHLEAP
       </span>
      </Link>
     </div>
    </header>
    <main className="w-full">
     <div className="px-4 sm:px-6 lg:px-8 py-3">
      <div className="w-full max-w-5xl mx-auto space-y-5">
       <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: '#000000', fontFamily: '\"Open Sans\", sans-serif', fontWeight: 700 }}>
        Browse Coaches
       </h1>
       <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {specialtyFiltered.map((c) => (
         <Link key={c.id} href={`/coach-profile/${c.slug || c.id}`} className="block">
          <div className="w-full aspect-square rounded-lg overflow-hidden bg-gray-100">
           <Image
            src={c.headshotUrl || c.heroImageUrl || '/logo-gp.svg'}
            alt={c.name}
            width={300}
            height={300}
            className="w-full h-full object-cover"
           />
          </div>
          <p className="text-sm font-semibold mt-2" style={{ color: '#000000', fontFamily: '\"Open Sans\", sans-serif' }}>
           {c.name}
          </p>
         </Link>
        ))}
       </div>
      </div>
     </div>
    </main>
   </div>
 )
}