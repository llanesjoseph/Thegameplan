/**
 * API endpoint for athletes to request live 1-on-1 coaching sessions
 * Secure, authenticated, and auditable
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth as adminAuth, adminDb } from '@/lib/firebase.admin'
import { FieldValue } from 'firebase-admin/firestore'
import { auditLog } from '@/lib/audit-logger'
import { sendLiveSessionRequestEmail } from '@/lib/email-service'

// Force dynamic rendering for API route
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const requestId = `live-session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`

  try {
    // Verify authentication
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split('Bearer ')[1]
    const decodedToken = await adminAuth.verifyIdToken(token)
    const authenticatedUserId = decodedToken.uid

    // Parse request body
    const body = await request.json()
    const { athleteId, athleteEmail, coachId, preferredDate, preferredTime, duration, topic, description, specificGoals } = body

    // Verify the authenticated user matches the athleteId in the request
    if (authenticatedUserId !== athleteId) {
      return NextResponse.json(
        { error: 'Unauthorized: You can only create requests for yourself' },
        { status: 403 }
      )
    }

    // Validation
    if (!athleteId || !athleteEmail || !preferredDate || !preferredTime || !duration || !topic || !description) {
      return NextResponse.json(
        { error: 'Missing required fields: athleteId, athleteEmail, preferredDate, preferredTime, duration, topic, description' },
        { status: 400 }
      )
    }

    // Validate duration
    const validDurations = [15, 30, 45, 60]
    if (!validDurations.includes(duration)) {
      return NextResponse.json(
        { error: 'Invalid duration. Must be 15, 30, 45, or 60 minutes' },
        { status: 400 }
      )
    }

    // Get athlete info from Firestore
    const athleteDoc = await adminDb.collection('users').doc(athleteId).get()

    if (!athleteDoc.exists) {
      return NextResponse.json(
        { error: 'Athlete not found' },
        { status: 404 }
      )
    }

    const athleteData = athleteDoc.data()
    const athleteName = athleteData?.displayName || athleteData?.email || 'Unknown Athlete'

    // Create live session request document
    const sessionRequestData = {
      athleteId,
      athleteName,
      athleteEmail: athleteEmail.trim(),
      coachId: coachId || null,
      preferredDate: preferredDate.trim(),
      preferredTime: preferredTime.trim(),
      duration,
      topic: topic.trim(),
      description: description.trim(),
      specificGoals: specificGoals?.trim() || null,
      status: 'pending', // pending, confirmed, completed, cancelled, rejected
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      viewedByCoach: false,
      coachResponse: null,
      meetingLink: null,
      completedAt: null
    }

    // Save to Firestore
    const sessionRef = await adminDb.collection('liveSessionRequests').add(sessionRequestData)

    // Audit logging
    await auditLog('live_session_request_created', {
      requestId,
      sessionId: sessionRef.id,
      athleteId,
      coachId: coachId || 'unassigned',
      preferredDate,
      preferredTime,
      duration,
      timestamp: new Date().toISOString()
    }, { userId: athleteId, severity: 'low' })

    console.log(`✅ Live session request created: ${sessionRef.id} by athlete [ATHLETE_ID]`)

    // Send email notification to coach if assigned
    if (coachId) {
      try {
        // Fetch coach info from Firestore
        const coachDoc = await adminDb.collection('users').doc(coachId).get()

        if (coachDoc.exists) {
          const coachData = coachDoc.data()
          const coachEmail = coachData?.email
          const coachName = coachData?.displayName || 'Coach'

          if (coachEmail) {
            // Construct session dashboard URL
            const sessionUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://athleap.crucibleanalytics.dev'}/dashboard/coach/live-sessions`

            // Send email notification
            await sendLiveSessionRequestEmail({
              to: coachEmail,
              coachName,
              athleteName,
              athleteEmail: athleteEmail.trim(),
              preferredDate: preferredDate.trim(),
              preferredTime: preferredTime.trim(),
              duration,
              topic: topic.trim(),
              description: description.trim(),
              specificGoals: specificGoals?.trim(),
              sessionUrl
            })

            console.log(`✅ Email notification sent to coach ${coachName} (${coachEmail})`)
          } else {
            console.warn(`⚠️ Coach ${coachId} has no email address - skipping notification`)
          }
        } else {
          console.warn(`⚠️ Coach ${coachId} not found - skipping notification`)
        }
      } catch (emailError: any) {
        // Don't fail the request if email fails - just log it
        console.error('Failed to send coach notification email:', emailError)
        await auditLog('live_session_email_failed', {
          requestId,
          sessionId: sessionRef.id,
          coachId,
          error: emailError.message,
          timestamp: new Date().toISOString()
        }, { severity: 'medium' })
      }
    } else {
      console.log(`ℹ️ No coach assigned - skipping email notification`)
    }

    return NextResponse.json({
      success: true,
      sessionId: sessionRef.id,
      message: 'Live session request submitted successfully'
    })

  } catch (error: any) {
    console.error('Error creating live session request:', error)

    await auditLog('live_session_request_error', {
      requestId,
      error: error.message || 'Unknown error',
      stack: error.stack,
      timestamp: new Date().toISOString()
    }, { severity: 'high' })

    return NextResponse.json(
      { error: 'Failed to submit live session request', details: error.message },
      { status: 500 }
    )
  }
}
