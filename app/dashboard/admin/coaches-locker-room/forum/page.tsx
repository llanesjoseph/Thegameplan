'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useEnhancedRole } from '@/hooks/use-role-switcher'
import AppHeader from '@/components/ui/AppHeader'
import { db } from '@/lib/firebase.client'
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, orderBy, where, Timestamp } from 'firebase/firestore'
import { MessageSquare, Trash2, Flag, Eye, EyeOff, Pin, Users, Send } from 'lucide-react'

interface ForumPost {
  id: string
  authorId: string
  authorName: string
  authorEmail: string
  title: string
  content: string
  category: string
  isPinned: boolean
  isHidden: boolean
  isFlagged: boolean
  replyCount: number
  viewCount: number
  createdAt: Date
}

interface ForumReply {
  id: string
  postId: string
  authorId: string
  authorName: string
  content: string
  isHidden: boolean
  createdAt: Date
}

export default function CoachForumManager() {
  const [posts, setPosts] = useState<ForumPost[]>([])
  const [selectedPost, setSelectedPost] = useState<ForumPost | null>(null)
  const [replies, setReplies] = useState<ForumReply[]>([])
  const [loading, setLoading] = useState(true)
  const [newReply, setNewReply] = useState('')

  const { user } = useAuth()
  const { role } = useEnhancedRole()

  useEffect(() => {
    if (user && (role === 'superadmin' || role === 'admin')) {
      loadPosts()
    }
  }, [user, role])

  const loadPosts = async () => {
    try {
      setLoading(true)
      const postsQuery = query(collection(db, 'forumPosts'), orderBy('isPinned', 'desc'), orderBy('createdAt', 'desc'))
      const snapshot = await getDocs(postsQuery)
      const postsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      })) as ForumPost[]
      setPosts(postsData)
    } catch (error) {
      console.error('Error loading forum posts:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadReplies = async (postId: string) => {
    try {
      const repliesQuery = query(
        collection(db, 'forumReplies'),
        where('postId', '==', postId),
        orderBy('createdAt', 'asc')
      )
      const snapshot = await getDocs(repliesQuery)
      const repliesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      })) as ForumReply[]
      setReplies(repliesData)
    } catch (error) {
      console.error('Error loading replies:', error)
    }
  }

  const togglePin = async (post: ForumPost) => {
    try {
      await updateDoc(doc(db, 'forumPosts', post.id), {
        isPinned: !post.isPinned
      })
      loadPosts()
    } catch (error) {
      console.error('Error toggling pin:', error)
    }
  }

  const toggleHidePost = async (post: ForumPost) => {
    try {
      await updateDoc(doc(db, 'forumPosts', post.id), {
        isHidden: !post.isHidden
      })
      loadPosts()
    } catch (error) {
      console.error('Error toggling hide:', error)
    }
  }

  const toggleHideReply = async (reply: ForumReply) => {
    try {
      await updateDoc(doc(db, 'forumReplies', reply.id), {
        isHidden: !reply.isHidden
      })
      if (selectedPost) {
        loadReplies(selectedPost.id)
      }
    } catch (error) {
      console.error('Error toggling hide:', error)
    }
  }

  const deletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post and all its replies?')) return
    try {
      // Delete all replies first
      const repliesQuery = query(collection(db, 'forumReplies'), where('postId', '==', postId))
      const repliesSnapshot = await getDocs(repliesQuery)
      await Promise.all(repliesSnapshot.docs.map(doc => deleteDoc(doc.ref)))

      // Delete the post
      await deleteDoc(doc(db, 'forumPosts', postId))
      setSelectedPost(null)
      loadPosts()
    } catch (error) {
      console.error('Error deleting post:', error)
    }
  }

  const deleteReply = async (replyId: string) => {
    if (!confirm('Are you sure you want to delete this reply?')) return
    try {
      await deleteDoc(doc(db, 'forumReplies', replyId))
      if (selectedPost) {
        loadReplies(selectedPost.id)
      }
    } catch (error) {
      console.error('Error deleting reply:', error)
    }
  }

  const handleAdminReply = async () => {
    if (!selectedPost || !newReply.trim()) return

    try {
      await addDoc(collection(db, 'forumReplies'), {
        postId: selectedPost.id,
        authorId: user?.uid,
        authorName: 'Admin',
        content: newReply,
        isHidden: false,
        createdAt: Timestamp.now()
      })
      setNewReply('')
      loadReplies(selectedPost.id)
    } catch (error) {
      console.error('Error posting reply:', error)
    }
  }

  const selectPost = (post: ForumPost) => {
    setSelectedPost(post)
    loadReplies(post.id)
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
          <p className="mt-4" style={{ color: '#000000', opacity: 0.7 }}>Loading forum...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#E8E6D8' }}>
      <AppHeader title="Coach Forum" subtitle="Moderate and manage coach community discussions" />
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Posts List */}
          <div className="space-y-4">
            <h2 className="text-2xl font-heading" style={{ color: '#000000' }}>Forum Posts</h2>

            {posts.map((post) => (
              <div
                key={post.id}
                onClick={() => selectPost(post)}
                className={`bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-4 cursor-pointer transition-all hover:shadow-2xl ${selectedPost?.id === post.id ? 'ring-2 ring-black' : ''}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {post.isPinned && (
                        <Pin className="w-4 h-4" style={{ color: '#20B2AA' }} />
                      )}
                      {post.isFlagged && (
                        <Flag className="w-4 h-4" style={{ color: '#FF6B35' }} />
                      )}
                      {post.isHidden && (
                        <EyeOff className="w-4 h-4" style={{ color: '#FF6B35' }} />
                      )}
                      <h3 className="font-semibold" style={{ color: '#000000' }}>{post.title}</h3>
                    </div>
                    <p className="text-sm mb-2" style={{ color: '#000000', opacity: 0.7 }}>
                      by {post.authorName} • {post.category}
                    </p>
                    <p className="text-sm line-clamp-2" style={{ color: '#000000' }}>{post.content}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm mt-3" style={{ color: '#000000', opacity: 0.6 }}>
                  <span className="flex items-center gap-1">
                    <MessageSquare className="w-4 h-4" />
                    {post.replyCount || 0}
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    {post.viewCount || 0}
                  </span>
                  <span>{post.createdAt.toLocaleDateString()}</span>
                </div>
              </div>
            ))}

            {posts.length === 0 && (
              <div className="text-center py-12">
                <MessageSquare className="w-16 h-16 mx-auto mb-4" style={{ color: '#000000', opacity: 0.3 }} />
                <p className="text-lg" style={{ color: '#000000', opacity: 0.7 }}>No forum posts yet</p>
              </div>
            )}
          </div>

          {/* Post Details & Replies */}
          <div>
            {selectedPost ? (
              <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6">
                <div className="flex items-start justify-between mb-4">
                  <h2 className="text-2xl font-heading" style={{ color: '#000000' }}>{selectedPost.title}</h2>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => togglePin(selectedPost)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      title={selectedPost.isPinned ? 'Unpin' : 'Pin'}
                    >
                      <Pin className="w-5 h-5" style={{ color: selectedPost.isPinned ? '#20B2AA' : '#000000' }} />
                    </button>
                    <button
                      onClick={() => toggleHidePost(selectedPost)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      title={selectedPost.isHidden ? 'Show' : 'Hide'}
                    >
                      {selectedPost.isHidden ? (
                        <EyeOff className="w-5 h-5" style={{ color: '#FF6B35' }} />
                      ) : (
                        <Eye className="w-5 h-5" style={{ color: '#000000' }} />
                      )}
                    </button>
                    <button
                      onClick={() => deletePost(selectedPost.id)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-5 h-5" style={{ color: '#FF6B35' }} />
                    </button>
                  </div>
                </div>

                <p className="text-sm mb-4" style={{ color: '#000000', opacity: 0.7 }}>
                  by {selectedPost.authorName} ({selectedPost.authorEmail}) • {selectedPost.createdAt.toLocaleString()}
                </p>
                <p className="mb-6" style={{ color: '#000000' }}>{selectedPost.content}</p>

                {/* Replies */}
                <div className="border-t border-gray-300/30 pt-6">
                  <h3 className="text-lg font-semibold mb-4" style={{ color: '#000000' }}>
                    Replies ({replies.length})
                  </h3>

                  <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
                    {replies.map((reply) => (
                      <div key={reply.id} className={`p-4 rounded-lg ${reply.isHidden ? 'bg-red-50' : 'bg-gray-50'}`}>
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <p className="text-sm font-semibold mb-1" style={{ color: '#000000' }}>
                              {reply.authorName}
                              {reply.isHidden && <span className="ml-2 text-xs" style={{ color: '#FF6B35' }}>(Hidden)</span>}
                            </p>
                            <p className="text-sm" style={{ color: '#000000' }}>{reply.content}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => toggleHideReply(reply)}
                              className="p-1 hover:bg-gray-200 rounded transition-colors"
                            >
                              {reply.isHidden ? (
                                <Eye className="w-4 h-4" style={{ color: '#000000' }} />
                              ) : (
                                <EyeOff className="w-4 h-4" style={{ color: '#FF6B35' }} />
                              )}
                            </button>
                            <button
                              onClick={() => deleteReply(reply.id)}
                              className="p-1 hover:bg-gray-200 rounded transition-colors"
                            >
                              <Trash2 className="w-4 h-4" style={{ color: '#FF6B35' }} />
                            </button>
                          </div>
                        </div>
                        <p className="text-xs" style={{ color: '#000000', opacity: 0.6 }}>
                          {reply.createdAt.toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Admin Reply */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newReply}
                      onChange={(e) => setNewReply(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAdminReply()}
                      className="flex-1 px-4 py-2 border border-gray-300/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                      placeholder="Reply as admin..."
                    />
                    <button
                      onClick={handleAdminReply}
                      className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-12 text-center">
                <MessageSquare className="w-16 h-16 mx-auto mb-4" style={{ color: '#000000', opacity: 0.3 }} />
                <p style={{ color: '#000000', opacity: 0.7 }}>Select a post to view details and replies</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
