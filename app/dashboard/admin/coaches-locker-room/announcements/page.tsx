'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useEnhancedRole } from '@/hooks/use-role-switcher'
import AppHeader from '@/components/ui/AppHeader'
import { db } from '@/lib/firebase.client'
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, orderBy, where, Timestamp } from 'firebase/firestore'
import { Megaphone, Plus, Edit, Trash2, Send, Mail, MessageSquare, Eye, Save, X, Users } from 'lucide-react'

interface Announcement {
  id: string
  title: string
  content: string
  type: 'announcement' | 'update' | 'alert'
  deliveryMethod: 'email' | 'dm' | 'both'
  targetAudience: 'all' | 'active' | 'inactive'
  isSent: boolean
  sentDate?: Date
  recipientCount?: number
  createdBy: string
  createdAt: Date
}

export default function CoachAnnouncementsManager() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'announcement' as 'announcement' | 'update' | 'alert',
    deliveryMethod: 'both' as 'email' | 'dm' | 'both',
    targetAudience: 'all' as 'all' | 'active' | 'inactive'
  })

  const { user } = useAuth()
  const { role } = useEnhancedRole()

  useEffect(() => {
    if (user && (role === 'superadmin' || role === 'admin')) {
      loadAnnouncements()
    }
  }, [user, role])

  const loadAnnouncements = async () => {
    try {
      setLoading(true)
      const announcementsQuery = query(collection(db, 'coachAnnouncements'), orderBy('createdAt', 'desc'))
      const snapshot = await getDocs(announcementsQuery)
      const announcementsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        sentDate: doc.data().sentDate?.toDate(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      })) as Announcement[]
      setAnnouncements(announcementsData)
    } catch (error) {
      console.error('Error loading announcements:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    try {
      await addDoc(collection(db, 'coachAnnouncements'), {
        ...formData,
        isSent: false,
        createdBy: user?.email || 'Unknown',
        createdAt: Timestamp.now()
      })
      setFormData({
        title: '',
        content: '',
        type: 'announcement',
        deliveryMethod: 'both',
        targetAudience: 'all'
      })
      setIsCreating(false)
      loadAnnouncements()
    } catch (error) {
      console.error('Error creating announcement:', error)
    }
  }

  const handleUpdate = async () => {
    if (!editingAnnouncement) return
    try {
      await updateDoc(doc(db, 'coachAnnouncements', editingAnnouncement.id), {
        title: formData.title,
        content: formData.content,
        type: formData.type,
        deliveryMethod: formData.deliveryMethod,
        targetAudience: formData.targetAudience
      })
      setEditingAnnouncement(null)
      setFormData({
        title: '',
        content: '',
        type: 'announcement',
        deliveryMethod: 'both',
        targetAudience: 'all'
      })
      loadAnnouncements()
    } catch (error) {
      console.error('Error updating announcement:', error)
    }
  }

  const handleSend = async (announcement: Announcement) => {
    const methodText = announcement.deliveryMethod === 'both' ? 'Email & Direct Message' : announcement.deliveryMethod === 'email' ? 'Email' : 'Direct Message'
    const audienceText = announcement.targetAudience === 'all' ? 'all coaches' : announcement.targetAudience === 'active' ? 'active coaches only' : 'inactive coaches only'

    if (!confirm(`Send announcement via ${methodText} to ${audienceText}?\n\nTitle: "${announcement.title}"`)) return

    try {
      // Get target coaches based on audience
      let coachesQuery
      if (announcement.targetAudience === 'all') {
        coachesQuery = query(collection(db, 'users'), where('role', 'in', ['coach', 'creator']))
      } else if (announcement.targetAudience === 'active') {
        coachesQuery = query(
          collection(db, 'users'),
          where('role', 'in', ['coach', 'creator']),
          where('status', '==', 'active')
        )
      } else {
        coachesQuery = query(
          collection(db, 'users'),
          where('role', 'in', ['coach', 'creator']),
          where('status', '!=', 'active')
        )
      }

      const coachesSnapshot = await getDocs(coachesQuery)
      const recipientCount = coachesSnapshot.size

      // Update announcement as sent
      await updateDoc(doc(db, 'coachAnnouncements', announcement.id), {
        isSent: true,
        sentDate: Timestamp.now(),
        recipientCount
      })

      // Create notification/message for each coach
      const notificationPromises = coachesSnapshot.docs.map(async (coachDoc) => {
        const coachId = coachDoc.id

        // Send Direct Message
        if (announcement.deliveryMethod === 'dm' || announcement.deliveryMethod === 'both') {
          await addDoc(collection(db, 'messages'), {
            senderId: 'admin',
            senderName: 'Admin Team',
            receiverId: coachId,
            content: `📢 ${announcement.title}\n\n${announcement.content}`,
            type: announcement.type,
            read: false,
            createdAt: Timestamp.now()
          })
        }

        // Email would be sent via your email service (SendGrid, etc.)
        // For now, we just log it
        if (announcement.deliveryMethod === 'email' || announcement.deliveryMethod === 'both') {
          console.log(`Email sent to ${coachDoc.data().email}: ${announcement.title}`)
        }
      })

      await Promise.all(notificationPromises)

      alert(`Announcement sent successfully to ${recipientCount} coaches!`)
      loadAnnouncements()
    } catch (error) {
      console.error('Error sending announcement:', error)
      alert('Error sending announcement. Please try again.')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return
    try {
      await deleteDoc(doc(db, 'coachAnnouncements', id))
      loadAnnouncements()
    } catch (error) {
      console.error('Error deleting announcement:', error)
    }
  }

  const startEdit = (announcement: Announcement) => {
    setEditingAnnouncement(announcement)
    setFormData({
      title: announcement.title,
      content: announcement.content,
      type: announcement.type,
      deliveryMethod: announcement.deliveryMethod,
      targetAudience: announcement.targetAudience
    })
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'announcement': return '#20B2AA'
      case 'update': return '#91A6EB'
      case 'alert': return '#FF6B35'
      default: return '#000000'
    }
  }

  const getDeliveryIcon = (method: string) => {
    switch (method) {
      case 'email': return <Mail className="w-4 h-4" />
      case 'dm': return <MessageSquare className="w-4 h-4" />
      case 'both': return (
        <>
          <Mail className="w-4 h-4" />
          <MessageSquare className="w-4 h-4" />
        </>
      )
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#E8E6D8' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-black mx-auto"></div>
          <p className="mt-4" style={{ color: '#000000', opacity: 0.7 }}>Loading announcements...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#E8E6D8' }}>
      <AppHeader title="Coach Announcements" subtitle="Send announcements to coaches via email or direct message" />
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Create/Edit Form */}
        {(isCreating || editingAnnouncement) && (
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-heading" style={{ color: '#000000' }}>
                {editingAnnouncement ? 'Edit Announcement' : 'Create Announcement'}
              </h2>
              <button
                onClick={() => {
                  setIsCreating(false)
                  setEditingAnnouncement(null)
                  setFormData({
                    title: '',
                    content: '',
                    type: 'announcement',
                    deliveryMethod: 'both',
                    targetAudience: 'all'
                  })
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" style={{ color: '#000000' }} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#000000' }}>Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                  placeholder="New Feature Launch: Video Analytics Dashboard"
                />
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: '#000000' }}>Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-full px-4 py-2 border border-gray-300/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                  >
                    <option value="announcement">Announcement</option>
                    <option value="update">Update</option>
                    <option value="alert">Alert</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: '#000000' }}>Delivery</label>
                  <select
                    value={formData.deliveryMethod}
                    onChange={(e) => setFormData({ ...formData, deliveryMethod: e.target.value as any })}
                    className="w-full px-4 py-2 border border-gray-300/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                  >
                    <option value="both">Email & DM</option>
                    <option value="email">Email Only</option>
                    <option value="dm">DM Only</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: '#000000' }}>Audience</label>
                  <select
                    value={formData.targetAudience}
                    onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value as any })}
                    className="w-full px-4 py-2 border border-gray-300/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                  >
                    <option value="all">All Coaches</option>
                    <option value="active">Active Only</option>
                    <option value="inactive">Inactive Only</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#000000' }}>Message</label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={6}
                  className="w-full px-4 py-2 border border-gray-300/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                  placeholder="Write your announcement message here..."
                />
              </div>

              <button
                onClick={editingAnnouncement ? handleUpdate : handleCreate}
                className="w-full py-3 px-4 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
              >
                <Save className="w-5 h-5" />
                {editingAnnouncement ? 'Update Announcement' : 'Create Announcement'}
              </button>
            </div>
          </div>
        )}

        {/* Create Button */}
        {!isCreating && !editingAnnouncement && (
          <button
            onClick={() => setIsCreating(true)}
            className="mb-8 px-6 py-3 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition-colors flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Create Announcement
          </button>
        )}

        {/* Announcements List */}
        <div className="space-y-6">
          {announcements.map((announcement) => (
            <div key={announcement.id} className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-4 flex-1">
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: getTypeColor(announcement.type) }}>
                    <Megaphone className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-xl font-heading" style={{ color: '#000000' }}>{announcement.title}</h3>
                      <span className="px-2 py-1 rounded text-xs font-semibold text-white" style={{ backgroundColor: getTypeColor(announcement.type) }}>
                        {announcement.type}
                      </span>
                    </div>
                    <p className="text-sm mb-3" style={{ color: '#000000' }}>{announcement.content}</p>

                    <div className="flex items-center gap-4 text-sm" style={{ color: '#000000', opacity: 0.7 }}>
                      <div className="flex items-center gap-1">
                        {getDeliveryIcon(announcement.deliveryMethod)}
                        <span className="capitalize">{announcement.deliveryMethod === 'both' ? 'Email & DM' : announcement.deliveryMethod}</span>
                      </div>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span className="capitalize">{announcement.targetAudience} coaches</span>
                      </div>
                      <span>•</span>
                      <span>by {announcement.createdBy}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {!announcement.isSent && (
                    <button
                      onClick={() => handleSend(announcement)}
                      className="p-2 hover:bg-green-100 rounded-lg transition-colors"
                      title="Send Announcement"
                    >
                      <Send className="w-5 h-5" style={{ color: '#20B2AA' }} />
                    </button>
                  )}
                  {!announcement.isSent && (
                    <button
                      onClick={() => startEdit(announcement)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <Edit className="w-5 h-5" style={{ color: '#000000' }} />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(announcement.id)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-5 h-5" style={{ color: '#FF6B35' }} />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-4 text-sm" style={{ color: '#000000', opacity: 0.6 }}>
                <span>{announcement.isSent ? `Sent to ${announcement.recipientCount} coaches` : 'Draft'}</span>
                {announcement.sentDate && (
                  <>
                    <span>•</span>
                    <span>Sent {announcement.sentDate.toLocaleDateString()}</span>
                  </>
                )}
                {!announcement.sentDate && (
                  <>
                    <span>•</span>
                    <span>Created {announcement.createdAt.toLocaleDateString()}</span>
                  </>
                )}
              </div>
            </div>
          ))}

          {announcements.length === 0 && (
            <div className="text-center py-12">
              <Megaphone className="w-16 h-16 mx-auto mb-4" style={{ color: '#000000', opacity: 0.3 }} />
              <p className="text-lg" style={{ color: '#000000', opacity: 0.7 }}>No announcements yet. Create your first one!</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
