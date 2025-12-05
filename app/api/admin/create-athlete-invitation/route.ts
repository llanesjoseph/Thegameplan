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
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://athleap.crucibleanalytics.dev'
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
 * Generate HTML email for athlete invitation - 2025 Brand Design
 */
function generateAthleteInvitationEmail(
  athleteName: string,
  coachName: string,
  sport: string,
  invitationUrl: string,
  qrCodeUrl: string,
  customMessage: string
): string {
  const firstName = athleteName?.split(' ')[0] || 'there'

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>You're Invited to ATHLEAP</title>
</head>
<body style="margin:0; padding:0; background-color:#f5f5f5; font-family: 'Open Sans', Arial, sans-serif;">
  <!-- Full width wrapper -->
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f5f5f5;">
    <tr>
      <td align="center" style="padding:16px;">

        <!-- Main container -->
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px; width:100%; background-color:#ffffff; border-radius:12px; box-shadow:0 4px 20px rgba(0,0,0,0.1);">

          <!-- Logo Banner -->
          <tr>
            <td align="center" style="background-color:#440102; padding:40px 20px; border-radius:12px 12px 0 0;">
              <img src="https://athleap.crucibleanalytics.dev/brand/athleap-logo-colored.png" alt="ATHLEAP" style="height:80px; width:auto; display:block;" />
            </td>
          </tr>

          <!-- Content Section -->
          <tr>
            <td style="padding:32px 24px;">
              <p style="color:#000000; font-size:18px; line-height:1.6; margin:0 0 16px 0; font-family: 'Open Sans', Arial, sans-serif;">
                Hi ${firstName} –
              </p>

              <p style="color:#000000; font-size:16px; line-height:1.6; margin:0 0 16px 0; font-family: 'Open Sans', Arial, sans-serif;">
                <strong>${coachName}</strong> has invited you to join their team on Athleap, a new platform blending the power of AI with the thrill of sports, creating unforgettable fan experiences and coaching next-generation athletes.
              </p>

              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0" border="0" align="center" style="margin:28px auto;">
                <tr>
                  <td align="center" style="background-color:#FC0105; border-radius:8px; padding:16px 40px;">
                    <a href="${invitationUrl}" style="color:#FFFFFF; font-size:16px; font-weight:700; text-decoration:none; display:block; font-family: 'Open Sans', Arial, sans-serif;">Accept Invite</a>
                  </td>
                </tr>
              </table>

              <p style="color:#000000; font-size:16px; line-height:1.6; margin:0 0 16px 0; font-family: 'Open Sans', Arial, sans-serif;">
                Join now and be a part of a company changing the future of sports. Once you are in, you can begin to train with ${coachName?.split(' ')[0] || 'your coach'} and follow other elite coaches.
              </p>

              <p style="color:#000000; font-size:16px; line-height:1.6; margin:16px 0 0 0; font-family: 'Open Sans', Arial, sans-serif;">
                We can't wait to have you on board!
              </p>

              <p style="color:#000000; font-size:16px; line-height:1.6; margin:16px 0 0 0; font-family: 'Open Sans', Arial, sans-serif;">
                See you inside,<br/>
                The Athleap Team
              </p>
            </td>
          </tr>

        </table>

        <!-- Footer -->
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px; width:100%;">
          <tr>
            <td align="center" style="padding:20px 0;">
              <p style="color:#666666; font-size:14px; margin:0; font-family: 'Open Sans', Arial, sans-serif;">© Athleap</p>
            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>
</body>
</html>`
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
