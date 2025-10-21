import { NextRequest, NextResponse } from 'next/server'
import { sendCoachInvitationEmail, sendCoachNotificationEmail } from '@/lib/email-service'
import { adminDb } from '@/lib/firebase.admin'

// Force dynamic rendering for API route
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { coachEmail, coachName, sport, personalMessage, invitationType = 'coach' } = body

    if (!coachEmail || !coachName || !sport) {
      return NextResponse.json(
        { error: `${invitationType === 'assistant' ? 'Assistant' : 'Coach'} email, name, and sport are required` },
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

    // Determine target role
    const targetRole = invitationType === 'assistant' ? 'assistant' : 'coach'

    // Get current user info from auth header
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    let inviterEmail = 'admin@athleap.com'
    let inviterId = 'system'

    if (token) {
      try {
        const { auth } = await import('@/lib/firebase.admin')
        const decodedToken = await auth.verifyIdToken(token)
        inviterEmail = decodedToken.email || inviterEmail
        inviterId = decodedToken.uid || inviterId
      } catch (error) {
        console.warn('Could not decode token for inviter info')
      }
    }

    // Prevent self-invitations
    if (inviterEmail.toLowerCase() === coachEmail.toLowerCase()) {
      return NextResponse.json(
        { error: 'You cannot invite yourself. Please enter a different email address.' },
        { status: 400 }
      )
    }

    // Create invitation URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://playbook.crucibleanalytics.dev'
    const invitationUrl = `${baseUrl}/coach-onboard/${invitationId}?sport=${encodeURIComponent(sport)}&email=${encodeURIComponent(coachEmail)}&name=${encodeURIComponent(coachName)}&role=${targetRole}`

    // Create invitation data matching admin dashboard structure
    const invitationData = {
      id: invitationId,
      // Store coach info in athlete fields for dashboard compatibility
      athleteName: coachName,
      athleteEmail: coachEmail.toLowerCase(),
      // Also store in coach fields for backwards compatibility
      coachEmail: coachEmail.toLowerCase(),
      coachName,
      coachId: inviterId, // Who sent the invitation
      sport,
      personalMessage: personalMessage || 'Join our coaching platform!',
      role: targetRole, // CRITICAL: Store the target role
      invitationType,
      invitationUrl,
      createdAt: new Date(), // Store as Date object, not ISO string
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      status: 'pending', // Use 'pending' instead of 'sent' for dashboard compatibility
      type: invitationType === 'assistant' ? 'assistant_invitation' : 'coach_invitation',
      used: false,
      // CRITICAL: Auto-approve coach-to-coach invitations to create account immediately
      autoApprove: true,
      organizationName: 'Athleap Coaching Network',
      inviterName: inviterEmail
    }

    // Store invitation in Firestore
    await adminDb.collection('invitations').doc(invitationId).set(invitationData)
    console.log(`💾 Stored ${invitationType} invitation in Firestore:`, {
      email: coachEmail,
      name: coachName,
      sport,
      invitationId,
      role: targetRole
    })

    // Send actual email using existing email service
    console.log(`✉️ Sending invitation email to ${coachEmail}...`)

    try {
      await sendCoachInvitationEmail({
        to: coachEmail,
        organizationName: invitationType === 'assistant' ? 'Athleap Team Network' : 'Athleap Coaching Network',
        inviterName: 'Athleap Team',
        sport,
        invitationUrl,
        qrCodeUrl: null, // No QR code needed
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