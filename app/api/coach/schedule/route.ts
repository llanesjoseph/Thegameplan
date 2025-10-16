import { NextRequest, NextResponse } from 'next/server'
import { auth as adminAuth, adminDb } from '@/lib/firebase.admin'
import { auditLog } from '@/lib/audit-logger'
import { FieldValue } from 'firebase-admin/firestore'
import { sendScheduleEventNotificationEmail } from '@/lib/email-service'

/**
 * GET /api/coach/schedule
 * Fetch all schedule events for a specific coach
 */
export async function GET(request: NextRequest) {
  try {
    console.log('[Schedule API] GET request received')

    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('[Schedule API] No auth header found')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split('Bearer ')[1]
    console.log('[Schedule API] Verifying token...')

    const decodedToken = await adminAuth.verifyIdToken(token)
    const userId = decodedToken.uid
    console.log('[Schedule API] Token verified for user:', userId)

    // Fetch all schedule events created by this coach
    const eventsSnapshot = await adminDb
      .collection('coach_schedule')
      .where('coachId', '==', userId)
      .orderBy('eventDate', 'asc')
      .get()

    const events = eventsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      eventDate: doc.data().eventDate?.toDate?.()?.toISOString() || null,
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || null,
      updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || null
    }))

    return NextResponse.json({
      success: true,
      events
    })
  } catch (error) {
    console.error('Error fetching coach schedule:', error)
    return NextResponse.json(
      { error: 'Failed to fetch schedule', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/coach/schedule
 * Create a new schedule event
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split('Bearer ')[1]
    const decodedToken = await adminAuth.verifyIdToken(token)
    const userId = decodedToken.uid

    // Get user data to fetch coach name
    const userDoc = await adminDb.collection('users').doc(userId).get()
    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const userData = userDoc.data()
    const coachName = userData?.displayName || userData?.email || 'Coach'

    // Parse request body
    const body = await request.json()
    const { eventType, eventDate, eventTime, location, notes, notifyAthletes } = body

    // Validation
    if (!eventType || !eventDate) {
      return NextResponse.json({ error: 'Event type and date are required' }, { status: 400 })
    }

    // Combine date and time into a single timestamp
    const eventDateTime = eventTime
      ? new Date(`${eventDate}T${eventTime}`)
      : new Date(eventDate)

    // Create event document
    const eventData = {
      coachId: userId,
      coachName,
      eventType,
      eventDate: FieldValue.serverTimestamp(),
      eventDateTime: eventDateTime.toISOString(),
      location: location || '',
      notes: notes || '',
      notifyAthletes: notifyAthletes || false,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    }

    const eventRef = await adminDb.collection('coach_schedule').add(eventData)

    // If notifyAthletes is true, send email notifications
    if (notifyAthletes) {
      // Get all assigned athletes for this coach
      const athletesSnapshot = await adminDb
        .collection('users')
        .where('coachId', '==', userId)
        .get()

      // Send email to each athlete
      const emailPromises = athletesSnapshot.docs.map(async (athleteDoc) => {
        const athleteData = athleteDoc.data()
        const athleteEmail = athleteData.email
        const athleteName = athleteData.displayName || athleteData.email || 'Athlete'

        if (!athleteEmail) return null

        try {
          await sendScheduleEventNotificationEmail({
            to: athleteEmail,
            athleteName,
            coachName,
            eventType,
            eventDate,
            eventTime: eventTime || '00:00',
            location: location || undefined,
            notes: notes || undefined
          })
          return { success: true, email: athleteEmail }
        } catch (error) {
          console.error(`Failed to send email to ${athleteEmail}:`, error)
          return { success: false, email: athleteEmail, error }
        }
      })

      const emailResults = await Promise.all(emailPromises)
      const successfulEmails = emailResults.filter(r => r?.success).length
      const failedEmails = emailResults.filter(r => r && !r.success).length

      console.log(`✅ Sent ${successfulEmails} email notifications (${failedEmails} failed)`)
    }

    // Audit log
    await auditLog('coach_schedule_created', {
      coachId: userId,
      coachName,
      eventId: eventRef.id,
      eventType,
      notifyAthletes
    })

    return NextResponse.json({
      success: true,
      eventId: eventRef.id,
      message: 'Event created successfully'
    })
  } catch (error) {
    console.error('Error creating schedule event:', error)
    return NextResponse.json(
      { error: 'Failed to create event', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/coach/schedule
 * Update an existing schedule event
 */
export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split('Bearer ')[1]
    const decodedToken = await adminAuth.verifyIdToken(token)
    const userId = decodedToken.uid

    // Parse request body
    const body = await request.json()
    const { eventId, eventType, eventDate, eventTime, location, notes } = body

    if (!eventId) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 })
    }

    // Verify ownership
    const eventDoc = await adminDb.collection('coach_schedule').doc(eventId).get()
    if (!eventDoc.exists) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    const eventData = eventDoc.data()
    if (eventData?.coachId !== userId) {
      return NextResponse.json({ error: 'Unauthorized to edit this event' }, { status: 403 })
    }

    // Update event
    const updates: any = {
      updatedAt: FieldValue.serverTimestamp()
    }

    if (eventType !== undefined) updates.eventType = eventType
    if (location !== undefined) updates.location = location
    if (notes !== undefined) updates.notes = notes

    // Handle date/time updates
    if (eventDate !== undefined) {
      const eventDateTime = eventTime
        ? new Date(`${eventDate}T${eventTime}`)
        : new Date(eventDate)
      updates.eventDateTime = eventDateTime.toISOString()
    }

    await adminDb.collection('coach_schedule').doc(eventId).update(updates)

    // Audit log
    await auditLog('coach_schedule_updated', {
      coachId: userId,
      eventId
    })

    return NextResponse.json({
      success: true,
      message: 'Event updated successfully'
    })
  } catch (error) {
    console.error('Error updating schedule event:', error)
    return NextResponse.json(
      { error: 'Failed to update event', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/coach/schedule
 * Delete a schedule event
 */
export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split('Bearer ')[1]
    const decodedToken = await adminAuth.verifyIdToken(token)
    const userId = decodedToken.uid

    // Parse request body
    const body = await request.json()
    const { eventId } = body

    if (!eventId) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 })
    }

    // Verify ownership
    const eventDoc = await adminDb.collection('coach_schedule').doc(eventId).get()
    if (!eventDoc.exists) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    const eventData = eventDoc.data()
    if (eventData?.coachId !== userId) {
      return NextResponse.json({ error: 'Unauthorized to delete this event' }, { status: 403 })
    }

    // Delete event
    await adminDb.collection('coach_schedule').doc(eventId).delete()

    // Audit log
    await auditLog('coach_schedule_deleted', {
      coachId: userId,
      eventId
    })

    return NextResponse.json({
      success: true,
      message: 'Event deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting schedule event:', error)
    return NextResponse.json(
      { error: 'Failed to delete event', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
