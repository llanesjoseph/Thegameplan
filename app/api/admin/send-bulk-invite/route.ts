/**
 * API endpoint for sending bulk invitations with custom Athleap Early Access template
 * Admin/SuperAdmin only
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth, adminDb } from '@/lib/firebase.admin'
import { Timestamp } from 'firebase-admin/firestore'
import { Resend } from 'resend'
import { normalizeSportName } from '@/lib/constants/sports'

// Force dynamic rendering for API route
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Lazy initialization of Resend to avoid build-time errors when API key is missing
let resendInstance: Resend | null = null
function getResend(): Resend | null {
  if (!resendInstance) {
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      console.warn('⚠️ RESEND_API_KEY not set - email notifications will be disabled')
      return null
    }
    resendInstance = new Resend(apiKey)
  }
  return resendInstance
}

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
    const { email, name, role, sport: rawSport, coachId } = await request.json()

    const normalizedRole = (role || '').toString().toUpperCase()
    const isAthlete = normalizedRole === 'ATHLETE'

    const sport = normalizeSportName((rawSport || '').toString())

    // Validate required fields
    if (!email || !name || !role || !sport) {
      return NextResponse.json(
        { error: 'Missing required fields: email, name, role, sport' },
        { status: 400 }
      )
    }

    if (isAthlete && !coachId) {
      return NextResponse.json(
        { error: 'Missing required field: coachId is required when role is ATHLETE' },
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
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://athleap.crucibleanalytics.dev'
    const onboardPath = normalizedRole === 'COACH' ? 'coach-onboard' : 'athlete-onboard'
    const invitationUrl = `${baseUrl}/${onboardPath}/${invitationCode}`

    // Create invitation document
    const invitationData: any = {
      id: invitationCode,
      type: 'bulk_invitation',
      role: normalizedRole.toLowerCase(),
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

    // When inviting athletes, also persist coach assignment fields
    if (isAthlete && coachId) {
      invitationData.creatorUid = coachId
      invitationData.coachId = coachId
      invitationData.athleteEmail = email.toLowerCase()
      invitationData.athleteName = name
    }

    await adminDb.collection('invitations').doc(invitationCode).set(invitationData)

    // Send email with Athleap Early Access template
    let emailSent = false
    let emailError = null

    try {
      const resend = getResend()
      if (!resend) {
        throw new Error('RESEND_API_KEY environment variable is not configured')
      }

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
 * Generate Athleap Invitation HTML email - Updated 2025 Brand Design
 * Clean white/red theme with simple call to action (table-based for email client compatibility)
 */
function generateAthleapEarlyAccessEmail(
  name: string,
  role: string,
  invitationUrl: string
): string {
  const greeting = name ? `Hi ${name.split(' ')[0]}` : 'Hi there';
  const isCoach = role === 'COACH';
  const ctaText = isCoach ? 'Join Our Community' : 'Accept Invite';

  const messageContent = isCoach
    ? `We are the founding team at Athleap, a new platform blending the power of AI with the thrill of sports, creating unforgettable fan experiences and coaching next-generation athletes. Our mission is simple: to help unlock athletic potential.
              </p>
              <p style="color:#000000; font-size:16px; line-height:1.6; margin:0 0 24px 0; font-family: 'Open Sans', Arial, sans-serif;">
                We are inviting a select group of elite athletes to join our early access community as coaches, shaping the tools that redefine how athletes train and compete.`
    : `<strong>The Athleap Team</strong> has invited you to join their team on Athleap, a new platform blending the power of AI with the thrill of sports, creating unforgettable fan experiences and coaching next-generation athletes.`;

  const closingMessage = isCoach
    ? `You've earned your place at the top – this is your chance to help define what comes next.`
    : `Join now and be a part of a company changing the future of sports. Once you are in, you can begin to train and follow other elite coaches.`;

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
                ${greeting} –
              </p>

              <p style="color:#000000; font-size:16px; line-height:1.6; margin:0 0 16px 0; font-family: 'Open Sans', Arial, sans-serif;">
                ${messageContent}
              </p>

              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0" border="0" align="center" style="margin:28px auto;">
                <tr>
                  <td align="center" style="background-color:#FC0105; border-radius:8px; padding:16px 40px;">
                    <a href="${invitationUrl}" style="color:#FFFFFF; font-size:16px; font-weight:700; text-decoration:none; display:block; font-family: 'Open Sans', Arial, sans-serif;">${ctaText}</a>
                  </td>
                </tr>
              </table>

              <p style="color:#000000; font-size:16px; line-height:1.6; margin:0 0 16px 0; font-family: 'Open Sans', Arial, sans-serif;">
                ${closingMessage}
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
</html>`;
}
