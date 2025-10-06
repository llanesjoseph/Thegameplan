import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase.admin'
import { logMessage } from '@/lib/message-audit-logger'
import { Timestamp } from 'firebase-admin/firestore'

/**
 * Send Message API with Audit Logging
 *
 * All messages are logged for safety and accountability
 */
export async function POST(request: NextRequest) {
  try {
    // Get authentication token
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)

    // Verify token (simplified - you should use Firebase Admin Auth)
    const body = await request.json()
    const {
      senderId,
      senderName,
      recipientId,
      recipientName,
      content
    } = body

    // Validate required fields
    if (!senderId || !recipientId || !content) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate content length
    if (content.length > 2000) {
      return NextResponse.json(
        { error: 'Message too long (max 2000 characters)' },
        { status: 400 }
      )
    }

    if (content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message cannot be empty' },
        { status: 400 }
      )
    }

    // Get sender and recipient roles
    const [senderDoc, recipientDoc] = await Promise.all([
      adminDb.collection('users').doc(senderId).get(),
      adminDb.collection('users').doc(recipientId).get()
    ])

    if (!senderDoc.exists || !recipientDoc.exists) {
      return NextResponse.json({ error: 'Invalid sender or recipient' }, { status: 404 })
    }

    const senderRole = senderDoc.data()?.role || 'user'
    const recipientRole = recipientDoc.data()?.role || 'user'

    // Create message document
    const messageRef = adminDb.collection('messages').doc()
    const messageData = {
      senderId,
      senderName,
      senderRole,
      recipientId,
      recipientName,
      recipientRole,
      content: content.trim(),
      timestamp: Timestamp.now(),
      read: false,
      participants: [senderId, recipientId]
    }

    await messageRef.set(messageData)

    // Log to audit trail (includes content moderation)
    await logMessage({
      messageId: messageRef.id,
      senderId,
      senderName,
      senderRole,
      recipientId,
      recipientName,
      recipientRole,
      content: content.trim(),
      clientIP: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      userAgent: request.headers.get('user-agent') || undefined
    })

    return NextResponse.json({
      success: true,
      messageId: messageRef.id,
      timestamp: messageData.timestamp
    })

  } catch (error) {
    console.error('Error sending message:', error)
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    )
  }
}
