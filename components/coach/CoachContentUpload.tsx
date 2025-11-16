'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage'
import { storage, db } from '@/lib/firebase.client'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { Upload, Video, FileText, X, Check } from 'lucide-react'

type ContentType = 'video' | 'document'

interface UploadProgress {
  fileName: string
  progress: number
  status: 'uploading' | 'complete' | 'error'
  url?: string
  error?: string
}

export default function CoachContentUpload() {
  const { user } = useAuth()
  const [contentType, setContentType] = useState<ContentType>('video')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (contentType === 'video') {
      if (!file.type.startsWith('video/')) {
        alert('Please select a valid video file')
        return
      }
      // Check file size (max 500MB for videos)
      if (file.size > 500 * 1024 * 1024) {
        alert('Video file size must be less than 500MB')
        return
      }
    } else {
      if (!file.type.includes('pdf') && !file.type.includes('document')) {
        alert('Please select a PDF or document file')
        return
      }
      // Check file size (max 50MB for documents)
      if (file.size > 50 * 1024 * 1024) {
        alert('Document file size must be less than 50MB')
        return
      }
    }

    setSelectedFile(file)
  }

  const handleUpload = async () => {
    if (!user?.uid || !selectedFile || !title.trim()) {
      alert('Please fill in all required fields and select a file')
      return
    }

    setIsUploading(true)
    setUploadProgress({
      fileName: selectedFile.name,
      progress: 0,
      status: 'uploading'
    })

    try {
      // Create storage reference
      const timestamp = Date.now()
      const fileExt = selectedFile.name.split('.').pop()
      const storagePath = `coaches/${user.uid}/content/${contentType}s/${timestamp}.${fileExt}`
      const storageRef = ref(storage, storagePath)

      // Upload file with progress tracking
      const uploadTask = uploadBytesResumable(storageRef, selectedFile)

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
          setUploadProgress(prev => prev ? { ...prev, progress } : null)
        },
        (error) => {
          console.error('Upload error:', error)
          setUploadProgress({
            fileName: selectedFile.name,
            progress: 0,
            status: 'error',
            error: error.message
          })
          setIsUploading(false)
        },
        async () => {
          // Upload complete - get download URL
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref)

          // Save metadata to Firestore
          await addDoc(collection(db, 'coach_content'), {
            coachId: user.uid,
            coachName: user.displayName || 'Unknown Coach',
            contentType,
            title: title.trim(),
            description: description.trim(),
            fileUrl: downloadURL,
            fileName: selectedFile.name,
            fileSize: selectedFile.size,
            uploadedAt: serverTimestamp(),
            isPublic: false, // Default to private
            views: 0
          })

          setUploadProgress({
            fileName: selectedFile.name,
            progress: 100,
            status: 'complete',
            url: downloadURL
          })

          // Reset form after 2 seconds
          setTimeout(() => {
            setTitle('')
            setDescription('')
            setSelectedFile(null)
            setUploadProgress(null)
            setIsUploading(false)
          }, 2000)
        }
      )
    } catch (error) {
      console.error('Upload failed:', error)
      setUploadProgress({
        fileName: selectedFile.name,
        progress: 0,
        status: 'error',
        error: 'Upload failed. Please try again.'
      })
      setIsUploading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Content Type Selection */}
      <div>
        <label className="block text-sm font-bold mb-2" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif' }}>
          Content Type
        </label>
        <div className="flex gap-3">
          <button
            onClick={() => setContentType('video')}
            className={`flex-1 py-3 px-4 rounded-lg border-2 transition-all ${
              contentType === 'video'
                ? 'border-black bg-black text-white'
                : 'border-gray-200 bg-white text-black hover:border-black'
            }`}
          >
            <Video className="w-5 h-5 mx-auto mb-1" />
            <span className="text-sm font-bold" style={{ fontFamily: '"Open Sans", sans-serif' }}>
              Video
            </span>
          </button>
          <button
            onClick={() => setContentType('document')}
            className={`flex-1 py-3 px-4 rounded-lg border-2 transition-all ${
              contentType === 'document'
                ? 'border-black bg-black text-white'
                : 'border-gray-200 bg-white text-black hover:border-black'
            }`}
          >
            <FileText className="w-5 h-5 mx-auto mb-1" />
            <span className="text-sm font-bold" style={{ fontFamily: '"Open Sans", sans-serif' }}>
              Document
            </span>
          </button>
        </div>
      </div>

      {/* Title Input */}
      <div>
        <label className="block text-sm font-bold mb-2" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif' }}>
          Title <span style={{ color: '#FC0105' }}>*</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter a title for this content"
          className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-black focus:outline-none"
          style={{ fontFamily: '"Open Sans", sans-serif' }}
          disabled={isUploading}
        />
      </div>

      {/* Description Input */}
      <div>
        <label className="block text-sm font-bold mb-2" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif' }}>
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add a description (optional)"
          rows={3}
          className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-black focus:outline-none resize-none"
          style={{ fontFamily: '"Open Sans", sans-serif' }}
          disabled={isUploading}
        />
      </div>

      {/* File Upload */}
      <div>
        <label className="block text-sm font-bold mb-2" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif' }}>
          {contentType === 'video' ? 'Video File' : 'Document File'} <span style={{ color: '#FC0105' }}>*</span>
        </label>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-black transition-colors">
          <input
            type="file"
            onChange={handleFileSelect}
            accept={contentType === 'video' ? 'video/*' : '.pdf,.doc,.docx'}
            className="hidden"
            id="file-upload"
            disabled={isUploading}
          />
          <label htmlFor="file-upload" className="cursor-pointer">
            <Upload className="w-12 h-12 mx-auto mb-2" style={{ color: '#666' }} />
            <p className="text-sm font-bold mb-1" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif' }}>
              {selectedFile ? selectedFile.name : 'Click to upload file'}
            </p>
            <p className="text-xs" style={{ color: '#666', fontFamily: '"Open Sans", sans-serif' }}>
              {contentType === 'video' ? 'Max size: 500MB' : 'Max size: 50MB'}
            </p>
          </label>
        </div>
      </div>

      {/* Upload Progress */}
      {uploadProgress && (
        <div className="border-2 border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold" style={{ fontFamily: '"Open Sans", sans-serif' }}>
              {uploadProgress.fileName}
            </span>
            {uploadProgress.status === 'complete' && (
              <Check className="w-5 h-5" style={{ color: '#00A651' }} />
            )}
            {uploadProgress.status === 'error' && (
              <X className="w-5 h-5" style={{ color: '#FC0105' }} />
            )}
          </div>
          {uploadProgress.status === 'uploading' && (
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-black h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress.progress}%` }}
              />
            </div>
          )}
          {uploadProgress.status === 'complete' && (
            <p className="text-sm mt-2" style={{ color: '#00A651', fontFamily: '"Open Sans", sans-serif' }}>
              Upload complete!
            </p>
          )}
          {uploadProgress.status === 'error' && (
            <p className="text-sm mt-2" style={{ color: '#FC0105', fontFamily: '"Open Sans", sans-serif' }}>
              {uploadProgress.error}
            </p>
          )}
        </div>
      )}

      {/* Upload Button */}
      <button
        onClick={handleUpload}
        disabled={!title.trim() || !selectedFile || isUploading}
        className={`w-full py-3 px-6 rounded-lg font-bold text-white transition-colors ${
          !title.trim() || !selectedFile || isUploading
            ? 'bg-gray-300 cursor-not-allowed'
            : 'bg-black hover:bg-gray-800'
        }`}
        style={{ fontFamily: '"Open Sans", sans-serif' }}
      >
        {isUploading ? 'Uploading...' : 'Upload Content'}
      </button>

      {/* Info Note */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <p className="text-xs" style={{ color: '#666', fontFamily: '"Open Sans", sans-serif' }}>
          <strong>Note:</strong> Uploaded content will be saved to your profile and can be shared with your athletes or made public.
        </p>
      </div>
    </div>
  )
}
