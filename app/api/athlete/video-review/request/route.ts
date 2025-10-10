/**
 * API endpoint for athletes to submit video review requests
 * Secure, authenticated, and auditable
 */

import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase.admin'
import { FieldValue } from 'firebase-admin/firestore'
import { auditLog } from '@/lib/audit-logger'

export async function POST(request: NextRequest) {
  const requestId = `video-review-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`

  try {
    // Parse request body
    const body = await request.json()
    const { athleteId, coachId, videoUrl, title, description, specificQuestions } = body

    // Validation
    if (!athleteId || !videoUrl || !title || !description) {
      return NextResponse.json(
        { error: 'Missing required fields: athleteId, videoUrl, title, description' },
        { status: 400 }
      )
    }

    // Validate URL format
    const urlPattern = /^https?:\/\/.+/i
    if (!urlPattern.test(videoUrl)) {
      return NextResponse.json(
        { error: 'Invalid video URL format' },
        { status: 400 }
      )
    }

    // Get athlete info from Firestore
    const athleteDoc = await adminDb.collection('users').doc(athleteId).get()

    if (!athleteDoc.exists) {
      return NextResponse.json(
        { error: 'Athlete not found' },
        { status: 404 }
      )
    }

    const athleteData = athleteDoc.data()
    const athleteName = athleteData?.displayName || athleteData?.email || 'Unknown Athlete'

    // Create video review request document
    const reviewRequestData = {
      athleteId,
      athleteName,
      athleteEmail: athleteData?.email || '',
      coachId: coachId || null, // Can be null if no specific coach assigned yet
      videoUrl: videoUrl.trim(),
      title: title.trim(),
      description: description.trim(),
      specificQuestions: specificQuestions?.trim() || null,
      status: 'pending', // pending, in_review, completed, rejected
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      viewedByCoach: false,
      coachResponse: null,
      completedAt: null
    }

    // Save to Firestore
    const reviewRef = await adminDb.collection('videoReviewRequests').add(reviewRequestData)

    // Audit logging
    await auditLog('video_review_request_created', {
      requestId,
      reviewId: reviewRef.id,
      athleteId,
      coachId: coachId || 'unassigned',
      title,
      timestamp: new Date().toISOString()
    }, { userId: athleteId, severity: 'low' })

    console.log(`✅ Video review request created: ${reviewRef.id} by athlete ${athleteId}`)

    // If there's a coach, send them a notification (future enhancement)
    // TODO: Send email/push notification to coach

    return NextResponse.json({
      success: true,
      reviewId: reviewRef.id,
      message: 'Video review request submitted successfully'
    })

  } catch (error: any) {
    console.error('Error creating video review request:', error)

    await auditLog('video_review_request_error', {
      requestId,
      error: error.message || 'Unknown error',
      stack: error.stack,
      timestamp: new Date().toISOString()
    }, { severity: 'high' })

    return NextResponse.json(
      { error: 'Failed to submit video review request', details: error.message },
      { status: 500 }
    )
  }
}
