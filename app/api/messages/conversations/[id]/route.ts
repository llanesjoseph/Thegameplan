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
    // Verify authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const token = authHeader.split('Bearer ')[1]
    let decodedToken
    try {
      decodedToken = await auth.verifyIdToken(token)
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    const userId = decodedToken.uid
    const conversationId = params.id

    // Get conversation
    const conversationDoc = await adminDb
      .collection('conversations')
      .doc(conversationId)
      .get()

    if (!conversationDoc.exists) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      )
    }

    const conversationData = conversationDoc.data()

    // Verify user is a participant
    if (!conversationData?.participants?.includes(userId)) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Get messages for this conversation
    const messagesSnapshot = await adminDb
      .collection('messages')
      .where('conversationId', '==', conversationId)
      .orderBy('createdAt', 'desc')
      .limit(100)
      .get()

    const messages = messagesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || null
    }))

    // Mark messages as read
    const batch = adminDb.batch()
    let unreadCount = conversationData?.unreadCount || {}

    messagesSnapshot.docs.forEach(doc => {
      const messageData = doc.data()
      if (messageData.senderId !== userId && !(messageData.readBy || []).includes(userId)) {
        batch.update(doc.ref, {
          readBy: [...(messageData.readBy || []), userId]
        })
      }
    })

    // Reset unread count for this user
    unreadCount[userId] = 0
    batch.update(conversationDoc.ref, { unreadCount })

    await batch.commit()

    return NextResponse.json({
      success: true,
      conversation: {
        id: conversationDoc.id,
        participants: conversationData.participants,
        participantDetails: conversationData.participantDetails,
        lastMessage: conversationData.lastMessage,
        createdAt: conversationData.createdAt?.toDate?.()?.toISOString() || null,
        updatedAt: conversationData.updatedAt?.toDate?.()?.toISOString() || null
      },
      messages: messages.reverse() // Oldest first for display
    })

  } catch (error: any) {
    console.error('Error fetching conversation:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch conversation' },
      { status: 500 }
    )
  }
}
