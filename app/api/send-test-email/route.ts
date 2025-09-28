import { NextRequest, NextResponse } from 'next/server'
import { sendCoachInvitationEmail } from '@/lib/email-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      email,
      name = 'Test Coach',
      type = 'regular',
      organizationName = 'GamePlan Demo',
      sport = 'Soccer'
    } = body

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Generate test data
    const timestamp = Date.now()
    const testId = type === 'jasmine'
      ? `jasmine-special-${timestamp}`
      : `test-${timestamp}`

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const invitationUrl = `${baseUrl}/coach-onboard/${testId}`

    // Generate QR code URL (using a placeholder for now)
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(invitationUrl)}`

    // Create invitation data for in-memory storage
    const mockIngestionData = {
      id: testId,
      organizationName: type === 'jasmine' ? 'GamePlan Platform' : organizationName,
      inviterName: 'GamePlan Team',
      inviterEmail: 'team@gameplan.ai',
      inviterUserId: 'system',
      sport: sport,
      description: type === 'jasmine'
        ? 'Special onboarding for featured coach'
        : 'Test coach invitation to experience the GamePlan onboarding flow',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      maxUses: 1,
      currentUses: 0,
      autoApprove: true,
      customMessage: type === 'jasmine'
        ? `Welcome to GamePlan, ${name}! We're excited to have you as one of our featured coaches. Please complete your profile to get started.`
        : 'This is a test invitation to see how the coach onboarding flow looks and feels. Complete it to experience the full process!',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: {
        isTestInvitation: type !== 'jasmine',
        isJasmineSpecial: type === 'jasmine',
        prePopulateData: type === 'jasmine'
      }
    }

    // Store in memory for testing
    if (typeof globalThis !== 'undefined') {
      if (!(globalThis as any).testInvitations) {
        (globalThis as any).testInvitations = new Map()
      }
      (globalThis as any).testInvitations.set(testId, mockIngestionData)
    }

    console.log(`📧 Sending test email to: ${email}`)
    console.log(`🔗 Invitation URL: ${invitationUrl}`)

    // Send the email using the new PLAYBOOKD template
    const emailResult = await sendCoachInvitationEmail({
      to: email,
      organizationName: mockIngestionData.organizationName,
      inviterName: mockIngestionData.inviterName,
      sport: mockIngestionData.sport,
      invitationUrl,
      qrCodeUrl,
      customMessage: mockIngestionData.customMessage,
      expiresAt: mockIngestionData.expiresAt.toISOString(),
      recipientName: name,
      templateType: 'playbookd'
    })

    if (emailResult.success) {
      console.log(`✅ Email sent successfully to ${email}`)
      return NextResponse.json({
        success: true,
        message: `PLAYBOOKD test email sent successfully to ${email}`,
        data: {
          emailId: emailResult.data?.id,
          invitationId: testId,
          invitationUrl,
          templateUsed: 'playbookd',
          expiresAt: mockIngestionData.expiresAt.toISOString()
        }
      })
    } else {
      console.error(`❌ Failed to send email:`, emailResult.error)
      return NextResponse.json({
        success: false,
        error: `Failed to send email: ${emailResult.error}`,
        invitationUrl, // Still provide the URL even if email fails
        note: 'You can still test the onboarding flow using the invitation URL above'
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Send test email error:', error)
    return NextResponse.json(
      { error: 'Failed to send test email' },
      { status: 500 }
    )
  }
}