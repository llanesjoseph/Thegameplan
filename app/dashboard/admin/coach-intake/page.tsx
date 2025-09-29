'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useCreatorStatus } from '@/hooks/use-creator-status'
import { isAdmin } from '@/lib/role-management'
import { db } from '@/lib/firebase'
import { collection, query, orderBy, onSnapshot, doc, updateDoc, setDoc } from 'firebase/firestore'
import AppHeader from '@/components/ui/AppHeader'
import Link from 'next/link'
import {
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  ArrowLeft,
  Search,
  Filter,
  Loader2,
  Award,
  Calendar,
  Mail,
  User
} from 'lucide-react'

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

export default function CoachIntakeApprovalPage() {
  const { user } = useAuth()
  const { roleData, loading: roleLoading } = useCreatorStatus()
  const [applications, setApplications] = useState<CoachApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedApp, setSelectedApp] = useState<CoachApplication | null>(null)
  const [reviewNotes, setReviewNotes] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)

  const hasAccess = isAdmin(roleData)

  useEffect(() => {
    if (!hasAccess || roleLoading) return

    const q = query(
      collection(db, 'coach_applications'),
      orderBy('submittedAt', 'desc')
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const apps = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as CoachApplication))

      setApplications(apps)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [hasAccess, roleLoading])

  const handleReview = async (applicationId: string, decision: 'approved' | 'rejected') => {
    if (!selectedApp) return

    setSubmittingReview(true)
    try {
      const application = applications.find(app => app.id === applicationId)
      if (!application) return

      // Update application status
      await updateDoc(doc(db, 'coach_applications', applicationId), {
        status: decision,
        reviewedAt: new Date().toISOString(),
        reviewedBy: user?.uid,
        reviewNotes: reviewNotes
      })

      if (decision === 'approved') {
        // Create coach profile
        const coachProfile = {
          id: application.userId,
          name: application.displayName,
          firstName: application.displayName.split(' ')[0],
          sport: application.applicationData.sport.toLowerCase(),
          tagline: application.applicationData.tagline,
          heroImageUrl: '',
          headshotUrl: '',
          badges: ['New Coach'],
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
              icon: Award,
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

        // Update user role
        await updateDoc(doc(db, 'users', application.userId), {
          role: 'coach',
          updatedAt: new Date().toISOString()
        })

        // Add to creators index
        await setDoc(doc(db, 'creators_index', application.userId), {
          displayName: application.displayName,
          sport: application.applicationData.sport,
          specialties: application.applicationData.specialties,
          lastUpdated: new Date().toISOString(),
          profileUrl: `/contributors/${application.userId}`,
          isActive: true
        })
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
      <div className="min-h-screen bg-gradient-to-br from-cream via-cream to-sky-blue/10 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-sky-blue mx-auto mb-4" />
          <p className="text-dark/60">Checking permissions...</p>
        </div>
      </div>
    )
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cream via-cream to-sky-blue/10">
        <AppHeader />
        <div className="flex items-center justify-center min-h-[80vh] px-4">
          <div className="max-w-md mx-auto text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-orange to-orange/80 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl text-dark mb-4">Access Denied</h1>
            <p className="text-dark/70 mb-6">You don't have permission to access this page.</p>
            <Link
              href="/dashboard"
              className="block w-full bg-gradient-to-r from-sky-blue to-black text-white py-3 rounded-xl"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const filteredApplications = applications.filter(app => {
    const matchesFilter = filter === 'all' || app.status === filter
    const matchesSearch = searchTerm === '' ||
      app.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.applicationData.sport.toLowerCase().includes(searchTerm.toLowerCase())

    return matchesFilter && matchesSearch
  })

  const pendingCount = applications.filter(a => a.status === 'pending').length
  const approvedCount = applications.filter(a => a.status === 'approved').length
  const totalCount = applications.length

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream via-cream to-sky-blue/10">
      <AppHeader />

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/creator" className="p-3 hover:bg-white/80 rounded-xl transition-colors shadow-sm backdrop-blur-sm border border-white/20">
              <ArrowLeft className="w-5 h-5 text-dark" />
            </Link>
            <div>
              <h1 className="text-4xl text-dark font-heading">Coach Intake Approval</h1>
              <p className="text-dark/60">Review and approve new coaching applications</p>
            </div>
          </div>

          {/* Stats */}
          <div className="flex gap-4">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 text-center border border-white/50">
              <div className="text-2xl text-orange">{pendingCount}</div>
              <div className="text-sm text-dark/60">Pending</div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 text-center border border-white/50">
              <div className="text-2xl text-green">{approvedCount}</div>
              <div className="text-sm text-dark/60">Approved</div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 text-center border border-white/50">
              <div className="text-2xl text-sky-blue">{totalCount}</div>
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
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="px-4 py-3 border-2 border-sky-blue/20 bg-white/80 rounded-xl text-dark focus:border-sky-blue focus:ring-4 focus:ring-sky-blue/20 transition-all"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
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
              <User className="w-12 h-12 text-dark/30 mx-auto mb-4" />
              <h3 className="text-lg text-dark mb-2">No Applications Found</h3>
              <p className="text-dark/60">
                {searchTerm || filter !== 'all'
                  ? 'No applications match your current filters.'
                  : 'No coach applications have been submitted yet.'
                }
              </p>
            </div>
          ) : (
            <div className="divide-y divide-dark/5">
              {filteredApplications.map((app) => (
                <div key={app.id} className="p-6 hover:bg-sky-blue/5 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-black to-sky-blue rounded-xl flex items-center justify-center text-white text-lg overflow-hidden">
                        {app.displayName.charAt(0)}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg text-dark">{app.displayName}</h3>
                          <div className={`px-3 py-1 rounded-full text-xs ${
                            app.status === 'pending' ? 'bg-orange/20 text-orange border border-orange/30' :
                            app.status === 'approved' ? 'bg-green/20 text-green border border-green/30' :
                            'bg-dark/20 text-dark border border-dark/30'
                          }`}>
                            {app.status.toUpperCase()}
                          </div>
                        </div>

                        <p className="text-dark/70 mb-2 flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          {app.email}
                        </p>

                        <div className="flex items-center gap-4 text-sm text-dark/60">
                          <span className="flex items-center gap-1">
                            <Award className="w-4 h-4" />
                            {app.applicationData.sport}
                          </span>
                          <span>{app.applicationData.experience}</span>
                          <span>{app.applicationData.specialties.length} specialties</span>
                        </div>

                        {app.applicationData.tagline && (
                          <p className="text-dark/60 text-sm mt-2 line-clamp-1 italic">
                            "{app.applicationData.tagline}"
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right text-sm text-dark/60">
                        <div>Applied</div>
                        <div>{new Date(app.submittedAt).toLocaleDateString()}</div>
                      </div>

                      <button
                        onClick={() => setSelectedApp(app)}
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
        {selectedApp && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="sticky top-0 bg-white/95 backdrop-blur-sm p-6 border-b border-dark/10 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl text-dark">{selectedApp.displayName}</h2>
                    <p className="text-dark/60">{selectedApp.email}</p>
                  </div>
                  <button
                    onClick={() => setSelectedApp(null)}
                    className="p-2 hover:bg-dark/5 rounded-lg transition-colors"
                  >
                    <XCircle className="w-6 h-6 text-dark/60" />
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-6">
                {/* Basic Info */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg text-dark mb-4">Basic Information</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm text-dark/60">Sport</label>
                        <p className="text-dark">{selectedApp.applicationData.sport}</p>
                      </div>
                      <div>
                        <label className="text-sm text-dark/60">Experience</label>
                        <p className="text-dark">{selectedApp.applicationData.experience}</p>
                      </div>
                      <div>
                        <label className="text-sm text-dark/60">Tagline</label>
                        <p className="text-dark">{selectedApp.applicationData.tagline}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg text-dark mb-4">Specialties</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedApp.applicationData.specialties.map((specialty, index) => (
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
                    <h4 className="text-xl text-dark mb-3">{selectedApp.applicationData.philosophy.title}</h4>
                    <p className="text-dark/70 mb-6">{selectedApp.applicationData.philosophy.description}</p>

                    <div className="grid md:grid-cols-3 gap-4">
                      {selectedApp.applicationData.philosophy.points.map((point, index) => (
                        <div key={index} className="bg-white rounded-lg p-4">
                          <h5 className="text-dark mb-2">{point.title}</h5>
                          <p className="text-dark/60 text-sm">{point.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Review Actions */}
                {selectedApp.status === 'pending' && (
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
                        onClick={() => handleReview(selectedApp.id, 'approved')}
                        disabled={submittingReview}
                        className="flex-1 bg-gradient-to-r from-green to-green/90 text-white py-3 rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {submittingReview ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                        Approve Coach
                      </button>

                      <button
                        onClick={() => handleReview(selectedApp.id, 'rejected')}
                        disabled={submittingReview}
                        className="flex-1 bg-gradient-to-r from-orange to-orange/90 text-white py-3 rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {submittingReview ? <Loader2 className="w-5 h-5 animate-spin" /> : <XCircle className="w-5 h-5" />}
                        Reject Application
                      </button>
                    </div>
                  </div>
                )}

                {/* Review History */}
                {selectedApp.reviewedAt && (
                  <div className="bg-dark/5 rounded-xl p-6">
                    <h3 className="text-lg text-dark mb-4">Review History</h3>
                    <div className="space-y-2">
                      <p className="text-dark/70">
                        Reviewed on {new Date(selectedApp.reviewedAt).toLocaleString()}
                      </p>
                      {selectedApp.reviewNotes && (
                        <div className="bg-white rounded-lg p-4">
                          <p className="text-dark">{selectedApp.reviewNotes}</p>
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
    </div>
  )
}