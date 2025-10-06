'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useEnhancedRole } from '@/hooks/use-role-switcher'
import { useRouter } from 'next/navigation'
import {
  MessageSquare,
  AlertTriangle,
  Eye,
  Search,
  Filter,
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  Flag,
  Users
} from 'lucide-react'
import AppHeader from '@/components/ui/AppHeader'

interface ModerationAlert {
  id: string
  messageId: string
  conversationId: string
  senderId: string
  senderName: string
  senderRole: string
  recipientId: string
  recipientName: string
  recipientRole: string
  content: string
  flaggedReasons: string[]
  severity: 'low' | 'medium' | 'high' | 'critical'
  status: 'pending_review' | 'reviewed' | 'action_taken' | 'dismissed'
  createdAt: any
}

interface MessageAudit {
  messageId: string
  conversationId: string
  senderId: string
  senderName: string
  recipientId: string
  recipientName: string
  content: string
  timestamp: any
  flagged: boolean
  flaggedReasons: string[]
  read: boolean
}

export default function MessageMonitoringPage() {
  const { user } = useAuth()
  const { role, loading: roleLoading } = useEnhancedRole()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'alerts' | 'all_messages' | 'reports'>('alerts')
  const [moderationAlerts, setModerationAlerts] = useState<ModerationAlert[]>([])
  const [allMessages, setAllMessages] = useState<MessageAudit[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [severityFilter, setSeverityFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('pending_review')

  // Redirect non-admins
  useEffect(() => {
    if (!roleLoading && role !== 'admin' && role !== 'superadmin') {
      router.replace('/dashboard')
    }
  }, [role, roleLoading, router])

  useEffect(() => {
    loadModerationData()
  }, [statusFilter])

  const loadModerationData = async () => {
    setLoading(true)
    try {
      // Load moderation alerts
      const alertsResponse = await fetch(`/api/admin/moderation-alerts?status=${statusFilter}`)
      if (alertsResponse.ok) {
        const alertsData = await alertsResponse.json()
        setModerationAlerts(alertsData.alerts || [])
      }

      // Load flagged messages
      const messagesResponse = await fetch('/api/admin/flagged-messages')
      if (messagesResponse.ok) {
        const messagesData = await messagesResponse.json()
        setAllMessages(messagesData.messages || [])
      }
    } catch (error) {
      console.error('Error loading moderation data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-600 text-white'
      case 'high': return 'bg-orange-600 text-white'
      case 'medium': return 'bg-yellow-600 text-white'
      case 'low': return 'bg-blue-600 text-white'
      default: return 'bg-gray-600 text-white'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending_review': return 'bg-yellow-100 text-yellow-800'
      case 'reviewed': return 'bg-blue-100 text-blue-800'
      case 'action_taken': return 'bg-green-100 text-green-800'
      case 'dismissed': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredAlerts = moderationAlerts.filter(alert => {
    const matchesSeverity = severityFilter === 'all' || alert.severity === severityFilter
    const matchesSearch = searchTerm === '' ||
      alert.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.senderName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.recipientName.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSeverity && matchesSearch
  })

  const stats = {
    totalAlerts: moderationAlerts.length,
    pending: moderationAlerts.filter(a => a.status === 'pending_review').length,
    critical: moderationAlerts.filter(a => a.severity === 'critical').length,
    totalMessages: allMessages.length,
    flaggedMessages: allMessages.filter(m => m.flagged).length
  }

  if (roleLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading moderation dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen" style={{ backgroundColor: '#E8E6D8' }}>
      <AppHeader />
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Shield className="w-10 h-10 text-red-600" />
            <h1 className="text-4xl font-heading uppercase tracking-wide" style={{ color: '#000000' }}>
              Message Monitoring & Safety
            </h1>
          </div>
          <p className="text-lg" style={{ color: '#000000' }}>
            Monitor athlete-coach communications for safety and compliance
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Alerts</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalAlerts}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-orange-600" />
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Review</p>
                <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Critical</p>
                <p className="text-3xl font-bold text-red-600">{stats.critical}</p>
              </div>
              <Flag className="w-8 h-8 text-red-600" />
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Messages</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalMessages}</p>
              </div>
              <MessageSquare className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Flagged</p>
                <p className="text-3xl font-bold text-orange-600">{stats.flaggedMessages}</p>
              </div>
              <Eye className="w-8 h-8 text-orange-600" />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-8 bg-white/80 rounded-xl p-1 shadow-lg border border-white/50">
          <button
            onClick={() => setActiveTab('alerts')}
            className={`flex-1 px-6 py-3 rounded-lg transition-colors ${
              activeTab === 'alerts'
                ? 'bg-black text-white shadow-lg'
                : 'hover:opacity-80 text-black'
            }`}
          >
            <AlertTriangle className="w-5 h-5 inline mr-2" />
            Moderation Alerts
          </button>
          <button
            onClick={() => setActiveTab('all_messages')}
            className={`flex-1 px-6 py-3 rounded-lg transition-colors ${
              activeTab === 'all_messages'
                ? 'bg-black text-white shadow-lg'
                : 'hover:opacity-80 text-black'
            }`}
          >
            <MessageSquare className="w-5 h-5 inline mr-2" />
            All Messages
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by content, sender, or recipient..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="pending_review">Pending Review</option>
              <option value="reviewed">Reviewed</option>
              <option value="action_taken">Action Taken</option>
              <option value="dismissed">Dismissed</option>
            </select>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>

        {/* Content */}
        {activeTab === 'alerts' && (
          <div className="space-y-4">
            {filteredAlerts.length === 0 ? (
              <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-12 text-center">
                <Shield className="w-16 h-16 text-green-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">No alerts found</h3>
                <p className="text-gray-600">All clear! No moderation alerts match your filters.</p>
              </div>
            ) : (
              filteredAlerts.map((alert) => (
                <div key={alert.id} className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-full ${getSeverityColor(alert.severity)}`}>
                        <AlertTriangle className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getSeverityColor(alert.severity)}`}>
                            {alert.severity.toUpperCase()}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(alert.status)}`}>
                            {alert.status.replace('_', ' ').toUpperCase()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">
                          <strong className="text-gray-900">{alert.senderName}</strong> ({alert.senderRole}) →
                          <strong className="text-gray-900"> {alert.recipientName}</strong> ({alert.recipientRole})
                        </p>
                        <p className="text-xs text-gray-500">
                          {alert.createdAt?.toDate?.()?.toLocaleString() || 'Recent'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                    <p className="text-sm text-gray-900">{alert.content}</p>
                  </div>

                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-sm font-medium text-gray-700">Flagged for:</span>
                    {alert.flaggedReasons.map((reason, idx) => (
                      <span key={idx} className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs">
                        {reason.replace('_', ' ')}
                      </span>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm">
                      Take Action
                    </button>
                    <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm">
                      Mark Safe
                    </button>
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
                      View Conversation
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'all_messages' && (
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6">
            <p className="text-gray-600">Message history audit view coming soon...</p>
          </div>
        )}
      </div>
    </main>
  )
}
