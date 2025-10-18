'use client'

/**
 * Athlete Video Review Management
 * Track submitted video reviews and view coach feedback
 */

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { db } from '@/lib/firebase.client'
import { collection, query, where, orderBy, getDocs, addDoc, Timestamp } from 'firebase/firestore'
import { Video, Star, Clock, CheckCircle, MessageSquare, Upload, ExternalLink, Plus, X } from 'lucide-react'

interface VideoReview {
  id: string
  athleteId: string
  athleteName: string
  athleteEmail: string
  coachId: string
  assignedCoachUid: string
  videoUrl: string
  title: string
  description: string
  specificQuestions?: string
  status: 'pending' | 'in_review' | 'completed'
  createdAt: any
  coachResponse?: string
  rating?: number
  viewedByCoach: boolean
  completedAt?: any
}

export default function AthleteVideoReviewsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const isEmbedded = searchParams.get('embedded') === 'true'
  const [reviews, setReviews] = useState<VideoReview[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedReview, setSelectedReview] = useState<VideoReview | null>(null)


  useEffect(() => {
    if (user?.uid) {
      loadVideoReviews()
    }
  }, [user])

  const loadVideoReviews = async () => {
    if (!user?.uid) return

    try {
      setLoading(true)
      // Use API endpoint instead of direct Firestore access
      const response = await fetch(`/api/athlete/video-review/list?athleteId=${user.uid}`)
      const data = await response.json()

      if (data.success) {
        // Transform API response to match component interface
        const reviewData = data.requests.map((req: any) => ({
          id: req.id,
          athleteId: user.uid,
          athleteName: req.athleteName,
          athleteEmail: req.athleteEmail,
          coachId: req.assignedCoachUid,
          assignedCoachUid: req.assignedCoachUid,
          videoUrl: req.videoUrl,
          title: req.title,
          description: req.description,
          specificQuestions: req.specificQuestions,
          status: req.status,
          createdAt: req.createdAt ? { toDate: () => new Date(req.createdAt) } : null,
          completedAt: req.completedAt ? { toDate: () => new Date(req.completedAt) } : null,
          coachResponse: req.coachResponse,
          viewedByCoach: req.viewedByCoach,
          rating: req.rating
        }))
        setReviews(reviewData)
      } else {
        console.error('Failed to load video reviews:', data.error)
      }
    } catch (error) {
      console.error('Error loading video reviews:', error)
    } finally {
      setLoading(false)
    }
  }


  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="px-3 py-1.5 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            Pending Review
          </span>
        )
      case 'in_review':
        return (
          <span className="px-3 py-1.5 bg-blue-100 text-blue-800 rounded-full text-sm font-medium flex items-center gap-1.5">
            <MessageSquare className="w-4 h-4" />
            Coach Viewing
          </span>
        )
      case 'completed':
        return (
          <span className="px-3 py-1.5 bg-green-100 text-green-800 rounded-full text-sm font-medium flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4" />
            Review Complete
          </span>
        )
      default:
        return (
          <span className="px-3 py-1.5 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">
            {status}
          </span>
        )
    }
  }

  if (loading) {
    return (
      <div className={isEmbedded ? "bg-transparent p-4" : "min-h-screen bg-gray-50 p-8"}>
        <div className={isEmbedded ? "" : "max-w-7xl mx-auto"}>
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading your video reviews...</p>
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
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Video className="w-8 h-8 text-blue-600" />
                My Video Reviews
              </h1>
              <p className="text-gray-600 mt-2">Submit videos and get personalized feedback from your coach</p>
            </div>
            <button
              onClick={() => router.push('/dashboard/athlete/video-review/request')}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md"
            >
              <Plus className="w-5 h-5" />
              Request New Review
            </button>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Submitted</p>
                <p className="text-2xl font-bold text-gray-900">{reviews.length}</p>
              </div>
              <Video className="w-8 h-8 text-gray-400" />
            </div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {reviews.filter(r => r.status === 'pending').length}
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
                  {reviews.filter(r => r.status === 'in_review').length}
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
                  {reviews.filter(r => r.status === 'completed').length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>
        </div>

        {/* Reviews List */}
        {reviews.length === 0 ? (
          <div className="bg-white rounded-lg p-12 text-center shadow-sm border border-gray-200">
            <Video className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-xl text-gray-600">No video reviews submitted yet</p>
            <p className="text-sm text-gray-500 mt-2 mb-4">Get personalized feedback from your coach</p>
            <button
              onClick={() => router.push('/dashboard/athlete/video-review/request')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md mx-auto"
            >
              <Plus className="w-5 h-5" />
              Request Your First Review
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div className="flex-1">
                    {/* Header */}
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <Video className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="text-lg font-semibold text-gray-900">{review.title}</h3>
                          {getStatusBadge(review.status)}
                        </div>
                        <p className="text-xs text-gray-500">
                          Submitted: {review.createdAt?.toDate?.()?.toLocaleDateString?.() || 'Unknown'}
                          {review.completedAt && ` • Reviewed: ${review.completedAt?.toDate?.()?.toLocaleDateString?.()}`}
                        </p>
                      </div>
                    </div>

                    {/* Description */}
                    <div className="mb-4">
                      <p className="text-sm text-gray-700 mb-2">{review.description}</p>
                      {review.specificQuestions && (
                        <div className="bg-blue-50 border-l-4 border-blue-500 p-3 mt-2">
                          <p className="text-xs font-semibold text-blue-900 mb-1">Your Questions:</p>
                          <p className="text-sm text-blue-800">{review.specificQuestions}</p>
                        </div>
                      )}
                    </div>

                    {/* Coach Feedback */}
                    {review.coachResponse && (
                      <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-semibold text-green-900">Coach Feedback:</p>
                          {review.rating && (
                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`w-4 h-4 ${
                                    star <= review.rating!
                                      ? 'fill-yellow-400 text-yellow-400'
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-green-800 whitespace-pre-wrap">{review.coachResponse}</p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 lg:w-48">
                    <a
                      href={review.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Watch Video
                    </a>
                    {review.coachResponse && (
                      <button
                        onClick={() => setSelectedReview(review)}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-lg hover:bg-green-200 transition-colors"
                      >
                        <MessageSquare className="w-4 h-4" />
                        View Full Feedback
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Full Feedback Modal */}
        {selectedReview && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-bold text-gray-900">{selectedReview.title}</h3>
                  <button
                    onClick={() => setSelectedReview(null)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Reviewed on {selectedReview.completedAt?.toDate?.()?.toLocaleDateString?.() || 'Unknown'}
                </p>
              </div>

              <div className="p-6">
                {selectedReview.rating && (
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Coach Rating
                    </label>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-8 h-8 ${
                            star <= selectedReview.rating!
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                      <span className="ml-2 text-lg font-semibold text-gray-700">
                        {selectedReview.rating}/5
                      </span>
                    </div>
                  </div>
                )}

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Coach Feedback
                  </label>
                  <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                    <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                      {selectedReview.coachResponse}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <a
                    href={selectedReview.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <ExternalLink className="w-5 h-5" />
                    Rewatch Video
                  </a>
                  <button
                    onClick={() => setSelectedReview(null)}
                    className="flex-1 py-3 px-6 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                  >
                    Close
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
