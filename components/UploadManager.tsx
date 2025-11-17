'use client'

import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import {
 Play,
 Pause,
 X,
 Upload,
 CheckCircle,
 AlertCircle,
 Clock,
 FileVideo,
 Trash2,
 RefreshCw
} from 'lucide-react'
import { uploadService, UploadState, formatFileSize, formatDuration } from '@/lib/upload-service'

interface UploadManagerProps {
 onUploadComplete?: (uploadId: string, downloadURL: string) => void
 className?: string
}

export default function UploadManager({ onUploadComplete, className = '' }: UploadManagerProps) {
 const searchParams = useSearchParams()
 const [uploads, setUploads] = useState<UploadState[]>([])
 const [isMinimized, setIsMinimized] = useState(false)

 // Detect embedded mode, but DON'T short-circuit hooks
 const isEmbedded = searchParams?.get('embedded') === 'true'

 useEffect(() => {
  // Load existing uploads
  setUploads(uploadService.getAllUploads())

  // Set up polling for upload updates
  const interval = setInterval(() => {
   setUploads(uploadService.getAllUploads())
  }, 1000)

  return () => clearInterval(interval)
 }, [])

 const handlePause = (uploadId: string) => {
  uploadService.pauseUpload(uploadId)
  setUploads(uploadService.getAllUploads())
 }

 const handleResume = (uploadId: string) => {
  uploadService.resumeUpload(uploadId)
  setUploads(uploadService.getAllUploads())
 }

 const handleCancel = (uploadId: string) => {
  uploadService.cancelUpload(uploadId)
  setUploads(uploadService.getAllUploads())
 }

 const handleClearCompleted = () => {
  uploadService.clearCompletedUploads()
  setUploads(uploadService.getAllUploads())
 }

 const getStatusIcon = (state: UploadState['state']) => {
  switch (state) {
   case 'running':
    return <Upload className="w-4 h-4 text-blue-500 animate-pulse" />
   case 'paused':
    return <Pause className="w-4 h-4 text-yellow-500" />
   case 'completed':
    return <CheckCircle className="w-4 h-4 text-green-500" />
   case 'error':
    return <AlertCircle className="w-4 h-4 text-red-500" />
   case 'cancelled':
    return <X className="w-4 h-4 text-gray-500" />
   default:
    return <Clock className="w-4 h-4 text-gray-400" />
  }
 }

 const getStatusColor = (state: UploadState['state']) => {
  switch (state) {
   case 'running':
    return 'bg-blue-500'
   case 'paused':
    return 'bg-yellow-500'
   case 'completed':
    return 'bg-green-500'
   case 'error':
    return 'bg-red-500'
   default:
    return 'bg-gray-300'
  }
 }

 const activeUploads = uploads.filter(u => u.state === 'running' || u.state === 'paused')
 const completedUploads = uploads.filter(u => u.state === 'completed')
 const failedUploads = uploads.filter(u => u.state === 'error')

 // Don't render UI in embedded iframes or when there are no uploads
 if (isEmbedded || uploads.length === 0) return null

 return (
  <div className={`fixed bottom-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg max-w-md w-full z-50 ${className}`}>
   {/* Header */}
   <div className="flex items-center justify-between p-3 border-b border-gray-200">
    <div className="flex items-center gap-2">
     <FileVideo className="w-5 h-5 text-cardinal" />
     <span className=" text-gray-900">Upload Manager</span>
     {activeUploads.length > 0 && (
      <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
       {activeUploads.length} active
      </span>
     )}
    </div>
    <div className="flex items-center gap-1">
     {completedUploads.length > 0 && (
      <button
       onClick={handleClearCompleted}
       className="p-1 hover:bg-gray-100 rounded"
       title="Clear completed"
      >
       <Trash2 className="w-4 h-4 text-gray-500" />
      </button>
     )}
     <button
      onClick={() => setIsMinimized(!isMinimized)}
      className="p-1 hover:bg-gray-100 rounded"
     >
      {isMinimized ? '▲' : '▼'}
     </button>
    </div>
   </div>

   {/* Upload List */}
   {!isMinimized && (
    <div className="max-h-96 overflow-y-auto">
     {uploads.map((upload) => (
      <div key={upload.id} className="p-3 border-b border-gray-100 last:border-b-0">
       <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
         <div className="flex items-center gap-2 mb-1">
          {getStatusIcon(upload.state)}
          <span className="text-sm  text-gray-900 truncate">
           {upload.file.name}
          </span>
         </div>

         <div className="text-xs text-gray-500 mb-2">
          {formatFileSize(upload.file.size)} • {upload.state}
          {upload.state === 'running' && upload.bytesTransferred > 0 && (
           <span>
            {' • '}{formatFileSize(upload.bytesTransferred)} / {formatFileSize(upload.totalBytes)}
           </span>
          )}
         </div>

         {/* Progress Bar */}
         <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
          <div
           className={`h-2 rounded-full transition-all duration-300 ${getStatusColor(upload.state)}`}
           style={{ width: `${upload.progress}%` }}
          />
         </div>

         <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{upload.progress}%</span>
          {upload.state === 'running' && (
           <span>
            ETA: {upload.bytesTransferred > 0 ?
             formatDuration((upload.totalBytes - upload.bytesTransferred) /
              (upload.bytesTransferred / ((Date.now() - upload.createdAt) / 1000))) :
             'Calculating...'}
           </span>
          )}
          {upload.state === 'error' && upload.error && (
           <span className="text-red-500 truncate">{upload.error}</span>
          )}
         </div>
        </div>

        {/* Controls */}
        <div className="flex gap-1">
         {upload.state === 'running' && (
          <button
           onClick={() => handlePause(upload.id)}
           className="p-1 hover:bg-gray-100 rounded"
           title="Pause"
          >
           <Pause className="w-4 h-4 text-yellow-600" />
          </button>
         )}

         {upload.state === 'paused' && (
          <button
           onClick={() => handleResume(upload.id)}
           className="p-1 hover:bg-gray-100 rounded"
           title="Resume"
          >
           <Play className="w-4 h-4 text-green-600" />
          </button>
         )}

         {(upload.state === 'error' || upload.state === 'paused') && (
          <button
           onClick={() => {
            // Restart upload logic would go here
            console.log('Restart upload:', upload.id)
           }}
           className="p-1 hover:bg-gray-100 rounded"
           title="Retry"
          >
           <RefreshCw className="w-4 h-4 text-blue-600" />
          </button>
         )}

         <button
          onClick={() => handleCancel(upload.id)}
          className="p-1 hover:bg-gray-100 rounded"
          title="Cancel"
         >
          <X className="w-4 h-4 text-red-600" />
         </button>
        </div>
       </div>

       {/* Success callback */}
       {upload.state === 'completed' && upload.downloadURL && onUploadComplete && (
        <div className="mt-2">
         <button
          onClick={() => onUploadComplete(upload.id, upload.downloadURL!)}
          className="w-full px-3 py-1 bg-green-100 text-green-700 text-xs rounded hover:bg-green-200 transition-colors"
         >
          Use in Lesson
         </button>
        </div>
       )}
      </div>
     ))}
    </div>
   )}

   {/* Summary when minimized */}
   {isMinimized && activeUploads.length > 0 && (
    <div className="p-2 text-center">
     <div className="text-sm text-gray-600">
      {activeUploads.length} upload{activeUploads.length !== 1 ? 's' : ''} in progress
     </div>
     <div className="mt-1 w-full bg-gray-200 rounded-full h-1">
      <div
       className="bg-blue-500 h-1 rounded-full transition-all duration-300"
       style={{
        width: `${activeUploads.reduce((acc, upload) => acc + upload.progress, 0) / activeUploads.length}%`
       }}
      />
     </div>
    </div>
   )}
  </div>
 )
}