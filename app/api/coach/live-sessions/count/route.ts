import { NextRequest, NextResponse } from 'next/server'
import { auth as adminAuth, adminDb } from '@/lib/firebase.admin'

/**
 * GET /api/coach/live-sessions/count
 * Get count of pending live session requests for the authenticated coach
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split('Bearer ')[1]
    const decodedToken = await adminAuth.verifyIdToken(token)
    const coachId = decodedToken.uid

    // Count pending session requests for this coach
    const requestsSnapshot = await adminDb
      .collection('liveSessionRequests')
      .where('coachId', '==', coachId)
      .where('status', '==', 'pending')
      .get()

    return NextResponse.json({
      success: true,
      pendingCount: requestsSnapshot.size,
      coachId
    })
  } catch (error) {
    console.error('Error counting live session requests:', error)
    return NextResponse.json(
      { error: 'Failed to count requests', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
