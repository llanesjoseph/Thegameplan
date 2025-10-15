'use client'

/**
 * Coach Video Review Requests Dashboard
 * Displays all video review requests from athletes
 */

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { db } from '@/lib/firebase.client'
import { collection, query, where, orderBy, getDocs, doc, updateDoc } from 'firebase/firestore'
import { Video, ExternalLink, MessageSquare, Clock, Check, Star, Play } from 'lucide-react'

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
  rating?: number
}

export default function VideoReviewsPage() {
  const { user } = useAuth()
  const [requests, setRequests] = useState<VideoReviewRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRequest, setSelectedRequest] = useState<VideoReviewRequest | null>(null)
  const [response, setResponse] = useState('')
  const [rating, setRating] = useState(0)
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
        rating: rating > 0 ? rating : null,
        status: 'completed',
        completedAt: new Date()
      })

      alert('✅ Video review response submitted successfully!')
      setResponse('')
      setRating(0)
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

  const getVideoEmbedUrl = (url: string): { type: 'vimeo' | 'youtube' | 'direct', embedUrl: string } => {
    // Vimeo
    if (url.includes('vimeo.com')) {
      const vimeoId = url.split('/').pop()?.split('?')[0]
      return { type: 'vimeo', embedUrl: `https://player.vimeo.com/video/${vimeoId}` }
    }

    // YouTube
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      let videoId = ''
      if (url.includes('youtube.com/watch')) {
        videoId = new URL(url).searchParams.get('v') || ''
      } else if (url.includes('youtu.be')) {
        videoId = url.split('/').pop()?.split('?')[0] || ''
      }
      return { type: 'youtube', embedUrl: `https://www.youtube.com/embed/${videoId}` }
    }

    // Direct video URL
    return { type: 'direct', embedUrl: url }
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
                          setRating(request.rating || 0)
                          if (!request.viewedByCoach) {
                            markAsViewed(request.id)
                          }
                        }}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <Play className="w-4 h-4" />
                        Review Video
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Video Review Modal */}
        {selectedRequest && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-7xl w-full h-[90vh] flex flex-col">
              {/* Header */}
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-2xl font-bold text-gray-900">{selectedRequest.title}</h3>
                <p className="text-sm text-gray-600 mt-1">
                  By {selectedRequest.athleteName} • Submitted {selectedRequest.createdAt?.toDate?.()?.toLocaleDateString?.() || 'Unknown'}
                </p>
              </div>

              {/* Content - Video and Review Form */}
              <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
                {/* Video Player Section */}
                <div className="lg:w-3/5 bg-black p-6 flex flex-col">
                  <div className="flex-1 flex items-center justify-center">
                    {(() => {
                      const { type, embedUrl } = getVideoEmbedUrl(selectedRequest.videoUrl)

                      if (type === 'vimeo' || type === 'youtube') {
                        return (
                          <iframe
                            src={embedUrl}
                            className="w-full h-full rounded-lg"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        )
                      } else {
                        return (
                          <video
                            src={embedUrl}
                            controls
                            className="w-full h-full rounded-lg"
                          />
                        )
                      }
                    })()}
                  </div>

                  {/* Video Info */}
                  <div className="mt-4 text-white">
                    <p className="text-sm opacity-90">{selectedRequest.description}</p>
                    {selectedRequest.specificQuestions && (
                      <div className="mt-3 bg-white/10 rounded-lg p-3">
                        <p className="text-xs font-semibold opacity-75 mb-1">Athlete's Questions:</p>
                        <p className="text-sm">{selectedRequest.specificQuestions}</p>
                      </div>
                    )}
                    <a
                      href={selectedRequest.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 mt-3 text-sm text-blue-300 hover:text-blue-200"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Open in new tab
                    </a>
                  </div>
                </div>

                {/* Review Form Section */}
                <div className="lg:w-2/5 bg-gray-50 p-6 flex flex-col overflow-y-auto">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Your Feedback</h4>

                  {/* Rating */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rate this performance (optional)
                    </label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => setRating(star)}
                          className="transition-transform hover:scale-110"
                        >
                          <Star
                            className={`w-8 h-8 ${
                              star <= rating
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-300'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                    {rating > 0 && (
                      <button
                        onClick={() => setRating(0)}
                        className="text-xs text-gray-500 hover:text-gray-700 mt-1"
                      >
                        Clear rating
                      </button>
                    )}
                  </div>

                  {/* Feedback Textarea */}
                  <div className="flex-1 flex flex-col">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Detailed Feedback *
                    </label>
                    <textarea
                      value={response}
                      onChange={(e) => setResponse(e.target.value)}
                      placeholder="Provide specific, actionable feedback on technique, form, strategy, or areas for improvement..."
                      className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-colors resize-none min-h-[300px]"
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-6 flex gap-3">
                    <button
                      onClick={() => {
                        setSelectedRequest(null)
                        setResponse('')
                        setRating(0)
                      }}
                      disabled={isSubmitting}
                      className="flex-1 py-3 px-6 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={submitResponse}
                      disabled={!response.trim() || isSubmitting}
                      className="flex-1 py-3 px-6 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 font-semibold"
                    >
                      {isSubmitting ? 'Submitting...' : 'Submit Review'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
