'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import AppHeader from '@/components/ui/AppHeader'
import { storage } from '@/lib/firebase.client'
import { ref, uploadBytesResumable, uploadBytes, getDownloadURL } from 'firebase/storage'
import { SPORTS } from '@/lib/constants/sports'
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
  ExternalLink,
  X,
  AlertCircle
} from 'lucide-react'

interface VideoItem {
  id: string
  title: string
  description: string
  source: 'youtube' | 'vimeo' | 'direct' | 'upload'
  url: string
  thumbnail: string
  duration: number
  sport: string
  tags: string[]
  createdAt: string
  views: number
}

function AddVideoModal({ onClose }: { onClose: () => void }) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    source: 'youtube' as 'youtube' | 'vimeo' | 'direct' | 'upload',
    url: '',
    thumbnail: '',
    duration: '' as string | number,
    sport: 'baseball',
    tags: ''
  })
  const [extractingDuration, setExtractingDuration] = useState(false)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('video/')) {
        alert('Please select a valid video file')
        return
      }

      // Check file size (max 500MB)
      const maxSize = 500 * 1024 * 1024 // 500MB in bytes
      if (file.size > maxSize) {
        alert('File size must be less than 500MB')
        return
      }

      setVideoFile(file)

      // Auto-fill title if empty
      if (!formData.title) {
        const fileName = file.name.replace(/\.[^/.]+$/, '') // Remove extension
        setFormData({ ...formData, title: fileName })
      }

      // Extract video duration
      extractVideoDuration(file)
    }
  }

  const extractVideoDuration = (file: File) => {
    setExtractingDuration(true)
    const video = document.createElement('video')
    video.preload = 'metadata'
    
    // Set a timeout to prevent hanging
    const timeout = setTimeout(() => {
      console.warn('Video duration extraction timed out')
      setFormData(prev => ({ ...prev, duration: 0 }))
      setExtractingDuration(false)
      URL.revokeObjectURL(video.src)
    }, 10000) // 10 second timeout
    
    video.onloadedmetadata = () => {
      clearTimeout(timeout)
      const durationSeconds = video.duration
      const durationMinutes = Math.round(durationSeconds / 60)
      console.log('Video duration extracted:', durationSeconds, 'seconds =', durationMinutes, 'minutes')
      
      if (durationSeconds > 0 && isFinite(durationSeconds)) {
        setFormData(prev => ({ ...prev, duration: durationMinutes }))
      } else {
        console.warn('Invalid video duration:', durationSeconds)
        setFormData(prev => ({ ...prev, duration: 0 }))
      }
      
      setExtractingDuration(false)
      URL.revokeObjectURL(video.src)
    }
    
    video.onerror = () => {
      clearTimeout(timeout)
      console.warn('Could not extract video duration')
      setFormData(prev => ({ ...prev, duration: 0 }))
      setExtractingDuration(false)
      URL.revokeObjectURL(video.src)
    }
    
    video.src = URL.createObjectURL(file)
  }

  const uploadVideoFile = async (): Promise<{ url: string; thumbnail?: string } | null> => {
    if (!videoFile || !user) return null

    setUploading(true)
    setUploadProgress(0)

    try {
      const timestamp = Date.now()
      const fileName = `${timestamp}-${videoFile.name}`
      const storageRef = ref(storage, `coach-videos/${user.uid}/${fileName}`)

      const uploadTask = uploadBytesResumable(storageRef, videoFile)

      return new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
            setUploadProgress(Math.round(progress))
          },
          (error) => {
            console.error('Upload error:', error)
            setUploading(false)
            reject(error)
          },
          async () => {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref)
            
            // Generate thumbnail for uploaded video
            let thumbnailUrl: string | null = null
            try {
              console.log('Generating thumbnail for uploaded video...')
              const canvas = document.createElement('canvas')
              const video = document.createElement('video')
              video.crossOrigin = 'anonymous'
              video.muted = true
              video.src = URL.createObjectURL(videoFile)
              
              await new Promise<void>((resolveThumb) => {
                const timeout = setTimeout(() => {
                  console.warn('Thumbnail generation timed out')
                  URL.revokeObjectURL(video.src)
                  resolveThumb()
                }, 10000) // 10 second timeout
                
                video.onloadeddata = () => {
                  console.log('Video loaded for thumbnail generation')
                  video.currentTime = Math.min(1, video.duration / 2) // Seek to 1 second or middle of video
                }
                
                video.onseeked = () => {
                  console.log('Video seeked, generating thumbnail...')
                  canvas.width = video.videoWidth
                  canvas.height = video.videoHeight
                  const ctx = canvas.getContext('2d')
                  if (ctx) {
                    // Clear canvas with white background
                    ctx.fillStyle = '#ffffff'
                    ctx.fillRect(0, 0, canvas.width, canvas.height)
                    // Draw video frame to canvas
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
                    canvas.toBlob(async (blob) => {
                      clearTimeout(timeout)
                      if (blob) {
                        try {
                          const thumbnailRef = ref(storage, `coach-videos/${user.uid}/thumbnails/${timestamp}-thumb.jpg`)
                          await uploadBytes(thumbnailRef, blob)
                          thumbnailUrl = await getDownloadURL(thumbnailRef)
                          console.log('✅ Thumbnail generated successfully:', thumbnailUrl)
                        } catch (err) {
                          console.warn('❌ Thumbnail upload failed:', err)
                        }
                      } else {
                        console.warn('❌ Failed to create thumbnail blob')
                      }
                      URL.revokeObjectURL(video.src)
                      resolveThumb()
                    }, 'image/jpeg', 0.8)
                  } else {
                    console.warn('❌ Could not get canvas context for thumbnail generation')
                    clearTimeout(timeout)
                    URL.revokeObjectURL(video.src)
                    resolveThumb()
                  }
                }
                
                video.onerror = (error) => {
                  console.warn('❌ Video failed to load for thumbnail generation:', error)
                  clearTimeout(timeout)
                  URL.revokeObjectURL(video.src)
                  resolveThumb()
                }
              })
            } catch (err) {
              console.warn('❌ Thumbnail generation failed:', err)
            }
            
            setUploading(false)
            resolve({ url: downloadURL, thumbnail: thumbnailUrl || undefined })
          }
        )
      })
    } catch (error) {
      setUploading(false)
      throw error
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (!user) throw new Error('Not authenticated')

      let videoUrl = formData.url

      // If upload source, upload the file first
      let thumbnailUrl = formData.thumbnail
      if (formData.source === 'upload') {
        if (!videoFile) {
          throw new Error('Please select a video file to upload')
        }
        const uploadResult = await uploadVideoFile()
        if (!uploadResult) {
          throw new Error('Failed to upload video file')
        }
        videoUrl = uploadResult.url
        thumbnailUrl = uploadResult.thumbnail || formData.thumbnail
      }

      const token = await user.getIdToken()
      const response = await fetch('/api/coach/videos', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          url: videoUrl,
          thumbnail: thumbnailUrl,
          duration: formData.duration === '' ? 0 : typeof formData.duration === 'string' ? parseInt(formData.duration) || 0 : formData.duration,
          tags: formData.tags.split(',').map(t => t.trim()).filter(t => t)
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to add video')
      }

      alert('Video added successfully!')
      onClose()
    } catch (error) {
      console.error('Error adding video:', error)
      alert(error instanceof Error ? error.message : 'Failed to add video')
    } finally {
      setLoading(false)
      setUploading(false)
      setUploadProgress(0)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold" style={{ color: '#000000' }}>Add Video</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            type="button"
          >
            <Plus className="w-5 h-5 rotate-45" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#000000' }}>
              Video Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="e.g., Advanced Batting Techniques"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#000000' }}>
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="Describe what's covered in this video..."
              rows={3}
            />
          </div>

          {/* Source Type */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#000000' }}>
              Video Source *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex items-center gap-2 cursor-pointer p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="source"
                  value="youtube"
                  checked={formData.source === 'youtube'}
                  onChange={(e) => setFormData({ ...formData, source: e.target.value as 'youtube' })}
                  className="w-4 h-4"
                />
                <Youtube className="w-5 h-5 text-red-600" />
                <span>YouTube</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="source"
                  value="vimeo"
                  checked={formData.source === 'vimeo'}
                  onChange={(e) => setFormData({ ...formData, source: e.target.value as 'vimeo' })}
                  className="w-4 h-4"
                />
                <Video className="w-5 h-5" style={{ color: '#1ab7ea' }} />
                <span>Vimeo</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="source"
                  value="direct"
                  checked={formData.source === 'direct'}
                  onChange={(e) => setFormData({ ...formData, source: e.target.value as 'direct' })}
                  className="w-4 h-4"
                />
                <LinkIcon className="w-5 h-5" />
                <span>Direct Link</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer p-3 border-2 border-black rounded-lg hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="source"
                  value="upload"
                  checked={formData.source === 'upload'}
                  onChange={(e) => setFormData({ ...formData, source: e.target.value as 'upload' })}
                  className="w-4 h-4"
                />
                <Upload className="w-5 h-5" />
                <span className="font-semibold">Upload File</span>
              </label>
            </div>
          </div>

          {/* File Upload (when source is 'upload') */}
          {formData.source === 'upload' && (
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 space-y-3">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#000000' }}>
                  Select Video File * <span className="text-xs text-gray-600">(Max 500MB)</span>
                </label>
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleFileSelect}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-black file:text-white hover:file:bg-gray-800 cursor-pointer"
                  required
                />
                {videoFile && (
                  <div className="mt-2 text-sm text-gray-700">
                    <p><strong>Selected:</strong> {videoFile.name}</p>
                    <p><strong>Size:</strong> {(videoFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                  </div>
                )}
              </div>

              {uploading && (
                <div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span style={{ color: '#000000' }}>Uploading video...</span>
                    <span style={{ color: '#000000' }} className="font-semibold">{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div
                      className="h-full bg-black transition-all duration-300 rounded-full"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* URL (hidden when uploading file) */}
          {formData.source !== 'upload' && (
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#000000' }}>
                Video URL *
              </label>
              <input
                type="url"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                placeholder={
                  formData.source === 'youtube' ? 'https://www.youtube.com/watch?v=...' :
                  formData.source === 'vimeo' ? 'https://vimeo.com/...' :
                  'https://example.com/video.mp4'
                }
                required
              />
            </div>
          )}

          {/* Sport */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#000000' }}>
              Sport *
            </label>
            <select
              value={formData.sport}
              onChange={(e) => setFormData({ ...formData, sport: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              required
            >
              <option value="">Select sport...</option>
              {SPORTS.map((sport) => (
                <option key={sport} value={sport.toLowerCase().replace(/\s+/g, '_')}>
                  {sport}
                </option>
              ))}
            </select>
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#000000' }}>
              Duration (minutes)
              {extractingDuration && (
                <span className="ml-2 text-sm text-blue-600">Extracting duration...</span>
              )}
            </label>
            <input
              type="number"
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: e.target.value === '' ? '' : parseInt(e.target.value) || '' })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              placeholder={extractingDuration ? "Extracting..." : "e.g., 10"}
              disabled={extractingDuration}
              min="0"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#000000' }}>
              Tags (comma-separated)
            </label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="batting, technique, advanced"
            />
          </div>

          {/* Thumbnail URL (optional) */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#000000' }}>
              Thumbnail URL (optional)
            </label>
            <input
              type="url"
              value={formData.thumbnail}
              onChange={(e) => setFormData({ ...formData, thumbnail: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="https://example.com/thumbnail.jpg"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={loading || uploading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              disabled={loading || uploading}
            >
              {uploading ? (
                <>
                  <Upload className="w-4 h-4 animate-pulse" />
                  Uploading {uploadProgress}%
                </>
              ) : loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Video'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function VideoManagerPageContent() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const embedded = searchParams.get('embedded') === 'true'

  const [videos, setVideos] = useState<VideoItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [sportFilter, setSportFilter] = useState('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [playingVideo, setPlayingVideo] = useState<VideoItem | null>(null)

  // Load videos from API
  useEffect(() => {
    if (user) {
      loadVideos()
    }
  }, [user])

  const loadVideos = async () => {
    setLoading(true)
    try {
      if (!user) { console.error('No user found'); return; }

      if (!user) { console.error('No user found'); return; }
      const token = await user.getIdToken()
      const response = await fetch('/api/coach/videos', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to load videos')
      }

      const data = await response.json()
      setVideos(data.videos || [])
    } catch (error) {
      console.error('Error loading videos:', error)
      setVideos([])
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (videoId: string, videoTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${videoTitle}"? This cannot be undone.`)) return

    try {
      if (!user) { console.error('No user found'); return; }

      if (!user) { console.error('No user found'); return; }
      const token = await user.getIdToken()
      const response = await fetch('/api/coach/videos', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ videoId })
      })

      if (!response.ok) {
        throw new Error('Failed to delete video')
      }

      alert('Video deleted successfully')
      loadVideos()
    } catch (error) {
      console.error('Error deleting video:', error)
      alert('Failed to delete video')
    }
  }

  const handlePlayVideo = (video: VideoItem) => {
    setPlayingVideo(video)
  }

  const getVideoEmbedUrl = (video: VideoItem) => {
    if (video.source === 'youtube') {
      // Extract video ID from YouTube URL
      const videoId = video.url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)?.[1]
      return videoId ? `https://www.youtube.com/embed/${videoId}` : video.url
    } else if (video.source === 'vimeo') {
      // Extract video ID from Vimeo URL
      const videoId = video.url.match(/vimeo\.com\/(\d+)/)?.[1]
      return videoId ? `https://player.vimeo.com/video/${videoId}` : video.url
    } else {
      // Direct video URL
      return video.url
    }
  }


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
          <h2 className="text-2xl mb-2" style={{ color: '#000000' }}>Access Denied</h2>
          <p className="mb-6" style={{ color: '#000000', opacity: 0.7 }}>
            You must be logged in as a coach to access this page.
          </p>
          {!embedded && (
            <button
              onClick={() => router.push('/')}
              className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
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
        <AppHeader title="Video Manager" subtitle="Organize and embed your training videos" />
      )}

      <main className={`w-full ${embedded ? 'p-4' : 'max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6'} space-y-6`}>
        {/* Header */}
        {embedded && (
          <div className="mb-4">
            <div className="flex items-center gap-3 mb-2">
              <Video className="w-8 h-8" style={{ color: '#FF6B35' }} />
              <h1 className="text-3xl" style={{ color: '#000000' }}>Video Manager</h1>
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
                <p className="text-sm" style={{ color: '#000000', opacity: 0.7 }}>Total Videos</p>
                <p className="text-3xl" style={{ color: '#000000' }}>{videos.length}</p>
              </div>
              <Video className="w-10 h-10" style={{ color: '#91A6EB', opacity: 0.3 }} />
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border border-white/50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm" style={{ color: '#000000', opacity: 0.7 }}>Total Views</p>
                <p className="text-3xl" style={{ color: '#000000' }}>
                  {videos.reduce((sum, v) => sum + v.views, 0)}
                </p>
              </div>
              <Play className="w-10 h-10" style={{ color: '#20B2AA', opacity: 0.3 }} />
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border border-white/50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm" style={{ color: '#000000', opacity: 0.7 }}>Total Duration</p>
                <p className="text-3xl" style={{ color: '#000000' }}>
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
              className="px-5 py-2.5 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2"
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
        {loading ? (
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-black mb-4"></div>
            <p style={{ color: '#000000', opacity: 0.7 }}>Loading videos...</p>
          </div>
        ) : filteredVideos.length === 0 ? (
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-12 text-center">
            <Video className="w-16 h-16 mx-auto mb-4" style={{ color: '#000000', opacity: 0.3 }} />
            <h3 className="text-xl mb-2" style={{ color: '#000000' }}>
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
                className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors inline-flex items-center gap-2"
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
                <div 
                  className="relative aspect-video bg-gray-900 flex items-center justify-center cursor-pointer hover:bg-gray-800 transition-colors overflow-hidden"
                  onClick={() => handlePlayVideo(video)}
                >
                  {video.thumbnail ? (
                    <>
                      <img 
                        src={video.thumbnail} 
                        alt={video.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          console.warn('Thumbnail failed to load:', video.thumbnail);
                          e.currentTarget.style.display = 'none';
                          const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                          if (fallback) fallback.style.display = 'flex';
                        }}
                      />
                      <div className="absolute inset-0 bg-gray-900 flex items-center justify-center" style={{ display: 'none' }}>
                        <Play className="w-16 h-16 text-white opacity-70" />
                      </div>
                    </>
                  ) : video.source === 'youtube' ? (
                    <>
                      <img 
                        src={`https://img.youtube.com/vi/${video.url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)?.[1]}/maxresdefault.jpg`}
                        alt={video.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          console.warn('YouTube thumbnail failed to load');
                          e.currentTarget.style.display = 'none';
                          const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                          if (fallback) fallback.style.display = 'flex';
                        }}
                      />
                      <div className="absolute inset-0 bg-gray-900 flex items-center justify-center" style={{ display: 'none' }}>
                        <Play className="w-16 h-16 text-white opacity-70" />
                      </div>
                    </>
                  ) : video.source === 'vimeo' ? (
                    <>
                      <img 
                        src={`https://vumbnail.com/${video.url.match(/vimeo\.com\/(\d+)/)?.[1]}.jpg`}
                        alt={video.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          console.warn('Vimeo thumbnail failed to load');
                          e.currentTarget.style.display = 'none';
                          const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                          if (fallback) fallback.style.display = 'flex';
                        }}
                      />
                      <div className="absolute inset-0 bg-gray-900 flex items-center justify-center" style={{ display: 'none' }}>
                        <Play className="w-16 h-16 text-white opacity-70" />
                      </div>
                    </>
                  ) : (
                    <Play className="w-16 h-16 text-white opacity-70" />
                  )}
                  
                  {/* Play overlay */}
                  <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                      <Play className="w-8 h-8 text-white ml-1" />
                    </div>
                  </div>
                  
                  {/* Duration badge */}
                  <div className="absolute top-2 right-2 px-2 py-1 bg-black/70 text-white text-xs rounded">
                    {video.duration}m
                  </div>
                  
                  {/* Sport badge */}
                  <div className="absolute bottom-2 left-2 px-2 py-1 rounded text-xs text-white" style={{ backgroundColor: getSportColor(video.sport) }}>
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
                      onClick={() => handlePlayVideo(video)}
                      className="flex-1 px-3 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 text-sm"
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
                      onClick={() => handleDelete(video.id, video.title)}
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

        {/* Add Video Modal */}
        {showAddModal && <AddVideoModal onClose={() => {
          setShowAddModal(false)
          loadVideos() // Reload videos after adding
        }} />}

        {/* Video Player Modal */}
        {playingVideo && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{playingVideo.title}</h3>
                  <p className="text-sm text-gray-600">{playingVideo.sport} • {playingVideo.duration}m</p>
                </div>
                <button
                  onClick={() => setPlayingVideo(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              {/* Video Player */}
              <div className="aspect-video bg-black">
                {playingVideo.source === 'youtube' || playingVideo.source === 'vimeo' ? (
                  <iframe
                    src={getVideoEmbedUrl(playingVideo)}
                    title={playingVideo.title}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <video
                    src={playingVideo.url}
                    controls
                    className="w-full h-full"
                    autoPlay
                  >
                    Your browser does not support the video tag.
                  </video>
                )}
              </div>

              {/* Video Info */}
              <div className="p-4">
                <p className="text-gray-700 mb-3">{playingVideo.description}</p>
                <div className="flex flex-wrap gap-1">
                  {playingVideo.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
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
