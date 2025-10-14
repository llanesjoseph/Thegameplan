'use client'

/**
 * Coach Live Session Requests Dashboard
 * Displays all live 1-on-1 session requests from athletes
 */

import { useEffect, useState } from 'react'
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
  const [requests, setRequests] = useState<LiveSessionRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRequest, setSelectedRequest] = useState<LiveSessionRequest | null>(null)
  const [responseData, setResponseData] = useState({
    response: '',
    meetingLink: '',
    action: '' as 'confirm' | 'decline' | ''
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
        coachResponse: responseData.response.trim(),
        viewedByCoach: true,
        updatedAt: new Date()
      }

      if (responseData.action === 'confirm') {
        updateData.status = 'confirmed'
        if (responseData.meetingLink.trim()) {
          updateData.meetingLink = responseData.meetingLink.trim()
        }
      } else if (responseData.action === 'decline') {
        updateData.status = 'cancelled'
      }

      await updateDoc(doc(db, 'liveSessionRequests', selectedRequest.id), updateData)

      const actionText = responseData.action === 'confirm' ? 'confirmed' : 'declined'
      alert(`✅ Session ${actionText} successfully!`)

      setResponseData({ response: '', meetingLink: '', action: '' })
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
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading live session requests...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Calendar className="w-8 h-8 text-green-600" />
            Live 1-on-1 Session Requests
          </h1>
          <p className="text-gray-600 mt-2">Review and schedule live coaching sessions with your athletes</p>
        </div>

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
                    {request.status === 'pending' && (
                      <div className="flex flex-col gap-2 lg:w-48">
                        <button
                          onClick={() => {
                            setSelectedRequest(request)
                            setResponseData({
                              response: '',
                              meetingLink: '',
                              action: ''
                            })
                            markAsViewed(request.id)
                          }}
                          className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                          <MessageSquare className="w-4 h-4" />
                          Respond
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Response Modal */}
        {selectedRequest && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-2xl font-bold text-gray-900">Respond to Session Request</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {selectedRequest.topic} by {selectedRequest.athleteName}
                </p>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Response *
                  </label>
                  <textarea
                    value={responseData.response}
                    onChange={(e) => setResponseData({ ...responseData, response: e.target.value })}
                    placeholder="Confirm availability or suggest alternative time..."
                    rows={5}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-500 transition-colors resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Meeting Link (if confirming)
                  </label>
                  <input
                    type="url"
                    value={responseData.meetingLink}
                    onChange={(e) => setResponseData({ ...responseData, meetingLink: e.target.value })}
                    placeholder="https://zoom.us/j/..."
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-500 transition-colors"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => {
                      setResponseData({ ...responseData, action: 'decline' })
                      setTimeout(handleResponse, 10)
                    }}
                    disabled={!responseData.response.trim() || isSubmitting}
                    className="flex-1 py-3 px-6 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 font-semibold"
                  >
                    Decline
                  </button>
                  <button
                    onClick={() => {
                      setResponseData({ ...responseData, action: 'confirm' })
                      setTimeout(handleResponse, 10)
                    }}
                    disabled={!responseData.response.trim() || isSubmitting}
                    className="flex-1 py-3 px-6 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 font-semibold"
                  >
                    Confirm Session
                  </button>
                </div>

                <button
                  onClick={() => {
                    setSelectedRequest(null)
                    setResponseData({ response: '', meetingLink: '', action: '' })
                  }}
                  disabled={isSubmitting}
                  className="w-full py-2 px-6 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
