import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase.admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  let replyId = ''
  
  try {
    const body = await request.json()
    const { messageId, replyText, coachId } = body

    // Comprehensive input validation
    if (!messageId || !replyText || !coachId) {
      console.error('Reply message validation failed: Missing required fields', { 
        messageId: !!messageId, 
        replyText: !!replyText, 
        coachId: !!coachId 
      })
      return NextResponse.json(
        { error: 'Missing required fields: messageId, replyText, coachId' },
        { status: 400 }
      )
    }

    // Validate input types and lengths
    if (typeof messageId !== 'string' || messageId.length < 10) {
      return NextResponse.json(
        { error: 'Invalid message ID format' },
        { status: 400 }
      )
    }

    if (typeof coachId !== 'string' || coachId.length < 10) {
      return NextResponse.json(
        { error: 'Invalid coach ID format' },
        { status: 400 }
      )
    }

    if (typeof replyText !== 'string' || replyText.trim().length < 5 || replyText.trim().length > 2000) {
      return NextResponse.json(
        { error: 'Reply must be between 5 and 2000 characters' },
        { status: 400 }
      )
    }

    // Sanitize reply text
    const sanitizedReply = replyText.trim().substring(0, 2000)

    console.log('Coach reply request started', { messageId: '[MESSAGE_ID]', coachId: '[COACH_ID]', replyLength: sanitizedReply.length })

    // Get the original message
    const messageDoc = await adminDb.collection('messages').doc(messageId).get()
    if (!messageDoc.exists) {
      console.error('Original message not found', { messageId: '[MESSAGE_ID]' })
      return NextResponse.json(
        { error: 'Original message not found' },
        { status: 404 }
      )
    }

    const originalMessage = messageDoc.data()
    if (!originalMessage) {
      console.error('Original message data is null', { messageId })
      return NextResponse.json(
        { error: 'Original message data not available' },
        { status: 500 }
      )
    }

    // Verify coach is authorized to reply to this message
    if (originalMessage.coachId !== coachId) {
      console.error('Coach not authorized to reply to this message', { 
        messageId, 
        coachId, 
        messageCoachId: originalMessage.coachId 
      })
      return NextResponse.json(
        { error: 'Not authorized to reply to this message' },
        { status: 403 }
      )
    }

    // Get coach information
    const coachDoc = await adminDb.collection('users').doc(coachId).get()
    if (!coachDoc.exists) {
      console.error('Coach not found', { coachId })
      return NextResponse.json(
        { error: 'Coach not found' },
        { status: 404 }
      )
    }

    const coachData = coachDoc.data()
    if (!coachData) {
      console.error('Coach data is null', { coachId })
      return NextResponse.json(
        { error: 'Coach data not available' },
        { status: 500 }
      )
    }

    // Create reply document
    replyId = `reply_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const replyData = {
      id: replyId,
      messageId: messageId,
      coachId: coachId,
      coachName: coachData.displayName || coachData.email || 'Your Coach',
      athleteId: originalMessage.athleteId,
      athleteName: originalMessage.athleteName,
      athleteEmail: originalMessage.athleteEmail,
      originalSubject: originalMessage.subject,
      replyText: sanitizedReply,
      createdAt: new Date(),
      status: 'sent'
    }

    console.log('Creating reply', { replyId, coachName: replyData.coachName, athleteName: replyData.athleteName })

    // Save reply to database
    try {
      await adminDb.collection('message_replies').add(replyData)
      console.log('Reply saved successfully', { replyId })
    } catch (dbError) {
      console.error('Failed to save reply to database', { replyId, error: dbError })
      return NextResponse.json(
        { error: 'Failed to save reply. Please try again.' },
        { status: 500 }
      )
    }

    // Update original message status to 'replied'
    try {
      await adminDb.collection('messages').doc(messageId).update({
        status: 'replied',
        repliedAt: new Date(),
        replyId: replyId
      })
      console.log('Original message status updated to replied', { messageId: '[MESSAGE_ID]' })
    } catch (updateError) {
      console.error('Failed to update original message status', { messageId, error: updateError })
      // Don't fail the request if status update fails
    }

    // Send email to athlete using Resend
    try {
      console.log('Sending reply email to athlete', { athleteEmail: originalMessage.athleteEmail })
      const { Resend } = await import('resend')
      const resend = new Resend(process.env.RESEND_API_KEY)

      if (!resend) {
        console.warn('Resend not configured, skipping email notification')
      } else {
        await resend.emails.send({
          from: 'AthLeap Coach <noreply@athleap.com>',
          to: [originalMessage.athleteEmail],
          subject: `Re: ${originalMessage.subject}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #20B2AA, #5A9B9B); padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 24px;">Reply from Your Coach</h1>
              </div>
              
              <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
                <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #20B2AA;">
                  <h3 style="color: #333; margin: 0 0 10px 0;">Original Message:</h3>
                  <p style="color: #666; margin: 0; font-style: italic;">"${originalMessage.message}"</p>
                </div>
                
                <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #5A9B9B;">
                  <h3 style="color: #333; margin: 0 0 15px 0;">Coach's Reply:</h3>
                  <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; white-space: pre-wrap; line-height: 1.6;">${sanitizedReply}</div>
                </div>
                
                <div style="text-align: center; margin-top: 30px;">
                  <p style="color: #666; margin: 0 0 20px 0;">Continue the conversation in your AthLeap dashboard</p>
                  <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://athleap.com'}/dashboard/athlete" 
                     style="background: #20B2AA; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500;">
                    Go to Dashboard
                  </a>
                </div>
                
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef; text-align: center;">
                  <p style="color: #999; font-size: 12px; margin: 0;">
                    This message was sent from AthLeap. Please do not reply directly to this email.
                  </p>
                </div>
              </div>
            </div>
          `
        })
        console.log('Reply email sent successfully', { athleteEmail: originalMessage.athleteEmail })
      }
    } catch (emailError) {
      console.warn('Failed to send reply email:', emailError)
      // Don't fail the request if email fails
    }

    // Create notification for athlete
    try {
      const notificationData = {
        userId: originalMessage.athleteId,
        type: 'coach_reply',
        title: 'Reply from Your Coach',
        message: `${replyData.coachName} replied to your message: "${originalMessage.subject}"`,
        data: {
          messageId: messageId,
          replyId: replyId,
          coachId: coachId,
          coachName: replyData.coachName
        },
        read: false,
        createdAt: new Date()
      }

      await adminDb.collection('notifications').add(notificationData)
      console.log('Notification created for athlete', { athleteId: '[ATHLETE_ID]' })
    } catch (notificationError) {
      console.error('Failed to create notification', { athleteId: originalMessage.athleteId, error: notificationError })
      // Don't fail the request if notification fails
    }

    const duration = Date.now() - startTime
    console.log('Coach reply request completed successfully', { replyId, duration: `${duration}ms` })

    return NextResponse.json({
      success: true,
      replyId: replyId,
      message: 'Reply sent successfully'
    })

  } catch (error) {
    const duration = Date.now() - startTime
    console.error('Coach reply request failed', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      replyId,
      duration: `${duration}ms`,
      stack: error instanceof Error ? error.stack : undefined
    })
    
    return NextResponse.json(
      { 
        error: 'Failed to send reply. Please try again.',
        details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
      },
      { status: 500 }
    )
  }
}
