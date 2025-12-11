'use client'

import { useEffect, useState } from 'react'
import { collection, getDocs, query, orderBy, where } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import AppHeader from '@/components/ui/AppHeader'
import { Mail, Clock, CheckCircle, XCircle, Users, Calendar } from 'lucide-react'

interface Invitation {
  id: string
  coachId: string
  athleteName: string
  athleteEmail: string
  sport: string
  status: 'pending' | 'accepted' | 'declined' | 'expired'
  createdAt: string
  expiresAt: string
  invitationUrl: string
  customMessage?: string
  type: string
  used: boolean
  coachName?: string
}

export default function AdminInvitationsPage() {
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'accepted' | 'declined' | 'expired'>('all')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadAllInvitations()
  }, [])

  const loadAllInvitations = async () => {
    try {
      setLoading(true)

      // Get all invitations
      const invitationsRef = collection(db, 'invitations')
      const q = query(invitationsRef, orderBy('createdAt', 'desc'))
      const snapshot = await getDocs(q)

      const invitesData: Invitation[] = []
      const coachIds = new Set<string>()

      snapshot.forEach((doc) => {
        const data = doc.data() as Invitation
        invitesData.push({
          ...data,
          id: doc.id
        })
        if (data.coachId) {
          coachIds.add(data.coachId)
        }
      })

      // Get coach names
      const usersRef = collection(db, 'users')
      const coachNames: { [key: string]: string } = {}

      for (const coachId of Array.from(coachIds)) {
        try {
          const coachQuery = query(usersRef, where('__name__', '==', coachId))
          const coachSnapshot = await getDocs(coachQuery)
          if (!coachSnapshot.empty) {
            const coachData = coachSnapshot.docs[0].data()
            coachNames[coachId] = coachData.displayName || coachData.email || 'Unknown Coach'
          }
        } catch (error) {
          console.error(`Failed to fetch coach ${coachId}:`, error)
        }
      }

      // Add coach names to invitations
      const enrichedInvites = invitesData.map(invite => ({
        ...invite,
        coachName: coachNames[invite.coachId] || 'Unknown Coach'
      }))

      setInvitations(enrichedInvites)
    } catch (error) {
      console.error('Error loading invitations:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string, expiresAt: string) => {
    const isExpired = new Date(expiresAt) < new Date()

    if (isExpired && status === 'pending') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          <Clock className="w-3 h-3 mr-1" />
          Expired
        </span>
      )
    }

    switch (status) {
      case 'accepted':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Accepted
          </span>
        )
      case 'declined':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="w-3 h-3 mr-1" />
            Declined
          </span>
        )
      case 'pending':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {status}
          </span>
        )
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#E8E6D8' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
          <p className="mt-4" style={{ color: '#000000', opacity: 0.7 }}>Loading invitations...</p>
        </div>
      </div>
    )
  }

  const filteredInvitations = invitations.filter(invite => {
    // Filter by status
    const isExpired = new Date(invite.expiresAt) < new Date()
    const effectiveStatus = isExpired && invite.status === 'pending' ? 'expired' : invite.status

    if (filter !== 'all' && effectiveStatus !== filter) {
      return false
    }

    // Filter by search term
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      return (
        invite.athleteName.toLowerCase().includes(search) ||
        invite.athleteEmail.toLowerCase().includes(search) ||
        invite.sport.toLowerCase().includes(search) ||
        (invite.coachName && invite.coachName.toLowerCase().includes(search))
      )
    }

    return true
  })

  const stats = {
    total: invitations.length,
    pending: invitations.filter(i => i.status === 'pending' && new Date(i.expiresAt) >= new Date()).length,
    accepted: invitations.filter(i => i.status === 'accepted').length,
    declined: invitations.filter(i => i.status === 'declined').length,
    expired: invitations.filter(i => i.status === 'pending' && new Date(i.expiresAt) < new Date()).length
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#E8E6D8' }}>
      <AppHeader title="All Invitations" subtitle="View and manage all athlete invitations across all coaches" />
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm" style={{ color: '#000000', opacity: 0.7 }}>Total</p>
                  <p className="text-3xl" style={{ color: '#91A6EB' }}>{stats.total}</p>
                </div>
                <Mail className="w-8 h-8" style={{ color: '#91A6EB' }} />
              </div>
            </div>

            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm" style={{ color: '#000000', opacity: 0.7 }}>Pending</p>
                  <p className="text-3xl" style={{ color: '#FF6B35' }}>{stats.pending}</p>
                </div>
                <Clock className="w-8 h-8" style={{ color: '#FF6B35' }} />
              </div>
            </div>

            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm" style={{ color: '#000000', opacity: 0.7 }}>Accepted</p>
                  <p className="text-3xl" style={{ color: '#20B2AA' }}>{stats.accepted}</p>
                </div>
                <CheckCircle className="w-8 h-8" style={{ color: '#20B2AA' }} />
              </div>
            </div>

            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm" style={{ color: '#000000', opacity: 0.7 }}>Declined</p>
                  <p className="text-3xl" style={{ color: '#FF6B35' }}>{stats.declined}</p>
                </div>
                <XCircle className="w-8 h-8" style={{ color: '#FF6B35' }} />
              </div>
            </div>

            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm" style={{ color: '#000000', opacity: 0.7 }}>Expired</p>
                  <p className="text-3xl" style={{ color: '#000000' }}>{stats.expired}</p>
                </div>
                <Calendar className="w-8 h-8" style={{ color: '#000000' }} />
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6 mb-8">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search by athlete name, email, sport, or coach..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-black bg-white"
                  style={{ color: '#000000' }}
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-4 py-2 rounded-lg transition-all ${
                    filter === 'all'
                      ? 'bg-black text-white'
                      : 'bg-white border border-gray-300/50 hover:bg-black/5'
                  }`}
                  style={filter !== 'all' ? { color: '#000000' } : {}}
                >
                  All
                </button>
                <button
                  onClick={() => setFilter('pending')}
                  className={`px-4 py-2 rounded-lg transition-all ${
                    filter === 'pending'
                      ? 'text-white'
                      : 'bg-white border border-gray-300/50 hover:bg-black/5'
                  }`}
                  style={filter === 'pending' ? { backgroundColor: '#FF6B35' } : { color: '#000000' }}
                >
                  Pending
                </button>
                <button
                  onClick={() => setFilter('accepted')}
                  className={`px-4 py-2 rounded-lg transition-all ${
                    filter === 'accepted'
                      ? 'text-white'
                      : 'bg-white border border-gray-300/50 hover:bg-black/5'
                  }`}
                  style={filter === 'accepted' ? { backgroundColor: '#20B2AA' } : { color: '#000000' }}
                >
                  Accepted
                </button>
                <button
                  onClick={() => setFilter('declined')}
                  className={`px-4 py-2 rounded-lg transition-all ${
                    filter === 'declined'
                      ? 'text-white'
                      : 'bg-white border border-gray-300/50 hover:bg-black/5'
                  }`}
                  style={filter === 'declined' ? { backgroundColor: '#FF6B35' } : { color: '#000000' }}
                >
                  Declined
                </button>
                <button
                  onClick={() => setFilter('expired')}
                  className={`px-4 py-2 rounded-lg transition-all ${
                    filter === 'expired'
                      ? 'bg-black text-white'
                      : 'bg-white border border-gray-300/50 hover:bg-black/5'
                  }`}
                  style={filter !== 'expired' ? { color: '#000000' } : {}}
                >
                  Expired
                </button>
              </div>
            </div>
          </div>

          {/* Invitations Table */}
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
              </div>
            ) : filteredInvitations.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-16 h-16 mx-auto mb-4" style={{ color: '#000000', opacity: 0.3 }} />
                <p className="text-lg" style={{ color: '#000000', opacity: 0.6 }}>No invitations found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Athlete
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Coach
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Sport
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Sent
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Expires
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Link
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredInvitations.map((invite) => (
                      <tr key={invite.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{invite.athleteName}</div>
                            <div className="text-sm text-gray-500">{invite.athleteEmail}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{invite.coachName}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{invite.sport}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(invite.status, invite.expiresAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(invite.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(invite.expiresAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <a
                            href={invite.invitationUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-cardinal hover:text-cardinal-dark underline"
                          >
                            View
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Results count */}
          {!loading && filteredInvitations.length > 0 && (
            <div className="mt-4 text-sm text-gray-600 text-center">
              Showing {filteredInvitations.length} of {invitations.length} invitations
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
