import { NextRequest, NextResponse } from 'next/server'
import { sendCoachInvitationEmail } from '@/lib/email-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json(
        { error: 'Email address is required' },
        { status: 400 }
      )
    }

    console.log(`🧪 Testing email service - sending to ${email}`)

    // Send test email
    const testInvitationUrl = 'https://playbookd.crucibleanalytics.dev/test'

    const result = await sendCoachInvitationEmail({
      to: email,
      organizationName: 'PLAYBOOKD Test',
      inviterName: 'Test System',
      sport: 'Testing',
      invitationUrl: testInvitationUrl,
      qrCodeUrl: '',
      customMessage: 'This is a test email to verify the email service is working correctly.',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
      recipientName: 'Test User',
      templateType: 'simple'
    })

    console.log('✅ Test email sent successfully:', result)

    return NextResponse.json({
      success: true,
      message: `Test email sent successfully to ${email}`,
      result
    })

  } catch (error) {
    console.error('❌ Test email failed:', error)

    return NextResponse.json({
      success: false,
      error: 'Failed to send test email',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// GET endpoint for easy browser testing
export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const email = url.searchParams.get('email')

  if (!email) {
    return NextResponse.json({
      error: 'Please provide an email parameter',
      example: '/api/test-email?email=test@example.com'
    }, { status: 400 })
  }

  // Use the same POST logic
  return POST(new NextRequest(request.url, {
    method: 'POST',
    body: JSON.stringify({ email }),
    headers: { 'Content-Type': 'application/json' }
  }))
}