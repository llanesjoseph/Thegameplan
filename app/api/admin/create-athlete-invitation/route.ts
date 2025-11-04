/**
 * API endpoint for creating athlete invitations (admin version with coach assignment)
 * Admin/SuperAdmin only
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth, adminDb } from '@/lib/firebase.admin'
import { Timestamp } from 'firebase-admin/firestore'
import { Resend } from 'resend'
import { getAdminEmails, sendAdminNotificationEmail } from '@/lib/email-service'

// Force dynamic rendering for API route
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const resend = new Resend(process.env.RESEND_API_KEY)

/**
 * POST - Create athlete invitation with coach assignment
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split('Bearer ')[1]
    const decodedToken = await auth.verifyIdToken(token)

    // Verify admin role
    const userDoc = await adminDb.collection('users').doc(decodedToken.uid).get()
    const userData = userDoc.data()

    if (!userData || !['admin', 'superadmin'].includes(userData.role)) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    // Parse request body
    const { athleteEmail, athleteName, sport, creatorUid, customMessage, expiresInDays } = await request.json()

    // Validate required fields
    if (!athleteEmail || !athleteName || !sport || !creatorUid) {
      return NextResponse.json(
        { error: 'Missing required fields: athleteEmail, athleteName, sport, creatorUid' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUserQuery = await adminDb
      .collection('users')
      .where('email', '==', athleteEmail.toLowerCase())
      .limit(1)
      .get()

    if (!existingUserQuery.empty) {
      return NextResponse.json(
        { error: 'A user with this email already exists in the system' },
        { status: 400 }
      )
    }

    // Verify the coach exists and get coach info
    const coachDoc = await adminDb.collection('users').doc(creatorUid).get()
    if (!coachDoc.exists) {
      return NextResponse.json(
        { error: 'Coach not found' },
        { status: 404 }
      )
    }

    const coachData = coachDoc.data()
    const coachName = coachData?.displayName || 'Coach'
    const coachEmail = coachData?.email || ''

    // Verify coach has coach role
    if (coachData?.role !== 'coach') {
      return NextResponse.json(
        { error: 'Selected user is not a coach' },
        { status: 400 }
      )
    }

    // Generate unique invitation code
    const timestamp = Date.now()
    const randomSuffix = Math.random().toString(36).substring(2, 15)
    const invitationCode = `athlete-invite-${timestamp}-${randomSuffix}`

    // Calculate expiration
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + (expiresInDays || 14)) // Athletes get 14 days by default

    // Create invitation URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://playbook.crucibleanalytics.dev'
    const invitationUrl = `${baseUrl}/athlete-onboard/${invitationCode}`

    // Generate QR code URL
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(invitationUrl)}`

    // Create invitation document in 'invitations' collection (same as coach invites athlete)
    const invitationData = {
      id: invitationCode,
      type: 'athlete_invitation',
      role: 'athlete', // CRITICAL: Target role
      creatorUid, // The assigned coach
      coachId: creatorUid, // CRITICAL: Duplicate as coachId for absolute certainty (consistency with coach-created invitations)
      coachName,
      athleteEmail: athleteEmail.toLowerCase(),
      athleteName,
      sport,
      customMessage: customMessage || `Join our ${sport} team with Coach ${coachName} and take your performance to the next level!`,
      invitationUrl,
      qrCodeUrl,
      status: 'pending',
      createdBy: decodedToken.uid,
      createdByName: userData.displayName || userData.email,
      createdAt: Timestamp.now(),
      expiresAt: Timestamp.fromDate(expiresAt),
      used: false,
      usedAt: null,
      usedBy: null
    }

    await adminDb.collection('invitations').doc(invitationCode).set(invitationData)

    // Send email invitation to athlete
    let emailSent = false
    let emailError = null

    try {
      const emailResult = await resend.emails.send({
        from: 'Athleap Team <noreply@mail.crucibleanalytics.dev>',
        to: athleteEmail,
        subject: `Invitation to Join ${coachName}'s ${sport} Team on Athleap`,
        html: generateAthleteInvitationEmail(
          athleteName,
          coachName,
          sport,
          invitationUrl,
          qrCodeUrl,
          customMessage || invitationData.customMessage
        )
      })

      if (emailResult.data?.id) {
        emailSent = true
        console.log(`✅ Athlete invitation email sent to ${athleteEmail} (${emailResult.data.id})`)
      }
    } catch (error: any) {
      console.error('Error sending athlete invitation email:', error)
      emailError = error.message
    }

    // Update invitation with email status
    await adminDb.collection('invitations').doc(invitationCode).update({
      emailSent,
      emailError
    })

    // Send notification to coach
    if (coachEmail) {
      try {
        await resend.emails.send({
          from: 'Athleap Team <noreply@mail.crucibleanalytics.dev>',
          to: coachEmail,
          subject: `New Athlete Invitation Sent - ${athleteName}`,
          html: generateCoachNotificationEmail(coachName, athleteName, sport, userData.displayName || userData.email)
        })
        console.log(`📧 Coach notification sent to ${coachEmail}`)
      } catch (error) {
        console.error('Failed to send coach notification:', error)
        // Don't fail the request if notification fails
      }
    }

    console.log(`✅ Athlete invitation created for ${athleteEmail} assigned to coach ${creatorUid} by ${userData.email}`)

    // Notify admins about the invitation
    try {
      const adminEmails = await getAdminEmails()
      if (adminEmails.length > 0) {
        await sendAdminNotificationEmail({
          adminEmails,
          invitationType: 'athlete',
          recipientEmail: athleteEmail,
          recipientName: athleteName,
          senderName: userData.displayName || userData.email,
          senderEmail: userData.email,
          sport,
          customMessage
        })
      }
    } catch (error) {
      console.error('Failed to send admin notification:', error)
      // Don't fail the request if admin notification fails
    }

    return NextResponse.json({
      success: true,
      data: {
        invitationId: invitationCode,
        url: invitationUrl,
        qrCodeUrl,
        emailSent,
        emailError,
        assignedCoach: coachName
      }
    }, { status: 200 })
  } catch (error: any) {
    console.error('Error creating athlete invitation:', error)
    return NextResponse.json(
      { error: 'Failed to create athlete invitation', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * Generate HTML email for athlete invitation
 */
function generateAthleteInvitationEmail(
  athleteName: string,
  coachName: string,
  sport: string,
  invitationUrl: string,
  qrCodeUrl: string,
  customMessage: string
): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Athlete Invitation - Athleap</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #91A6EB 0%, #20B2AA 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px;">🏆 Join Athleap</h1>
      </div>

      <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #91A6EB; margin-top: 0;">Hello ${athleteName}!</h2>

        <p style="font-size: 16px;">
          <strong>Coach ${coachName}</strong> has invited you to join their <strong>${sport}</strong> team on Athleap!
        </p>

        ${customMessage ? `
        <div style="background: white; border-left: 4px solid #91A6EB; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 0; font-style: italic; color: #555;">${customMessage}</p>
        </div>
        ` : ''}

        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 2px solid #91A6EB;">
          <h3 style="color: #91A6EB; margin-top: 0;">What You'll Get on Athleap</h3>
          <ul style="color: #555; padding-left: 20px;">
            <li>Access to custom playbooks and training content</li>
            <li>Track your progress and performance metrics</li>
            <li>Stay connected with your coach and team</li>
            <li>Receive personalized feedback and coaching</li>
            <li>View team announcements and updates</li>
          </ul>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${invitationUrl}" style="display: inline-block; background: linear-gradient(135deg, #91A6EB 0%, #20B2AA 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 50px; font-weight: bold; font-size: 16px;">
            Accept Invitation & Join Team
          </a>
        </div>

        <div style="text-align: center; margin: 20px 0;">
          <p style="color: #666; font-size: 14px; margin-bottom: 10px;">Or scan this QR code:</p>
          <img src="${qrCodeUrl}" alt="QR Code" style="width: 200px; height: 200px; border: 2px solid #91A6EB; border-radius: 8px; padding: 10px; background: white;" />
        </div>

        <div style="background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; color: #856404; font-size: 14px;">
            <strong>⏰ Important:</strong> This invitation link will expire in 14 days. Please complete your account setup before then.
          </p>
        </div>

        <p style="font-size: 14px; color: #666; margin-top: 30px;">
          Coach: <strong>${coachName}</strong><br>
          Sport: <strong>${sport}</strong>
        </p>

        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">

        <p style="font-size: 12px; color: #999; text-align: center;">
          If you didn't expect this invitation or have questions, please contact your coach or the Athleap team.<br>
          This invitation is personal and should not be shared.
        </p>
      </div>
    </body>
    </html>
  `
}

/**
 * Generate coach notification email
 */
function generateCoachNotificationEmail(
  coachName: string,
  athleteName: string,
  sport: string,
  adminName: string
): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Athlete Invitation Sent - Athleap</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #20B2AA 0%, #91A6EB 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">📧 Athlete Invitation Sent</h1>
      </div>

      <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #20B2AA; margin-top: 0;">Hello Coach ${coachName}!</h2>

        <p style="font-size: 16px;">
          An administrator has sent an invitation to <strong>${athleteName}</strong> to join your <strong>${sport}</strong> team.
        </p>

        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 2px solid #20B2AA;">
          <h3 style="color: #20B2AA; margin-top: 0;">Invitation Details</h3>
          <ul style="color: #555; padding-left: 20px; list-style: none; padding-left: 0;">
            <li style="margin-bottom: 10px;"><strong>Athlete:</strong> ${athleteName}</li>
            <li style="margin-bottom: 10px;"><strong>Sport:</strong> ${sport}</li>
            <li style="margin-bottom: 10px;"><strong>Sent by:</strong> ${adminName}</li>
          </ul>
        </div>

        <div style="background: #d1ecf1; border: 1px solid #bee5eb; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; color: #0c5460; font-size: 14px;">
            <strong>ℹ️ Next Steps:</strong> You'll receive a notification when ${athleteName} accepts the invitation and completes their account setup.
          </p>
        </div>

        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">

        <p style="font-size: 12px; color: #999; text-align: center;">
          This is an automated notification from Athleap.
        </p>
      </div>
    </body>
    </html>
  `
}
