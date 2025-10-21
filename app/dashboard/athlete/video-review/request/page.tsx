'use client'

/**
 * Video Review Request Page - Full Page Experience
 * Allows athletes to submit video clips for coach review with better UX than modal
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { X, Upload, Video, FileText, Send, Link as LinkIcon, Film, ArrowLeft, Check } from 'lucide-react'
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage'
import { storage, db } from '@/lib/firebase.client'
import { doc, getDoc } from 'firebase/firestore'
import AppHeader from '@/components/ui/AppHeader'

export default function VideoReviewRequestPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [coachId, setCoachId] = useState<string | null>(null)
  const [coachName, setCoachName] = useState<string>('Your Coach')

  const [formData, setFormData] = useState({
    videoUrl: '',
    title: '',
    description: '',
    specificQuestions: ''
  })
  const [uploadMethod, setUploadMethod] = useState<'url' | 'file'>('url')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)

  // Load coach info
  useEffect(() => {
    const loadCoachInfo = async () => {
      if (!user?.uid) return

      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid))
        if (userDoc.exists()) {
          const userData = userDoc.data()
          const assignedCoachId = userData?.coachId || userData?.assignedCoachId || null
          setCoachId(assignedCoachId)

          if (assignedCoachId) {
            const coachDoc = await getDoc(doc(db, 'users', assignedCoachId))
            if (coachDoc.exists()) {
              const coachData = coachDoc.data()
              setCoachName(coachData?.displayName || 'Your Coach')
            }
          }
        }
      } catch (error) {
        console.error('Error loading coach info:', error)
      }
    }

    loadCoachInfo()
  }, [user?.uid])

  const isValid = uploadMethod === 'url'
    ? formData.videoUrl.trim() !== '' && formData.title.trim() !== '' && formData.description.trim() !== ''
    : selectedFile !== null && formData.title.trim() !== '' && formData.description.trim() !== ''

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const validTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm', 'video/x-matroska']
    if (!validTypes.includes(file.type)) {
      setError('Please select a valid video file (MP4, MOV, AVI, WebM, or MKV)')
      return
    }

    // Validate file size (max 500MB)
    const maxSize = 500 * 1024 * 1024
    if (file.size > maxSize) {
      setError('Video file must be less than 500MB')
      return
    }

    setSelectedFile(file)
    setError(null)
  }

  const uploadFileToStorage = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const timestamp = Date.now()
      const fileName = `video-reviews/${user!.uid}/${timestamp}_${file.name}`
      const storageRef = ref(storage, fileName)
      const uploadTask = uploadBytesResumable(storageRef, file)

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
          setUploadProgress(Math.round(progress))
        },
        (error) => {
          console.error('Upload error:', error)
          reject(error)
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref)
          resolve(downloadURL)
        }
      )
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid || !user) return

    setIsSubmitting(true)
    setError(null)

    try {
      let videoUrl = formData.videoUrl.trim()

      // If file upload method, upload file first
      if (uploadMethod === 'file' && selectedFile) {
        setIsUploading(true)
        console.log('📤 Uploading video file to Firebase Storage...')
        videoUrl = await uploadFileToStorage(selectedFile)
        console.log('✅ Video uploaded successfully:', videoUrl)
        setIsUploading(false)
      }

      const response = await fetch('/api/athlete/video-review/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          athleteId: user.uid,
          assignedCoachUid: coachId,
          videoUrl,
          title: formData.title.trim(),
          description: formData.description.trim(),
          specificQuestions: formData.specificQuestions.trim()
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit video review request')
      }

      console.log('✅ Video review request submitted successfully')

      // Show success message
      setShowSuccess(true)

      // Redirect after a short delay
      setTimeout(() => {
        router.push('/dashboard/athlete/video-reviews')
      }, 2000)
    } catch (err) {
      console.error('❌ Error submitting video review request:', err)
      setError(err instanceof Error ? err.message : 'Failed to submit request. Please try again.')
      setIsSubmitting(false)
      setIsUploading(false)
    }
  }

  if (showSuccess) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#E8E6D8' }}>
        <AppHeader title="Request Submitted!" subtitle="Your coach will review it soon" />
        <main className="w-full max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl p-12 text-center">
            <div className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center" style={{ backgroundColor: '#16A34A' }}>
              <Check className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold mb-3" style={{ color: '#000000' }}>
              Request Submitted Successfully!
            </h2>
            <p className="text-lg mb-6" style={{ color: '#666' }}>
              {coachName} has been notified and will review your video soon.
            </p>
            <p className="text-sm" style={{ color: '#999' }}>
              Redirecting to your video reviews...
            </p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#E8E6D8' }}>
      <AppHeader
        title="Request Video Review"
        subtitle={`Get personalized feedback from ${coachName}`}
      />

      <main className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 mb-6 px-4 py-2 rounded-lg hover:bg-white/50 transition-colors"
          style={{ color: '#000000' }}
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>

        {/* Main Form Card */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden">
          {/* Hero Section */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-8 text-white">
            <div className="flex items-center gap-4 mb-3">
              <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Video className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Submit Your Video</h1>
                <p className="text-blue-100 mt-1">
                  Share your performance and get expert feedback
                </p>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-8 space-y-8">
            {/* Error Message */}
            {error && (
              <div className="p-4 rounded-lg bg-red-50 border-2 border-red-200">
                <p className="text-red-600 font-medium">{error}</p>
              </div>
            )}

            {/* Upload Method Selection */}
            <div>
              <label className="text-lg font-semibold mb-4 block" style={{ color: '#000000' }}>
                How would you like to share your video? *
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setUploadMethod('url')
                    setSelectedFile(null)
                    setError(null)
                  }}
                  disabled={isSubmitting || isUploading}
                  className={`p-6 rounded-xl border-2 transition-all text-left ${
                    uploadMethod === 'url'
                      ? 'border-blue-500 bg-blue-50 shadow-lg'
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                  }`}
                >
                  <LinkIcon className={`w-8 h-8 mb-3 ${uploadMethod === 'url' ? 'text-blue-500' : 'text-gray-400'}`} />
                  <div className="text-lg font-semibold mb-1" style={{ color: '#000000' }}>Share Link</div>
                  <div className="text-sm text-gray-600">
                    Vimeo, Google Drive, YouTube, etc.
                  </div>
                  {uploadMethod === 'url' && (
                    <div className="mt-3 text-sm font-medium text-blue-600">✓ Selected</div>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setUploadMethod('file')
                    setFormData({ ...formData, videoUrl: '' })
                    setError(null)
                  }}
                  disabled={isSubmitting || isUploading}
                  className={`p-6 rounded-xl border-2 transition-all text-left ${
                    uploadMethod === 'file'
                      ? 'border-blue-500 bg-blue-50 shadow-lg'
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                  }`}
                >
                  <Film className={`w-8 h-8 mb-3 ${uploadMethod === 'file' ? 'text-blue-500' : 'text-gray-400'}`} />
                  <div className="text-lg font-semibold mb-1" style={{ color: '#000000' }}>Upload File</div>
                  <div className="text-sm text-gray-600">
                    MP4, MOV, AVI, WebM (max 500MB)
                  </div>
                  {uploadMethod === 'file' && (
                    <div className="mt-3 text-sm font-medium text-blue-600">✓ Selected</div>
                  )}
                </button>
              </div>
            </div>

            {/* Video URL Input (if URL method selected) */}
            {uploadMethod === 'url' && (
              <div className="bg-gray-50 rounded-xl p-6">
                <label className="flex items-center gap-2 text-base font-semibold mb-3" style={{ color: '#000000' }}>
                  <LinkIcon className="w-5 h-5 text-blue-500" />
                  Video URL *
                </label>
                <input
                  type="url"
                  value={formData.videoUrl}
                  onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                  placeholder="https://vimeo.com/... or https://drive.google.com/..."
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 transition-colors text-base"
                  required
                  disabled={isSubmitting || isUploading}
                />
                <p className="text-sm mt-2 text-gray-600">
                  Paste the link to your video from Vimeo, Google Drive, YouTube, or any other video hosting service
                </p>
              </div>
            )}

            {/* File Upload Input (if file method selected) */}
            {uploadMethod === 'file' && (
              <div className="bg-gray-50 rounded-xl p-6">
                <label className="flex items-center gap-2 text-base font-semibold mb-3" style={{ color: '#000000' }}>
                  <Upload className="w-5 h-5 text-blue-500" />
                  Upload Video File *
                </label>
                <div className="relative">
                  <input
                    type="file"
                    accept="video/mp4,video/quicktime,video/x-msvideo,video/webm,video/x-matroska"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="video-file-input"
                    disabled={isSubmitting || isUploading}
                  />
                  <label
                    htmlFor="video-file-input"
                    className={`flex items-center justify-center gap-3 w-full px-6 py-12 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                      selectedFile
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:border-blue-400 hover:bg-gray-100'
                    }`}
                  >
                    {selectedFile ? (
                      <div className="text-center">
                        <Film className="w-12 h-12 mx-auto mb-3 text-blue-500" />
                        <p className="font-semibold text-lg mb-1" style={{ color: '#000000' }}>{selectedFile.name}</p>
                        <p className="text-sm text-gray-600">
                          {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                        <p className="text-xs text-blue-600 mt-2">Click to change file</p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <Upload className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                        <p className="font-semibold text-lg mb-1" style={{ color: '#000000' }}>
                          Click to select video file
                        </p>
                        <p className="text-sm text-gray-600">
                          MP4, MOV, AVI, WebM, or MKV (max 500MB)
                        </p>
                      </div>
                    )}
                  </label>
                </div>
                {isUploading && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="font-medium" style={{ color: '#000000' }}>Uploading video...</span>
                      <span className="font-bold text-blue-600">{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div
                        className="h-3 rounded-full transition-all duration-300 bg-gradient-to-r from-blue-500 to-blue-600"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Title */}
            <div>
              <label className="flex items-center gap-2 text-base font-semibold mb-3" style={{ color: '#000000' }}>
                <FileText className="w-5 h-5 text-blue-500" />
                Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Guard Pass Technique - Competition Footage"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 transition-colors text-base"
                required
                disabled={isSubmitting}
              />
            </div>

            {/* Description */}
            <div>
              <label className="text-base font-semibold mb-3 block" style={{ color: '#000000' }}>
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe what's in the video and what aspect of your performance you'd like reviewed. Be specific about what you want feedback on."
                rows={5}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 transition-colors resize-none text-base"
                required
                disabled={isSubmitting}
              />
              <p className="text-sm mt-2 text-gray-600">
                The more detail you provide, the better feedback you'll receive
              </p>
            </div>

            {/* Specific Questions */}
            <div>
              <label className="text-base font-semibold mb-3 block" style={{ color: '#000000' }}>
                Specific Questions (Optional)
              </label>
              <textarea
                value={formData.specificQuestions}
                onChange={(e) => setFormData({ ...formData, specificQuestions: e.target.value })}
                placeholder="Any specific questions or areas you want your coach to focus on? For example: 'Am I keeping my elbows tight?' or 'How's my posture during the takedown?'"
                rows={4}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 transition-colors resize-none text-base"
                disabled={isSubmitting}
              />
            </div>

            {/* Submit Button */}
            <div className="flex gap-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => router.back()}
                disabled={isSubmitting || isUploading}
                className="px-8 py-4 rounded-lg transition-colors font-medium text-base hover:bg-gray-100 disabled:opacity-50"
                style={{ backgroundColor: '#E8E6D8', color: '#000000' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!isValid || isSubmitting || isUploading}
                className="flex-1 py-4 px-8 rounded-lg flex items-center justify-center gap-3 transition-all disabled:opacity-50 font-semibold text-base shadow-lg hover:shadow-xl"
                style={{
                  backgroundColor: isValid && !isSubmitting && !isUploading ? '#16A34A' : '#9CA3AF',
                  color: '#FFFFFF'
                }}
              >
                {isUploading ? (
                  <>
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                    Uploading Video... {uploadProgress}%
                  </>
                ) : isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Submit for Review
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Help Section */}
        <div className="mt-8 bg-blue-50 rounded-xl p-6 border-2 border-blue-100">
          <h3 className="font-semibold text-lg mb-3" style={{ color: '#000000' }}>
            Tips for Great Video Reviews
          </h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start gap-2">
              <span className="text-blue-500 mt-0.5">•</span>
              <span>Film from multiple angles if possible</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 mt-0.5">•</span>
              <span>Ensure good lighting and video quality</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 mt-0.5">•</span>
              <span>Include slow-motion footage for technical movements</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 mt-0.5">•</span>
              <span>Be specific about what you want reviewed</span>
            </li>
          </ul>
        </div>
      </main>
    </div>
  )
}
