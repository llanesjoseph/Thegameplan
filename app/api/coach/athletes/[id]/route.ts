import { NextRequest, NextResponse } from 'next/server'
import { auth, adminDb } from '@/lib/firebase.admin'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get auth token from request
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized - no token provided' },
        { status: 401 }
      )
    }

    const token = authHeader.split('Bearer ')[1]

    // Verify the token
    let decodedToken
    try {
      decodedToken = await auth.verifyIdToken(token)
    } catch (error) {
      console.error('Token verification failed:', error)
      return NextResponse.json(
        { error: 'Unauthorized - invalid token' },
        { status: 401 }
      )
    }

    const userId = decodedToken.uid
    const athleteId = params.id

    // Get the user's role to ensure they're a coach
    const userDoc = await adminDb.collection('users').doc(userId).get()
    const userData = userDoc.data()
    const userRole = userData?.role || userData?.roles?.[0] || 'athlete'

    if (!['coach', 'admin', 'superadmin'].includes(userRole)) {
      return NextResponse.json(
        { error: 'Forbidden - coach access required' },
        { status: 403 }
      )
    }

    // Get athlete data
    const athleteDoc = await adminDb.collection('users').doc(athleteId).get()

    if (!athleteDoc.exists) {
      return NextResponse.json(
        { error: 'Athlete not found' },
        { status: 404 }
      )
    }

    const athleteData = athleteDoc.data()

    // Verify this athlete belongs to this coach
    const coachId = athleteData?.coachId || athleteData?.assignedCoachId || athleteData?.creatorUid
    if (coachId !== userId && !['admin', 'superadmin'].includes(userRole)) {
      return NextResponse.json(
        { error: 'You do not have access to this athlete' },
        { status: 403 }
      )
    }

    // Get athlete's feed data
    const feedDoc = await adminDb.collection('athlete_feed').doc(athleteId).get()
    const feedData = feedDoc.exists ? feedDoc.data() : null

    // Get lesson progress details
    const availableLessons = feedData?.availableLessons || []
    const completedLessons = feedData?.completedLessons || []

    // Get lesson details
    const lessonDetails = []
    for (const lessonId of availableLessons) {
      const lessonDoc = await adminDb.collection('content').doc(lessonId).get()
      if (lessonDoc.exists) {
        lessonDetails.push({
          id: lessonDoc.id,
          title: lessonDoc.data()?.title || 'Untitled',
          description: lessonDoc.data()?.description || '',
          isCompleted: completedLessons.includes(lessonId),
          createdAt: lessonDoc.data()?.createdAt?.toDate?.()?.toISOString() || null
        })
      }
    }

    // Get video review requests
    const videoReviewsSnapshot = await adminDb
      .collection('videoReviews')
      .where('athleteId', '==', athleteId)
      .orderBy('createdAt', 'desc')
      .limit(5)
      .get()

    const videoReviews = videoReviewsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || null
    }))

    // Get live session requests
    const liveSessionsSnapshot = await adminDb
      .collection('liveSessionRequests')
      .where('athleteId', '==', athleteId)
      .orderBy('createdAt', 'desc')
      .limit(5)
      .get()

    const liveSessions = liveSessionsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || null
    }))

    // Calculate stats
    const completionRate = availableLessons.length > 0
      ? Math.round((completedLessons.length / availableLessons.length) * 100)
      : 0

    const athlete = {
      id: athleteDoc.id,
      displayName: athleteData?.displayName || athleteData?.name || 'Unknown Athlete',
      email: athleteData?.email || '',
      photoURL: athleteData?.photoURL || null,
      sport: athleteData?.sport || athleteData?.preferredSports?.[0] || 'Unknown',
      role: athleteData?.role || 'athlete',
      createdAt: athleteData?.createdAt?.toDate?.()?.toISOString() || null,
      lastLoginAt: athleteData?.lastLoginAt?.toDate?.()?.toISOString() || null,
      stats: {
        totalLessons: availableLessons.length,
        completedLessons: completedLessons.length,
        completionRate,
        videoReviews: videoReviews.length,
        liveSessions: liveSessions.length
      },
      lessons: lessonDetails,
      recentVideoReviews: videoReviews,
      recentLiveSessions: liveSessions
    }

    return NextResponse.json({
      success: true,
      athlete
    })

  } catch (error: any) {
    console.error('Error fetching athlete details:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch athlete details' },
      { status: 500 }
    )
  }
}
