'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useEnhancedRole } from '@/hooks/use-role-switcher'
import AppHeader from '@/components/ui/AppHeader'
import { db } from '@/lib/firebase.client'
import { collection, query, getDocs, where, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore'
import {
  Shield,
  Users,
  UserPlus,
  Search,
  Edit,
  Trash2,
  Mail,
  CheckCircle,
  XCircle,
  MoreVertical
} from 'lucide-react'

interface AssistantCoach {
  id: string
  displayName?: string
  email?: string
  role: string
  createdAt?: any
  assignedCoachId?: string
  assignedCoachName?: string
  permissions?: string[]
  status?: 'active' | 'inactive'
}

export default function AssistantCoaches() {
  const [assistantCoaches, setAssistantCoaches] = useState<AssistantCoach[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [newInviteEmail, setNewInviteEmail] = useState('')

  const { user } = useAuth()
  const { role } = useEnhancedRole()

  useEffect(() => {
    const loadAssistantCoaches = async () => {
      try {
        setLoading(true)

        // Get all assistant coaches
        const assistantCoachesQuery = query(
          collection(db, 'users'),
          where('role', '==', 'assistant_coach')
        )
        const snapshot = await getDocs(assistantCoachesQuery)

        // Get all coaches for assignment mapping
        const coachesQuery = query(
          collection(db, 'users'),
          where('role', 'in', ['coach', 'creator'])
        )
        const coachesSnapshot = await getDocs(coachesQuery)
        const coachesMap = new Map(
          coachesSnapshot.docs.map((doc) => [doc.id, doc.data().displayName || doc.data().email])
        )

        const assistantCoachesData = snapshot.docs.map((doc) => {
          const data = doc.data()
          return {
            id: doc.id,
            displayName: data.displayName,
            email: data.email,
            role: data.role,
            createdAt: data.createdAt,
            assignedCoachId: data.assignedCoachId,
            assignedCoachName: data.assignedCoachId
              ? coachesMap.get(data.assignedCoachId)
              : undefined,
            permissions: data.permissions || [],
            status: data.status || 'active'
          }
        })

        setAssistantCoaches(assistantCoachesData)
      } catch (error) {
        console.error('Error loading assistant coaches:', error)
      } finally {
        setLoading(false)
      }
    }

    if (user && (role === 'superadmin' || role === 'admin')) {
      loadAssistantCoaches()
    }
  }, [user, role])

  const handleInvite = async () => {
    if (!newInviteEmail) return

    try {
      // Create invitation in Firebase
      await addDoc(collection(db, 'invitations'), {
        email: newInviteEmail,
        role: 'assistant_coach',
        status: 'pending',
        createdAt: new Date(),
        createdBy: user?.uid
      })

      alert('Invitation sent successfully!')
      setNewInviteEmail('')
      setShowInviteModal(false)
    } catch (error) {
      console.error('Error sending invitation:', error)
      alert('Failed to send invitation')
    }
  }

  const handleDelete = async (assistantCoachId: string) => {
    if (!confirm('Are you sure you want to remove this assistant coach?')) return

    try {
      await deleteDoc(doc(db, 'users', assistantCoachId))
      setAssistantCoaches(assistantCoaches.filter((ac) => ac.id !== assistantCoachId))
      alert('Assistant coach removed successfully')
    } catch (error) {
      console.error('Error removing assistant coach:', error)
      alert('Failed to remove assistant coach')
    }
  }

  const filteredAssistantCoaches = assistantCoaches.filter((ac) => {
    const matchesSearch =
      ac.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ac.email?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  const getStatusBadge = (status: string) => {
    if (status === 'active') {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs text-white" style={{ backgroundColor: '#20B2AA' }}>
          <CheckCircle className="w-3 h-3 mr-1" />
          Active
        </span>
      )
    }
    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs text-white" style={{ backgroundColor: '#666' }}>
        <XCircle className="w-3 h-3 mr-1" />
        Inactive
      </span>
    )
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#E8E6D8' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-black mx-auto"></div>
          <p className="mt-4" style={{ color: '#000000', opacity: 0.7 }}>Loading assistant coaches...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#E8E6D8' }}>
      <AppHeader title="Assistant Coaches" subtitle="Manage assistant coach accounts" />
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Header Actions */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 px-6 py-3">
              <div className="flex items-center gap-3">
                <Shield className="w-6 h-6" style={{ color: '#FF6B35' }} />
                <div>
                  <div className="text-2xl font-heading" style={{ color: '#000000' }}>
                    {assistantCoaches.length}
                  </div>
                  <div className="text-sm" style={{ color: '#000000', opacity: 0.7 }}>Total Assistant Coaches</div>
                </div>
              </div>
            </div>
          </div>
          <button
            onClick={() => setShowInviteModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            <UserPlus className="w-5 h-5" />
            Invite Assistant Coach
          </button>
        </div>

        {/* Search Bar */}
        <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search assistant coaches by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
            />
          </div>
        </div>

        {/* Assistant Coaches Table */}
        <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead style={{ backgroundColor: 'rgba(0,0,0,0.03)' }}>
                <tr>
                  <th className="text-left p-4 font-semibold" style={{ color: '#000000' }}>Assistant Coach</th>
                  <th className="text-left p-4 font-semibold" style={{ color: '#000000' }}>Assigned To</th>
                  <th className="text-center p-4 font-semibold" style={{ color: '#000000' }}>Status</th>
                  <th className="text-center p-4 font-semibold" style={{ color: '#000000' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAssistantCoaches.map((ac) => (
                  <tr key={ac.id} className="border-t border-gray-300/30 hover:bg-white/30 transition-colors">
                    <td className="p-4">
                      <div>
                        <div style={{ color: '#000000' }}>{ac.displayName || 'No name'}</div>
                        <div className="text-sm" style={{ color: '#000000', opacity: 0.6 }}>{ac.email}</div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm" style={{ color: '#000000', opacity: 0.7 }}>
                        {ac.assignedCoachName || 'Unassigned'}
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      {getStatusBadge(ac.status || 'active')}
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleDelete(ac.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Remove"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Invite Modal */}
        {showInviteModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full mx-4">
              <h2 className="text-2xl font-heading mb-4" style={{ color: '#000000' }}>
                Invite Assistant Coach
              </h2>
              <p className="mb-6" style={{ color: '#666' }}>
                Send an invitation to a new assistant coach
              </p>
              <div className="mb-6">
                <label className="block text-sm font-semibold mb-2" style={{ color: '#000000' }}>
                  Email Address
                </label>
                <input
                  type="email"
                  value={newInviteEmail}
                  onChange={(e) => setNewInviteEmail(e.target.value)}
                  placeholder="coach@example.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleInvite}
                  className="flex-1 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Send Invitation
                </button>
                <button
                  onClick={() => {
                    setShowInviteModal(false)
                    setNewInviteEmail('')
                  }}
                  className="flex-1 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
