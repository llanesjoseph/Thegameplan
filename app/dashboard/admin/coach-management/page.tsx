'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useEnhancedRole } from '@/hooks/use-role-switcher'
import AppHeader from '@/components/ui/AppHeader'
import { db } from '@/lib/firebase.client'
import { collection, query, getDocs, where, updateDoc, doc, orderBy } from 'firebase/firestore'
import {
  Shield,
  Users,
  Search,
  CheckCircle,
  XCircle,
  Star,
  StarOff,
  UserCheck,
  UserX,
  Filter,
  RefreshCw,
  Eye,
  Edit,
  Save,
  X,
  AlertCircle,
  Trophy,
  Award,
  Badge
} from 'lucide-react'

interface CoachProfile {
  uid: string
  displayName: string
  email: string
  sport: string
  tagline: string
  bio: string
  specialties: string[]
  achievements: string[]
  experience: string
  credentials: string
  isActive: boolean
  profileComplete: boolean
  status: 'pending' | 'approved' | 'rejected'
  verified: boolean
  featured: boolean
  headshotUrl: string
  heroImageUrl: string
  createdAt: any
  lastUpdated: any
}

export default function CoachManagementPage() {
  const { user } = useAuth()
  const { role, loading: roleLoading } = useEnhancedRole()
  const [coaches, setCoaches] = useState<CoachProfile[]>([])
  const [filteredCoaches, setFilteredCoaches] = useState<CoachProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [verificationFilter, setVerificationFilter] = useState('all')
  const [featuredFilter, setFeaturedFilter] = useState('all')
  const [selectedCoach, setSelectedCoach] = useState<CoachProfile | null>(null)
  const [isUpdating, setIsUpdating] = useState<string | null>(null)
  const [showDetails, setShowDetails] = useState(false)

  // Check admin access
  const isAuthorized = role === 'superadmin' || role === 'admin'

  const loadCoaches = useCallback(async () => {
    if (!isAuthorized) return

    try {
      setLoading(true)
      console.log('🔍 Loading coaches from creators_index...')

      const coachesQuery = query(
        collection(db, 'creators_index'),
        orderBy('lastUpdated', 'desc')
      )

      const coachesSnapshot = await getDocs(coachesQuery)
      const coachesData: CoachProfile[] = []

      coachesSnapshot.forEach(doc => {
        const data = doc.data()
        coachesData.push({
          uid: doc.id,
          displayName: data.displayName || 'Unknown Coach',
          email: data.email || '',
          sport: data.sport || 'General',
          tagline: data.tagline || '',
          bio: data.bio || '',
          specialties: data.specialties || [],
          achievements: data.achievements || [],
          experience: data.experience || '',
          credentials: data.credentials || '',
          isActive: data.isActive || false,
          profileComplete: data.profileComplete || false,
          status: data.status || 'pending',
          verified: data.verified || false,
          featured: data.featured || false,
          headshotUrl: data.headshotUrl || '',
          heroImageUrl: data.heroImageUrl || '',
          createdAt: data.createdAt,
          lastUpdated: data.lastUpdated
        })
      })

      setCoaches(coachesData)
      console.log(`✅ Loaded ${coachesData.length} coaches`)

    } catch (error) {
      console.error('❌ Error loading coaches:', error)
    } finally {
      setLoading(false)
    }
  }, [isAuthorized])

  const filterCoaches = useCallback(() => {
    let filtered = coaches

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(coach => 
        coach.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        coach.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        coach.sport.toLowerCase().includes(searchTerm.toLowerCase()) ||
        coach.tagline.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(coach => coach.status === statusFilter)
    }

    // Verification filter
    if (verificationFilter !== 'all') {
      filtered = filtered.filter(coach => 
        verificationFilter === 'verified' ? coach.verified : !coach.verified
      )
    }

    // Featured filter
    if (featuredFilter !== 'all') {
      filtered = filtered.filter(coach => 
        featuredFilter === 'featured' ? coach.featured : !coach.featured
      )
    }

    setFilteredCoaches(filtered)
  }, [coaches, searchTerm, statusFilter, verificationFilter, featuredFilter])

  useEffect(() => {
    if (isAuthorized) {
      loadCoaches()
    }
  }, [isAuthorized, loadCoaches])

  useEffect(() => {
    filterCoaches()
  }, [filterCoaches])

  const updateCoachStatus = async (uid: string, field: 'verified' | 'featured' | 'status', value: any) => {
    if (!isAuthorized) return

    try {
      setIsUpdating(uid)
      console.log(`🔄 Updating coach profile: ${field} = ${value}`)

      await updateDoc(doc(db, 'creators_index', uid), {
        [field]: value,
        lastUpdated: new Date()
      })

      // Update local state
      setCoaches(prev => prev.map(coach => 
        coach.uid === uid ? { ...coach, [field]: value } : coach
      ))

      console.log(`✅ Successfully updated ${field} for coach profile`)

    } catch (error) {
      console.error(`❌ Error updating coach ${field}:`, error)
      alert(`Failed to update ${field}. Please try again.`)
    } finally {
      setIsUpdating(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs text-white bg-green-600">
            <CheckCircle className="w-3 h-3 mr-1" />
            Active
          </span>
        )
      case 'pending':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs text-white bg-yellow-600">
            <AlertCircle className="w-3 h-3 mr-1" />
            Pending Review
          </span>
        )
      case 'rejected':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs text-white bg-red-600">
            <XCircle className="w-3 h-3 mr-1" />
            Suspended
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs text-white bg-gray-600">
            Unknown
          </span>
        )
    }
  }

  const getVerificationBadge = (verified: boolean) => {
    return verified ? (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs text-white bg-blue-600">
        <UserCheck className="w-3 h-3 mr-1" />
        Verified
      </span>
    ) : (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs text-white bg-gray-500">
        <UserX className="w-3 h-3 mr-1" />
        Unverified
      </span>
    )
  }

  const getFeaturedBadge = (featured: boolean) => {
    return featured ? (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs text-white bg-purple-600">
        <Star className="w-3 h-3 mr-1" />
        Featured
      </span>
    ) : (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs text-white bg-gray-500">
        <StarOff className="w-3 h-3 mr-1" />
        Standard
      </span>
    )
  }

  if (roleLoading || loading) {
    return (
      <div style={{ backgroundColor: '#E8E6D8' }} className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-black mx-auto mb-4"></div>
          <p style={{ color: '#000000' }}>Loading coach management...</p>
        </div>
      </div>
    )
  }

  if (!isAuthorized) {
    return (
      <div style={{ backgroundColor: '#E8E6D8' }} className="min-h-screen flex items-center justify-center">
        <div className="max-w-md mx-auto px-4">
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-red-200 p-8 text-center">
            <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center bg-red-100">
              <AlertCircle className="w-10 h-10 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold mb-3" style={{ color: '#000000' }}>
              Access Denied
            </h2>
            <p className="mb-6" style={{ color: '#666' }}>
              You don't have permission to access coach management. This area is restricted to administrators only.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ backgroundColor: '#E8E6D8' }} className="min-h-screen">
      <AppHeader title="Coach Management" subtitle="Manage coach verification and featured status" />

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Filters and Search */}
        <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search coaches by name, email, sport, or tagline..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="approved">Active</option>
                <option value="pending">Pending Review</option>
                <option value="rejected">Suspended</option>
              </select>
            </div>

            {/* Verification Filter */}
            <div>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={verificationFilter}
                onChange={(e) => setVerificationFilter(e.target.value)}
              >
                <option value="all">All Verification</option>
                <option value="verified">Verified Only</option>
                <option value="unverified">Unverified Only</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Featured Filter */}
            <div>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={featuredFilter}
                onChange={(e) => setFeaturedFilter(e.target.value)}
              >
                <option value="all">All Featured Status</option>
                <option value="featured">Featured Only</option>
                <option value="standard">Standard Only</option>
              </select>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3">
              <button
                onClick={async () => {
                  try {
                    const response = await fetch('/api/admin/verify-joseph', {
                      method: 'GET',
                      headers: { 'Content-Type': 'application/json' }
                    })
                    const result = await response.json()
                    if (result.success) {
                      const { status, summary } = result
                      const message = `
🔍 JOSEPH PROFILE VERIFICATION

Collections:
  ✅ users: ${status.collections.users.exists ? 'EXISTS' : '❌ MISSING'}
  ✅ creator_profiles: ${status.collections.creator_profiles.exists ? 'EXISTS' : '❌ MISSING'}
  ✅ coach_profiles: ${status.collections.coach_profiles.exists ? 'EXISTS' : '❌ MISSING'}
  ✅ creators_index: ${status.collections.creators_index.exists ? 'EXISTS' : '❌ MISSING'}

Visibility:
  ${summary.visibleInBrowseCoaches ? '✅ VISIBLE in Browse Coaches' : '❌ NOT VISIBLE in Browse Coaches'}

Summary:
  User exists: ${summary.userExists ? '✅ YES' : '❌ NO'}
  Profile exists: ${summary.profileExists ? '✅ YES' : '❌ NO'}
  Needs fix: ${summary.needsFix ? '⚠️ YES' : '✅ NO'}
                      `.trim()
                      alert(message)
                    } else {
                      alert('❌ Failed to verify: ' + (result.error || 'Unknown error'))
                    }
                  } catch (error) {
                    alert('❌ Error: ' + (error instanceof Error ? error.message : 'Unknown error'))
                  }
                }}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                title="Verify if Joseph's profile exists in database"
              >
                <Eye className="w-4 h-4 mr-2" />
                Verify Joseph
              </button>
              <button
                onClick={async () => {
                  if (confirm('This will aggressively fix Joseph\'s profile visibility. Continue?')) {
                    try {
                      const response = await fetch('/api/admin/aggressive-fix-joseph', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' }
                      })
                      const result = await response.json()
                      if (result.success) {
                        alert('✅ ' + result.message)
                        loadCoaches()
                      } else {
                        alert('❌ Failed: ' + (result.error || 'Unknown error'))
                      }
                    } catch (error) {
                      alert('❌ Error: ' + (error instanceof Error ? error.message : 'Unknown error'))
                    }
                  }
                }}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                title="Fix Joseph's profile visibility"
              >
                <AlertCircle className="w-4 h-4 mr-2" />
                Fix Joseph
              </button>
              <button
                onClick={loadCoaches}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Results Summary */}
        <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-4 mb-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold" style={{ color: '#000000' }}>
              Coach Management ({filteredCoaches.length} coaches)
            </h3>
            <div className="flex items-center gap-4 text-sm" style={{ color: '#666' }}>
              <span>Total: {coaches.length}</span>
              <span>Verified: {coaches.filter(c => c.verified).length}</span>
              <span>Featured: {coaches.filter(c => c.featured).length}</span>
            </div>
          </div>
        </div>

        {/* Coaches List */}
        <div className="space-y-4">
          {filteredCoaches.map((coach) => (
            <div
              key={coach.uid}
              className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6 hover:shadow-xl transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  {/* Coach Photo */}
                  <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                    {coach.headshotUrl ? (
                      <img
                        src={coach.headshotUrl}
                        alt={coach.displayName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Users className="w-8 h-8 text-gray-400" />
                    )}
                  </div>

                  {/* Coach Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold" style={{ color: '#000000' }}>
                        {coach.displayName}
                      </h3>
                      {getStatusBadge(coach.status)}
                      {getVerificationBadge(coach.verified)}
                      {getFeaturedBadge(coach.featured)}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm" style={{ color: '#666' }}>
                      <div>
                        <p><strong>Email:</strong> {coach.email}</p>
                        <p><strong>Sport:</strong> {coach.sport}</p>
                        <p><strong>Tagline:</strong> {coach.tagline}</p>
                      </div>
                      <div>
                        <p><strong>Specialties:</strong> {coach.specialties.join(', ') || 'None'}</p>
                        <p><strong>Experience:</strong> {coach.experience || 'Not specified'}</p>
                        <p><strong>Active:</strong> {coach.isActive ? 'Yes' : 'No'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-2 ml-4">
                  <button
                    onClick={() => setSelectedCoach(coach)}
                    className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Manage
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* No Results */}
        {filteredCoaches.length === 0 && !loading && (
          <div className="text-center py-12">
            <Users className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold mb-2" style={{ color: '#000000' }}>
              No coaches found
            </h3>
            <p style={{ color: '#666' }}>
              Try adjusting your search criteria or filters.
            </p>
          </div>
        )}
      </main>

      {/* Coach Management Modal */}
      {selectedCoach && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold" style={{ color: '#000000' }}>
                Manage Coach: {selectedCoach.displayName}
              </h2>
              <button
                onClick={() => setSelectedCoach(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Coach Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#000000' }}>
                    Display Name
                  </label>
                  <p className="text-sm" style={{ color: '#666' }}>{selectedCoach.displayName}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#000000' }}>
                    Email
                  </label>
                  <p className="text-sm" style={{ color: '#666' }}>{selectedCoach.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#000000' }}>
                    Sport
                  </label>
                  <p className="text-sm" style={{ color: '#666' }}>{selectedCoach.sport}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#000000' }}>
                    Status
                  </label>
                  <p className="text-sm" style={{ color: '#666' }}>{selectedCoach.status}</p>
                </div>
              </div>

              {/* Management Controls */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold" style={{ color: '#000000' }}>
                  Coach Management
                </h3>

                {/* Verification Toggle */}
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <h4 className="font-medium" style={{ color: '#000000' }}>
                      Verification Status
                    </h4>
                    <p className="text-sm" style={{ color: '#666' }}>
                      Mark this coach as verified to show verification badge
                    </p>
                  </div>
                  <button
                    onClick={() => updateCoachStatus(selectedCoach.uid, 'verified', !selectedCoach.verified)}
                    disabled={isUpdating === selectedCoach.uid}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      selectedCoach.verified
                        ? 'bg-green-600 text-white hover:bg-green-700'
                        : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                    } ${isUpdating === selectedCoach.uid ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {isUpdating === selectedCoach.uid ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : selectedCoach.verified ? (
                      <>
                        <UserCheck className="w-4 h-4 mr-2" />
                        Verified
                      </>
                    ) : (
                      <>
                        <UserX className="w-4 h-4 mr-2" />
                        Unverified
                      </>
                    )}
                  </button>
                </div>

                {/* Featured Toggle */}
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <h4 className="font-medium" style={{ color: '#000000' }}>
                      Featured Status
                    </h4>
                    <p className="text-sm" style={{ color: '#666' }}>
                      Mark this coach as featured to show featured badge
                    </p>
                  </div>
                  <button
                    onClick={() => updateCoachStatus(selectedCoach.uid, 'featured', !selectedCoach.featured)}
                    disabled={isUpdating === selectedCoach.uid}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      selectedCoach.featured
                        ? 'bg-purple-600 text-white hover:bg-purple-700'
                        : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                    } ${isUpdating === selectedCoach.uid ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {isUpdating === selectedCoach.uid ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : selectedCoach.featured ? (
                      <>
                        <Star className="w-4 h-4 mr-2" />
                        Featured
                      </>
                    ) : (
                      <>
                        <StarOff className="w-4 h-4 mr-2" />
                        Standard
                      </>
                    )}
                  </button>
                </div>

                {/* Coach Access Control */}
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <h4 className="font-medium" style={{ color: '#000000' }}>
                      Coach Access Control
                    </h4>
                    <p className="text-sm" style={{ color: '#666' }}>
                      Suspend or revoke coach access to the platform. Suspended coaches cannot access their dashboard or interact with athletes.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => updateCoachStatus(selectedCoach.uid, 'status', 'approved')}
                      disabled={isUpdating === selectedCoach.uid || selectedCoach.status === 'approved'}
                      className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                        selectedCoach.status === 'approved'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-green-600 text-white hover:bg-green-700'
                      } ${isUpdating === selectedCoach.uid ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      Restore Access
                    </button>
                    <button
                      onClick={() => updateCoachStatus(selectedCoach.uid, 'status', 'rejected')}
                      disabled={isUpdating === selectedCoach.uid || selectedCoach.status === 'rejected'}
                      className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                        selectedCoach.status === 'rejected'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-red-600 text-white hover:bg-red-700'
                      } ${isUpdating === selectedCoach.uid ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      Suspend Coach
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setSelectedCoach(null)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
