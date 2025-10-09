'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import AppHeader from '@/components/ui/AppHeader'
import {
  FileText,
  Plus,
  Search,
  Download,
  Edit,
  Trash2,
  Link as LinkIcon,
  Upload,
  File,
  ExternalLink
,
  AlertCircle
} from 'lucide-react'

interface Resource {
  id: string
  title: string
  description: string
  type: 'pdf' | 'link' | 'document'
  url: string
  sport: string
  tags: string[]
  size?: string
  createdAt: string
  downloads: number
}

function ResourceLibraryPageContent() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const embedded = searchParams.get('embedded') === 'true'

  const [resources, setResources] = useState<Resource[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [sportFilter, setSportFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [showAddModal, setShowAddModal] = useState(false)

  // Load resources from API
  useEffect(() => {
    if (user) {
      loadResources()
    }
  }, [user])

  const loadResources = async () => {
    setLoading(true)
    try {
      const token = await user.getIdToken()
      const response = await fetch('/api/coach/resources', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to load resources')
      }

      const data = await response.json()
      setResources(data.resources || [])
    } catch (error) {
      console.error('Error loading resources:', error)
      setResources([])
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (resourceId: string, resourceTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${resourceTitle}"? This cannot be undone.`)) return

    try {
      const token = await user.getIdToken()
      const response = await fetch('/api/coach/resources', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ resourceId })
      })

      if (!response.ok) {
        throw new Error('Failed to delete resource')
      }

      alert('Resource deleted successfully')
      loadResources()
    } catch (error) {
      console.error('Error deleting resource:', error)
      alert('Failed to delete resource')
    }
  }

  const filteredResources = resources.filter(resource => {
    const matchesSearch = resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         resource.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesSport = sportFilter === 'all' || resource.sport === sportFilter
    const matchesType = typeFilter === 'all' || resource.type === typeFilter
    return matchesSearch && matchesSport && matchesType
  })

  const getSportColor = (sport: string) => {
    const colors: Record<string, string> = {
      'baseball': '#91A6EB',
      'basketball': '#FF6B35',
      'football': '#20B2AA',
      'soccer': '#000000',
      'general': '#666666'
    }
    return colors[sport] || '#000000'
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'pdf':
        return <File className="w-5 h-5" />
      case 'link':
        return <ExternalLink className="w-5 h-5" />
      default:
        return <FileText className="w-5 h-5" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'pdf':
        return '#FF6B35'
      case 'link':
        return '#20B2AA'
      default:
        return '#91A6EB'
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
        <AppHeader title="Resource Library" subtitle="PDFs, links, and training materials" />
      )}

      <main className={`w-full ${embedded ? 'p-4' : 'max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6'} space-y-6`}>
        {/* Header */}
        {embedded && (
          <div className="mb-4">
            <div className="flex items-center gap-3 mb-2">
              <FileText className="w-8 h-8" style={{ color: '#91A6EB' }} />
              <h1 className="text-3xl font-heading" style={{ color: '#000000' }}>Resource Library</h1>
            </div>
            <p style={{ color: '#000000', opacity: 0.7 }}>
              PDFs, links, and training materials for your athletes
            </p>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border border-white/50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold" style={{ color: '#000000', opacity: 0.7 }}>Total Resources</p>
                <p className="text-3xl font-heading" style={{ color: '#000000' }}>{resources.length}</p>
              </div>
              <FileText className="w-10 h-10" style={{ color: '#91A6EB', opacity: 0.3 }} />
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border border-white/50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold" style={{ color: '#000000', opacity: 0.7 }}>Total Downloads</p>
                <p className="text-3xl font-heading" style={{ color: '#000000' }}>
                  {resources.reduce((sum, r) => sum + r.downloads, 0)}
                </p>
              </div>
              <Download className="w-10 h-10" style={{ color: '#20B2AA', opacity: 0.3 }} />
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border border-white/50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold" style={{ color: '#000000', opacity: 0.7 }}>File Types</p>
                <p className="text-3xl font-heading" style={{ color: '#000000' }}>
                  {new Set(resources.map(r => r.type)).size}
                </p>
              </div>
              <File className="w-10 h-10" style={{ color: '#FF6B35', opacity: 0.3 }} />
            </div>
          </div>
        </div>

        {/* Actions and Filters */}
        <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <button
              onClick={() => setShowAddModal(true)}
              className="px-5 py-2.5 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition-colors flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add Resource
            </button>

            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ opacity: 0.5 }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search resources by title or tags..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            <select
              value={sportFilter}
              onChange={(e) => setSportFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
            >
              <option value="all">All Sports</option>
              <option value="general">General</option>
              <option value="baseball">Baseball</option>
              <option value="basketball">Basketball</option>
              <option value="football">Football</option>
              <option value="soccer">Soccer</option>
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
            >
              <option value="all">All Types</option>
              <option value="pdf">PDFs</option>
              <option value="link">Links</option>
              <option value="document">Documents</option>
            </select>
          </div>
        </div>

        {/* Resource Grid */}
        {loading ? (
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-black mb-4"></div>
            <p style={{ color: '#000000', opacity: 0.7 }}>Loading resources...</p>
          </div>
        ) : filteredResources.length === 0 ? (
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-12 text-center">
            <FileText className="w-16 h-16 mx-auto mb-4" style={{ color: '#000000', opacity: 0.3 }} />
            <h3 className="text-xl font-heading mb-2" style={{ color: '#000000' }}>
              {resources.length === 0 ? 'No resources yet' : 'No resources match your filters'}
            </h3>
            <p className="mb-6" style={{ color: '#000000', opacity: 0.7 }}>
              {resources.length === 0
                ? 'Add your first resource to get started'
                : 'Try adjusting your search or filters'
              }
            </p>
            {resources.length === 0 && (
              <button
                onClick={() => setShowAddModal(true)}
                className="px-6 py-3 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition-colors inline-flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Add Your First Resource
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredResources.map((resource) => (
              <div
                key={resource.id}
                className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border border-white/50 p-5 hover:shadow-2xl transition-all"
              >
                {/* Resource Header */}
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${getTypeColor(resource.type)}20`, color: getTypeColor(resource.type) }}>
                    {getTypeIcon(resource.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold line-clamp-2 mb-1" style={{ color: '#000000' }}>
                      {resource.title}
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-0.5 rounded-full capitalize font-semibold" style={{ backgroundColor: `${getSportColor(resource.sport)}20`, color: getSportColor(resource.sport) }}>
                        {resource.sport}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full uppercase font-semibold" style={{ backgroundColor: `${getTypeColor(resource.type)}20`, color: getTypeColor(resource.type) }}>
                        {resource.type}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <p className="text-sm mb-3 line-clamp-2" style={{ color: '#000000', opacity: 0.6 }}>
                  {resource.description}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {resource.tags.slice(0, 3).map((tag, idx) => (
                    <span
                      key={idx}
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: 'rgba(145, 166, 235, 0.1)', color: '#91A6EB' }}
                    >
                      #{tag}
                    </span>
                  ))}
                </div>

                {/* Meta Info */}
                <div className="flex items-center justify-between text-xs mb-3" style={{ color: '#000000', opacity: 0.5 }}>
                  <span>{resource.downloads} downloads</span>
                  {resource.size && <span>{resource.size}</span>}
                  <span>{resource.createdAt}</span>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    className="flex-1 px-3 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 text-sm font-semibold"
                  >
                    <Download className="w-4 h-4" />
                    {resource.type === 'link' ? 'Open' : 'Download'}
                  </button>
                  <button
                    className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4" style={{ color: '#000000' }} />
                  </button>
                  <button
                    onClick={() => handleDelete(resource.id, resource.title)}
                    className="p-2 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" style={{ color: '#FF6B35' }} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add Resource Modal Placeholder */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-heading" style={{ color: '#000000' }}>Add Resource</h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <LinkIcon className="w-5 h-5" />
                </button>
              </div>
              <p className="text-center py-8" style={{ color: '#000000', opacity: 0.7 }}>
                Resource upload functionality coming soon! You'll be able to upload PDFs, add links, and organize training materials.
              </p>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-full px-6 py-3 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}


export default function ResourceLibraryPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen" style={{ backgroundColor: '#E8E6D8' }}>
        <div className="flex items-center justify-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
        </div>
      </div>
    }>
      <ResourceLibraryPageContent />
    </Suspense>
  )
}
