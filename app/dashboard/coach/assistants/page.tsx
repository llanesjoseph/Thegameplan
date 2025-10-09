'use client'

import { useState, Suspense } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useSearchParams } from 'next/navigation'
import AppHeader from '@/components/ui/AppHeader'
import {
  UserCog,
  Plus,
  Mail,
  Shield,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  Send
} from 'lucide-react'

interface Assistant {
  id: string
  name: string
  email: string
  status: 'active' | 'pending' | 'inactive'
  role: 'assistant' | 'viewer'
  permissions: string[]
  invitedAt: string
  acceptedAt?: string
}

function AssistantCoachesPageContent() {
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const embedded = searchParams.get('embedded') === 'true'

  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteForm, setInviteForm] = useState({
    name: '',
    email: '',
    role: 'assistant' as 'assistant' | 'viewer',
    permissions: [] as string[]
  })

  const [assistants, setAssistants] = useState<Assistant[]>([
    {
      id: '1',
      name: 'Mike Johnson',
      email: 'mike.johnson@example.com',
      status: 'active',
      role: 'assistant',
      permissions: ['view_lessons', 'edit_lessons', 'view_athletes', 'send_announcements'],
      invitedAt: '2025-09-15',
      acceptedAt: '2025-09-15'
    },
    {
      id: '2',
      name: 'Sarah Chen',
      email: 'sarah.chen@example.com',
      status: 'pending',
      role: 'viewer',
      permissions: ['view_lessons', 'view_athletes'],
      invitedAt: '2025-10-01'
    }
  ])

  const availablePermissions = [
    { id: 'view_lessons', label: 'View Lessons', description: 'Can view all lessons' },
    { id: 'edit_lessons', label: 'Edit Lessons', description: 'Can create and edit lessons' },
    { id: 'view_athletes', label: 'View Athletes', description: 'Can view athlete roster' },
    { id: 'invite_athletes', label: 'Invite Athletes', description: 'Can send athlete invitations' },
    { id: 'send_announcements', label: 'Send Announcements', description: 'Can broadcast announcements' },
    { id: 'view_analytics', label: 'View Analytics', description: 'Can access analytics dashboard' }
  ]

  const rolePermissions = {
    assistant: ['view_lessons', 'edit_lessons', 'view_athletes', 'invite_athletes', 'send_announcements', 'view_analytics'],
    viewer: ['view_lessons', 'view_athletes', 'view_analytics']
  }

  const handleInvite = async () => {
    if (!inviteForm.name || !inviteForm.email) {
      alert('Please fill in name and email')
      return
    }

    const newAssistant: Assistant = {
      id: Date.now().toString(),
      name: inviteForm.name,
      email: inviteForm.email,
      status: 'pending',
      role: inviteForm.role,
      permissions: inviteForm.permissions.length > 0 ? inviteForm.permissions : rolePermissions[inviteForm.role],
      invitedAt: new Date().toISOString()
    }

    setAssistants([...assistants, newAssistant])
    setShowInviteModal(false)
    setInviteForm({
      name: '',
      email: '',
      role: 'assistant',
      permissions: []
    })

    alert('Invitation sent successfully!')
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            Active
          </span>
        )
      case 'pending':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1" style={{ backgroundColor: 'rgba(255, 107, 53, 0.1)', color: '#FF6B35' }}>
            <Clock className="w-3 h-3" />
            Pending
          </span>
        )
      case 'inactive':
        return (
          <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-semibold">
            Inactive
          </span>
        )
    }
  }

  const getRoleBadge = (role: string) => {
    const colors = {
      assistant: { bg: 'rgba(32, 178, 170, 0.1)', text: '#20B2AA' },
      viewer: { bg: 'rgba(145, 166, 235, 0.1)', text: '#91A6EB' }
    }
    const color = colors[role as keyof typeof colors] || colors.viewer

    return (
      <span className="px-2 py-0.5 rounded text-xs font-semibold capitalize" style={{ backgroundColor: color.bg, color: color.text }}>
        {role}
      </span>
    )
  }

  return (
    <div style={{ backgroundColor: embedded ? 'transparent' : '#E8E6D8' }} className={embedded ? '' : 'min-h-screen'}>
      {!embedded && (
        <AppHeader title="Assistant Coaches" subtitle="Manage coaching staff and permissions" />
      )}

      <main className={`w-full ${embedded ? 'p-4' : 'max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6'} space-y-6`}>
        {/* Header */}
        {embedded && (
          <div className="mb-4">
            <div className="flex items-center gap-3 mb-2">
              <UserCog className="w-8 h-8" style={{ color: '#20B2AA' }} />
              <h1 className="text-3xl font-heading" style={{ color: '#000000' }}>Assistant Coaches</h1>
            </div>
            <p style={{ color: '#000000', opacity: 0.7 }}>
              Manage coaching staff and delegate responsibilities
            </p>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border border-white/50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold" style={{ color: '#000000', opacity: 0.7 }}>Total Assistants</p>
                <p className="text-3xl font-heading" style={{ color: '#000000' }}>{assistants.length}</p>
              </div>
              <UserCog className="w-10 h-10" style={{ color: '#20B2AA', opacity: 0.3 }} />
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border border-white/50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold" style={{ color: '#000000', opacity: 0.7 }}>Active</p>
                <p className="text-3xl font-heading" style={{ color: '#000000' }}>
                  {assistants.filter(a => a.status === 'active').length}
                </p>
              </div>
              <CheckCircle className="w-10 h-10" style={{ color: '#91A6EB', opacity: 0.3 }} />
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border border-white/50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold" style={{ color: '#000000', opacity: 0.7 }}>Pending</p>
                <p className="text-3xl font-heading" style={{ color: '#000000' }}>
                  {assistants.filter(a => a.status === 'pending').length}
                </p>
              </div>
              <Clock className="w-10 h-10" style={{ color: '#FF6B35', opacity: 0.3 }} />
            </div>
          </div>
        </div>

        {/* Invite Button */}
        <div>
          <button
            onClick={() => setShowInviteModal(true)}
            className="px-6 py-3 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition-colors flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Invite Assistant Coach
          </button>
        </div>

        {/* Assistants List */}
        <div className="space-y-4">
          {assistants.length === 0 ? (
            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-12 text-center">
              <UserCog className="w-16 h-16 mx-auto mb-4" style={{ color: '#000000', opacity: 0.3 }} />
              <h3 className="text-xl font-heading mb-2" style={{ color: '#000000' }}>
                No assistant coaches yet
              </h3>
              <p className="mb-6" style={{ color: '#000000', opacity: 0.7 }}>
                Invite assistant coaches to help manage your team
              </p>
              <button
                onClick={() => setShowInviteModal(true)}
                className="px-6 py-3 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition-colors inline-flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Invite First Assistant
              </button>
            </div>
          ) : (
            assistants.map((assistant) => (
              <div
                key={assistant.id}
                className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center font-semibold text-white" style={{ background: 'linear-gradient(135deg, #20B2AA 0%, #000000 100%)' }}>
                      {assistant.name.split(' ').map(n => n[0]).join('')}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-heading" style={{ color: '#000000' }}>
                          {assistant.name}
                        </h3>
                        {getStatusBadge(assistant.status)}
                        {getRoleBadge(assistant.role)}
                      </div>

                      <p className="text-sm mb-3" style={{ color: '#000000', opacity: 0.6 }}>
                        {assistant.email}
                      </p>

                      <div className="mb-3">
                        <p className="text-xs font-semibold mb-2" style={{ color: '#000000', opacity: 0.7 }}>
                          Permissions:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {assistant.permissions.map((permission) => (
                            <span
                              key={permission}
                              className="px-2 py-1 rounded text-xs"
                              style={{ backgroundColor: 'rgba(32, 178, 170, 0.1)', color: '#20B2AA' }}
                            >
                              {availablePermissions.find(p => p.id === permission)?.label || permission}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-xs" style={{ color: '#000000', opacity: 0.5 }}>
                        <span>Invited: {new Date(assistant.invitedAt).toLocaleDateString()}</span>
                        {assistant.acceptedAt && (
                          <span>Accepted: {new Date(assistant.acceptedAt).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {assistant.status === 'pending' && (
                      <button
                        className="p-2 rounded-lg hover:opacity-80 transition-opacity"
                        style={{ backgroundColor: 'rgba(145, 166, 235, 0.1)', color: '#91A6EB' }}
                        title="Resend invitation"
                      >
                        <Mail className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                      title="Edit permissions"
                    >
                      <Edit className="w-4 h-4" style={{ color: '#000000' }} />
                    </button>
                    <button
                      className="p-2 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                      title="Remove assistant"
                    >
                      <Trash2 className="w-4 h-4" style={{ color: '#FF6B35' }} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Invite Modal */}
        {showInviteModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-heading" style={{ color: '#000000' }}>
                  Invite Assistant Coach
                </h2>
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <UserCog className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: '#000000' }}>
                    Name *
                  </label>
                  <input
                    type="text"
                    value={inviteForm.name}
                    onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })}
                    placeholder="Assistant coach name"
                    className="w-full px-4 py-2 border border-gray-300/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: '#000000' }}>
                    Email *
                  </label>
                  <input
                    type="email"
                    value={inviteForm.email}
                    onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                    placeholder="assistant@example.com"
                    className="w-full px-4 py-2 border border-gray-300/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: '#000000' }}>
                    Role
                  </label>
                  <select
                    value={inviteForm.role}
                    onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value as any, permissions: rolePermissions[e.target.value as keyof typeof rolePermissions] })}
                    className="w-full px-4 py-2 border border-gray-300/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                  >
                    <option value="assistant">Assistant Coach (Full Access)</option>
                    <option value="viewer">Viewer (Read Only)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-3" style={{ color: '#000000' }}>
                    Permissions
                  </label>
                  <div className="space-y-2 max-h-48 overflow-y-auto p-4 border border-gray-200 rounded-lg">
                    {availablePermissions.map((permission) => (
                      <div key={permission.id} className="flex items-start gap-2">
                        <input
                          type="checkbox"
                          id={permission.id}
                          checked={inviteForm.permissions.length === 0
                            ? rolePermissions[inviteForm.role].includes(permission.id)
                            : inviteForm.permissions.includes(permission.id)
                          }
                          onChange={(e) => {
                            const perms = inviteForm.permissions.length === 0 ? rolePermissions[inviteForm.role] : inviteForm.permissions
                            setInviteForm({
                              ...inviteForm,
                              permissions: e.target.checked
                                ? [...perms, permission.id]
                                : perms.filter(p => p !== permission.id)
                            })
                          }}
                          className="mt-1"
                        />
                        <label htmlFor={permission.id} className="flex-1">
                          <p className="text-sm font-semibold" style={{ color: '#000000' }}>
                            {permission.label}
                          </p>
                          <p className="text-xs" style={{ color: '#000000', opacity: 0.6 }}>
                            {permission.description}
                          </p>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleInvite}
                  className="flex-1 px-6 py-3 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                >
                  <Send className="w-5 h-5" />
                  Send Invitation
                </button>
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="px-6 py-3 bg-white border-2 border-gray-300 text-black rounded-lg font-semibold hover:bg-gray-50 transition-colors"
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

export default function AssistantCoachesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen" style={{ backgroundColor: '#E8E6D8' }}>
        <div className="flex items-center justify-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
        </div>
      </div>
    }>
      <AssistantCoachesPageContent />
    </Suspense>
  )
}
