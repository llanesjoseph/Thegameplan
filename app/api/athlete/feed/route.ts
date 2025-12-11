import { NextRequest, NextResponse } from 'next/server'
import { auth, adminDb } from '@/lib/firebase.admin'
import { FieldPath } from 'firebase-admin/firestore'

// Force dynamic rendering for API route
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

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

    // 3. Get all followed coaches
    const followsSnapshot = await adminDb
      .collection('coach_followers')
      .where('athleteId', '==', athleteId)
      .get()

    const followedCoachIds = followsSnapshot.docs.map(doc => doc.data().coachId)

    // Add assigned coach if exists (for backwards compatibility)
    const assignedCoachId = userData?.coachId || userData?.assignedCoachId
    if (assignedCoachId && !followedCoachIds.includes(assignedCoachId)) {
      followedCoachIds.push(assignedCoachId)
    }

    if (followedCoachIds.length === 0) {
      return NextResponse.json({
        success: true,
        feed: {
          athleteId,
          coachIds: [],
          coaches: [],
          availableLessons: [],
          assignedLessons: [],
          completedLessons: [],
          totalLessons: 0,
          completionRate: 0,
          message: 'No coaches followed yet. Browse coaches to get started.'
        },
        lessons: [],
        count: 0
      })
    }

    // 4. Fetch athlete feed document for completion tracking
    const feedDoc = await adminDb.collection('athlete_feed').doc(athleteId).get()
    const feedData = feedDoc.exists ? feedDoc.data() : {}
    const completedLessonIds = feedData?.completedLessons || []

    // 5. Fetch lessons from all followed coaches
    const allLessons: any[] = []

    for (const coachId of followedCoachIds) {
      try {
        // Get all published lessons from this coach (using creatorUid, not creatorId)
        const lessonsSnapshot = await adminDb
          .collection('content')
          .where('creatorUid', '==', coachId)
          .where('status', '==', 'published')
          .orderBy('createdAt', 'desc')
          .limit(50) // Limit per coach to prevent overload
          .get()

        lessonsSnapshot.docs.forEach(doc => {
          const lessonData = doc.data()
          allLessons.push({
            id: doc.id,
            ...lessonData,
            createdAt: lessonData.createdAt?.toDate?.()?.toISOString() || null,
            updatedAt: lessonData.updatedAt?.toDate?.()?.toISOString() || null,
            isCompleted: completedLessonIds.includes(doc.id),
            coachId: coachId
          })
        })
      } catch (error) {
        console.error(`Error fetching lessons for coach ${coachId}:`, error)
      }
    }

    // 6. Get coach information for all followed coaches
    const coaches: any[] = []
    for (const coachId of followedCoachIds) {
      try {
        const coachDoc = await adminDb.collection('users').doc(coachId).get()
        if (coachDoc.exists) {
          const coachData = coachDoc.data()
          coaches.push({
            id: coachId,
            displayName: coachData?.displayName || coachData?.email || 'Coach',
            email: coachData?.email || null,
            photoURL: coachData?.photoURL || coachData?.profileImageUrl || null
          })
        }
      } catch (error) {
        console.error(`Error fetching coach info for ${coachId}:`, error)
      }
    }

    // 7. Sort all lessons by creation date, newest first
    const sortedLessons = allLessons.sort((a, b) => {
      const dateA = new Date(a.createdAt || 0).getTime()
      const dateB = new Date(b.createdAt || 0).getTime()
      return dateB - dateA
    })

    return NextResponse.json({
      success: true,
      feed: {
        athleteId,
        coachIds: followedCoachIds,
        coaches,
        availableLessons: sortedLessons.map(l => l.id),
        assignedLessons: feedData?.assignedLessons || [],
        completedLessons: completedLessonIds,
        totalLessons: sortedLessons.length,
        completionRate: sortedLessons.length > 0
          ? Math.round((completedLessonIds.length / sortedLessons.length) * 100)
          : 0,
        unreadAnnouncements: feedData?.unreadAnnouncements || 0,
        lastActivity: feedData?.lastActivity?.toDate?.()?.toISOString() || null,
        updatedAt: new Date().toISOString()
      },
      lessons: sortedLessons,
      count: sortedLessons.length
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
