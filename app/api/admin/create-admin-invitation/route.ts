/**
 * API endpoint for creating admin invitations
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
 * POST - Create admin invitation
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
    const { recipientEmail, recipientName, role, customMessage, expiresInDays } = await request.json()

    // Validate required fields
    if (!recipientEmail || !recipientName || !role) {
      return NextResponse.json(
        { error: 'Missing required fields: recipientEmail, recipientName, role' },
        { status: 400 }
      )
    }

    // Validate role
    if (!['admin', 'superadmin'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be "admin" or "superadmin"' },
        { status: 400 }
      )
    }

    // Only superadmins can create other superadmins
    if (role === 'superadmin' && userData.role !== 'superadmin') {
      return NextResponse.json(
        { error: 'Only superadmins can create other superadmin invitations' },
        { status: 403 }
      )
    }

    // Check if user already exists
    const existingUserQuery = await adminDb
      .collection('users')
      .where('email', '==', recipientEmail.toLowerCase())
      .limit(1)
      .get()

    if (!existingUserQuery.empty) {
      return NextResponse.json(
        { error: 'A user with this email already exists in the system' },
        { status: 400 }
      )
    }

    // Generate unique invitation code
    const invitationCode = `admin-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`

    // Calculate expiration
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + (expiresInDays || 7))

    // Create invitation document
    const invitationData = {
      code: invitationCode,
      type: 'admin',
      recipientEmail: recipientEmail.toLowerCase(),
      recipientName,
      role,
      customMessage: customMessage || '',
      status: 'active', // Admin invitations are auto-approved and immediately active
      autoApprove: true,
      createdBy: decodedToken.uid,
      createdByName: userData.displayName || userData.email,
      createdAt: Timestamp.now(),
      expiresAt: Timestamp.fromDate(expiresAt),
      usedAt: null,
      usedBy: null
    }

    const invitationRef = await adminDb.collection('admin_invitations').add(invitationData)

    // Generate invitation URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://athleap.crucibleanalytics.dev'
    const invitationUrl = `${baseUrl}/admin-onboard/${invitationCode}`

    // Send email invitation
    let emailSent = false
    let emailError = null

    try {
      // Check if Resend API key is configured
      if (!process.env.RESEND_API_KEY) {
        throw new Error('RESEND_API_KEY environment variable is not configured')
      }

      const emailResult = await resend.emails.send({
        from: 'Athleap Team <noreply@mail.crucibleanalytics.dev>',
        to: recipientEmail,
        subject: 'Invitation to Join Athleap Admin Team',
        html: generateAdminInvitationEmail(recipientName, role, invitationUrl, customMessage, userData.displayName || userData.email)
      })

      if (emailResult.data?.id) {
        emailSent = true
        console.log(`✅ Admin invitation email sent to ${recipientEmail} (${emailResult.data.id})`)
      } else if (emailResult.error) {
        // Resend returned an error
        emailError = `Resend API error: ${JSON.stringify(emailResult.error)}`
        console.error('Resend API error:', emailResult.error)
      }
    } catch (error: any) {
      console.error('Error sending admin invitation email:', error)
      emailError = error.message || 'Unknown email error'
    }

    // Update invitation with email status
    await invitationRef.update({
      emailSent,
      emailError
    })

    console.log(`✅ Admin invitation created for ${recipientEmail} (${role}) by ${userData.email}`)

    // Notify other admins about the invitation
    try {
      const adminEmails = await getAdminEmails()
      // Filter out the recipient from the notification list to avoid self-notification
      const notifyAdmins = adminEmails.filter(email => email.toLowerCase() !== recipientEmail.toLowerCase())

      if (notifyAdmins.length > 0) {
        await sendAdminNotificationEmail({
          adminEmails: notifyAdmins,
          invitationType: 'admin',
          recipientEmail,
          recipientName,
          senderName: userData.displayName || userData.email,
          senderEmail: userData.email,
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
        invitationId: invitationRef.id,
        url: invitationUrl,
        emailSent,
        emailError
      }
    }, { status: 200 })
  } catch (error: any) {
    console.error('Error creating admin invitation:', error)
    return NextResponse.json(
      { error: 'Failed to create admin invitation', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * Generate HTML email for admin invitation
 */
function generateAdminInvitationEmail(
  recipientName: string,
  role: string,
  invitationUrl: string,
  customMessage: string,
  inviterName: string
): string {
  const roleTitle = role === 'superadmin' ? 'Super Administrator' : 'Administrator'

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Admin Invitation - Athleap</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px;">🛡️ Athleap Admin Team</h1>
      </div>

      <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #667eea; margin-top: 0;">Hello ${recipientName}!</h2>

        <p style="font-size: 16px;">
          You've been invited to join the Athleap admin team as a <strong>${roleTitle}</strong>.
        </p>

        ${customMessage ? `
        <div style="background: white; border-left: 4px solid #667eea; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 0; font-style: italic; color: #555;">${customMessage}</p>
        </div>
        ` : ''}

        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 2px solid #667eea;">
          <h3 style="color: #667eea; margin-top: 0;">Your Admin Responsibilities</h3>
          <ul style="color: #555; padding-left: 20px;">
            ${role === 'superadmin' ? `
              <li>Full platform access and configuration</li>
              <li>Manage all users, coaches, and athletes</li>
              <li>Configure system settings and features</li>
              <li>Manage other administrators</li>
              <li>Monitor platform health and analytics</li>
            ` : `
              <li>Manage users, coaches, and athletes</li>
              <li>Review and moderate content</li>
              <li>Monitor safety and compliance systems</li>
              <li>Handle support and platform issues</li>
              <li>Access analytics and reporting</li>
            `}
          </ul>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${invitationUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 50px; font-weight: bold; font-size: 16px;">
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
          If you didn't expect this invitation or have questions, please contact the Athleap team.<br>
          This invitation is personal and should not be shared.
        </p>
      </div>
    </body>
    </html>
  `
}
