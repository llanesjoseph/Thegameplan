import { NextRequest, NextResponse } from 'next/server'
import { adminDb as db } from '@/lib/firebase.admin'
import { sendCoachInvitationEmail } from '@/lib/email-service'
import { nanoid } from 'nanoid'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, name = 'Coach' } = body

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Generate unique test ingestion link
    const ingestionId = `test-${nanoid(10)}`
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // 7 days

    // Create test ingestion link document
    const ingestionLinkData = {
      id: ingestionId,
      organizationName: 'GamePlan Demo',
      inviterName: 'GamePlan Team',
      inviterEmail: 'team@gameplan.ai',
      inviterUserId: 'system',
      sport: 'Soccer',
      description: 'Test coach invitation to experience the GamePlan onboarding flow',
      expiresAt,
      maxUses: 1,
      currentUses: 0,
      autoApprove: true,
      customMessage: 'This is a test invitation to see how the coach onboarding flow looks and feels. Complete it to experience the full process including the optional voice capture system!',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'system',
      uses: [],
      analytics: {
        views: 0,
        completions: 0,
        conversions: 0
      },
      metadata: {
        isTestInvitation: true
      }
    }

    // Save to Firestore
    await db.collection('coach_ingestion_links').doc(ingestionId).set(ingestionLinkData)

    // Generate URLs
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const ingestionUrl = `${baseUrl}/coach-onboard/${ingestionId}`
    const qrCodeUrl = `${baseUrl}/api/coach-ingestion/qr/${ingestionId}`

    // Send test email
    const emailResult = await sendCoachInvitationEmail({
      to: email,
      organizationName: 'GamePlan Demo',
      inviterName: 'GamePlan Team',
      sport: 'Soccer',
      invitationUrl: ingestionUrl,
      qrCodeUrl,
      customMessage: 'This is a test invitation to experience our complete coach onboarding flow. Feel free to complete the entire process to see how everything works!',
      expiresAt: expiresAt.toISOString()
    })

    if (!emailResult.success) {
      console.error('Failed to send test email:', emailResult.error)
      return NextResponse.json(
        { error: `Failed to send email: ${emailResult.error}` },
        { status: 500 }
      )
    }

    console.log(`✅ Test coach invitation sent to ${email}`)

    return NextResponse.json({
      success: true,
      message: `Test coach invitation sent successfully to ${email}`,
      data: {
        ingestionId,
        url: ingestionUrl,
        qrCodeUrl,
        expiresAt: expiresAt.toISOString(),
        emailSent: true
      }
    })

  } catch (error) {
    console.error('Test email error:', error)
    return NextResponse.json(
      { error: 'Failed to send test email' },
      { status: 500 }
    )
  }
}