'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useEnhancedRole } from '@/hooks/use-role-switcher'
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
  if (user && (role === 'superadmin')) {
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
   case 'published': return 'text-green-400 bg-green-400/10'
   case 'pending': return 'text-yellow-400 bg-yellow-400/10'
   case 'rejected': return 'text-red-400 bg-red-400/10'
   case 'draft': return 'text-gray-400 bg-gray-400/10'
   default: return 'text-gray-400 bg-gray-400/10'
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

 if (role !== 'superadmin') {
  return (
   <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
     <h1 className="text-2xl mb-4">Access Denied</h1>
     <p className="text-brand-grey">This page is only available to administrators.</p>
    </div>
   </div>
  )
 }

 if (loading) {
  return (
   <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
     <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
     <p className="mt-4 text-brand-grey">Loading content...</p>
    </div>
   </div>
  )
 }

 return (
  <main className="min-h-screen py-16">
   <div className="max-w-7xl mx-auto px-6">
    {/* Header */}
    <div className="mb-12">
     <h1 className="text-4xl mb-4">Content Review</h1>
     <p className="text-xl text-brand-grey">
      Review and moderate content before publication
     </p>
    </div>

    {/* Stats Overview */}
    <div className="grid md:grid-cols-4 gap-6 mb-8">
     <div className="card text-center">
      <div className="text-3xl text-yellow-400 mb-2">
       {content.filter(c => c.status === 'pending').length}
      </div>
      <div className="text-sm text-brand-grey">Pending Review</div>
     </div>
     <div className="card text-center">
      <div className="text-3xl text-green-400 mb-2">
       {content.filter(c => c.status === 'published').length}
      </div>
      <div className="text-sm text-brand-grey">Published</div>
     </div>
     <div className="card text-center">
      <div className="text-3xl text-red-400 mb-2">
       {content.filter(c => c.status === 'rejected').length}
      </div>
      <div className="text-sm text-brand-grey">Rejected</div>
     </div>
     <div className="card text-center">
      <div className="text-3xl text-orange-400 mb-2">
       {content.filter(c => c.flagged).length}
      </div>
      <div className="text-sm text-brand-grey">Flagged</div>
     </div>
    </div>

    {/* Filters and Search */}
    <div className="card mb-8">
     <div className="flex flex-col md:flex-row gap-4">
      <div className="flex-1">
       <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-brand-grey" />
        <input
         type="text"
         placeholder="Search content by title, description, creator, or tags..."
         value={searchTerm}
         onChange={(e) => setSearchTerm(e.target.value)}
         className="input w-full pl-10"
        />
       </div>
      </div>
      
      <div className="flex gap-2">
       <select
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value)}
        className="input"
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
      <div key={item.id} className="card group">
       {/* Thumbnail */}
       <div className="aspect-video rounded-lg overflow-hidden mb-4 bg-white/5">
        {item.thumbnailUrl ? (
         <img
          src={item.thumbnailUrl}
          alt={item.title}
          className="w-full h-full object-cover"
         />
        ) : (
         <div className="w-full h-full flex items-center justify-center">
          <Video className="w-12 h-12 text-white/40" />
         </div>
        )}
        
        {/* Status Badge */}
        <div className="absolute top-2 right-2">
         <span className={`px-2 py-1 rounded-full text-xs  ${getStatusColor(item.status)}`}>
          {item.status}
         </span>
        </div>
        
        {/* Flag Badge */}
        {item.flagged && (
         <div className="absolute top-2 left-2">
          <span className="px-2 py-1 rounded-full text-xs  bg-red-500/20 text-red-400">
           <AlertTriangle className="w-3 h-3 inline mr-1" />
           Flagged
          </span>
         </div>
        )}
       </div>
       
       {/* Content Info */}
       <div className="space-y-3">
        <h3 className=" text-lg line-clamp-2">{item.title}</h3>
        <p className="text-sm text-brand-grey line-clamp-2">{item.description}</p>
        
        <div className="flex items-center gap-4 text-sm text-brand-grey">
         <div className="flex items-center gap-1">
          <User className="w-4 h-4" />
          <span>{item.creatorName}</span>
         </div>
         <div className="flex items-center gap-1">
          <Play className="w-4 h-4" />
          <span>{item.duration}min</span>
         </div>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-brand-grey">
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
            className="px-2 py-1 bg-white/10 rounded-full text-xs"
           >
            {tag}
           </span>
          ))}
          {item.tags.length > 3 && (
           <span className="px-2 py-1 bg-white/10 rounded-full text-xs">
            +{item.tags.length - 3}
           </span>
          )}
         </div>
        )}
        
        {/* Actions */}
        <div className="flex gap-2 pt-3 border-t border-white/10">
         <button
          onClick={() => setSelectedContent(item)}
          className="btn btn-sm btn-outline flex-1"
         >
          <Eye className="w-4 h-4 mr-2" />
          Review
         </button>
         
         {item.status === 'pending' && (
          <>
           <button
            onClick={() => updateContentStatus(item.id, 'published')}
            className="btn btn-sm btn-accent"
           >
            <CheckCircle className="w-4 h-4" />
           </button>
           <button
            onClick={() => updateContentStatus(item.id, 'rejected')}
            className="btn btn-sm btn-outline"
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
    <div className="mt-6 text-center text-sm text-brand-grey">
     Showing {filteredContent.length} of {content.length} content items
    </div>

    {/* Content Review Modal */}
    {selectedContent && (
     <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="card max-w-4xl w-full max-h-[90vh] overflow-y-auto">
       <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl ">Content Review</h3>
        <button
         onClick={() => setSelectedContent(null)}
         className="text-brand-grey hover:text-white"
        >
         ✕
        </button>
       </div>
       
       <div className="grid md:grid-cols-2 gap-6">
        {/* Content Preview */}
        <div>
         <h4 className=" mb-3">Content Preview</h4>
         <div className="aspect-video rounded-lg overflow-hidden bg-white/5 mb-4">
          {selectedContent.thumbnailUrl ? (
           <img
            src={selectedContent.thumbnailUrl}
            alt={selectedContent.title}
            className="w-full h-full object-cover"
           />
          ) : (
           <div className="w-full h-full flex items-center justify-center">
            <Video className="w-12 h-12 text-white/40" />
           </div>
          )}
         </div>
         
         <div className="space-y-3">
          <div>
           <label className="block text-sm  mb-1">Title</label>
           <div className="text-sm">{selectedContent.title}</div>
          </div>
          
          <div>
           <label className="block text-sm  mb-1">Description</label>
           <div className="text-sm">{selectedContent.description}</div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
           <div>
            <label className="block text-sm  mb-1">Sport</label>
            <div className="text-sm">{selectedContent.sport}</div>
           </div>
           <div>
            <label className="block text-sm  mb-1">Level</label>
            <div className="text-sm">{selectedContent.level}</div>
           </div>
           <div>
            <label className="block text-sm  mb-1">Duration</label>
            <div className="text-sm">{selectedContent.duration} minutes</div>
           </div>
           <div>
            <label className="block text-sm  mb-1">Created</label>
            <div className="text-sm">{selectedContent.createdAt.toLocaleDateString()}</div>
           </div>
          </div>
         </div>
        </div>
        
        {/* Review Actions */}
        <div>
         <h4 className=" mb-3">Review Actions</h4>
         
         <div className="space-y-4">
          <div>
           <label className="block text-sm  mb-2">Review Note</label>
           <textarea
            value={reviewNote}
            onChange={(e) => setReviewNote(e.target.value)}
            rows={4}
            className="input w-full"
            placeholder="Add notes about your review decision..."
           />
          </div>
          
          <div className="space-y-3">
           <button
            onClick={() => updateContentStatus(selectedContent.id, 'published', reviewNote)}
            className="btn btn-accent w-full"
           >
            <CheckCircle className="w-4 h-4 mr-2" />
            Approve &amp; Publish
           </button>
           
           <button
            onClick={() => updateContentStatus(selectedContent.id, 'rejected', reviewNote)}
            className="btn btn-outline w-full"
           >
            <XCircle className="w-4 h-4 mr-2" />
            Reject
           </button>
           
           <button
            onClick={() => setSelectedContent(null)}
            className="btn btn-outline w-full"
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
   </div>
  </main>
 )
}
