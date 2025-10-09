'use client'

import { useState, useEffect, Suspense } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useSearchParams, useRouter } from 'next/navigation'
import AppHeader from '@/components/ui/AppHeader'
import {
  Bell,
  Plus,
  Send,
  Edit,
  Trash2,
  Users,
  Eye,
  Calendar,
  CheckCircle
,
  AlertCircle
} from 'lucide-react'

interface Announcement {
  id: string
  title: string
  message: string
  audience: 'all' | 'sport' | 'specific'
  sport?: string
  athleteIds?: string[]
  sentAt: string
  views: number
  acknowledged: number
  urgent: boolean
}

function AnnouncementsPageContent() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const embedded = searchParams.get('embedded') === 'true'

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    message: '',
    audience: 'all' as 'all' | 'sport' | 'specific',
    sport: '',
    urgent: false
  })

  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadAnnouncements()
    }
  }, [user])

  const loadAnnouncements = async () => {
    setLoading(true)
    try {
      const token = await user.getIdToken()
      const response = await fetch('/api/coach/announcements', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (!response.ok) throw new Error('Failed to load announcements')

      const data = await response.json()
      setAnnouncements(data.announcements || [])
    } catch (error) {
      console.error('Error loading announcements:', error)
      setAnnouncements([])
    } finally {
      setLoading(false)
    }
  }

  const handleCreateAnnouncement = async () => {
    if (!newAnnouncement.title || !newAnnouncement.message) {
      alert('Please fill in title and message')
      return
    }

    try {
      const token = await user.getIdToken()
      const response = await fetch('/api/coach/announcements', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newAnnouncement)
      })

      if (!response.ok) throw new Error('Failed to create announcement')

      alert('Announcement sent successfully!')
      setShowCreateModal(false)
      setNewAnnouncement({ title: '', message: '', audience: 'all', sport: '', urgent: false })
      loadAnnouncements()
    } catch (error) {
      console.error('Error creating announcement:', error)
      alert('Failed to create announcement')
    }
  }

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"?`)) return

    try {
      const token = await user.getIdToken()
      const response = await fetch('/api/coach/announcements', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ announcementId: id })
      })

      if (!response.ok) throw new Error('Failed to delete announcement')

      alert('Announcement deleted successfully')
      loadAnnouncements()
    } catch (error) {
      console.error('Error deleting announcement:', error)
      alert('Failed to delete announcement')
    }
  }

  // Show loading state while checking auth
  if (authLoading) {
    return (
      <div style={{ backgroundColor: embedded ? 'transparent' : '#E8E6D8' }} className={embedded ? 'p-12' : 'min-h-screen flex items-center justify-center'}>
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-black mb-4"></div>
          <p style={{ color: '#000000', opacity: 0.7 }}>Verifying access...</p>
        </div>
      </div>
    )
  }

  // Show error if not authenticated
  if (!user) {
    return (
      <div style={{ backgroundColor: embedded ? 'transparent' : '#E8E6D8' }} className={embedded ? 'p-12' : 'min-h-screen flex items-center justify-center'}>
        <div className="text-center bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-8 max-w-md">
          <AlertCircle className="w-16 h-16 mx-auto mb-4" style={{ color: '#FF6B35' }} />
          <h2 className="text-2xl font-heading mb-2" style={{ color: '#000000' }}>Access Denied</h2>
          <p className="mb-6" style={{ color: '#000000', opacity: 0.7 }}>
            You must be logged in as a coach to access this page.
          </p>
          {!embedded && (
            <button
              onClick={() => router.push('/')}
              className="px-6 py-3 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition-colors"
            >
              Return to Login
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div style={{ backgroundColor: embedded ? 'transparent' : '#E8E6D8' }} className={embedded ? '' : 'min-h-screen'}>
      {!embedded && (
        <AppHeader title="Announcements" subtitle="Broadcast updates to your athletes" />
      )}

      <main className={`w-full ${embedded ? 'p-4' : 'max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6'} space-y-6`}>
        {/* Header */}
        {embedded && (
          <div className="mb-4">
            <div className="flex items-center gap-3 mb-2">
              <Bell className="w-8 h-8" style={{ color: '#91A6EB' }} />
              <h1 className="text-3xl font-heading" style={{ color: '#000000' }}>Announcements</h1>
            </div>
            <p style={{ color: '#000000', opacity: 0.7 }}>
              Broadcast updates and messages to your athletes
            </p>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border border-white/50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold" style={{ color: '#000000', opacity: 0.7 }}>Total Sent</p>
                <p className="text-3xl font-heading" style={{ color: '#000000' }}>{announcements.length}</p>
              </div>
              <Bell className="w-10 h-10" style={{ color: '#91A6EB', opacity: 0.3 }} />
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border border-white/50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold" style={{ color: '#000000', opacity: 0.7 }}>Total Views</p>
                <p className="text-3xl font-heading" style={{ color: '#000000' }}>
                  {announcements.reduce((sum, a) => sum + a.views, 0)}
                </p>
              </div>
              <Eye className="w-10 h-10" style={{ color: '#20B2AA', opacity: 0.3 }} />
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border border-white/50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold" style={{ color: '#000000', opacity: 0.7 }}>Acknowledged</p>
                <p className="text-3xl font-heading" style={{ color: '#000000' }}>
                  {announcements.reduce((sum, a) => sum + a.acknowledged, 0)}
                </p>
              </div>
              <CheckCircle className="w-10 h-10" style={{ color: '#FF6B35', opacity: 0.3 }} />
            </div>
          </div>
        </div>

        {/* Create Button */}
        <div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition-colors flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Create Announcement
          </button>
        </div>

        {/* Announcements List */}
        {loading ? (
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-black mb-4"></div>
            <p style={{ color: '#000000', opacity: 0.7 }}>Loading announcements...</p>
          </div>
        ) : (
        <div className="space-y-4">
          {announcements.length === 0 ? (
            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-12 text-center">
              <Bell className="w-16 h-16 mx-auto mb-4" style={{ color: '#000000', opacity: 0.3 }} />
              <h3 className="text-xl font-heading mb-2" style={{ color: '#000000' }}>
                No announcements yet
              </h3>
              <p className="mb-6" style={{ color: '#000000', opacity: 0.7 }}>
                Create your first announcement to communicate with your athletes
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-6 py-3 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition-colors inline-flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Create First Announcement
              </button>
            </div>
          ) : (
            announcements.map((announcement) => (
              <div
                key={announcement.id}
                className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {announcement.urgent && (
                        <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-red-100 text-red-700">
                          URGENT
                        </span>
                      )}
                      <h3 className="text-xl font-heading" style={{ color: '#000000' }}>
                        {announcement.title}
                      </h3>
                    </div>

                    <p className="mb-4" style={{ color: '#000000', opacity: 0.7 }}>
                      {announcement.message}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-sm" style={{ color: '#000000', opacity: 0.6 }}>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(announcement.sentAt).toLocaleString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {announcement.audience === 'all' ? 'All Athletes' : announcement.audience}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        {announcement.views} views
                      </span>
                      <span className="flex items-center gap-1">
                        <CheckCircle className="w-4 h-4" />
                        {announcement.acknowledged} acknowledged
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" style={{ color: '#000000' }} />
                    </button>
                    <button
                      onClick={() => handleDelete(announcement.id, announcement.title)}
                      className="p-2 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" style={{ color: '#FF6B35' }} />
                    </button>
                  </div>
                </div>

                {/* Engagement Bar */}
                {announcement.views > 0 && (
                  <div>
                    <div className="flex justify-between text-xs mb-1" style={{ color: '#000000', opacity: 0.6 }}>
                      <span>Acknowledgment Rate</span>
                      <span>{((announcement.acknowledged / announcement.views) * 100).toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full"
                        style={{
                          width: `${(announcement.acknowledged / announcement.views) * 100}%`,
                          backgroundColor: '#20B2AA'
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
        )}

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-heading" style={{ color: '#000000' }}>
                  Create Announcement
                </h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Bell className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: '#000000' }}>
                    Title *
                  </label>
                  <input
                    type="text"
                    value={newAnnouncement.title}
                    onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                    placeholder="e.g., Practice Schedule Change"
                    className="w-full px-4 py-2 border border-gray-300/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: '#000000' }}>
                    Message *
                  </label>
                  <textarea
                    value={newAnnouncement.message}
                    onChange={(e) => setNewAnnouncement({ ...newAnnouncement, message: e.target.value })}
                    placeholder="Write your announcement message..."
                    rows={6}
                    className="w-full px-4 py-2 border border-gray-300/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-black resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: '#000000' }}>
                    Audience
                  </label>
                  <select
                    value={newAnnouncement.audience}
                    onChange={(e) => setNewAnnouncement({ ...newAnnouncement, audience: e.target.value as any })}
                    className="w-full px-4 py-2 border border-gray-300/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                  >
                    <option value="all">All Athletes</option>
                    <option value="sport">Specific Sport</option>
                    <option value="specific">Specific Athletes</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="urgent"
                    checked={newAnnouncement.urgent}
                    onChange={(e) => setNewAnnouncement({ ...newAnnouncement, urgent: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <label htmlFor="urgent" className="text-sm font-semibold" style={{ color: '#000000' }}>
                    Mark as urgent
                  </label>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleCreateAnnouncement}
                  className="flex-1 px-6 py-3 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                >
                  <Send className="w-5 h-5" />
                  Send Announcement
                </button>
                <button
                  onClick={() => setShowCreateModal(false)}
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


export default function AnnouncementsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen" style={{ backgroundColor: '#E8E6D8' }}>
        <div className="flex items-center justify-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
        </div>
      </div>
    }>
      <AnnouncementsPageContent />
    </Suspense>
  )
}
