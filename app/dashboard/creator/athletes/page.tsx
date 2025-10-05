'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useEnhancedRole } from '@/hooks/use-role-switcher'
import { db } from '@/lib/firebase.client'
import { collection, getDocs, query, where, orderBy, doc, getDoc } from 'firebase/firestore'
import Link from 'next/link'
import { ArrowLeft, Users, Search, Filter, Plus, Activity, Target, Calendar, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import AthleteProfileCard from '@/components/coach/AthleteProfileCard'

interface AthleteProfile {
  id: string
  uid: string
  displayName: string
  firstName: string
  lastName: string
  email: string
  status: string
  createdAt: Date
  athleticProfile: {
    primarySport: string
    secondarySports: string[]
    yearsOfExperience: string
    skillLevel: string
    trainingGoals: string
    achievements: string
    availability: Array<{
      day: string
      timeSlots: string
    }>
    learningStyle: string
    specialNotes: string
  }
}

export default function CreatorAthletesPage() {
  const { user } = useAuth()
  const { role, loading } = useEnhancedRole()
  const [athletes, setAthletes] = useState<AthleteProfile[]>([])
  const [filteredAthletes, setFilteredAthletes] = useState<AthleteProfile[]>([])
  const [loadingAthletes, setLoadingAthletes] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterSport, setFilterSport] = useState('all')
  const [filterSkillLevel, setFilterSkillLevel] = useState('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  useEffect(() => {
    if (loading) return

    if (user && (role === 'creator' || role === 'superadmin')) {
      loadAthletes()
    } else {
      setLoadingAthletes(false)
    }
  }, [user?.uid, role, loading])

  useEffect(() => {
    filterAthletes()
  }, [athletes, searchTerm, filterSport, filterSkillLevel])

  const loadAthletes = async () => {
    if (!user?.uid) {
      console.log('No user UID, cannot load athletes')
      setLoadingAthletes(false)
      return
    }

    setLoadingAthletes(true)
    console.log('Loading athletes for coach:', user.uid)

    try {
      // Query athletes collection for this coach
      const athletesQuery = query(
        collection(db, 'athletes'),
        where('coachId', '==', user.uid),
        orderBy('createdAt', 'desc')
      )

      const athletesSnapshot = await getDocs(athletesQuery)
      const athletesData: AthleteProfile[] = []

      athletesSnapshot.forEach(doc => {
        const data = doc.data()
        athletesData.push({
          id: doc.id,
          uid: data.uid,
          displayName: data.displayName,
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          status: data.status || 'active',
          createdAt: data.createdAt?.toDate() || new Date(),
          athleticProfile: data.athleticProfile || {
            primarySport: '',
            secondarySports: [],
            yearsOfExperience: '',
            skillLevel: '',
            trainingGoals: '',
            achievements: '',
            availability: [],
            learningStyle: '',
            specialNotes: ''
          }
        })
      })

      console.log(`Loaded ${athletesData.length} athletes`)
      setAthletes(athletesData)

    } catch (error: any) {
      console.error('Error loading athletes:', error)

      if (error?.code === 'permission-denied') {
        console.error('Permission denied - coach may not have access to athletes collection')
      }
    } finally {
      setLoadingAthletes(false)
    }
  }

  const filterAthletes = () => {
    let filtered = [...athletes]

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(athlete =>
        athlete.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        athlete.athleticProfile.primarySport.toLowerCase().includes(searchTerm.toLowerCase()) ||
        athlete.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Sport filter
    if (filterSport !== 'all') {
      filtered = filtered.filter(athlete =>
        athlete.athleticProfile.primarySport === filterSport
      )
    }

    // Skill level filter
    if (filterSkillLevel !== 'all') {
      filtered = filtered.filter(athlete =>
        athlete.athleticProfile.skillLevel === filterSkillLevel
      )
    }

    setFilteredAthletes(filtered)
  }

  const handleMessage = (athleteId: string) => {
    console.log('Send message to athlete:', athleteId)
    // TODO: Implement messaging functionality
  }

  const handleSchedule = (athleteId: string) => {
    console.log('Schedule session with athlete:', athleteId)
    // TODO: Implement scheduling functionality
  }

  // Get unique sports from all athletes
  const uniqueSports = [...new Set(athletes.map(a => a.athleticProfile.primarySport))].filter(Boolean)

  // AuthGate in layout handles authentication, so we only need loading states here
  if (loading || !user) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white border border-gray-200 rounded-2xl p-12 shadow-sm">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-900">Loading...</p>
            <p className="text-slate-400 text-sm mt-1">Loading your athletes</p>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl text-slate-900 mb-1">
                Athletes
              </h1>
              <p className="text-slate-600">Manage your athletes and their training profiles</p>
            </div>
          </div>

          {/* Stats Summary */}
          {!loadingAthletes && athletes.length > 0 && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-white border border-gray-100 rounded-xl p-4">
                <div className="text-2xl font-bold text-gray-900">{athletes.length}</div>
                <div className="text-gray-600 text-sm">Total Athletes</div>
              </div>
              <div className="bg-white border border-gray-100 rounded-xl p-4">
                <div className="text-2xl font-bold text-blue-600">
                  {athletes.filter(a => a.status === 'active').length}
                </div>
                <div className="text-gray-600 text-sm">Active</div>
              </div>
              <div className="bg-white border border-gray-100 rounded-xl p-4">
                <div className="text-2xl font-bold text-purple-600">
                  {uniqueSports.length}
                </div>
                <div className="text-gray-600 text-sm">Sports</div>
              </div>
              <div className="bg-white border border-gray-100 rounded-xl p-4">
                <div className="text-2xl font-bold text-green-600">
                  {athletes.filter(a => a.athleticProfile.skillLevel === 'advanced' || a.athleticProfile.skillLevel === 'elite').length}
                </div>
                <div className="text-gray-600 text-sm">Advanced+</div>
              </div>
            </div>
          )}

          {/* Search and Filters */}
          <div className="bg-white border border-gray-100 rounded-xl p-4 mb-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Search athletes by name, email, or sport..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <select
                  value={filterSport}
                  onChange={(e) => setFilterSport(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900"
                >
                  <option value="all">All Sports</option>
                  {uniqueSports.map(sport => (
                    <option key={sport} value={sport}>{sport}</option>
                  ))}
                </select>
                <select
                  value={filterSkillLevel}
                  onChange={(e) => setFilterSkillLevel(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900"
                >
                  <option value="all">All Levels</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                  <option value="elite">Elite</option>
                </select>
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  Grid
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  List
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Athletes Content */}
        {loadingAthletes ? (
          <div className="bg-white border border-gray-100 rounded-2xl p-12">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-900">Loading athletes...</p>
              <p className="text-gray-600 text-sm mt-1">Fetching athlete profiles from your roster</p>
            </div>
          </div>
        ) : athletes.length === 0 ? (
          <div className="bg-white border border-gray-100 rounded-2xl p-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Athletes Yet</h3>
              <p className="text-gray-600 mb-6">
                Start building your team by inviting athletes to join your training program.
              </p>
              <Button className="inline-flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Invite Athletes
              </Button>
            </div>
          </div>
        ) : filteredAthletes.length === 0 ? (
          <div className="bg-white border border-gray-100 rounded-2xl p-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-gray-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Results Found</h3>
              <p className="text-gray-600">Try adjusting your search or filters.</p>
            </div>
          </div>
        ) : (
          <div className={viewMode === 'grid' ? 'grid md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-4'}>
            {filteredAthletes.map(athlete => (
              <AthleteProfileCard
                key={athlete.id}
                athlete={athlete}
                onMessage={() => handleMessage(athlete.id)}
                onSchedule={() => handleSchedule(athlete.id)}
                expanded={viewMode === 'list'}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}