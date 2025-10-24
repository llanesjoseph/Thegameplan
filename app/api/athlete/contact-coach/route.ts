import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase.admin'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  let messageId = ''
  
  try {
    const body = await request.json()
    const { athleteId, coachId, message, subject } = body

    // Comprehensive input validation
    if (!athleteId || !coachId || !message || !subject) {
      console.error('Contact coach validation failed: Missing required fields', { athleteId: !!athleteId, coachId: !!coachId, message: !!message, subject: !!subject })
      return NextResponse.json(
        { error: 'Missing required fields: athleteId, coachId, message, subject' },
        { status: 400 }
      )
    }

    // Validate input types and lengths
    if (typeof athleteId !== 'string' || athleteId.length < 10) {
      return NextResponse.json(
        { error: 'Invalid athlete ID format' },
        { status: 400 }
      )
    }

    if (typeof coachId !== 'string' || coachId.length < 10) {
      return NextResponse.json(
        { error: 'Invalid coach ID format' },
        { status: 400 }
      )
    }

    if (typeof subject !== 'string' || subject.trim().length < 3 || subject.trim().length > 100) {
      return NextResponse.json(
        { error: 'Subject must be between 3 and 100 characters' },
        { status: 400 }
      )
    }

    if (typeof message !== 'string' || message.trim().length < 10 || message.trim().length > 1000) {
      return NextResponse.json(
        { error: 'Message must be between 10 and 1000 characters' },
        { status: 400 }
      )
    }

    // Sanitize inputs
    const sanitizedSubject = subject.trim().substring(0, 100)
    const sanitizedMessage = message.trim().substring(0, 1000)

    console.log('Contact coach request started', { athleteId: '[ATHLETE_ID]', coachId: '[COACH_ID]', subjectLength: sanitizedSubject.length, messageLength: sanitizedMessage.length })

    // Verify athlete exists and get their info
    console.log('Fetching athlete data', { athleteId: '[ATHLETE_ID]' })
    const athleteDoc = await adminDb.collection('users').doc(athleteId).get()
    if (!athleteDoc.exists) {
      console.error('Athlete not found', { athleteId })
      return NextResponse.json(
        { error: 'Athlete not found' },
        { status: 404 }
      )
    }

    const athleteData = athleteDoc.data()
    if (!athleteData) {
      console.error('Athlete data is null', { athleteId })
      return NextResponse.json(
        { error: 'Athlete data not available' },
        { status: 500 }
      )
    }

    if (athleteData.role !== 'athlete') {
      console.error('User is not an athlete', { athleteId, role: athleteData.role })
      return NextResponse.json(
        { error: 'User is not an athlete' },
        { status: 403 }
      )
    }

    // Verify coach exists and get their info
    console.log('Fetching coach data', { coachId: '[COACH_ID]' })
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

    if (coachData.role !== 'coach') {
      console.error('User is not a coach', { coachId, role: coachData.role })
      return NextResponse.json(
        { error: 'User is not a coach' },
        { status: 403 }
      )
    }

    // Create message document
    messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const messageData = {
      id: messageId,
      athleteId,
      athleteName: athleteData.displayName || athleteData.email || 'Unknown Athlete',
      athleteEmail: athleteData.email || '',
      coachId,
      coachName: coachData.displayName || coachData.email || 'Unknown Coach',
      coachEmail: coachData.email || '',
      subject: sanitizedSubject,
      message: sanitizedMessage,
      status: 'unread',
      createdAt: new Date(),
      readAt: null,
      repliedAt: null
    }

    console.log('Creating message', { messageId: '[MESSAGE_ID]', athleteName: messageData.athleteName, coachName: messageData.coachName })

    // Save to messages collection with error handling
    try {
      await adminDb.collection('messages').add(messageData)
      console.log('Message saved successfully', { messageId: '[MESSAGE_ID]' })
    } catch (dbError) {
      console.error('Failed to save message to database', { messageId, error: dbError })
      return NextResponse.json(
        { error: 'Failed to save message. Please try again.' },
        { status: 500 }
      )
    }

    // Create notification for coach
    console.log('Creating notification for coach', { coachId: '[COACH_ID]' })
    const notificationData = {
      userId: coachId,
      type: 'new_message',
      title: 'New Message from Athlete',
      message: `${messageData.athleteName} sent you a message: "${sanitizedSubject}"`,
      data: {
        messageId: messageId,
        athleteId,
        athleteName: messageData.athleteName
      },
      read: false,
      createdAt: new Date()
    }

    try {
      await adminDb.collection('notifications').add(notificationData)
      console.log('Notification created successfully', { coachId: '[COACH_ID]' })
    } catch (notificationError) {
      console.error('Failed to create notification', { coachId, error: notificationError })
      // Don't fail the request if notification fails
    }

    // Send email notification to coach (optional - they can disable this)
    if (coachData.email) {
      try {
        console.log('Sending email notification', { coachEmail: coachData.email })
        const { Resend } = await import('resend')
        const resend = new Resend(process.env.RESEND_API_KEY)

        if (!resend) {
          console.warn('Resend not configured, skipping email notification')
        } else {
          await resend.emails.send({
            from: 'AthLeap <noreply@athleap.com>',
            to: [coachData.email],
            subject: `New Message from ${messageData.athleteName}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #20B2AA;">New Message from Athlete</h2>
                <p><strong>From:</strong> ${messageData.athleteName}</p>
                <p><strong>Subject:</strong> ${sanitizedSubject}</p>
                <p><strong>Message:</strong></p>
                <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 10px 0;">
                  ${sanitizedMessage.replace(/\n/g, '<br>')}
                </div>
                <p>Please log into your AthLeap dashboard to respond.</p>
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://athleap.com'}/dashboard/coach/messages" 
                   style="background: #20B2AA; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
                  View Message
                </a>
              </div>
            `
          })
          console.log('Email notification sent successfully', { coachEmail: coachData.email })
        }
      } catch (emailError) {
        console.warn('Failed to send email notification:', emailError)
        // Don't fail the request if email fails
      }
    } else {
      console.warn('Coach has no email address, skipping email notification', { coachId })
    }

    const duration = Date.now() - startTime
    console.log('Contact coach request completed successfully', { messageId: '[MESSAGE_ID]', duration: `${duration}ms` })

    return NextResponse.json({
      success: true,
      messageId: messageId,
      message: 'Message sent successfully'
    })

  } catch (error) {
    const duration = Date.now() - startTime
    console.error('Contact coach request failed', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      messageId,
      duration: `${duration}ms`,
      stack: error instanceof Error ? error.stack : undefined
    })
    
    return NextResponse.json(
      { 
        error: 'Failed to send message. Please try again.',
        details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
      },
      { status: 500 }
    )
  }
}
