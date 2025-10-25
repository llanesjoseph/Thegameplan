import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/firebase.admin'
import { storage } from '@/lib/firebase.admin'
import { getStorage } from 'firebase-admin/storage'

export const runtime = 'nodejs'

/**
 * GET /api/submissions/[id]/video-url
 * Generate a signed URL for video playback that bypasses Storage auth rules
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Verify authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split('Bearer ')[1]
    const decodedToken = await auth.verifyIdToken(token)
    const userId = decodedToken.uid

    // 2. Get submission to verify ownership and get video path
    const admin = await import('@/lib/firebase.admin')
    const submissionDoc = await admin.adminDb.collection('submissions').doc(params.id).get()
    
    if (!submissionDoc.exists) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }

    const submissionData = submissionDoc.data()

    // 3. Verify user owns this submission
    if (submissionData?.athleteUid !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // 4. Get video path
    const videoPath = submissionData?.videoStoragePath
    if (!videoPath) {
      return NextResponse.json({ error: 'No video found for this submission' }, { status: 404 })
    }

    // 5. Generate signed URL (valid for 1 hour)
    const bucket = getStorage().bucket()
    const file = bucket.file(videoPath)
    
    const [url] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + 60 * 60 * 1000, // 1 hour
    })

    return NextResponse.json({
      success: true,
      videoUrl: url
    })

  } catch (error: any) {
    console.error('[VIDEO-URL-API] Error generating signed URL:', error)
    return NextResponse.json(
      { 
        error: 'Failed to generate video URL',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

