'use client'

import { useState, useEffect } from 'react'
import { collection, getDocs, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase.client'
import { useAuth } from '@/hooks/use-auth'
import { useRouter } from 'next/navigation'
import { CheckCircle, XCircle, RefreshCw, Users, ArrowRight } from 'lucide-react'
import AppHeader from '@/components/ui/AppHeader'

export const dynamic = 'force-dynamic'

type CoachProfile = {
  uid: string
  displayName?: string
  name?: string
  sport?: string
  sports?: string[]
  status?: string
  isActive?: boolean
  headshotUrl?: string
  heroImageUrl?: string
  bio?: string
  specialties?: string[]
  certifications?: string[]
  experience?: string
  isVerified?: boolean
  featured?: boolean
  stats?: {
    totalLessons?: number
    totalStudents?: number
    avgRating?: number
    totalReviews?: number
  }
}

export default function SyncCoachesPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [coaches, setCoaches] = useState<CoachProfile[]>([])
  const [publicCoaches, setPublicCoaches] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState<string | null>(null)
  const [results, setResults] = useState<Record<string, { success: boolean; message: string }>>({})
  const [fixing, setFixing] = useState(false)

  useEffect(() => {
    // Allow superadmin, admin, and coach roles to access sync page
    if (user && user.role !== 'superadmin' && user.role !== 'admin' && user.role !== 'coach') {
      router.push('/dashboard')
    }
  }, [user, router])

  useEffect(() => {
    loadCoaches()
  }, [])

  const loadCoaches = async () => {
    setLoading(true)
    try {
      // Load coach profiles
      const coachProfiles = await getDocs(collection(db, 'coach_profiles'))
      const creatorProfiles = await getDocs(collection(db, 'creator_profiles'))

      const allCoaches: CoachProfile[] = []

      coachProfiles.forEach(doc => {
        allCoaches.push({ uid: doc.id, ...doc.data() } as CoachProfile)
      })

      creatorProfiles.forEach(doc => {
        if (!allCoaches.find(c => c.uid === doc.id)) {
          allCoaches.push({ uid: doc.id, ...doc.data() } as CoachProfile)
        }
      })

      setCoaches(allCoaches)

      // Load public profiles
      const publicDocs = await getDocs(collection(db, 'creatorPublic'))
      const publicSet = new Set<string>()
      publicDocs.forEach(doc => publicSet.add(doc.id))
      setPublicCoaches(publicSet)

    } catch (error) {
      console.error('Error loading coaches:', error)
    } finally {
      setLoading(false)
    }
  }

  const normalizeSport = (sport: string): string => {
    const VALID_SPORTS = [
      'soccer', 'basketball', 'football', 'baseball', 'tennis', 'volleyball',
      'hockey', 'lacrosse', 'rugby', 'cricket', 'golf', 'swimming',
      'track', 'cross-country', 'wrestling', 'boxing', 'mma', 'other'
    ]

    const SPORT_MAPPING: Record<string, string> = {
      'coaching': 'other',
      'n/a': 'other',
      'general': 'other',
      'brazilian jiu-jitsu': 'mma',
      'bjj': 'mma',
      'jiu-jitsu': 'mma'
    }

    const normalized = (sport || '').toLowerCase().trim()

    // Check if already valid
    if (VALID_SPORTS.includes(normalized)) {
      return normalized
    }

    // Try mapping
    if (SPORT_MAPPING[normalized]) {
      return SPORT_MAPPING[normalized]
    }

    // Default to 'other'
    return 'other'
  }

  const syncCoach = async (coach: CoachProfile) => {
    setSyncing(coach.uid)

    try {
      const displayName = coach.displayName || coach.name || 'Unknown Coach'
      const rawSport = Array.isArray(coach.sports) && coach.sports.length > 0
        ? coach.sports[0]
        : coach.sport || 'other'

      const sport = normalizeSport(rawSport)

      const publicProfile = {
        id: coach.uid,
        name: displayName,
        firstName: displayName.split(' ')[0] || displayName,
        sport: sport,
        tagline: coach.bio?.slice(0, 100) || 'Elite coaching and training',
        heroImageUrl: coach.heroImageUrl || '',
        headshotUrl: coach.headshotUrl || '',
        badges: coach.certifications || [],
        lessonCount: coach.stats?.totalLessons || 0,
        specialties: coach.specialties || [],
        experience: mapExperienceLevel(coach.experience || ''),
        verified: coach.isVerified || false,
        featured: coach.featured || false,
        stats: {
          totalStudents: coach.stats?.totalStudents || 0,
          avgRating: coach.stats?.avgRating || 0,
          totalReviews: coach.stats?.totalReviews || 0
        },
        lastActiveAt: serverTimestamp()
      }

      await setDoc(doc(db, 'creatorPublic', coach.uid), publicProfile)

      setResults(prev => ({
        ...prev,
        [coach.uid]: { success: true, message: 'Successfully synced to public collection' }
      }))

      // Reload to update UI
      await loadCoaches()

    } catch (error) {
      console.error('Error syncing coach:', error)
      setResults(prev => ({
        ...prev,
        [coach.uid]: { success: false, message: `Error: ${error}` }
      }))
    } finally {
      setSyncing(null)
    }
  }

  const mapExperienceLevel = (experience: string): 'college' | 'pro' | 'olympic' | 'coach' | 'analyst' => {
    const exp = experience.toLowerCase()
    if (exp.includes('olympic') || exp.includes('international')) return 'olympic'
    if (exp.includes('professional') || exp.includes('pro')) return 'pro'
    if (exp.includes('college') || exp.includes('university')) return 'college'
    if (exp.includes('coach') || exp.includes('trainer')) return 'coach'
    return 'coach'
  }

  const syncAllCoaches = async () => {
    for (const coach of coaches) {
      await syncCoach(coach)
      // Small delay to avoid overwhelming Firestore
      await new Promise(resolve => setTimeout(resolve, 200))
    }
  }

  const fixInvalidSports = async () => {
    setFixing(true)
    try {
      const response = await fetch('/api/admin/fix-coach-sports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      const result = await response.json()

      if (result.success) {
        alert(`Fixed ${result.data.fixed} coaches with invalid sports!\n\nTotal: ${result.data.total}\nFixed: ${result.data.fixed}\nSkipped: ${result.data.skipped}`)
        // Reload to update UI
        await loadCoaches()
      } else {
        alert('Failed to fix sports: ' + (result.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error fixing sports:', error)
      alert('Failed to fix sports')
    } finally {
      setFixing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#E8E6D8' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
          <p className="mt-4" style={{ color: '#000000', opacity: 0.7 }}>Loading coaches...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#E8E6D8' }}>
      <AppHeader title="Sync Coaches" subtitle="Sync coach profiles to public browse page" />
      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl" style={{ color: '#000000' }}>Sync Coaches to Public</h1>
              <p className="mt-2" style={{ color: '#000000', opacity: 0.7 }}>Sync coach profiles to the public browse page and fix invalid sports</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={fixInvalidSports}
                disabled={fixing || syncing !== null}
                className="px-6 py-3 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                style={{ backgroundColor: '#FF6B35' }}
              >
                <RefreshCw className={`w-5 h-5 ${fixing ? 'animate-spin' : ''}`} />
                Fix Invalid Sports
              </button>
              <button
                onClick={syncAllCoaches}
                disabled={syncing !== null || fixing}
                className="px-6 py-3 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                style={{ backgroundColor: '#91A6EB' }}
              >
                <RefreshCw className={`w-5 h-5 ${syncing ? 'animate-spin' : ''}`} />
                Sync All Coaches
              </button>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-4 mb-6">
            <h3 className="font-semibold mb-2" style={{ color: '#FF6B35' }}>⚠️ Important: Contributors Page Filters</h3>
            <div className="text-sm space-y-1" style={{ color: '#000000', opacity: 0.7 }}>
              <p>• The <a href="/contributors" target="_blank" className="underline hover:text-yellow-900">/contributors</a> page may filter coaches based on:</p>
              <ul className="ml-6 list-disc space-y-1">
                <li><strong>Your sport preferences</strong> - If you have a preferred sport set in your profile, the page will ONLY show coaches in that sport</li>
                <li><strong>Invalid sport values</strong> - Coaches with sports like "Coaching", "N/A", or "General" won't appear in the valid sports filter</li>
                <li><strong>Active filters</strong> - Make sure to click "Clear All Filters" on the contributors page</li>
              </ul>
              <p className="mt-2"><strong>Solution:</strong> Click "Fix Invalid Sports" above to normalize all sport values, then clear all filters on the contributors page.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6 text-center">
              <div className="text-4xl mb-2" style={{ color: '#91A6EB' }}>
                {coaches.length}
              </div>
              <div className="text-sm" style={{ color: '#000000', opacity: 0.7 }}>Total Coaches</div>
            </div>
            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6 text-center">
              <div className="text-4xl mb-2" style={{ color: '#20B2AA' }}>
                {publicCoaches.size}
              </div>
              <div className="text-sm" style={{ color: '#000000', opacity: 0.7 }}>Synced</div>
            </div>
            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6 text-center">
              <div className="text-4xl mb-2" style={{ color: '#FF6B35' }}>
                {coaches.length - publicCoaches.size}
              </div>
              <div className="text-sm" style={{ color: '#000000', opacity: 0.7 }}>Not Synced</div>
            </div>
          </div>

          <div className="space-y-4">
            {coaches.map(coach => {
              const isPublic = publicCoaches.has(coach.uid)
              const result = results[coach.uid]
              const displayName = coach.displayName || coach.name || 'Unknown'

              return (
                <div
                  key={coach.uid}
                  className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-4 hover:shadow-2xl transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold" style={{ color: '#000000' }}>{displayName}</h3>
                        {isPublic ? (
                          <span className="px-3 py-1 rounded-full text-xs flex items-center gap-1" style={{ backgroundColor: '#20B2AA', color: 'white' }}>
                            <CheckCircle className="w-3 h-3" />
                            Public
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-full text-xs flex items-center gap-1" style={{ backgroundColor: '#FF6B35', color: 'white' }}>
                            <XCircle className="w-3 h-3" />
                            Not Public
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-sm" style={{ color: '#000000', opacity: 0.7 }}>
                        <span>UID: {coach.uid}</span>
                        <span>Sport: {coach.sport || coach.sports?.[0] || 'N/A'}</span>
                        <span>Status: {coach.status || 'N/A'}</span>
                        <span>Active: {coach.isActive ? 'Yes' : 'No'}</span>
                      </div>
                      {result && (
                        <p className={`mt-2 text-sm`} style={{ color: result.success ? '#20B2AA' : '#FF6B35' }}>
                          {result.message}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => syncCoach(coach)}
                      disabled={syncing !== null}
                      className="ml-4 px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      style={{ backgroundColor: '#91A6EB' }}
                    >
                      {syncing === coach.uid ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Syncing...
                        </>
                      ) : (
                        <>
                          <ArrowRight className="w-4 h-4" />
                          Sync
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {coaches.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-16 h-16 mx-auto mb-4" style={{ color: '#000000', opacity: 0.4 }} />
              <p style={{ color: '#000000', opacity: 0.7 }}>No coaches found</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
