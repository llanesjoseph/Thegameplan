/**
 * Client-Side Video Compression Service
 * Compresses videos directly in the browser using Web APIs
 */

export interface CompressionOptions {
  maxSizeInMB?: number
  quality?: number
  maxWidth?: number
  maxHeight?: number
  frameRate?: number
  onProgress?: (progress: number) => void
}

export interface CompressionResult {
  compressedFile: File
  originalSize: number
  compressedSize: number
  compressionRatio: number
  timeTaken: number
}

class VideoCompressionService {
  private canvas: HTMLCanvasElement | null = null
  private ctx: CanvasRenderingContext2D | null = null

  /**
   * Compress a video file using browser APIs
   */
  async compressVideo(
    file: File,
    options: CompressionOptions = {}
  ): Promise<CompressionResult> {
    const startTime = Date.now()
    const {
      quality = 0.7,
      maxWidth = 1920,
      maxHeight = 1080,
      frameRate = 30,
      onProgress
    } = options

    console.log('🗜️ Starting video compression:', {
      originalSize: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      fileName: file.name,
      options
    })

    onProgress?.(0)

    try {
      // Create video element
      const video = document.createElement('video')
      video.muted = true
      video.playsInline = true

      // Load video
      const videoUrl = URL.createObjectURL(file)
      video.src = videoUrl

      await new Promise((resolve, reject) => {
        video.onloadedmetadata = resolve
        video.onerror = reject
      })

      onProgress?.(10)

      // Get video dimensions and duration
      const { videoWidth, videoHeight, duration } = video
      console.log('📹 Video metadata:', {
        dimensions: `${videoWidth}x${videoHeight}`,
        duration: `${duration.toFixed(1)}s`,
        frameRate
      })

      // Calculate optimal dimensions
      const { width, height } = this.calculateOptimalDimensions(
        videoWidth,
        videoHeight,
        maxWidth,
        maxHeight
      )

      onProgress?.(20)

      // Setup canvas
      this.setupCanvas(width, height)

      // Create MediaRecorder for compression
      const stream = this.canvas!.captureStream(frameRate)
      const chunks: Blob[] = []

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9',
        videoBitsPerSecond: this.calculateBitrate(width, height, frameRate)
      })

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data)
        }
      }

      onProgress?.(30)

      // Start recording
      mediaRecorder.start()

      // Process video frames
      await this.processVideoFrames(video, duration, frameRate, onProgress)

      // Stop recording
      mediaRecorder.stop()

      onProgress?.(90)

      // Wait for recording to finish
      const compressedBlob = await new Promise<Blob>((resolve) => {
        mediaRecorder.onstop = () => {
          resolve(new Blob(chunks, { type: 'video/webm' }))
        }
      })

      // Create compressed file
      const compressedFile = new File(
        [compressedBlob],
        file.name.replace(/\.[^/.]+$/, '_compressed.webm'),
        { type: 'video/webm' }
      )

      // Cleanup
      URL.revokeObjectURL(videoUrl)
      video.remove()

      const timeTaken = Date.now() - startTime
      const compressionRatio = ((file.size - compressedFile.size) / file.size) * 100

      onProgress?.(100)

      console.log('✅ Compression completed:', {
        originalSize: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        compressedSize: `${(compressedFile.size / (1024 * 1024)).toFixed(1)} MB`,
        reduction: `${compressionRatio.toFixed(1)}%`,
        timeTaken: `${(timeTaken / 1000).toFixed(1)}s`
      })

      return {
        compressedFile,
        originalSize: file.size,
        compressedSize: compressedFile.size,
        compressionRatio,
        timeTaken
      }
    } catch (error) {
      console.error('❌ Compression failed:', error)
      throw new Error(`Video compression failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Process video frames for compression
   */
  private async processVideoFrames(
    video: HTMLVideoElement,
    duration: number,
    frameRate: number,
    onProgress?: (progress: number) => void
  ): Promise<void> {
    const totalFrames = Math.floor(duration * frameRate)
    const frameInterval = 1 / frameRate

    for (let i = 0; i < totalFrames; i++) {
      const currentTime = i * frameInterval
      video.currentTime = currentTime

      // Wait for frame to load
      await new Promise((resolve) => {
        video.onseeked = resolve
      })

      // Draw frame to canvas
      this.ctx!.drawImage(video, 0, 0, this.canvas!.width, this.canvas!.height)

      // Update progress (30% to 85% for frame processing)
      const frameProgress = 30 + ((i / totalFrames) * 55)
      onProgress?.(frameProgress)

      // Small delay to prevent blocking
      if (i % 10 === 0) {
        await new Promise(resolve => setTimeout(resolve, 1))
      }
    }
  }

  /**
   * Calculate optimal dimensions maintaining aspect ratio
   */
  private calculateOptimalDimensions(
    originalWidth: number,
    originalHeight: number,
    maxWidth: number,
    maxHeight: number
  ): { width: number; height: number } {
    const aspectRatio = originalWidth / originalHeight

    let width = originalWidth
    let height = originalHeight

    // Scale down if too large
    if (width > maxWidth) {
      width = maxWidth
      height = width / aspectRatio
    }

    if (height > maxHeight) {
      height = maxHeight
      width = height * aspectRatio
    }

    // Ensure even dimensions for better compression
    width = Math.floor(width / 2) * 2
    height = Math.floor(height / 2) * 2

    return { width, height }
  }

  /**
   * Calculate optimal bitrate based on resolution and frame rate
   */
  private calculateBitrate(width: number, height: number, frameRate: number): number {
    const pixelsPerSecond = width * height * frameRate

    // Base bitrate calculation (bits per pixel)
    let bitsPerPixel: number

    if (pixelsPerSecond <= 1920 * 1080 * 30) {
      bitsPerPixel = 0.1 // HD content
    } else if (pixelsPerSecond <= 2560 * 1440 * 30) {
      bitsPerPixel = 0.075 // QHD content
    } else {
      bitsPerPixel = 0.05 // 4K+ content
    }

    const bitrate = pixelsPerSecond * bitsPerPixel

    // Clamp between 500kbps and 10Mbps
    return Math.max(500000, Math.min(10000000, bitrate))
  }

  /**
   * Setup canvas for video processing
   */
  private setupCanvas(width: number, height: number): void {
    this.canvas = document.createElement('canvas')
    this.canvas.width = width
    this.canvas.height = height
    this.ctx = this.canvas.getContext('2d')!

    // Optimize canvas for video processing
    this.ctx.imageSmoothingEnabled = true
    this.ctx.imageSmoothingQuality = 'high'
  }

  /**
   * Check if video compression is supported
   */
  static isSupported(): boolean {
    return (
      typeof MediaRecorder !== 'undefined' &&
      typeof HTMLCanvasElement !== 'undefined' &&
      MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
    )
  }

  /**
   * Get estimated compression time
   */
  static estimateCompressionTime(fileSizeInMB: number): string {
    // Rough estimate: 1MB takes ~2-5 seconds depending on device
    const estimatedSeconds = fileSizeInMB * 3

    if (estimatedSeconds < 60) {
      return `~${Math.round(estimatedSeconds)} seconds`
    } else if (estimatedSeconds < 3600) {
      return `~${Math.round(estimatedSeconds / 60)} minutes`
    } else {
      return `~${Math.round(estimatedSeconds / 3600)} hours`
    }
  }

  /**
   * Get compression presets
   */
  static getPresets() {
    return {
      fast: {
        quality: 0.6,
        maxWidth: 1280,
        maxHeight: 720,
        frameRate: 24
      },
      balanced: {
        quality: 0.7,
        maxWidth: 1920,
        maxHeight: 1080,
        frameRate: 30
      },
      quality: {
        quality: 0.8,
        maxWidth: 1920,
        maxHeight: 1080,
        frameRate: 30
      }
    }
  }
}

// Export class and singleton instance
export { VideoCompressionService }
export const videoCompressionService = new VideoCompressionService()

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

export const formatTime = (seconds: number): string => {
  if (seconds < 60) return `${Math.round(seconds)}s`
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`
  return `${Math.round(seconds / 3600)}h ${Math.round((seconds % 3600) / 60)}m`
}