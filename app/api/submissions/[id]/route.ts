import { NextRequest, NextResponse } from 'next/server'
import { auth, adminDb } from '@/lib/firebase.admin'

export const runtime = 'nodejs'

// PATCH /api/submissions/[id]
// Update a submission document the athlete owns
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Auth
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split('Bearer ')[1]
    let decoded
    try {
      decoded = await auth.verifyIdToken(token)
    } catch (e: any) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }
    const userId = decoded.uid

    const submissionRef = adminDb.collection('submissions').doc(params.id)
    const snap = await submissionRef.get()
    if (!snap.exists) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }
    const submission = snap.data()
    if (submission?.athleteUid !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const update = await request.json()

    await submissionRef.update({
      ...update,
      updatedAt: new Date()
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('PATCH submissions/[id] failed:', error)
    return NextResponse.json({ error: 'Failed to update submission', details: error.message }, { status: 500 })
  }
}
/**
 * GET /api/submissions/[id]
 * Fetch a single submission with review and comments data
 * SECURITY: Only allows athletes to access their own submissions
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

    // 2. Get submission data
    const submissionDoc = await adminDb.collection('submissions').doc(params.id).get()
    
    if (!submissionDoc.exists) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }

    const submissionData = submissionDoc.data()

    // 3. SECURITY: Verify the user owns this submission
    if (submissionData?.athleteUid !== userId) {
      return NextResponse.json({ error: 'Forbidden - You can only access your own submissions' }, { status: 403 })
    }

    // 4. Get review data if submission is complete
    let reviewData = null
    if (submissionData?.status === 'complete' && submissionData?.reviewId) {
      try {
        const reviewDoc = await adminDb.collection('reviews').doc(submissionData.reviewId).get()
        if (reviewDoc.exists) {
          reviewData = reviewDoc.data()
        }
      } catch (error) {
        console.warn('Could not fetch review data:', error)
      }
    }

    // 5. Get comments data
    let commentsData: any[] = []
    try {
      const commentsSnapshot = await adminDb
        .collection('comments')
        .where('submissionId', '==', params.id)
        .orderBy('createdAt', 'asc')
        .get()

      commentsData = commentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || null
      }))
    } catch (error) {
      console.warn('Could not fetch comments data:', error)
    }

    // 6. Format response data
    const responseData = {
      submission: {
        id: submissionDoc.id,
        ...submissionData,
        createdAt: submissionData?.createdAt?.toDate?.()?.toISOString() || null,
        updatedAt: submissionData?.updatedAt?.toDate?.()?.toISOString() || null,
        submittedAt: submissionData?.submittedAt?.toDate?.()?.toISOString() || null,
        reviewedAt: submissionData?.reviewedAt?.toDate?.()?.toISOString() || null,
        slaDeadline: submissionData?.slaDeadline?.toDate?.()?.toISOString() || null,
      },
      review: reviewData ? {
        id: submissionData?.reviewId,
        ...reviewData,
        createdAt: reviewData?.createdAt?.toDate?.()?.toISOString() || null,
        updatedAt: reviewData?.updatedAt?.toDate?.()?.toISOString() || null,
        publishedAt: reviewData?.publishedAt?.toDate?.()?.toISOString() || null,
      } : null,
      comments: commentsData
    }

    console.log(`[SUBMISSION-API] Successfully fetched submission ${params.id} for user ${userId}`)

    return NextResponse.json({
      success: true,
      data: responseData
    })

  } catch (error: any) {
    console.error('[SUBMISSION-API] Error fetching submission:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch submission details',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}