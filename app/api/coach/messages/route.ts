import { NextRequest, NextResponse } from 'next/server'
import { auth, adminDb } from '@/lib/firebase.admin'
import { FieldValue } from 'firebase-admin/firestore'

export const runtime = 'nodejs'

/**
 * GET /api/coach/messages
 * Fetch messages for a coach
 * SECURITY: Only allows coaches to access their own messages
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Verify authentication
    const authHeader = request.headers.get('authorization')
    console.log('[COACH-MESSAGES-API] Auth header:', authHeader ? 'Present' : 'Missing')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('[COACH-MESSAGES-API] No valid auth header')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split('Bearer ')[1]
    console.log('[COACH-MESSAGES-API] Token length:', token.length)
    
    const decodedToken = await auth.verifyIdToken(token)
    const userId = decodedToken.uid
    console.log('[COACH-MESSAGES-API] User ID:', userId)

    // 2. Parse query parameters
    const { searchParams } = new URL(request.url)
    const coachId = searchParams.get('coachId')

    // 3. Verify the coach is accessing their own messages
    if (coachId && coachId !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized - You can only access your own messages' },
        { status: 403 }
      )
    }

    // 4. Fetch messages for this coach
    try {
      const messagesRef = adminDb.collection('messages')
      const q = messagesRef
        .where('recipientId', '==', userId)
        .orderBy('timestamp', 'desc')
        .limit(50)
      
      const snapshot = await q.get()
      
      const messages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().timestamp?.toDate?.()?.toISOString() || null,
        readAt: doc.data().readAt?.toDate?.()?.toISOString() || null,
        repliedAt: doc.data().repliedAt?.toDate?.()?.toISOString() || null,
      }))

      console.log(`[COACH-MESSAGES] Successfully fetched ${messages.length} messages for coach ${userId}`)

      return NextResponse.json({
        success: true,
        messages
      })
    } catch (queryError: any) {
      // If there's a query error (likely missing index), try without orderBy
      console.warn('[COACH-MESSAGES] Query with orderBy failed, trying without:', queryError.message)
      
      try {
        const messagesRef = adminDb.collection('messages')
        const q = messagesRef
          .where('recipientId', '==', userId)
          .limit(50)
        
        const snapshot = await q.get()
        
        const messages = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().timestamp?.toDate?.()?.toISOString() || null,
          readAt: doc.data().readAt?.toDate?.()?.toISOString() || null,
          repliedAt: doc.data().repliedAt?.toDate?.()?.toISOString() || null,
        }))

        // Sort in memory
        messages.sort((a: any, b: any) => {
          const timeA = new Date(a.timestamp || a.createdAt || 0).getTime()
          const timeB = new Date(b.timestamp || b.createdAt || 0).getTime()
          return timeB - timeA // Descending order
        })

        console.log(`[COACH-MESSAGES] Successfully fetched ${messages.length} messages (no index) for coach ${userId}`)

        return NextResponse.json({
          success: true,
          messages
        })
      } catch (fallbackError: any) {
        console.error('[COACH-MESSAGES] Fallback query also failed:', fallbackError)
        // Return empty array rather than erroring out
        return NextResponse.json({
          success: true,
          messages: []
        })
      }
    }

  } catch (error: any) {
    console.error('[COACH-MESSAGES] Error fetching messages:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch messages',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/coach/messages
 * Update message status (mark as read, replied, dismiss, delete)
 * SECURITY: Only allows coaches to update their own messages
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Verify authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split('Bearer ')[1]
    const decodedToken = await auth.verifyIdToken(token)
    const userId = decodedToken.uid

    // 2. Parse request body
    const { messageId, action } = await request.json()

    if (!messageId || !action) {
      return NextResponse.json(
        { error: 'Missing required fields: messageId, action' },
        { status: 400 }
      )
    }

    // 3. Get the message to verify ownership
    const messageRef = adminDb.collection('messages').doc(messageId)
    const messageDoc = await messageRef.get()

    if (!messageDoc.exists) {
      return NextResponse.json(
        { error: 'Message not found' },
        { status: 404 }
      )
    }

    const messageData = messageDoc.data()

    // 4. Verify the coach owns this message
    if (!messageData || messageData.recipientId !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized - You can only update your own messages' },
        { status: 403 }
      )
    }

    // 5. Update message based on action
    let updateData: any = {}

    switch (action) {
      case 'mark_read':
        updateData = {
          read: true,
          readAt: FieldValue.serverTimestamp(),
          status: 'read'
        }
        break
      case 'mark_replied':
        updateData = {
          status: 'replied',
          repliedAt: FieldValue.serverTimestamp()
        }
        break
      case 'dismiss':
        updateData = {
          status: 'dismissed',
          dismissedAt: FieldValue.serverTimestamp()
        }
        break
      case 'delete':
        // Delete the message
        await messageRef.delete()
        return NextResponse.json({
          success: true,
          message: 'Message deleted successfully'
        })
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

    // 6. Update the message
    await messageRef.update(updateData)

    console.log(`[COACH-MESSAGES] Successfully updated message ${messageId} with action ${action}`)

    return NextResponse.json({
      success: true,
      message: `Message ${action.replace('_', ' ')} successfully`
    })

  } catch (error: any) {
    console.error('[COACH-MESSAGES] Error updating message:', error)
    return NextResponse.json(
      { 
        error: 'Failed to update message',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}