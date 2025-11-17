/**
 * API endpoint for athletes to list their live session requests
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth as adminAuth, adminDb } from '@/lib/firebase.admin'

// Force dynamic rendering for API route
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split('Bearer ')[1]
    const decodedToken = await adminAuth.verifyIdToken(token)
    const athleteId = decodedToken.uid

    // Fetch all session requests for this athlete, ordered by creation date
    const sessionsSnapshot = await adminDb
      .collection('liveSessionRequests')
      .where('athleteId', '==', athleteId)
      .orderBy('createdAt', 'desc')
      .get()

    const sessions = sessionsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || null,
      updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || null
    }))

    console.log(`✅ Fetched ${sessions.length} session requests for athlete ${athleteId}`)

    return NextResponse.json({
      success: true,
      sessions
    })

  } catch (error: any) {
    console.error('Error fetching athlete session requests:', error)

    return NextResponse.json(
      { error: 'Failed to fetch session requests', details: error.message },
      { status: 500 }
    )
  }
}
