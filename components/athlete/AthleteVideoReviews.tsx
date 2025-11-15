'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore'
import { db } from '@/lib/firebase.client'
import { Play, MessageSquare, Clock, CheckCircle2, Plus } from 'lucide-react'
import SubmitVideoModal from './SubmitVideoModal'

interface VideoSubmission {
  id: string
  videoDownloadUrl?: string
  thumbnailUrl?: string
  athleteContext: string
  athleteGoals?: string
  specificQuestions?: string
  status: string
  coachFeedback?: string
  createdAt: any
  updatedAt: any
}

export default function AthleteVideoReviews() {
  const { user } = useAuth()
  const [submissions, setSubmissions] = useState<VideoSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedVideo, setSelectedVideo] = useState<VideoSubmission | null>(null)
  const [showSubmitModal, setShowSubmitModal] = useState(false)

  const loadSubmissions = async () => {
    if (!user?.uid) {
      setLoading(false)
      return
    }

    try {
      const q = query(
        collection(db, 'videoSubmissions'),
        where('athleteUid', '==', user.uid),
        orderBy('createdAt', 'desc')
      )

      const snapshot = await getDocs(q)
      const subs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as VideoSubmission[]

      setSubmissions(subs)
    } catch (error) {
      console.error('Error loading video submissions:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSubmissions()
  }, [user])

  const handleSubmitSuccess = () => {
    setShowSubmitModal(false)
    loadSubmissions() // Refresh the list
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'awaiting_coach':
        return (
          <div className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-yellow-100" style={{ color: '#000', fontFamily: '"Open Sans", sans-serif' }}>
            <Clock className="w-3 h-3" />
            Pending Review
          </div>
        )
      case 'reviewed':
      case 'completed':
        return (
          <div className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-green-100" style={{ color: '#000', fontFamily: '"Open Sans", sans-serif' }}>
            <CheckCircle2 className="w-3 h-3" />
            Reviewed
          </div>
        )
      default:
        return (
          <div className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-gray-100" style={{ color: '#000', fontFamily: '"Open Sans", sans-serif' }}>
            <Clock className="w-3 h-3" />
            {status}
          </div>
        )
    }
  }

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Recently'
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp.seconds * 1000)
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    } catch {
      return 'Recently'
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xl font-bold" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif', fontWeight: 700 }}>
          Your Video Submissions
        </h2>
        <button
          onClick={() => setShowSubmitModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-black text-white font-bold rounded-lg hover:bg-gray-800 transition-colors"
          style={{ fontFamily: '"Open Sans", sans-serif' }}
        >
          <Plus className="w-4 h-4" />
          Submit Video
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="w-full bg-gray-200 rounded-lg animate-pulse" style={{ aspectRatio: '16/9' }}></div>
          ))}
        </div>
      ) : submissions.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {submissions.map((sub) => (
            <button
              key={sub.id}
              onClick={() => setSelectedVideo(sub)}
              className="text-left w-full group"
            >
              <div className="w-full rounded-lg overflow-hidden mb-2 relative" style={{ aspectRatio: '16/9', backgroundColor: '#000' }}>
                {sub.thumbnailUrl ? (
                  <img
                    src={sub.thumbnailUrl}
                    alt="Video thumbnail"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: '#8B7D7B' }}>
                    <Play className="w-12 h-12 text-white" />
                  </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Play className="w-16 h-16 text-white" />
                </div>
                {sub.coachFeedback && (
                  <div className="absolute top-2 right-2 bg-green-500 text-white p-1.5 rounded-full">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                )}
              </div>
              <div className="space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-bold line-clamp-2 flex-1" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif' }}>
                    {sub.athleteContext || 'Video Submission'}
                  </p>
                  {getStatusBadge(sub.status)}
                </div>
                <p className="text-xs" style={{ color: '#666', fontFamily: '"Open Sans", sans-serif' }}>
                  {formatDate(sub.createdAt)}
                </p>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-sm">No video submissions yet. Submit your first video to get coach feedback!</p>
      )}

      {/* Video Review Modal */}
      {selectedVideo && (
        <div
          className="fixed inset-0 z-50"
          style={{ backgroundColor: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(2px)' }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedVideo(null)
          }}
        >
          <div
            className="fixed right-4 bottom-4 sm:right-6 sm:bottom-6 w-[92vw] sm:w-[700px] max-w-[740px] max-h-[85vh] rounded-2xl shadow-2xl overflow-hidden bg-white"
            style={{ animation: 'slideInChat .28s ease-out forwards' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3" style={{ background: '#FC0105' }}>
              <div>
                <h3 className="text-white font-bold" style={{ fontFamily: '"Open Sans", sans-serif' }}>
                  Video Review
                </h3>
                <p className="text-white/90 text-xs">{formatDate(selectedVideo.createdAt)}</p>
              </div>
              <button
                onClick={() => setSelectedVideo(null)}
                className="text-white/90 hover:text-white px-2 py-1 rounded-lg hover:bg-white/10 transition-colors"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="p-4 space-y-4 overflow-y-auto" style={{ maxHeight: 'calc(85vh - 60px)' }}>
              {/* Video Player */}
              {selectedVideo.videoDownloadUrl && (
                <div className="w-full rounded-lg overflow-hidden" style={{ backgroundColor: '#000' }}>
                  <video
                    src={selectedVideo.videoDownloadUrl}
                    controls
                    className="w-full"
                    style={{ maxHeight: '400px' }}
                  >
                    Your browser does not support video playback.
                  </video>
                </div>
              )}

              {/* Status */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold" style={{ color: '#000', fontFamily: '"Open Sans", sans-serif' }}>
                  Status:
                </span>
                {getStatusBadge(selectedVideo.status)}
              </div>

              {/* Your Submission */}
              <div>
                <h4 className="text-sm font-bold mb-2" style={{ color: '#000', fontFamily: '"Open Sans", sans-serif' }}>
                  Your Context
                </h4>
                <p className="text-sm whitespace-pre-wrap" style={{ color: '#666', fontFamily: '"Open Sans", sans-serif' }}>
                  {selectedVideo.athleteContext}
                </p>
              </div>

              {selectedVideo.athleteGoals && (
                <div>
                  <h4 className="text-sm font-bold mb-2" style={{ color: '#000', fontFamily: '"Open Sans", sans-serif' }}>
                    Your Goals
                  </h4>
                  <p className="text-sm whitespace-pre-wrap" style={{ color: '#666', fontFamily: '"Open Sans", sans-serif' }}>
                    {selectedVideo.athleteGoals}
                  </p>
                </div>
              )}

              {selectedVideo.specificQuestions && (
                <div>
                  <h4 className="text-sm font-bold mb-2" style={{ color: '#000', fontFamily: '"Open Sans", sans-serif' }}>
                    Your Questions
                  </h4>
                  <p className="text-sm whitespace-pre-wrap" style={{ color: '#666', fontFamily: '"Open Sans", sans-serif' }}>
                    {selectedVideo.specificQuestions}
                  </p>
                </div>
              )}

              {/* Coach Feedback */}
              {selectedVideo.coachFeedback ? (
                <div className="border-2 border-green-500 rounded-lg p-4" style={{ backgroundColor: '#f0fdf4' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="w-5 h-5 text-green-600" />
                    <h4 className="text-sm font-bold" style={{ color: '#000', fontFamily: '"Open Sans", sans-serif' }}>
                      Coach Feedback
                    </h4>
                  </div>
                  <p className="text-sm whitespace-pre-wrap" style={{ color: '#000', fontFamily: '"Open Sans", sans-serif' }}>
                    {selectedVideo.coachFeedback}
                  </p>
                </div>
              ) : (
                <div className="border-2 border-yellow-500 rounded-lg p-4" style={{ backgroundColor: '#fffbeb' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-5 h-5 text-yellow-600" />
                    <h4 className="text-sm font-bold" style={{ color: '#000', fontFamily: '"Open Sans", sans-serif' }}>
                      Awaiting Coach Feedback
                    </h4>
                  </div>
                  <p className="text-sm" style={{ color: '#666', fontFamily: '"Open Sans", sans-serif' }}>
                    Your coach will review this video and provide feedback soon.
                  </p>
                </div>
              )}
            </div>
          </div>

          <style jsx global>{`
            @keyframes slideInChat {
              from { transform: translateY(12px) scale(0.98); opacity: 0; }
              to { transform: translateY(0) scale(1); opacity: 1; }
            }
          `}</style>
        </div>
      )}

      {/* Submit Video Modal */}
      {showSubmitModal && (
        <SubmitVideoModal
          userId={user?.uid || ''}
          userEmail={user?.email || ''}
          onClose={() => setShowSubmitModal(false)}
          onSuccess={handleSubmitSuccess}
        />
      )}
    </div>
  )
}
