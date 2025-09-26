/**
 * Admin Panel for Managing Coach Applications
 * Integrated with Firebase Functions role management system
 */

'use client'

import { useState, useEffect } from 'react'
import { db } from '@/lib/firebase.client'
import { collection, query, orderBy, onSnapshot, doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { setUserRoleViaFunction, isAdmin } from '@/lib/role-management'
import { useAuth } from '@/hooks/use-auth'
import { useCreatorStatus } from '@/hooks/use-creator-status'
import { 
 User, 
 Clock, 
 CheckCircle, 
 XCircle, 
 Eye, 
 MessageSquare,
 Calendar,
 Award,
 Target,
 FileText,
 ExternalLink,
 Filter,
 Search,
 Loader2
} from 'lucide-react'

interface CreatorApplication {
 id: string
 firstName: string
 lastName: string
 email: string
 primarySport: string
 experience: string
 experienceDetails: string
 achievements: string[]
 specialties: string[]
 contentTypes: string[]
 contentDescription: string
 status: 'pending' | 'approved' | 'rejected'
 submittedAt: any
 reviewedAt?: any
 reviewerNotes?: string
 userId?: string
 userEmail?: string
 headshotUrl?: string
 actionImageUrl?: string
}

export default function CreatorApplicationsPage() {
 const { user } = useAuth()
 const { roleData, loading: roleLoading } = useCreatorStatus()
 const [applications, setApplications] = useState<CreatorApplication[]>([])
 const [loading, setLoading] = useState(true)
 const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')
 const [searchTerm, setSearchTerm] = useState('')
 const [selectedApp, setSelectedApp] = useState<CreatorApplication | null>(null)
 const [reviewNotes, setReviewNotes] = useState('')
 const [submittingReview, setSubmittingReview] = useState(false)

 // Check admin access
 const hasAccess = isAdmin(roleData)

 useEffect(() => {
  if (!hasAccess || roleLoading) return

  const q = query(
   collection(db, 'contributorApplications'),
   orderBy('submittedAt', 'desc')
  )

  const unsubscribe = onSnapshot(q, (snapshot) => {
   const apps = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
   } as CreatorApplication))
   
   setApplications(apps)
   setLoading(false)
  })

  return () => unsubscribe()
 }, [hasAccess, roleLoading])

 const filteredApplications = applications.filter(app => {
  const matchesFilter = filter === 'all' || app.status === filter
  const matchesSearch = searchTerm === '' || 
   `${app.firstName} ${app.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
   app.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
   app.primarySport.toLowerCase().includes(searchTerm.toLowerCase())
  
  return matchesFilter && matchesSearch
 })

 const handleReview = async (applicationId: string, decision: 'approved' | 'rejected') => {
  if (!selectedApp) return

  setSubmittingReview(true)
  try {
   // Update application status
   await updateDoc(doc(db, 'contributorApplications', applicationId), {
    status: decision,
    reviewedAt: serverTimestamp(),
    reviewerNotes: reviewNotes,
    reviewerId: user?.uid
   })

   // Update user role if approved
   if (decision === 'approved' && selectedApp.userId) {
    const adminSecret = prompt('Enter admin secret to update user role:')
    if (adminSecret) {
     const result = await setUserRoleViaFunction(
      selectedApp.userId,
      selectedApp.userEmail || selectedApp.email,
      'creator',
      adminSecret
     )

     if (!result.success) {
      alert(`Failed to update user role: ${result.error}`)
      return
     }
    } else {
     alert('Admin secret required to approve creator applications')
     return
    }
   }

   setSelectedApp(null)
   setReviewNotes('')
   alert(`Application ${decision} successfully!`)
  } catch (error) {
   console.error('Error reviewing application:', error)
   alert('Failed to process review. Please try again.')
  } finally {
   setSubmittingReview(false)
  }
 }

 if (roleLoading) {
  return (
   <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
     <Loader2 className="w-8 h-8 animate-spin text-cardinal mx-auto mb-4" />
     <p className="text-gray-600">Checking permissions...</p>
    </div>
   </div>
  )
 }

 if (!hasAccess) {
  return (
   <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
     <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
     <h1 className="text-2xl text-gray-900 mb-2">Access Denied</h1>
     <p className="text-gray-600">You don't have permission to view this page.</p>
    </div>
   </div>
  )
 }

 return (
  <main className="min-h-screen bg-gray-50">
   <div className="max-w-7xl mx-auto px-4 py-6">
    {/* Header */}
    <div className="mb-8">
     <h1 className="text-3xl text-gray-900 mb-2">Coach Applications</h1>
     <p className="text-gray-600">Review and manage coach applications</p>
    </div>

    {/* Stats */}
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
     <div className="bg-white rounded-lg p-6 border border-gray-200">
      <div className="flex items-center justify-between">
       <div>
        <p className="text-sm  text-gray-600">Total Applications</p>
        <p className="text-2xl text-gray-900">{applications.length}</p>
       </div>
       <FileText className="w-8 h-8 text-gray-400" />
      </div>
     </div>
     
     <div className="bg-white rounded-lg p-6 border border-gray-200">
      <div className="flex items-center justify-between">
       <div>
        <p className="text-sm  text-gray-600">Pending Review</p>
        <p className="text-2xl text-yellow-600">
         {applications.filter(app => app.status === 'pending').length}
        </p>
       </div>
       <Clock className="w-8 h-8 text-yellow-400" />
      </div>
     </div>
     
     <div className="bg-white rounded-lg p-6 border border-gray-200">
      <div className="flex items-center justify-between">
       <div>
        <p className="text-sm  text-gray-600">Approved</p>
        <p className="text-2xl text-green-600">
         {applications.filter(app => app.status === 'approved').length}
        </p>
       </div>
       <CheckCircle className="w-8 h-8 text-green-400" />
      </div>
     </div>
     
     <div className="bg-white rounded-lg p-6 border border-gray-200">
      <div className="flex items-center justify-between">
       <div>
        <p className="text-sm  text-gray-600">Rejected</p>
        <p className="text-2xl text-red-600">
         {applications.filter(app => app.status === 'rejected').length}
        </p>
       </div>
       <XCircle className="w-8 h-8 text-red-400" />
      </div>
     </div>
    </div>

    {/* Filters */}
    <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
     <div className="flex flex-col sm:flex-row gap-4">
      <div className="flex-1">
       <div className="relative">
        <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
        <input
         type="text"
         placeholder="Search applications..."
         value={searchTerm}
         onChange={(e) => setSearchTerm(e.target.value)}
         className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cardinal focus:border-transparent"
        />
       </div>
      </div>
      <div className="flex gap-2">
       {(['all', 'pending', 'approved', 'rejected'] as const).map((status) => (
        <button
         key={status}
         onClick={() => setFilter(status)}
         className={`px-4 py-2 rounded-lg  transition-colors ${
          filter === status
           ? 'bg-cardinal text-white'
           : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
         }`}
        >
         {status.charAt(0).toUpperCase() + status.slice(1)}
        </button>
       ))}
      </div>
     </div>
    </div>

    {/* Applications List */}
    <div className="bg-white rounded-lg border border-gray-200">
     {loading ? (
      <div className="p-8 text-center">
       <Loader2 className="w-8 h-8 animate-spin text-cardinal mx-auto mb-4" />
       <p className="text-gray-600">Loading applications...</p>
      </div>
     ) : filteredApplications.length === 0 ? (
      <div className="p-8 text-center">
       <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
       <p className="text-gray-600">No applications found</p>
      </div>
     ) : (
      <div className="divide-y divide-gray-200">
       {filteredApplications.map((app) => (
        <div key={app.id} className="p-6 hover:bg-gray-50 transition-colors">
         <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
           <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
            {app.headshotUrl ? (
             <img 
              src={app.headshotUrl} 
              alt={`${app.firstName} ${app.lastName}`}
              className="w-12 h-12 rounded-full object-cover"
             />
            ) : (
             <User className="w-6 h-6 text-gray-400" />
            )}
           </div>
           <div>
            <h3 className=" text-gray-900">
             {app.firstName} {app.lastName}
            </h3>
            <p className="text-sm text-gray-600">{app.email}</p>
            <div className="flex items-center gap-4 mt-1">
             <span className="text-sm text-gray-500">{app.primarySport}</span>
             <span className="text-sm text-gray-500">{app.experience}</span>
            </div>
           </div>
          </div>
          
          <div className="flex items-center gap-4">
           <div className={`px-3 py-1 rounded-full text-sm  ${
            app.status === 'pending' 
             ? 'bg-yellow-100 text-yellow-800'
             : app.status === 'approved'
             ? 'bg-green-100 text-green-800'
             : 'bg-red-100 text-red-800'
           }`}>
            {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
           </div>
           
           <button
            onClick={() => setSelectedApp(app)}
            className="p-2 text-gray-400 hover:text-cardinal rounded-lg hover:bg-red-50 transition-colors"
           >
            <Eye className="w-5 h-5" />
           </button>
          </div>
         </div>
        </div>
       ))}
      </div>
     )}
    </div>

    {/* Application Detail Modal */}
    {selectedApp && (
     <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
       <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
         <h2 className="text-xl text-gray-900">
          Application Review: {selectedApp.firstName} {selectedApp.lastName}
         </h2>
         <button
          onClick={() => setSelectedApp(null)}
          className="text-gray-400 hover:text-gray-600"
         >
          <XCircle className="w-6 h-6" />
         </button>
        </div>
       </div>

       <div className="p-6 space-y-6">
        {/* Basic Info */}
        <div className="grid md:grid-cols-2 gap-6">
         <div className="space-y-4">
          <h3 className=" text-gray-900">Personal Information</h3>
          <div className="space-y-2">
           <p><span className="">Name:</span> {selectedApp.firstName} {selectedApp.lastName}</p>
           <p><span className="">Email:</span> {selectedApp.email}</p>
           <p><span className="">Primary Sport:</span> {selectedApp.primarySport}</p>
           <p><span className="">Experience:</span> {selectedApp.experience}</p>
          </div>
         </div>

         <div className="space-y-4">
          <h3 className=" text-gray-900">Application Status</h3>
          <div className="space-y-2">
           <p><span className="">Status:</span> 
            <span className={`ml-2 px-2 py-1 rounded text-sm ${
             selectedApp.status === 'pending' 
              ? 'bg-yellow-100 text-yellow-800'
              : selectedApp.status === 'approved'
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
            }`}>
             {selectedApp.status}
            </span>
           </p>
           <p><span className="">Submitted:</span> {selectedApp.submittedAt?.toDate?.()?.toLocaleDateString() || 'Unknown'}</p>
           {selectedApp.reviewedAt && (
            <p><span className="">Reviewed:</span> {selectedApp.reviewedAt.toDate?.()?.toLocaleDateString()}</p>
           )}
          </div>
         </div>
        </div>

        {/* Experience Details */}
        <div>
         <h3 className=" text-gray-900 mb-2">Experience Details</h3>
         <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">{selectedApp.experienceDetails}</p>
        </div>

        {/* Achievements */}
        {selectedApp.achievements?.length > 0 && (
         <div>
          <h3 className=" text-gray-900 mb-2">Achievements</h3>
          <ul className="list-disc list-inside space-y-1">
           {selectedApp.achievements.map((achievement, index) => (
            achievement && <li key={index} className="text-gray-700">{achievement}</li>
           ))}
          </ul>
         </div>
        )}

        {/* Specialties & Content */}
        <div className="grid md:grid-cols-2 gap-6">
         <div>
          <h3 className=" text-gray-900 mb-2">Specialties</h3>
          <div className="flex flex-wrap gap-2">
           {selectedApp.specialties?.map((specialty, index) => (
            <span key={index} className="px-2 py-1 bg-cardinal/10 text-cardinal rounded text-sm">
             {specialty.replace('-', ' ')}
            </span>
           ))}
          </div>
         </div>

         <div>
          <h3 className=" text-gray-900 mb-2">Content Types</h3>
          <div className="flex flex-wrap gap-2">
           {selectedApp.contentTypes?.map((type, index) => (
            <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
             {type.replace('-', ' ')}
            </span>
           ))}
          </div>
         </div>
        </div>

        {/* Content Description */}
        <div>
         <h3 className=" text-gray-900 mb-2">Content Description</h3>
         <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">{selectedApp.contentDescription}</p>
        </div>

        {/* Review Section */}
        {selectedApp.status === 'pending' && (
         <div className="border-t border-gray-200 pt-6">
          <h3 className=" text-gray-900 mb-4">Review Application</h3>
          
          <div className="mb-4">
           <label className="block text-sm  text-gray-700 mb-2">
            Review Notes
           </label>
           <textarea
            value={reviewNotes}
            onChange={(e) => setReviewNotes(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cardinal focus:border-transparent"
            placeholder="Add notes about your decision..."
           />
          </div>

          <div className="flex gap-4">
           <button
            onClick={() => handleReview(selectedApp.id, 'approved')}
            disabled={submittingReview}
            className="px-6 py-2 bg-green-600 text-white rounded-lg  hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
           >
            {submittingReview ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
            Approve
           </button>
           
           <button
            onClick={() => handleReview(selectedApp.id, 'rejected')}
            disabled={submittingReview}
            className="px-6 py-2 bg-red-600 text-white rounded-lg  hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
           >
            {submittingReview ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
            Reject
           </button>
          </div>
         </div>
        )}

        {/* Previous Review Notes */}
        {selectedApp.reviewerNotes && (
         <div className="border-t border-gray-200 pt-6">
          <h3 className=" text-gray-900 mb-2">Review Notes</h3>
          <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">{selectedApp.reviewerNotes}</p>
         </div>
        )}
       </div>
      </div>
     </div>
    )}
   </div>
  </main>
 )
}
