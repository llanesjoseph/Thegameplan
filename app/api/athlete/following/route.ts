import { NextRequest, NextResponse } from 'next/server'
import { auth as adminAuth, adminDb } from '@/lib/firebase.admin'

// Force dynamic rendering for API route
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * GET /api/athlete/following
 * Get list of coaches this athlete is following
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split('Bearer ')[1]
    const decodedToken = await adminAuth.verifyIdToken(token)
    const athleteId = decodedToken.uid

    // Get all follows for this athlete
    const followsSnapshot = await adminDb
      .collection('coach_followers')
      .where('athleteId', '==', athleteId)
      .get()

    const following = followsSnapshot.docs.map(doc => ({
      coachId: doc.data().coachId,
      coachName: doc.data().coachName,
      followedAt: doc.data().followedAt?.toDate?.()?.toISOString() || null,
      notificationsEnabled: doc.data().notificationsEnabled || false
    }))

    return NextResponse.json({
      success: true,
      following,
      count: following.length
    })
  } catch (error) {
    console.error('Error getting following list:', error)
    return NextResponse.json(
      { error: 'Failed to get following list', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
