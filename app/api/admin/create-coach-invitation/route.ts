/**
 * API endpoint for creating coach invitations
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
 * POST - Create coach invitation
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
    const { coachEmail, coachName, sport, customMessage, expiresInDays } = await request.json()

    // Validate required fields
    if (!coachEmail || !coachName || !sport) {
      return NextResponse.json(
        { error: 'Missing required fields: coachEmail, coachName, sport' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUserQuery = await adminDb
      .collection('users')
      .where('email', '==', coachEmail.toLowerCase())
      .limit(1)
      .get()

    if (!existingUserQuery.empty) {
      return NextResponse.json(
        { error: 'A user with this email already exists in the system' },
        { status: 400 }
      )
    }

    // Generate unique invitation code (using inv_ prefix for compatibility with validation system)
    const timestamp = Date.now()
    const randomSuffix = Math.random().toString(36).substring(2, 15)
    const invitationCode = `inv_${timestamp}_${randomSuffix}`

    // Calculate expiration
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + (expiresInDays || 7))

    // Create invitation URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://athleap.crucibleanalytics.dev'
    const invitationUrl = `${baseUrl}/coach-onboard/${invitationCode}`

    // Create invitation document in 'invitations' collection (same as athlete invites)
    const invitationData = {
      id: invitationCode,
      type: 'coach_invitation',
      role: 'coach', // CRITICAL: Target role
      coachEmail: coachEmail.toLowerCase(),
      coachName,
      sport,
      customMessage: customMessage || `Join AthLeap as a ${sport} coach and help athletes reach their full potential!`,
      invitationUrl,
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

    // Send email invitation
    let emailSent = false
    let emailError = null

    try {
      const emailResult = await resend.emails.send({
        from: 'AthLeap Team <noreply@mail.crucibleanalytics.dev>',
        to: coachEmail,
        subject: 'Invitation to Join AthLeap as a Coach',
        html: generateCoachInvitationEmail(coachName, sport, invitationUrl, customMessage || invitationData.customMessage, userData.displayName || userData.email)
      })

      if (emailResult.data?.id) {
        emailSent = true
        console.log(`✅ Coach invitation email sent to ${coachEmail} (${emailResult.data.id})`)
      }
    } catch (error: any) {
      console.error('Error sending coach invitation email:', error)
      emailError = error.message
    }

    // Update invitation with email status
    await adminDb.collection('invitations').doc(invitationCode).update({
      emailSent,
      emailError
    })

    console.log(`✅ Coach invitation created for ${coachEmail} (${sport}) by ${userData.email}`)

    // Notify admins about the invitation
    try {
      const adminEmails = await getAdminEmails()
      if (adminEmails.length > 0) {
        await sendAdminNotificationEmail({
          adminEmails,
          invitationType: 'coach',
          recipientEmail: coachEmail,
          recipientName: coachName,
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
        emailSent,
        emailError
      }
    }, { status: 200 })
  } catch (error: any) {
    console.error('Error creating coach invitation:', error)
    return NextResponse.json(
      { error: 'Failed to create coach invitation', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * Generate HTML email for coach invitation - 2025 Brand Design
 */
function generateCoachInvitationEmail(
  coachName: string,
  sport: string,
  invitationUrl: string,
  customMessage: string,
  inviterName: string
): string {
  const firstName = coachName?.split(' ')[0] || 'there'

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
                We are the founding team at Athleap, a new platform blending the power of AI with the thrill of sports, creating unforgettable fan experiences and coaching next-generation athletes. Our mission is simple: to help unlock athletic potential.
              </p>

              <p style="color:#000000; font-size:16px; line-height:1.6; margin:0 0 24px 0; font-family: 'Open Sans', Arial, sans-serif;">
                We are inviting a select group of elite athletes to join our early access community as coaches, shaping the tools that redefine how athletes train and compete.
              </p>

              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0" border="0" align="center" style="margin:28px auto;">
                <tr>
                  <td align="center" style="background-color:#FC0105; border-radius:8px; padding:16px 40px;">
                    <a href="${invitationUrl}" style="color:#FFFFFF; font-size:16px; font-weight:700; text-decoration:none; display:block; font-family: 'Open Sans', Arial, sans-serif;">Join Our Community</a>
                  </td>
                </tr>
              </table>

              <p style="color:#000000; font-size:16px; line-height:1.6; margin:0 0 16px 0; font-family: 'Open Sans', Arial, sans-serif;">
                You've earned your place at the top – this is your chance to help define what comes next.
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
