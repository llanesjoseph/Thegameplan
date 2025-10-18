'use client'

/**
 * Coach Live Session Requests Dashboard
 * Displays all live 1-on-1 session requests from athletes
 */

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { db } from '@/lib/firebase.client'
import { collection, query, where, orderBy, getDocs, doc, updateDoc } from 'firebase/firestore'
import { Calendar, Clock, Check, X, MessageSquare, User } from 'lucide-react'

interface LiveSessionRequest {
  id: string
  athleteId: string
  athleteName: string
  athleteEmail: string
  preferredDate: string
  preferredTime: string
  duration: number
  topic: string
  description: string
  specificGoals?: string
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  createdAt: any
  coachResponse?: string
  meetingLink?: string
  viewedByCoach: boolean
}

export default function LiveSessionsPage() {
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const isEmbedded = searchParams.get('embedded') === 'true'
  const [requests, setRequests] = useState<LiveSessionRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRequest, setSelectedRequest] = useState<LiveSessionRequest | null>(null)
  const [responseData, setResponseData] = useState({
    response: '',
    meetingLink: '',
    action: '' as 'confirm' | 'decline' | 'reschedule' | 'edit' | '',
    rescheduleDate: '',
    rescheduleTime: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (user?.uid) {
      loadSessionRequests()
    }
  }, [user])

  const loadSessionRequests = async () => {
    if (!user?.uid) return

    try {
      setLoading(true)
      // Removed orderBy to avoid composite index requirement - will sort in memory
      const sessionsQuery = query(
        collection(db, 'liveSessionRequests'),
        where('coachId', '==', user.uid)
      )

      const snapshot = await getDocs(sessionsQuery)
      const sessionData = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        } as LiveSessionRequest))
        // Sort in memory by createdAt (newest first)
        .sort((a, b) => {
          const dateA = a.createdAt?.toDate?.()?.getTime() || 0
          const dateB = b.createdAt?.toDate?.()?.getTime() || 0
          return dateB - dateA // Descending order (newest first)
        })

      setRequests(sessionData)
    } catch (error) {
      console.error('Error loading live session requests:', error)
    } finally {
      setLoading(false)
    }
  }

  const markAsViewed = async (requestId: string) => {
    try {
      await updateDoc(doc(db, 'liveSessionRequests', requestId), {
        viewedByCoach: true
      })
      await loadSessionRequests()
    } catch (error) {
      console.error('Error marking as viewed:', error)
    }
  }

  const handleResponse = async () => {
    if (!selectedRequest || !responseData.action) return

    try {
      setIsSubmitting(true)
      const updateData: any = {
        viewedByCoach: true,
        updatedAt: new Date()
      }

      // Add response message if provided
      if (responseData.response.trim()) {
        updateData.coachResponse = responseData.response.trim()
      }

      if (responseData.action === 'confirm') {
        updateData.status = 'confirmed'
        if (responseData.meetingLink.trim()) {
          updateData.meetingLink = responseData.meetingLink.trim()
        }
      } else if (responseData.action === 'decline') {
        updateData.status = 'cancelled'
      } else if (responseData.action === 'reschedule') {
        if (responseData.rescheduleDate && responseData.rescheduleTime) {
          updateData.preferredDate = responseData.rescheduleDate
          updateData.preferredTime = responseData.rescheduleTime
          updateData.status = 'confirmed'
          if (responseData.meetingLink.trim()) {
            updateData.meetingLink = responseData.meetingLink.trim()
          }
        }
      } else if (responseData.action === 'edit') {
        if (responseData.meetingLink.trim()) {
          updateData.meetingLink = responseData.meetingLink.trim()
        }
      }

      await updateDoc(doc(db, 'liveSessionRequests', selectedRequest.id), updateData)

      let actionText = 'updated'
      if (responseData.action === 'confirm') actionText = 'approved'
      else if (responseData.action === 'decline') actionText = 'declined'
      else if (responseData.action === 'reschedule') actionText = 'rescheduled'
      else if (responseData.action === 'edit') actionText = 'updated'

      alert(`✅ Session ${actionText} successfully!`)

      setResponseData({ response: '', meetingLink: '', action: '', rescheduleDate: '', rescheduleTime: '' })
      setSelectedRequest(null)
      await loadSessionRequests()
    } catch (error) {
      console.error('Error responding to session:', error)
      alert('❌ Failed to respond. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'confirmed': return 'bg-green-100 text-green-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className={isEmbedded ? "bg-transparent p-4" : "min-h-screen bg-gray-50 p-8"}>
        <div className={isEmbedded ? "" : "max-w-7xl mx-auto"}>
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading live session requests...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={isEmbedded ? "bg-transparent p-4" : "min-h-screen bg-gray-50 p-4 sm:p-8"}>
      <div className={isEmbedded ? "" : "max-w-7xl mx-auto"}>
        {/* Header */}
        {!isEmbedded && (
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Calendar className="w-8 h-8 text-green-600" />
              Live 1-on-1 Session Requests
            </h1>
            <p className="text-gray-600 mt-2">Review and schedule live coaching sessions with your athletes</p>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {requests.filter(r => r.status === 'pending').length}
                </p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Confirmed</p>
                <p className="text-2xl font-bold text-green-600">
                  {requests.filter(r => r.status === 'confirmed').length}
                </p>
              </div>
              <Check className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-blue-600">
                  {requests.filter(r => r.status === 'completed').length}
                </p>
              </div>
              <User className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Cancelled</p>
                <p className="text-2xl font-bold text-red-600">
                  {requests.filter(r => r.status === 'cancelled').length}
                </p>
              </div>
              <X className="w-8 h-8 text-red-600" />
            </div>
          </div>
        </div>

        {/* Requests List */}
        {requests.length === 0 ? (
          <div className="bg-white rounded-lg p-12 text-center shadow-sm border border-gray-200">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-xl text-gray-600">No live session requests yet</p>
            <p className="text-sm text-gray-500 mt-2">Athletes can request live coaching sessions from their dashboard</p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => {
              const dateObj = new Date(request.preferredDate)
              const formattedDate = dateObj.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })

              return (
                <div key={request.id} className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="flex-1">
                      {/* Header */}
                      <div className="flex items-start gap-4 mb-4">
                        <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-green-600 font-bold">
                            {request.athleteName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="text-lg font-semibold text-gray-900">{request.topic}</h3>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(request.status)}`}>
                              {request.status.toUpperCase()}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">
                            From: <span className="font-medium">{request.athleteName}</span> ({request.athleteEmail})
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Requested: {request.createdAt?.toDate?.()?.toLocaleDateString?.() || 'Unknown'}
                          </p>
                        </div>
                      </div>

                      {/* Session Details */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <span className="font-medium">{formattedDate}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="w-4 h-4 text-gray-500" />
                          <span className="font-medium">{request.preferredTime}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="w-4 h-4 text-gray-500" />
                          <span className="font-medium">{request.duration} minutes</span>
                        </div>
                      </div>

                      {/* Description */}
                      <div className="mb-4">
                        <p className="text-sm text-gray-700 mb-2">{request.description}</p>
                        {request.specificGoals && (
                          <div className="bg-green-50 border-l-4 border-green-500 p-3 mt-2">
                            <p className="text-xs font-semibold text-green-900 mb-1">Specific Goals:</p>
                            <p className="text-sm text-green-800">{request.specificGoals}</p>
                          </div>
                        )}
                      </div>

                      {/* Coach Response */}
                      {request.coachResponse && (
                        <div className="bg-blue-50 border-l-4 border-blue-500 p-3 mb-4">
                          <p className="text-xs font-semibold text-blue-900 mb-1">Your Response:</p>
                          <p className="text-sm text-blue-800">{request.coachResponse}</p>
                          {request.meetingLink && (
                            <a
                              href={request.meetingLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:underline mt-2 inline-block"
                            >
                              Meeting Link: {request.meetingLink}
                            </a>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 lg:w-48">
                      {request.status === 'pending' && (
                        <>
                          <button
                            onClick={() => {
                              setSelectedRequest(request)
                              setResponseData({
                                response: '',
                                meetingLink: '',
                                action: 'confirm',
                                rescheduleDate: '',
                                rescheduleTime: ''
                              })
                              markAsViewed(request.id)
                            }}
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-md"
                          >
                            <Check className="w-4 h-4" />
                            Approve
                          </button>
                          <button
                            onClick={() => {
                              setSelectedRequest(request)
                              setResponseData({
                                response: '',
                                meetingLink: '',
                                action: 'decline',
                                rescheduleDate: '',
                                rescheduleTime: ''
                              })
                              markAsViewed(request.id)
                            }}
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-md"
                          >
                            <X className="w-4 h-4" />
                            Decline
                          </button>
                        </>
                      )}
                      {request.status === 'confirmed' && (
                        <>
                          <button
                            onClick={() => {
                              setSelectedRequest(request)
                              setResponseData({
                                response: request.coachResponse || '',
                                meetingLink: request.meetingLink || '',
                                action: 'edit',
                                rescheduleDate: '',
                                rescheduleTime: ''
                              })
                            }}
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md"
                          >
                            <MessageSquare className="w-4 h-4" />
                            Edit Details
                          </button>
                          <button
                            onClick={async () => {
                              if (confirm('Mark this session as completed?')) {
                                try {
                                  await updateDoc(doc(db, 'liveSessionRequests', request.id), {
                                    status: 'completed',
                                    updatedAt: new Date()
                                  })
                                  await loadSessionRequests()
                                } catch (error) {
                                  console.error('Error marking as completed:', error)
                                  alert('Failed to mark as completed')
                                }
                              }
                            }}
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-md"
                          >
                            <Check className="w-4 h-4" />
                            Mark Complete
                          </button>
                        </>
                      )}
                      {(request.status === 'pending' || request.status === 'confirmed') && (
                        <button
                          onClick={() => {
                            setSelectedRequest(request)
                            setResponseData({
                              response: '',
                              meetingLink: request.meetingLink || '',
                              action: 'reschedule',
                              rescheduleDate: '',
                              rescheduleTime: ''
                            })
                          }}
                          className="flex items-center justify-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors shadow-md"
                        >
                          <Calendar className="w-4 h-4" />
                          Reschedule
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Enhanced Action Modal */}
        {selectedRequest && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-2xl font-bold text-gray-900">
                  {responseData.action === 'confirm' && 'Approve Session Request'}
                  {responseData.action === 'decline' && 'Decline Session Request'}
                  {responseData.action === 'reschedule' && 'Reschedule Session'}
                  {responseData.action === 'edit' && 'Edit Session Details'}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {selectedRequest.topic} with {selectedRequest.athleteName}
                </p>
              </div>

              <div className="p-6 space-y-4">
                {/* Current Session Details */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <p className="text-xs font-semibold text-gray-600 mb-2">Current Request:</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-500">Date:</span>
                      <span className="ml-2 font-medium">
                        {new Date(selectedRequest.preferredDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Time:</span>
                      <span className="ml-2 font-medium">{selectedRequest.preferredTime}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Duration:</span>
                      <span className="ml-2 font-medium">{selectedRequest.duration} min</span>
                    </div>
                  </div>
                </div>

                {/* Reschedule Fields */}
                {responseData.action === 'reschedule' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          New Date *
                        </label>
                        <input
                          type="date"
                          value={responseData.rescheduleDate}
                          onChange={(e) => setResponseData({ ...responseData, rescheduleDate: e.target.value })}
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-yellow-500 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          New Time *
                        </label>
                        <input
                          type="time"
                          value={responseData.rescheduleTime}
                          onChange={(e) => setResponseData({ ...responseData, rescheduleTime: e.target.value })}
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-yellow-500 transition-colors"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Response Message */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {responseData.action === 'decline' ? 'Reason for Declining' : 'Message to Athlete'}
                    {responseData.action !== 'edit' && ' *'}
                  </label>
                  <textarea
                    value={responseData.response}
                    onChange={(e) => setResponseData({ ...responseData, response: e.target.value })}
                    placeholder={
                      responseData.action === 'decline'
                        ? 'Let them know why you cannot accommodate this session...'
                        : responseData.action === 'reschedule'
                        ? 'Explain the reschedule reason...'
                        : responseData.action === 'edit'
                        ? 'Optional: Add any updates or notes...'
                        : 'Confirm the session and let them know what to prepare...'
                    }
                    rows={4}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-500 transition-colors resize-none"
                  />
                </div>

                {/* Meeting Link */}
                {responseData.action !== 'decline' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Meeting Link {responseData.action === 'confirm' && '(Recommended)'}
                    </label>
                    <input
                      type="url"
                      value={responseData.meetingLink}
                      onChange={(e) => setResponseData({ ...responseData, meetingLink: e.target.value })}
                      placeholder="https://zoom.us/j/... or https://meet.google.com/..."
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-500 transition-colors"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Add Zoom, Google Meet, or any video conferencing link
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => {
                      setSelectedRequest(null)
                      setResponseData({ response: '', meetingLink: '', action: '', rescheduleDate: '', rescheduleTime: '' })
                    }}
                    disabled={isSubmitting}
                    className="flex-1 py-3 px-6 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleResponse}
                    disabled={
                      isSubmitting ||
                      (responseData.action !== 'edit' && !responseData.response.trim()) ||
                      (responseData.action === 'reschedule' && (!responseData.rescheduleDate || !responseData.rescheduleTime))
                    }
                    className={`flex-1 py-3 px-6 text-white rounded-lg transition-colors disabled:opacity-50 font-semibold ${
                      responseData.action === 'decline'
                        ? 'bg-red-600 hover:bg-red-700'
                        : responseData.action === 'reschedule'
                        ? 'bg-yellow-600 hover:bg-yellow-700'
                        : responseData.action === 'edit'
                        ? 'bg-blue-600 hover:bg-blue-700'
                        : 'bg-green-600 hover:bg-green-700'
                    }`}
                  >
                    {isSubmitting ? 'Processing...' :
                      responseData.action === 'confirm' ? 'Approve & Confirm' :
                      responseData.action === 'decline' ? 'Decline Request' :
                      responseData.action === 'reschedule' ? 'Reschedule Session' :
                      'Save Changes'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
