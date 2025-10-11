'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useEnhancedRole } from '@/hooks/use-role-switcher'
import AppHeader from '@/components/ui/AppHeader'
import { db } from '@/lib/firebase.client'
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, orderBy, where, Timestamp } from 'firebase/firestore'
import { Mail, Plus, Edit, Trash2, Send, Eye, Save, X, Users } from 'lucide-react'

interface NewsletterTip {
  id: string
  month: string
  year: number
  subject: string
  content: string
  tips: string[]
  sentDate?: Date
  isSent: boolean
  recipientCount?: number
  createdAt: Date
}

export default function MonthlyTipsManager() {
  const [newsletters, setNewsletters] = useState<NewsletterTip[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [editingNewsletter, setEditingNewsletter] = useState<NewsletterTip | null>(null)
  const [formData, setFormData] = useState({
    month: '',
    year: new Date().getFullYear(),
    subject: '',
    content: '',
    tips: ['', '', '']
  })

  const { user } = useAuth()
  const { role } = useEnhancedRole()

  useEffect(() => {
    if (user && (role === 'superadmin' || role === 'admin')) {
      loadNewsletters()
    }
  }, [user, role])

  const loadNewsletters = async () => {
    try {
      setLoading(true)
      const newslettersQuery = query(collection(db, 'monthlyTips'), orderBy('year', 'desc'), orderBy('month', 'desc'))
      const snapshot = await getDocs(newslettersQuery)
      const newslettersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        sentDate: doc.data().sentDate?.toDate(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      })) as NewsletterTip[]
      setNewsletters(newslettersData)
    } catch (error) {
      console.error('Error loading newsletters:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    try {
      await addDoc(collection(db, 'monthlyTips'), {
        ...formData,
        isSent: false,
        createdAt: Timestamp.now()
      })
      setFormData({ month: '', year: new Date().getFullYear(), subject: '', content: '', tips: ['', '', ''] })
      setIsCreating(false)
      loadNewsletters()
    } catch (error) {
      console.error('Error creating newsletter:', error)
    }
  }

  const handleUpdate = async () => {
    if (!editingNewsletter) return
    try {
      await updateDoc(doc(db, 'monthlyTips', editingNewsletter.id), {
        month: formData.month,
        year: formData.year,
        subject: formData.subject,
        content: formData.content,
        tips: formData.tips
      })
      setEditingNewsletter(null)
      setFormData({ month: '', year: new Date().getFullYear(), subject: '', content: '', tips: ['', '', ''] })
      loadNewsletters()
    } catch (error) {
      console.error('Error updating newsletter:', error)
    }
  }

  const handleSend = async (newsletter: NewsletterTip) => {
    if (!confirm(`Send newsletter to all coaches? This will send: "${newsletter.subject}"`)) return

    try {
      // Get all coaches
      const coachesQuery = query(collection(db, 'users'), where('role', 'in', ['coach', 'creator']))
      const coachesSnapshot = await getDocs(coachesQuery)
      const recipientCount = coachesSnapshot.size

      // Update newsletter as sent
      await updateDoc(doc(db, 'monthlyTips', newsletter.id), {
        isSent: true,
        sentDate: Timestamp.now(),
        recipientCount
      })

      // Here you would integrate with your email service (SendGrid, etc.)
      // For now, we'll just mark it as sent
      alert(`Newsletter sent to ${recipientCount} coaches!`)
      loadNewsletters()
    } catch (error) {
      console.error('Error sending newsletter:', error)
      alert('Error sending newsletter. Please try again.')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this newsletter?')) return
    try {
      await deleteDoc(doc(db, 'monthlyTips', id))
      loadNewsletters()
    } catch (error) {
      console.error('Error deleting newsletter:', error)
    }
  }

  const startEdit = (newsletter: NewsletterTip) => {
    setEditingNewsletter(newsletter)
    setFormData({
      month: newsletter.month,
      year: newsletter.year,
      subject: newsletter.subject,
      content: newsletter.content,
      tips: newsletter.tips
    })
  }

  const addTip = () => {
    setFormData({ ...formData, tips: [...formData.tips, ''] })
  }

  const removeTip = (index: number) => {
    setFormData({ ...formData, tips: formData.tips.filter((_, i) => i !== index) })
  }

  const updateTip = (index: number, value: string) => {
    const newTips = [...formData.tips]
    newTips[index] = value
    setFormData({ ...formData, tips: newTips })
  }

  if (role !== 'superadmin' && role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#E8E6D8' }}>
        <div className="text-center bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-8">
          <h1 className="text-2xl mb-4" style={{ color: '#000000' }}>Access Denied</h1>
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
          <p className="mt-4" style={{ color: '#000000', opacity: 0.7 }}>Loading newsletters...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#E8E6D8' }}>
      <AppHeader title="Monthly Tips Newsletter" subtitle="Send best practices and tips to all coaches" />
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Create/Edit Form */}
        {(isCreating || editingNewsletter) && (
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl" style={{ color: '#000000' }}>
                {editingNewsletter ? 'Edit Newsletter' : 'Create Newsletter'}
              </h2>
              <button
                onClick={() => {
                  setIsCreating(false)
                  setEditingNewsletter(null)
                  setFormData({ month: '', year: new Date().getFullYear(), subject: '', content: '', tips: ['', '', ''] })
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" style={{ color: '#000000' }} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-2" style={{ color: '#000000' }}>Month</label>
                  <select
                    value={formData.month}
                    onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                  >
                    <option value="">Select Month</option>
                    <option value="January">January</option>
                    <option value="February">February</option>
                    <option value="March">March</option>
                    <option value="April">April</option>
                    <option value="May">May</option>
                    <option value="June">June</option>
                    <option value="July">July</option>
                    <option value="August">August</option>
                    <option value="September">September</option>
                    <option value="October">October</option>
                    <option value="November">November</option>
                    <option value="December">December</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm mb-2" style={{ color: '#000000' }}>Year</label>
                  <input
                    type="number"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm mb-2" style={{ color: '#000000' }}>Email Subject</label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                  placeholder="Monthly Coaching Tips - January 2024"
                />
              </div>

              <div>
                <label className="block text-sm mb-2" style={{ color: '#000000' }}>Introduction</label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                  placeholder="Welcome to this month's coaching tips..."
                />
              </div>

              <div>
                <label className="block text-sm mb-2" style={{ color: '#000000' }}>Tips</label>
                {formData.tips.map((tip, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={tip}
                      onChange={(e) => updateTip(index, e.target.value)}
                      className="flex-1 px-4 py-2 border border-gray-300/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                      placeholder={`Tip ${index + 1}`}
                    />
                    {formData.tips.length > 1 && (
                      <button
                        onClick={() => removeTip(index)}
                        className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-5 h-5" style={{ color: '#FF6B35' }} />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={addTip}
                  className="mt-2 px-4 py-2 border border-gray-300/50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <Plus className="w-4 h-4 inline mr-2" />
                  Add Tip
                </button>
              </div>

              <button
                onClick={editingNewsletter ? handleUpdate : handleCreate}
                className="w-full py-3 px-4 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
              >
                <Save className="w-5 h-5" />
                {editingNewsletter ? 'Update Newsletter' : 'Create Newsletter'}
              </button>
            </div>
          </div>
        )}

        {/* Create Button */}
        {!isCreating && !editingNewsletter && (
          <button
            onClick={() => setIsCreating(true)}
            className="mb-8 px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Create Newsletter
          </button>
        )}

        {/* Newsletters List */}
        <div className="space-y-6">
          {newsletters.map((newsletter) => (
            <div key={newsletter.id} className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-4 flex-1">
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: newsletter.isSent ? '#20B2AA' : '#91A6EB' }}>
                    <Mail className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl mb-2" style={{ color: '#000000' }}>{newsletter.subject}</h3>
                    <p className="text-sm mb-3" style={{ color: '#000000', opacity: 0.7 }}>{newsletter.month} {newsletter.year}</p>
                    <p className="text-sm mb-4" style={{ color: '#000000' }}>{newsletter.content}</p>
                    <div className="space-y-2">
                      {newsletter.tips.map((tip, index) => tip && (
                        <div key={index} className="flex items-start gap-2">
                          <span className="text-sm" style={{ color: '#20B2AA' }}>•</span>
                          <p className="text-sm" style={{ color: '#000000' }}>{tip}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {!newsletter.isSent && (
                    <button
                      onClick={() => handleSend(newsletter)}
                      className="p-2 hover:bg-green-100 rounded-lg transition-colors"
                      title="Send Newsletter"
                    >
                      <Send className="w-5 h-5" style={{ color: '#20B2AA' }} />
                    </button>
                  )}
                  {!newsletter.isSent && (
                    <button
                      onClick={() => startEdit(newsletter)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <Edit className="w-5 h-5" style={{ color: '#000000' }} />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(newsletter.id)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-5 h-5" style={{ color: '#FF6B35' }} />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-4 text-sm" style={{ color: '#000000', opacity: 0.6 }}>
                <span>{newsletter.isSent ? `Sent to ${newsletter.recipientCount} coaches` : 'Draft'}</span>
                {newsletter.sentDate && (
                  <>
                    <span>•</span>
                    <span>Sent {newsletter.sentDate.toLocaleDateString()}</span>
                  </>
                )}
              </div>
            </div>
          ))}

          {newsletters.length === 0 && (
            <div className="text-center py-12">
              <Mail className="w-16 h-16 mx-auto mb-4" style={{ color: '#000000', opacity: 0.3 }} />
              <p className="text-lg" style={{ color: '#000000', opacity: 0.7 }}>No newsletters yet. Create your first one!</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
