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

    // Get AI questions count from chatConversations
    let aiQuestionsAsked = 0
    try {
      const chatConversationsSnapshot = await adminDb
        .collection('chatConversations')
        .where('userId', '==', athleteId)
        .get()

      // For each conversation, count user messages
      for (const convDoc of chatConversationsSnapshot.docs) {
        try {
          const messagesSnapshot = await adminDb
            .collection('chatConversations')
            .doc(convDoc.id)
            .collection('messages')
            .where('type', '==', 'user')
            .get()

          aiQuestionsAsked += messagesSnapshot.size
        } catch (msgError) {
          console.warn(`Could not fetch messages for conversation ${convDoc.id}:`, msgError)
        }
      }
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

    // Get video submissions count - only count submissions assigned to THIS coach
    let videoSubmissionsCount = 0
    let pendingReviewsCount = 0
    try {
      const submissionsSnapshot = await adminDb
        .collection('submissions')
        .where('athleteId', '==', athleteId)
        .where('assignedCoachId', '==', userId)
        .get()

      videoSubmissionsCount = submissionsSnapshot.size
      // Use same status filter as /api/coach/submissions (awaiting = not complete/reviewed)
      pendingReviewsCount = submissionsSnapshot.docs.filter(doc => {
        const status = doc.data().status
        return !['complete', 'reviewed'].includes(status)
      }).length
    } catch (error) {
      console.warn('Could not fetch video submissions:', error)
    }

    // Calculate days since account created
    let daysSinceJoined = 0
    if (athleteData?.createdAt) {
      const createdDate = athleteData.createdAt.toDate?.() || new Date(athleteData.createdAt)
      const daysDiff = Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24))
      daysSinceJoined = daysDiff
    }

    // Calculate activity streak (days since last activity)
    // Check multiple sources: login, chat conversations, messages, lessons
    let daysSinceLastActive = null
    let lastActivityDate: Date | null = null

    // Check login time
    if (athleteData?.lastLoginAt) {
      const loginDate = athleteData.lastLoginAt.toDate?.() || new Date(athleteData.lastLoginAt)
      lastActivityDate = loginDate
      console.log(`✅ Found lastLoginAt: ${loginDate}`)
    }

    // Check chat conversation activity
    try {
      const recentChatsSnapshot = await adminDb
        .collection('chatConversations')
        .where('userId', '==', athleteId)
        .orderBy('updatedAt', 'desc')
        .limit(1)
        .get()

      if (!recentChatsSnapshot.empty) {
        const chatDate = recentChatsSnapshot.docs[0].data()?.updatedAt?.toDate?.()
        if (chatDate && (!lastActivityDate || chatDate > lastActivityDate)) {
          lastActivityDate = chatDate
          console.log(`✅ Found chat activity: ${chatDate}`)
        }
      }
    } catch (error) {
      // Index might not exist, continue
      console.warn('Could not check chat activity:', error)
    }

    // Check message activity
    try {
      const recentMessagesSnapshot = await adminDb
        .collection('messages')
        .where('senderId', '==', athleteId)
        .orderBy('createdAt', 'desc')
        .limit(1)
        .get()

      if (!recentMessagesSnapshot.empty) {
        const msgDate = recentMessagesSnapshot.docs[0].data()?.createdAt?.toDate?.()
        if (msgDate && (!lastActivityDate || msgDate > lastActivityDate)) {
          lastActivityDate = msgDate
          console.log(`✅ Found message activity: ${msgDate}`)
        }
      }
    } catch (error) {
      console.warn('Could not check message activity:', error)
    }

    // Fallback: Use createdAt if no activity found but user exists
    if (!lastActivityDate && athleteData?.createdAt) {
      const createdDate = athleteData.createdAt.toDate?.() || new Date(athleteData.createdAt)
      lastActivityDate = createdDate
      console.log(`⚠️ No activity found, using createdAt as fallback: ${createdDate}`)
    }

    // Calculate days since last activity
    if (lastActivityDate) {
      daysSinceLastActive = Math.floor((Date.now() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24))
      console.log(`📊 daysSinceLastActive calculated: ${daysSinceLastActive} days`)
    } else {
      console.warn('⚠️ No lastActivityDate found - will show "Never"')
    }

    // Build analytics object for athlete profile dashboard
    const analytics = {
      totalLessons: availableLessons.length,
      completedLessons: completedLessons.length,
      completionRate,
      lastActivity: athleteData?.lastLoginAt?.toDate?.()?.toISOString() || null,
      daysSinceLastActive,
      daysSinceJoined,
      aiQuestionsAsked,
      averageEngagement: completionRate, // Use completion rate as engagement metric
      sessionRequestsPending: liveSessions.filter((s: any) => s.status === 'pending').length,
      sessionRequestsCompleted: liveSessions.filter((s: any) => s.status === 'completed').length,
      totalMessages,
      messagesLastWeek: 0, // TODO: implement time-based filtering
      videoSubmissions: videoSubmissionsCount,
      pendingReviews: pendingReviewsCount,
      contentByType: {
        lessons: availableLessons.length,
        videos: videoSubmissionsCount,
        articles: 0 // TODO: implement if articles are tracked separately
      },
      engagementTrend: completionRate > 50 ? 'up' : completionRate > 0 ? 'stable' : 'down',
      weeklyActivity: [0, 0, 0, 0, 0, 0, 0], // TODO: implement weekly breakdown
      // Messaging status for UI
      messagingEnabled: athleteData?.messagingEnabled === true
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
