'use client'

import React, { useState, useRef } from 'react'
import { Camera, Upload, X, CheckCircle, AlertCircle } from 'lucide-react'
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage'
import { storage } from '@/lib/firebase.client'
import { useAuth } from '@/hooks/use-auth'

interface ImageUploaderProps {
 onUploadComplete?: (url: string) => void
 onUploadError?: (error: string) => void
 className?: string
 currentImageUrl?: string
 uploadPath?: string // Custom upload path, defaults to users/{userId}/profile/
}

export default function ImageUploader({
 onUploadComplete,
 onUploadError,
 className = '',
 currentImageUrl,
 uploadPath
}: ImageUploaderProps) {
 const { user } = useAuth()
 const fileInputRef = useRef<HTMLInputElement>(null)
 const [uploading, setUploading] = useState(false)
 const [uploadProgress, setUploadProgress] = useState(0)
 const [error, setError] = useState<string | null>(null)
 const [success, setSuccess] = useState(false)

 const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0]
  if (file) {
   handleUpload(file)
  }
 }

 const handleUpload = async (file: File) => {
  if (!user?.uid) {
   setError('You must be logged in to upload images')
   onUploadError?.('User not authenticated')
   return
  }

  // Validate file type
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
  if (!validTypes.includes(file.type)) {
   setError('Please select a valid image file (JPEG, PNG, GIF, or WebP)')
   onUploadError?.('Invalid file type')
   return
  }

  // Validate file size (10MB limit as per storage rules)
  const maxSize = 10 * 1024 * 1024 // 10MB
  if (file.size > maxSize) {
   setError('Image size must be less than 10MB')
   onUploadError?.('File too large')
   return
  }

  setUploading(true)
  setError(null)
  setSuccess(false)
  setUploadProgress(0)

  try {
   // Create storage path
   const storagePath = uploadPath || `users/${user.uid}/profile/avatar_${Date.now()}.${file.name.split('.').pop()}`
   const storageRef = ref(storage, storagePath)

   // Upload file with progress tracking
   const uploadTask = uploadBytesResumable(storageRef, file)

   uploadTask.on('state_changed',
    (snapshot) => {
     // Progress tracking
     const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
     setUploadProgress(Math.round(progress))
    },
    (error) => {
     // Handle upload error
     console.error('Upload error:', error)
     let errorMessage = 'Failed to upload image'

     if (error.code === 'storage/unauthorized') {
      errorMessage = 'You do not have permission to upload to this location'
     } else if (error.code === 'storage/canceled') {
      errorMessage = 'Upload was cancelled'
     } else if (error.code === 'storage/quota-exceeded') {
      errorMessage = 'Storage quota exceeded'
     }

     setError(errorMessage)
     setUploading(false)
     onUploadError?.(errorMessage)
    },
    async () => {
     // Upload completed successfully
     try {
      const downloadURL = await getDownloadURL(uploadTask.snapshot.ref)
      console.log('Image uploaded successfully:', downloadURL)

      setSuccess(true)
      setUploading(false)
      onUploadComplete?.(downloadURL)

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000)
     } catch (error) {
      console.error('Error getting download URL:', error)
      setError('Failed to get image URL')
      setUploading(false)
      onUploadError?.('Failed to get download URL')
     }
    }
   )
  } catch (error) {
   console.error('Upload initialization error:', error)
   setError('Failed to start upload')
   setUploading(false)
   onUploadError?.('Upload initialization failed')
  }
 }

 const handleButtonClick = () => {
  fileInputRef.current?.click()
 }

 const clearError = () => {
  setError(null)
 }

 return (
  <div className={`relative ${className}`}>
   {/* Hidden file input */}
   <input
    ref={fileInputRef}
    type="file"
    accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
    onChange={handleFileSelect}
    className="hidden"
    disabled={uploading}
   />

   {/* Upload button */}
   <button
    type="button"
    onClick={handleButtonClick}
    disabled={uploading}
    className="absolute -bottom-2 -right-2 w-10 h-10 bg-gradient-to-r from-orange to-orange/90 rounded-xl flex items-center justify-center text-white hover:scale-105 transition-all shadow-lg disabled:opacity-50 disabled:hover:scale-100"
    title={uploading ? 'Uploading...' : 'Upload profile picture'}
   >
    {uploading ? (
     <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
    ) : (
     <Camera className="w-5 h-5" />
    )}
   </button>

   {/* Progress indicator */}
   {uploading && (
    <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 w-48 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg border border-white/50">
     <div className="flex items-center gap-2 mb-2">
      <Upload className="w-4 h-4 text-orange" />
      <span className="text-sm  text-black">Uploading...</span>
      <span className="text-sm text-black/70">{uploadProgress}%</span>
     </div>
     <div className="w-full bg-gray-200 rounded-full h-2">
      <div
       className="bg-gradient-to-r from-orange to-orange/90 h-2 rounded-full transition-all duration-300"
       style={{ width: `${uploadProgress}%` }}
      />
     </div>
    </div>
   )}

   {/* Success indicator */}
   {success && (
    <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 bg-green/20 text-green px-3 py-2 rounded-lg text-sm  flex items-center gap-2 shadow-lg border border-green/30">
     <CheckCircle className="w-4 h-4" />
     Upload complete!
    </div>
   )}

   {/* Error indicator */}
   {error && (
    <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 w-64 bg-red-50 text-red-800 p-3 rounded-lg text-sm shadow-lg border border-red-200">
     <div className="flex items-start gap-2">
      <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
      <div className="flex-1">
       <p className="">Upload failed</p>
       <p className="text-xs mt-1">{error}</p>
      </div>
      <button
       onClick={clearError}
       className="text-red-500 hover:text-red-700"
      >
       <X className="w-4 h-4" />
      </button>
     </div>
    </div>
   )}
  </div>
 )
}