'use client'

import { useState, useEffect } from 'react'
import { collection, getDocs, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase.client'
import { useAuth } from '@/hooks/use-auth'
import { useRouter } from 'next/navigation'
import { CheckCircle, XCircle, RefreshCw, Users, ArrowRight } from 'lucide-react'
import AppHeader from '@/components/ui/AppHeader'

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

  const syncCoach = async (coach: CoachProfile) => {
    setSyncing(coach.uid)

    try {
      const displayName = coach.displayName || coach.name || 'Unknown Coach'
      const sport = Array.isArray(coach.sports) && coach.sports.length > 0
        ? coach.sports[0]
        : coach.sport || 'General'

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppHeader />
        <div className="max-w-6xl mx-auto px-6 py-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading coaches...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Sync Coaches to Public</h1>
              <p className="text-gray-600 mt-2">Sync coach profiles to the public browse page</p>
            </div>
            <button
              onClick={syncAllCoaches}
              disabled={syncing !== null}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <RefreshCw className={`w-5 h-5 ${syncing ? 'animate-spin' : ''}`} />
              Sync All Coaches
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-blue-600 mb-1">
                <Users className="w-5 h-5" />
                <span className="font-semibold">Total Coaches</span>
              </div>
              <p className="text-3xl font-bold text-blue-900">{coaches.length}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-green-600 mb-1">
                <CheckCircle className="w-5 h-5" />
                <span className="font-semibold">Synced</span>
              </div>
              <p className="text-3xl font-bold text-green-900">{publicCoaches.size}</p>
            </div>
            <div className="bg-orange-50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-orange-600 mb-1">
                <XCircle className="w-5 h-5" />
                <span className="font-semibold">Not Synced</span>
              </div>
              <p className="text-3xl font-bold text-orange-900">
                {coaches.length - publicCoaches.size}
              </p>
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
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-gray-900">{displayName}</h3>
                        {isPublic ? (
                          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            Public
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs flex items-center gap-1">
                            <XCircle className="w-3 h-3" />
                            Not Public
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                        <span>UID: {coach.uid}</span>
                        <span>Sport: {coach.sport || coach.sports?.[0] || 'N/A'}</span>
                        <span>Status: {coach.status || 'N/A'}</span>
                        <span>Active: {coach.isActive ? 'Yes' : 'No'}</span>
                      </div>
                      {result && (
                        <p className={`mt-2 text-sm ${result.success ? 'text-green-600' : 'text-red-600'}`}>
                          {result.message}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => syncCoach(coach)}
                      disabled={syncing !== null}
                      className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No coaches found</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
