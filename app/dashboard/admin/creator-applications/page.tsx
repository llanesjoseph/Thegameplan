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
  Calendar,
  Award,
  ArrowLeft,
  Search,
  Filter,
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
      await updateDoc(doc(db, 'contributorApplications', applicationId), {
        status: decision,
        reviewedAt: serverTimestamp(),
        reviewerNotes: reviewNotes,
        reviewerId: user?.uid
      })

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
            <p className="text-dark/70 mb-6">You don't have permission to access the admin panel.</p>
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

  // Remove duplicates
  const uniqueApplications = applications.reduce((unique, app) => {
    const existingIndex = unique.findIndex(existing => existing.email === app.email)
    if (existingIndex >= 0) {
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

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="p-3 hover:bg-white/80 rounded-xl transition-colors shadow-sm backdrop-blur-sm border border-white/20">
              <ArrowLeft className="w-5 h-5 text-dark" />
            </Link>
            <div>
              <h1 className="text-4xl text-dark font-heading">Creator Applications</h1>
              <p className="text-dark/60">Review and approve creator applications</p>
            </div>
          </div>

          {/* Stats */}
          <div className="flex gap-4">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 text-center border border-white/50">
              <div className="text-2xl text-orange">{uniqueApplications.filter(a => a.status === 'pending').length}</div>
              <div className="text-sm text-dark/60">Pending</div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 text-center border border-white/50">
              <div className="text-2xl text-green">{uniqueApplications.filter(a => a.status === 'approved').length}</div>
              <div className="text-sm text-dark/60">Approved</div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 text-center border border-white/50">
              <div className="text-2xl text-sky-blue">{uniqueApplications.length}</div>
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
                  : 'No creator applications have been submitted yet.'
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
                        {app.headshotUrl ? (
                          <img src={app.headshotUrl} alt={`${app.firstName} ${app.lastName}`} className="w-full h-full object-cover" />
                        ) : (
                          `${app.firstName.charAt(0)}${app.lastName.charAt(0)}`
                        )}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg text-dark">{app.firstName} {app.lastName}</h3>
                          <div className={`px-3 py-1 rounded-full text-xs ${
                            app.status === 'pending' ? 'bg-orange/20 text-orange border border-orange/30' :
                            app.status === 'approved' ? 'bg-green/20 text-green border border-green/30' :
                            'bg-dark/20 text-dark border border-dark/30'
                          }`}>
                            {app.status.toUpperCase()}
                          </div>
                        </div>

                        <p className="text-dark/70 mb-2">{app.email}</p>

                        <div className="flex items-center gap-4 text-sm text-dark/60">
                          <span className="flex items-center gap-1">
                            <Award className="w-4 h-4" />
                            {app.primarySport}
                          </span>
                          <span>{app.experience} experience</span>
                          <span>{app.specialties?.length || 0} specialties</span>
                        </div>

                        {app.experienceDetails && (
                          <p className="text-dark/60 text-sm mt-2 line-clamp-2">
                            {app.experienceDetails}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right text-sm text-dark/60">
                        <div>Applied</div>
                        <div>{app.submittedAt?.toDate?.()?.toLocaleDateString() || 'Recently'}</div>
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
                    <h2 className="text-2xl text-dark">{selectedApp.firstName} {selectedApp.lastName}</h2>
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
              <div className="p-6 space-y-8">
                {/* Basic Info */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg text-dark mb-4">Basic Information</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm text-dark/60">Primary Sport</label>
                        <p className="text-dark">{selectedApp.primarySport}</p>
                      </div>
                      <div>
                        <label className="text-sm text-dark/60">Experience</label>
                        <p className="text-dark">{selectedApp.experience}</p>
                      </div>
                      <div>
                        <label className="text-sm text-dark/60">Submitted</label>
                        <p className="text-dark">{selectedApp.submittedAt?.toDate?.()?.toLocaleDateString() || 'Unknown'}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg text-dark mb-4">Specialties</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedApp.specialties?.map((specialty, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-sky-blue/20 text-sky-blue rounded-full text-sm border border-sky-blue/30"
                        >
                          {specialty.replace('-', ' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Experience Details */}
                <div>
                  <h3 className="text-lg text-dark mb-4">Experience Details</h3>
                  <div className="bg-dark/5 rounded-xl p-6">
                    <p className="text-dark/70">{selectedApp.experienceDetails}</p>
                  </div>
                </div>

                {/* Achievements */}
                {selectedApp.achievements?.length > 0 && (
                  <div>
                    <h3 className="text-lg text-dark mb-4">Achievements</h3>
                    <div className="bg-dark/5 rounded-xl p-6">
                      <ul className="space-y-2">
                        {selectedApp.achievements.map((achievement, index) => (
                          achievement && (
                            <li key={index} className="text-dark/70 flex items-start gap-2">
                              <Award className="w-4 h-4 text-sky-blue mt-1 flex-shrink-0" />
                              <span>{achievement}</span>
                            </li>
                          )
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* Content Types */}
                {selectedApp.contentTypes?.length > 0 && (
                  <div>
                    <h3 className="text-lg text-dark mb-4">Content Types</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedApp.contentTypes.map((type, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-orange/20 text-orange rounded-full text-sm border border-orange/30"
                        >
                          {type.replace('-', ' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Content Description */}
                {selectedApp.contentDescription && (
                  <div>
                    <h3 className="text-lg text-dark mb-4">Content Description</h3>
                    <div className="bg-dark/5 rounded-xl p-6">
                      <p className="text-dark/70">{selectedApp.contentDescription}</p>
                    </div>
                  </div>
                )}

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
                        Approve Application
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
                        Reviewed on {selectedApp.reviewedAt.toDate?.()?.toLocaleString() || 'Unknown'}
                      </p>
                      {selectedApp.reviewerNotes && (
                        <div className="bg-white rounded-lg p-4">
                          <p className="text-dark">{selectedApp.reviewerNotes}</p>
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