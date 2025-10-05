'use client'

import { useState, useEffect } from 'react'
import { Play } from 'lucide-react'

interface LessonVideoPlayerProps {
  videoUrl?: string
  videoId?: string // GCS video ID
  title?: string
}

export default function LessonVideoPlayer({ videoUrl, videoId, title }: LessonVideoPlayerProps) {
  const [playbackUrl, setPlaybackUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Check if URL is a YouTube link
  const isYouTubeUrl = (url: string): boolean => {
    return /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i.test(url)
  }

  // Extract YouTube video ID
  const getYouTubeId = (url: string): string | null => {
    const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i)
    return match ? match[1] : null
  }

  // Check if it's a GCS video URL
  const isGCSUrl = (url: string): boolean => {
    return url.includes('storage.googleapis.com') || url.includes('firebasestorage.googleapis.com')
  }

  useEffect(() => {
    // If we have a GCS videoId, fetch the signed playback URL
    if (videoId && !videoUrl) {
      fetchGCSPlaybackUrl()
    }
  }, [videoId, videoUrl])

  const fetchGCSPlaybackUrl = async () => {
    if (!videoId) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/video/playback?videoId=${videoId}`)
      const data = await response.json()

      if (data.success && data.hlsUrl) {
        setPlaybackUrl(data.hlsUrl)
      } else {
        setError('Unable to load video')
      }
    } catch (err) {
      console.error('Error fetching playback URL:', err)
      setError('Failed to load video')
    } finally {
      setLoading(false)
    }
  }

  // Determine video type and render appropriately
  if (videoUrl) {
    // YouTube embed
    if (isYouTubeUrl(videoUrl)) {
      const youtubeId = getYouTubeId(videoUrl)
      if (!youtubeId) {
        return (
          <div className="aspect-video bg-gradient-to-br from-sky-blue/10 to-cream rounded-xl flex items-center justify-center border-2 border-red-500/20">
            <p className="text-red-600">Invalid YouTube URL</p>
          </div>
        )
      }

      return (
        <div className="aspect-video rounded-xl overflow-hidden border-2 border-sky-blue/20 shadow-lg">
          <iframe
            src={`https://www.youtube.com/embed/${youtubeId}?rel=0&modestbranding=1`}
            title={title || 'Lesson Video'}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="w-full h-full"
          />
        </div>
      )
    }

    // GCS or other video URL
    if (isGCSUrl(videoUrl)) {
      return (
        <div className="aspect-video rounded-xl overflow-hidden border-2 border-sky-blue/20 shadow-lg">
          <video
            controls
            className="w-full h-full bg-black"
            src={videoUrl}
            title={title || 'Lesson Video'}
          >
            <source src={videoUrl} type="application/x-mpegURL" />
            Your browser does not support the video tag.
          </video>
        </div>
      )
    }

    // Direct video URL (mp4, etc.)
    return (
      <div className="aspect-video rounded-xl overflow-hidden border-2 border-sky-blue/20 shadow-lg">
        <video
          controls
          className="w-full h-full bg-black"
          src={videoUrl}
          title={title || 'Lesson Video'}
        >
          Your browser does not support the video tag.
        </video>
      </div>
    )
  }

  // GCS video by ID
  if (videoId) {
    if (loading) {
      return (
        <div className="aspect-video bg-gradient-to-br from-sky-blue/10 to-cream rounded-xl flex items-center justify-center border-2 border-sky-blue/20">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-sky-blue border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-dark/60">Loading video...</p>
          </div>
        </div>
      )
    }

    if (error) {
      return (
        <div className="aspect-video bg-gradient-to-br from-red-50 to-cream rounded-xl flex items-center justify-center border-2 border-red-500/20">
          <div className="text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Play className="w-6 h-6 text-red-600" />
            </div>
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      )
    }

    if (playbackUrl) {
      return (
        <div className="aspect-video rounded-xl overflow-hidden border-2 border-sky-blue/20 shadow-lg">
          <video
            controls
            className="w-full h-full bg-black"
            src={playbackUrl}
            title={title || 'Lesson Video'}
          >
            <source src={playbackUrl} type="application/x-mpegURL" />
            Your browser does not support the video tag.
          </video>
        </div>
      )
    }
  }

  // No video available - show placeholder
  return (
    <div className="aspect-video bg-gradient-to-br from-sky-blue/10 to-cream rounded-xl flex items-center justify-center border-2 border-sky-blue/20">
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-sky-blue to-black rounded-full flex items-center justify-center mx-auto mb-4">
          <Play className="w-8 h-8 text-white" />
        </div>
        <p className="text-dark/60">Text-based lesson content</p>
      </div>
    </div>
  )
}
