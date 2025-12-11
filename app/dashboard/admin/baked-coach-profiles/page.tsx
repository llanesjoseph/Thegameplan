'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useBakedProfileAdoption } from '@/hooks/use-baked-profile-adoption'
import { Plus, Eye, EyeOff, Check, Edit, Trash2, Mail, Lock, Unlock, X } from 'lucide-react'

interface BakedProfile {
  bakedProfileId: string
  targetEmail: string
  displayName: string
  firstName: string
  lastName: string
  sport: string
  location?: string
  bio?: string
  status: 'pending' | 'ready' | 'transferred' | 'cancelled'
  visibleInBrowseCoaches?: boolean
  readyForProvisioning?: boolean
  createdAt: any
  readyAt?: any
  transferredAt?: any
  [key: string]: any
}

export default function BakedCoachProfilesPage() {
  const { user } = useAuth()
  // AIRTIGHT: Ensure baked profile adoption happens on login
  // Note: This should also be added to main app layout for all users
  useBakedProfileAdoption()
  
  const [profiles, setProfiles] = useState<BakedProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingProfile, setEditingProfile] = useState<BakedProfile | null>(null)
  const [previewProfile, setPreviewProfile] = useState<BakedProfile | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadProfiles()
  }, [])

  const loadProfiles = async () => {
    try {
      setLoading(true)
      const token = await user?.getIdToken()
      const res = await fetch('/api/admin/list-baked-profiles', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (data?.success) {
        setProfiles(data.bakedProfiles || [])
      }
    } catch (error) {
      console.error('Failed to load baked profiles:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkReady = async (bakedProfileId: string) => {
    if (!confirm('Mark this profile as ready? It will be locked from further editing.')) return
    
    try {
      setSaving(true)
      const token = await user?.getIdToken()
      const res = await fetch('/api/admin/mark-baked-profile-ready', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ bakedProfileId })
      })
      
      const data = await res.json()
      if (data?.success) {
        alert('Profile marked as ready for provisioning!')
        loadProfiles()
      } else {
        alert('Failed: ' + (data?.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Failed to mark profile as ready:', error)
      alert('Failed to mark profile as ready')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleVisibility = async (bakedProfileId: string, currentVisible: boolean) => {
    try {
      setSaving(true)
      const token = await user?.getIdToken()
      const res = await fetch('/api/admin/toggle-baked-profile-visibility', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ bakedProfileId, visible: !currentVisible })
      })
      
      const data = await res.json()
      if (data?.success) {
        loadProfiles()
      } else {
        alert('Failed: ' + (data?.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Failed to toggle visibility:', error)
      alert('Failed to toggle visibility')
    } finally {
      setSaving(false)
    }
  }

  const handlePreview = async (bakedProfileId: string) => {
    try {
      const token = await user?.getIdToken()
      const res = await fetch(`/api/admin/get-baked-profile?bakedProfileId=${bakedProfileId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (data?.success) {
        setPreviewProfile(data.bakedProfile)
      }
    } catch (error) {
      console.error('Failed to load profile for preview:', error)
      alert('Failed to load profile')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'ready': return 'bg-green-100 text-green-800'
      case 'transferred': return 'bg-blue-100 text-blue-800'
      case 'cancelled': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Baked Coach Profiles</h1>
            <p className="text-gray-600 mt-1">Create and manage pre-made coach profiles for provisioning</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#FC0105] text-white rounded-lg hover:bg-[#d00104] transition-colors"
          >
            <Plus className="w-5 h-5" />
            Create New Profile
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-[#FC0105] border-t-transparent rounded-full animate-spin" />
            <p className="mt-4 text-gray-600">Loading profiles...</p>
          </div>
        ) : profiles.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
            <p className="text-gray-600">No baked profiles yet. Create your first one!</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Coach</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sport</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Visibility</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {profiles.map((profile) => (
                  <tr key={profile.bakedProfileId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{profile.displayName}</div>
                      <div className="text-sm text-gray-500">{profile.firstName} {profile.lastName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{profile.targetEmail}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{profile.sport}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(profile.status)}`}>
                        {profile.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {profile.visibleInBrowseCoaches ? (
                        <span className="text-green-600 text-sm">Visible</span>
                      ) : (
                        <span className="text-gray-400 text-sm">Hidden</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handlePreview(profile.bakedProfileId)}
                          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
                          title="Preview"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {profile.status === 'pending' && (
                          <button
                            onClick={() => setEditingProfile(profile)}
                            className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleToggleVisibility(profile.bakedProfileId, profile.visibleInBrowseCoaches || false)}
                          className={`p-2 rounded ${profile.visibleInBrowseCoaches ? 'text-green-600 hover:text-green-900 hover:bg-green-50' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}
                          title={profile.visibleInBrowseCoaches ? 'Hide from Browse Coaches' : 'Show in Browse Coaches'}
                        >
                          {profile.visibleInBrowseCoaches ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                        {profile.status === 'pending' && (
                          <button
                            onClick={() => handleMarkReady(profile.bakedProfileId)}
                            className="p-2 text-green-600 hover:text-green-900 hover:bg-green-50 rounded"
                            title="Mark as Ready"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                        {profile.status === 'ready' && (
                          <>
                            <button
                              onClick={() => handleSendInvite(profile.bakedProfileId, profile.targetEmail)}
                              className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded"
                              title="Send Invite Email"
                            >
                              <Mail className="w-4 h-4" />
                            </button>
                            <span className="p-2 text-gray-400" title="Locked - marked as ready">
                              <Lock className="w-4 h-4" />
                            </span>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || editingProfile) && (
        <BakedProfileForm
          profile={editingProfile}
          onClose={() => {
            setShowCreateModal(false)
            setEditingProfile(null)
          }}
          onSave={() => {
            setShowCreateModal(false)
            setEditingProfile(null)
            loadProfiles()
          }}
        />
      )}

      {/* Preview Modal */}
      {previewProfile && (
        <PreviewModal
          profile={previewProfile}
          onClose={() => setPreviewProfile(null)}
        />
      )}
    </div>
  )

  async function handleSendInvite(bakedProfileId: string, email: string) {
    if (!confirm(`Send invitation email to ${email}?`)) return
    
    try {
      setSaving(true)
      const token = await user?.getIdToken()
      const res = await fetch('/api/admin/send-baked-profile-invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ bakedProfileId, email })
      })
      
      const data = await res.json()
      if (data?.success) {
        alert('Invitation email sent successfully!')
      } else {
        alert('Failed: ' + (data?.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Failed to send invite:', error)
      alert('Failed to send invitation email')
    } finally {
      setSaving(false)
    }
  }
}

// Complete Form Component
function BakedProfileForm({ profile, onClose, onSave }: { profile: BakedProfile | null, onClose: () => void, onSave: () => void }) {
  const { user } = useAuth()
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    targetEmail: profile?.targetEmail || '',
    displayName: profile?.displayName || '',
    firstName: profile?.firstName || '',
    lastName: profile?.lastName || '',
    sport: profile?.sport || '',
    location: profile?.location || '',
    bio: profile?.bio || '',
    tagline: profile?.tagline || '',
    credentials: profile?.credentials || '',
    philosophy: profile?.philosophy || '',
    experience: profile?.experience || '',
    profileImageUrl: profile?.profileImageUrl || profile?.headshotUrl || '',
    headshotUrl: profile?.headshotUrl || profile?.profileImageUrl || '',
    heroImageUrl: profile?.heroImageUrl || '',
    showcasePhoto1: profile?.showcasePhoto1 || '',
    showcasePhoto2: profile?.showcasePhoto2 || '',
    galleryPhotos: (profile?.galleryPhotos || []).join('\n'),
    instagram: profile?.instagram || profile?.socialLinks?.instagram || '',
    facebook: profile?.facebook || profile?.socialLinks?.facebook || '',
    twitter: profile?.twitter || profile?.socialLinks?.twitter || '',
    linkedin: profile?.linkedin || profile?.socialLinks?.linkedin || '',
    youtube: profile?.youtube || profile?.socialLinks?.youtube || '',
    visibleInBrowseCoaches: profile?.visibleInBrowseCoaches || false
  })

  const SPORTS = [
    'Baseball', 'Basketball', 'Football', 'Soccer', 'Tennis', 'Golf', 'Swimming',
    'Track & Field', 'Volleyball', 'Softball', 'Lacrosse', 'Wrestling', 'Gymnastics',
    'Cross Country', 'Other'
  ]

  const handleSubmit = async (e: any) => {
    e.preventDefault()
    
    // AIRTIGHT: Comprehensive validation
    if (!formData.targetEmail || !formData.displayName || !formData.firstName || !formData.lastName || !formData.sport) {
      alert('Please fill in all required fields (Email, Display Name, First Name, Last Name, Sport)')
      return
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.targetEmail)) {
      alert('Please enter a valid email address')
      return
    }
    
    // Validate URLs if provided
    const urlFields = ['profileImageUrl', 'headshotUrl', 'heroImageUrl', 'showcasePhoto1', 'showcasePhoto2', 'instagram', 'facebook', 'twitter', 'linkedin', 'youtube']
    for (const field of urlFields) {
      const value = (formData as any)[field]
      if (value && value.trim() && !value.startsWith('http://') && !value.startsWith('https://')) {
        alert(`Please enter a valid URL for ${field} (must start with http:// or https://)`)
        return
      }
    }

    try {
      setSaving(true)
      const token = await user?.getIdToken()
      
      // Parse gallery photos from newline-separated string
      const galleryPhotosArray = formData.galleryPhotos
        .split('\n')
        .map(url => url.trim())
        .filter(url => url.length > 0)

      const payload: any = {
        ...formData,
        galleryPhotos: galleryPhotosArray,
        socialLinks: {
          instagram: formData.instagram || '',
          facebook: formData.facebook || '',
          twitter: formData.twitter || '',
          linkedin: formData.linkedin || '',
          youtube: formData.youtube || ''
        }
      }

      let res
      if (profile) {
        // Update existing
        payload.bakedProfileId = profile.bakedProfileId
        res = await fetch('/api/admin/update-baked-profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        })
      } else {
        // Create new
        res = await fetch('/api/admin/create-baked-profile', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        })
      }

      const data = await res.json()
      if (data?.success) {
        alert(profile ? 'Profile updated successfully!' : 'Profile created successfully!')
        onSave()
      } else {
        alert('Failed: ' + (data?.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Failed to save profile:', error)
      alert('Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            {profile ? 'Edit Baked Profile' : 'Create Baked Profile'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Basic Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Target Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={formData.targetEmail}
                  onChange={(e) => setFormData({ ...formData, targetEmail: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FC0105]"
                  placeholder="coach@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Display Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FC0105]"
                  placeholder="Coach Name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FC0105]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FC0105]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sport <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.sport}
                  onChange={(e) => setFormData({ ...formData, sport: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FC0105]"
                >
                  <option value="">Select Sport</option>
                  {SPORTS.map(sport => (
                    <option key={sport} value={sport}>{sport}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FC0105]"
                  placeholder="City, State"
                />
              </div>
            </div>
          </div>

          {/* Bio & Description */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Bio & Description</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tagline</label>
              <input
                type="text"
                value={formData.tagline}
                onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FC0105]"
                placeholder="Short tagline"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FC0105]"
                placeholder="Coach biography..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Credentials</label>
              <textarea
                value={formData.credentials}
                onChange={(e) => setFormData({ ...formData, credentials: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FC0105]"
                placeholder="Certifications, degrees, etc."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Philosophy</label>
              <textarea
                value={formData.philosophy}
                onChange={(e) => setFormData({ ...formData, philosophy: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FC0105]"
                placeholder="Coaching philosophy..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Experience</label>
              <textarea
                value={formData.experience}
                onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FC0105]"
                placeholder="Years of experience, notable achievements..."
              />
            </div>
          </div>

          {/* Images */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Images</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Profile Image URL</label>
                <input
                  type="url"
                  value={formData.profileImageUrl}
                  onChange={(e) => setFormData({ ...formData, profileImageUrl: e.target.value, headshotUrl: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FC0105]"
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hero Image URL</label>
                <input
                  type="url"
                  value={formData.heroImageUrl}
                  onChange={(e) => setFormData({ ...formData, heroImageUrl: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FC0105]"
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Showcase Photo 1</label>
                <input
                  type="url"
                  value={formData.showcasePhoto1}
                  onChange={(e) => setFormData({ ...formData, showcasePhoto1: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FC0105]"
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Showcase Photo 2</label>
                <input
                  type="url"
                  value={formData.showcasePhoto2}
                  onChange={(e) => setFormData({ ...formData, showcasePhoto2: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FC0105]"
                  placeholder="https://..."
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gallery Photos (one URL per line)</label>
              <textarea
                value={formData.galleryPhotos}
                onChange={(e) => setFormData({ ...formData, galleryPhotos: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FC0105]"
                placeholder="https://photo1.com/image.jpg&#10;https://photo2.com/image.jpg"
              />
            </div>
          </div>

          {/* Social Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Social Links</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Instagram</label>
                <input
                  type="url"
                  value={formData.instagram}
                  onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FC0105]"
                  placeholder="https://instagram.com/..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Facebook</label>
                <input
                  type="url"
                  value={formData.facebook}
                  onChange={(e) => setFormData({ ...formData, facebook: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FC0105]"
                  placeholder="https://facebook.com/..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Twitter</label>
                <input
                  type="url"
                  value={formData.twitter}
                  onChange={(e) => setFormData({ ...formData, twitter: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FC0105]"
                  placeholder="https://twitter.com/..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn</label>
                <input
                  type="url"
                  value={formData.linkedin}
                  onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FC0105]"
                  placeholder="https://linkedin.com/in/..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">YouTube</label>
                <input
                  type="url"
                  value={formData.youtube}
                  onChange={(e) => setFormData({ ...formData, youtube: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FC0105]"
                  placeholder="https://youtube.com/..."
                />
              </div>
            </div>
          </div>

          {/* Options */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Options</h3>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="visibleInBrowseCoaches"
                checked={formData.visibleInBrowseCoaches}
                onChange={(e) => setFormData({ ...formData, visibleInBrowseCoaches: e.target.checked })}
                className="w-4 h-4 text-[#FC0105] border-gray-300 rounded focus:ring-[#FC0105]"
              />
              <label htmlFor="visibleInBrowseCoaches" className="ml-2 text-sm text-gray-700">
                Make visible in Browse Coaches (even before adoption)
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-4 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-[#FC0105] text-white rounded-lg hover:bg-[#d00104] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : (profile ? 'Update Profile' : 'Create Profile')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Complete Preview Modal
function PreviewModal({ profile, onClose }: { profile: BakedProfile, onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Profile Preview</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="border-b pb-4">
            <div className="flex items-center gap-4">
              {profile.profileImageUrl || profile.headshotUrl ? (
                <img
                  src={profile.profileImageUrl || profile.headshotUrl}
                  alt={profile.displayName}
                  className="w-24 h-24 rounded-full object-cover border-2 border-gray-200"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center">
                  <span className="text-2xl text-gray-400">{profile.displayName?.[0] || '?'}</span>
                </div>
              )}
              <div>
                <h3 className="text-2xl font-bold text-gray-900">{profile.displayName}</h3>
                <p className="text-gray-600">{profile.firstName} {profile.lastName}</p>
                <p className="text-sm text-gray-500">{profile.sport} {profile.location ? `• ${profile.location}` : ''}</p>
              </div>
            </div>
          </div>

          {/* Tagline */}
          {profile.tagline && (
            <div>
              <p className="text-lg text-gray-700 italic">"{profile.tagline}"</p>
            </div>
          )}

          {/* Bio */}
          {profile.bio && (
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">About</h4>
              <p className="text-gray-700 whitespace-pre-wrap">{profile.bio}</p>
            </div>
          )}

          {/* Credentials */}
          {profile.credentials && (
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Credentials</h4>
              <p className="text-gray-700 whitespace-pre-wrap">{profile.credentials}</p>
            </div>
          )}

          {/* Philosophy */}
          {profile.philosophy && (
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Coaching Philosophy</h4>
              <p className="text-gray-700 whitespace-pre-wrap">{profile.philosophy}</p>
            </div>
          )}

          {/* Experience */}
          {profile.experience && (
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Experience</h4>
              <p className="text-gray-700 whitespace-pre-wrap">{profile.experience}</p>
            </div>
          )}

          {/* Images */}
          {(profile.showcasePhoto1 || profile.showcasePhoto2 || (profile.galleryPhotos && profile.galleryPhotos.length > 0)) && (
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Photos</h4>
              <div className="grid grid-cols-2 gap-4">
                {profile.showcasePhoto1 && (
                  <img src={profile.showcasePhoto1} alt="Showcase 1" className="w-full h-48 object-cover rounded-lg" />
                )}
                {profile.showcasePhoto2 && (
                  <img src={profile.showcasePhoto2} alt="Showcase 2" className="w-full h-48 object-cover rounded-lg" />
                )}
                {profile.galleryPhotos && profile.galleryPhotos.map((url: string, idx: number) => (
                  <img key={idx} src={url} alt={`Gallery ${idx + 1}`} className="w-full h-48 object-cover rounded-lg" />
                ))}
              </div>
            </div>
          )}

          {/* Social Links */}
          {(profile.instagram || profile.facebook || profile.twitter || profile.linkedin || profile.youtube) && (
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Social Links</h4>
              <div className="flex flex-wrap gap-4">
                {profile.instagram && (
                  <a href={profile.instagram} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    Instagram
                  </a>
                )}
                {profile.facebook && (
                  <a href={profile.facebook} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    Facebook
                  </a>
                )}
                {profile.twitter && (
                  <a href={profile.twitter} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    Twitter
                  </a>
                )}
                {profile.linkedin && (
                  <a href={profile.linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    LinkedIn
                  </a>
                )}
                {profile.youtube && (
                  <a href={profile.youtube} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    YouTube
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Status Info */}
          <div className="border-t pt-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Status:</span>
                <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                  profile.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  profile.status === 'ready' ? 'bg-green-100 text-green-800' :
                  profile.status === 'transferred' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {profile.status}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Visible in Browse Coaches:</span>
                <span className={`ml-2 ${profile.visibleInBrowseCoaches ? 'text-green-600' : 'text-gray-400'}`}>
                  {profile.visibleInBrowseCoaches ? 'Yes' : 'No'}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Target Email:</span>
                <span className="ml-2 text-gray-600">{profile.targetEmail}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-gray-50 border-t px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#FC0105] text-white rounded-lg hover:bg-[#d00104] transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

