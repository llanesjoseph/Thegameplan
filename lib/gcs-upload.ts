/**
 * Google Cloud Storage Upload Service
 * Enterprise-grade video upload with resumable uploads, progress tracking, and error recovery
 */

export interface GcsUploadOptions {
  file: File
  videoId: string
  onProgress?: (progress: number, bytesTransferred: number, totalBytes: number) => void
  onStateChange?: (state: 'pending' | 'uploading' | 'processing' | 'completed' | 'error') => void
  onError?: (error: Error) => void
  onSuccess?: (result: UploadResult) => void
}

export interface UploadResult {
  videoId: string
  uploadUrl: string
  size: number
  contentType: string
  transcodeJobId?: string
}

export interface GcsUploadState {
  videoId: string
  file: File
  progress: number
  state: 'pending' | 'uploading' | 'processing' | 'completed' | 'error'
  bytesTransferred: number
  totalBytes: number
  uploadUrl?: string
  resumeUrl?: string
  transcodeJobId?: string
  error?: string
  createdAt: number
  updatedAt: number
}

class GcsUploadService {
  private uploads: Map<string, GcsUploadState> = new Map()
  private readonly CHUNK_SIZE = 10 * 1024 * 1024 // 10MB chunks
  private readonly PERSISTENCE_KEY = 'gcs_uploads'
  private readonly API_BASE = '/api/video'

  constructor() {
    this.loadPersistedUploads()
    this.setupBeforeUnloadHandler()
  }

  /**
   * Initiate a new video upload to GCS
   */
  async startUpload(options: GcsUploadOptions): Promise<string> {
    const { file, videoId } = options

    console.log('🚀 Starting GCS upload:', {
      videoId,
      filename: file.name,
      size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      type: file.type
    })

    // Validate file
    if (!this.isValidVideoFile(file)) {
      throw new Error('Invalid video file type')
    }

    if (file.size > 10 * 1024 * 1024 * 1024) { // 10GB limit
      throw new Error('File size exceeds 10GB limit')
    }

    // Create upload state
    const uploadState: GcsUploadState = {
      videoId,
      file,
      progress: 0,
      state: 'pending',
      bytesTransferred: 0,
      totalBytes: file.size,
      createdAt: Date.now(),
      updatedAt: Date.now()
    }

    this.uploads.set(videoId, uploadState)
    this.persistUploads()

    try {
      // 1. Initialize upload with backend
      const initResponse = await this.initializeUpload(videoId, file)

      this.updateUploadState(videoId, {
        state: 'uploading',
        uploadUrl: initResponse.uploadUrl,
        resumeUrl: initResponse.resumeUrl
      })

      // 2. Start resumable upload to GCS
      await this.uploadToGcsResumable(videoId, initResponse.resumeUrl, options)

      // 3. Complete upload and start transcoding
      const completeResponse = await this.completeUpload(videoId)

      this.updateUploadState(videoId, {
        state: 'processing',
        transcodeJobId: completeResponse.transcodeJobId
      })

      options.onSuccess?.({
        videoId,
        uploadUrl: initResponse.uploadUrl,
        size: file.size,
        contentType: file.type,
        transcodeJobId: completeResponse.transcodeJobId
      })

      return videoId
    } catch (error) {
      console.error('GCS upload failed:', error)
      this.updateUploadState(videoId, {
        state: 'error',
        error: (error as Error).message
      })
      options.onError?.(error as Error)
      throw error
    }
  }

  /**
   * Resume a paused or failed upload
   */
  async resumeUpload(videoId: string, options: Partial<GcsUploadOptions> = {}): Promise<void> {
    const uploadState = this.uploads.get(videoId)
    if (!uploadState || !uploadState.resumeUrl) {
      throw new Error('Upload cannot be resumed')
    }

    console.log('🔄 Resuming GCS upload:', { videoId, progress: uploadState.progress })

    try {
      await this.uploadToGcsResumable(videoId, uploadState.resumeUrl, {
        file: uploadState.file,
        videoId,
        ...options
      })
    } catch (error) {
      console.error('Resume upload failed:', error)
      this.updateUploadState(videoId, {
        state: 'error',
        error: (error as Error).message
      })
      throw error
    }
  }

  /**
   * Cancel an ongoing upload
   */
  async cancelUpload(videoId: string): Promise<void> {
    console.log('❌ Cancelling upload:', videoId)

    // Remove from backend if needed
    try {
      await fetch(`${this.API_BASE}/${videoId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      })
    } catch (error) {
      console.warn('Failed to cancel on backend:', error)
    }

    this.uploads.delete(videoId)
    this.persistUploads()
  }

  /**
   * Get upload status
   */
  getUploadStatus(videoId: string): GcsUploadState | null {
    return this.uploads.get(videoId) || null
  }

  /**
   * Get all active uploads
   */
  getAllUploads(): GcsUploadState[] {
    return Array.from(this.uploads.values())
  }

  /**
   * Initialize upload with backend API
   */
  private async initializeUpload(videoId: string, file: File) {
    const response = await fetch(`${this.API_BASE}/upload/init`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        videoId,
        filename: file.name,
        size: file.size,
        contentType: file.type
      })
    })

    if (!response.ok) {
      throw new Error(`Failed to initialize upload: ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Upload file to GCS using resumable uploads
   */
  private async uploadToGcsResumable(
    videoId: string,
    resumeUrl: string,
    options: GcsUploadOptions
  ): Promise<void> {
    const { file, onProgress } = options
    let offset = 0

    // Check existing progress
    try {
      const probeResponse = await fetch(resumeUrl, {
        method: 'PUT',
        headers: { 'Content-Range': `bytes */${file.size}` }
      })

      if (probeResponse.status === 308) {
        const range = probeResponse.headers.get('Range')
        if (range) {
          const uploaded = parseInt(range.split('-')[1], 10) + 1
          offset = uploaded
          this.updateUploadState(videoId, {
            progress: Math.round((offset / file.size) * 100),
            bytesTransferred: offset
          })
        }
      }
    } catch (error) {
      console.warn('Failed to probe upload progress:', error)
    }

    // Upload in chunks
    while (offset < file.size) {
      const end = Math.min(offset + this.CHUNK_SIZE, file.size)
      const chunk = file.slice(offset, end)

      const response = await fetch(resumeUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type || 'application/octet-stream',
          'Content-Range': `bytes ${offset}-${end - 1}/${file.size}`
        },
        body: chunk
      })

      if (response.status === 308 || response.ok) {
        offset = end
        const progress = Math.round((offset / file.size) * 100)

        this.updateUploadState(videoId, {
          progress,
          bytesTransferred: offset
        })

        onProgress?.(progress, offset, file.size)
      } else {
        throw new Error(`Upload chunk failed: ${response.statusText}`)
      }
    }

    console.log('✅ GCS upload completed:', videoId)
  }

  /**
   * Complete upload and trigger transcoding
   */
  private async completeUpload(videoId: string) {
    const response = await fetch(`${this.API_BASE}/upload/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ videoId })
    })

    if (!response.ok) {
      throw new Error(`Failed to complete upload: ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Validate video file type
   */
  private isValidVideoFile(file: File): boolean {
    const validTypes = [
      'video/mp4',
      'video/webm',
      'video/mov',
      'video/avi',
      'video/mkv',
      'video/quicktime'
    ]
    return validTypes.includes(file.type)
  }

  /**
   * Update upload state and persist
   */
  private updateUploadState(videoId: string, updates: Partial<GcsUploadState>): void {
    const current = this.uploads.get(videoId)
    if (!current) return

    const updated = {
      ...current,
      ...updates,
      updatedAt: Date.now()
    }

    this.uploads.set(videoId, updated)
    this.persistUploads()
  }

  /**
   * Persist uploads to localStorage
   */
  private persistUploads(): void {
    try {
      if (typeof window !== 'undefined') {
        const serializable = Array.from(this.uploads.entries()).map(([id, state]) => [
          id,
          {
            ...state,
            file: {
              name: state.file.name,
              size: state.file.size,
              type: state.file.type,
              lastModified: state.file.lastModified
            }
          }
        ])
        localStorage.setItem(this.PERSISTENCE_KEY, JSON.stringify(serializable))
      }
    } catch (error) {
      console.warn('Failed to persist uploads:', error)
    }
  }

  /**
   * Load persisted uploads from localStorage
   */
  private loadPersistedUploads(): void {
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(this.PERSISTENCE_KEY)
        if (stored) {
          const parsed = JSON.parse(stored)
          // Note: File objects cannot be fully restored, would need re-selection
          console.log('📂 Found persisted uploads:', parsed.length)
        }
      }
    } catch (error) {
      console.warn('Failed to load persisted uploads:', error)
    }
  }

  /**
   * Setup beforeunload handler to warn about active uploads
   */
  private setupBeforeUnloadHandler(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', (event) => {
        const activeUploads = this.getAllUploads().filter(
          upload => upload.state === 'uploading' || upload.state === 'processing'
        )

        if (activeUploads.length > 0) {
          event.preventDefault()
          event.returnValue = 'You have active uploads. Are you sure you want to leave?'
          return event.returnValue
        }
      })
    }
  }
}

// Export singleton instance
export const gcsUploadService = new GcsUploadService()

// Export utility functions
export const formatFileSize = (bytes: number): string => {
  const units = ['B', 'KB', 'MB', 'GB']
  let size = bytes
  let unitIndex = 0

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`
}

export const estimateUploadTime = (fileSizeBytes: number): string => {
  // Estimate based on average upload speed of 10 Mbps
  const avgSpeedBytesPerSecond = (10 * 1024 * 1024) / 8 // 10 Mbps to bytes/sec
  const estimatedSeconds = fileSizeBytes / avgSpeedBytesPerSecond

  if (estimatedSeconds < 60) return `~${Math.round(estimatedSeconds)}s`
  if (estimatedSeconds < 3600) return `~${Math.round(estimatedSeconds / 60)}m`
  return `~${Math.round(estimatedSeconds / 3600)}h ${Math.round((estimatedSeconds % 3600) / 60)}m`
}