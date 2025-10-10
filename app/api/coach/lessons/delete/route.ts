import { NextRequest, NextResponse } from 'next/server'
import { auth, adminDb } from '@/lib/firebase.admin'

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
        { error: 'Only coaches can delete lessons' },
        { status: 403 }
      )
    }

    // 3. Parse request body
    const body = await request.json()
    const { lessonId } = body

    if (!lessonId) {
      return NextResponse.json(
        { error: 'Missing lessonId' },
        { status: 400 }
      )
    }

    // 4. Get lesson
    const lessonDoc = await adminDb.collection('content').doc(lessonId).get()
    if (!lessonDoc.exists) {
      return NextResponse.json(
        { error: 'Lesson not found' },
        { status: 404 }
      )
    }

    const lessonData = lessonDoc.data()

    // 5. Verify ownership
    if (lessonData?.creatorUid !== uid) {
      return NextResponse.json(
        { error: 'You can only delete your own lessons' },
        { status: 403 }
      )
    }

    // 6. Delete lesson
    await adminDb.collection('content').doc(lessonId).delete()

    // 7. Update coach's lesson count
    await adminDb.collection('users').doc(uid).update({
      lessonCount: Math.max(0, (userData?.lessonCount || 1) - 1)
    })

    return NextResponse.json({
      success: true,
      message: 'Lesson deleted successfully'
    })

  } catch (error: any) {
    console.error('Error deleting lesson:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
