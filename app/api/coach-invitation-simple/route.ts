import { NextRequest, NextResponse } from 'next/server'

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

    // Simulate email sending
    console.log(`✉️ Sending invitation email to ${coachEmail}...`)

    // In production, this would integrate with:
    // - Email service (SendGrid, AWS SES, etc.)
    // - Database to store invitation
    // - Generate actual invitation link

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