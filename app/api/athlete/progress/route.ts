import { NextRequest, NextResponse } from 'next/server'
import { auth, adminDb } from '@/lib/firebase.admin'
import { FieldValue } from 'firebase-admin/firestore'

// Force dynamic rendering for API route
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * POST /api/athlete/progress
 * Mark a lesson as complete for authenticated athlete
 *
 * Request body: { lessonId: string, action: 'complete' | 'uncomplete' }
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

    const athleteId = decodedToken.uid

    // 2. Verify user has athlete role
    const userDoc = await adminDb.collection('users').doc(athleteId).get()
    if (!userDoc.exists) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const userData = userDoc.data()
    const userRole = userData?.role || 'athlete'

    if (userRole !== 'athlete' && !['admin', 'superadmin'].includes(userRole)) {
      return NextResponse.json(
        { error: 'Only athletes can update progress' },
        { status: 403 }
      )
    }

    // 3. Parse request body
    const body = await request.json()
    const { lessonId, action = 'complete' } = body

    if (!lessonId) {
      return NextResponse.json(
        { error: 'lessonId is required' },
        { status: 400 }
      )
    }

    // 4. Verify lesson exists and athlete has access
    const lessonDoc = await adminDb.collection('content').doc(lessonId).get()
    if (!lessonDoc.exists) {
      return NextResponse.json(
        { error: 'Lesson not found' },
        { status: 404 }
      )
    }

    // 5. Verify athlete has this lesson in their feed
    const feedDoc = await adminDb.collection('athlete_feed').doc(athleteId).get()
    if (!feedDoc.exists) {
      return NextResponse.json(
        { error: 'Athlete feed not found. Please contact your coach.' },
        { status: 404 }
      )
    }

    const feedData = feedDoc.data()
    const availableLessons = feedData?.availableLessons || []

    if (!availableLessons.includes(lessonId)) {
      return NextResponse.json(
        { error: 'Lesson not available in your feed' },
        { status: 403 }
      )
    }

    // 6. Update completion status
    const feedRef = adminDb.collection('athlete_feed').doc(athleteId)

    if (action === 'complete') {
      // Add to completedLessons array (using arrayUnion for idempotency)
      await feedRef.update({
        completedLessons: FieldValue.arrayUnion(lessonId),
        lastActivity: FieldValue.serverTimestamp()
      })

      console.log(`✅ Athlete ${athleteId} marked lesson ${lessonId} as complete`)

      return NextResponse.json({
        success: true,
        message: 'Lesson marked as complete',
        lessonId,
        action: 'complete'
      })

    } else if (action === 'uncomplete') {
      // Remove from completedLessons array
      await feedRef.update({
        completedLessons: FieldValue.arrayRemove(lessonId),
        lastActivity: FieldValue.serverTimestamp()
      })

      console.log(`✅ Athlete ${athleteId} unmarked lesson ${lessonId}`)

      return NextResponse.json({
        success: true,
        message: 'Lesson marked as incomplete',
        lessonId,
        action: 'uncomplete'
      })

    } else {
      return NextResponse.json(
        { error: 'Invalid action. Must be "complete" or "uncomplete"' },
        { status: 400 }
      )
    }

  } catch (error: any) {
    console.error('❌ Error updating lesson progress:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    })
    return NextResponse.json(
      {
        error: error.message || 'Internal server error',
        details: error.code || error.name
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/athlete/progress
 * Get progress statistics for authenticated athlete
 */
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

    const athleteId = decodedToken.uid

    // 2. Verify user has athlete role
    const userDoc = await adminDb.collection('users').doc(athleteId).get()
    if (!userDoc.exists) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const userData = userDoc.data()
    const userRole = userData?.role || 'athlete'

    if (userRole !== 'athlete' && !['admin', 'superadmin'].includes(userRole)) {
      return NextResponse.json(
        { error: 'Only athletes can view progress' },
        { status: 403 }
      )
    }

    // 3. Fetch athlete feed for progress data
    const feedDoc = await adminDb.collection('athlete_feed').doc(athleteId).get()

    if (!feedDoc.exists) {
      return NextResponse.json({
        success: true,
        progress: {
          totalLessons: 0,
          completedLessons: 0,
          completionRate: 0,
          inProgressLessons: 0,
          message: 'No lessons assigned yet'
        }
      })
    }

    const feedData = feedDoc.data()
    const totalLessons = feedData?.totalLessons || 0
    const completedCount = (feedData?.completedLessons || []).length
    const completionRate = feedData?.completionRate || 0
    const inProgressLessons = totalLessons - completedCount

    return NextResponse.json({
      success: true,
      progress: {
        totalLessons,
        completedLessons: completedCount,
        completionRate,
        inProgressLessons,
        lastActivity: feedData?.lastActivity?.toDate?.()?.toISOString() || null,
        coachId: feedData?.coachId || null
      }
    })

  } catch (error: any) {
    console.error('❌ Error fetching athlete progress:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    })
    return NextResponse.json(
      {
        error: error.message || 'Internal server error',
        details: error.code || error.name
      },
      { status: 500 }
    )
  }
}
