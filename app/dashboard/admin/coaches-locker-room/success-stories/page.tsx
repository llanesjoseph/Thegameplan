'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useEnhancedRole } from '@/hooks/use-role-switcher'
import AppHeader from '@/components/ui/AppHeader'
import { db } from '@/lib/firebase.client'
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, orderBy, Timestamp } from 'firebase/firestore'
import { Trophy, Plus, Edit, Trash2, Eye, EyeOff, Save, X } from 'lucide-react'

interface SuccessStory {
  id: string
  coachName: string
  coachEmail: string
  title: string
  description: string
  metrics: string
  publishedDate: Date
  isPublished: boolean
  createdAt: Date
}

export default function SuccessStoriesManager() {
  const [stories, setStories] = useState<SuccessStory[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [editingStory, setEditingStory] = useState<SuccessStory | null>(null)
  const [formData, setFormData] = useState({
    coachName: '',
    coachEmail: '',
    title: '',
    description: '',
    metrics: ''
  })

  const { user } = useAuth()
  const { role } = useEnhancedRole()

  useEffect(() => {
    if (user && (role === 'superadmin' || role === 'admin')) {
      loadStories()
    }
  }, [user, role])

  const loadStories = async () => {
    try {
      setLoading(true)
      const storiesQuery = query(collection(db, 'successStories'), orderBy('createdAt', 'desc'))
      const snapshot = await getDocs(storiesQuery)
      const storiesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        publishedDate: doc.data().publishedDate?.toDate() || new Date(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      })) as SuccessStory[]
      setStories(storiesData)
    } catch (error) {
      console.error('Error loading success stories:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    try {
      await addDoc(collection(db, 'successStories'), {
        ...formData,
        isPublished: false,
        publishedDate: Timestamp.now(),
        createdAt: Timestamp.now()
      })
      setFormData({ coachName: '', coachEmail: '', title: '', description: '', metrics: '' })
      setIsCreating(false)
      loadStories()
    } catch (error) {
      console.error('Error creating success story:', error)
    }
  }

  const handleUpdate = async () => {
    if (!editingStory) return
    try {
      await updateDoc(doc(db, 'successStories', editingStory.id), {
        coachName: formData.coachName,
        coachEmail: formData.coachEmail,
        title: formData.title,
        description: formData.description,
        metrics: formData.metrics
      })
      setEditingStory(null)
      setFormData({ coachName: '', coachEmail: '', title: '', description: '', metrics: '' })
      loadStories()
    } catch (error) {
      console.error('Error updating success story:', error)
    }
  }

  const togglePublish = async (story: SuccessStory) => {
    try {
      await updateDoc(doc(db, 'successStories', story.id), {
        isPublished: !story.isPublished,
        publishedDate: !story.isPublished ? Timestamp.now() : story.publishedDate
      })
      loadStories()
    } catch (error) {
      console.error('Error toggling publish:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this success story?')) return
    try {
      await deleteDoc(doc(db, 'successStories', id))
      loadStories()
    } catch (error) {
      console.error('Error deleting success story:', error)
    }
  }

  const startEdit = (story: SuccessStory) => {
    setEditingStory(story)
    setFormData({
      coachName: story.coachName,
      coachEmail: story.coachEmail,
      title: story.title,
      description: story.description,
      metrics: story.metrics
    })
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
          <p className="mt-4" style={{ color: '#000000', opacity: 0.7 }}>Loading success stories...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#E8E6D8' }}>
      <AppHeader title="Success Stories" subtitle="Manage coach success stories and case studies" />
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Create/Edit Form */}
        {(isCreating || editingStory) && (
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-heading" style={{ color: '#000000' }}>
                {editingStory ? 'Edit Success Story' : 'Create Success Story'}
              </h2>
              <button
                onClick={() => {
                  setIsCreating(false)
                  setEditingStory(null)
                  setFormData({ coachName: '', coachEmail: '', title: '', description: '', metrics: '' })
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" style={{ color: '#000000' }} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: '#000000' }}>Coach Name</label>
                  <input
                    type="text"
                    value={formData.coachName}
                    onChange={(e) => setFormData({ ...formData, coachName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: '#000000' }}>Coach Email</label>
                  <input
                    type="email"
                    value={formData.coachEmail}
                    onChange={(e) => setFormData({ ...formData, coachEmail: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                    placeholder="john@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#000000' }}>Story Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                  placeholder="How Coach John increased engagement by 300%"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#000000' }}>Success Metrics</label>
                <input
                  type="text"
                  value={formData.metrics}
                  onChange={(e) => setFormData({ ...formData, metrics: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                  placeholder="300% increase in views, 50 new athletes"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#000000' }}>Story Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={6}
                  className="w-full px-4 py-2 border border-gray-300/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                  placeholder="Tell the story of how this coach achieved success..."
                />
              </div>

              <button
                onClick={editingStory ? handleUpdate : handleCreate}
                className="w-full py-3 px-4 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
              >
                <Save className="w-5 h-5" />
                {editingStory ? 'Update Story' : 'Create Story'}
              </button>
            </div>
          </div>
        )}

        {/* Create Button */}
        {!isCreating && !editingStory && (
          <button
            onClick={() => setIsCreating(true)}
            className="mb-8 px-6 py-3 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition-colors flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Create Success Story
          </button>
        )}

        {/* Stories List */}
        <div className="space-y-6">
          {stories.map((story) => (
            <div key={story.id} className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-4 flex-1">
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: story.isPublished ? '#20B2AA' : '#FF6B35' }}>
                    <Trophy className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-heading mb-2" style={{ color: '#000000' }}>{story.title}</h3>
                    <p className="text-sm mb-3" style={{ color: '#000000', opacity: 0.7 }}>{story.coachName} ({story.coachEmail})</p>
                    <p className="text-sm mb-3" style={{ color: '#000000' }}>{story.description}</p>
                    <div className="inline-block px-3 py-1 rounded-lg" style={{ backgroundColor: '#20B2AA', color: 'white' }}>
                      <p className="text-sm font-semibold">{story.metrics}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => togglePublish(story)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    title={story.isPublished ? 'Unpublish' : 'Publish'}
                  >
                    {story.isPublished ? (
                      <Eye className="w-5 h-5" style={{ color: '#20B2AA' }} />
                    ) : (
                      <EyeOff className="w-5 h-5" style={{ color: '#FF6B35' }} />
                    )}
                  </button>
                  <button
                    onClick={() => startEdit(story)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Edit className="w-5 h-5" style={{ color: '#000000' }} />
                  </button>
                  <button
                    onClick={() => handleDelete(story.id)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-5 h-5" style={{ color: '#FF6B35' }} />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-4 text-sm" style={{ color: '#000000', opacity: 0.6 }}>
                <span>{story.isPublished ? 'Published' : 'Draft'}</span>
                <span>•</span>
                <span>Created {story.createdAt.toLocaleDateString()}</span>
              </div>
            </div>
          ))}

          {stories.length === 0 && (
            <div className="text-center py-12">
              <Trophy className="w-16 h-16 mx-auto mb-4" style={{ color: '#000000', opacity: 0.3 }} />
              <p className="text-lg" style={{ color: '#000000', opacity: 0.7 }}>No success stories yet. Create your first one!</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
