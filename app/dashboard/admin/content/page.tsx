'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useEnhancedRole } from '@/hooks/use-role-switcher'
import AppHeader from '@/components/ui/AppHeader'
import { db } from '@/lib/firebase.client'
import { collection, query, getDocs, orderBy, limit, doc, updateDoc } from 'firebase/firestore'
import {
 Video,
 Search,
 Eye,
 CheckCircle,
 XCircle,
 Clock,
 User,
 AlertTriangle,
 Play,
 FileText
} from 'lucide-react'

interface Content {
 id: string
 title: string
 description: string
 creatorId: string
 creatorName: string
 status: string
 createdAt: Date
 updatedAt: Date
 sport: string
 level: string
 duration: number
 thumbnailUrl?: string
 videoUrl?: string
 tags: string[]
 flagged?: boolean
 flagReason?: string
}

export default function AdminContentReview() {
 const [content, setContent] = useState<Content[]>([])
 const [filteredContent, setFilteredContent] = useState<Content[]>([])
 const [loading, setLoading] = useState(true)
 const [searchTerm, setSearchTerm] = useState('')
 const [statusFilter, setStatusFilter] = useState('pending')
 const [selectedContent, setSelectedContent] = useState<Content | null>(null)
 const [reviewNote, setReviewNote] = useState('')

 const { user } = useAuth()
 const { role } = useEnhancedRole()

 useEffect(() => {
  if (user && (role === 'superadmin' || role === 'admin')) {
   loadContent()
  }
 }, [user, role])

 useEffect(() => {
  filterContent()
 }, [content, searchTerm, statusFilter])

 const loadContent = async () => {
  try {
   setLoading(true)

   // Load content from Firestore
   const contentQuery = query(
    collection(db, 'content'),
    orderBy('createdAt', 'desc'),
    limit(100)
   )

   const contentSnapshot = await getDocs(contentQuery)
   const contentData: Content[] = []

   contentSnapshot.forEach(doc => {
    const data = doc.data()
    contentData.push({
     id: doc.id,
     title: data.title || 'Untitled',
     description: data.description || '',
     creatorId: data.creatorId || '',
     creatorName: data.creatorName || 'Unknown Creator',
     status: data.status || 'draft',
     createdAt: data.createdAt?.toDate() || new Date(),
     updatedAt: data.updatedAt?.toDate() || new Date(),
     sport: data.sport || '',
     level: data.level || '',
     duration: data.duration || 0,
     thumbnailUrl: data.thumbnailUrl || '',
     videoUrl: data.videoUrl || '',
     tags: data.tags || [],
     flagged: data.flagged || false,
     flagReason: data.flagReason || ''
    })
   })

   setContent(contentData)

  } catch (error) {
   console.error('Error loading content:', error)
  } finally {
   setLoading(false)
  }
 }

 const filterContent = () => {
  let filtered = content

  // Search filter
  if (searchTerm) {
   filtered = filtered.filter(item =>
    item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.creatorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.sport.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
   )
  }

  // Status filter
  if (statusFilter !== 'all') {
   filtered = filtered.filter(item => item.status === statusFilter)
  }

  setFilteredContent(filtered)
 }

 const updateContentStatus = async (contentId: string, newStatus: string, note?: string) => {
  try {
   const updateData: {
    status: string;
    reviewedAt: Date;
    reviewedBy: string | undefined;
    reviewNote: string;
    publishedAt?: Date;
   } = {
    status: newStatus,
    reviewedAt: new Date(),
    reviewedBy: user?.uid,
    reviewNote: note || ''
   }

   if (newStatus === 'published') {
    updateData.publishedAt = new Date()
   }

   await updateDoc(doc(db, 'content', contentId), updateData)

   // Update local state
   setContent(content.map(c => c.id === contentId ? { ...c, status: newStatus } : c))
   setSelectedContent(null)
   setReviewNote('')

  } catch (error) {
   console.error('Error updating content status:', error)
  }
 }

 const getStatusColor = (status: string) => {
  switch (status) {
   case 'published': return 'bg-green-400/10 text-green-400 border border-green-400/30'
   case 'pending': return 'bg-yellow-400/10 text-yellow-400 border border-yellow-400/30'
   case 'rejected': return 'bg-red-400/10 text-red-400 border border-red-400/30'
   case 'draft': return 'bg-gray-400/10 text-gray-400 border border-gray-400/30'
   default: return 'bg-gray-400/10 text-gray-400 border border-gray-400/30'
  }
 }

 const getStatusIcon = (status: string) => {
  switch (status) {
   case 'published': return <CheckCircle className="w-4 h-4" />
   case 'pending': return <Clock className="w-4 h-4" />
   case 'rejected': return <XCircle className="w-4 h-4" />
   case 'draft': return <FileText className="w-4 h-4" />
   default: return <FileText className="w-4 h-4" />
  }
 }

 if (role !== 'superadmin' && role !== 'admin') {
  return (
   <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#E8E6D8' }}>
    <div className="text-center bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-8">
     <h1 className="text-2xl mb-4" style={{ color: '#000000' }}>Access Denied</h1>
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
     <p className="mt-4" style={{ color: '#000000', opacity: 0.7 }}>Loading content...</p>
    </div>
   </div>
  )
 }

 return (
  <div className="min-h-screen" style={{ backgroundColor: '#E8E6D8' }}>
   <AppHeader title="Content Review" subtitle="Review and moderate content before publication" />
   <main className="max-w-7xl mx-auto px-6 py-8">
    {/* Stats Overview */}
    <div className="grid md:grid-cols-4 gap-6 mb-8">
     <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6 text-center">
      <div className="text-4xl mb-2" style={{ color: '#91A6EB' }}>
       {content.filter(c => c.status === 'pending').length}
      </div>
      <div className="text-sm" style={{ color: '#000000', opacity: 0.7 }}>Pending Review</div>
     </div>
     <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6 text-center">
      <div className="text-4xl mb-2" style={{ color: '#20B2AA' }}>
       {content.filter(c => c.status === 'published').length}
      </div>
      <div className="text-sm" style={{ color: '#000000', opacity: 0.7 }}>Published</div>
     </div>
     <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6 text-center">
      <div className="text-4xl mb-2" style={{ color: '#FF6B35' }}>
       {content.filter(c => c.status === 'rejected').length}
      </div>
      <div className="text-sm" style={{ color: '#000000', opacity: 0.7 }}>Rejected</div>
     </div>
     <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6 text-center">
      <div className="text-4xl mb-2" style={{ color: '#000000' }}>
       {content.filter(c => c.flagged).length}
      </div>
      <div className="text-sm" style={{ color: '#000000', opacity: 0.7 }}>Flagged</div>
     </div>
    </div>

    {/* Filters and Search */}
    <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6 mb-8">
     <div className="flex flex-col md:flex-row gap-4">
      <div className="flex-1">
       <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: '#000000', opacity: 0.5 }} />
        <input
         type="text"
         placeholder="Search content by title, description, creator, or tags..."
         value={searchTerm}
         onChange={(e) => setSearchTerm(e.target.value)}
         className="w-full pl-10 px-4 py-2 border border-gray-300/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-black bg-white"
         style={{ color: '#000000' }}
        />
       </div>
      </div>

      <div className="flex gap-2">
       <select
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value)}
        className="px-4 py-2 border border-gray-300/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-black bg-white"
        style={{ color: '#000000' }}
       >
        <option value="all">All Status</option>
        <option value="pending">Pending</option>
        <option value="published">Published</option>
        <option value="rejected">Rejected</option>
        <option value="draft">Draft</option>
       </select>
      </div>
     </div>
    </div>

    {/* Content Grid */}
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
     {filteredContent.map((item) => (
      <div key={item.id} className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-4 group hover:shadow-2xl transition-all">
       {/* Thumbnail */}
       <div className="aspect-video rounded-lg overflow-hidden mb-4 bg-black/5 relative">
        {item.thumbnailUrl ? (
         <img
          src={item.thumbnailUrl}
          alt={item.title}
          className="w-full h-full object-cover"
         />
        ) : (
         <div className="w-full h-full flex items-center justify-center">
          <Video className="w-12 h-12" style={{ color: '#000000', opacity: 0.3 }} />
         </div>
        )}

        {/* Status Badge */}
        <div className="absolute top-2 right-2">
         <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(item.status)}`}>
          {item.status}
         </span>
        </div>

        {/* Flag Badge */}
        {item.flagged && (
         <div className="absolute top-2 left-2">
          <span className="px-2 py-1 rounded-full text-xs bg-red-500/20 text-red-400 border border-red-500/30 flex items-center gap-1">
           <AlertTriangle className="w-3 h-3" />
           Flagged
          </span>
         </div>
        )}
       </div>

       {/* Content Info */}
       <div className="space-y-3">
        <h3 className="text-lg line-clamp-2" style={{ color: '#000000' }}>{item.title}</h3>
        <p className="text-sm line-clamp-2" style={{ color: '#000000', opacity: 0.7 }}>{item.description}</p>

        <div className="flex items-center gap-4 text-sm" style={{ color: '#000000', opacity: 0.7 }}>
         <div className="flex items-center gap-1">
          <User className="w-4 h-4" />
          <span>{item.creatorName}</span>
         </div>
         <div className="flex items-center gap-1">
          <Play className="w-4 h-4" />
          <span>{item.duration}min</span>
         </div>
        </div>

        <div className="flex items-center gap-2 text-sm" style={{ color: '#000000', opacity: 0.7 }}>
         <span>{item.sport}</span>
         <span>•</span>
         <span>{item.level}</span>
        </div>

        {/* Tags */}
        {item.tags.length > 0 && (
         <div className="flex flex-wrap gap-1">
          {item.tags.slice(0, 3).map((tag, index) => (
           <span
            key={index}
            className="px-2 py-1 bg-black/10 rounded-full text-xs"
            style={{ color: '#000000', opacity: 0.7 }}
           >
            {tag}
           </span>
          ))}
          {item.tags.length > 3 && (
           <span className="px-2 py-1 bg-black/10 rounded-full text-xs" style={{ color: '#000000', opacity: 0.7 }}>
            +{item.tags.length - 3}
           </span>
          )}
         </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-3 border-t border-gray-300/30">
         <button
          onClick={() => setSelectedContent(item)}
          className="flex-1 px-4 py-2 border border-gray-300/50 rounded-lg transition-all hover:bg-black/5"
          style={{ color: '#000000' }}
         >
          <div className="flex items-center justify-center gap-2">
           <Eye className="w-4 h-4" />
           Review
          </div>
         </button>

         {item.status === 'pending' && (
          <>
           <button
            onClick={() => updateContentStatus(item.id, 'published')}
            className="px-4 py-2 rounded-lg text-white transition-all"
            style={{ backgroundColor: '#20B2AA' }}
           >
            <CheckCircle className="w-4 h-4" />
           </button>
           <button
            onClick={() => updateContentStatus(item.id, 'rejected')}
            className="px-4 py-2 rounded-lg text-white transition-all"
            style={{ backgroundColor: '#FF6B35' }}
           >
            <XCircle className="w-4 h-4" />
           </button>
          </>
         )}
        </div>
       </div>
      </div>
     ))}
    </div>

    {/* Content Count */}
    <div className="mt-6 text-center text-sm" style={{ color: '#000000', opacity: 0.7 }}>
     Showing {filteredContent.length} of {content.length} content items
    </div>

    {/* Content Review Modal */}
    {selectedContent && (
     <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl border border-white/50 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
       <div className="flex items-center justify-between mb-6 p-6 pb-0">
        <h3 className="text-2xl" style={{ color: '#000000' }}>Content Review</h3>
        <button
         onClick={() => setSelectedContent(null)}
         className="hover:bg-black/5 rounded-lg p-2"
         style={{ color: '#000000', opacity: 0.7 }}
        >
         ✕
        </button>
       </div>

       <div className="grid md:grid-cols-2 gap-6 p-6">
        {/* Content Preview */}
        <div>
         <h4 className="mb-3" style={{ color: '#000000' }}>Content Preview</h4>
         <div className="aspect-video rounded-lg overflow-hidden bg-black/5 mb-4">
          {selectedContent.thumbnailUrl ? (
           <img
            src={selectedContent.thumbnailUrl}
            alt={selectedContent.title}
            className="w-full h-full object-cover"
           />
          ) : (
           <div className="w-full h-full flex items-center justify-center">
            <Video className="w-12 h-12" style={{ color: '#000000', opacity: 0.3 }} />
           </div>
          )}
         </div>

         <div className="space-y-3">
          <div>
           <label className="block text-sm mb-1" style={{ color: '#000000' }}>Title</label>
           <div className="text-sm" style={{ color: '#000000', opacity: 0.7 }}>{selectedContent.title}</div>
          </div>

          <div>
           <label className="block text-sm mb-1" style={{ color: '#000000' }}>Description</label>
           <div className="text-sm" style={{ color: '#000000', opacity: 0.7 }}>{selectedContent.description}</div>
          </div>

          <div className="grid grid-cols-2 gap-4">
           <div>
            <label className="block text-sm mb-1" style={{ color: '#000000' }}>Sport</label>
            <div className="text-sm" style={{ color: '#000000', opacity: 0.7 }}>{selectedContent.sport}</div>
           </div>
           <div>
            <label className="block text-sm mb-1" style={{ color: '#000000' }}>Level</label>
            <div className="text-sm" style={{ color: '#000000', opacity: 0.7 }}>{selectedContent.level}</div>
           </div>
           <div>
            <label className="block text-sm mb-1" style={{ color: '#000000' }}>Duration</label>
            <div className="text-sm" style={{ color: '#000000', opacity: 0.7 }}>{selectedContent.duration} minutes</div>
           </div>
           <div>
            <label className="block text-sm mb-1" style={{ color: '#000000' }}>Created</label>
            <div className="text-sm" style={{ color: '#000000', opacity: 0.7 }}>{selectedContent.createdAt.toLocaleDateString()}</div>
           </div>
          </div>
         </div>
        </div>

        {/* Review Actions */}
        <div>
         <h4 className="mb-3" style={{ color: '#000000' }}>Review Actions</h4>

         <div className="space-y-4">
          <div>
           <label className="block text-sm mb-2" style={{ color: '#000000' }}>Review Note</label>
           <textarea
            value={reviewNote}
            onChange={(e) => setReviewNote(e.target.value)}
            rows={4}
            className="w-full px-4 py-2 border border-gray-300/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-black bg-white"
            style={{ color: '#000000' }}
            placeholder="Add notes about your review decision..."
           />
          </div>

          <div className="space-y-3">
           <button
            onClick={() => updateContentStatus(selectedContent.id, 'published', reviewNote)}
            className="w-full px-4 py-3 text-white rounded-lg transition-all"
            style={{ backgroundColor: '#20B2AA' }}
           >
            <div className="flex items-center justify-center gap-2">
             <CheckCircle className="w-4 h-4" />
             Approve & Publish
            </div>
           </button>

           <button
            onClick={() => updateContentStatus(selectedContent.id, 'rejected', reviewNote)}
            className="w-full px-4 py-3 border border-gray-300/50 rounded-lg transition-all hover:bg-black/5"
            style={{ color: '#000000' }}
           >
            <div className="flex items-center justify-center gap-2">
             <XCircle className="w-4 h-4" />
             Reject
            </div>
           </button>

           <button
            onClick={() => setSelectedContent(null)}
            className="w-full px-4 py-3 bg-black text-white rounded-lg hover:bg-black/90 transition-all"
           >
            Cancel
           </button>
          </div>
         </div>
        </div>
       </div>
      </div>
     </div>
    )}
   </main>
  </div>
 )
}
