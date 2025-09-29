import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-utils'
import { adminDb as db } from '@/lib/firebase.admin'
import { auditLog } from '@/lib/audit-logger'
import { sendCoachInvitationEmail } from '@/lib/email-service'
import { nanoid } from 'nanoid'

export async function POST(request: NextRequest) {
  try {
    // Simplified authentication - just require authenticated user
    const authResult = await requireAuth(request)

    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const { user: authUser } = authResult
    const body = await request.json()

    const {
      organizationName,
      inviterName = authUser.displayName || authUser.email,
      inviterEmail = authUser.email,
      sport,
      description,
      expiresInDays = 30,
      maxUses = 1,
      autoApprove = false,
      customMessage,
      sendEmail = false,
      recipientEmail,
      recipientName
    } = body

    // Validate required fields
    if (!organizationName || !sport) {
      return NextResponse.json(
        { error: 'Organization name and sport are required' },
        { status: 400 }
      )
    }

    // Validate email fields if sending email
    if (sendEmail && !recipientEmail) {
      return NextResponse.json(
        { error: 'Recipient email is required when sending email' },
        { status: 400 }
      )
    }

    // Generate unique ingestion link ID
    const ingestionId = nanoid(12)
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + expiresInDays)

    // Create ingestion link document
    const ingestionLinkData = {
      id: ingestionId,
      organizationName,
      inviterName,
      inviterEmail,
      inviterUserId: authUser.uid,
      sport,
      description: description || `Join ${organizationName} as a ${sport} coach`,
      expiresAt,
      maxUses,
      currentUses: 0,
      autoApprove,
      customMessage: customMessage || '',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: authUser.uid,
      // Tracking
      uses: [],
      analytics: {
        views: 0,
        completions: 0,
        conversions: 0
      }
    }

    // Save to Firestore
    await db.collection('coach_ingestion_links').doc(ingestionId).set(ingestionLinkData)

    // Generate the full URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const ingestionUrl = `${baseUrl}/coach-onboard/${ingestionId}`
    const qrCodeUrl = `${baseUrl}/api/coach-ingestion/qr/${ingestionId}`

    // Send email if requested
    let emailResult = null
    if (sendEmail && recipientEmail) {
      emailResult = await sendCoachInvitationEmail({
        to: recipientEmail,
        organizationName,
        inviterName: inviterName,
        sport,
        invitationUrl: ingestionUrl,
        qrCodeUrl,
        customMessage,
        expiresAt: expiresAt.toISOString()
      })

      if (emailResult.success) {
        // Log email sent
        await auditLog('coach_invitation_email_sent', {
          ingestionId,
          recipientEmail,
          recipientName,
          organizationName,
          sport,
          inviterUserId: authUser.uid
        }, { userId: authUser.uid })
      }
    }

    // Audit log
    await auditLog('coach_ingestion_link_created', {
      ingestionId,
      organizationName,
      sport,
      inviterUserId: authUser.uid,
      expiresAt: expiresAt.toISOString(),
      maxUses,
      emailSent: sendEmail,
      recipientEmail: sendEmail ? recipientEmail : undefined
    }, { userId: authUser.uid })

    return NextResponse.json({
      success: true,
      data: {
        ingestionId,
        url: ingestionUrl,
        qrCodeUrl,
        expiresAt: expiresAt.toISOString(),
        maxUses,
        organizationName,
        sport,
        emailSent: sendEmail ? emailResult?.success : false,
        emailError: sendEmail && !emailResult?.success ? emailResult?.error : undefined
      }
    })

  } catch (error) {
    console.error('Generate ingestion link error:', error)
    return NextResponse.json(
      { error: 'Failed to generate ingestion link' },
      { status: 500 }
    )
  }
}