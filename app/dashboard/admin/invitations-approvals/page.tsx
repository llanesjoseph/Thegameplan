'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useEnhancedRole } from '@/hooks/use-role-switcher'
import AppHeader from '@/components/ui/AppHeader'
import AdminInvitationManager from '@/components/admin/AdminInvitationManager'
import { db } from '@/lib/firebase.client'
import { collection, getDocs, doc, updateDoc, query, orderBy, where, Timestamp } from 'firebase/firestore'
import {
  Mail,
  UserCheck,
  FileText,
  MessageSquare,
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Send,
  Eye,
  Search,
  Filter,
  UserPlus,
  Users
} from 'lucide-react'
import EmailPreview from '@/components/admin/EmailPreview'

// Types
interface Invitation {
  id: string
  coachId: string
  athleteName: string
  athleteEmail: string
  sport: string
  status: 'pending' | 'accepted' | 'declined' | 'expired'
  createdAt: Date
  expiresAt: Date
  invitationUrl: string
  coachName?: string
}

interface CoachApplication {
  id: string
  userId: string
  email: string
  displayName: string
  sport: string
  experienceLevel: string
  bio: string
  certifications: string[]
  status: 'pending' | 'approved' | 'rejected'
  submittedAt: Date
  reviewedAt?: Date
  reviewedBy?: string
}

interface CoachRequest {
  id: string
  userId: string
  userEmail: string
  userName: string
  category: string
  priority: string
  status: string
  subject: string
  description: string
  adminResponse?: string
  createdAt: Date
  updatedAt: Date
}

interface AssistantCoach {
  id: string
  email: string
  displayName: string
  headCoachId: string
  headCoachName: string
  sport: string
  status: 'active' | 'inactive'
  addedAt: Date
}

export default function InvitationsApprovalsUnified({ searchParams }: { searchParams: { embedded?: string } }) {
  const embedded = searchParams?.embedded === 'true'
  const [activeTab, setActiveTab] = useState<'invitations' | 'admin-invites' | 'coach-invites' | 'athlete-invites' | 'applications' | 'requests' | 'assistants'>('invitations')
  const { user } = useAuth()
  const { role } = useEnhancedRole()

  // All Invitations State
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [invitationsLoading, setInvitationsLoading] = useState(false)
  const [invitationFilter, setInvitationFilter] = useState<'all' | 'pending' | 'accepted' | 'declined' | 'expired'>('all')
  const [invitationSearch, setInvitationSearch] = useState('')

  // Coach Applications State
  const [applications, setApplications] = useState<CoachApplication[]>([])
  const [applicationsLoading, setApplicationsLoading] = useState(false)
  const [applicationFilter, setApplicationFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')
  const [selectedApplication, setSelectedApplication] = useState<CoachApplication | null>(null)

  // Coach Requests State
  const [requests, setRequests] = useState<CoachRequest[]>([])
  const [requestsLoading, setRequestsLoading] = useState(false)
  const [requestFilter, setRequestFilter] = useState<'all' | 'open' | 'in_progress' | 'resolved' | 'closed'>('all')
  const [selectedRequest, setSelectedRequest] = useState<CoachRequest | null>(null)
  const [adminResponse, setAdminResponse] = useState('')

  // Assistant Coaches State
  const [assistants, setAssistants] = useState<AssistantCoach[]>([])
  const [assistantsLoading, setAssistantsLoading] = useState(false)

  // Coach Invite Form State
  const [coachInviteForm, setCoachInviteForm] = useState({
    coachEmail: '',
    coachName: '',
    sport: '',
    customMessage: '',
    expiresInDays: 7
  })
  const [coachInviteLoading, setCoachInviteLoading] = useState(false)

  // Athlete Invite Form State
  const [athleteInviteForm, setAthleteInviteForm] = useState({
    athleteEmail: '',
    athleteName: '',
    sport: '',
    coachId: '',
    customMessage: '',
    expiresInDays: 14
  })
  const [athleteInviteLoading, setAthleteInviteLoading] = useState(false)

  // Coaches List for Athlete Assignment
  const [coaches, setCoaches] = useState<Array<{id: string, name: string, email: string, sport: string}>>([])
  const [coachesLoading, setCoachesLoading] = useState(false)

  // Load data when tab changes
  useEffect(() => {
    if (user && (role === 'superadmin' || role === 'admin')) {
      switch (activeTab) {
        case 'invitations':
          loadInvitations()
          break
        case 'athlete-invites':
          loadCoaches() // Load coaches when athlete invite tab is active
          break
        case 'applications':
          loadApplications()
          break
        case 'requests':
          loadRequests()
          break
        case 'assistants':
          loadAssistants()
          break
      }
    }
  }, [activeTab, user, role])

  // Load All Invitations
  const loadInvitations = async () => {
    try {
      setInvitationsLoading(true)
      const invitationsQuery = query(collection(db, 'invitations'), orderBy('createdAt', 'desc'))
      const snapshot = await getDocs(invitationsQuery)
      const invitationsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        expiresAt: doc.data().expiresAt?.toDate() || new Date()
      })) as Invitation[]
      setInvitations(invitationsData)
    } catch (error) {
      console.error('Error loading invitations:', error)
    } finally {
      setInvitationsLoading(false)
    }
  }

  // Load Coach Applications
  const loadApplications = async () => {
    try {
      setApplicationsLoading(true)
      const applicationsQuery = query(collection(db, 'coachApplications'), orderBy('submittedAt', 'desc'))
      const snapshot = await getDocs(applicationsQuery)
      const applicationsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        submittedAt: doc.data().submittedAt?.toDate() || new Date(),
        reviewedAt: doc.data().reviewedAt?.toDate()
      })) as CoachApplication[]
      setApplications(applicationsData)
    } catch (error) {
      console.error('Error loading applications:', error)
    } finally {
      setApplicationsLoading(false)
    }
  }

  // Load Coach Requests
  const loadRequests = async () => {
    try {
      setRequestsLoading(true)
      const requestsQuery = query(collection(db, 'requests'), orderBy('createdAt', 'desc'))
      const snapshot = await getDocs(requestsQuery)
      const requestsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      })) as CoachRequest[]
      setRequests(requestsData)
    } catch (error) {
      console.error('Error loading requests:', error)
    } finally {
      setRequestsLoading(false)
    }
  }

  // Load Assistant Coaches
  const loadAssistants = async () => {
    try {
      setAssistantsLoading(true)
      const assistantsQuery = query(
        collection(db, 'users'),
        where('role', '==', 'assistant_coach'),
        orderBy('createdAt', 'desc')
      )
      const snapshot = await getDocs(assistantsQuery)
      const assistantsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        addedAt: doc.data().createdAt?.toDate() || new Date()
      })) as AssistantCoach[]
      setAssistants(assistantsData)
    } catch (error) {
      console.error('Error loading assistants:', error)
    } finally {
      setAssistantsLoading(false)
    }
  }

  // Load Coaches for Athlete Assignment
  const loadCoaches = async () => {
    try {
      setCoachesLoading(true)
      const coachesQuery = query(
        collection(db, 'users'),
        where('role', '==', 'coach')
      )
      const snapshot = await getDocs(coachesQuery)
      const coachesData = snapshot.docs.map(doc => {
        const data = doc.data()
        return {
          id: doc.id,
          name: data.displayName || data.email || 'Unknown',
          email: data.email || '',
          sport: data.sport || 'Not specified'
        }
      })
      setCoaches(coachesData)
    } catch (error) {
      console.error('Error loading coaches:', error)
    } finally {
      setCoachesLoading(false)
    }
  }

  // Handle Coach Invitation Submit
  const handleCoachInviteSubmit = async () => {
    // Validate form
    if (!coachInviteForm.coachEmail || !coachInviteForm.coachName || !coachInviteForm.sport) {
      alert('Please fill in all required fields')
      return
    }

    try {
      setCoachInviteLoading(true)

      // Get Firebase ID token
      const idToken = await user?.getIdToken()
      if (!idToken) {
        alert('Authentication error. Please log in again.')
        return
      }

      const response = await fetch('/api/admin/create-coach-invitation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify(coachInviteForm)
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        alert(result.error || 'Failed to create coach invitation')
        return
      }

      // Success!
      if (result.data.emailSent) {
        alert(`✅ Coach invitation sent successfully to ${coachInviteForm.coachEmail}!`)
      } else {
        alert(`⚠️ Invitation created but email failed to send: ${result.data.emailError}. Share this link manually:\n\n${result.data.url}`)
      }

      // Reset form
      setCoachInviteForm({
        coachEmail: '',
        coachName: '',
        sport: '',
        customMessage: '',
        expiresInDays: 7
      })

      // Reload invitations
      loadInvitations()
    } catch (error) {
      console.error('Error creating coach invitation:', error)
      alert('Failed to create coach invitation. Please try again.')
    } finally {
      setCoachInviteLoading(false)
    }
  }

  // Handle Athlete Invitation Submit
  const handleAthleteInviteSubmit = async () => {
    // Validate form
    if (!athleteInviteForm.athleteEmail || !athleteInviteForm.athleteName || !athleteInviteForm.sport || !athleteInviteForm.coachId) {
      alert('Please fill in all required fields')
      return
    }

    try {
      setAthleteInviteLoading(true)

      // Get Firebase ID token
      const idToken = await user?.getIdToken()
      if (!idToken) {
        alert('Authentication error. Please log in again.')
        return
      }

      const response = await fetch('/api/admin/create-athlete-invitation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify(athleteInviteForm)
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        alert(result.error || 'Failed to create athlete invitation')
        return
      }

      // Success!
      const coachName = coaches.find(c => c.id === athleteInviteForm.coachId)?.name || 'coach'
      if (result.data.emailSent) {
        alert(`✅ Athlete invitation sent successfully to ${athleteInviteForm.athleteEmail} and assigned to ${coachName}!`)
      } else {
        alert(`⚠️ Invitation created but email failed to send: ${result.data.emailError}. Share this link manually:\n\n${result.data.url}`)
      }

      // Reset form
      setAthleteInviteForm({
        athleteEmail: '',
        athleteName: '',
        sport: '',
        coachId: '',
        customMessage: '',
        expiresInDays: 14
      })

      // Reload invitations
      loadInvitations()
    } catch (error) {
      console.error('Error creating athlete invitation:', error)
      alert('Failed to create athlete invitation. Please try again.')
    } finally {
      setAthleteInviteLoading(false)
    }
  }

  // Application Actions
  const handleApplicationReview = async (applicationId: string, status: 'approved' | 'rejected') => {
    if (!confirm(`Are you sure you want to ${status === 'approved' ? 'approve' : 'reject'} this application?`)) return

    try {
      await updateDoc(doc(db, 'coachApplications', applicationId), {
        status,
        reviewedAt: Timestamp.now(),
        reviewedBy: user?.email
      })
      setSelectedApplication(null)
      loadApplications()
    } catch (error) {
      console.error('Error updating application:', error)
    }
  }

  // Request Actions
  const handleRequestUpdate = async (requestId: string, status: string) => {
    try {
      await updateDoc(doc(db, 'requests', requestId), {
        status,
        adminResponse,
        updatedAt: Timestamp.now(),
        updatedBy: user?.email
      })
      setSelectedRequest(null)
      setAdminResponse('')
      loadRequests()
    } catch (error) {
      console.error('Error updating request:', error)
    }
  }

  // Filter functions
  const filteredInvitations = invitations.filter(inv => {
    if (invitationFilter !== 'all' && inv.status !== invitationFilter) return false
    if (invitationSearch && !inv.athleteName.toLowerCase().includes(invitationSearch.toLowerCase()) &&
        !inv.athleteEmail.toLowerCase().includes(invitationSearch.toLowerCase())) return false
    return true
  })

  const filteredApplications = applications.filter(app =>
    applicationFilter === 'all' || app.status === applicationFilter
  )

  const filteredRequests = requests.filter(req =>
    requestFilter === 'all' || req.status === requestFilter
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'accepted':
      case 'approved':
      case 'resolved': return 'bg-green-100 text-green-800'
      case 'declined':
      case 'rejected':
      case 'closed': return 'bg-red-100 text-red-800'
      case 'expired': return 'bg-gray-100 text-gray-800'
      case 'in_progress': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (role !== 'superadmin' && role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#E8E6D8' }}>
        <div className="text-center bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-8">
          <h1 className="text-2xl mb-4 font-heading" style={{ color: '#000000' }}>Access Denied</h1>
          <p style={{ color: '#000000', opacity: 0.7 }}>This page is only available to administrators.</p>
        </div>
      </div>
    )
  }

  // Embedded mode - no header, no full page wrapper
  if (embedded) {
    return (
      <div className="space-y-6">
        {/* Tab Navigation */}
        <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border border-white/50 p-2 mb-4">
          <div className="flex gap-2 overflow-x-auto">
            <button
              onClick={() => setActiveTab('invitations')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all whitespace-nowrap font-semibold text-sm ${
                activeTab === 'invitations' ? 'bg-black text-white' : 'hover:bg-gray-100'
              }`}
            >
              <Mail className="w-4 h-4" />
              All Invitations
            </button>
            <button
              onClick={() => setActiveTab('admin-invites')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all whitespace-nowrap font-semibold text-sm ${
                activeTab === 'admin-invites' ? 'bg-black text-white' : 'hover:bg-gray-100'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              Admin Invitations
            </button>
            <button
              onClick={() => setActiveTab('coach-invites')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all whitespace-nowrap font-semibold text-sm ${
                activeTab === 'coach-invites' ? 'bg-black text-white' : 'hover:bg-gray-100'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              Coach Invites
            </button>
            <button
              onClick={() => setActiveTab('athlete-invites')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all whitespace-nowrap font-semibold text-sm ${
                activeTab === 'athlete-invites' ? 'bg-black text-white' : 'hover:bg-gray-100'
              }`}
            >
              <Users className="w-4 h-4" />
              Athlete Invites
            </button>
            <button
              onClick={() => setActiveTab('applications')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all whitespace-nowrap font-semibold text-sm ${
                activeTab === 'applications' ? 'bg-black text-white' : 'hover:bg-gray-100'
              }`}
            >
              <FileText className="w-4 h-4" />
              Coach Applications
            </button>
            <button
              onClick={() => setActiveTab('requests')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all whitespace-nowrap font-semibold text-sm ${
                activeTab === 'requests' ? 'bg-black text-white' : 'hover:bg-gray-100'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              Coach Requests
            </button>
            <button
              onClick={() => setActiveTab('assistants')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all whitespace-nowrap font-semibold text-sm ${
                activeTab === 'assistants' ? 'bg-black text-white' : 'hover:bg-gray-100'
              }`}
            >
              <Shield className="w-4 h-4" />
              Assistant Coaches
            </button>
          </div>
        </div>

        {/* ALL INVITATIONS TAB */}
        {activeTab === 'invitations' && (
          <div className="space-y-4">
            {/* Stats Cards - Compact */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border border-white/50 p-3 text-center">
                <Mail className="w-6 h-6 mx-auto mb-1" style={{ color: '#91A6EB' }} />
                <div className="text-2xl font-heading" style={{ color: '#91A6EB' }}>{invitations.length}</div>
                <div className="text-xs" style={{ color: '#000000', opacity: 0.7 }}>Total</div>
              </div>
              <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-4 text-center">
                <Clock className="w-6 h-6 mx-auto mb-1" style={{ color: '#FF6B35' }} />
                <div className="text-2xl font-heading" style={{ color: '#FF6B35' }}>{invitations.filter(i => i.status === 'pending').length}</div>
                <div className="text-xs" style={{ color: '#000000', opacity: 0.7 }}>Pending</div>
              </div>
              <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-4 text-center">
                <CheckCircle className="w-6 h-6 mx-auto mb-1" style={{ color: '#20B2AA' }} />
                <div className="text-2xl font-heading" style={{ color: '#20B2AA' }}>{invitations.filter(i => i.status === 'accepted').length}</div>
                <div className="text-xs" style={{ color: '#000000', opacity: 0.7 }}>Accepted</div>
              </div>
              <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-4 text-center">
                <XCircle className="w-6 h-6 mx-auto mb-1" style={{ color: '#FF6B35' }} />
                <div className="text-2xl font-heading" style={{ color: '#FF6B35' }}>{invitations.filter(i => i.status === 'declined').length}</div>
                <div className="text-xs" style={{ color: '#000000', opacity: 0.7 }}>Declined</div>
              </div>
              <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-4 text-center">
                <AlertTriangle className="w-6 h-6 mx-auto mb-1" style={{ color: '#000000', opacity: 0.5 }} />
                <div className="text-2xl font-heading" style={{ color: '#000000' }}>{invitations.filter(i => i.status === 'expired').length}</div>
                <div className="text-xs" style={{ color: '#000000', opacity: 0.7 }}>Expired</div>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border border-white/50 p-3">
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: '#000000', opacity: 0.5 }} />
                  <input
                    type="text"
                    placeholder="Search by athlete name or email..."
                    value={invitationSearch}
                    onChange={(e) => setInvitationSearch(e.target.value)}
                    className="w-full pl-10 px-4 py-2 border border-gray-300/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>
                <div className="flex gap-2">
                  {['all', 'pending', 'accepted', 'declined', 'expired'].map(status => (
                    <button
                      key={status}
                      onClick={() => setInvitationFilter(status as any)}
                      className={`px-4 py-2 rounded-lg font-semibold transition-colors capitalize ${
                        invitationFilter === status ? 'bg-black text-white' : 'bg-gray-200 hover:bg-gray-300'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Invitations Table */}
            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left p-2 text-xs font-semibold" style={{ color: '#000000' }}>Athlete</th>
                      <th className="text-left p-2 text-xs font-semibold" style={{ color: '#000000' }}>Sport</th>
                      <th className="text-left p-2 text-xs font-semibold" style={{ color: '#000000' }}>Coach</th>
                      <th className="text-left p-2 text-xs font-semibold" style={{ color: '#000000' }}>Status</th>
                      <th className="text-left p-2 text-xs font-semibold" style={{ color: '#000000' }}>Sent</th>
                      <th className="text-left p-2 text-xs font-semibold" style={{ color: '#000000' }}>Expires</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invitationsLoading ? (
                      <tr>
                        <td colSpan={6} className="text-center p-12">
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
                        </td>
                      </tr>
                    ) : filteredInvitations.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center p-12" style={{ color: '#000000', opacity: 0.7 }}>
                          No invitations found
                        </td>
                      </tr>
                    ) : (
                      filteredInvitations.map(invitation => (
                        <tr key={invitation.id} className="border-t border-gray-200 hover:bg-gray-50">
                          <td className="p-2 text-sm">
                            <div className="font-semibold" style={{ color: '#000000' }}>{invitation.athleteName}</div>
                            <div className="text-sm" style={{ color: '#000000', opacity: 0.6 }}>{invitation.athleteEmail}</div>
                          </td>
                          <td className="p-4" style={{ color: '#000000' }}>{invitation.sport}</td>
                          <td className="p-4" style={{ color: '#000000' }}>{invitation.coachName || 'Unknown'}</td>
                          <td className="p-2 text-sm">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${getStatusColor(invitation.status)}`}>
                              {invitation.status}
                            </span>
                          </td>
                          <td className="p-4 text-sm" style={{ color: '#000000', opacity: 0.7 }}>
                            {invitation.createdAt.toLocaleDateString()}
                          </td>
                          <td className="p-4 text-sm" style={{ color: '#000000', opacity: 0.7 }}>
                            {invitation.expiresAt.toLocaleDateString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ADMIN INVITATIONS TAB */}
        {activeTab === 'admin-invites' && (
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6">
            <AdminInvitationManager />
          </div>
        )}

        {/* COACH INVITES TAB */}
        {activeTab === 'coach-invites' && (
          <div className="space-y-4">
            <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border border-white/50 p-6">
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                  <UserPlus className="w-6 h-6" style={{ color: '#20B2AA' }} />
                  <h2 className="text-2xl font-heading" style={{ color: '#000000' }}>Invite Coach</h2>
                </div>
                <p className="text-sm" style={{ color: '#000000', opacity: 0.7 }}>
                  Invite qualified coaches to join the platform and work with athletes
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Form Column */}
                <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: '#000000' }}>
                    Coach Email *
                  </label>
                  <input
                    type="email"
                    value={coachInviteForm.coachEmail}
                    onChange={(e) => setCoachInviteForm(prev => ({...prev, coachEmail: e.target.value}))}
                    placeholder="coach@example.com"
                    disabled={coachInviteLoading}
                    className="w-full px-4 py-2 border border-gray-300/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-black disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: '#000000' }}>
                    Coach Name *
                  </label>
                  <input
                    type="text"
                    value={coachInviteForm.coachName}
                    onChange={(e) => setCoachInviteForm(prev => ({...prev, coachName: e.target.value}))}
                    placeholder="John Smith"
                    disabled={coachInviteLoading}
                    className="w-full px-4 py-2 border border-gray-300/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-black disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: '#000000' }}>
                    Sport *
                  </label>
                  <select
                    value={coachInviteForm.sport}
                    onChange={(e) => setCoachInviteForm(prev => ({...prev, sport: e.target.value}))}
                    disabled={coachInviteLoading}
                    className="w-full px-4 py-2 border border-gray-300/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-black disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">Select sport...</option>
                    <option value="baseball">Baseball</option>
                    <option value="basketball">Basketball</option>
                    <option value="football">Football</option>
                    <option value="soccer">Soccer</option>
                    <option value="softball">Softball</option>
                    <option value="volleyball">Volleyball</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: '#000000' }}>
                    Link Expires In (Days)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={coachInviteForm.expiresInDays}
                    onChange={(e) => setCoachInviteForm(prev => ({...prev, expiresInDays: parseInt(e.target.value) || 7}))}
                    disabled={coachInviteLoading}
                    className="w-full px-4 py-2 border border-gray-300/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-black disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#000000' }}>
                  Welcome Message (Optional)
                </label>
                <textarea
                  rows={3}
                  value={coachInviteForm.customMessage}
                  onChange={(e) => setCoachInviteForm(prev => ({...prev, customMessage: e.target.value}))}
                  placeholder="Welcome message for the coach..."
                  disabled={coachInviteLoading}
                  className="w-full px-4 py-2 border border-gray-300/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-black disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

                  <button
                    onClick={handleCoachInviteSubmit}
                    disabled={coachInviteLoading}
                    className="w-full px-6 py-3 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {coachInviteLoading ? 'Sending...' : 'Send Coach Invitation'}
                  </button>
                </div>

                {/* Preview Column */}
                <div className="hidden lg:block">
                  <EmailPreview
                    type="coach"
                    data={{
                      name: coachInviteForm.coachName,
                      email: coachInviteForm.coachEmail,
                      sport: coachInviteForm.sport,
                      customMessage: coachInviteForm.customMessage,
                      expiresInDays: coachInviteForm.expiresInDays
                    }}
                    inviterName={user?.displayName || 'Admin'}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ATHLETE INVITES TAB */}
        {activeTab === 'athlete-invites' && (
          <div className="space-y-4">
            <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border border-white/50 p-6">
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                  <Users className="w-6 h-6" style={{ color: '#91A6EB' }} />
                  <h2 className="text-2xl font-heading" style={{ color: '#000000' }}>Invite Athlete</h2>
                </div>
                <p className="text-sm" style={{ color: '#000000', opacity: 0.7 }}>
                  Invite athletes and assign them to a coach
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Form Column */}
                <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: '#000000' }}>
                    Athlete Email *
                  </label>
                  <input
                    type="email"
                    value={athleteInviteForm.athleteEmail}
                    onChange={(e) => setAthleteInviteForm(prev => ({...prev, athleteEmail: e.target.value}))}
                    placeholder="athlete@example.com"
                    disabled={athleteInviteLoading}
                    className="w-full px-4 py-2 border border-gray-300/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-black disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: '#000000' }}>
                    Athlete Name *
                  </label>
                  <input
                    type="text"
                    value={athleteInviteForm.athleteName}
                    onChange={(e) => setAthleteInviteForm(prev => ({...prev, athleteName: e.target.value}))}
                    placeholder="Jane Doe"
                    disabled={athleteInviteLoading}
                    className="w-full px-4 py-2 border border-gray-300/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-black disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: '#000000' }}>
                    Sport *
                  </label>
                  <select
                    value={athleteInviteForm.sport}
                    onChange={(e) => setAthleteInviteForm(prev => ({...prev, sport: e.target.value}))}
                    disabled={athleteInviteLoading}
                    className="w-full px-4 py-2 border border-gray-300/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-black disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">Select sport...</option>
                    <option value="baseball">Baseball</option>
                    <option value="basketball">Basketball</option>
                    <option value="football">Football</option>
                    <option value="soccer">Soccer</option>
                    <option value="softball">Softball</option>
                    <option value="volleyball">Volleyball</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: '#000000' }}>
                    Assign to Coach *
                  </label>
                  <select
                    value={athleteInviteForm.coachId}
                    onChange={(e) => setAthleteInviteForm(prev => ({...prev, coachId: e.target.value}))}
                    disabled={athleteInviteLoading || coachesLoading}
                    className="w-full px-4 py-2 border border-gray-300/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-black disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">
                      {coachesLoading ? 'Loading coaches...' : coaches.length === 0 ? 'No coaches available' : 'Select coach...'}
                    </option>
                    {coaches.map(coach => (
                      <option key={coach.id} value={coach.id}>
                        {coach.name} - {coach.sport} ({coach.email})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#000000' }}>
                  Link Expires In (Days)
                </label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={athleteInviteForm.expiresInDays}
                  onChange={(e) => setAthleteInviteForm(prev => ({...prev, expiresInDays: parseInt(e.target.value) || 14}))}
                  disabled={athleteInviteLoading}
                  className="w-full px-4 py-2 border border-gray-300/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-black disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#000000' }}>
                  Welcome Message (Optional)
                </label>
                <textarea
                  rows={3}
                  value={athleteInviteForm.customMessage}
                  onChange={(e) => setAthleteInviteForm(prev => ({...prev, customMessage: e.target.value}))}
                  placeholder="Welcome message for the athlete..."
                  disabled={athleteInviteLoading}
                  className="w-full px-4 py-2 border border-gray-300/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-black disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

                  <button
                    onClick={handleAthleteInviteSubmit}
                    disabled={athleteInviteLoading || !athleteInviteForm.coachId}
                    className="w-full px-6 py-3 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {athleteInviteLoading ? 'Sending...' : 'Send Athlete Invitation'}
                  </button>
                </div>

                {/* Preview Column */}
                <div className="hidden lg:block">
                  <EmailPreview
                    type="athlete"
                    data={{
                      name: athleteInviteForm.athleteName,
                      email: athleteInviteForm.athleteEmail,
                      sport: athleteInviteForm.sport,
                      customMessage: athleteInviteForm.customMessage,
                      expiresInDays: athleteInviteForm.expiresInDays,
                      coachName: coaches.find(c => c.id === athleteInviteForm.coachId)?.name
                    }}
                    inviterName={user?.displayName || 'Admin'}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* COACH APPLICATIONS TAB */}
        {activeTab === 'applications' && (
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-4 text-center">
                <FileText className="w-8 h-8 mx-auto mb-2" style={{ color: '#91A6EB' }} />
                <div className="text-3xl font-heading" style={{ color: '#91A6EB' }}>{applications.length}</div>
                <div className="text-sm" style={{ color: '#000000', opacity: 0.7 }}>Total</div>
              </div>
              <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-4 text-center">
                <Clock className="w-8 h-8 mx-auto mb-2" style={{ color: '#FF6B35' }} />
                <div className="text-3xl font-heading" style={{ color: '#FF6B35' }}>{applications.filter(a => a.status === 'pending').length}</div>
                <div className="text-sm" style={{ color: '#000000', opacity: 0.7 }}>Pending</div>
              </div>
              <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-4 text-center">
                <CheckCircle className="w-8 h-8 mx-auto mb-2" style={{ color: '#20B2AA' }} />
                <div className="text-3xl font-heading" style={{ color: '#20B2AA' }}>{applications.filter(a => a.status === 'approved').length}</div>
                <div className="text-sm" style={{ color: '#000000', opacity: 0.7 }}>Approved</div>
              </div>
              <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-4 text-center">
                <XCircle className="w-8 h-8 mx-auto mb-2" style={{ color: '#FF6B35' }} />
                <div className="text-3xl font-heading" style={{ color: '#FF6B35' }}>{applications.filter(a => a.status === 'rejected').length}</div>
                <div className="text-sm" style={{ color: '#000000', opacity: 0.7 }}>Rejected</div>
              </div>
            </div>

            {/* Filter Buttons */}
            <div className="flex gap-2">
              {['all', 'pending', 'approved', 'rejected'].map(status => (
                <button
                  key={status}
                  onClick={() => setApplicationFilter(status as any)}
                  className={`px-4 py-2 rounded-lg font-semibold transition-colors capitalize ${
                    applicationFilter === status ? 'bg-black text-white' : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>

            {/* Applications List */}
            <div className="space-y-4">
              {applicationsLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
                </div>
              ) : filteredApplications.length === 0 ? (
                <div className="text-center py-12" style={{ color: '#000000', opacity: 0.7 }}>
                  No applications found
                </div>
              ) : (
                filteredApplications.map(app => (
                  <div key={app.id} className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-heading mb-2" style={{ color: '#000000' }}>{app.displayName}</h3>
                        <p className="text-sm mb-2" style={{ color: '#000000', opacity: 0.7 }}>{app.email}</p>
                        <div className="flex gap-4 text-sm mb-3" style={{ color: '#000000', opacity: 0.6 }}>
                          <span>Sport: {app.sport}</span>
                          <span>•</span>
                          <span>Level: {app.experienceLevel}</span>
                          <span>•</span>
                          <span>Submitted: {app.submittedAt.toLocaleDateString()}</span>
                        </div>
                        <p className="mb-3" style={{ color: '#000000' }}>{app.bio}</p>
                        {app.certifications?.length > 0 && (
                          <div className="flex gap-2 flex-wrap">
                            {app.certifications.map((cert, i) => (
                              <span key={i} className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                                {cert}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${getStatusColor(app.status)}`}>
                          {app.status}
                        </span>
                      </div>
                    </div>

                    {app.status === 'pending' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApplicationReview(app.id, 'approved')}
                          className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
                        >
                          <CheckCircle className="w-4 h-4 inline mr-2" />
                          Approve
                        </button>
                        <button
                          onClick={() => handleApplicationReview(app.id, 'rejected')}
                          className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
                        >
                          <XCircle className="w-4 h-4 inline mr-2" />
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* COACH REQUESTS TAB */}
        {activeTab === 'requests' && (
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-4 text-center">
                <MessageSquare className="w-8 h-8 mx-auto mb-2" style={{ color: '#91A6EB' }} />
                <div className="text-3xl font-heading" style={{ color: '#91A6EB' }}>{requests.length}</div>
                <div className="text-sm" style={{ color: '#000000', opacity: 0.7 }}>Total</div>
              </div>
              <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-4 text-center">
                <Clock className="w-8 h-8 mx-auto mb-2" style={{ color: '#FF6B35' }} />
                <div className="text-3xl font-heading" style={{ color: '#FF6B35' }}>{requests.filter(r => r.status === 'open').length}</div>
                <div className="text-sm" style={{ color: '#000000', opacity: 0.7 }}>Open</div>
              </div>
              <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-4 text-center">
                <Send className="w-8 h-8 mx-auto mb-2" style={{ color: '#91A6EB' }} />
                <div className="text-3xl font-heading" style={{ color: '#91A6EB' }}>{requests.filter(r => r.status === 'in_progress').length}</div>
                <div className="text-sm" style={{ color: '#000000', opacity: 0.7 }}>In Progress</div>
              </div>
              <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-4 text-center">
                <CheckCircle className="w-8 h-8 mx-auto mb-2" style={{ color: '#20B2AA' }} />
                <div className="text-3xl font-heading" style={{ color: '#20B2AA' }}>{requests.filter(r => r.status === 'resolved').length}</div>
                <div className="text-sm" style={{ color: '#000000', opacity: 0.7 }}>Resolved</div>
              </div>
              <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-4 text-center">
                <XCircle className="w-8 h-8 mx-auto mb-2" style={{ color: '#000000', opacity: 0.5 }} />
                <div className="text-3xl font-heading" style={{ color: '#000000' }}>{requests.filter(r => r.status === 'closed').length}</div>
                <div className="text-sm" style={{ color: '#000000', opacity: 0.7 }}>Closed</div>
              </div>
            </div>

            {/* Filter */}
            <div className="flex gap-2">
              {['all', 'open', 'in_progress', 'resolved', 'closed'].map(status => (
                <button
                  key={status}
                  onClick={() => setRequestFilter(status as any)}
                  className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                    requestFilter === status ? 'bg-black text-white' : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                >
                  {status.replace('_', ' ')}
                </button>
              ))}
            </div>

            {/* Requests List */}
            <div className="grid md:grid-cols-2 gap-6">
              {requestsLoading ? (
                <div className="col-span-2 text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
                </div>
              ) : filteredRequests.length === 0 ? (
                <div className="col-span-2 text-center py-12" style={{ color: '#000000', opacity: 0.7 }}>
                  No requests found
                </div>
              ) : (
                filteredRequests.map(request => (
                  <div key={request.id} className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-lg font-heading mb-1" style={{ color: '#000000' }}>{request.subject}</h3>
                        <p className="text-sm mb-2" style={{ color: '#000000', opacity: 0.6 }}>
                          {request.userName} • {request.userEmail}
                        </p>
                        <div className="flex gap-2 mb-3">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(request.status)}`}>
                            {request.status.replace('_', ' ')}
                          </span>
                          <span className="px-2 py-1 rounded text-xs font-semibold bg-gray-100 text-gray-800">
                            {request.category}
                          </span>
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            request.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                            request.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                            request.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {request.priority}
                          </span>
                        </div>
                      </div>
                    </div>

                    <p className="mb-4 text-sm" style={{ color: '#000000' }}>{request.description}</p>

                    {request.adminResponse && (
                      <div className="mb-4 p-3 rounded-lg bg-blue-50 border border-blue-200">
                        <p className="text-sm font-semibold mb-1" style={{ color: '#000000' }}>Admin Response:</p>
                        <p className="text-sm" style={{ color: '#000000' }}>{request.adminResponse}</p>
                      </div>
                    )}

                    <button
                      onClick={() => {
                        setSelectedRequest(request)
                        setAdminResponse(request.adminResponse || '')
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors font-semibold"
                    >
                      <Eye className="w-4 h-4 inline mr-2" />
                      View & Respond
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Request Modal */}
            {selectedRequest && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
                  <h2 className="text-2xl font-heading mb-4" style={{ color: '#000000' }}>{selectedRequest.subject}</h2>
                  <p className="mb-4" style={{ color: '#000000' }}>{selectedRequest.description}</p>

                  <div className="mb-4">
                    <label className="block text-sm font-semibold mb-2" style={{ color: '#000000' }}>Admin Response</label>
                    <textarea
                      value={adminResponse}
                      onChange={(e) => setAdminResponse(e.target.value)}
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                      placeholder="Type your response..."
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleRequestUpdate(selectedRequest.id, 'in_progress')}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
                    >
                      In Progress
                    </button>
                    <button
                      onClick={() => handleRequestUpdate(selectedRequest.id, 'resolved')}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700"
                    >
                      Resolve
                    </button>
                    <button
                      onClick={() => handleRequestUpdate(selectedRequest.id, 'closed')}
                      className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700"
                    >
                      Close
                    </button>
                    <button
                      onClick={() => {
                        setSelectedRequest(null)
                        setAdminResponse('')
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ASSISTANT COACHES TAB */}
        {activeTab === 'assistants' && (
          <div className="space-y-6">
            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-4">
              <div className="text-center" style={{ color: '#91A6EB' }}>
                <Shield className="w-16 h-16 mx-auto mb-4" />
                <div className="text-4xl font-heading mb-2">{assistants.length}</div>
                <div className="text-lg">Assistant Coaches</div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {assistantsLoading ? (
                <div className="col-span-2 text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
                </div>
              ) : assistants.length === 0 ? (
                <div className="col-span-2 text-center py-12" style={{ color: '#000000', opacity: 0.7 }}>
                  No assistant coaches found
                </div>
              ) : (
                assistants.map(assistant => (
                  <div key={assistant.id} className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#20B2AA' }}>
                        <Shield className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-heading mb-1" style={{ color: '#000000' }}>{assistant.displayName}</h3>
                        <p className="text-sm mb-2" style={{ color: '#000000', opacity: 0.6 }}>{assistant.email}</p>
                        <div className="flex gap-2 mb-2">
                          <span className="text-sm" style={{ color: '#000000', opacity: 0.7 }}>
                            Sport: {assistant.sport}
                          </span>
                          <span>•</span>
                          <span className="text-sm" style={{ color: '#000000', opacity: 0.7 }}>
                            Head Coach: {assistant.headCoachName}
                          </span>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(assistant.status)}`}>
                          {assistant.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    )
  }

  // Non-embedded mode - full page with header
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#E8E6D8' }}>
      <AppHeader title="Invitations & Approvals" subtitle="Manage all invitations, applications, and approval workflows" />

      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 space-y-6">
        {/* Tab Navigation */}
        <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border border-white/50 p-2 mb-4">
          <div className="flex gap-2 overflow-x-auto">
            <button
              onClick={() => setActiveTab('invitations')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all whitespace-nowrap font-semibold text-sm ${
                activeTab === 'invitations' ? 'bg-black text-white' : 'hover:bg-gray-100'
              }`}
            >
              <Mail className="w-4 h-4" />
              All Invitations
            </button>
            <button
              onClick={() => setActiveTab('admin-invites')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all whitespace-nowrap font-semibold text-sm ${
                activeTab === 'admin-invites' ? 'bg-black text-white' : 'hover:bg-gray-100'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              Admin Invitations
            </button>
            <button
              onClick={() => setActiveTab('coach-invites')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all whitespace-nowrap font-semibold text-sm ${
                activeTab === 'coach-invites' ? 'bg-black text-white' : 'hover:bg-gray-100'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              Coach Invites
            </button>
            <button
              onClick={() => setActiveTab('athlete-invites')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all whitespace-nowrap font-semibold text-sm ${
                activeTab === 'athlete-invites' ? 'bg-black text-white' : 'hover:bg-gray-100'
              }`}
            >
              <Users className="w-4 h-4" />
              Athlete Invites
            </button>
            <button
              onClick={() => setActiveTab('applications')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all whitespace-nowrap font-semibold text-sm ${
                activeTab === 'applications' ? 'bg-black text-white' : 'hover:bg-gray-100'
              }`}
            >
              <FileText className="w-4 h-4" />
              Coach Applications
            </button>
            <button
              onClick={() => setActiveTab('requests')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all whitespace-nowrap font-semibold text-sm ${
                activeTab === 'requests' ? 'bg-black text-white' : 'hover:bg-gray-100'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              Coach Requests
            </button>
            <button
              onClick={() => setActiveTab('assistants')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all whitespace-nowrap font-semibold text-sm ${
                activeTab === 'assistants' ? 'bg-black text-white' : 'hover:bg-gray-100'
              }`}
            >
              <Shield className="w-4 h-4" />
              Assistant Coaches
            </button>
          </div>
        </div>

        {/* Reuse the same tab content from embedded mode - note: this is duplicated for now, should be refactored to a shared component */}
        {activeTab === 'invitations' && (
          <div className="space-y-4">
            {/* Stats Cards - Compact */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border border-white/50 p-3 text-center">
                <Mail className="w-6 h-6 mx-auto mb-1" style={{ color: '#91A6EB' }} />
                <div className="text-2xl font-heading" style={{ color: '#91A6EB' }}>{invitations.length}</div>
                <div className="text-xs" style={{ color: '#000000', opacity: 0.7 }}>Total</div>
              </div>
              <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-4 text-center">
                <Clock className="w-6 h-6 mx-auto mb-1" style={{ color: '#FF6B35' }} />
                <div className="text-2xl font-heading" style={{ color: '#FF6B35' }}>{invitations.filter(i => i.status === 'pending').length}</div>
                <div className="text-xs" style={{ color: '#000000', opacity: 0.7 }}>Pending</div>
              </div>
              <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-4 text-center">
                <CheckCircle className="w-6 h-6 mx-auto mb-1" style={{ color: '#20B2AA' }} />
                <div className="text-2xl font-heading" style={{ color: '#20B2AA' }}>{invitations.filter(i => i.status === 'accepted').length}</div>
                <div className="text-xs" style={{ color: '#000000', opacity: 0.7 }}>Accepted</div>
              </div>
              <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-4 text-center">
                <XCircle className="w-6 h-6 mx-auto mb-1" style={{ color: '#FF6B35' }} />
                <div className="text-2xl font-heading" style={{ color: '#FF6B35' }}>{invitations.filter(i => i.status === 'declined').length}</div>
                <div className="text-xs" style={{ color: '#000000', opacity: 0.7 }}>Declined</div>
              </div>
              <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-4 text-center">
                <AlertTriangle className="w-6 h-6 mx-auto mb-1" style={{ color: '#000000', opacity: 0.5 }} />
                <div className="text-2xl font-heading" style={{ color: '#000000' }}>{invitations.filter(i => i.status === 'expired').length}</div>
                <div className="text-xs" style={{ color: '#000000', opacity: 0.7 }}>Expired</div>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border border-white/50 p-3">
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: '#000000', opacity: 0.5 }} />
                  <input
                    type="text"
                    placeholder="Search by athlete name or email..."
                    value={invitationSearch}
                    onChange={(e) => setInvitationSearch(e.target.value)}
                    className="w-full pl-10 px-4 py-2 border border-gray-300/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>
                <div className="flex gap-2">
                  {['all', 'pending', 'accepted', 'declined', 'expired'].map(status => (
                    <button
                      key={status}
                      onClick={() => setInvitationFilter(status as any)}
                      className={`px-4 py-2 rounded-lg font-semibold transition-colors capitalize ${
                        invitationFilter === status ? 'bg-black text-white' : 'bg-gray-200 hover:bg-gray-300'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Invitations Table */}
            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left p-2 text-xs font-semibold" style={{ color: '#000000' }}>Athlete</th>
                      <th className="text-left p-2 text-xs font-semibold" style={{ color: '#000000' }}>Sport</th>
                      <th className="text-left p-2 text-xs font-semibold" style={{ color: '#000000' }}>Coach</th>
                      <th className="text-left p-2 text-xs font-semibold" style={{ color: '#000000' }}>Status</th>
                      <th className="text-left p-2 text-xs font-semibold" style={{ color: '#000000' }}>Sent</th>
                      <th className="text-left p-2 text-xs font-semibold" style={{ color: '#000000' }}>Expires</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invitationsLoading ? (
                      <tr>
                        <td colSpan={6} className="text-center p-12">
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
                        </td>
                      </tr>
                    ) : filteredInvitations.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center p-12" style={{ color: '#000000', opacity: 0.7 }}>
                          No invitations found
                        </td>
                      </tr>
                    ) : (
                      filteredInvitations.map(invitation => (
                        <tr key={invitation.id} className="border-t border-gray-200 hover:bg-gray-50">
                          <td className="p-2 text-sm">
                            <div className="font-semibold" style={{ color: '#000000' }}>{invitation.athleteName}</div>
                            <div className="text-sm" style={{ color: '#000000', opacity: 0.6 }}>{invitation.athleteEmail}</div>
                          </td>
                          <td className="p-4" style={{ color: '#000000' }}>{invitation.sport}</td>
                          <td className="p-4" style={{ color: '#000000' }}>{invitation.coachName || 'Unknown'}</td>
                          <td className="p-2 text-sm">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${getStatusColor(invitation.status)}`}>
                              {invitation.status}
                            </span>
                          </td>
                          <td className="p-4 text-sm" style={{ color: '#000000', opacity: 0.7 }}>
                            {invitation.createdAt.toLocaleDateString()}
                          </td>
                          <td className="p-4 text-sm" style={{ color: '#000000', opacity: 0.7 }}>
                            {invitation.expiresAt.toLocaleDateString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'admin-invites' && (
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6">
            <AdminInvitationManager />
          </div>
        )}

        {/* Add other tabs similarly - for brevity, reusing embedded mode logic */}
      </main>
    </div>
  )
}
