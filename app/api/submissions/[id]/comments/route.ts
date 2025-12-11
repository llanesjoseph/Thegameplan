import { NextRequest, NextResponse } from 'next/server'
import { auth, adminDb } from '@/lib/firebase.admin'

export const runtime = 'nodejs'

/**
 * POST /api/submissions/[id]/comments
 * Add a comment to a submission
 * SECURITY: Only allows athletes to comment on their own submissions
 */
export async function POST(
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

    // 2. Parse request body
    const body = await request.json()
    const { content, authorRole = 'athlete' } = body

    if (!content || !content.trim()) {
      return NextResponse.json({ error: 'Comment content is required' }, { status: 400 })
    }

    // 3. Verify submission exists and user has access
    const submissionDoc = await adminDb.collection('submissions').doc(params.id).get()
    
    if (!submissionDoc.exists) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }

    const submissionData = submissionDoc.data()

    // 4. SECURITY: Verify the user owns this submission
    if (submissionData?.athleteUid !== userId) {
      return NextResponse.json({ error: 'Forbidden - You can only comment on your own submissions' }, { status: 403 })
    }

    // 5. Create comment
    const commentData = {
      submissionId: params.id,
      authorUid: userId,
      authorName: decodedToken.name || decodedToken.email?.split('@')[0] || 'Athlete',
      authorPhotoUrl: decodedToken.picture || null,
      authorRole: authorRole,
      content: content.trim(),
      createdAt: new Date(),
      edited: false
    }

    const commentRef = await adminDb.collection('comments').add(commentData)

    // 6. Update comment count on submission
    const currentCount = submissionData?.commentCount || 0
    await adminDb.collection('submissions').doc(params.id).update({
      commentCount: currentCount + 1,
      updatedAt: new Date()
    })

    console.log(`[COMMENTS-API] Successfully added comment ${commentRef.id} to submission ${params.id} by user ${userId}`)

    return NextResponse.json({
      success: true,
      commentId: commentRef.id,
      message: 'Comment added successfully'
    })

  } catch (error: any) {
    console.error('[COMMENTS-API] Error adding comment:', error)
    return NextResponse.json(
      { 
        error: 'Failed to add comment',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}