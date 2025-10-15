import { NextRequest, NextResponse } from 'next/server'
import { auth, adminDb } from '@/lib/firebase.admin'

export async function GET(request: NextRequest) {
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

    // Check if user has messaging enabled
    const userDoc = await adminDb.collection('users').doc(userId).get()
    const userData = userDoc.data()

    if (!userData?.messagingEnabled) {
      return NextResponse.json({
        success: true,
        conversations: [],
        messagingEnabled: false,
        message: 'Messaging is not enabled for this user'
      })
    }

    // Get all conversations where user is a participant
    const conversationsSnapshot = await adminDb
      .collection('conversations')
      .where('participants', 'array-contains', userId)
      .orderBy('updatedAt', 'desc')
      .limit(50)
      .get()

    const conversations = conversationsSnapshot.docs.map(doc => {
      const data = doc.data()
      return {
        id: doc.id,
        participants: data.participants || [],
        participantDetails: data.participantDetails || {},
        lastMessage: data.lastMessage ? {
          text: data.lastMessage.text,
          senderId: data.lastMessage.senderId,
          senderName: data.lastMessage.senderName,
          timestamp: data.lastMessage.timestamp?.toDate?.()?.toISOString() || null
        } : null,
        unreadCount: data.unreadCount?.[userId] || 0,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || null
      }
    })

    return NextResponse.json({
      success: true,
      conversations,
      messagingEnabled: true
    })

  } catch (error: any) {
    console.error('Error fetching conversations:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch conversations' },
      { status: 500 }
    )
  }
}
