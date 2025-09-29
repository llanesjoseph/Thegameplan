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
import AppHeader from '@/components/ui/AppHeader'
import Link from 'next/link'
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
 Loader2,
 ArrowLeft
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

 // Remove duplicates and sort applications
 const uniqueApplications = applications.reduce((unique, app) => {
  const existingIndex = unique.findIndex(existing => existing.email === app.email)
  if (existingIndex >= 0) {
   // Keep the most recent application
   if (app.submittedAt?.seconds > unique[existingIndex].submittedAt?.seconds) {
    unique[existingIndex] = app
   }
  } else {
   unique.push(app)
  }
  return unique
 }, [] as CreatorApplication[])

 const filteredApplications = uniqueApplications.filter(app => {
  const matchesFilter = filter === 'all' || app.status === filter
  const matchesSearch = searchTerm === '' ||
   `${app.firstName} ${app.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
   app.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
   app.primarySport.toLowerCase().includes(searchTerm.toLowerCase())

  return matchesFilter && matchesSearch
 })

 return (
  <div className="min-h-screen bg-gradient-to-br from-cream via-cream to-sky-blue/10">
   <AppHeader />

   {/* Hero Section */}
   <div className="relative overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent z-10"></div>
    <div className="relative z-20 max-w-6xl mx-auto px-6 py-16">
     <div className="flex items-center gap-4 mb-6">
      <Link href="/dashboard" className="p-3 hover:bg-white/20 rounded-xl transition-colors backdrop-blur-sm border border-white/20">
       <ArrowLeft className="w-5 h-5 text-white" />
      </Link>
      <div>
       <h1 className="text-5xl text-white font-heading mb-2">Coach Applications</h1>
       <p className="text-white/80 text-xl">Review and manage coach applications</p>
      </div>
     </div>

     {/* Quick Stats */}
     <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
       <div className="text-3xl text-white font-bold">{uniqueApplications.length}</div>
       <div className="text-white/80 text-sm">Total Applications</div>
      </div>
      <div className="bg-orange/20 backdrop-blur-sm rounded-2xl p-4 border border-orange/30">
       <div className="text-3xl text-white font-bold">{uniqueApplications.filter(app => app.status === 'pending').length}</div>
       <div className="text-white/80 text-sm">Pending Review</div>
      </div>
      <div className="bg-green/20 backdrop-blur-sm rounded-2xl p-4 border border-green/30">
       <div className="text-3xl text-white font-bold">{uniqueApplications.filter(app => app.status === 'approved').length}</div>
       <div className="text-white/80 text-sm">Approved</div>
      </div>
      <div className="bg-red-500/20 backdrop-blur-sm rounded-2xl p-4 border border-red-500/30">
       <div className="text-3xl text-white font-bold">{uniqueApplications.filter(app => app.status === 'rejected').length}</div>
       <div className="text-white/80 text-sm">Rejected</div>
      </div>
     </div>
    </div>
    <div className="absolute inset-0 bg-gradient-to-r from-sky-blue to-black opacity-90"></div>
   </div>

   {/* Main Content */}
   <div className="max-w-6xl mx-auto px-6 py-8">
    {/* Filters */}
    <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 p-8 mb-8">
     <div className="flex flex-col lg:flex-row gap-6">
      <div className="flex-1">
       <div className="relative">
        <Search className="w-6 h-6 text-dark/40 absolute left-4 top-1/2 transform -translate-y-1/2" />
        <input
         type="text"
         placeholder="Search by name, email, or sport..."
         value={searchTerm}
         onChange={(e) => setSearchTerm(e.target.value)}
         className="w-full pl-12 pr-6 py-4 border-2 border-sky-blue/20 bg-white rounded-2xl text-dark placeholder-dark/50 focus:border-sky-blue focus:ring-4 focus:ring-sky-blue/20 transition-all text-lg"
        />
       </div>
      </div>
      <div className="flex flex-wrap gap-3">
       {(['all', 'pending', 'approved', 'rejected'] as const).map((status) => (
        <button
         key={status}
         onClick={() => setFilter(status)}
         className={`px-8 py-4 rounded-2xl font-semibold transition-all text-lg ${
          filter === status
           ? 'bg-gradient-to-r from-sky-blue to-sky-blue/90 text-white shadow-xl scale-105'
           : 'bg-white text-dark hover:bg-sky-blue/5 border-2 border-sky-blue/20 hover:border-sky-blue/40 hover:scale-105'
         }`}
        >
         {status.charAt(0).toUpperCase() + status.slice(1)}
         {status !== 'all' && (
          <span className="ml-2 px-2 py-1 bg-white/20 rounded-full text-xs">
           {uniqueApplications.filter(app => app.status === status).length}
          </span>
         )}
        </button>
       ))}
      </div>
     </div>
    </div>

    {/* Applications Grid */}
    <div className="space-y-6">
     {loading ? (
      <div className="text-center py-16">
       <Loader2 className="w-12 h-12 animate-spin text-sky-blue mx-auto mb-6" />
       <h3 className="text-2xl text-dark font-heading mb-2">Loading Applications</h3>
       <p className="text-dark/60">Please wait while we fetch the coach applications...</p>
      </div>
     ) : filteredApplications.length === 0 ? (
      <div className="text-center py-16">
       <div className="w-24 h-24 bg-gradient-to-r from-sky-blue/20 to-black/20 rounded-3xl flex items-center justify-center mx-auto mb-6">
        <FileText className="w-12 h-12 text-dark/40" />
       </div>
       <h3 className="text-3xl text-dark font-heading mb-3">No Applications Found</h3>
       <p className="text-dark/60 text-lg mb-6">Try adjusting your search or filter criteria</p>
       <button
        onClick={() => {
         setSearchTerm('')
         setFilter('all')
        }}
        className="px-6 py-3 bg-gradient-to-r from-sky-blue to-sky-blue/90 text-white rounded-2xl font-medium hover:shadow-lg transition-all"
       >
        Clear Filters
       </button>
      </div>
     ) : (
      <div className="grid gap-6">
       {filteredApplications.map((app) => (
        <div key={app.id} className="group bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 hover:shadow-2xl transition-all duration-300 overflow-hidden hover:scale-[1.02]">
         <div className="p-8">
          <div className="flex items-start justify-between">
           <div className="flex items-start gap-6">
            <div className="relative">
             <div className="w-20 h-20 rounded-3xl overflow-hidden shadow-xl border-4 border-white">
              {app.headshotUrl ? (
               <img
                src={app.headshotUrl}
                alt={`${app.firstName} ${app.lastName}`}
                className="w-full h-full object-cover"
               />
              ) : (
               <div className="w-full h-full bg-gradient-to-br from-sky-blue via-sky-blue to-black flex items-center justify-center">
                <User className="w-10 h-10 text-white" />
               </div>
              )}
             </div>
             <div className={`absolute -bottom-2 -right-2 w-8 h-8 rounded-full border-4 border-white flex items-center justify-center ${
              app.status === 'pending' ? 'bg-orange' : app.status === 'approved' ? 'bg-green' : 'bg-red-500'
             }`}>
              {app.status === 'pending' ? (
               <Clock className="w-4 h-4 text-white" />
              ) : app.status === 'approved' ? (
               <CheckCircle className="w-4 h-4 text-white" />
              ) : (
               <XCircle className="w-4 h-4 text-white" />
              )}
             </div>
            </div>

            <div className="flex-1">
             <div className="flex items-start justify-between mb-3">
              <div>
               <h2 className="text-2xl text-dark font-heading mb-1">
                {app.firstName} {app.lastName}
               </h2>
               <p className="text-dark/70 text-lg">{app.email}</p>
              </div>
             </div>

             <div className="flex flex-wrap gap-4 mb-4">
              <div className="flex items-center gap-2 bg-sky-blue/10 px-4 py-2 rounded-xl">
               <Award className="w-5 h-5 text-sky-blue" />
               <span className="text-dark font-medium">{app.primarySport}</span>
              </div>
              <div className="flex items-center gap-2 bg-green/10 px-4 py-2 rounded-xl">
               <Calendar className="w-5 h-5 text-green" />
               <span className="text-dark font-medium">{app.experience} experience</span>
              </div>
              <div className="flex items-center gap-2 bg-orange/10 px-4 py-2 rounded-xl">
               <Clock className="w-5 h-5 text-orange" />
               <span className="text-dark font-medium">
                {app.submittedAt?.toDate?.()?.toLocaleDateString() || 'Recently submitted'}
               </span>
              </div>
             </div>

             {app.specialties && app.specialties.length > 0 && (
              <div className="flex flex-wrap gap-2">
               {app.specialties.slice(0, 3).map((specialty, index) => (
                <span key={index} className="px-3 py-1 bg-dark/10 text-dark/70 rounded-full text-sm">
                 {specialty.replace('-', ' ')}
                </span>
               ))}
               {app.specialties.length > 3 && (
                <span className="px-3 py-1 bg-dark/5 text-dark/50 rounded-full text-sm">
                 +{app.specialties.length - 3} more
                </span>
               )}
              </div>
             )}
            </div>
           </div>

           <div className="flex flex-col items-end gap-4">
            <div className={`px-6 py-3 rounded-2xl font-semibold text-lg shadow-lg ${
             app.status === 'pending'
              ? 'bg-gradient-to-r from-orange to-orange/90 text-white'
              : app.status === 'approved'
              ? 'bg-gradient-to-r from-green to-green/90 text-white'
              : 'bg-gradient-to-r from-red-500 to-red-600 text-white'
            }`}>
             {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
            </div>

            <button
             onClick={() => setSelectedApp(app)}
             className="px-6 py-3 bg-gradient-to-r from-sky-blue to-sky-blue/90 text-white rounded-2xl font-medium hover:shadow-xl transition-all flex items-center gap-2 group-hover:scale-105"
            >
             <Eye className="w-5 h-5" />
             Review Application
            </button>
           </div>
          </div>
         </div>
        </div>
       ))}
      </div>
     )}
    </div>

    {/* Application Detail Modal */}
    {selectedApp && (
     <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-gradient-to-br from-white to-sky-blue/5 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-white/50 backdrop-blur-sm">
       <div className="p-6 border-b border-sky-blue/20">
        <div className="flex items-center justify-between">
         <h2 className="text-2xl text-dark font-heading">
          Application Review: {selectedApp.firstName} {selectedApp.lastName}
         </h2>
         <button
          onClick={() => setSelectedApp(null)}
          className="p-2 text-dark/40 hover:text-dark rounded-xl hover:bg-white/50 transition-colors"
         >
          <XCircle className="w-6 h-6" />
         </button>
        </div>
       </div>

       <div className="p-6 space-y-6">
        {/* Basic Info */}
        <div className="grid md:grid-cols-2 gap-6">
         <div className="space-y-4">
          <h3 className="text-xl text-dark font-heading">Personal Information</h3>
          <div className="space-y-2">
           <p><span className="">Name:</span> {selectedApp.firstName} {selectedApp.lastName}</p>
           <p><span className="">Email:</span> {selectedApp.email}</p>
           <p><span className="">Primary Sport:</span> {selectedApp.primarySport}</p>
           <p><span className="">Experience:</span> {selectedApp.experience}</p>
          </div>
         </div>

         <div className="space-y-4">
          <h3 className="text-xl text-dark font-heading">Application Status</h3>
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
         <h3 className="text-xl text-dark font-heading mb-2">Experience Details</h3>
         <p className="text-dark/70 bg-white/50 p-4 rounded-xl border border-sky-blue/20">{selectedApp.experienceDetails}</p>
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
            className="px-6 py-3 bg-gradient-to-r from-green to-green/90 text-white rounded-xl font-medium hover:from-green/90 hover:to-green shadow-lg disabled:opacity-50 flex items-center gap-2 transition-all"
           >
            {submittingReview ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
            Approve
           </button>
           
           <button
            onClick={() => handleReview(selectedApp.id, 'rejected')}
            disabled={submittingReview}
            className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-medium hover:from-red-600 hover:to-red-700 shadow-lg disabled:opacity-50 flex items-center gap-2 transition-all"
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
  </>
 )
}
