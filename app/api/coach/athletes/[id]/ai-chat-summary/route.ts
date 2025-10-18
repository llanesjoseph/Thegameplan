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
    const detailedConversations = []
    let totalQuestions = 0
    let totalResponses = 0
    const topicsMap = new Map<string, number>()
    const recentQuestions: string[] = []
    const allQuestions: Array<{question: string, timestamp: string, conversationTitle: string}> = []

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

      const conversationTitle = convData.title || 'Untitled Conversation'

      // Extract topics from user questions (simple keyword extraction)
      userMessages.forEach(msg => {
        const content = msg.content.toLowerCase()

        // Add to recent questions (last 10)
        if (recentQuestions.length < 10) {
          recentQuestions.push(msg.content)
        }

        // Add to all questions with metadata
        allQuestions.push({
          question: msg.content,
          timestamp: msg.createdAt || '',
          conversationTitle
        })

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

        // More specific technique keywords
        if (content.includes('choke') || content.includes('submission') || content.includes('guard') ||
            content.includes('pass') || content.includes('sweep') || content.includes('escape')) {
          topicsMap.set('BJJ/Grappling Techniques', (topicsMap.get('BJJ/Grappling Techniques') || 0) + 1)
        }
      })

      // Store detailed conversation info
      detailedConversations.push({
        id: convDoc.id,
        title: conversationTitle,
        createdAt: convData.createdAt?.toDate?.()?.toISOString() || null,
        lastActivity: convData.updatedAt?.toDate?.()?.toISOString() || convData.createdAt?.toDate?.()?.toISOString() || null,
        messageCount: messages.length,
        userQuestions: userMessages.length,
        aiResponses: assistantMessages.length,
        messages: messages.slice(0, 10).map(m => ({
          role: m.role,
          content: m.content.length > 200 ? m.content.substring(0, 200) + '...' : m.content,
          timestamp: m.createdAt
        }))
      })

      conversations.push({
        id: convDoc.id,
        title: conversationTitle,
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

    // Generate verbal summary for coach
    let verbalSummary = ''
    if (totalQuestions === 0) {
      verbalSummary = `${athleteData?.displayName || 'This athlete'} hasn't asked the AI assistant any questions yet. Encourage them to use the AI chat for technique questions, training advice, and personalized guidance between coaching sessions.`
    } else {
      const topTopic = topics[0]
      const engagementLevel = totalQuestions > 50 ? 'very actively' : totalQuestions > 20 ? 'regularly' : totalQuestions > 10 ? 'occasionally' : 'a few times'

      verbalSummary = `${athleteData?.displayName || 'This athlete'} has been ${engagementLevel} engaging with the AI assistant, asking ${totalQuestions} question${totalQuestions !== 1 ? 's' : ''} across ${conversations.length} conversation${conversations.length !== 1 ? 's' : ''}.`

      if (topTopic) {
        verbalSummary += ` Their primary focus has been on "${topTopic.topic}" (${topTopic.count} question${topTopic.count !== 1 ? 's' : ''}).`
      }

      if (topics.length > 1) {
        const otherTopics = topics.slice(1, 3).map(t => t.topic)
        if (otherTopics.length > 0) {
          verbalSummary += ` They've also shown interest in ${otherTopics.join(' and ')}.`
        }
      }

      if (recentQuestions.length > 0) {
        verbalSummary += ` Recent questions include topics like: "${recentQuestions[0].substring(0, 100)}${recentQuestions[0].length > 100 ? '...' : ''}"`
      }

      verbalSummary += ` Last activity was on ${lastActivityDate}. Consider reviewing their questions to identify areas where you might provide additional personalized coaching or create targeted lessons.`
    }

    const summary = {
      totalConversations: conversations.length,
      totalQuestions,
      totalResponses,
      avgQuestionsPerConversation,
      lastActivity: lastActivityDate,
      topTopics: topics.slice(0, 5),
      recentQuestions: recentQuestions.slice(0, 10),
      conversations: conversations.slice(0, 10),
      detailedConversations: detailedConversations.slice(0, 5),
      allQuestions: allQuestions.slice(0, 50),
      verbalSummary,
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
