/**
 * Google Cloud Storage Upload Service
 * Enterprise-grade video upload with resumable uploads, progress tracking, error recovery, and enhanced security
 */

import { secureStorage } from '@/lib/secure-storage'
import { auditLog } from '@/lib/audit-logger'

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
  private readonly PERSISTENCE_KEY = 'gcs_uploads_v2' // Versioned for security migration
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
   * Persist uploads to secure storage with encryption
   */
  private async persistUploads(): Promise<void> {
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
            },
            // Remove sensitive URLs from persistence
            uploadUrl: undefined,
            resumeUrl: undefined
          }
        ])

        // Use secure storage with TTL
        await secureStorage.setItem(this.PERSISTENCE_KEY, serializable, {
          ttl: 7 * 24 * 60 * 60 * 1000, // 7 days
          audit: false // Don't audit routine persistence
        })

        // Audit upload state changes for security
        await auditLog('gcs_upload_state_persisted', {
          uploadCount: this.uploads.size,
          timestamp: new Date().toISOString()
        }, { severity: 'low', source: 'gcs_upload' })
      }
    } catch (error) {
      console.warn('Failed to persist uploads securely:', error)
      await auditLog('gcs_upload_persist_failed', {
        error: (error as Error).message,
        uploadCount: this.uploads.size,
        timestamp: new Date().toISOString()
      }, { severity: 'medium' })
    }
  }

  /**
   * Load persisted uploads from secure storage
   */
  private async loadPersistedUploads(): Promise<void> {
    try {
      if (typeof window !== 'undefined') {
        // Try to load from secure storage first
        const stored = await secureStorage.getItem(this.PERSISTENCE_KEY, { audit: false })

        if (stored && Array.isArray(stored)) {
          console.log('📂 Found persisted uploads in secure storage:', stored.length)

          // Restore upload states (excluding File objects and sensitive URLs)
          for (const [id, state] of stored) {
            if (state && typeof state === 'object') {
              this.uploads.set(id, {
                ...state,
                // File objects need to be re-selected by user
                file: null as any,
                // Sensitive URLs are not persisted
                uploadUrl: undefined,
                resumeUrl: undefined
              })
            }
          }

          await auditLog('gcs_upload_state_restored', {
            uploadCount: stored.length,
            timestamp: new Date().toISOString()
          }, { severity: 'low', source: 'gcs_upload' })
        } else {
          // Fallback: check for legacy localStorage data and migrate
          const legacyStored = localStorage.getItem('gcs_uploads')
          if (legacyStored) {
            console.log('🔄 Migrating legacy upload data to secure storage')
            const parsed = JSON.parse(legacyStored)

            // Migrate to secure storage
            await this.persistUploads()

            // Clear legacy data
            localStorage.removeItem('gcs_uploads')

            await auditLog('gcs_upload_legacy_migration', {
              migratedCount: parsed.length,
              timestamp: new Date().toISOString()
            }, { severity: 'low', source: 'gcs_upload' })
          }
        }
      }
    } catch (error) {
      console.warn('Failed to load persisted uploads:', error)
      await auditLog('gcs_upload_load_failed', {
        error: (error as Error).message,
        timestamp: new Date().toISOString()
      }, { severity: 'medium' })
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