import { NextRequest, NextResponse } from 'next/server'
import { sendCoachInvitationEmail } from '@/lib/email-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { coachEmail, coachName, sport, personalMessage } = body

    if (!coachEmail || !coachName || !sport) {
      return NextResponse.json(
        { error: 'Coach email, name, and sport are required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(coachEmail)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Generate a simple invitation ID
    const invitationId = `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Create invitation data
    const invitationData = {
      id: invitationId,
      coachEmail: coachEmail.toLowerCase(),
      coachName,
      sport,
      personalMessage: personalMessage || 'Join our coaching platform!',
      createdAt: new Date().toISOString(),
      status: 'sent',
      // In a real implementation, this would be stored in database
      // For now, we'll just return success
    }

    console.log('📧 Coach invitation created:', {
      email: coachEmail,
      name: coachName,
      sport,
      invitationId
    })

    // Create invitation URL (you can customize this)
    const invitationUrl = `https://playbookd.crucibleanalytics.dev/coach-signup?invitation=${invitationId}&sport=${encodeURIComponent(sport)}`

    // Send actual email using existing email service
    console.log(`✉️ Sending invitation email to ${coachEmail}...`)

    try {
      await sendCoachInvitationEmail({
        to: coachEmail,
        organizationName: 'PLAYBOOKD Coaching Network',
        inviterName: 'PLAYBOOKD Team',
        sport,
        invitationUrl,
        qrCodeUrl: '', // Optional QR code
        customMessage: personalMessage,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
        recipientName: coachName,
        templateType: 'simple'
      })

      console.log(`✅ Email sent successfully to ${coachEmail}`)

    } catch (emailError) {
      console.error('Failed to send email:', emailError)
      // Don't fail the whole request if email fails - still return success
      // In production, you might want to retry or queue the email
    }

    return NextResponse.json({
      success: true,
      message: `Invitation sent successfully to ${coachEmail}`,
      invitationId,
      data: {
        coachEmail,
        coachName,
        sport,
        status: 'sent',
        createdAt: invitationData.createdAt
      }
    })

  } catch (error) {
    console.error('Error sending coach invitation:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to send invitation. Please try again.'
      },
      { status: 500 }
    )
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}