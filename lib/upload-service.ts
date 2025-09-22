/**
 * Enterprise Upload Service for Large Video Files
 * Handles chunked uploads, retry logic, and background processing
 */

import { ref, uploadBytesResumable, getDownloadURL, UploadTask } from 'firebase/storage'
import { storage } from '@/lib/firebase.client'

export interface UploadOptions {
  file: File
  path: string
  onProgress?: (progress: number, bytesTransferred: number, totalBytes: number) => void
  onStateChange?: (state: 'running' | 'paused' | 'success' | 'error') => void
  onError?: (error: Error) => void
  onSuccess?: (downloadURL: string) => void
  maxRetries?: number
}

export interface UploadState {
  id: string
  file: File
  progress: number
  state: 'pending' | 'running' | 'paused' | 'completed' | 'error' | 'cancelled'
  bytesTransferred: number
  totalBytes: number
  downloadURL?: string
  error?: string
  retries: number
  createdAt: number
  updatedAt: number
}

class EnterpriseUploadService {
  private uploads: Map<string, UploadState> = new Map()
  private tasks: Map<string, UploadTask> = new Map()
  private readonly MAX_RETRIES = 3
  private readonly PERSISTENCE_KEY = 'gameplan_uploads'

  constructor() {
    this.loadPersistedUploads()
    this.setupBeforeUnloadHandler()
  }

  /**
   * Start a new upload with enterprise features
   */
  async startUpload(options: UploadOptions): Promise<string> {
    const uploadId = this.generateUploadId()
    const { file, path, maxRetries = this.MAX_RETRIES } = options

    console.log('🚀 Starting enterprise upload:', {
      id: uploadId,
      filename: file.name,
      size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      estimatedTime: this.estimateUploadTime(file.size),
      path
    })

    // Create upload state
    const uploadState: UploadState = {
      id: uploadId,
      file,
      progress: 0,
      state: 'pending',
      bytesTransferred: 0,
      totalBytes: file.size,
      retries: 0,
      createdAt: Date.now(),
      updatedAt: Date.now()
    }

    this.uploads.set(uploadId, uploadState)
    this.persistUploads()

    try {
      await this.executeUpload(uploadId, options)
      return uploadId
    } catch (error) {
      console.error('Upload failed:', error)
      this.updateUploadState(uploadId, { state: 'error', error: (error as Error).message })
      throw error
    }
  }

  /**
   * Execute the actual upload with retry logic
   */
  private async executeUpload(uploadId: string, options: UploadOptions): Promise<void> {
    const uploadState = this.uploads.get(uploadId)
    if (!uploadState) throw new Error('Upload not found')

    const { file, path, onProgress, onStateChange, onError, onSuccess } = options

    return new Promise((resolve, reject) => {
      // Create Firebase upload task with resumable uploads
      const storageRef = ref(storage, path)
      const uploadTask = uploadBytesResumable(storageRef, file)

      this.tasks.set(uploadId, uploadTask)
      this.updateUploadState(uploadId, { state: 'running' })
      onStateChange?.('running')

      uploadTask.on('state_changed',
        // Progress callback
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
          const bytesTransferred = snapshot.bytesTransferred
          const totalBytes = snapshot.totalBytes

          this.updateUploadState(uploadId, {
            progress: Math.round(progress),
            bytesTransferred,
            totalBytes,
            updatedAt: Date.now()
          })

          onProgress?.(progress, bytesTransferred, totalBytes)

          // Log progress for large files
          if (file.size > 100 * 1024 * 1024) {
            const mbTransferred = (bytesTransferred / (1024 * 1024)).toFixed(1)
            const mbTotal = (totalBytes / (1024 * 1024)).toFixed(1)
            const eta = this.calculateETA(bytesTransferred, totalBytes, uploadState.createdAt)

            console.log(`📹 Upload progress [${uploadId}]: ${mbTransferred}MB / ${mbTotal}MB (${Math.round(progress)}%) - ETA: ${eta}`)
          }
        },
        // Error callback
        async (error) => {
          console.error(`Upload error [${uploadId}]:`, error)

          const currentState = this.uploads.get(uploadId)
          if (!currentState) return reject(error)

          // Implement retry logic
          if (currentState.retries < options.maxRetries!) {
            const retryDelay = Math.pow(2, currentState.retries) * 1000 // Exponential backoff
            console.log(`🔄 Retrying upload [${uploadId}] in ${retryDelay}ms (attempt ${currentState.retries + 1}/${options.maxRetries})`)

            this.updateUploadState(uploadId, {
              retries: currentState.retries + 1,
              state: 'pending'
            })

            setTimeout(() => {
              this.executeUpload(uploadId, options).then(resolve).catch(reject)
            }, retryDelay)
          } else {
            this.updateUploadState(uploadId, { state: 'error', error: error.message })
            onStateChange?.('error')
            onError?.(error)
            reject(error)
          }
        },
        // Success callback
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref)

            console.log(`✅ Upload completed [${uploadId}]:`, downloadURL)

            this.updateUploadState(uploadId, {
              state: 'completed',
              downloadURL,
              progress: 100,
              updatedAt: Date.now()
            })

            onStateChange?.('success')
            onSuccess?.(downloadURL)
            resolve()
          } catch (error) {
            reject(error)
          }
        }
      )
    })
  }

  /**
   * Pause an upload
   */
  pauseUpload(uploadId: string): boolean {
    const task = this.tasks.get(uploadId)
    if (task) {
      task.pause()
      this.updateUploadState(uploadId, { state: 'paused' })
      console.log(`⏸️ Upload paused [${uploadId}]`)
      return true
    }
    return false
  }

  /**
   * Resume an upload
   */
  resumeUpload(uploadId: string): boolean {
    const task = this.tasks.get(uploadId)
    if (task) {
      task.resume()
      this.updateUploadState(uploadId, { state: 'running' })
      console.log(`▶️ Upload resumed [${uploadId}]`)
      return true
    }
    return false
  }

  /**
   * Cancel an upload
   */
  cancelUpload(uploadId: string): boolean {
    const task = this.tasks.get(uploadId)
    if (task) {
      task.cancel()
      this.updateUploadState(uploadId, { state: 'cancelled' })
      this.tasks.delete(uploadId)
      console.log(`❌ Upload cancelled [${uploadId}]`)
      return true
    }
    return false
  }

  /**
   * Get upload state
   */
  getUploadState(uploadId: string): UploadState | undefined {
    return this.uploads.get(uploadId)
  }

  /**
   * Get all uploads
   */
  getAllUploads(): UploadState[] {
    return Array.from(this.uploads.values())
  }

  /**
   * Get active uploads
   */
  getActiveUploads(): UploadState[] {
    return Array.from(this.uploads.values()).filter(
      upload => upload.state === 'running' || upload.state === 'paused'
    )
  }

  /**
   * Clear completed uploads
   */
  clearCompletedUploads(): void {
    for (const [id, upload] of this.uploads.entries()) {
      if (upload.state === 'completed' || upload.state === 'cancelled') {
        this.uploads.delete(id)
        this.tasks.delete(id)
      }
    }
    this.persistUploads()
  }

  /**
   * Estimate upload time based on file size
   */
  private estimateUploadTime(fileSize: number): string {
    // Assume average upload speed of 5 Mbps
    const avgSpeedMbps = 5
    const avgSpeedBytesPerSec = (avgSpeedMbps * 1024 * 1024) / 8
    const estimatedSeconds = fileSize / avgSpeedBytesPerSec

    if (estimatedSeconds < 60) {
      return `~${Math.round(estimatedSeconds)} seconds`
    } else if (estimatedSeconds < 3600) {
      return `~${Math.round(estimatedSeconds / 60)} minutes`
    } else {
      return `~${Math.round(estimatedSeconds / 3600)} hours`
    }
  }

  /**
   * Calculate ETA for upload
   */
  private calculateETA(bytesTransferred: number, totalBytes: number, startTime: number): string {
    if (bytesTransferred === 0) return 'Calculating...'

    const elapsedTime = Date.now() - startTime
    const uploadSpeed = bytesTransferred / (elapsedTime / 1000) // bytes per second
    const remainingBytes = totalBytes - bytesTransferred
    const etaSeconds = remainingBytes / uploadSpeed

    if (etaSeconds < 60) {
      return `${Math.round(etaSeconds)}s`
    } else if (etaSeconds < 3600) {
      return `${Math.round(etaSeconds / 60)}m`
    } else {
      return `${Math.round(etaSeconds / 3600)}h ${Math.round((etaSeconds % 3600) / 60)}m`
    }
  }

  /**
   * Generate unique upload ID
   */
  private generateUploadId(): string {
    return `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Update upload state
   */
  private updateUploadState(uploadId: string, updates: Partial<UploadState>): void {
    const current = this.uploads.get(uploadId)
    if (current) {
      this.uploads.set(uploadId, { ...current, ...updates })
      this.persistUploads()
    }
  }

  /**
   * Persist uploads to localStorage for recovery
   */
  private persistUploads(): void {
    try {
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
    } catch (error) {
      console.warn('Failed to persist uploads:', error)
    }
  }

  /**
   * Load persisted uploads
   */
  private loadPersistedUploads(): void {
    try {
      const stored = localStorage.getItem(this.PERSISTENCE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        // Only restore metadata, actual upload tasks need to be restarted
        for (const [id, state] of parsed) {
          if (state.state === 'running') {
            state.state = 'paused' // Mark as paused for manual restart
          }
          this.uploads.set(id, state)
        }
        console.log(`📁 Restored ${parsed.length} upload states from storage`)
      }
    } catch (error) {
      console.warn('Failed to load persisted uploads:', error)
    }
  }

  /**
   * Setup handler to persist uploads before page unload
   */
  private setupBeforeUnloadHandler(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.persistUploads()
      })
    }
  }
}

// Export singleton instance
export const uploadService = new EnterpriseUploadService()

// Export utility functions
export const formatFileSize = (bytes: number): string => {
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let size = bytes
  let unitIndex = 0

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`
}

export const formatDuration = (seconds: number): string => {
  if (seconds < 60) return `${Math.round(seconds)}s`
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`
  return `${Math.round(seconds / 3600)}h ${Math.round((seconds % 3600) / 60)}m`
}