/**
 * API endpoint for sending bulk invitations with custom Athleap Early Access template
 * Admin/SuperAdmin only
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth, adminDb } from '@/lib/firebase.admin'
import { Timestamp } from 'firebase-admin/firestore'
import { Resend } from 'resend'

// Force dynamic rendering for API route
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const resend = new Resend(process.env.RESEND_API_KEY)

/**
 * POST - Send bulk invitation with Athleap Early Access template
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
    const { email, name, role, sport } = await request.json()

    // Validate required fields
    if (!email || !name || !role || !sport) {
      return NextResponse.json(
        { error: 'Missing required fields: email, name, role, sport' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUserQuery = await adminDb
      .collection('users')
      .where('email', '==', email.toLowerCase())
      .limit(1)
      .get()

    if (!existingUserQuery.empty) {
      return NextResponse.json(
        { error: 'A user with this email already exists in the system' },
        { status: 400 }
      )
    }

    // Generate unique invitation code (inv_<timestamp>_<random> format for simple validation)
    const timestamp = Date.now()
    const randomSuffix = Math.random().toString(36).substring(2, 15)
    const invitationCode = `inv_${timestamp}_${randomSuffix}`

    // Calculate expiration
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 14) // 14 days

    // Create invitation URL based on role
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://playbook.crucibleanalytics.dev'
    const onboardPath = role === 'COACH' ? 'coach-onboard' : 'athlete-onboard'
    const invitationUrl = `${baseUrl}/${onboardPath}/${invitationCode}`

    // Create invitation document
    const invitationData = {
      id: invitationCode,
      type: 'bulk_invitation',
      role: role.toLowerCase(),
      email: email.toLowerCase(),
      name,
      sport,
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

    // Send email with Athleap Early Access template
    let emailSent = false
    let emailError = null

    try {
      const emailResult = await resend.emails.send({
        from: 'Athleap Team <noreply@mail.crucibleanalytics.dev>',
        to: email,
        subject: 'Athleap Early Access Invitation',
        html: generateAthleapEarlyAccessEmail(name, role, invitationUrl)
      })

      if (emailResult.data?.id) {
        emailSent = true
        console.log(`✅ Athleap invitation email sent to ${email} (${emailResult.data.id})`)
      }
    } catch (error: any) {
      console.error('Error sending invitation email:', error)
      emailError = error.message
    }

    // Update invitation with email status
    await adminDb.collection('invitations').doc(invitationCode).update({
      emailSent,
      emailError
    })

    console.log(`✅ Athleap invitation created for ${email} (${role}) by ${userData.email}`)

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
    console.error('Error creating invitation:', error)
    return NextResponse.json(
      { error: 'Failed to create invitation', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * Generate Athleap Early Access HTML email (Table-based for email client compatibility)
 */
function generateAthleapEarlyAccessEmail(
  name: string,
  role: string,
  invitationUrl: string
): string {
  const greeting = name ? `Hi ${name}` : 'Hi there';
  const roleText = role === 'COACH' ? 'Coach' : 'Athlete';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>Athleap Early Access Invitation</title>
</head>
<body style="margin:0; padding:0; background-color:#0e0f12; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <!-- Full width wrapper -->
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0e0f12;">
    <tr>
      <td align="center" style="padding:20px 0;">

        <!-- Main container -->
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px; width:100%;">

          <!-- Hero Section with Single Hero Image -->
          <tr>
            <td style="background-color:#1a1b22; padding:0; border-radius:16px 16px 0 0; position:relative;">
              <!-- Single hero image -->
              <img src="https://res.cloudinary.com/dr0jtjwlh/image/upload/v1761863549/ezgif.com-animated-gif-maker_1_jttvsl.gif" alt="Athleap Athletes" width="100%" style="display:block; max-width:600px; height:auto; border-radius:16px 16px 0 0;"/>

              <!-- Hero Text Overlay -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:-250px; position:relative;">
                <tr>
                  <td align="center" style="padding:40px 20px;">
                    <h1 style="color:#ffffff; font-size:48px; font-weight:700; margin:0 0 10px 0; text-align:center; line-height:1.1;">Athleap Early Access</h1>
                    <p style="color:#e8e8ea; font-size:20px; font-weight:500; margin:0 0 20px 0; text-align:center; letter-spacing:0.3px;">Train smarter. Play harder. Grow together.</p>

                    <!-- CTA Button -->
                    <table cellpadding="0" cellspacing="0" border="0" align="center" style="margin:20px auto;">
                      <tr>
                        <td align="center" style="background-color:#ffffff; border-radius:12px; padding:14px 32px;">
                          <a href="${invitationUrl}" style="color:#111111; font-size:16px; font-weight:800; text-decoration:none; display:block;">Accept Your Invitation</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Content Section -->
          <tr>
            <td style="background-color:#14151a; border:1px solid #272833; border-radius:0 0 16px 16px; padding:28px;">
              <h3 style="color:#ffffff; font-size:24px; margin:0 0 16px 0;">${greeting} –</h3>

              <p style="color:#c7c8cc; font-size:16px; line-height:1.6; margin:0 0 16px 0;">
                We are excited to get you involved in the early testing of Athleap!
              </p>

              <p style="color:#c7c8cc; font-size:16px; line-height:1.6; margin:0 0 16px 0;">
                We hope to get your perspective on the Athleap concept – an AI driven platform for fan engagement and the future of sports. Through the platform, elite athletes can engage in coaching, gear recommendations, and training the next generation.
              </p>

              <p style="color:#c7c8cc; font-size:14px; margin:0 0 24px 0;">
                <strong style="color:#ffffff;">Your role:</strong> ${roleText}
              </p>

              <h3 style="color:#ffffff; font-size:22px; margin:24px 0 12px 0;">What we ask</h3>
              <ol style="color:#c7c8cc; font-size:16px; line-height:1.8; padding-left:20px; margin:0 0 16px 0;">
                <li>Set up a profile.</li>
                <li>Complete a lesson.</li>
                <li>Submit a video.</li>
                <li>Schedule a meeting.</li>
                <li>Visit the site store.</li>
              </ol>

              <p style="color:#999; font-size:14px; line-height:1.6; margin:20px 0;">
                Use the bug icon at the bottom of any page to report issues. The research remains open for 2 weeks; we'll follow up for feedback. Thank you!
              </p>

              <p style="color:#c7c8cc; font-size:16px; margin:20px 0 0 0;">
                Best,<br/>
                Athleap Team
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding:30px 0;">
              <p style="color:#666; font-size:14px; margin:0;">© Athleap</p>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>
</body>
</html>`;
}
