'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useEnhancedRole } from '@/hooks/use-role-switcher'
import { db } from '@/lib/firebase'
import { collection, query, orderBy, onSnapshot, doc, updateDoc, setDoc, deleteDoc } from 'firebase/firestore'
import {
 CheckCircle,
 XCircle,
 Clock,
 Eye,
 Star,
 Trophy,
 Target,
 Users,
 ArrowLeft,
 Search,
 Filter,
 MessageSquare
} from 'lucide-react'
import Link from 'next/link'

interface CoachApplication {
 id: string
 userId: string
 email: string
 displayName: string
 currentRole: string
 requestedRole: string
 applicationData: {
  sport: string
  experience: string
  credentials: string
  tagline: string
  philosophy: {
   title: string
   description: string
   points: Array<{
    title: string
    description: string
   }>
  }
  specialties: string[]
  achievements: string[]
  references: string[]
  sampleQuestions: string[]
 }
 status: 'pending' | 'approved' | 'rejected' | 'under_review'
 submittedAt: string
 reviewedAt?: string
 reviewedBy?: string
 reviewNotes?: string
}

export default function CoachApplicationsPage() {
 const { user } = useAuth()
 const { role } = useEnhancedRole()
 const [applications, setApplications] = useState<CoachApplication[]>([])
 const [loading, setLoading] = useState(true)
 const [selectedApplication, setSelectedApplication] = useState<CoachApplication | null>(null)
 const [reviewNotes, setReviewNotes] = useState('')
 const [searchTerm, setSearchTerm] = useState('')
 const [statusFilter, setStatusFilter] = useState<string>('all')

 useEffect(() => {
  if (role !== 'admin' && role !== 'superadmin') return

  const q = query(
   collection(db, 'coach_applications'),
   orderBy('submittedAt', 'desc')
  )

  const unsubscribe = onSnapshot(q, (snapshot) => {
   const apps = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
   })) as CoachApplication[]

   setApplications(apps)
   setLoading(false)
  })

  return () => unsubscribe()
 }, [role])

 const handleReviewApplication = async (applicationId: string, newStatus: 'approved' | 'rejected', notes: string = '') => {
  if (!user?.uid) return

  try {
   const application = applications.find(app => app.id === applicationId)
   if (!application) return

   // Update application status
   await updateDoc(doc(db, 'coach_applications', applicationId), {
    status: newStatus,
    reviewedAt: new Date().toISOString(),
    reviewedBy: user.uid,
    reviewNotes: notes
   })

   if (newStatus === 'approved') {
    // Create coach profile based on application
    const coachProfile = {
     id: application.userId,
     name: application.displayName,
     firstName: application.displayName.split(' ')[0],
     sport: application.applicationData.sport.toLowerCase(),
     tagline: application.applicationData.tagline,
     heroImageUrl: '', // To be uploaded later
     headshotUrl: '', // To be uploaded later
     badges: ['New Coach'], // Start with basic badge
     lessonCount: 0,
     specialties: application.applicationData.specialties,
     experience: application.applicationData.experience,
     verified: true,
     featured: false,
     credentials: application.applicationData.credentials || application.applicationData.experience,
     philosophy: {
      title: application.applicationData.philosophy.title,
      description: application.applicationData.philosophy.description,
      points: application.applicationData.philosophy.points.map(point => ({
       icon: Target, // Default icon, can be customized later
       title: point.title,
       description: point.description
      }))
     },
     sampleQuestions: application.applicationData.sampleQuestions.filter(q => q.trim()),
     assistantCoaches: [],
     stats: {
      studentsHelped: 0,
      averageRating: 0,
      totalLessons: 0,
      yearsExperience: parseInt(application.applicationData.experience.match(/\d+/)?.[0] || '0')
     },
     createdAt: new Date().toISOString(),
     updatedAt: new Date().toISOString()
    }

    // Save to coaches collection
    await setDoc(doc(db, 'coaches', application.userId), coachProfile)

    // Update user role in users collection
    await updateDoc(doc(db, 'users', application.userId), {
     role: 'creator',
     updatedAt: new Date().toISOString()
    })

    // Add to creators index for discoverability
    await setDoc(doc(db, 'creators_index', application.userId), {
     displayName: application.displayName,
     sport: application.applicationData.sport,
     specialties: application.applicationData.specialties,
     lastUpdated: new Date().toISOString(),
     profileUrl: `/contributors/${application.userId}`,
     isActive: true
    })
   }

   setSelectedApplication(null)
   setReviewNotes('')
  } catch (error) {
   console.error('Error reviewing application:', error)
   alert('Error processing application. Please try again.')
  }
 }

 const filteredApplications = applications.filter(app => {
  const matchesSearch = app.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
             app.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
             app.applicationData.sport.toLowerCase().includes(searchTerm.toLowerCase())

  const matchesStatus = statusFilter === 'all' || app.status === statusFilter

  return matchesSearch && matchesStatus
 })

 // Unauthorized access
 if (role !== 'admin' && role !== 'superadmin') {
  return (
   <div className="min-h-screen bg-gradient-to-br from-cream via-cream to-sky-blue/10 flex items-center justify-center px-4">
    <div className="max-w-md mx-auto text-center">
     <div className="w-16 h-16 bg-gradient-to-r from-orange to-orange/80 rounded-2xl flex items-center justify-center mx-auto mb-6">
      <XCircle className="w-8 h-8 text-white" />
     </div>
     <h1 className="text-2xl text-dark mb-4">Access Denied</h1>
     <p className="text-dark/70 mb-6">You don't have permission to access the admin panel.</p>
     <Link
      href="/dashboard"
      className="block w-full bg-gradient-to-r from-sky-blue to-black text-white py-3 rounded-xl "
     >
      Back to Dashboard
     </Link>
    </div>
   </div>
  )
 }

 return (
  <main className="min-h-screen bg-gradient-to-br from-cream via-cream to-sky-blue/10">
   <div className="max-w-7xl mx-auto px-6 py-8">
    {/* Header */}
    <div className="flex items-center justify-between mb-8">
     <div className="flex items-center gap-4">
      <Link href="/dashboard/admin" className="p-3 hover:bg-white/80 rounded-xl transition-colors shadow-sm backdrop-blur-sm border border-white/20">
       <ArrowLeft className="w-5 h-5 text-dark" />
      </Link>
      <div>
       <h1 className="text-4xl text-dark font-heading">Coach Applications</h1>
       <p className="text-dark/60 ">Review and approve coaching applications</p>
      </div>
     </div>

     {/* Stats */}
     <div className="flex gap-4">
      <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 text-center border border-white/50">
       <div className="text-2xl text-orange">{applications.filter(a => a.status === 'pending').length}</div>
       <div className="text-sm text-dark/60">Pending</div>
      </div>
      <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 text-center border border-white/50">
       <div className="text-2xl text-green">{applications.filter(a => a.status === 'approved').length}</div>
       <div className="text-sm text-dark/60">Approved</div>
      </div>
      <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 text-center border border-white/50">
       <div className="text-2xl text-sky-blue">{applications.length}</div>
       <div className="text-sm text-dark/60">Total</div>
      </div>
     </div>
    </div>

    {/* Filters */}
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-6 mb-8">
     <div className="flex flex-col md:flex-row gap-4">
      <div className="flex-1">
       <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-dark/40" />
        <input
         type="text"
         placeholder="Search applications..."
         value={searchTerm}
         onChange={(e) => setSearchTerm(e.target.value)}
         className="w-full pl-10 pr-4 py-3 border-2 border-sky-blue/20 bg-white/80 rounded-xl text-dark placeholder-dark/50 focus:border-sky-blue focus:ring-4 focus:ring-sky-blue/20 transition-all"
        />
       </div>
      </div>
      <div className="flex items-center gap-2">
       <Filter className="w-4 h-4 text-dark/60" />
       <select
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value)}
        className="px-4 py-3 border-2 border-sky-blue/20 bg-white/80 rounded-xl text-dark focus:border-sky-blue focus:ring-4 focus:ring-sky-blue/20 transition-all"
       >
        <option value="all">All Status</option>
        <option value="pending">Pending</option>
        <option value="under_review">Under Review</option>
        <option value="approved">Approved</option>
        <option value="rejected">Rejected</option>
       </select>
      </div>
     </div>
    </div>

    {/* Applications List */}
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 overflow-hidden">
     {loading ? (
      <div className="p-12 text-center">
       <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-blue mx-auto mb-4"></div>
       <p className="text-dark/60">Loading applications...</p>
      </div>
     ) : filteredApplications.length === 0 ? (
      <div className="p-12 text-center">
       <MessageSquare className="w-12 h-12 text-dark/30 mx-auto mb-4" />
       <h3 className="text-lg  text-dark mb-2">No Applications Found</h3>
       <p className="text-dark/60">
        {searchTerm || statusFilter !== 'all'
         ? 'No applications match your current filters.'
         : 'No coach applications have been submitted yet.'
        }
       </p>
      </div>
     ) : (
      <div className="divide-y divide-dark/5">
       {filteredApplications.map((application) => (
        <div key={application.id} className="p-6 hover:bg-sky-blue/5 transition-colors">
         <div className="flex items-center justify-between">
          <div className="flex items-start gap-4">
           <div className="w-12 h-12 bg-gradient-to-br from-black to-sky-blue rounded-xl flex items-center justify-center text-white text-lg">
            {application.displayName.charAt(0)}
           </div>

           <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
             <h3 className="text-lg text-dark">{application.displayName}</h3>
             <div className={`px-3 py-1 rounded-full text-xs  ${
              application.status === 'pending' ? 'bg-orange/20 text-orange border border-orange/30' :
              application.status === 'under_review' ? 'bg-sky-blue/20 text-sky-blue border border-sky-blue/30' :
              application.status === 'approved' ? 'bg-green/20 text-green border border-green/30' :
              'bg-dark/20 text-dark border border-dark/30'
             }`}>
              {application.status.replace('_', ' ').toUpperCase()}
             </div>
            </div>

            <p className="text-dark/70 mb-2">{application.email}</p>

            <div className="flex items-center gap-4 text-sm text-dark/60">
             <span className="flex items-center gap-1">
              <Star className="w-4 h-4" />
              {application.applicationData.sport}
             </span>
             <span>{application.applicationData.experience}</span>
             <span>{application.applicationData.specialties.length} specialties</span>
            </div>

            <p className="text-dark/60 text-sm mt-2 line-clamp-2">
             {application.applicationData.tagline}
            </p>
           </div>
          </div>

          <div className="flex items-center gap-3">
           <div className="text-right text-sm text-dark/60">
            <div>Applied</div>
            <div>{new Date(application.submittedAt).toLocaleDateString()}</div>
           </div>

           <button
            onClick={() => setSelectedApplication(application)}
            className="px-4 py-2 bg-sky-blue/20 text-sky-blue rounded-lg hover:bg-sky-blue/30 transition-colors flex items-center gap-2"
           >
            <Eye className="w-4 h-4" />
            Review
           </button>
          </div>
         </div>
        </div>
       ))}
      </div>
     )}
    </div>

    {/* Application Review Modal */}
    {selectedApplication && (
     <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
       {/* Modal Header */}
       <div className="sticky top-0 bg-white/95 backdrop-blur-sm p-6 border-b border-dark/10 rounded-t-2xl">
        <div className="flex items-center justify-between">
         <div>
          <h2 className="text-2xl text-dark">{selectedApplication.displayName}</h2>
          <p className="text-dark/60">{selectedApplication.email}</p>
         </div>
         <button
          onClick={() => setSelectedApplication(null)}
          className="p-2 hover:bg-dark/5 rounded-lg transition-colors"
         >
          <XCircle className="w-6 h-6 text-dark/60" />
         </button>
        </div>
       </div>

       {/* Modal Content */}
       <div className="p-6 space-y-8">
        {/* Basic Info */}
        <div className="grid md:grid-cols-2 gap-6">
         <div>
          <h3 className="text-lg text-dark mb-4">Basic Information</h3>
          <div className="space-y-3">
           <div>
            <label className="text-sm  text-dark/60">Sport</label>
            <p className="text-dark ">{selectedApplication.applicationData.sport}</p>
           </div>
           <div>
            <label className="text-sm  text-dark/60">Experience</label>
            <p className="text-dark">{selectedApplication.applicationData.experience}</p>
           </div>
           <div>
            <label className="text-sm  text-dark/60">Tagline</label>
            <p className="text-dark">{selectedApplication.applicationData.tagline}</p>
           </div>
          </div>
         </div>

         <div>
          <h3 className="text-lg text-dark mb-4">Specialties</h3>
          <div className="flex flex-wrap gap-2">
           {selectedApplication.applicationData.specialties.map((specialty, index) => (
            <span
             key={index}
             className="px-3 py-1 bg-sky-blue/20 text-sky-blue rounded-full text-sm border border-sky-blue/30"
            >
             {specialty}
            </span>
           ))}
          </div>
         </div>
        </div>

        {/* Philosophy */}
        <div>
         <h3 className="text-lg text-dark mb-4">Coaching Philosophy</h3>
         <div className="bg-dark/5 rounded-xl p-6">
          <h4 className="text-xl text-dark mb-3">{selectedApplication.applicationData.philosophy.title}</h4>
          <p className="text-dark/70 mb-6">{selectedApplication.applicationData.philosophy.description}</p>

          <div className="grid md:grid-cols-3 gap-4">
           {selectedApplication.applicationData.philosophy.points.map((point, index) => (
            <div key={index} className="bg-white rounded-lg p-4">
             <h5 className=" text-dark mb-2">{point.title}</h5>
             <p className="text-dark/60 text-sm">{point.description}</p>
            </div>
           ))}
          </div>
         </div>
        </div>

        {/* Review Actions */}
        {selectedApplication.status === 'pending' && (
         <div className="bg-cream/50 rounded-xl p-6">
          <h3 className="text-lg text-dark mb-4">Review Application</h3>

          <textarea
           value={reviewNotes}
           onChange={(e) => setReviewNotes(e.target.value)}
           placeholder="Add review notes (optional)..."
           className="w-full border-2 border-sky-blue/20 bg-white/80 rounded-xl p-4 text-dark placeholder-dark/50 focus:border-sky-blue focus:ring-4 focus:ring-sky-blue/20 transition-all resize-none mb-4"
           rows={3}
          />

          <div className="flex gap-4">
           <button
            onClick={() => handleReviewApplication(selectedApplication.id, 'approved', reviewNotes)}
            className="flex-1 bg-gradient-to-r from-green to-green/90 text-white py-3 rounded-xl  hover:opacity-90 transition-all flex items-center justify-center gap-2"
           >
            <CheckCircle className="w-5 h-5" />
            Approve Application
           </button>

           <button
            onClick={() => handleReviewApplication(selectedApplication.id, 'rejected', reviewNotes)}
            className="flex-1 bg-gradient-to-r from-orange to-orange/90 text-white py-3 rounded-xl  hover:opacity-90 transition-all flex items-center justify-center gap-2"
           >
            <XCircle className="w-5 h-5" />
            Reject Application
           </button>
          </div>
         </div>
        )}

        {/* Review History */}
        {selectedApplication.reviewedAt && (
         <div className="bg-dark/5 rounded-xl p-6">
          <h3 className="text-lg text-dark mb-4">Review History</h3>
          <div className="space-y-2">
           <p className="text-dark/70">
            Reviewed on {new Date(selectedApplication.reviewedAt).toLocaleString()}
           </p>
           {selectedApplication.reviewNotes && (
            <div className="bg-white rounded-lg p-4">
             <p className="text-dark">{selectedApplication.reviewNotes}</p>
            </div>
           )}
          </div>
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