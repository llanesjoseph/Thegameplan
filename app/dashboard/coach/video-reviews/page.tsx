'use client'

/**
 * Coach Video Review Requests Dashboard
 * Displays all video review requests from athletes
 */

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { db } from '@/lib/firebase.client'
import { collection, query, where, orderBy, getDocs, doc, updateDoc } from 'firebase/firestore'
import { Video, ExternalLink, MessageSquare, Clock, Check } from 'lucide-react'

interface VideoReviewRequest {
  id: string
  athleteId: string
  athleteName: string
  athleteEmail: string
  videoUrl: string
  title: string
  description: string
  specificQuestions?: string
  status: 'pending' | 'in_review' | 'completed'
  createdAt: any
  coachResponse?: string
  viewedByCoach: boolean
}

export default function VideoReviewsPage() {
  const { user } = useAuth()
  const [requests, setRequests] = useState<VideoReviewRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRequest, setSelectedRequest] = useState<VideoReviewRequest | null>(null)
  const [response, setResponse] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (user?.uid) {
      loadReviewRequests()
    }
  }, [user])

  const loadReviewRequests = async () => {
    if (!user?.uid) return

    try {
      setLoading(true)
      const reviewsQuery = query(
        collection(db, 'videoReviewRequests'),
        where('assignedCoachUid', '==', user.uid),
        orderBy('createdAt', 'desc')
      )

      const snapshot = await getDocs(reviewsQuery)
      const reviewData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as VideoReviewRequest))

      setRequests(reviewData)
    } catch (error) {
      console.error('Error loading video review requests:', error)
    } finally {
      setLoading(false)
    }
  }

  const markAsViewed = async (requestId: string) => {
    try {
      await updateDoc(doc(db, 'videoReviewRequests', requestId), {
        viewedByCoach: true,
        status: 'in_review'
      })
      await loadReviewRequests()
    } catch (error) {
      console.error('Error marking as viewed:', error)
    }
  }

  const submitResponse = async () => {
    if (!selectedRequest || !response.trim()) return

    try {
      setIsSubmitting(true)
      await updateDoc(doc(db, 'videoReviewRequests', selectedRequest.id), {
        coachResponse: response.trim(),
        status: 'completed',
        completedAt: new Date()
      })

      alert('✅ Video review response submitted successfully!')
      setResponse('')
      setSelectedRequest(null)
      await loadReviewRequests()
    } catch (error) {
      console.error('Error submitting response:', error)
      alert('❌ Failed to submit response. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'in_review': return 'bg-blue-100 text-blue-800'
      case 'completed': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading video review requests...</p>
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
            <Video className="w-8 h-8 text-blue-600" />
            Video Review Requests
          </h1>
          <p className="text-gray-600 mt-2">Review and provide feedback on athlete submitted videos</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
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
                <p className="text-sm text-gray-600">In Review</p>
                <p className="text-2xl font-bold text-blue-600">
                  {requests.filter(r => r.status === 'in_review').length}
                </p>
              </div>
              <MessageSquare className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-green-600">
                  {requests.filter(r => r.status === 'completed').length}
                </p>
              </div>
              <Check className="w-8 h-8 text-green-600" />
            </div>
          </div>
        </div>

        {/* Requests List */}
        {requests.length === 0 ? (
          <div className="bg-white rounded-lg p-12 text-center shadow-sm border border-gray-200">
            <Video className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-xl text-gray-600">No video review requests yet</p>
            <p className="text-sm text-gray-500 mt-2">Athletes can submit videos for your review from their dashboard</p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => (
              <div key={request.id} className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div className="flex-1">
                    {/* Header */}
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-blue-600 font-bold">
                          {request.athleteName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="text-lg font-semibold text-gray-900">{request.title}</h3>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(request.status)}`}>
                            {request.status.replace('_', ' ').toUpperCase()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">
                          From: <span className="font-medium">{request.athleteName}</span> ({request.athleteEmail})
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Submitted: {request.createdAt?.toDate?.()?.toLocaleDateString?.() || 'Unknown'}
                        </p>
                      </div>
                    </div>

                    {/* Description */}
                    <div className="mb-4">
                      <p className="text-sm text-gray-700 mb-2">{request.description}</p>
                      {request.specificQuestions && (
                        <div className="bg-blue-50 border-l-4 border-blue-500 p-3 mt-2">
                          <p className="text-xs font-semibold text-blue-900 mb-1">Specific Questions:</p>
                          <p className="text-sm text-blue-800">{request.specificQuestions}</p>
                        </div>
                      )}
                    </div>

                    {/* Coach Response */}
                    {request.coachResponse && (
                      <div className="bg-green-50 border-l-4 border-green-500 p-3 mb-4">
                        <p className="text-xs font-semibold text-green-900 mb-1">Your Response:</p>
                        <p className="text-sm text-green-800">{request.coachResponse}</p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 lg:w-48">
                    <a
                      href={request.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      onClick={() => !request.viewedByCoach && markAsViewed(request.id)}
                    >
                      <ExternalLink className="w-4 h-4" />
                      Watch Video
                    </a>
                    {request.status !== 'completed' && (
                      <button
                        onClick={() => {
                          setSelectedRequest(request)
                          setResponse(request.coachResponse || '')
                        }}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <MessageSquare className="w-4 h-4" />
                        Add Response
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Response Modal */}
        {selectedRequest && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-2xl font-bold text-gray-900">Provide Video Feedback</h3>
                <p className="text-sm text-gray-600 mt-1">For: {selectedRequest.title} by {selectedRequest.athleteName}</p>
              </div>

              <div className="p-6">
                <textarea
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                  placeholder="Write your detailed feedback here..."
                  rows={10}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-colors resize-none"
                />
              </div>

              <div className="p-6 border-t border-gray-200 flex gap-3">
                <button
                  onClick={() => {
                    setSelectedRequest(null)
                    setResponse('')
                  }}
                  disabled={isSubmitting}
                  className="flex-1 py-3 px-6 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={submitResponse}
                  disabled={!response.trim() || isSubmitting}
                  className="flex-1 py-3 px-6 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 font-semibold"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
