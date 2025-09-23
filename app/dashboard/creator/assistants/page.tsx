'use client'

import { useAuth } from '@/hooks/use-auth'
import { useUrlEnhancedRole } from '@/hooks/use-url-role-switcher'
import { useEffect, useState } from 'react'
import {
  getCoachAssistants,
  inviteAssistantCoach,
  removeAssistantCoach,
  AssistantCoachAssignment
} from '@/lib/assistant-coach-service'
import {
  UserCheck,
  Plus,
  Mail,
  Calendar,
  MoreVertical,
  Shield,
  Trash2,
  Eye,
  Settings,
  AlertCircle
} from 'lucide-react'
import { toast } from 'react-hot-toast'

export default function AssistantCoachManagement() {
  const { user } = useAuth()
  const { role } = useUrlEnhancedRole()
  const [assistants, setAssistants] = useState<AssistantCoachAssignment[]>([])
  const [loading, setLoading] = useState(true)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteMessage, setInviteMessage] = useState('')
  const [inviteLoading, setInviteLoading] = useState(false)

  useEffect(() => {
    if (user?.uid) {
      loadAssistants()
    }
  }, [user])

  const loadAssistants = async () => {
    try {
      setLoading(true)
      const coachAssistants = await getCoachAssistants(user!.uid)
      setAssistants(coachAssistants)
    } catch (error) {
      console.error('Error loading assistants:', error)
      toast.error('Failed to load assistant coaches')
    } finally {
      setLoading(false)
    }
  }

  const handleInviteAssistant = async () => {
    if (!inviteEmail.trim()) {
      toast.error('Please enter an email address')
      return
    }

    try {
      setInviteLoading(true)
      await inviteAssistantCoach(
        user!.uid,
        user!.displayName || 'Coach',
        user!.email!,
        inviteEmail.trim(),
        inviteMessage.trim() || undefined
      )

      toast.success('Invitation sent successfully!')
      setShowInviteModal(false)
      setInviteEmail('')
      setInviteMessage('')
    } catch (error: any) {
      console.error('Error inviting assistant:', error)
      toast.error(error.message || 'Failed to send invitation')
    } finally {
      setInviteLoading(false)
    }
  }

  const handleRemoveAssistant = async (assignmentId: string, assistantCoachId: string, assistantName: string) => {
    if (!confirm(`Are you sure you want to remove ${assistantName} as your assistant coach?`)) {
      return
    }

    try {
      await removeAssistantCoach(assignmentId, assistantCoachId)
      toast.success('Assistant coach removed successfully')
      loadAssistants() // Reload the list
    } catch (error: any) {
      console.error('Error removing assistant:', error)
      toast.error(error.message || 'Failed to remove assistant coach')
    }
  }

  if (role !== 'creator' && role !== 'superadmin') {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Access denied. This page is only accessible to coaches.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Assistant Coaches</h1>
          <p className="text-gray-600">Manage your assistant coaches and delegate responsibilities</p>
        </div>
        <button
          onClick={() => setShowInviteModal(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Invite Assistant
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
              <UserCheck className="w-6 h-6 text-indigo-600" />
            </div>
            <span className="text-indigo-600 text-2xl font-bold">{assistants.length}</span>
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">Active Assistants</h3>
          <p className="text-sm text-gray-600">Currently helping with your coaching</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-green-600 text-2xl font-bold">
              {assistants.filter(a => a.permissions.canRespondToRequests).length}
            </span>
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">Can Respond</h3>
          <p className="text-sm text-gray-600">Assistants with response permissions</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-orange-600" />
            </div>
            <span className="text-orange-600 text-2xl font-bold">
              {assistants.filter(a => a.permissions.canManageSchedule).length}
            </span>
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">Schedule Managers</h3>
          <p className="text-sm text-gray-600">Assistants managing your schedule</p>
        </div>
      </div>

      {/* Assistant Coaches List */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Your Assistant Coaches</h2>
        </div>

        {loading ? (
          <div className="p-6">
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : assistants.length === 0 ? (
          <div className="p-12 text-center">
            <UserCheck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Assistant Coaches Yet</h3>
            <p className="text-gray-600 mb-6">
              Invite assistant coaches to help you manage your coaching activities and engage with athletes.
            </p>
            <button
              onClick={() => setShowInviteModal(true)}
              className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Invite Your First Assistant
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {assistants.map((assistant) => (
              <div key={assistant.id} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                      <span className="text-indigo-600 font-semibold">
                        {assistant.assistantCoachName.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{assistant.assistantCoachName}</h3>
                      <p className="text-gray-600">{assistant.assistantCoachEmail}</p>
                      <p className="text-sm text-gray-500">
                        Assigned {new Date(assistant.assignedAt.toDate()).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Permission Badges */}
                    <div className="flex gap-2">
                      {assistant.permissions.canRespondToRequests && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <Mail className="w-3 h-3 mr-1" />
                          Can Respond
                        </span>
                      )}
                      {assistant.permissions.canManageSchedule && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                          <Calendar className="w-3 h-3 mr-1" />
                          Schedule
                        </span>
                      )}
                      {assistant.permissions.canManageAthletes && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          <UserCheck className="w-3 h-3 mr-1" />
                          Athletes
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {/* TODO: Open permissions modal */}}
                        className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                        title="Manage Permissions"
                      >
                        <Settings className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleRemoveAssistant(assistant.id, assistant.assistantCoachId, assistant.assistantCoachName)}
                        className="p-2 text-red-400 hover:text-red-600 transition-colors"
                        title="Remove Assistant"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full mx-4">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Invite Assistant Coach</h3>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="assistant@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Personal Message (Optional)
                </label>
                <textarea
                  value={inviteMessage}
                  onChange={(e) => setInviteMessage(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  rows={3}
                  placeholder="Add a personal message to your invitation..."
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">What assistant coaches can do:</p>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      <li>View and respond to coaching requests</li>
                      <li>Manage your schedule and bookings</li>
                      <li>Organize and categorize content</li>
                      <li>Monitor athlete progress</li>
                      <li>Access read-only analytics</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowInviteModal(false)}
                className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
                disabled={inviteLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleInviteAssistant}
                disabled={inviteLoading || !inviteEmail.trim()}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {inviteLoading ? 'Sending...' : 'Send Invitation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}