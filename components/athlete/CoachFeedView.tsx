'use client'

import { useState, useEffect } from 'react'
import { Heart, MessageCircle, Pin, Image as ImageIcon, Video, Link as LinkIcon, Rss } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'

interface Post {
  id: string
  coachName: string
  content: string
  mediaType?: 'image' | 'video' | 'link'
  mediaUrl?: string
  linkUrl?: string
  linkTitle?: string
  linkDescription?: string
  pinned: boolean
  likes: number
  comments: number
  createdAt: string
  updatedAt: string
}

export default function CoachFeedView() {
  const { user } = useAuth()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [coachName, setCoachName] = useState('Your Coach')

  useEffect(() => {
    if (user) {
      loadCoachFeed()
    }
  }, [user])

  const loadCoachFeed = async () => {
    setLoading(true)
    try {
      if (!user) return

      const token = await user.getIdToken()
      const response = await fetch('/api/athlete/coach-feed', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (!response.ok) throw new Error('Failed to load coach feed')

      const data = await response.json()
      setPosts(data.posts || [])

      // Set coach name from first post
      if (data.posts && data.posts.length > 0) {
        setCoachName(data.posts[0].coachName)
      }
    } catch (error) {
      console.error('Error loading coach feed:', error)
      setPosts([])
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      const now = new Date()
      const diffMs = now.getTime() - date.getTime()
      const diffMins = Math.floor(diffMs / 60000)
      const diffHours = Math.floor(diffMs / 3600000)
      const diffDays = Math.floor(diffMs / 86400000)

      if (diffMins < 60) {
        return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`
      } else if (diffHours < 24) {
        return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`
      } else if (diffDays < 7) {
        return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`
      } else {
        return date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        })
      }
    } catch {
      return 'Recently'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mb-4"></div>
          <p style={{ color: '#666' }}>Loading feed...</p>
        </div>
      </div>
    )
  }

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <Rss className="w-16 h-16 mb-4" style={{ color: '#CCC' }} />
        <h3 className="text-xl font-semibold mb-2" style={{ color: '#000000' }}>
          No posts yet
        </h3>
        <p style={{ color: '#666' }}>
          Your coach hasn't shared any updates. Check back soon!
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4 p-4 max-w-4xl mx-auto">
      {/* Feed Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Rss className="w-8 h-8" style={{ color: '#20B2AA' }} />
          <h2 className="text-2xl font-bold" style={{ color: '#000000' }}>
            {coachName}'s Feed
          </h2>
        </div>
        <p className="text-sm" style={{ color: '#666' }}>
          Updates, tips, and motivation from your coach
        </p>
      </div>

      {/* Posts */}
      {posts.map((post) => (
        <div
          key={post.id}
          className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 transition-all hover:shadow-xl"
        >
          {/* Post Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                {post.pinned && (
                  <span className="px-2 py-0.5 text-xs rounded-full bg-teal-100 text-teal-700 flex items-center gap-1">
                    <Pin className="w-3 h-3" />
                    PINNED
                  </span>
                )}
                <p className="text-sm font-semibold" style={{ color: '#000000' }}>
                  {post.coachName}
                </p>
              </div>
              <p className="text-xs" style={{ color: '#666' }}>
                {formatDate(post.createdAt)}
              </p>
            </div>
          </div>

          {/* Post Content */}
          <p className="text-base leading-relaxed whitespace-pre-wrap mb-4" style={{ color: '#000000' }}>
            {post.content}
          </p>

          {/* Media Display */}
          {post.mediaType === 'image' && post.mediaUrl && (
            <div className="mb-4">
              <img
                src={post.mediaUrl}
                alt="Post media"
                className="rounded-lg w-full max-h-96 object-cover"
              />
            </div>
          )}

          {post.mediaType === 'video' && post.mediaUrl && (
            <div className="mb-4">
              <div className="aspect-video rounded-lg overflow-hidden bg-gray-100">
                <iframe
                  src={post.mediaUrl}
                  className="w-full h-full"
                  title="Video"
                  allowFullScreen
                />
              </div>
            </div>
          )}

          {post.mediaType === 'link' && post.linkUrl && (
            <a
              href={post.linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block mb-4 p-4 bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-lg hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white shadow-sm flex items-center justify-center flex-shrink-0">
                  <LinkIcon className="w-5 h-5" style={{ color: '#91A6EB' }} />
                </div>
                <div className="flex-1 min-w-0">
                  {post.linkTitle && (
                    <p className="font-semibold mb-1 truncate" style={{ color: '#000000' }}>
                      {post.linkTitle}
                    </p>
                  )}
                  {post.linkDescription && (
                    <p className="text-sm mb-1" style={{ color: '#666' }}>
                      {post.linkDescription}
                    </p>
                  )}
                  <p className="text-xs truncate" style={{ color: '#91A6EB' }}>
                    {post.linkUrl}
                  </p>
                </div>
              </div>
            </a>
          )}

          {/* Engagement Stats */}
          <div className="flex items-center gap-6 pt-4 border-t border-gray-200">
            <button className="flex items-center gap-2 hover:text-red-500 transition-colors group">
              <Heart className="w-5 h-5 group-hover:fill-red-500" style={{ color: '#666' }} />
              <span className="text-sm" style={{ color: '#666' }}>{post.likes}</span>
            </button>
            <button className="flex items-center gap-2 hover:text-teal-500 transition-colors group">
              <MessageCircle className="w-5 h-5" style={{ color: '#666' }} />
              <span className="text-sm" style={{ color: '#666' }}>{post.comments}</span>
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
