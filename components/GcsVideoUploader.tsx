/**
 * GCS Video Uploader Component
 * Professional upload interface with progress tracking and resume capability
 */

'use client'

import { useState, useCallback } from 'react'
import { Upload, Play, Pause, X, CheckCircle, AlertCircle, Zap, Monitor } from 'lucide-react'
import { gcsUploadService, GcsUploadOptions, GcsUploadState, formatFileSize, estimateUploadTime } from '@/lib/gcs-upload'

interface GcsVideoUploaderProps {
 onUploadComplete?: (result: any) => void
 onUploadError?: (error: Error) => void
 maxFileSize?: number
 allowedTypes?: string[]
 className?: string
}

export default function GcsVideoUploader({
 onUploadComplete,
 onUploadError,
 maxFileSize = 10 * 1024 * 1024 * 1024, // 10GB
 allowedTypes = ['video/mp4', 'video/webm', 'video/mov', 'video/avi', 'video/mkv'],
 className = ''
}: GcsVideoUploaderProps) {
 const [dragActive, setDragActive] = useState(false)
 const [uploads, setUploads] = useState<Map<string, GcsUploadState>>(new Map())
 const [selectedFile, setSelectedFile] = useState<File | null>(null)

 const handleDrag = useCallback((e: React.DragEvent) => {
  e.preventDefault()
  e.stopPropagation()
  if (e.type === 'dragenter' || e.type === 'dragover') {
   setDragActive(true)
  } else if (e.type === 'dragleave') {
   setDragActive(false)
  }
 }, [])

 const handleDrop = useCallback((e: React.DragEvent) => {
  e.preventDefault()
  e.stopPropagation()
  setDragActive(false)

  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
   handleFileSelect(e.dataTransfer.files[0])
  }
 }, [])

 const handleFileSelect = (file: File) => {
  // Validate file type
  if (!allowedTypes.includes(file.type)) {
   alert(`Invalid file type. Allowed: ${allowedTypes.join(', ')}`)
   return
  }

  // Validate file size
  if (file.size > maxFileSize) {
   alert(`File size exceeds ${formatFileSize(maxFileSize)} limit`)
   return
  }

  setSelectedFile(file)
  console.log('📁 File selected:', {
   name: file.name,
   size: formatFileSize(file.size),
   type: file.type
  })
 }

 const startUpload = async () => {
  if (!selectedFile) return

  const videoId = `video_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  const options: GcsUploadOptions = {
   file: selectedFile,
   videoId,
   onProgress: (progress, bytesTransferred, totalBytes) => {
    setUploads(prev => {
     const newUploads = new Map(prev)
     const current = newUploads.get(videoId)
     if (current) {
      newUploads.set(videoId, {
       ...current,
       progress,
       bytesTransferred
      })
     }
     return newUploads
    })
   },
   onStateChange: (state) => {
    setUploads(prev => {
     const newUploads = new Map(prev)
     const current = newUploads.get(videoId)
     if (current) {
      newUploads.set(videoId, {
       ...current,
       state
      })
     }
     return newUploads
    })
   },
   onSuccess: (result) => {
    console.log('✅ Upload completed:', result)
    onUploadComplete?.(result)
   },
   onError: (error) => {
    console.error('❌ Upload failed:', error)
    onUploadError?.(error)
   }
  }

  try {
   // Add to uploads map
   const initialState: GcsUploadState = {
    videoId,
    file: selectedFile,
    progress: 0,
    state: 'pending',
    bytesTransferred: 0,
    totalBytes: selectedFile.size,
    createdAt: Date.now(),
    updatedAt: Date.now()
   }

   setUploads(prev => new Map(prev.set(videoId, initialState)))

   await gcsUploadService.startUpload(options)
  } catch (error) {
   console.error('Failed to start upload:', error)
   onUploadError?.(error as Error)
  }
 }

 const resumeUpload = async (videoId: string) => {
  try {
   await gcsUploadService.resumeUpload(videoId, {
    onProgress: (progress, bytesTransferred, totalBytes) => {
     setUploads(prev => {
      const newUploads = new Map(prev)
      const current = newUploads.get(videoId)
      if (current) {
       newUploads.set(videoId, {
        ...current,
        progress,
        bytesTransferred
       })
      }
      return newUploads
     })
    },
    onStateChange: (state) => {
     setUploads(prev => {
      const newUploads = new Map(prev)
      const current = newUploads.get(videoId)
      if (current) {
       newUploads.set(videoId, {
        ...current,
        state
       })
      }
      return newUploads
     })
    }
   })
  } catch (error) {
   console.error('Failed to resume upload:', error)
  }
 }

 const cancelUpload = async (videoId: string) => {
  try {
   await gcsUploadService.cancelUpload(videoId)
   setUploads(prev => {
    const newUploads = new Map(prev)
    newUploads.delete(videoId)
    return newUploads
   })
  } catch (error) {
   console.error('Failed to cancel upload:', error)
  }
 }

 const getStateIcon = (state: string) => {
  switch (state) {
   case 'uploading':
    return <Zap className="w-5 h-5 text-blue-500 animate-pulse" />
   case 'processing':
    return <Monitor className="w-5 h-5 text-orange-500 animate-pulse" />
   case 'completed':
    return <CheckCircle className="w-5 h-5 text-green-500" />
   case 'error':
    return <AlertCircle className="w-5 h-5 text-red-500" />
   default:
    return <Upload className="w-5 h-5 text-gray-500" />
  }
 }

 const getStateText = (state: string) => {
  switch (state) {
   case 'pending':
    return 'Ready to upload'
   case 'uploading':
    return 'Uploading to GCS'
   case 'processing':
    return 'Transcoding video'
   case 'completed':
    return 'Ready for playback'
   case 'error':
    return 'Upload failed'
   default:
    return 'Unknown state'
  }
 }

 return (
  <div className={`space-y-6 ${className}`}>
   {/* File Drop Zone */}
   <div
    className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
     dragActive
      ? 'border-blue-500 bg-blue-50'
      : 'border-gray-300 hover:border-gray-400'
    }`}
    onDragEnter={handleDrag}
    onDragLeave={handleDrag}
    onDragOver={handleDrag}
    onDrop={handleDrop}
   >
    <input
     type="file"
     accept={allowedTypes.join(',')}
     onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
     className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
    />

    <div className="space-y-4">
     <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
      <Upload className="w-8 h-8 text-gray-600" />
     </div>

     <div>
      <h3 className="text-lg font-medium text-gray-900">
       Upload Video to Google Cloud
      </h3>
      <p className="text-gray-600 mt-1">
       Drag and drop your video file here, or click to browse
      </p>
     </div>

     <div className="text-sm text-gray-500 space-y-1">
      <p>Supported formats: MP4, WebM, MOV, AVI, MKV</p>
      <p>Maximum size: {formatFileSize(maxFileSize)}</p>
      <p>Automatic transcoding to HLS and multiple qualities</p>
     </div>
    </div>
   </div>

   {/* Selected File Preview */}
   {selectedFile && (
    <div className="bg-gray-50 rounded-lg p-4">
     <div className="flex items-center justify-between">
      <div className="flex items-center space-x-3">
       <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
        <Play className="w-5 h-5 text-blue-600" />
       </div>
       <div>
        <h4 className="font-medium text-gray-900">{selectedFile.name}</h4>
        <p className="text-sm text-gray-600">
         {formatFileSize(selectedFile.size)} • {estimateUploadTime(selectedFile.size)}
        </p>
       </div>
      </div>

      <button
       onClick={startUpload}
       className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
      >
       <Zap className="w-4 h-4" />
       <span>Start Upload</span>
      </button>
     </div>
    </div>
   )}

   {/* Active Uploads */}
   {uploads.size > 0 && (
    <div className="space-y-4">
     <h3 className="text-lg font-medium text-gray-900">Active Uploads</h3>

     {Array.from(uploads.values()).map((upload) => (
      <div key={upload.videoId} className="bg-white border border-gray-200 rounded-lg p-4">
       <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
         {getStateIcon(upload.state)}
         <div>
          <h4 className="font-medium text-gray-900">{upload.file.name}</h4>
          <p className="text-sm text-gray-600">{getStateText(upload.state)}</p>
         </div>
        </div>

        <div className="flex items-center space-x-2">
         {upload.state === 'uploading' && (
          <button
           onClick={() => resumeUpload(upload.videoId)}
           className="p-2 text-gray-600 hover:text-blue-600"
           title="Resume"
          >
           <Play className="w-4 h-4" />
          </button>
         )}

         <button
          onClick={() => cancelUpload(upload.videoId)}
          className="p-2 text-gray-600 hover:text-red-600"
          title="Cancel"
         >
          <X className="w-4 h-4" />
         </button>
        </div>
       </div>

       {/* Progress Bar */}
       {(upload.state === 'uploading' || upload.state === 'processing') && (
        <div className="space-y-2">
         <div className="flex justify-between text-sm text-gray-600">
          <span>
           {upload.state === 'uploading' ? 'Uploading' : 'Processing'}
          </span>
          <span>{upload.progress}%</span>
         </div>
         <div className="w-full bg-gray-200 rounded-full h-2">
          <div
           className="bg-blue-500 h-2 rounded-full transition-all duration-300"
           style={{ width: `${upload.progress}%` }}
          />
         </div>
         <div className="flex justify-between text-xs text-gray-500">
          <span>{formatFileSize(upload.bytesTransferred)} / {formatFileSize(upload.totalBytes)}</span>
          <span>Video ID: {upload.videoId}</span>
         </div>
        </div>
       )}

       {/* Error Message */}
       {upload.state === 'error' && upload.error && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
         <p className="text-sm text-red-600">{upload.error}</p>
        </div>
       )}

       {/* Success Message */}
       {upload.state === 'completed' && (
        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md">
         <p className="text-sm text-green-600">
          Video uploaded and transcoded successfully! Ready for playback.
         </p>
        </div>
       )}
      </div>
     ))}
    </div>
   )}

   {/* Features Overview */}
   <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
    <h4 className="font-medium text-blue-900 mb-2">🚀 Enterprise Video Pipeline</h4>
    <ul className="text-sm text-blue-800 space-y-1">
     <li>• Direct upload to Google Cloud Storage with resumable uploads</li>
     <li>• Automatic transcoding to HLS and multiple qualities (480p, 720p, 1080p)</li>
     <li>• Global delivery via Cloud CDN for fast playback</li>
     <li>• Secure signed URLs with 15-minute expiration</li>
     <li>• Cost optimization with automatic lifecycle management</li>
    </ul>
   </div>
  </div>
 )
}