import { NextRequest, NextResponse } from 'next/server'
import { auth, adminDb } from '@/lib/firebase.admin'
import { FieldValue } from 'firebase-admin/firestore'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// POST - Approve a live session request and create a scheduled session
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
        { error: 'Only coaches can approve session requests' },
        { status: 403 }
      )
    }

    // 3. Parse request body
    const body = await request.json()
    const { requestId, confirmedDate, confirmedTime, notes } = body

    if (!requestId) {
      return NextResponse.json(
        { error: 'Missing required field: requestId' },
        { status: 400 }
      )
    }

    // 4. Get the live session request
    const requestDoc = await adminDb.collection('liveSessionRequests').doc(requestId).get()

    if (!requestDoc.exists) {
      return NextResponse.json(
        { error: 'Live session request not found' },
        { status: 404 }
      )
    }

    const requestData = requestDoc.data()

    // Verify this request is for this coach
    if (requestData?.coachId !== uid) {
      return NextResponse.json(
        { error: 'You can only approve requests assigned to you' },
        { status: 403 }
      )
    }

    // Verify request is still pending
    if (requestData?.status !== 'pending') {
      return NextResponse.json(
        { error: `Cannot approve request with status: ${requestData?.status}` },
        { status: 400 }
      )
    }

    // 5. Create scheduled training session
    const sessionData = {
      coachId: uid,
      coachName: userData?.displayName || 'Unknown Coach',
      athleteId: requestData.athleteId,
      athleteName: requestData.athleteName,
      date: confirmedDate || requestData.preferredDate,
      time: confirmedTime || requestData.preferredTime,
      duration: requestData.duration,
      notes: notes || requestData.description || '',
      topic: requestData.topic,
      status: 'scheduled',
      sourceRequestId: requestId, // Link back to original request
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    }

    const sessionRef = await adminDb.collection('training_sessions').add(sessionData)

    // 6. Update live session request status
    await adminDb.collection('liveSessionRequests').doc(requestId).update({
      status: 'confirmed',
      confirmedDate: confirmedDate || requestData.preferredDate,
      confirmedTime: confirmedTime || requestData.preferredTime,
      sessionId: sessionRef.id,
      updatedAt: FieldValue.serverTimestamp(),
      viewedByCoach: true
    })

    console.log(`✅ Session request ${requestId} approved and session ${sessionRef.id} created by coach ${uid}`)

    return NextResponse.json({
      success: true,
      sessionId: sessionRef.id,
      message: 'Session request approved and scheduled successfully'
    })

  } catch (error: any) {
    console.error('Error approving session request:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
