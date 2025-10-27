import { NextRequest, NextResponse } from 'next/server'
import { auth, adminDb } from '@/lib/firebase.admin'

// Force dynamic rendering for API route
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

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

    // Get live session requests (with error handling)
    let liveSessions: any[] = []
    try {
      const liveSessionsSnapshot = await adminDb
        .collection('liveSessionRequests')
        .where('athleteId', '==', athleteId)
        .orderBy('createdAt', 'desc')
        .limit(5)
        .get()

      liveSessions = liveSessionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || null
      }))
    } catch (error) {
      console.warn('Could not fetch live sessions (collection may not exist or index missing):', error)
    }

    // Calculate stats
    const completionRate = availableLessons.length > 0
      ? Math.round((completedLessons.length / availableLessons.length) * 100)
      : 0

    // Get AI questions count
    let aiQuestionsAsked = 0
    try {
      const aiConversationsSnapshot = await adminDb
        .collection('ai_conversations')
        .where('userId', '==', athleteId)
        .get()

      aiConversationsSnapshot.docs.forEach(doc => {
        const messages = doc.data()?.messages || []
        aiQuestionsAsked += messages.filter((m: any) => m.role === 'user').length
      })
    } catch (error) {
      console.warn('Could not fetch AI questions:', error)
    }

    // Get messages count
    let totalMessages = 0
    try {
      const messagesSnapshot = await adminDb
        .collection('messages')
        .where('athleteId', '==', athleteId)
        .get()
      totalMessages = messagesSnapshot.size
    } catch (error) {
      console.warn('Could not fetch messages:', error)
    }

    const athlete = {
      id: athleteDoc.id,
      displayName: athleteData?.displayName || athleteData?.name || 'Unknown Athlete',
      firstName: athleteData?.firstName || '',
      lastName: athleteData?.lastName || '',
      email: athleteData?.email || '',
      photoURL: athleteData?.photoURL || null,
      sport: athleteData?.sport || athleteData?.preferredSports?.[0] || 'Unknown',
      primarySport: athleteData?.primarySport || athleteData?.sport || athleteData?.preferredSports?.[0] || 'Unknown',
      skillLevel: athleteData?.skillLevel || athleteData?.experienceLevel || 'beginner',
      trainingGoals: athleteData?.trainingGoals || athleteData?.goals || [],
      achievements: athleteData?.achievements || [],
      learningStyle: athleteData?.learningStyle || athleteData?.preferredLearningStyle || 'visual',
      availability: Array.isArray(athleteData?.availability) ? athleteData.availability : [],
      specialNotes: athleteData?.specialNotes || athleteData?.notes || '',
      role: athleteData?.role || 'athlete',
      status: athleteData?.status || 'active',
      createdAt: athleteData?.createdAt?.toDate?.()?.toISOString() || null,
      lastLoginAt: athleteData?.lastLoginAt?.toDate?.()?.toISOString() || null,
      stats: {
        totalLessons: availableLessons.length,
        completedLessons: completedLessons.length,
        completionRate,
        liveSessions: liveSessions.length
      },
      lessons: lessonDetails,
      recentLiveSessions: liveSessions
    }

    // Build analytics object for athlete profile dashboard
    const analytics = {
      totalLessons: availableLessons.length,
      completedLessons: completedLessons.length,
      completionRate,
      lastActivity: athleteData?.lastLoginAt?.toDate?.()?.toISOString() || null,
      aiQuestionsAsked,
      averageEngagement: completionRate, // Use completion rate as engagement metric
      sessionRequestsPending: liveSessions.filter((s: any) => s.status === 'pending').length,
      sessionRequestsCompleted: liveSessions.filter((s: any) => s.status === 'completed').length,
      totalMessages,
      messagesLastWeek: 0, // TODO: implement if needed
      contentByType: {
        lessons: availableLessons.length,
        videos: 0, // TODO: implement if needed
        articles: 0 // TODO: implement if needed
      },
      engagementTrend: completionRate > 50 ? 'up' : completionRate > 0 ? 'stable' : 'down',
      weeklyActivity: [0, 0, 0, 0, 0, 0, 0] // TODO: implement weekly breakdown
    }

    return NextResponse.json({
      success: true,
      athlete,
      analytics // Add analytics for athlete profile page compatibility
    })

  } catch (error: any) {
    console.error('Error fetching athlete details:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch athlete details' },
      { status: 500 }
    )
  }
}
