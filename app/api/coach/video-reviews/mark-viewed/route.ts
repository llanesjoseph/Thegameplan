import { NextRequest, NextResponse } from 'next/server'
import { auth, adminDb } from '@/lib/firebase.admin'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    // Get auth token
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const token = authHeader.split('Bearer ')[1]
    const decodedToken = await auth.verifyIdToken(token)
    const userId = decodedToken.uid

    // Verify coach access
    const userDoc = await adminDb.collection('users').doc(userId).get()
    const userData = userDoc.data()
    const userRole = userData?.role || 'athlete'

    if (!['coach', 'admin', 'superadmin'].includes(userRole)) {
      return NextResponse.json(
        { error: 'Forbidden - coach access required' },
        { status: 403 }
      )
    }

    // Get request body
    const body = await request.json()
    const { requestId } = body

    if (!requestId) {
      return NextResponse.json(
        { error: 'Missing requestId' },
        { status: 400 }
      )
    }

    // Verify the request belongs to this coach
    const requestDoc = await adminDb.collection('videoReviewRequests').doc(requestId).get()

    if (!requestDoc.exists) {
      return NextResponse.json(
        { error: 'Request not found' },
        { status: 404 }
      )
    }

    const requestData = requestDoc.data()
    if (requestData?.assignedCoachUid !== userId && !['admin', 'superadmin'].includes(userRole)) {
      return NextResponse.json(
        { error: 'Access denied to this request' },
        { status: 403 }
      )
    }

    // Update the request
    await adminDb.collection('videoReviewRequests').doc(requestId).update({
      viewedByCoach: true,
      status: 'in_review',
      updatedAt: new Date()
    })

    return NextResponse.json({
      success: true,
      message: 'Request marked as viewed'
    })

  } catch (error: any) {
    console.error('Error marking request as viewed:', error)

    return NextResponse.json(
      {
        error: 'Failed to mark request as viewed',
        details: error.message
      },
      { status: 500 }
    )
  }
}
