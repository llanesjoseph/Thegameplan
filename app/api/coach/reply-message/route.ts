import { NextRequest, NextResponse } from 'next/server'
import { auth, adminDb } from '@/lib/firebase.admin'
import { FieldValue } from 'firebase-admin/firestore'

export const runtime = 'nodejs'

/**
 * POST /api/coach/reply-message
 * Send a reply to an athlete's message
 * SECURITY: Only allows coaches to reply to messages sent to them
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
    const { messageId, replyText, coachId } = await request.json()

    if (!messageId || !replyText || !coachId) {
      return NextResponse.json(
        { error: 'Missing required fields: messageId, replyText, coachId' },
        { status: 400 }
      )
    }

    // 3. Verify the coach is authorized to reply to this message
    if (userId !== coachId) {
      return NextResponse.json(
        { error: 'Unauthorized - You can only reply to messages sent to you' },
        { status: 403 }
      )
    }

    // 4. Find the original message
    const messageRef = adminDb.collection('messages').doc(messageId)
    const messageDoc = await messageRef.get()

    if (!messageDoc.exists) {
      return NextResponse.json(
        { error: 'Original message not found' },
        { status: 404 }
      )
    }

    const messageData = messageDoc.data()

    // 5. Verify message data exists and was sent to this coach
    if (!messageData || messageData.recipientId !== coachId) {
      return NextResponse.json(
        { error: 'Unauthorized - This message was not sent to you' },
        { status: 403 }
      )
    }

    // 6. Get coach information
    const coachDoc = await adminDb.collection('users').doc(coachId).get()
    const coachData = coachDoc.data()
    const coachName = coachData?.displayName || coachData?.email?.split('@')[0] || 'Coach'

    // 7. Create the reply message
    const replyData = {
      senderId: coachId,
      senderName: coachName,
      senderEmail: coachData?.email || '',
      recipientId: messageData.senderId,
      recipientName: messageData.senderName,
      recipientEmail: messageData.senderEmail,
      content: replyText.trim(),
      subject: `Re: ${messageData.subject || 'Message'}`,
      isReply: true,
      originalMessageId: messageId,
      timestamp: FieldValue.serverTimestamp(),
      read: false,
      participants: [coachId, messageData.senderId],
      conversationId: messageData.conversationId || `conv_${messageData.senderId}_${coachId}`,
      type: 'reply'
    }

    // 8. Save the reply message
    const replyRef = await adminDb.collection('messages').add(replyData)

    // 9. Update the original message to mark it as replied
    await messageRef.update({
      status: 'replied',
      repliedAt: FieldValue.serverTimestamp(),
      replyId: replyRef.id
    })

    // 10. Send email notification to the athlete (optional)
    try {
      // You can add email notification logic here if needed
      console.log(`Reply sent from coach ${coachName} to athlete ${messageData.senderName}`)
    } catch (emailError) {
      console.warn('Failed to send email notification:', emailError)
      // Don't fail the reply if email fails
    }

    console.log(`[COACH-REPLY] Successfully sent reply to message ${messageId}`)

    return NextResponse.json({
      success: true,
      replyId: replyRef.id,
      message: 'Reply sent successfully'
    })

  } catch (error: any) {
    console.error('[COACH-REPLY] Error sending reply:', error)
    return NextResponse.json(
      { 
        error: 'Failed to send reply',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}