import { NextRequest, NextResponse } from 'next/server'
import { auth, adminDb } from '@/lib/firebase.admin'

export const runtime = 'nodejs'

/**
 * GET /api/tools/verify-coach-flow
 * Returns readiness metrics for coach side:
 * - awaiting count (awaiting_coach)
 * - in_review count
 * - complete count in last 24h
 */
export async function GET(request: NextRequest) {
  try {
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

    // Fetch user's assigned coach
    const userDoc = await adminDb.collection('users').doc(userId).get()
    const coachId = userDoc.data()?.coachId || userDoc.data()?.assignedCoachId

    if (!coachId) {
      return NextResponse.json({ success: true, coachId: null, awaiting: 0, in_review: 0, complete_24h: 0 })
    }

    const awaitingSnap = await adminDb.collection('submissions')
      .where('assignedCoachId', '==', coachId)
      .where('status', '==', 'awaiting_coach')
      .get()

    const inReviewSnap = await adminDb.collection('submissions')
      .where('assignedCoachId', '==', coachId)
      .where('status', '==', 'in_review')
      .get()

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const completeSnap = await adminDb.collection('submissions')
      .where('assignedCoachId', '==', coachId)
      .where('status', '==', 'complete')
      .get()

    const complete24h = completeSnap.docs.filter(d => (d.data()?.reviewedAt?.toDate?.()?.getTime?.() || 0) >= since.getTime()).length

    return NextResponse.json({
      success: true,
      coachId,
      awaiting: awaitingSnap.size,
      in_review: inReviewSnap.size,
      complete_24h: complete24h
    })
  } catch (error: any) {
    console.error('Verify coach flow error:', error)
    return NextResponse.json({ error: 'Verification failed', details: error.message }, { status: 500 })
  }
}


