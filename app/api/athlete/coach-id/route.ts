import { NextRequest, NextResponse } from 'next/server'
import { auth, adminDb } from '@/lib/firebase.admin'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

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

    // 2. Fetch user data using Admin SDK
    const userDoc = await adminDb.collection('users').doc(uid).get()
    
    if (!userDoc.exists) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const userData = userDoc.data()
    if (!userData) {
      return NextResponse.json(
        { error: 'User data is empty' },
        { status: 500 }
      )
    }

    // 3. Extract coach ID
    const coachId = userData.coachId || userData.assignedCoachId || null

    return NextResponse.json({
      success: true,
      coachId: coachId,
      userRole: userData.role || userData.roles?.[0] || 'user'
    })

  } catch (error) {
    console.error('Error fetching coach ID:', error)
    return NextResponse.json(
      { error: 'Failed to fetch coach ID' },
      { status: 500 }
    )
  }
}
