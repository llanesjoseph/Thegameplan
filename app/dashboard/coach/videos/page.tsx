'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import AppHeader from '@/components/ui/AppHeader'
import {
  Video,
  Plus,
  Search,
  Filter,
  Play,
  Edit,
  Trash2,
  Link as LinkIcon,
  Upload,
  Youtube,
  ExternalLink
} from 'lucide-react'

interface VideoItem {
  id: string
  title: string
  description: string
  source: 'youtube' | 'vimeo' | 'direct'
  url: string
  thumbnail: string
  duration: number
  sport: string
  tags: string[]
  createdAt: string
  views: number
}

function VideoManagerPageContent() {
  const searchParams = useSearchParams()
  const embedded = searchParams.get('embedded') === 'true'

  const [videos, setVideos] = useState<VideoItem[]>([
    {
      id: '1',
      title: 'Advanced Pitching Mechanics',
      description: 'Learn proper pitching form and mechanics',
      source: 'youtube',
      url: 'https://youtube.com/watch?v=example',
      thumbnail: '',
      duration: 12,
      sport: 'baseball',
      tags: ['pitching', 'mechanics', 'fundamentals'],
      createdAt: '2025-09-15',
      views: 45
    },
    {
      id: '2',
      title: 'Defensive Drills Compilation',
      description: 'Essential defensive training exercises',
      source: 'vimeo',
      url: 'https://vimeo.com/example',
      thumbnail: '',
      duration: 18,
      sport: 'baseball',
      tags: ['defense', 'drills', 'training'],
      createdAt: '2025-09-20',
      views: 32
    }
  ])

  const [searchQuery, setSearchQuery] = useState('')
  const [sportFilter, setSportFilter] = useState('all')
  const [showAddModal, setShowAddModal] = useState(false)

  const filteredVideos = videos.filter(video => {
    const matchesSearch = video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         video.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesSport = sportFilter === 'all' || video.sport === sportFilter
    return matchesSearch && matchesSport
  })

  const getSportColor = (sport: string) => {
    const colors: Record<string, string> = {
      'baseball': '#91A6EB',
      'basketball': '#FF6B35',
      'football': '#20B2AA',
      'soccer': '#000000',
      'other': '#666666'
    }
    return colors[sport] || '#000000'
  }

  return (
    <div style={{ backgroundColor: embedded ? 'transparent' : '#E8E6D8' }} className={embedded ? '' : 'min-h-screen'}>
      {!embedded && (
        <AppHeader title="Video Manager" subtitle="Organize and embed your training videos" />
      )}

      <main className={`w-full ${embedded ? 'p-4' : 'max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6'} space-y-6`}>
        {/* Header */}
        {embedded && (
          <div className="mb-4">
            <div className="flex items-center gap-3 mb-2">
              <Video className="w-8 h-8" style={{ color: '#FF6B35' }} />
              <h1 className="text-3xl font-heading" style={{ color: '#000000' }}>Video Manager</h1>
            </div>
            <p style={{ color: '#000000', opacity: 0.7 }}>
              Organize and embed your training videos
            </p>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border border-white/50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold" style={{ color: '#000000', opacity: 0.7 }}>Total Videos</p>
                <p className="text-3xl font-heading" style={{ color: '#000000' }}>{videos.length}</p>
              </div>
              <Video className="w-10 h-10" style={{ color: '#91A6EB', opacity: 0.3 }} />
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border border-white/50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold" style={{ color: '#000000', opacity: 0.7 }}>Total Views</p>
                <p className="text-3xl font-heading" style={{ color: '#000000' }}>
                  {videos.reduce((sum, v) => sum + v.views, 0)}
                </p>
              </div>
              <Play className="w-10 h-10" style={{ color: '#20B2AA', opacity: 0.3 }} />
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border border-white/50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold" style={{ color: '#000000', opacity: 0.7 }}>Total Duration</p>
                <p className="text-3xl font-heading" style={{ color: '#000000' }}>
                  {videos.reduce((sum, v) => sum + v.duration, 0)}m
                </p>
              </div>
              <ExternalLink className="w-10 h-10" style={{ color: '#FF6B35', opacity: 0.3 }} />
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
              Add Video
            </button>

            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ opacity: 0.5 }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search videos by title or tags..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            <select
              value={sportFilter}
              onChange={(e) => setSportFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
            >
              <option value="all">All Sports</option>
              <option value="baseball">Baseball</option>
              <option value="basketball">Basketball</option>
              <option value="football">Football</option>
              <option value="soccer">Soccer</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        {/* Video Grid */}
        {filteredVideos.length === 0 ? (
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-12 text-center">
            <Video className="w-16 h-16 mx-auto mb-4" style={{ color: '#000000', opacity: 0.3 }} />
            <h3 className="text-xl font-heading mb-2" style={{ color: '#000000' }}>
              {videos.length === 0 ? 'No videos yet' : 'No videos match your filters'}
            </h3>
            <p className="mb-6" style={{ color: '#000000', opacity: 0.7 }}>
              {videos.length === 0
                ? 'Add your first training video to get started'
                : 'Try adjusting your search or filters'
              }
            </p>
            {videos.length === 0 && (
              <button
                onClick={() => setShowAddModal(true)}
                className="px-6 py-3 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition-colors inline-flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Add Your First Video
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVideos.map((video) => (
              <div
                key={video.id}
                className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border border-white/50 overflow-hidden hover:shadow-2xl transition-all"
              >
                {/* Video Thumbnail */}
                <div className="relative aspect-video bg-gray-900 flex items-center justify-center">
                  <Play className="w-16 h-16 text-white opacity-70" />
                  <div className="absolute top-2 right-2 px-2 py-1 bg-black/70 text-white text-xs rounded">
                    {video.duration}m
                  </div>
                  <div className="absolute bottom-2 left-2 px-2 py-1 rounded text-xs font-semibold text-white" style={{ backgroundColor: getSportColor(video.sport) }}>
                    {video.sport}
                  </div>
                </div>

                {/* Video Info */}
                <div className="p-4">
                  <div className="flex items-start gap-2 mb-2">
                    {video.source === 'youtube' && (
                      <Youtube className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                    )}
                    <h3 className="font-semibold line-clamp-2" style={{ color: '#000000' }}>
                      {video.title}
                    </h3>
                  </div>

                  <p className="text-sm mb-3 line-clamp-2" style={{ color: '#000000', opacity: 0.6 }}>
                    {video.description}
                  </p>

                  <div className="flex flex-wrap gap-1 mb-3">
                    {video.tags.slice(0, 3).map((tag, idx) => (
                      <span
                        key={idx}
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: 'rgba(145, 166, 235, 0.1)', color: '#91A6EB' }}
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-xs mb-3" style={{ color: '#000000', opacity: 0.5 }}>
                    <span>{video.views} views</span>
                    <span>{video.createdAt}</span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      className="flex-1 px-3 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 text-sm font-semibold"
                    >
                      <Play className="w-4 h-4" />
                      Play
                    </button>
                    <button
                      className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" style={{ color: '#000000' }} />
                    </button>
                    <button
                      className="p-2 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" style={{ color: '#FF6B35' }} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add Video Modal Placeholder */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-heading" style={{ color: '#000000' }}>Add Video</h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <LinkIcon className="w-5 h-5" />
                </button>
              </div>
              <p className="text-center py-8" style={{ color: '#000000', opacity: 0.7 }}>
                Video upload functionality coming soon! You'll be able to add YouTube, Vimeo, and direct upload videos.
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

export default function VideoManagerPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen" style={{ backgroundColor: '#E8E6D8' }}>
        <div className="flex items-center justify-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
        </div>
      </div>
    }>
      <VideoManagerPageContent />
    </Suspense>
  )
}
