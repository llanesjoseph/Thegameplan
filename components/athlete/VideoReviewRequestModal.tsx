'use client'

/**
 * Video Review Request Modal
 * Allows athletes to submit video clips for coach review
 */

import { useState } from 'react'
import { X, Upload, Video, FileText, Send, Link as LinkIcon, Film } from 'lucide-react'
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage'
import { storage } from '@/lib/firebase.client'

interface VideoReviewRequestModalProps {
  userId: string
  userEmail: string
  coachId?: string
  onClose: () => void
  onSuccess: () => void
}

export default function VideoReviewRequestModal({
  userId,
  userEmail,
  coachId,
  onClose,
  onSuccess
}: VideoReviewRequestModalProps) {
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

  const isValid = uploadMethod === 'url'
    ? formData.videoUrl.trim() !== '' && formData.title.trim() !== '' && formData.description.trim() !== ''
    : selectedFile !== null && formData.title.trim() !== '' && formData.description.trim() !== ''

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const validTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm']
    if (!validTypes.includes(file.type)) {
      setError('Please select a valid video file (MP4, MOV, AVI, or WebM)')
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
      const fileName = `video-reviews/${userId}/${timestamp}_${file.name}`
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
    if (!isValid) return

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
          athleteId: userId,
          coachId,
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
      onSuccess()
      onClose()
    } catch (err) {
      console.error('❌ Error submitting video review request:', err)
      setError(err instanceof Error ? err.message : 'Failed to submit request. Please try again.')
      setIsSubmitting(false)
      setIsUploading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b flex items-center justify-between" style={{ borderColor: '#E8E6D8' }}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#91A6EB' }}>
              <Video className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-2xl" style={{ color: '#000000' }}>
                Request Video Review
              </h3>
              <p className="text-sm" style={{ color: '#000000', opacity: 0.7 }}>
                Get personalized feedback from your coach
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            disabled={isSubmitting}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error Message */}
          {error && (
            <div className="p-4 rounded-lg" style={{ backgroundColor: '#FEE2E2' }}>
              <p style={{ color: '#DC2626' }}>{error}</p>
            </div>
          )}

          {/* Upload Method Tabs */}
          <div>
            <label className="text-sm mb-3 block" style={{ color: '#000000' }}>
              How would you like to share your video? *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setUploadMethod('url')
                  setSelectedFile(null)
                  setError(null)
                }}
                disabled={isSubmitting || isUploading}
                className={`p-4 rounded-lg border-2 transition-all ${
                  uploadMethod === 'url'
                    ? 'border-black bg-black text-white'
                    : 'border-gray-300 bg-white hover:border-gray-400'
                }`}
              >
                <LinkIcon className="w-6 h-6 mx-auto mb-2" />
                <div className="text-sm">Share Link</div>
                <div className="text-xs opacity-75 mt-1">Vimeo, Google Drive, etc.</div>
              </button>
              <button
                type="button"
                onClick={() => {
                  setUploadMethod('file')
                  setFormData({ ...formData, videoUrl: '' })
                  setError(null)
                }}
                disabled={isSubmitting || isUploading}
                className={`p-4 rounded-lg border-2 transition-all ${
                  uploadMethod === 'file'
                    ? 'border-black bg-black text-white'
                    : 'border-gray-300 bg-white hover:border-gray-400'
                }`}
              >
                <Film className="w-6 h-6 mx-auto mb-2" />
                <div className="text-sm">Upload File</div>
                <div className="text-xs opacity-75 mt-1">MP4, MOV, AVI, WebM</div>
              </button>
            </div>
          </div>

          {/* Video URL Input (if URL method selected) */}
          {uploadMethod === 'url' && (
            <div>
              <label className="flex items-center gap-2 text-sm mb-2" style={{ color: '#000000' }}>
                <LinkIcon className="w-4 h-4" />
                Video URL *
              </label>
              <input
                type="url"
                value={formData.videoUrl}
                onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                placeholder="https://vimeo.com/... or https://drive.google.com/..."
                className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-black transition-colors"
                style={{ borderColor: '#E8E6D8' }}
                required
                disabled={isSubmitting || isUploading}
              />
              <p className="text-xs mt-1" style={{ color: '#000000', opacity: 0.6 }}>
                Vimeo or Google Drive link to your video
              </p>
            </div>
          )}

          {/* File Upload Input (if file method selected) */}
          {uploadMethod === 'file' && (
            <div>
              <label className="flex items-center gap-2 text-sm mb-2" style={{ color: '#000000' }}>
                <Upload className="w-4 h-4" />
                Upload Video File *
              </label>
              <div className="relative">
                <input
                  type="file"
                  accept="video/mp4,video/quicktime,video/x-msvideo,video/webm"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="video-file-input"
                  disabled={isSubmitting || isUploading}
                />
                <label
                  htmlFor="video-file-input"
                  className="flex items-center justify-center gap-3 w-full px-4 py-8 border-2 border-dashed rounded-lg cursor-pointer transition-colors hover:border-black"
                  style={{ borderColor: selectedFile ? '#000000' : '#E8E6D8' }}
                >
                  {selectedFile ? (
                    <div className="text-center">
                      <Film className="w-8 h-8 mx-auto mb-2" style={{ color: '#000000' }} />
                      <p className="font-semibold" style={{ color: '#000000' }}>{selectedFile.name}</p>
                      <p className="text-xs mt-1" style={{ color: '#000000', opacity: 0.6 }}>
                        {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Upload className="w-8 h-8 mx-auto mb-2" style={{ color: '#000000', opacity: 0.5 }} />
                      <p className="font-semibold" style={{ color: '#000000' }}>Click to select video file</p>
                      <p className="text-xs mt-1" style={{ color: '#000000', opacity: 0.6 }}>
                        MP4, MOV, AVI, or WebM (max 500MB)
                      </p>
                    </div>
                  )}
                </label>
              </div>
              {isUploading && (
                <div className="mt-3">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span style={{ color: '#000000' }}>Uploading...</span>
                    <span style={{ color: '#000000' }}>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%`, backgroundColor: '#16A34A' }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="flex items-center gap-2 text-sm mb-2" style={{ color: '#000000' }}>
              <FileText className="w-4 h-4" />
              Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Pitching Form Review - Fastball"
              className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-black transition-colors"
              style={{ borderColor: '#E8E6D8' }}
              required
              disabled={isSubmitting}
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-sm mb-2 block" style={{ color: '#000000' }}>
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe what's in the video and what aspect of your performance you'd like reviewed..."
              rows={4}
              className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-black transition-colors resize-none"
              style={{ borderColor: '#E8E6D8' }}
              required
              disabled={isSubmitting}
            />
          </div>

          {/* Specific Questions */}
          <div>
            <label className="text-sm mb-2 block" style={{ color: '#000000' }}>
              Specific Questions (Optional)
            </label>
            <textarea
              value={formData.specificQuestions}
              onChange={(e) => setFormData({ ...formData, specificQuestions: e.target.value })}
              placeholder="Any specific questions or areas you want your coach to focus on?"
              rows={3}
              className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-black transition-colors resize-none"
              style={{ borderColor: '#E8E6D8' }}
              disabled={isSubmitting}
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 py-3 px-6 rounded-lg transition-colors"
              style={{ backgroundColor: '#E8E6D8', color: '#000000' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isValid || isSubmitting || isUploading}
              className="flex-1 py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              style={{
                backgroundColor: isValid && !isSubmitting && !isUploading ? '#16A34A' : '#9CA3AF',
                color: '#FFFFFF'
              }}
            >
              {isUploading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Uploading Video... {uploadProgress}%
                </>
              ) : isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
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
    </div>
  )
}
