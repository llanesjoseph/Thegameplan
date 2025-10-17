import { NextRequest, NextResponse } from 'next/server'
import { auth, adminDb } from '@/lib/firebase.admin'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Await params if it's a Promise (Next.js 15+)
    const resolvedParams = params instanceof Promise ? await params : params
    const athleteId = resolvedParams.id

    // Get auth token
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const token = authHeader.split('Bearer ')[1]
    const decodedToken = await auth.verifyIdToken(token)
    const userId = decodedToken.uid

    // Verify coach access
    const userDoc = await adminDb.collection('users').doc(userId).get()
    const userData = userDoc.data()
    const userRole = userData?.role || 'athlete'

    if (!['coach', 'admin', 'superadmin'].includes(userRole)) {
      return NextResponse.json(
        { error: 'Forbidden - coach access required' },
        { status: 403 }
      )
    }

    // Verify athlete belongs to this coach
    const athleteDoc = await adminDb.collection('users').doc(athleteId).get()
    if (!athleteDoc.exists) {
      return NextResponse.json(
        { error: 'Athlete not found' },
        { status: 404 }
      )
    }

    const athleteData = athleteDoc.data()
    const coachId = athleteData?.coachId || athleteData?.assignedCoachId || athleteData?.creatorUid

    if (coachId !== userId && !['admin', 'superadmin'].includes(userRole)) {
      return NextResponse.json(
        { error: 'Access denied to this athlete' },
        { status: 403 }
      )
    }

    // Fetch AI chat conversations with error handling
    let conversationsSnapshot
    try {
      // Try with orderBy first
      conversationsSnapshot = await adminDb
        .collection('chatConversations')
        .where('userId', '==', athleteId)
        .orderBy('createdAt', 'desc')
        .limit(50)
        .get()
    } catch (indexError: any) {
      // If index error, try without orderBy
      console.log('Index not found, fetching without orderBy:', indexError.message)
      conversationsSnapshot = await adminDb
        .collection('chatConversations')
        .where('userId', '==', athleteId)
        .limit(50)
        .get()
    }

    const conversations = []
    let totalQuestions = 0
    let totalResponses = 0
    const topicsMap = new Map<string, number>()
    const recentQuestions: string[] = []

    for (const convDoc of conversationsSnapshot.docs) {
      const convData = convDoc.data()

      // Get messages from this conversation with error handling
      let messagesSnapshot
      try {
        messagesSnapshot = await adminDb
          .collection('chatConversations')
          .doc(convDoc.id)
          .collection('messages')
          .orderBy('createdAt', 'asc')
          .get()
      } catch (msgError: any) {
        console.log('Error fetching messages for conversation', convDoc.id, ':', msgError.message)
        // Try without orderBy
        messagesSnapshot = await adminDb
          .collection('chatConversations')
          .doc(convDoc.id)
          .collection('messages')
          .get()
      }

      const messages = messagesSnapshot.docs.map(msgDoc => ({
        role: msgDoc.data().role,
        content: msgDoc.data().content,
        createdAt: msgDoc.data().createdAt?.toDate?.()?.toISOString() || null
      }))

      // Count questions and responses
      const userMessages = messages.filter(m => m.role === 'user')
      const assistantMessages = messages.filter(m => m.role === 'assistant')

      totalQuestions += userMessages.length
      totalResponses += assistantMessages.length

      // Extract topics from user questions (simple keyword extraction)
      userMessages.forEach(msg => {
        const content = msg.content.toLowerCase()

        // Add to recent questions (last 10)
        if (recentQuestions.length < 10) {
          recentQuestions.push(msg.content)
        }

        // Simple topic detection based on keywords
        if (content.includes('technique') || content.includes('form') || content.includes('how to')) {
          topicsMap.set('Technique & Form', (topicsMap.get('Technique & Form') || 0) + 1)
        }
        if (content.includes('workout') || content.includes('training') || content.includes('exercise')) {
          topicsMap.set('Training & Workouts', (topicsMap.get('Training & Workouts') || 0) + 1)
        }
        if (content.includes('nutrition') || content.includes('diet') || content.includes('eat')) {
          topicsMap.set('Nutrition & Diet', (topicsMap.get('Nutrition & Diet') || 0) + 1)
        }
        if (content.includes('injury') || content.includes('pain') || content.includes('recovery')) {
          topicsMap.set('Injury & Recovery', (topicsMap.get('Injury & Recovery') || 0) + 1)
        }
        if (content.includes('mental') || content.includes('mindset') || content.includes('confidence')) {
          topicsMap.set('Mental Game', (topicsMap.get('Mental Game') || 0) + 1)
        }
        if (content.includes('competition') || content.includes('game') || content.includes('match')) {
          topicsMap.set('Competition Strategy', (topicsMap.get('Competition Strategy') || 0) + 1)
        }
        if (content.includes('goal') || content.includes('improve') || content.includes('better')) {
          topicsMap.set('Goals & Improvement', (topicsMap.get('Goals & Improvement') || 0) + 1)
        }
        if (content.includes('video') || content.includes('watch') || content.includes('review')) {
          topicsMap.set('Video Analysis', (topicsMap.get('Video Analysis') || 0) + 1)
        }
      })

      conversations.push({
        id: convDoc.id,
        title: convData.title || 'Untitled Conversation',
        createdAt: convData.createdAt?.toDate?.()?.toISOString() || null,
        messageCount: messages.length,
        userQuestions: userMessages.length,
        aiResponses: assistantMessages.length,
        lastActivity: convData.updatedAt?.toDate?.()?.toISOString() || convData.createdAt?.toDate?.()?.toISOString() || null
      })
    }

    // Convert topics map to sorted array
    const topics = Array.from(topicsMap.entries())
      .map(([topic, count]) => ({ topic, count }))
      .sort((a, b) => b.count - a.count)

    // Calculate engagement metrics
    const avgQuestionsPerConversation = conversations.length > 0
      ? Math.round(totalQuestions / conversations.length)
      : 0

    const lastActivityDate = conversations.length > 0 && conversations[0].lastActivity
      ? new Date(conversations[0].lastActivity).toLocaleDateString()
      : 'No activity yet'

    const summary = {
      totalConversations: conversations.length,
      totalQuestions,
      totalResponses,
      avgQuestionsPerConversation,
      lastActivity: lastActivityDate,
      topTopics: topics.slice(0, 5),
      recentQuestions: recentQuestions.slice(0, 10),
      conversations: conversations.slice(0, 10),
      engagementLevel: totalQuestions > 50 ? 'High' : totalQuestions > 20 ? 'Medium' : totalQuestions > 0 ? 'Low' : 'None'
    }

    return NextResponse.json({
      success: true,
      summary
    })

  } catch (error: any) {
    console.error('Error fetching AI chat summary:', error)

    // Try to get athleteId for logging (params might not be available in catch)
    let athleteIdForLog = 'unknown'
    try {
      const resolvedParams = params instanceof Promise ? await params : params
      athleteIdForLog = resolvedParams.id
    } catch {}

    console.error('Error details:', {
      message: error.message,
      code: error.code,
      stack: error.stack,
      athleteId: athleteIdForLog
    })

    return NextResponse.json(
      {
        error: error.message || 'Failed to fetch AI chat summary',
        details: error.code || 'Unknown error'
      },
      { status: 500 }
    )
  }
}
