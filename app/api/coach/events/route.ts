import { NextRequest, NextResponse } from 'next/server'
import { auth, adminDb } from '@/lib/firebase.admin'
import { FieldValue } from 'firebase-admin/firestore'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET - List all events for a coach
export async function GET(request: NextRequest) {
  try {
    // 1. Verify authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      )
    }

    const token = authHeader.split('Bearer ')[1]
    let decodedToken
    try {
      decodedToken = await auth.verifyIdToken(token)
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      )
    }

    const uid = decodedToken.uid

    // 2. Verify user has coach role
    const userDoc = await adminDb.collection('users').doc(uid).get()
    if (!userDoc.exists) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const userData = userDoc.data()
    const userRole = userData?.role || userData?.roles?.[0] || 'user'

    if (!['coach', 'creator', 'admin', 'superadmin'].includes(userRole)) {
      return NextResponse.json(
        { error: 'Only coaches can access events' },
        { status: 403 }
      )
    }

    // 3. Get all events for this coach
    const eventsSnapshot = await adminDb
      .collection('coach_events')
      .where('coachId', '==', uid)
      .orderBy('date', 'asc')
      .orderBy('time', 'asc')
      .get()

    const events = eventsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))

    return NextResponse.json({
      success: true,
      events
    })

  } catch (error: any) {
    console.error('Error fetching events:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create a new event
export async function POST(request: NextRequest) {
  try {
    // 1. Verify authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      )
    }

    const token = authHeader.split('Bearer ')[1]
    let decodedToken
    try {
      decodedToken = await auth.verifyIdToken(token)
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      )
    }

    const uid = decodedToken.uid

    // 2. Verify user has coach role
    const userDoc = await adminDb.collection('users').doc(uid).get()
    if (!userDoc.exists) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const userData = userDoc.data()
    const userRole = userData?.role || userData?.roles?.[0] || 'user'

    if (!['coach', 'creator', 'admin', 'superadmin'].includes(userRole)) {
      return NextResponse.json(
        { error: 'Only coaches can create events' },
        { status: 403 }
      )
    }

    // 3. Parse request body
    const body = await request.json()
    const { title, type, date, time, location, description, notifyAthletes } = body

    // 4. Validate required fields
    if (!title || !type || !date || !time) {
      return NextResponse.json(
        { error: 'Missing required fields: title, type, date, time' },
        { status: 400 }
      )
    }

    // 5. Create event document
    const eventData = {
      coachId: uid,
      coachName: userData?.displayName || 'Unknown Coach',
      title,
      type,
      date,
      time,
      location: location || '',
      description: description || '',
      notifyAthletes: notifyAthletes || false,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    }

    const eventRef = await adminDb.collection('coach_events').add(eventData)

    return NextResponse.json({
      success: true,
      eventId: eventRef.id,
      message: 'Event created successfully'
    })

  } catch (error: any) {
    console.error('Error creating event:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT - Update an event
export async function PUT(request: NextRequest) {
  try {
    // 1. Verify authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      )
    }

    const token = authHeader.split('Bearer ')[1]
    let decodedToken
    try {
      decodedToken = await auth.verifyIdToken(token)
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      )
    }

    const uid = decodedToken.uid

    // 2. Parse request body
    const body = await request.json()
    const { id, title, type, date, time, location, description, notifyAthletes } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Missing event ID' },
        { status: 400 }
      )
    }

    // 3. Get existing event
    const eventDoc = await adminDb.collection('coach_events').doc(id).get()

    if (!eventDoc.exists) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }

    const existingEvent = eventDoc.data()

    // 4. Verify ownership
    if (existingEvent?.coachId !== uid) {
      const userDoc = await adminDb.collection('users').doc(uid).get()
      const userData = userDoc.data()
      const userRole = userData?.role || 'user'

      if (!['admin', 'superadmin'].includes(userRole)) {
        return NextResponse.json(
          { error: 'You can only update your own events' },
          { status: 403 }
        )
      }
    }

    // 5. Update event
    const updateData = {
      title: title || existingEvent?.title,
      type: type || existingEvent?.type,
      date: date || existingEvent?.date,
      time: time || existingEvent?.time,
      location: location !== undefined ? location : existingEvent?.location,
      description: description !== undefined ? description : existingEvent?.description,
      notifyAthletes: notifyAthletes !== undefined ? notifyAthletes : existingEvent?.notifyAthletes,
      updatedAt: FieldValue.serverTimestamp()
    }

    await adminDb.collection('coach_events').doc(id).update(updateData)

    return NextResponse.json({
      success: true,
      message: 'Event updated successfully'
    })

  } catch (error: any) {
    console.error('Error updating event:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Delete an event
export async function DELETE(request: NextRequest) {
  try {
    // 1. Verify authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      )
    }

    const token = authHeader.split('Bearer ')[1]
    let decodedToken
    try {
      decodedToken = await auth.verifyIdToken(token)
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      )
    }

    const uid = decodedToken.uid

    // 2. Get event ID from query params
    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get('id')

    if (!eventId) {
      return NextResponse.json(
        { error: 'Missing event ID' },
        { status: 400 }
      )
    }

    // 3. Get existing event
    const eventDoc = await adminDb.collection('coach_events').doc(eventId).get()

    if (!eventDoc.exists) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }

    const existingEvent = eventDoc.data()

    // 4. Verify ownership
    if (existingEvent?.coachId !== uid) {
      const userDoc = await adminDb.collection('users').doc(uid).get()
      const userData = userDoc.data()
      const userRole = userData?.role || 'user'

      if (!['admin', 'superadmin'].includes(userRole)) {
        return NextResponse.json(
          { error: 'You can only delete your own events' },
          { status: 403 }
        )
      }
    }

    // 5. Delete event
    await adminDb.collection('coach_events').doc(eventId).delete()

    return NextResponse.json({
      success: true,
      message: 'Event deleted successfully'
    })

  } catch (error: any) {
    console.error('Error deleting event:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
