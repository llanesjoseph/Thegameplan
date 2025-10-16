'use client'

import { useState, useEffect, Suspense, useRef } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useSearchParams, useRouter } from 'next/navigation'
import AppHeader from '@/components/ui/AppHeader'
import { storage } from '@/lib/firebase.client'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import {
  MessageSquare,
  Plus,
  Image as ImageIcon,
  Video,
  Link as LinkIcon,
  Pin,
  Edit,
  Trash2,
  Send,
  X,
  Heart,
  MessageCircle,
  AlertCircle,
  Upload
} from 'lucide-react'

interface Post {
  id: string
  content: string
  mediaType?: 'image' | 'video' | 'link'
  mediaUrl?: string
  linkUrl?: string
  linkTitle?: string
  linkDescription?: string
  pinned: boolean
  likes: number
  comments: number
  audience: 'assigned' | 'followers' | 'public'
  createdAt: string
  updatedAt: string
}

function CoachFeedPageContent() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const embedded = searchParams.get('embedded') === 'true'

  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [showComposer, setShowComposer] = useState(false)
  const [editingPost, setEditingPost] = useState<Post | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Composer form state
  const [newPost, setNewPost] = useState({
    content: '',
    mediaType: '' as '' | 'image' | 'video' | 'link',
    mediaUrl: '',
    linkUrl: '',
    linkTitle: '',
    linkDescription: '',
    pinned: false,
    audience: 'assigned' as 'assigned' | 'followers' | 'public'
  })

  useEffect(() => {
    if (user) {
      loadPosts()
    }
  }, [user])

  const loadPosts = async () => {
    setLoading(true)
    try {
      if (!user) return

      const token = await user.getIdToken()
      const response = await fetch('/api/coach/posts', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (!response.ok) throw new Error('Failed to load posts')

      const data = await response.json()
      setPosts(data.posts || [])
    } catch (error) {
      console.error('Error loading posts:', error)
      setPosts([])
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePost = async () => {
    if (!newPost.content.trim()) {
      alert('Please write some content for your post')
      return
    }

    try {
      if (!user) return

      const token = await user.getIdToken()
      const response = await fetch('/api/coach/posts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newPost)
      })

      if (!response.ok) throw new Error('Failed to create post')

      alert('✅ Post published successfully!')
      setShowComposer(false)
      setNewPost({
        content: '',
        mediaType: '',
        mediaUrl: '',
        linkUrl: '',
        linkTitle: '',
        linkDescription: '',
        pinned: false,
        audience: 'assigned'
      })
      loadPosts()
    } catch (error) {
      console.error('Error creating post:', error)
      alert('❌ Failed to create post')
    }
  }

  const handleUpdatePost = async () => {
    if (!editingPost || !newPost.content.trim()) {
      alert('Please write some content for your post')
      return
    }

    try {
      if (!user) return

      const token = await user.getIdToken()
      const response = await fetch('/api/coach/posts', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          postId: editingPost.id,
          ...newPost
        })
      })

      if (!response.ok) throw new Error('Failed to update post')

      alert('✅ Post updated successfully!')
      setShowComposer(false)
      setEditingPost(null)
      setNewPost({
        content: '',
        mediaType: '',
        mediaUrl: '',
        linkUrl: '',
        linkTitle: '',
        linkDescription: '',
        pinned: false,
        audience: 'assigned'
      })
      loadPosts()
    } catch (error) {
      console.error('Error updating post:', error)
      alert('❌ Failed to update post')
    }
  }

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return

    try {
      if (!user) return

      const token = await user.getIdToken()
      const response = await fetch('/api/coach/posts', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ postId })
      })

      if (!response.ok) throw new Error('Failed to delete post')

      alert('✅ Post deleted successfully')
      loadPosts()
    } catch (error) {
      console.error('Error deleting post:', error)
      alert('❌ Failed to delete post')
    }
  }

  const handleEditPost = (post: Post) => {
    setEditingPost(post)
    setNewPost({
      content: post.content,
      mediaType: post.mediaType || '',
      mediaUrl: post.mediaUrl || '',
      linkUrl: post.linkUrl || '',
      linkTitle: post.linkTitle || '',
      linkDescription: post.linkDescription || '',
      pinned: post.pinned,
      audience: post.audience || 'assigned'
    })
    // Set image preview if editing a post with an image
    if (post.mediaType === 'image' && post.mediaUrl) {
      setImagePreview(post.mediaUrl)
    }
    setShowComposer(true)
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('Image must be less than 10MB')
      return
    }

    try {
      setUploadingImage(true)

      // Create storage reference
      const timestamp = Date.now()
      const fileName = `${timestamp}_${file.name}`
      const storageRef = ref(storage, `coach-posts/${user?.uid}/${fileName}`)

      // Upload file
      await uploadBytes(storageRef, file)

      // Get download URL
      const downloadURL = await getDownloadURL(storageRef)

      // Update state
      setNewPost({ ...newPost, mediaUrl: downloadURL })
      setImagePreview(downloadURL)

      alert('✅ Image uploaded successfully!')
    } catch (error) {
      console.error('Error uploading image:', error)
      alert('❌ Failed to upload image. Please try again.')
    } finally {
      setUploadingImage(false)
    }
  }

  const handleCancelComposer = () => {
    setShowComposer(false)
    setEditingPost(null)
    setImagePreview(null)
    setNewPost({
      content: '',
      mediaType: '',
      mediaUrl: '',
      linkUrl: '',
      linkTitle: '',
      linkDescription: '',
      pinned: false,
      audience: 'assigned'
    })
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      })
    } catch {
      return 'Date unavailable'
    }
  }

  // Show loading state while checking auth
  if (authLoading) {
    return (
      <div style={{ backgroundColor: embedded ? 'transparent' : '#E8E6D8' }} className={embedded ? 'p-12' : 'min-h-screen flex items-center justify-center'}>
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-black mb-4"></div>
          <p style={{ color: '#000000', opacity: 0.7 }}>Loading...</p>
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
        <AppHeader title="Coach's Feed" subtitle="Share updates with your athletes" />
      )}

      <main className={`w-full ${embedded ? 'p-4' : 'max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6'} space-y-6`}>
        {/* Header */}
        {embedded && (
          <div className="mb-4">
            <div className="flex items-center gap-3 mb-2">
              <MessageSquare className="w-8 h-8" style={{ color: '#20B2AA' }} />
              <h1 className="text-3xl" style={{ color: '#000000' }}>Coach's Feed</h1>
            </div>
            <p style={{ color: '#000000', opacity: 0.7 }}>
              Share motivational content, tips, and updates with your athletes
            </p>
          </div>
        )}

        {/* Create Post Button */}
        <div>
          <button
            onClick={() => setShowComposer(true)}
            className="px-6 py-3 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-lg hover:from-teal-600 hover:to-teal-700 transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Create Post
          </button>
        </div>

        {/* Post Composer Modal */}
        {showComposer && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl" style={{ color: '#000000' }}>
                  {editingPost ? 'Edit Post' : 'Create New Post'}
                </h2>
                <button
                  onClick={handleCancelComposer}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Content Textarea */}
                <div>
                  <label className="block text-sm mb-2 font-semibold" style={{ color: '#000000' }}>
                    What's on your mind? *
                  </label>
                  <textarea
                    value={newPost.content}
                    onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                    placeholder="Share a motivational message, training tip, or update with your athletes..."
                    rows={6}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                  />
                </div>

                {/* Media Type Selection */}
                <div>
                  <label className="block text-sm mb-2 font-semibold" style={{ color: '#000000' }}>
                    Add Media (Optional)
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      onClick={() => setNewPost({ ...newPost, mediaType: newPost.mediaType === 'image' ? '' : 'image' })}
                      className={`p-4 border-2 rounded-lg transition-all ${
                        newPost.mediaType === 'image'
                          ? 'border-teal-500 bg-teal-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <ImageIcon className="w-6 h-6 mx-auto mb-2" style={{ color: '#20B2AA' }} />
                      <p className="text-xs font-semibold">Photo</p>
                    </button>

                    <button
                      onClick={() => setNewPost({ ...newPost, mediaType: newPost.mediaType === 'video' ? '' : 'video' })}
                      className={`p-4 border-2 rounded-lg transition-all ${
                        newPost.mediaType === 'video'
                          ? 'border-teal-500 bg-teal-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Video className="w-6 h-6 mx-auto mb-2" style={{ color: '#FF6B35' }} />
                      <p className="text-xs font-semibold">Video</p>
                    </button>

                    <button
                      onClick={() => setNewPost({ ...newPost, mediaType: newPost.mediaType === 'link' ? '' : 'link' })}
                      className={`p-4 border-2 rounded-lg transition-all ${
                        newPost.mediaType === 'link'
                          ? 'border-teal-500 bg-teal-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <LinkIcon className="w-6 h-6 mx-auto mb-2" style={{ color: '#91A6EB' }} />
                      <p className="text-xs font-semibold">Link</p>
                    </button>
                  </div>
                </div>

                {/* Image Upload / URL Input */}
                {newPost.mediaType === 'image' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm mb-2 font-semibold" style={{ color: '#000000' }}>
                        Upload Photo
                      </label>
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingImage}
                        className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-teal-500 hover:bg-teal-50 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {uploadingImage ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-teal-600"></div>
                            <span>Uploading...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-5 h-5 text-teal-600" />
                            <span className="font-medium">Click to upload photo</span>
                          </>
                        )}
                      </button>
                      <p className="text-xs mt-2 text-center" style={{ color: '#666' }}>
                        JPG, PNG, GIF up to 10MB
                      </p>
                    </div>

                    {/* Image Preview */}
                    {imagePreview && (
                      <div className="relative">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-full rounded-lg max-h-64 object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setImagePreview(null)
                            setNewPost({ ...newPost, mediaUrl: '' })
                          }}
                          className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}

                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300"></div>
                      </div>
                      <div className="relative flex justify-center text-xs">
                        <span className="bg-white px-2" style={{ color: '#666' }}>OR</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm mb-2" style={{ color: '#000000' }}>
                        Image URL (alternative)
                      </label>
                      <input
                        type="url"
                        value={newPost.mediaUrl}
                        onChange={(e) => {
                          setNewPost({ ...newPost, mediaUrl: e.target.value })
                          setImagePreview(e.target.value)
                        }}
                        placeholder="https://example.com/image.jpg"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                        disabled={uploadingImage}
                      />
                    </div>
                  </div>
                )}

                {/* Video URL Input */}
                {newPost.mediaType === 'video' && (
                  <div>
                    <label className="block text-sm mb-2" style={{ color: '#000000' }}>
                      Video URL
                    </label>
                    <input
                      type="url"
                      value={newPost.mediaUrl}
                      onChange={(e) => setNewPost({ ...newPost, mediaUrl: e.target.value })}
                      placeholder="Enter video URL (e.g., YouTube link)"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                    <p className="text-xs mt-1" style={{ color: '#666' }}>
                      💡 Paste a YouTube, Vimeo, or other video URL
                    </p>
                  </div>
                )}

                {/* Link Fields */}
                {newPost.mediaType === 'link' && (
                  <>
                    <div>
                      <label className="block text-sm mb-2" style={{ color: '#000000' }}>
                        Link URL
                      </label>
                      <input
                        type="url"
                        value={newPost.linkUrl}
                        onChange={(e) => setNewPost({ ...newPost, linkUrl: e.target.value })}
                        placeholder="https://example.com"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm mb-2" style={{ color: '#000000' }}>
                        Link Title
                      </label>
                      <input
                        type="text"
                        value={newPost.linkTitle}
                        onChange={(e) => setNewPost({ ...newPost, linkTitle: e.target.value })}
                        placeholder="Optional: Give this link a title"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm mb-2" style={{ color: '#000000' }}>
                        Link Description
                      </label>
                      <textarea
                        value={newPost.linkDescription}
                        onChange={(e) => setNewPost({ ...newPost, linkDescription: e.target.value })}
                        placeholder="Optional: Describe what this link is about"
                        rows={2}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                      />
                    </div>
                  </>
                )}

                {/* Audience Selector */}
                <div>
                  <label className="block text-sm mb-3 font-semibold" style={{ color: '#000000' }}>
                    Who can see this post? *
                  </label>
                  <div className="space-y-3">
                    <label className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      newPost.audience === 'assigned'
                        ? 'border-teal-500 bg-teal-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}>
                      <input
                        type="radio"
                        name="audience"
                        value="assigned"
                        checked={newPost.audience === 'assigned'}
                        onChange={(e) => setNewPost({ ...newPost, audience: 'assigned' })}
                        className="mt-1 w-4 h-4"
                      />
                      <div className="ml-3 flex-1">
                        <p className="font-semibold text-sm" style={{ color: '#000000' }}>
                          Assigned Athletes Only
                        </p>
                        <p className="text-xs mt-1" style={{ color: '#666' }}>
                          Private coaching tips and feedback for your assigned athletes
                        </p>
                      </div>
                    </label>

                    <label className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      newPost.audience === 'followers'
                        ? 'border-teal-500 bg-teal-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}>
                      <input
                        type="radio"
                        name="audience"
                        value="followers"
                        checked={newPost.audience === 'followers'}
                        onChange={(e) => setNewPost({ ...newPost, audience: 'followers' })}
                        className="mt-1 w-4 h-4"
                      />
                      <div className="ml-3 flex-1">
                        <p className="font-semibold text-sm" style={{ color: '#000000' }}>
                          Followers Only
                        </p>
                        <p className="text-xs mt-1" style={{ color: '#666' }}>
                          Broader motivational content for anyone following you
                        </p>
                      </div>
                    </label>

                    <label className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      newPost.audience === 'public'
                        ? 'border-teal-500 bg-teal-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}>
                      <input
                        type="radio"
                        name="audience"
                        value="public"
                        checked={newPost.audience === 'public'}
                        onChange={(e) => setNewPost({ ...newPost, audience: 'public' })}
                        className="mt-1 w-4 h-4"
                      />
                      <div className="ml-3 flex-1">
                        <p className="font-semibold text-sm" style={{ color: '#000000' }}>
                          Public / Everyone
                        </p>
                        <p className="text-xs mt-1" style={{ color: '#666' }}>
                          General platform announcements visible to all users
                        </p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Pin Checkbox */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="pinned"
                    checked={newPost.pinned}
                    onChange={(e) => setNewPost({ ...newPost, pinned: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <label htmlFor="pinned" className="text-sm" style={{ color: '#000000' }}>
                    📌 Pin this post to the top of your feed
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={editingPost ? handleUpdatePost : handleCreatePost}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-lg hover:from-teal-600 hover:to-teal-700 transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  <Send className="w-5 h-5" />
                  {editingPost ? 'Update Post' : 'Publish Post'}
                </button>
                <button
                  onClick={handleCancelComposer}
                  className="px-6 py-3 bg-white border-2 border-gray-300 text-black rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Posts List */}
        {loading ? (
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-black mb-4"></div>
            <p style={{ color: '#000000', opacity: 0.7 }}>Loading posts...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-12 text-center">
            <MessageSquare className="w-16 h-16 mx-auto mb-4" style={{ color: '#000000', opacity: 0.3 }} />
            <h3 className="text-xl mb-2" style={{ color: '#000000' }}>
              No posts yet
            </h3>
            <p className="mb-6" style={{ color: '#000000', opacity: 0.7 }}>
              Share your first motivational message, training tip, or update with your athletes
            </p>
            <button
              onClick={() => setShowComposer(true)}
              className="px-6 py-3 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-lg hover:from-teal-600 hover:to-teal-700 transition-all shadow-lg inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Create First Post
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <div
                key={post.id}
                className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6"
              >
                {/* Post Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    {post.pinned && (
                      <span className="px-2 py-0.5 text-xs rounded-full bg-teal-100 text-teal-700 flex items-center gap-1">
                        <Pin className="w-3 h-3" />
                        PINNED
                      </span>
                    )}
                    <span className="text-sm" style={{ color: '#666' }}>
                      {formatDate(post.createdAt)}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditPost(post)}
                      className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" style={{ color: '#000000' }} />
                    </button>
                    <button
                      onClick={() => handleDeletePost(post.id)}
                      className="p-2 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" style={{ color: '#FF6B35' }} />
                    </button>
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
                    className="block mb-4 p-4 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <LinkIcon className="w-5 h-5 flex-shrink-0" style={{ color: '#91A6EB' }} />
                      <div className="flex-1 min-w-0">
                        {post.linkTitle && (
                          <p className="font-semibold mb-1" style={{ color: '#000000' }}>
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
                  <div className="flex items-center gap-2">
                    <Heart className="w-4 h-4" style={{ color: '#FF6B35' }} />
                    <span className="text-sm" style={{ color: '#666' }}>{post.likes} likes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-4 h-4" style={{ color: '#20B2AA' }} />
                    <span className="text-sm" style={{ color: '#666' }}>{post.comments} comments</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

export default function CoachFeedPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen" style={{ backgroundColor: '#E8E6D8' }}>
        <div className="flex items-center justify-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
        </div>
      </div>
    }>
      <CoachFeedPageContent />
    </Suspense>
  )
}
