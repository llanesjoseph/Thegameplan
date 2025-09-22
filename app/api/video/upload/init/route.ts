/**
 * Initialize GCS resumable upload
 * Creates a signed URL for direct browser upload to GCS
 */

import { NextRequest, NextResponse } from 'next/server'
import { Storage } from '@google-cloud/storage'
import { auth } from '@/lib/firebase.client'
import { db } from '@/lib/firebase.client'
import { doc, setDoc } from 'firebase/firestore'

const storage = new Storage({
  projectId: process.env.NEXT_PUBLIC_GCP_PROJECT_ID
})

const UPLOAD_BUCKET = process.env.NEXT_PUBLIC_GCS_UPLOAD_BUCKET || 'gameplan-uploads'

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { videoId, filename, size, contentType } = await request.json()

    // Validate input
    if (!videoId || !filename || !size || !contentType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Validate video file type
    if (!contentType.startsWith('video/')) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 })
    }

    // Validate file size (10GB limit)
    if (size > 10 * 1024 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size exceeds 10GB limit' }, { status: 400 })
    }

    console.log('🚀 Initializing GCS upload:', {
      videoId,
      filename,
      size: `${(size / (1024 * 1024)).toFixed(1)} MB`,
      contentType
    })

    // Create file path
    const fileName = `raw/${videoId}/${filename}`
    const file = storage.bucket(UPLOAD_BUCKET).file(fileName)

    // Generate resumable upload URL
    const [url] = await file.createResumableUpload({
      metadata: {
        contentType,
        metadata: {
          videoId,
          originalName: filename,
          uploadedAt: new Date().toISOString()
        }
      }
    })

    // Create video metadata document
    const videoDoc = {
      id: videoId,
      filename,
      size,
      contentType,
      uploadPath: fileName,
      uploadUrl: url,
      status: 'uploading',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    // Store in Firestore (you can switch to your preferred database)
    await setDoc(doc(db, 'videos', videoId), videoDoc)

    console.log('✅ GCS upload initialized:', {
      videoId,
      uploadPath: fileName,
      hasUploadUrl: !!url
    })

    return NextResponse.json({
      videoId,
      uploadUrl: url,
      resumeUrl: url,
      uploadPath: fileName
    })

  } catch (error) {
    console.error('❌ Failed to initialize GCS upload:', error)
    return NextResponse.json(
      { error: 'Failed to initialize upload' },
      { status: 500 }
    )
  }
}