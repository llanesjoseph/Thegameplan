import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-utils'
import { adminDb as db } from '@/lib/firebase.admin'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * POST /api/admin/send-baked-profile-invite
 * 
 * Send invitation email to a coach for their baked profile.
 * Admin only.
 */
export async function POST(request: NextRequest) {
  try {
    // Require admin authentication
    const authResult = await requireAuth(request, ['admin', 'superadmin'])
    
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      )
    }
    
    const body = await request.json()
    const { bakedProfileId, email } = body
    
    if (!bakedProfileId || !email) {
      return NextResponse.json(
        { error: 'Missing bakedProfileId or email' },
        { status: 400 }
      )
    }
    
    // Get baked profile
    const bakedProfileDoc = await db.collection('baked_profiles').doc(bakedProfileId).get()
    
    if (!bakedProfileDoc.exists) {
      return NextResponse.json(
        { error: 'Baked profile not found' },
        { status: 404 }
      )
    }
    
    const bakedProfile = bakedProfileDoc.data()
    
    // AIRTIGHT: Verify email matches (case-insensitive, trimmed)
    const normalizedProfileEmail = bakedProfile?.targetEmail?.toLowerCase().trim()
    const normalizedRequestEmail = email.toLowerCase().trim()
    
    if (normalizedProfileEmail !== normalizedRequestEmail) {
      console.error(`[BAKED-PROFILE-INVITE] Email mismatch: profile=${normalizedProfileEmail}, request=${normalizedRequestEmail}`)
      return NextResponse.json(
        { error: 'Email does not match baked profile' },
        { status: 400 }
      )
    }
    
    // Check if already transferred
    if (bakedProfile?.status === 'transferred') {
      return NextResponse.json(
        { error: 'Baked profile has already been transferred' },
        { status: 400 }
      )
    }
    
    // Get the base URL for the invitation link
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : 'http://localhost:3000'
    
    // Create sign-up link - when they sign up with this email, the baked profile will auto-adopt
    const signUpUrl = `${baseUrl}/onboarding/auth`
    
    // Email content
    const emailSubject = `Welcome to GamePlan - Your Coach Profile is Ready!`
    const emailBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #FC0105; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background-color: #FC0105; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to GamePlan!</h1>
          </div>
          <div class="content">
            <p>Hi ${bakedProfile?.firstName || 'Coach'},</p>
            
            <p>We're excited to have you join GamePlan as a coach! Your profile has been set up and is ready for you to claim.</p>
            
            ${bakedProfile?.displayName ? `<p><strong>Your Profile:</strong> ${bakedProfile.displayName}</p>` : ''}
            ${bakedProfile?.sport ? `<p><strong>Sport:</strong> ${bakedProfile.sport}</p>` : ''}
            
            <p>To get started, simply sign up using this email address (<strong>${email}</strong>). Your profile will automatically be transferred to your account when you sign in.</p>
            
            <div style="text-align: center;">
              <a href="${signUpUrl}" class="button">Sign Up & Claim Your Profile</a>
            </div>
            
            <p>If you have any questions or need assistance, please don't hesitate to reach out to our support team.</p>
            
            <p>Welcome aboard!</p>
            <p><strong>The GamePlan Team</strong></p>
          </div>
          <div class="footer">
            <p>This email was sent to ${email}. If you did not expect this email, please ignore it.</p>
          </div>
        </div>
      </body>
      </html>
    `
    
    // Send email using your email service
    // Note: You'll need to integrate with your actual email service (SendGrid, AWS SES, etc.)
    // For now, we'll log it and return success
    // TODO: Replace with actual email sending service
    console.log('📧 Would send invitation email:', {
      to: email,
      subject: emailSubject,
      bakedProfileId,
      signUpUrl
    })
    
    // If you have an email service, uncomment and use it:
    /*
    const emailService = require('@/lib/email-service')
    await emailService.sendEmail({
      to: email,
      subject: emailSubject,
      html: emailBody
    })
    */
    
    // For now, we'll use a simple fetch to a generic email endpoint if it exists
    // Or you can integrate with your existing email service
    let emailSent = false
    try {
      // Try to use existing email service endpoint if available
      const emailRes = await fetch(`${baseUrl}/api/admin/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: email,
          subject: emailSubject,
          html: emailBody
        })
      }).catch(() => null)
      
      if (emailRes && emailRes.ok) {
        emailSent = true
        console.log('✅ Email sent via email service')
      } else {
        console.warn('Email service not available, invitation email not sent. Please send manually.')
        // Still continue - the baked profile is set up correctly
        // Admin can send email manually if needed
      }
    } catch (emailError) {
      console.warn('Failed to send email:', emailError)
      // Continue anyway - the baked profile is still valid
    }
    
    // Record that invite was sent
    await db.collection('baked_profiles').doc(bakedProfileId).update({
      inviteSentAt: new Date(),
      inviteSentBy: authResult.user.uid,
      updatedAt: new Date()
    })
    
    console.log(`✅ Invitation email ${emailSent ? 'sent' : 'logged'} for baked profile ${bakedProfileId} to ${email}`)
    
    return NextResponse.json({
      success: true,
      message: emailSent ? 'Invitation email sent successfully' : 'Invitation logged (email service may not be configured)',
      emailSent
    })
    
  } catch (error) {
    console.error('Error sending baked profile invite:', error)
    return NextResponse.json(
      { error: 'Failed to send invitation email' },
      { status: 500 }
    )
  }
}

