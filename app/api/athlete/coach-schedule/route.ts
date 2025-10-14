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

    // Fetch all events from assigned coach
    // Note: Removed orderBy to avoid composite index requirement - we'll sort in memory
    const now = new Date()

    let eventsSnapshot
    try {
      eventsSnapshot = await adminDb
        .collection('coach_schedule')
        .where('coachId', '==', assignedCoachId)
        .get()
    } catch (firestoreError) {
      console.error('Firestore query error:', firestoreError)
      // Return empty events instead of failing completely
      return NextResponse.json({
        success: true,
        events: [],
        message: 'Unable to load schedule at this time',
        coachId: assignedCoachId
      })
    }

    // Check if coach has any schedule events
    if (eventsSnapshot.empty) {
      return NextResponse.json({
        success: true,
        events: [],
        message: 'Your coach has not created any schedule events yet',
        coachId: assignedCoachId
      })
    }

    const events = eventsSnapshot.docs
      .map(doc => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          eventDate: data.eventDate?.toDate?.()?.toISOString() || null,
          eventDateTime: data.eventDateTime || null,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || null
        }
      })
      // Filter to only show future events
      .filter(event => {
        if (!event.eventDateTime) return false // Exclude events without dateTime
        try {
          return new Date(event.eventDateTime) >= now
        } catch {
          return false // Exclude events with invalid dates
        }
      })
      // Sort by date in memory (ascending)
      .sort((a, b) => {
        if (!a.eventDateTime || !b.eventDateTime) return 0
        return new Date(a.eventDateTime).getTime() - new Date(b.eventDateTime).getTime()
      })

    return NextResponse.json({
      success: true,
      events,
      message: events.length === 0 ? 'No upcoming events scheduled' : undefined,
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
