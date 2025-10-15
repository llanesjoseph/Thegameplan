import { NextRequest, NextResponse } from 'next/server'
import { auth, adminDb } from '@/lib/firebase.admin'
import { logMessage } from '@/lib/message-audit-logger'
import { FieldValue } from 'firebase-admin/firestore'

/**
 * Send Message API with Audit Logging and Conversations
 *
 * All messages are logged for safety and accountability
 */
export async function POST(request: NextRequest) {
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
    const body = await request.json()
    const { conversationId, recipientId, text, content } = body

    const messageText = text || content

    if (!messageText || messageText.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message text is required' },
        { status: 400 }
      )
    }

    if (messageText.length > 2000) {
      return NextResponse.json(
        { error: 'Message too long (max 2000 characters)' },
        { status: 400 }
      )
    }

    // Get sender info
    const senderDoc = await adminDb.collection('users').doc(userId).get()
    const senderData = senderDoc.data()

    if (!senderData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    let finalConversationId = conversationId

    // If no conversation ID, create or find existing conversation
    if (!conversationId && recipientId) {
      // Check if both users have messaging enabled
      const recipientDoc = await adminDb.collection('users').doc(recipientId).get()
      const recipientData = recipientDoc.data()

      if (!senderData.messagingEnabled) {
        return NextResponse.json(
          { error: 'You must enable messaging in your settings first' },
          { status: 403 }
        )
      }

      if (!recipientData?.messagingEnabled) {
        return NextResponse.json(
          { error: 'Recipient has not enabled messaging' },
          { status: 403 }
        )
      }

      // Try to find existing conversation
      const existingConversations = await adminDb
        .collection('conversations')
        .where('participants', 'array-contains', userId)
        .get()

      let existingConversation: FirebaseFirestore.QueryDocumentSnapshot | null = null
      existingConversations.docs.forEach(doc => {
        const data = doc.data()
        if (data.participants.length === 2 && data.participants.includes(recipientId)) {
          existingConversation = doc
        }
      })

      if (existingConversation) {
        finalConversationId = existingConversation.id
      } else {
        // Create new conversation
        const newConversation = {
          participants: [userId, recipientId],
          participantDetails: {
            [userId]: {
              displayName: senderData.displayName || senderData.email || 'Unknown',
              email: senderData.email || '',
              photoURL: senderData.photoURL || null,
              role: senderData.role || 'user',
              messagingEnabled: true
            },
            [recipientId]: {
              displayName: recipientData.displayName || recipientData.email || 'Unknown',
              email: recipientData.email || '',
              photoURL: recipientData.photoURL || null,
              role: recipientData.role || 'user',
              messagingEnabled: true
            }
          },
          lastMessage: null,
          unreadCount: {
            [userId]: 0,
            [recipientId]: 0
          },
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp()
        }

        const conversationRef = await adminDb.collection('conversations').add(newConversation)
        finalConversationId = conversationRef.id
      }
    }

    if (!finalConversationId) {
      return NextResponse.json(
        { error: 'Conversation ID or recipient ID required' },
        { status: 400 }
      )
    }

    // Verify user is participant
    const conversationDoc = await adminDb.collection('conversations').doc(finalConversationId).get()
    const conversationData = conversationDoc.data()

    if (!conversationData?.participants?.includes(userId)) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Create message
    const message = {
      conversationId: finalConversationId,
      senderId: userId,
      senderName: senderData.displayName || senderData.email || 'Unknown',
      senderRole: senderData.role || 'user',
      senderPhotoURL: senderData.photoURL || null,
      content: messageText.trim(),
      text: messageText.trim(), // Alias for backward compatibility
      createdAt: FieldValue.serverTimestamp(),
      timestamp: FieldValue.serverTimestamp(), // Alias for backward compatibility
      readBy: [userId], // Sender has read it by default
      read: false,
      participants: conversationData.participants
    }

    const messageRef = await adminDb.collection('messages').add(message)

    // Update conversation
    const otherParticipants = conversationData.participants.filter((id: string) => id !== userId)
    const unreadCount = conversationData.unreadCount || {}

    otherParticipants.forEach((participantId: string) => {
      unreadCount[participantId] = (unreadCount[participantId] || 0) + 1
    })

    await adminDb.collection('conversations').doc(finalConversationId).update({
      lastMessage: {
        text: messageText.trim().substring(0, 100),
        senderId: userId,
        senderName: message.senderName,
        timestamp: FieldValue.serverTimestamp()
      },
      unreadCount,
      updatedAt: FieldValue.serverTimestamp()
    })

    // Log to audit trail
    try {
      await logMessage({
        messageId: messageRef.id,
        senderId: userId,
        senderName: message.senderName,
        senderRole: message.senderRole,
        recipientId: otherParticipants[0],
        recipientName: conversationData.participantDetails?.[otherParticipants[0]]?.displayName || 'Unknown',
        recipientRole: conversationData.participantDetails?.[otherParticipants[0]]?.role || 'user',
        content: messageText.trim(),
        clientIP: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
        userAgent: request.headers.get('user-agent') || undefined
      })
    } catch (auditError) {
      console.warn('Failed to log message to audit trail:', auditError)
      // Don't fail the request if audit logging fails
    }

    return NextResponse.json({
      success: true,
      messageId: messageRef.id,
      conversationId: finalConversationId
    })

  } catch (error: any) {
    console.error('Error sending message:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to send message' },
      { status: 500 }
    )
  }
}
