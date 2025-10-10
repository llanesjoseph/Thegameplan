/**
 * API endpoint for creating coach invitations
 * Admin/SuperAdmin only
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth, adminDb } from '@/lib/firebase.admin'
import { Timestamp } from 'firebase-admin/firestore'
import { Resend } from 'resend'

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

    // Generate unique invitation code
    const timestamp = Date.now()
    const randomSuffix = Math.random().toString(36).substring(2, 15)
    const invitationCode = `coach-${timestamp}-${randomSuffix}`

    // Calculate expiration
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + (expiresInDays || 7))

    // Create invitation URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const invitationUrl = `${baseUrl}/coach-onboard/${invitationCode}`

    // Create invitation document in 'invitations' collection (same as athlete invites)
    const invitationData = {
      id: invitationCode,
      type: 'coach_invitation',
      role: 'coach', // CRITICAL: Target role
      coachEmail: coachEmail.toLowerCase(),
      coachName,
      sport,
      customMessage: customMessage || `Join PLAYBOOKD as a ${sport} coach and help athletes reach their full potential!`,
      invitationUrl,
      status: 'pending',
      createdBy: decodedToken.uid,
      createdByName: userData.displayName || userData.email,
      createdAt: new Date().toISOString(),
      expiresAt: expiresAt.toISOString(),
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
        from: 'PLAYBOOKD Team <noreply@mail.crucibleanalytics.dev>',
        to: coachEmail,
        subject: 'Invitation to Join PLAYBOOKD as a Coach',
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
 * Generate HTML email for coach invitation
 */
function generateCoachInvitationEmail(
  coachName: string,
  sport: string,
  invitationUrl: string,
  customMessage: string,
  inviterName: string
): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Coach Invitation - PLAYBOOKD</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #20B2AA 0%, #91A6EB 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px;">🏆 PLAYBOOKD Coach Invitation</h1>
      </div>

      <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #20B2AA; margin-top: 0;">Hello ${coachName}!</h2>

        <p style="font-size: 16px;">
          You've been invited to join PLAYBOOKD as a <strong>${sport}</strong> coach!
        </p>

        ${customMessage ? `
        <div style="background: white; border-left: 4px solid #20B2AA; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 0; font-style: italic; color: #555;">${customMessage}</p>
        </div>
        ` : ''}

        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 2px solid #20B2AA;">
          <h3 style="color: #20B2AA; margin-top: 0;">What You Can Do as a Coach</h3>
          <ul style="color: #555; padding-left: 20px;">
            <li>Invite and manage your athletes</li>
            <li>Create custom playbooks and training content</li>
            <li>Track athlete progress and performance</li>
            <li>Communicate with your team through announcements</li>
            <li>Access comprehensive analytics and insights</li>
          </ul>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${invitationUrl}" style="display: inline-block; background: linear-gradient(135deg, #20B2AA 0%, #91A6EB 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 50px; font-weight: bold; font-size: 16px;">
            Accept Invitation & Setup Account
          </a>
        </div>

        <div style="background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; color: #856404; font-size: 14px;">
            <strong>⏰ Important:</strong> This invitation link will expire in 7 days. Please complete your account setup before then.
          </p>
        </div>

        <p style="font-size: 14px; color: #666; margin-top: 30px;">
          Invited by: <strong>${inviterName}</strong>
        </p>

        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">

        <p style="font-size: 12px; color: #999; text-align: center;">
          If you didn't expect this invitation or have questions, please contact the PLAYBOOKD team.<br>
          This invitation is personal and should not be shared.
        </p>
      </div>
    </body>
    </html>
  `
}
