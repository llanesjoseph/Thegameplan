import { NextRequest, NextResponse } from 'next/server'
import { auth, adminDb } from '@/lib/firebase.admin'

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
        { error: 'Only coaches can view lessons' },
        { status: 403 }
      )
    }

    // 3. Query lessons by coachId
    const lessonsSnapshot = await adminDb
      .collection('lessons')
      .where('coachId', '==', uid)
      .orderBy('createdAt', 'desc')
      .get()

    const lessons = lessonsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))

    return NextResponse.json({
      success: true,
      lessons,
      count: lessons.length
    })

  } catch (error: any) {
    console.error('Error listing lessons:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
