'use client'

import { useState, useRef, useCallback } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage'
import { storage, db } from '@/lib/firebase.client'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { Upload, Video, FileText, X, Check, Play, Pause, Camera, Link as LinkIcon } from 'lucide-react'

type ContentType = 'video' | 'document' | 'link'

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
  const [linkUrl, setLinkUrl] = useState('')
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  // Thumbnail scrubber state (videos only)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [videoUrl, setVideoUrl] = useState<string>('')
  const [showThumbnailSelector, setShowThumbnailSelector] = useState(false)
  const [thumbnailCandidates, setThumbnailCandidates] = useState<string[]>([])
  const [selectedThumbnail, setSelectedThumbnail] = useState<string>('')
  const [videoDuration, setVideoDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)

  const captureFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return null
    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return null

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    return canvas.toDataURL('image/jpeg', 0.8)
  }, [])

  const generateThumbnails = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const duration = video.duration || 10
    const candidates: string[] = []

    // Immediate thumbnail
    const immediate = captureFrame()
    if (immediate) {
      candidates.push(immediate)
      setThumbnailCandidates([...candidates])
      setSelectedThumbnail(immediate)
    }

    // Additional thumbnails at 25%, 50%, 75%
    const timestamps = [duration * 0.25, duration * 0.5, duration * 0.75]
    for (const timestamp of timestamps) {
      try {
        video.currentTime = timestamp
        await new Promise<void>((resolve) => {
          const timeout = setTimeout(() => resolve(), 2000)
          const handleSeeked = () => {
            clearTimeout(timeout)
            video.removeEventListener('seeked', handleSeeked)
            resolve()
          }
          video.addEventListener('seeked', handleSeeked)
        })

        const thumbnail = captureFrame()
        if (thumbnail && !candidates.includes(thumbnail)) {
          candidates.push(thumbnail)
          setThumbnailCandidates([...candidates])
        }
      } catch {
        // ignore seek errors
      }
    }
  }, [captureFrame])

  const handlePlayPause = useCallback(() => {
    if (!videoRef.current) return
    if (isPlaying) {
      videoRef.current.pause()
    } else {
      videoRef.current.play()
    }
    setIsPlaying((prev) => !prev)
  }, [isPlaying])

  const handleScrub = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value)
    if (videoRef.current) {
      videoRef.current.currentTime = time
      setCurrentTime(time)
    }
  }, [])

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

    if (contentType === 'video') {
      // Clean up previous object URL
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl)
      }
      const url = URL.createObjectURL(file)
      setVideoUrl(url)
      setShowThumbnailSelector(true)
      setThumbnailCandidates([])
      setSelectedThumbnail('')
    }
  }

  const validateUrl = (url: string): boolean => {
    try {
      const urlObj = new URL(url)
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:'
    } catch {
      return false
    }
  }

  const handleUpload = async () => {
    // Validate based on content type
    if (!user?.uid || !title.trim()) {
      alert('Please fill in all required fields')
      return
    }

    if (contentType === 'link') {
      if (!linkUrl.trim()) {
        alert('Please enter a URL link')
        return
      }
      if (!validateUrl(linkUrl.trim())) {
        alert('Please enter a valid URL (must start with http:// or https://)')
        return
      }
    } else {
      if (!selectedFile) {
        alert('Please select a file to upload')
        return
      }
    }

    setIsUploading(true)

    try {
      if (contentType === 'link') {
        // Handle link content - no file upload needed
        setUploadProgress({
          fileName: 'Link',
          progress: 0,
          status: 'uploading'
        })

        // Save link to Firestore with robust error handling
        try {
          // Validate URL format before saving
          const trimmedUrl = linkUrl.trim()
          if (!trimmedUrl) {
            throw new Error('URL is required')
          }

          // Basic URL validation
          try {
            new URL(trimmedUrl)
          } catch (urlError) {
            throw new Error('Please enter a valid URL (e.g., https://example.com)')
          }

          // Validate title
          const trimmedTitle = title.trim()
          if (!trimmedTitle) {
            throw new Error('Title is required')
          }

          // Save to Firestore with retry logic
          let retries = 3
          let lastError: any = null
          let docId: string | null = null

          while (retries > 0) {
            try {
              const docRef = await addDoc(collection(db, 'coach_content'), {
                coachId: user.uid,
                coachName: user.displayName || 'Unknown Coach',
                contentType: 'link',
                title: trimmedTitle,
                description: description.trim(),
                linkUrl: trimmedUrl,
                uploadedAt: serverTimestamp(),
                isPublic: false, // Default to private
                views: 0,
                status: 'published' // Mark as published so it appears in feeds
              })
              docId = docRef.id
              console.log(`✅ Link content saved to Firestore: ${docId}`)
              break // Success - exit retry loop
            } catch (firestoreError: any) {
              lastError = firestoreError
              retries--
              
              // If it's a permission error, don't retry
              const errorMsg = firestoreError.message || firestoreError.code || ''
              if (errorMsg.includes('permission') || errorMsg.includes('Permission') || errorMsg.includes('permission-denied')) {
                throw new Error('Permission denied. Please check your account permissions or contact support.')
              }
              
              // If last retry, throw the error
              if (retries === 0) {
                throw firestoreError
              }
              
              // Wait before retrying (exponential backoff)
              console.warn(`⚠️ Firestore save failed, retrying... (${retries} attempts left)`)
              await new Promise(resolve => setTimeout(resolve, 1000 * (4 - retries)))
            }
          }

          // Verify the document was created
          if (!docId) {
            throw new Error('Failed to save link to Firestore after retries')
          }

          // ALSO create as a lesson so it appears in Training Library and flows to athletes
          try {
            const token = await user.getIdToken()
            const lessonResponse = await fetch('/api/coach/lessons/create', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                title: trimmedTitle,
                sport: 'other', // Default sport for quick links
                level: 'beginner', // Default level
                duration: 15, // Default duration for link content
                contentType: 'link',
                externalLinkUrl: trimmedUrl,
                externalLinkDescription: description.trim(),
                visibility: 'athletes_only',
                objectives: [],
                tags: ['external-link']
              })
            })

            if (lessonResponse.ok) {
              console.log('✅ Link also saved as lesson for Training Library')
            } else {
              console.warn('⚠️ Link saved to locker room but failed to create lesson')
            }
          } catch (lessonError) {
            console.warn('⚠️ Link saved to locker room but failed to create lesson:', lessonError)
            // Don't throw - the link was saved successfully to coach_content
          }
        } catch (firestoreError: any) {
          console.error('Firestore error:', firestoreError)
          const errorMsg = firestoreError.message || firestoreError.code || 'Failed to save link'
          if (errorMsg.includes('permission') || errorMsg.includes('Permission') || errorMsg.includes('permission-denied')) {
            throw new Error('Permission denied. Please check your account permissions or contact support.')
          }
          throw new Error(errorMsg)
        }

        setUploadProgress({
          fileName: 'Link',
          progress: 100,
          status: 'complete',
          url: linkUrl.trim()
        })

        // Reset form after 2 seconds
        setTimeout(() => {
          setTitle('')
          setDescription('')
          setLinkUrl('')
          setUploadProgress(null)
          setIsUploading(false)
        }, 2000)
      } else {
        // Handle file upload (video or document)
        if (!selectedFile) return

        setUploadProgress({
          fileName: selectedFile.name,
          progress: 0,
          status: 'uploading'
        })

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
            try {
              // Upload complete - get download URL
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref)

              // CRITICAL: Save metadata to Firestore with retry logic
              let retries = 3
              let lastError: any = null
              let docId: string | null = null

              while (retries > 0) {
                try {
                  const docRef = await addDoc(collection(db, 'coach_content'), {
                    coachId: user.uid,
                    coachName: user.displayName || 'Unknown Coach',
                    contentType,
                    title: title.trim(),
                    description: description.trim(),
                    fileUrl: downloadURL,
                    fileName: selectedFile.name,
                    fileSize: selectedFile.size,
                    thumbnail: selectedThumbnail || null,
                    uploadedAt: serverTimestamp(),
                    isPublic: false, // Default to private
                    views: 0,
                    status: 'published' // Mark as published so it appears in feeds
                  })
                  docId = docRef.id
                  console.log(`✅ Content saved to Firestore: ${docId}`)
                  break // Success - exit retry loop
                } catch (firestoreError: any) {
                  lastError = firestoreError
                  retries--
                  
                  // If it's a permission error, don't retry
                  const errorMsg = firestoreError.message || firestoreError.code || ''
                  if (errorMsg.includes('permission') || errorMsg.includes('Permission') || errorMsg.includes('permission-denied')) {
                    throw new Error('Permission denied. Please check your account permissions or contact support.')
                  }
                  
                  // If last retry, throw the error
                  if (retries === 0) {
                    throw firestoreError
                  }
                  
                  // Wait before retrying (exponential backoff)
                  console.warn(`⚠️ Firestore save failed, retrying... (${retries} attempts left)`)
                  await new Promise(resolve => setTimeout(resolve, 1000 * (4 - retries)))
                }
              }

              // Verify the document was created
              if (!docId) {
                throw new Error('Failed to save content to Firestore after retries')
              }

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
                if (videoUrl) {
                  URL.revokeObjectURL(videoUrl)
                }
                setVideoUrl('')
                setShowThumbnailSelector(false)
                setThumbnailCandidates([])
                setSelectedThumbnail('')
                setUploadProgress(null)
                setIsUploading(false)
              }, 2000)
            } catch (error: any) {
              console.error('❌ Error saving content to Firestore:', error)
              setUploadProgress({
                fileName: selectedFile.name,
                progress: 0,
                status: 'error',
                error: error.message || 'Failed to save content. Please try again.'
              })
              setIsUploading(false)
            }
          }
        )
      }
    } catch (error) {
      console.error('Upload failed:', error)
      setUploadProgress({
        fileName: contentType === 'link' ? 'Link' : (selectedFile?.name || 'File'),
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
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => {
              setContentType('video')
              setLinkUrl('')
              setSelectedFile(null)
            }}
            className={`py-3 px-4 rounded-lg border-2 transition-all ${
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
            onClick={() => {
              setContentType('document')
              setLinkUrl('')
              setSelectedFile(null)
            }}
            className={`py-3 px-4 rounded-lg border-2 transition-all ${
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
          <button
            onClick={() => {
              setContentType('link')
              setSelectedFile(null)
              if (videoUrl) {
                URL.revokeObjectURL(videoUrl)
              }
              setVideoUrl('')
              setShowThumbnailSelector(false)
            }}
            className={`py-3 px-4 rounded-lg border-2 transition-all ${
              contentType === 'link'
                ? 'border-black bg-black text-white'
                : 'border-gray-200 bg-white text-black hover:border-black'
            }`}
          >
            <LinkIcon className="w-5 h-5 mx-auto mb-1" />
            <span className="text-sm font-bold" style={{ fontFamily: '"Open Sans", sans-serif' }}>
              Link
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
          className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-black focus:outline-none bg-white"
          style={{ fontFamily: '"Open Sans", sans-serif', color: '#000000' }}
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
          className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-black focus:outline-none resize-none bg-white"
          style={{ fontFamily: '"Open Sans", sans-serif', color: '#000000' }}
          disabled={isUploading}
        />
      </div>

      {/* File Upload or URL Input */}
      {contentType === 'link' ? (
        <div>
          <label className="block text-sm font-bold mb-2" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif' }}>
            URL Link <span style={{ color: '#FC0105' }}>*</span>
          </label>
          <input
            type="url"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="https://example.com/article"
            className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-black focus:outline-none bg-white"
            style={{ fontFamily: '"Open Sans", sans-serif', color: '#000000' }}
            disabled={isUploading}
          />
          <p className="text-xs mt-1" style={{ color: '#666', fontFamily: '"Open Sans", sans-serif' }}>
            Enter a valid URL (e.g., https://example.com)
          </p>
        </div>
      ) : (
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

          {/* Thumbnail scrubber (video only) */}
          {contentType === 'video' && selectedFile && showThumbnailSelector && videoUrl && (
            <div className="mt-6 space-y-4">
              <label className="block text-sm font-bold" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif' }}>
                Choose Thumbnail
              </label>
              <div className="border border-gray-200 rounded-lg p-4 bg-white">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 space-y-2">
                    <video
                      ref={videoRef}
                      src={videoUrl}
                      className="w-full rounded-md bg-black"
                      onLoadedMetadata={(e) => {
                        const v = e.currentTarget
                        setVideoDuration(v.duration || 0)
                      }}
                      onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                      muted
                    />
                    {videoDuration > 0 && (
                      <div className="flex items-center gap-3 mt-2">
                        <button
                          type="button"
                          onClick={handlePlayPause}
                          className="p-2 rounded-full border border-gray-300 hover:bg-gray-100"
                        >
                          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        </button>
                        <input
                          type="range"
                          min={0}
                          max={videoDuration}
                          step={0.1}
                          value={currentTime}
                          onChange={handleScrub}
                          className="flex-1"
                        />
                        <button
                          type="button"
                          onClick={async () => {
                            const frame = captureFrame()
                            if (frame) {
                              setSelectedThumbnail(frame)
                              if (!thumbnailCandidates.includes(frame)) {
                                setThumbnailCandidates((prev) => [...prev, frame])
                              }
                            }
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-full border border-gray-300 text-xs font-semibold hover:bg-gray-100"
                        >
                          <Camera className="w-3 h-3" />
                          Capture Frame
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="w-full md:w-48 space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-600">
                      Thumbnail Choices
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {thumbnailCandidates.map((thumb, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setSelectedThumbnail(thumb)}
                          className={`relative border ${selectedThumbnail === thumb ? 'border-black' : 'border-gray-200'} rounded overflow-hidden`}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={thumb} alt={`Thumbnail ${idx + 1}`} className="w-full h-16 object-cover" />
                          {selectedThumbnail === thumb && (
                            <span className="absolute inset-0 border-2 border-black pointer-events-none" />
                          )}
                        </button>
                      ))}
                      {thumbnailCandidates.length === 0 && (
                        <p className="text-xs text-gray-500 col-span-2">Generating preview frames…</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

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
            <p className="text-sm mt-2 font-bold" style={{ color: '#FC0105', fontFamily: '"Open Sans", sans-serif' }}>
              {uploadProgress.error || 'Upload failed. Please try again.'}
            </p>
          )}
        </div>
      )}

      {/* Upload Button */}
      <button
        onClick={handleUpload}
        disabled={
          !title.trim() || 
          isUploading || 
          (contentType === 'link' ? !linkUrl.trim() : !selectedFile)
        }
        className={`w-full py-3 px-6 rounded-lg font-bold text-white transition-colors ${
          !title.trim() || 
          isUploading || 
          (contentType === 'link' ? !linkUrl.trim() : !selectedFile)
            ? 'bg-gray-300 cursor-not-allowed'
            : 'bg-black hover:bg-gray-800'
        }`}
        style={{ fontFamily: '"Open Sans", sans-serif' }}
      >
        {isUploading 
          ? (contentType === 'link' ? 'Saving...' : 'Uploading...') 
          : (contentType === 'link' ? 'Save Link' : 'Upload Content')
        }
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
