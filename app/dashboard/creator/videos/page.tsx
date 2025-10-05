'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { db } from '@/lib/firebase.client'
import { collection, query, where, getDocs, orderBy, deleteDoc, doc } from 'firebase/firestore'
import GcsVideoUploader from '@/components/GcsVideoUploader'
import AppHeader from '@/components/ui/AppHeader'
import CreatorAccessGate from '@/components/CreatorAccessGate'
import {
  Video,
  Upload,
  Trash2,
  Copy,
  Filter,
  Search,
  CheckCircle,
  AlertCircle,
  Clock,
  Loader2,
  Eye,
  Calendar,
  HardDrive,
  MoreVertical,
  PlayCircle
} from 'lucide-react'

interface VideoData {
  id: string
  userId: string
  filename: string
  size: number
  contentType: string
  uploadPath: string
  status: 'uploading' | 'transcoding' | 'completed' | 'error'
  createdAt: string
  updatedAt: string
  transcodeJobId?: string
  error?: string
}

type FilterStatus = 'all' | 'uploading' | 'transcoding' | 'completed' | 'error'

export default function VideosPage() {
  const { user } = useAuth()
  const [videos, setVideos] = useState<VideoData[]>([])
  const [filteredVideos, setFilteredVideos] = useState<VideoData[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showUploader, setShowUploader] = useState(false)

  useEffect(() => {
    if (user) {
      loadVideos()
    }
  }, [user])

  useEffect(() => {
    applyFilters()
  }, [videos, filterStatus, searchQuery])

  const loadVideos = async () => {
    if (!user) return

    setLoading(true)
    try {
      const videosRef = collection(db, 'videos')
      const q = query(
        videosRef,
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      )

      const snapshot = await getDocs(q)
      const videosData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as VideoData[]

      setVideos(videosData)
    } catch (error) {
      console.error('Failed to load videos:', error)
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...videos]

    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(v => v.status === filterStatus)
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(v =>
        v.filename.toLowerCase().includes(query) ||
        v.id.toLowerCase().includes(query)
      )
    }

    setFilteredVideos(filtered)
  }

  const handleDeleteVideo = async (videoId: string) => {
    if (!confirm('Are you sure you want to delete this video? This action cannot be undone.')) {
      return
    }

    try {
      await deleteDoc(doc(db, 'videos', videoId))
      setVideos(videos.filter(v => v.id !== videoId))
    } catch (error) {
      console.error('Failed to delete video:', error)
      alert('Failed to delete video. Please try again.')
    }
  }

  const handleCopyVideoId = (videoId: string) => {
    navigator.clipboard.writeText(videoId)
    alert('Video ID copied to clipboard!')
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'uploading':
        return <Upload className="w-5 h-5 text-blue-500 animate-pulse" />
      case 'transcoding':
        return <Loader2 className="w-5 h-5 text-orange-500 animate-spin" />
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />
      default:
        return <Clock className="w-5 h-5 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'uploading':
        return 'bg-blue-100 text-blue-700'
      case 'transcoding':
        return 'bg-orange-100 text-orange-700'
      case 'completed':
        return 'bg-green-100 text-green-700'
      case 'error':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const statusCounts = {
    all: videos.length,
    uploading: videos.filter(v => v.status === 'uploading').length,
    transcoding: videos.filter(v => v.status === 'transcoding').length,
    completed: videos.filter(v => v.status === 'completed').length,
    error: videos.filter(v => v.status === 'error').length
  }

  return (
    <CreatorAccessGate>
      <div className="min-h-screen bg-gray-50">
        <AppHeader
          title="Video Library"
          subtitle="Manage your uploaded videos and content"
        />

        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Header Actions */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Video Library</h1>
              <p className="text-gray-600 mt-1">
                {videos.length} {videos.length === 1 ? 'video' : 'videos'} uploaded
              </p>
            </div>
            <button
              onClick={() => setShowUploader(!showUploader)}
              className="px-4 py-2 bg-cardinal text-white rounded-lg hover:bg-cardinal-dark flex items-center space-x-2"
            >
              <Upload className="w-5 h-5" />
              <span>{showUploader ? 'Hide Uploader' : 'Upload Video'}</span>
            </button>
          </div>

          {/* Video Uploader */}
          {showUploader && (
            <div className="mb-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <GcsVideoUploader
                onUploadComplete={(result) => {
                  console.log('Upload completed:', result)
                  loadVideos()
                  setShowUploader(false)
                }}
                onUploadError={(error) => {
                  console.error('Upload error:', error)
                  alert(`Upload failed: ${error.message}`)
                }}
              />
            </div>
          )}

          {/* Filters */}
          <div className="mb-6 bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search videos by name or ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cardinal focus:border-transparent"
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-2 flex-wrap">
                {(['all', 'uploading', 'transcoding', 'completed', 'error'] as FilterStatus[]).map(status => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      filterStatus === status
                        ? 'bg-cardinal text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                    <span className="ml-2 text-xs opacity-75">
                      ({statusCounts[status]})
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Videos Grid */}
          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 text-cardinal animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Loading videos...</p>
            </div>
          ) : filteredVideos.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
              <Video className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {videos.length === 0 ? 'No videos uploaded yet' : 'No videos match your filters'}
              </h3>
              <p className="text-gray-600 mb-6">
                {videos.length === 0
                  ? 'Upload your first video to get started'
                  : 'Try adjusting your search or filters'
                }
              </p>
              {videos.length === 0 && (
                <button
                  onClick={() => setShowUploader(true)}
                  className="px-6 py-3 bg-cardinal text-white rounded-lg hover:bg-cardinal-dark inline-flex items-center space-x-2"
                >
                  <Upload className="w-5 h-5" />
                  <span>Upload Your First Video</span>
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredVideos.map((video) => (
                <div
                  key={video.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      {/* Video Icon */}
                      <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        {video.status === 'completed' ? (
                          <PlayCircle className="w-8 h-8 text-cardinal" />
                        ) : (
                          <Video className="w-8 h-8 text-gray-400" />
                        )}
                      </div>

                      {/* Video Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 truncate">
                              {video.filename}
                            </h3>
                            <p className="text-sm text-gray-500 font-mono">
                              ID: {video.id}
                            </p>
                          </div>
                          <div className="flex items-center ml-4">
                            {getStatusIcon(video.status)}
                            <span className={`ml-2 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(video.status)}`}>
                              {video.status}
                            </span>
                          </div>
                        </div>

                        {/* Metadata */}
                        <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-3">
                          <div className="flex items-center space-x-1">
                            <HardDrive className="w-4 h-4" />
                            <span>{formatFileSize(video.size)}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4" />
                            <span>{formatDate(video.createdAt)}</span>
                          </div>
                          {video.transcodeJobId && (
                            <div className="flex items-center space-x-1">
                              <Loader2 className="w-4 h-4" />
                              <span className="font-mono text-xs">
                                Job: {video.transcodeJobId.slice(0, 16)}...
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Error Message */}
                        {video.status === 'error' && video.error && (
                          <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-700">{video.error}</p>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleCopyVideoId(video.id)}
                            className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center space-x-1.5 text-sm"
                          >
                            <Copy className="w-4 h-4" />
                            <span>Copy ID</span>
                          </button>

                          {video.status === 'completed' && (
                            <button
                              className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 flex items-center space-x-1.5 text-sm"
                            >
                              <Eye className="w-4 h-4" />
                              <span>Preview</span>
                            </button>
                          )}

                          <button
                            onClick={() => handleDeleteVideo(video.id)}
                            className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 flex items-center space-x-1.5 text-sm"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Stats Summary */}
          {videos.length > 0 && (
            <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Videos</p>
                    <p className="text-2xl font-bold text-gray-900">{videos.length}</p>
                  </div>
                  <Video className="w-8 h-8 text-gray-400" />
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Completed</p>
                    <p className="text-2xl font-bold text-green-600">{statusCounts.completed}</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-400" />
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Processing</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {statusCounts.uploading + statusCounts.transcoding}
                    </p>
                  </div>
                  <Loader2 className="w-8 h-8 text-orange-400" />
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Size</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatFileSize(videos.reduce((sum, v) => sum + v.size, 0))}
                    </p>
                  </div>
                  <HardDrive className="w-8 h-8 text-gray-400" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </CreatorAccessGate>
  )
}
