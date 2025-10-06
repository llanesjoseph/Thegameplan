'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useEnhancedRole } from '@/hooks/use-role-switcher'
import { db } from '@/lib/firebase.client'
import { collection, getDocs, query, where, orderBy, doc, getDoc } from 'firebase/firestore'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Users, Search, Filter, Plus, Activity, Target, Calendar, ChevronRight, X, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import AthleteProfileCard from '@/components/coach/AthleteProfileCard'
import { Card } from '@/components/ui/card'
import AppHeader from '@/components/ui/AppHeader'

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

const SPORTS_LIST = [
  'Soccer', 'Basketball', 'Baseball', 'Tennis', 'Brazilian Jiu-Jitsu',
  'Running', 'Volleyball', 'Swimming', 'American Football', 'Golf',
  'Boxing', 'Track & Field'
]

export default function CreatorAthletesPage() {
  const { user } = useAuth()
  const { role, loading } = useEnhancedRole()
  const router = useRouter()
  const [athletes, setAthletes] = useState<AthleteProfile[]>([])
  const [filteredAthletes, setFilteredAthletes] = useState<AthleteProfile[]>([])
  const [loadingAthletes, setLoadingAthletes] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterSport, setFilterSport] = useState('all')
  const [filterSkillLevel, setFilterSkillLevel] = useState('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // Invitation modal state
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteForm, setInviteForm] = useState({
    athleteEmail: '',
    athleteName: '',
    sport: 'Soccer',
    customMessage: ''
  })
  const [inviteLoading, setInviteLoading] = useState(false)
  const [inviteStatus, setInviteStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({
    type: null,
    message: ''
  })

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

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setInviteLoading(true)
    setInviteStatus({ type: null, message: '' })

    try {
      const response = await fetch('/api/coach/invite-athletes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coachId: user?.uid,
          sport: inviteForm.sport,
          customMessage: inviteForm.customMessage || `Join our ${inviteForm.sport} team and take your performance to the next level!`,
          athletes: [{
            email: inviteForm.athleteEmail,
            name: inviteForm.athleteName
          }]
        })
      })

      const data = await response.json()

      if (response.ok) {
        setInviteStatus({
          type: 'success',
          message: `Invitation sent to ${inviteForm.athleteName}! They will receive an email with onboarding instructions.`
        })
        setInviteForm({
          athleteEmail: '',
          athleteName: '',
          sport: 'Soccer',
          customMessage: ''
        })
        setTimeout(() => {
          setShowInviteModal(false)
          setInviteStatus({ type: null, message: '' })
        }, 3000)
      } else {
        throw new Error(data.error || 'Failed to send invitation')
      }
    } catch (error) {
      console.error('Error sending invitation:', error)
      setInviteStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to send invitation'
      })
    } finally {
      setInviteLoading(false)
    }
  }

  // Get unique sports from all athletes
  const uniqueSports = [...new Set(athletes.map(a => a.athleticProfile.primarySport))].filter(Boolean)

  // AuthGate in layout handles authentication, so we only need loading states here
  if (loading || !user) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="text-center">
          <div className="w-16 h-16 border-4 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-900">Loading...</p>
          <p className="text-slate-400 text-sm mt-1">Loading your athletes</p>
        </Card>
      </main>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      <main className="max-w-7xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-blue-600 rounded-xl flex items-center justify-center shadow-sm">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-1">
                Athletes
              </h1>
              <p className="text-gray-600">Manage your athletes and their training profiles</p>
            </div>
          </div>

          {/* Stats Summary */}
          {!loadingAthletes && athletes.length > 0 && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card className="p-4">
                <div className="text-2xl font-bold text-gray-900">{athletes.length}</div>
                <div className="text-gray-600 text-sm">Total Athletes</div>
              </Card>
              <Card className="p-4">
                <div className="text-2xl font-bold text-blue-600">
                  {athletes.filter(a => a.status === 'active').length}
                </div>
                <div className="text-gray-600 text-sm">Active</div>
              </Card>
              <Card className="p-4">
                <div className="text-2xl font-bold text-purple-600">
                  {uniqueSports.length}
                </div>
                <div className="text-gray-600 text-sm">Sports</div>
              </Card>
              <Card className="p-4">
                <div className="text-2xl font-bold text-green-600">
                  {athletes.filter(a => a.athleticProfile.skillLevel === 'advanced' || a.athleticProfile.skillLevel === 'elite').length}
                </div>
                <div className="text-gray-600 text-sm">Advanced+</div>
              </Card>
            </div>
          )}

          {/* Search and Filters */}
          <Card className="mb-6 p-4">
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
          </Card>
        </div>

        {/* Athletes Content */}
        {loadingAthletes ? (
          <Card className="text-center">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-900">Loading athletes...</p>
            <p className="text-gray-600 text-sm mt-1">Fetching athlete profiles from your roster</p>
          </Card>
        ) : athletes.length === 0 ? (
          <Card className="text-center p-12">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Athletes Yet</h3>
            <p className="text-gray-600 mb-6">
              Start building your team by inviting athletes to join your training program.
            </p>
            <Button
              onClick={() => setShowInviteModal(true)}
              className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700"
            >
              <Plus className="w-4 h-4" />
              Invite Athletes
            </Button>
          </Card>
        ) : filteredAthletes.length === 0 ? (
          <Card className="text-center p-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Results Found</h3>
            <p className="text-gray-600">Try adjusting your search or filters.</p>
          </Card>
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

        {/* Invite Athletes Modal */}
        {showInviteModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">Invite Athlete</h3>
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleInviteSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Athlete Name *
                  </label>
                  <Input
                    type="text"
                    value={inviteForm.athleteName}
                    onChange={(e) => setInviteForm({ ...inviteForm, athleteName: e.target.value })}
                    placeholder="John Smith"
                    required
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Athlete Email *
                  </label>
                  <Input
                    type="email"
                    value={inviteForm.athleteEmail}
                    onChange={(e) => setInviteForm({ ...inviteForm, athleteEmail: e.target.value })}
                    placeholder="athlete@example.com"
                    required
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sport *
                  </label>
                  <select
                    value={inviteForm.sport}
                    onChange={(e) => setInviteForm({ ...inviteForm, sport: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900"
                    required
                  >
                    {SPORTS_LIST.map(sport => (
                      <option key={sport} value={sport}>{sport}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Personal Message (Optional)
                  </label>
                  <textarea
                    value={inviteForm.customMessage}
                    onChange={(e) => setInviteForm({ ...inviteForm, customMessage: e.target.value })}
                    placeholder="Add a personal message to your invitation..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900"
                  />
                </div>

                {inviteStatus.message && (
                  <div
                    className={`p-3 rounded-lg text-sm ${
                      inviteStatus.type === 'success'
                        ? 'bg-green-50 text-green-800 border border-green-200'
                        : 'bg-red-50 text-red-800 border border-red-200'
                    }`}
                  >
                    {inviteStatus.message}
                  </div>
                )}

                <div className="flex gap-3">
                  <Button
                    type="button"
                    onClick={() => setShowInviteModal(false)}
                    variant="outline"
                    className="flex-1"
                    disabled={inviteLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-green-600 hover:bg-green-700 inline-flex items-center justify-center gap-2"
                    disabled={inviteLoading}
                  >
                    {inviteLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Send Invitation
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )}
      </main>
    </div>
  )
}