'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore'
import { db } from '@/lib/firebase.client'
import { auth } from '@/lib/firebase.client'
import {
  uploadToFirebaseStorage,
  generateVideoStoragePath,
  validateVideoFile,
  getVideoMetadata,
  formatFileSize,
} from '@/lib/upload/uppy-config'
import toast from 'react-hot-toast'
import { Play, MessageSquare, Clock, CheckCircle2 } from 'lucide-react'

interface VideoManagementModalProps {
  onClose: () => void
  initialTab?: 'submit' | 'review'
}

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

export default function VideoManagementModal({
  onClose,
  initialTab = 'submit'
}: VideoManagementModalProps) {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'submit' | 'review'>(initialTab)

  // Submit tab state
  const [athleteContext, setAthleteContext] = useState('')
  const [athleteGoals, setAthleteGoals] = useState('')
  const [specificQuestions, setSpecificQuestions] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [videoMetadata, setVideoMetadata] = useState<any>(null)
  const uploadTaskRef = useRef<any>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [authToken, setAuthToken] = useState<string | null>(null)

  // Review tab state
  const [submissions, setSubmissions] = useState<VideoSubmission[]>([])
  const [loadingSubmissions, setLoadingSubmissions] = useState(true)
  const [selectedVideo, setSelectedVideo] = useState<VideoSubmission | null>(null)

  // Get auth token on mount
  useEffect(() => {
    const setupAuth = async () => {
      const currentUser = auth.currentUser
      if (currentUser) {
        try {
          await currentUser.reload()
          const freshToken = await currentUser.getIdToken(true)
          setAuthToken(freshToken)

          try {
            const response = await fetch('/api/fix-my-claims', {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${freshToken}` },
            })
            if (response.ok) {
              const finalToken = await currentUser.getIdToken(true)
              setAuthToken(finalToken)
            }
          } catch (error) {
            console.warn('Could not fix custom claims:', error)
          }
        } catch (error) {
          console.error('Token refresh failed:', error)
          toast.error('Authentication issue. Please refresh the page.')
        }
      }
    }
    setupAuth()
  }, [])

  // Load submissions when switching to review tab
  useEffect(() => {
    if (activeTab === 'review') {
      loadSubmissions()
    }
  }, [activeTab, user])

  const loadSubmissions = async () => {
    if (!user?.uid) {
      setLoadingSubmissions(false)
      return
    }

    try {
      const q = query(
        collection(db, 'submissions'),
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
      setLoadingSubmissions(false)
    }
  }

  // Handle file selection
  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const validation = validateVideoFile(file)
    if (!validation.valid) {
      toast.error(validation.error || 'Invalid file')
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    try {
      const metadata = await getVideoMetadata(file)
      setVideoMetadata(metadata)
      setVideoFile(file)
      toast.success('Video selected successfully')
    } catch (error) {
      console.error('Error getting video metadata:', error)
      toast.error('Failed to process video')
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }, [])

  // Clear file selection
  const clearFile = useCallback(() => {
    setVideoFile(null)
    setVideoMetadata(null)
    setUploadProgress(0)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [])

  // Handle form submission
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()

      if (!videoFile) {
        toast.error('Please select a video file')
        return
      }

      if (!athleteContext.trim()) {
        toast.error('Please provide context about your performance')
        return
      }

      setIsSubmitting(true)

      try {
        if (!authToken) {
          toast.error('Authentication required. Please refresh the page.')
          setIsSubmitting(false)
          return
        }

        // Create submission in database
        const response = await fetch('/api/submissions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            athleteContext: athleteContext.trim(),
            athleteGoals: athleteGoals.trim(),
            specificQuestions: specificQuestions.trim(),
            videoFileName: videoFile.name,
            videoFileSize: videoFile.size,
            videoDuration: videoMetadata?.duration || 0,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || 'Failed to create submission')
        }

        const { submissionId } = await response.json()

        // Generate storage path
        const storagePath = generateVideoStoragePath(
          user?.uid || '',
          submissionId,
          videoFile.name
        )

        // Upload video to Firebase Storage
        const uploadTask = uploadToFirebaseStorage(
          videoFile,
          storagePath,
          (progress) => {
            setUploadProgress(progress)
          },
          async (downloadUrl) => {
            toast.success('✅ Video uploaded successfully!', {
              duration: 5000,
              position: 'top-center',
            })

            // Update submission with video URL
            try {
              const updateResponse = await fetch(`/api/submissions/${submissionId}`, {
                method: 'PATCH',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${authToken}`,
                },
                body: JSON.stringify({
                  videoDownloadUrl: downloadUrl,
                  thumbnailUrl: videoMetadata?.thumbnail,
                  status: 'awaiting_coach',
                  uploadProgress: 100,
                }),
              })

              if (updateResponse.ok) {
                toast.success('📋 Submission complete! Your coach will review it soon.')
              }
            } catch (updateError) {
              console.error('Error updating submission:', updateError)
            }

            // Reset form and switch to review tab
            setTimeout(() => {
              setIsSubmitting(false)
              setUploadProgress(0)
              clearFile()
              setAthleteContext('')
              setAthleteGoals('')
              setSpecificQuestions('')
              setActiveTab('review')
              loadSubmissions()
            }, 1500)
          },
          (error: any) => {
            console.error('Upload error:', error)
            let errorMsg = 'Failed to upload video'
            if (error?.code === 'storage/unauthorized') {
              errorMsg = 'Permission denied. Please sign out and sign in again.'
            } else if (error?.code === 'storage/unauthenticated') {
              errorMsg = 'Not authenticated. Please refresh the page.'
            }
            toast.error(errorMsg, { duration: 5000 })
            setIsSubmitting(false)
          }
        )

        uploadTaskRef.current = uploadTask
      } catch (error) {
        console.error('Submission error:', error)
        toast.error('Failed to submit video')
        setIsSubmitting(false)
      }
    },
    [videoFile, athleteContext, athleteGoals, specificQuestions, videoMetadata, authToken, user, clearFile]
  )

  // Cancel upload
  const cancelUpload = useCallback(() => {
    if (uploadTaskRef.current) {
      uploadTaskRef.current.cancel()
      uploadTaskRef.current = null
    }
    setIsSubmitting(false)
    setUploadProgress(0)
  }, [])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'awaiting_coach':
        return (
          <div className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-yellow-100" style={{ color: '#000', fontFamily: '"Open Sans", sans-serif' }}>
            <Clock className="w-3 h-3" />
            Pending
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
        return null
    }
  }

  const getThumbnailBorderColor = (status: string, hasFeedback: boolean) => {
    if (hasFeedback || status === 'reviewed' || status === 'completed') {
      // Reviewed / completed: green border
      return '#22C55E'
    }
    if (status === 'awaiting_coach') {
      // Pending coach review: amber border
      return '#FACC15'
    }
    // Default neutral border
    return '#E5E7EB'
  }

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Recently'
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp.seconds * 1000)
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    } catch {
      return 'Recently'
    }
  }

  return (
    <div
      className="fixed inset-0 z-50"
      style={{ backgroundColor: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(2px)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose()
      }}
    >
      <div
        className="fixed right-4 bottom-4 sm:right-6 sm:bottom-6 w-[92vw] sm:w-[700px] max-w-[740px] max-h-[85vh] rounded-2xl shadow-2xl overflow-hidden bg-white"
        style={{ animation: 'slideInChat .28s ease-out forwards' }}
      >
        {/* Header with Tabs */}
        <div style={{ background: '#FC0105' }}>
          <div className="flex items-center justify-between px-4 py-3">
            <h3 className="text-white font-bold" style={{ fontFamily: '"Open Sans", sans-serif' }}>
              Video Management
            </h3>
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="text-white/90 hover:text-white px-2 py-1 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50"
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-t border-white/20">
            <button
              onClick={() => !isSubmitting && setActiveTab('submit')}
              disabled={isSubmitting}
              className={`flex-1 px-4 py-2 font-bold transition-colors ${
                activeTab === 'submit'
                  ? 'bg-white text-black'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
              style={{ fontFamily: '"Open Sans", sans-serif' }}
            >
              Submit Video
            </button>
            <button
              onClick={() => !isSubmitting && setActiveTab('review')}
              disabled={isSubmitting}
              className={`flex-1 px-4 py-2 font-bold transition-colors ${
                activeTab === 'review'
                  ? 'bg-white text-black'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
              style={{ fontFamily: '"Open Sans", sans-serif' }}
            >
              Review Videos
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="overflow-y-auto" style={{ maxHeight: 'calc(85vh - 120px)' }}>
          {activeTab === 'submit' ? (
            // SUBMIT TAB
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              {/* Context */}
              <div>
                <label className="block text-sm font-bold mb-2" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif' }}>
                  Context <span style={{ color: '#FC0105' }}>*</span>
                </label>
                <textarea
                  value={athleteContext}
                  onChange={(e) => setAthleteContext(e.target.value)}
                  placeholder="Describe what you were working on, when this was recorded..."
                  className="w-full px-3 py-2 border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                  style={{ fontFamily: '"Open Sans", sans-serif' }}
                  rows={3}
                  required
                  disabled={isSubmitting}
                />
              </div>

              {/* Goals */}
              <div>
                <label className="block text-sm font-bold mb-2" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif' }}>
                  Goals (Optional)
                </label>
                <textarea
                  value={athleteGoals}
                  onChange={(e) => setAthleteGoals(e.target.value)}
                  placeholder="What are you trying to achieve or improve?"
                  className="w-full px-3 py-2 border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                  style={{ fontFamily: '"Open Sans", sans-serif' }}
                  rows={2}
                  disabled={isSubmitting}
                />
              </div>

              {/* Specific Questions */}
              <div>
                <label className="block text-sm font-bold mb-2" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif' }}>
                  Specific Questions (Optional)
                </label>
                <textarea
                  value={specificQuestions}
                  onChange={(e) => setSpecificQuestions(e.target.value)}
                  placeholder="Any specific areas you want feedback on?"
                  className="w-full px-3 py-2 border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                  style={{ fontFamily: '"Open Sans", sans-serif' }}
                  rows={2}
                  disabled={isSubmitting}
                />
              </div>

              {/* Video Upload */}
              <div>
                <label className="block text-sm font-bold mb-2" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif' }}>
                  Video <span style={{ color: '#FC0105' }}>*</span>
                </label>

                {!isSubmitting ? (
                  <>
                    {!videoFile ? (
                      <div className="border-2 border-dashed border-black rounded-lg p-6 text-center">
                        <svg
                          className="mx-auto h-10 w-10 mb-3"
                          style={{ color: '#8B7D7B' }}
                          stroke="currentColor"
                          fill="none"
                          viewBox="0 0 48 48"
                        >
                          <path
                            d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                            strokeWidth={2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="video/mp4,video/quicktime,video/x-msvideo,video/webm"
                          onChange={handleFileSelect}
                          className="hidden"
                          id="video-upload"
                        />
                        <label
                          htmlFor="video-upload"
                          className="inline-flex items-center px-4 py-2 bg-black text-white font-bold rounded-lg hover:bg-gray-800 cursor-pointer transition-colors"
                          style={{ fontFamily: '"Open Sans", sans-serif' }}
                        >
                          Select Video
                        </label>
                        <p className="mt-2 text-xs" style={{ color: '#666', fontFamily: '"Open Sans", sans-serif' }}>
                          MP4, MOV, AVI, or WebM • Max 500MB
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-start justify-between p-3 border-2 border-black rounded-lg">
                          <div className="flex-1">
                            <p className="font-bold text-sm" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif' }}>
                              {videoFile.name}
                            </p>
                            <div className="mt-2 space-y-1 text-xs" style={{ color: '#666', fontFamily: '"Open Sans", sans-serif' }}>
                              <p><strong>Duration:</strong> {Math.round(videoMetadata?.duration || 0)}s</p>
                              <p><strong>Size:</strong> {formatFileSize(videoFile.size)}</p>
                              {videoMetadata && (
                                <p><strong>Resolution:</strong> {videoMetadata.width} x {videoMetadata.height}</p>
                              )}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={clearFile}
                            className="ml-3 text-sm font-bold hover:underline"
                            style={{ color: '#FC0105', fontFamily: '"Open Sans", sans-serif' }}
                          >
                            Remove
                          </button>
                        </div>
                        {videoMetadata?.thumbnail && (
                          <div className="aspect-video rounded-lg overflow-hidden" style={{ backgroundColor: '#000' }}>
                            <img
                              src={videoMetadata.thumbnail}
                              alt="Video thumbnail"
                              className="w-full h-full object-contain"
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif' }}>
                        Uploading video...
                      </span>
                      <span className="text-sm font-bold" style={{ fontFamily: '"Open Sans", sans-serif' }}>
                        {uploadProgress}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-black h-3 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={cancelUpload}
                      className="text-sm font-bold hover:underline"
                      style={{ color: '#FC0105', fontFamily: '"Open Sans", sans-serif' }}
                    >
                      Cancel Upload
                    </button>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-white text-black border-2 border-black rounded-lg font-bold hover:bg-gray-50 transition-colors disabled:opacity-50"
                  style={{ fontFamily: '"Open Sans", sans-serif' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!videoFile || isSubmitting}
                  className="px-4 py-2 bg-black text-white rounded-lg font-bold hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ fontFamily: '"Open Sans", sans-serif' }}
                >
                  {isSubmitting ? `Uploading... ${uploadProgress}%` : 'Submit for Review'}
                </button>
              </div>
            </form>
          ) : (
            // REVIEW TAB
            <div className="p-4">
              {loadingSubmissions ? (
                <div className="grid grid-cols-2 gap-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-full bg-gray-200 rounded-lg animate-pulse" style={{ aspectRatio: '16/9' }}></div>
                  ))}
                </div>
              ) : selectedVideo ? (
                // Video Detail View
                <div className="space-y-4">
                  <button
                    onClick={() => setSelectedVideo(null)}
                    className="text-sm font-bold hover:underline mb-2"
                    style={{ color: '#000', fontFamily: '"Open Sans", sans-serif' }}
                  >
                    ← Back to list
                  </button>

                  {/* Video Player */}
                  {selectedVideo.videoDownloadUrl && (
                    <div className="w-full rounded-lg overflow-hidden" style={{ backgroundColor: '#000' }}>
                      <video
                        src={selectedVideo.videoDownloadUrl}
                        controls
                        className="w-full"
                        style={{ maxHeight: '300px' }}
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

                  {/* Submission Details */}
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
              ) : submissions.length > 0 ? (
                // Video Grid
                <div className="grid grid-cols-2 gap-3">
                  {submissions.map((sub) => (
                    <button
                      key={sub.id}
                      onClick={() => setSelectedVideo(sub)}
                      className="text-left w-full group"
                    >
                      <div
                        className="w-full rounded-lg overflow-hidden mb-2 relative border-2"
                        style={{
                          aspectRatio: '16/9',
                          backgroundColor: '#000',
                          borderColor: getThumbnailBorderColor(sub.status, !!sub.coachFeedback)
                        }}
                      >
                        {sub.thumbnailUrl ? (
                          <img
                            src={sub.thumbnailUrl}
                            alt="Video thumbnail"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: '#8B7D7B' }}>
                            <Play className="w-8 h-8 text-white" />
                          </div>
                        )}
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Play className="w-12 h-12 text-white" />
                        </div>
                        {sub.coachFeedback && (
                          <div className="absolute top-2 right-2 bg-green-500 text-white p-1 rounded-full">
                            <MessageSquare className="w-3 h-3" />
                          </div>
                        )}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs font-bold line-clamp-2 flex-1" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif' }}>
                            {sub.athleteContext.substring(0, 50)}...
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
                <p className="text-gray-500 text-sm text-center py-8">
                  No video submissions yet. Switch to Submit tab to upload your first video!
                </p>
              )}
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
  )
}
