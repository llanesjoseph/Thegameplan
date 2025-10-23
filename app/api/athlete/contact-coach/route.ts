import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase.admin'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const { athleteId, coachId, message, subject } = await request.json()

    if (!athleteId || !coachId || !message || !subject) {
      return NextResponse.json(
        { error: 'Missing required fields: athleteId, coachId, message, subject' },
        { status: 400 }
      )
    }

    // Verify athlete exists and get their info
    const athleteDoc = await adminDb.collection('users').doc(athleteId).get()
    if (!athleteDoc.exists) {
      return NextResponse.json(
        { error: 'Athlete not found' },
        { status: 404 }
      )
    }

    const athleteData = athleteDoc.data()
    if (athleteData?.role !== 'athlete') {
      return NextResponse.json(
        { error: 'User is not an athlete' },
        { status: 403 }
      )
    }

    // Verify coach exists and get their info
    const coachDoc = await adminDb.collection('users').doc(coachId).get()
    if (!coachDoc.exists) {
      return NextResponse.json(
        { error: 'Coach not found' },
        { status: 404 }
      )
    }

    const coachData = coachDoc.data()
    if (coachData?.role !== 'coach') {
      return NextResponse.json(
        { error: 'User is not a coach' },
        { status: 403 }
      )
    }

    // Create message document
    const messageData = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      athleteId,
      athleteName: athleteData.displayName || athleteData.email,
      athleteEmail: athleteData.email,
      coachId,
      coachName: coachData.displayName || coachData.email,
      coachEmail: coachData.email,
      subject,
      message,
      status: 'unread',
      createdAt: new Date(),
      readAt: null,
      repliedAt: null
    }

    // Save to messages collection
    await adminDb.collection('messages').add(messageData)

    // Create notification for coach
    const notificationData = {
      userId: coachId,
      type: 'new_message',
      title: 'New Message from Athlete',
      message: `${athleteData.displayName || 'An athlete'} sent you a message: "${subject}"`,
      data: {
        messageId: messageData.id,
        athleteId,
        athleteName: athleteData.displayName || athleteData.email
      },
      read: false,
      createdAt: new Date()
    }

    await adminDb.collection('notifications').add(notificationData)

    // Send email notification to coach (optional - they can disable this)
    try {
      const { Resend } = await import('resend')
      const resend = new Resend(process.env.RESEND_API_KEY)

      await resend.emails.send({
        from: 'AthLeap <noreply@athleap.com>',
        to: [coachData.email],
        subject: `New Message from ${athleteData.displayName || 'An athlete'}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #20B2AA;">New Message from Athlete</h2>
            <p><strong>From:</strong> ${athleteData.displayName || athleteData.email}</p>
            <p><strong>Subject:</strong> ${subject}</p>
            <p><strong>Message:</strong></p>
            <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 10px 0;">
              ${message.replace(/\n/g, '<br>')}
            </div>
            <p>Please log into your AthLeap dashboard to respond.</p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/coach/messages" 
               style="background: #20B2AA; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
              View Message
            </a>
          </div>
        `
      })
    } catch (emailError) {
      console.warn('Failed to send email notification:', emailError)
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      success: true,
      messageId: messageData.id,
      message: 'Message sent successfully'
    })

  } catch (error) {
    console.error('Error sending message:', error)
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    )
  }
}
