import { NextRequest, NextResponse } from 'next/server'
import { auth, adminDb } from '@/lib/firebase.admin'
import { FieldValue } from 'firebase-admin/firestore'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET - List all 1:1 training sessions for a coach
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
        { error: 'Only coaches can access sessions' },
        { status: 403 }
      )
    }

    // 3. Get all confirmed sessions for this coach
    const sessionsSnapshot = await adminDb
      .collection('training_sessions')
      .where('coachId', '==', uid)
      .get()

    const sessions = sessionsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || null,
      updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || null
    }))

    // Sort in-memory to avoid index requirements
    sessions.sort((a: any, b: any) => {
      const dateCompare = (a.date || '').localeCompare(b.date || '')
      if (dateCompare !== 0) return dateCompare
      return (a.time || '').localeCompare(b.time || '')
    })

    // 4. Get all pending live session requests for this coach
    const requestsSnapshot = await adminDb
      .collection('liveSessionRequests')
      .where('status', '==', 'pending')
      .get()

    // Filter requests for this coach (could be in coachId field or athlete's assigned coach)
    const allRequests = requestsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || null,
      updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || null
    }))

    // Filter for this coach's requests
    const pendingRequests = allRequests.filter((req: any) => {
      // Direct match on coachId
      if (req.coachId === uid) return true

      // If no coachId, we can't match it to this coach
      return false
    })

    // Sort by creation date (newest first)
    pendingRequests.sort((a: any, b: any) => {
      const aTime = new Date(a.createdAt || 0).getTime()
      const bTime = new Date(b.createdAt || 0).getTime()
      return bTime - aTime
    })

    console.log(`[Coach Sessions API] Found ${sessions.length} scheduled sessions and ${pendingRequests.length} pending requests for coach ${uid}`)

    return NextResponse.json({
      success: true,
      sessions,
      pendingRequests
    })

  } catch (error: any) {
    console.error('Error fetching sessions:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create a new 1:1 training session
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
        { error: 'Only coaches can create sessions' },
        { status: 403 }
      )
    }

    // 3. Parse request body
    const body = await request.json()
    const { athleteId, date, time, duration, notes } = body

    // 4. Validate required fields
    if (!athleteId || !date || !time) {
      return NextResponse.json(
        { error: 'Missing required fields: athleteId, date, time' },
        { status: 400 }
      )
    }

    // 5. Get athlete data
    const athleteDoc = await adminDb.collection('users').doc(athleteId).get()
    if (!athleteDoc.exists) {
      return NextResponse.json(
        { error: 'Athlete not found' },
        { status: 404 }
      )
    }

    const athleteData = athleteDoc.data()

    // 6. Create session document
    const sessionData = {
      coachId: uid,
      coachName: userData?.displayName || 'Unknown Coach',
      athleteId,
      athleteName: athleteData?.displayName || 'Unknown Athlete',
      date,
      time,
      duration: duration || 60,
      notes: notes || '',
      status: 'scheduled',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    }

    const sessionRef = await adminDb.collection('training_sessions').add(sessionData)

    return NextResponse.json({
      success: true,
      sessionId: sessionRef.id,
      message: 'Session created successfully'
    })

  } catch (error: any) {
    console.error('Error creating session:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
