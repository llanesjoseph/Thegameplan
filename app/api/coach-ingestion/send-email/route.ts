import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-utils'
import { sendCoachInvitationEmail } from '@/lib/email-service'
import { auditLog } from '@/lib/audit-logger'

// Force dynamic rendering for API route
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    // Require creator, coach, admin, or superadmin role to send invitation emails
    const authResult = await requireAuth(request, ['creator', 'coach', 'admin', 'superadmin'])

    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const { user: authUser } = authResult
    const body = await request.json()

    const {
      to,
      recipientName,
      organizationName,
      sport,
      invitationUrl,
      qrCodeUrl,
      customMessage,
      expiresAt
    } = body

    // Validate required fields
    if (!to || !organizationName || !sport || !invitationUrl || !qrCodeUrl) {
      return NextResponse.json(
        { error: 'Missing required fields for email' },
        { status: 400 }
      )
    }

    // Send the invitation email
    const emailResult = await sendCoachInvitationEmail({
      to,
      organizationName,
      inviterName: authUser.displayName || authUser.email || 'GamePlan Admin',
      sport,
      invitationUrl,
      qrCodeUrl,
      customMessage,
      expiresAt
    })

    if (!emailResult.success) {
      console.error('Failed to send invitation email:', emailResult.error)
      return NextResponse.json(
        { error: `Failed to send email: ${emailResult.error}` },
        { status: 500 }
      )
    }

    // Audit log
    await auditLog('coach_invitation_email_sent', {
      recipientEmail: to,
      recipientName,
      organizationName,
      sport,
      inviterUserId: authUser.uid,
      inviterEmail: authUser.email
    }, { userId: authUser.uid })

    return NextResponse.json({
      success: true,
      message: 'Invitation email sent successfully',
      emailId: emailResult.data?.id
    })

  } catch (error) {
    console.error('Send invitation email error:', error)
    return NextResponse.json(
      { error: 'Failed to send invitation email' },
      { status: 500 }
    )
  }
}