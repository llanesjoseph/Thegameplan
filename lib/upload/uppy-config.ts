import Uppy from '@uppy/core';
import Tus from '@uppy/tus';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase.client';

export interface UppyConfig {
  restrictions?: {
    maxFileSize?: number;
    allowedFileTypes?: string[];
    maxNumberOfFiles?: number;
  };
  onProgress?: (progress: number) => void;
  onComplete?: (result: any) => void;
  onError?: (error: any) => void;
}

/**
 * Create an Uppy instance configured for video uploads to Firebase Storage
 */
export function createUppyInstance(config: UppyConfig = {}) {
  const uppy = new Uppy({
    id: 'video-upload',
    autoProceed: false,
    allowMultipleUploadBatches: false,
    restrictions: {
      maxFileSize: config.restrictions?.maxFileSize || 500 * 1024 * 1024, // 500MB default
      allowedFileTypes: config.restrictions?.allowedFileTypes || ['.mp4', '.mov', '.avi', '.webm'],
      maxNumberOfFiles: config.restrictions?.maxNumberOfFiles || 1,
    },
    meta: {
      uploadedAt: new Date().toISOString(),
    },
  });

  // Add Tus plugin for resumable uploads
  uppy.use(Tus, {
    endpoint: 'https://tusd.tusdemo.net/files/', // We'll use Firebase Storage directly
    chunkSize: 5 * 1024 * 1024, // 5MB chunks
    retryDelays: [0, 1000, 3000, 5000, 10000], // Exponential backoff
    withCredentials: false,
    removeFingerprintOnSuccess: true,
    storeFingerprintForResuming: true, // Enable resume capability
  });

  // Handle upload progress
  uppy.on('upload-progress', (file, progress) => {
    if (progress.bytesTotal && progress.bytesTotal > 0) {
      const percentage = Math.round((progress.bytesUploaded / progress.bytesTotal) * 100);
      if (config.onProgress) {
        config.onProgress(percentage);
      }
    }
  });

  // Handle successful upload
  uppy.on('complete', (result) => {
    if (config.onComplete) {
      config.onComplete(result);
    }
  });

  // Handle errors
  uppy.on('error', (error) => {
    console.error('Upload error:', error);
    if (config.onError) {
      config.onError(error);
    }
  });

  return uppy;
}

/**
 * Upload a file directly to Firebase Storage with resumable upload
 * This is an alternative to Uppy for simpler use cases
 */
export function uploadToFirebaseStorage(
  file: File,
  storagePath: string,
  onProgress?: (progress: number) => void,
  onComplete?: (downloadUrl: string) => void,
  onError?: (error: Error) => void
) {
  const storageRef = ref(storage, storagePath);
  const uploadTask = uploadBytesResumable(storageRef, file);

  uploadTask.on(
    'state_changed',
    (snapshot) => {
      const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
      if (onProgress) {
        onProgress(Math.round(progress));
      }
    },
    (error) => {
      console.error('Upload error:', error);
      if (onError) {
        onError(error);
      }
    },
    async () => {
      try {
        const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
        if (onComplete) {
          onComplete(downloadUrl);
        }
      } catch (error) {
        console.error('Error getting download URL:', error);
        if (onError) {
          onError(error as Error);
        }
      }
    }
  );

  return uploadTask;
}

/**
 * Generate storage path for video submission
 */
export function generateVideoStoragePath(
  teamId: string,
  submissionId: string,
  fileName: string
): string {
  // Enhanced sanitization: remove path traversal, limit to filename only
  const baseName = fileName.split('/').pop() || 'video'; // Take only filename, no paths
  const sanitizedFileName = baseName
    .replace(/\.\./g, '') // Remove .. sequences
    .replace(/[^a-zA-Z0-9._-]/g, '_') // Replace invalid chars
    .slice(0, 255); // Limit length

  // Validate sanitized result
  if (!sanitizedFileName || sanitizedFileName === '_') {
    throw new Error('Invalid file name');
  }

  const timestamp = Date.now();
  return `videos/submissions/${teamId}/${submissionId}/${timestamp}_${sanitizedFileName}`;
}

/**
 * Validate video file before upload
 */
export function validateVideoFile(file: File): { valid: boolean; error?: string } {
  const maxSize = 500 * 1024 * 1024; // 500MB
  const allowedTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm'];

  if (!file) {
    return { valid: false, error: 'No file selected' };
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size exceeds ${maxSize / (1024 * 1024)}MB limit`,
    };
  }

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Invalid file type. Please upload MP4, MOV, AVI, or WebM',
    };
  }

  return { valid: true };
}

/**
 * Get video metadata from file
 */
export async function getVideoMetadata(file: File): Promise<{
  duration: number;
  width: number;
  height: number;
  thumbnail?: string;
}> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';

    video.onloadedmetadata = () => {
      // CRITICAL: Enforce maximum duration (10 minutes = 600 seconds)
      const MAX_DURATION = 600;
      if (video.duration > MAX_DURATION) {
        reject(new Error(`Video too long. Maximum duration is ${MAX_DURATION / 60} minutes.`));
        URL.revokeObjectURL(video.src);
        return;
      }

      // Get thumbnail from first frame
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        video.currentTime = 0;
        video.onseeked = () => {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const thumbnail = canvas.toDataURL('image/jpeg', 0.7);

          resolve({
            duration: video.duration,
            width: video.videoWidth,
            height: video.videoHeight,
            thumbnail,
          });

          // Clean up
          URL.revokeObjectURL(video.src);
        };
      } else {
        resolve({
          duration: video.duration,
          width: video.videoWidth,
          height: video.videoHeight,
        });
        URL.revokeObjectURL(video.src);
      }
    };

    video.onerror = () => {
      reject(new Error('Failed to load video metadata'));
      URL.revokeObjectURL(video.src);
    };

    video.src = URL.createObjectURL(file);
  });
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}