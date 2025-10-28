import { NextRequest, NextResponse } from 'next/server'
import { auth, adminDb } from '@/lib/firebase.admin'
import { FieldValue } from 'firebase-admin/firestore'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Track user activity (login, page view, etc.)
 * Updates lastLoginAt to show when user was last active
 */
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

    // Verify token
    let decodedToken
    try {
      decodedToken = await auth.verifyIdToken(token)
    } catch (error) {
      console.error('Token verification failed:', error)
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    const userId = decodedToken.uid

    // Update lastLoginAt using admin SDK (bypasses security rules)
    await adminDb.collection('users').doc(userId).update({
      lastLoginAt: FieldValue.serverTimestamp(),
      lastActivity: FieldValue.serverTimestamp()
    })

    console.log(`✅ Activity tracked for user ${userId}`)

    return NextResponse.json({
      success: true,
      message: 'Activity tracked successfully'
    })

  } catch (error: any) {
    console.error('Error tracking activity:', error)
    return NextResponse.json(
      { error: 'Failed to track activity', details: error.message },
      { status: 500 }
    )
  }
}
