/**
 * Initialize GCS resumable upload
 * Creates a signed URL for direct browser upload to GCS
 */

import { NextRequest, NextResponse } from 'next/server'
import { Storage } from '@google-cloud/storage'
import { auth } from '@/lib/firebase.admin'
import { db } from '@/lib/firebase.client'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { verifyIdToken } from '@/lib/auth-utils'
import { auditLog } from '@/lib/audit-logger'

// Force dynamic rendering for API route
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const storage = new Storage({
  projectId: process.env.NEXT_PUBLIC_GCP_PROJECT_ID
})

const UPLOAD_BUCKET = process.env.NEXT_PUBLIC_GCS_UPLOAD_BUCKET || 'gameplan-uploads'

export async function POST(request: NextRequest) {
  try {
    // Enhanced authentication verification
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      await auditLog('video_upload_unauthorized', {
        ip: request.ip,
        userAgent: request.headers.get('user-agent'),
        timestamp: new Date().toISOString()
      })
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify Firebase ID token
    const token = authHeader.substring(7)
    const decodedToken = await verifyIdToken(token)

    if (!decodedToken) {
      await auditLog('video_upload_invalid_token', {
        ip: request.ip,
        userAgent: request.headers.get('user-agent'),
        timestamp: new Date().toISOString()
      })
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Check user role permissions (creator or higher required for video uploads)
    const userDoc = await getDoc(doc(db, 'users', decodedToken.uid))
    const userRole = userDoc.data()?.role || 'user'

    if (!['creator', 'coach', 'assistant', 'admin', 'superadmin'].includes(userRole)) {
      await auditLog('video_upload_insufficient_permissions', {
        userId: decodedToken.uid,
        userRole,
        ip: request.ip,
        timestamp: new Date().toISOString()
      })
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
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

    // Audit log the upload initialization
    await auditLog('video_upload_init', {
      videoId,
      filename,
      size: `${(size / (1024 * 1024)).toFixed(1)} MB`,
      contentType,
      userRole,
      timestamp: new Date().toISOString()
    }, {
      userId: decodedToken.uid,
      severity: 'low',
      source: 'video_upload'
    })

    console.log('🚀 Initializing GCS upload:', {
      videoId,
      filename,
      size: `${(size / (1024 * 1024)).toFixed(1)} MB`,
      contentType,
      userId: decodedToken.uid
    })

    // Create secure file path with standardized creator content structure
    const fileName = `creators/${decodedToken.uid}/content/${videoId}/${filename}`
    const file = storage.bucket(UPLOAD_BUCKET).file(fileName)

    // Generate resumable upload URL with enhanced metadata
    const [url] = await file.createResumableUpload({
      metadata: {
        contentType,
        metadata: {
          videoId,
          userId: decodedToken.uid,
          userRole,
          originalName: filename,
          uploadedAt: new Date().toISOString(),
          securityLevel: 'authenticated',
          uploadSource: 'web_client'
        }
      }
    })

    // Create video metadata document with enhanced security
    const videoDoc = {
      id: videoId,
      userId: decodedToken.uid,
      filename,
      size,
      contentType,
      uploadPath: fileName,
      uploadUrl: url, // Consider removing this for security
      status: 'uploading',
      securityLevel: 'authenticated',
      accessControl: {
        owner: decodedToken.uid,
        viewers: [decodedToken.uid],
        editors: [decodedToken.uid]
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      auditTrail: [{
        action: 'upload_initiated',
        userId: decodedToken.uid,
        timestamp: new Date().toISOString()
      }]
    }

    // Store in Firestore with enhanced security
    await setDoc(doc(db, 'videos', videoId), videoDoc)

    console.log('✅ GCS upload initialized:', {
      videoId,
      uploadPath: fileName,
      hasUploadUrl: !!url,
      userId: decodedToken.uid
    })

    // Return minimal response (don't expose upload URL in logs)
    return NextResponse.json({
      videoId,
      uploadUrl: url,
      resumeUrl: url,
      uploadPath: fileName,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hour expiry
    })

  } catch (error) {
    console.error('❌ Failed to initialize GCS upload:', error)
    return NextResponse.json(
      { error: 'Failed to initialize upload' },
      { status: 500 }
    )
  }
}