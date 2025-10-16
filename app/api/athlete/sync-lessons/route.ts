import { NextRequest, NextResponse } from 'next/server'
import { auth, adminDb } from '@/lib/firebase.admin'
import { FieldValue } from 'firebase-admin/firestore'

// Force dynamic rendering for API route
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * POST /api/athlete/sync-lessons
 * Manually sync all published lessons from coach to athlete's feed
 * Use this when lessons count appears incorrect
 */
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

    const userId = decodedToken.uid

    // 2. Get user data
    const userDoc = await adminDb.collection('users').doc(userId).get()

    if (!userDoc.exists) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const userData = userDoc.data()

    if (userData?.role !== 'athlete') {
      return NextResponse.json(
        { error: 'Only athletes can sync lessons' },
        { status: 403 }
      )
    }

    const coachId = userData?.coachId || userData?.assignedCoachId

    if (!coachId) {
      return NextResponse.json({
        success: true,
        message: 'No coach assigned',
        lessonCount: 0,
        lessons: []
      })
    }

    // 3. Get all published lessons from coach
    const lessonsSnapshot = await adminDb
      .collection('content')
      .where('creatorUid', '==', coachId)
      .where('status', '==', 'published')
      .get()

    const availableLessons = lessonsSnapshot.docs.map(doc => doc.id)

    console.log(`📚 Found ${availableLessons.length} published lessons for coach ${coachId}`)

    // 4. Get existing athlete feed to preserve completion data
    const feedDoc = await adminDb.collection('athlete_feed').doc(userId).get()
    const existingCompletedLessons = feedDoc.exists ? (feedDoc.data()?.completedLessons || []) : []

    // 5. Update athlete feed with all lessons
    await adminDb.collection('athlete_feed').doc(userId).set({
      athleteId: userId,
      coachId,
      availableLessons,
      completedLessons: existingCompletedLessons,
      totalLessons: availableLessons.length,
      completionRate: availableLessons.length > 0
        ? Math.round((existingCompletedLessons.length / availableLessons.length) * 100)
        : 0,
      updatedAt: FieldValue.serverTimestamp()
    }, { merge: true })

    console.log(`✅ Synced ${availableLessons.length} lessons for athlete ${userId}`)

    return NextResponse.json({
      success: true,
      message: `Successfully synced ${availableLessons.length} lessons from your coach`,
      lessonCount: availableLessons.length,
      completedCount: existingCompletedLessons.length
    })

  } catch (error: any) {
    console.error('❌ Error syncing lessons:', error)
    return NextResponse.json(
      {
        error: error.message || 'Failed to sync lessons',
        details: error.code || error.name
      },
      { status: 500 }
    )
  }
}
