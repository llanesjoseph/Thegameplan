import { NextRequest, NextResponse } from 'next/server'
import { auth, adminDb } from '@/lib/firebase.admin'

/**
 * GET /api/athlete/feed
 * Fetches personalized lesson feed for authenticated athlete
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
        { error: 'Only athletes can access feed' },
        { status: 403 }
      )
    }

    // 3. Fetch athlete feed document
    const feedDoc = await adminDb.collection('athlete_feed').doc(athleteId).get()

    if (!feedDoc.exists) {
      // No feed exists yet - might be newly assigned athlete
      const coachId = userData?.coachId || userData?.assignedCoachId

      return NextResponse.json({
        success: true,
        feed: {
          athleteId,
          coachId: coachId || null,
          availableLessons: [],
          assignedLessons: [],
          completedLessons: [],
          totalLessons: 0,
          completionRate: 0,
          unreadAnnouncements: 0,
          message: 'No lessons available yet. Your coach will assign lessons soon.'
        }
      })
    }

    const feedData = feedDoc.data()

    // 4. Fetch full lesson details for available lessons
    const availableLessonIds = feedData?.availableLessons || []
    const lessons: any[] = []

    if (availableLessonIds.length > 0) {
      // Batch fetch lessons (Firestore has limit of 10 for 'in' queries, so chunk if needed)
      const chunkSize = 10
      for (let i = 0; i < availableLessonIds.length; i += chunkSize) {
        const chunk = availableLessonIds.slice(i, i + chunkSize)
        const lessonsSnapshot = await adminDb
          .collection('content')
          .where(adminDb.FieldPath.documentId(), 'in', chunk)
          .get()

        lessonsSnapshot.docs.forEach(doc => {
          const lessonData = doc.data()
          lessons.push({
            id: doc.id,
            ...lessonData,
            createdAt: lessonData.createdAt?.toDate?.()?.toISOString() || null,
            updatedAt: lessonData.updatedAt?.toDate?.()?.toISOString() || null,
            isCompleted: feedData?.completedLessons?.includes(doc.id) || false
          })
        })
      }
    }

    // 5. Get coach information
    const coachId = feedData?.coachId
    let coachInfo = null

    if (coachId) {
      const coachDoc = await adminDb.collection('users').doc(coachId).get()
      if (coachDoc.exists) {
        const coachData = coachDoc.data()
        coachInfo = {
          id: coachId,
          displayName: coachData?.displayName || coachData?.email || 'Your Coach',
          email: coachData?.email || null,
          photoURL: coachData?.photoURL || null
        }
      }
    }

    return NextResponse.json({
      success: true,
      feed: {
        athleteId,
        coachId: feedData?.coachId || null,
        coach: coachInfo,
        availableLessons: feedData?.availableLessons || [],
        assignedLessons: feedData?.assignedLessons || [],
        completedLessons: feedData?.completedLessons || [],
        totalLessons: feedData?.totalLessons || 0,
        completionRate: feedData?.completionRate || 0,
        unreadAnnouncements: feedData?.unreadAnnouncements || 0,
        lastActivity: feedData?.lastActivity?.toDate?.()?.toISOString() || null,
        updatedAt: feedData?.updatedAt?.toDate?.()?.toISOString() || null
      },
      lessons: lessons.sort((a, b) => {
        // Sort by creation date, newest first
        const dateA = new Date(a.createdAt || 0).getTime()
        const dateB = new Date(b.createdAt || 0).getTime()
        return dateB - dateA
      }),
      count: lessons.length
    })

  } catch (error: any) {
    console.error('❌ Error fetching athlete feed:', {
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
