import { NextRequest, NextResponse } from 'next/server'
import { auth as adminAuth, adminDb } from '@/lib/firebase.admin'

/**
 * GET /api/athlete/coach-schedule
 * Fetch schedule events from athlete's assigned coach
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split('Bearer ')[1]
    const decodedToken = await adminAuth.verifyIdToken(token)
    const userId = decodedToken.uid

    // Get athlete's assigned coach ID
    const userDoc = await adminDb.collection('users').doc(userId).get()
    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const userData = userDoc.data()
    const assignedCoachId = userData?.coachId || userData?.assignedCoachId

    if (!assignedCoachId) {
      return NextResponse.json({
        success: true,
        events: [],
        message: 'No assigned coach found'
      })
    }

    // Fetch all future events from assigned coach
    const now = new Date()
    const eventsSnapshot = await adminDb
      .collection('coach_schedule')
      .where('coachId', '==', assignedCoachId)
      .orderBy('eventDate', 'asc')
      .get()

    const events = eventsSnapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data(),
        eventDate: doc.data().eventDate?.toDate?.()?.toISOString() || null,
        eventDateTime: doc.data().eventDateTime,
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || null,
        updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || null
      }))
      // Filter to only show future events (optional - you may want to show past events too)
      .filter(event => {
        if (!event.eventDateTime) return true
        return new Date(event.eventDateTime) >= now
      })

    return NextResponse.json({
      success: true,
      events,
      coachId: assignedCoachId
    })
  } catch (error) {
    console.error('Error fetching coach schedule:', error)
    return NextResponse.json(
      { error: 'Failed to fetch schedule', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
