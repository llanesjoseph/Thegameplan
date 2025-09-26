'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useEnhancedRole } from '@/hooks/use-role-switcher'
import { db } from '@/lib/firebase.client'
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  updateDoc, 
  addDoc,
  deleteDoc,
  orderBy,
  serverTimestamp 
} from 'firebase/firestore'
import { 
  Users, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Eye, 
  Star,
  MapPin,
  Globe,
  Award,
  MessageSquare,
  Filter,
  Search,
  MoreVertical,
  UserCheck,
  UserX
} from 'lucide-react'
import { CoachApplication, Coach } from '@/types/coach'

export default function AdminCoachesPage() {
  const { user } = useAuth()
  const { role, loading: roleLoading } = useEnhancedRole()
  const [applications, setApplications] = useState<CoachApplication[]>([])
  const [coaches, setCoaches] = useState<Coach[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'applications' | 'coaches'>('applications')
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedApplication, setSelectedApplication] = useState<CoachApplication | null>(null)
  const [reviewNotes, setReviewNotes] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    if (user && role === 'admin') {
      loadApplications()
      loadCoaches()
    }
  }, [user, role])

  const loadApplications = async () => {
    try {
      const q = query(
        collection(db, 'coach_applications'),
        orderBy('submittedAt', 'desc')
      )
      const snapshot = await getDocs(q)
      const applicationsData: CoachApplication[] = []
      
      snapshot.forEach(doc => {
        const data = doc.data()
        applicationsData.push({
          id: doc.id,
          ...data,
          submittedAt: data.submittedAt?.toDate() || new Date(),
          reviewedAt: data.reviewedAt?.toDate()
        } as CoachApplication)
      })
      
      setApplications(applicationsData)
    } catch (error) {
      console.error('Error loading applications:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadCoaches = async () => {
    try {
      const q = query(collection(db, 'coaches'))
      const snapshot = await getDocs(q)
      const coachesData: Coach[] = []
      
      snapshot.forEach(doc => {
        const data = doc.data()
        coachesData.push({
          uid: doc.id,
          ...data,
          joinedAt: data.joinedAt?.toDate() || new Date(),
          lastActive: data.lastActive?.toDate()
        } as Coach)
      })
      
      setCoaches(coachesData)
    } catch (error) {
      console.error('Error loading coaches:', error)
    }
  }

  const approveApplication = async (application: CoachApplication) => {
    setIsProcessing(true)
    try {
      // Create coach record
      await addDoc(collection(db, 'coaches'), {
        uid: application.userId,
        email: application.email,
        displayName: application.displayName,
        photoURL: application.photoURL,
        bio: application.bio,
        specialties: application.specialties,
        sports: application.sports,
        credentials: application.credentials,
        experience: application.experience,
        location: application.location,
        hourlyRate: application.hourlyRate,
        availability: application.availability,
        timeZone: application.timeZone,
        languages: application.languages,
        certifications: application.certifications,
        socialLinks: application.socialLinks,
        coachingPhilosophy: application.coachingPhilosophy,
        achievements: application.achievements,
        averageRating: 0,
        totalReviews: 0,
        isVerified: true,
        isActive: true,
        joinedAt: serverTimestamp()
      })

      // Update application status
      await updateDoc(doc(db, 'coach_applications', application.id), {
        status: 'approved',
        reviewedAt: serverTimestamp(),
        reviewedBy: user?.uid,
        reviewNotes: reviewNotes
      })

      // Update user role to include 'creator'
      // This would typically be done through a cloud function or admin SDK
      // For now, we'll just update the application

      await loadApplications()
      await loadCoaches()
      setSelectedApplication(null)
      setReviewNotes('')
    } catch (error) {
      console.error('Error approving application:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const rejectApplication = async (application: CoachApplication) => {
    setIsProcessing(true)
    try {
      await updateDoc(doc(db, 'coach_applications', application.id), {
        status: 'rejected',
        reviewedAt: serverTimestamp(),
        reviewedBy: user?.uid,
        reviewNotes: reviewNotes
      })

      await loadApplications()
      setSelectedApplication(null)
      setReviewNotes('')
    } catch (error) {
      console.error('Error rejecting application:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const toggleCoachStatus = async (coach: Coach) => {
    try {
      await updateDoc(doc(db, 'coaches', coach.uid), {
        isActive: !coach.isActive
      })
      await loadCoaches()
    } catch (error) {
      console.error('Error updating coach status:', error)
    }
  }

  const filteredApplications = applications.filter(app => {
    const matchesStatus = filterStatus === 'all' || app.status === filterStatus
    const matchesSearch = searchTerm === '' || 
      app.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.sports.some(sport => sport.toLowerCase().includes(searchTerm.toLowerCase()))
    
    return matchesStatus && matchesSearch
  })

  const filteredCoaches = coaches.filter(coach => {
    const matchesSearch = searchTerm === '' ||
      coach.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      coach.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      coach.sports.some(sport => sport.toLowerCase().includes(searchTerm.toLowerCase()))
    
    return matchesSearch
  })

  if (roleLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-gray-600">This page is only available to administrators.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Coach Management</h1>
          <p className="text-gray-600 mt-1">Manage coach applications and active coaches</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending Applications</p>
              <p className="text-2xl font-bold text-gray-900">
                {applications.filter(app => app.status === 'pending').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Coaches</p>
              <p className="text-2xl font-bold text-gray-900">
                {coaches.filter(coach => coach.isActive).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Coaches</p>
              <p className="text-2xl font-bold text-gray-900">{coaches.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Star className="w-5 h-5 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg Rating</p>
              <p className="text-2xl font-bold text-gray-900">
                {coaches.length > 0 
                  ? (coaches.reduce((sum, coach) => sum + coach.averageRating, 0) / coaches.length).toFixed(1)
                  : '0.0'
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('applications')}
          className={`px-4 py-2 rounded-md font-medium transition-colors ${
            activeTab === 'applications'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Applications ({applications.length})
        </button>
        <button
          onClick={() => setActiveTab('coaches')}
          className={`px-4 py-2 rounded-md font-medium transition-colors ${
            activeTab === 'coaches'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Active Coaches ({coaches.length})
        </button>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, or sport..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          {activeTab === 'applications' && (
            <div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Applications Tab */}
      {activeTab === 'applications' && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Applicant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sports
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Submitted
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredApplications.map((application) => (
                  <tr key={application.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                          {application.displayName.charAt(0)}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {application.displayName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {application.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1">
                        {application.sports.slice(0, 2).map((sport, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                          >
                            {sport}
                          </span>
                        ))}
                        {application.sports.length > 2 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                            +{application.sports.length - 2}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 text-gray-400 mr-1" />
                        {application.location}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        application.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : application.status === 'approved'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {application.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {application.submittedAt.toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => setSelectedApplication(application)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Coaches Tab */}
      {activeTab === 'coaches' && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Coach
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sports
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rating
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCoaches.map((coach) => (
                  <tr key={coach.uid} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                          {coach.displayName.charAt(0)}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {coach.displayName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {coach.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1">
                        {coach.sports.slice(0, 2).map((sport, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full"
                          >
                            {sport}
                          </span>
                        ))}
                        {coach.sports.length > 2 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                            +{coach.sports.length - 2}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Star className="w-4 h-4 text-yellow-400 mr-1" />
                        <span className="text-sm text-gray-900">
                          {coach.averageRating.toFixed(1)} ({coach.totalReviews})
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        coach.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {coach.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {coach.joinedAt.toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => toggleCoachStatus(coach)}
                        className={`mr-3 ${
                          coach.isActive
                            ? 'text-red-600 hover:text-red-900'
                            : 'text-green-600 hover:text-green-900'
                        }`}
                      >
                        {coach.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Application Review Modal */}
      {selectedApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">
                  Review Application - {selectedApplication.displayName}
                </h2>
                <button
                  onClick={() => setSelectedApplication(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Basic Info */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Basic Information</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Name</label>
                    <p className="text-gray-900">{selectedApplication.displayName}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <p className="text-gray-900">{selectedApplication.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Location</label>
                    <p className="text-gray-900">{selectedApplication.location}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Hourly Rate</label>
                    <p className="text-gray-900">${selectedApplication.hourlyRate}/hour</p>
                  </div>
                </div>
              </div>

              {/* Bio */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Bio</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{selectedApplication.bio}</p>
              </div>

              {/* Sports and Specialties */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Sports</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedApplication.sports.map((sport, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                      >
                        {sport}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Specialties</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedApplication.specialties.map((specialty, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full"
                      >
                        {specialty}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Experience and Philosophy */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Experience</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{selectedApplication.experience}</p>
              </div>

              {selectedApplication.coachingPhilosophy && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Coaching Philosophy</h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedApplication.coachingPhilosophy}</p>
                </div>
              )}

              {/* Application Reason */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Why They Want to Coach</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{selectedApplication.applicationReason}</p>
              </div>

              {/* Review Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Review Notes
                </label>
                <textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Add notes about your decision..."
                />
              </div>

              {/* Actions */}
              {selectedApplication.status === 'pending' && (
                <div className="flex gap-4 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => approveApplication(selectedApplication)}
                    disabled={isProcessing}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    {isProcessing ? 'Processing...' : 'Approve Application'}
                  </button>
                  <button
                    onClick={() => rejectApplication(selectedApplication)}
                    disabled={isProcessing}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <XCircle className="w-4 h-4" />
                    {isProcessing ? 'Processing...' : 'Reject Application'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
