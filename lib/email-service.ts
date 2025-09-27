import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

interface CoachInvitationEmailProps {
  to: string
  organizationName: string
  inviterName: string
  sport: string
  invitationUrl: string
  qrCodeUrl: string
  customMessage?: string
  expiresAt: string
}

export async function sendCoachInvitationEmail({
  to,
  organizationName,
  inviterName,
  sport,
  invitationUrl,
  qrCodeUrl,
  customMessage,
  expiresAt
}: CoachInvitationEmailProps) {
  try {
    const expiryDate = new Date(expiresAt).toLocaleDateString()

    const { data, error } = await resend.emails.send({
      from: 'GamePlan <onboarding@resend.dev>', // Using Resend's default domain for now
      to: [to],
      subject: `🏆 Join ${organizationName} as a ${sport} Coach`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Coach Invitation - ${organizationName}</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f8fafc;
            }
            .container {
              background: white;
              border-radius: 8px;
              padding: 40px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
            }
            .logo {
              font-size: 24px;
              font-weight: bold;
              color: #2563eb;
              margin-bottom: 10px;
            }
            .title {
              font-size: 28px;
              font-weight: bold;
              color: #1e293b;
              margin-bottom: 10px;
            }
            .subtitle {
              font-size: 18px;
              color: #64748b;
              margin-bottom: 30px;
            }
            .invitation-box {
              background: #f1f5f9;
              border-left: 4px solid #2563eb;
              padding: 20px;
              margin: 20px 0;
              border-radius: 0 8px 8px 0;
            }
            .cta-button {
              display: inline-block;
              background: #2563eb;
              color: white;
              padding: 16px 32px;
              text-decoration: none;
              border-radius: 8px;
              font-weight: 600;
              font-size: 16px;
              margin: 20px 0;
              text-align: center;
            }
            .cta-button:hover {
              background: #1d4ed8;
            }
            .qr-section {
              text-align: center;
              margin: 30px 0;
              padding: 20px;
              background: #f8fafc;
              border-radius: 8px;
            }
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #e2e8f0;
              font-size: 14px;
              color: #64748b;
              text-align: center;
            }
            .expiry-notice {
              background: #fef3c7;
              border: 1px solid #f59e0b;
              color: #92400e;
              padding: 12px;
              border-radius: 6px;
              margin: 20px 0;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">🏆 GamePlan</div>
              <h1 class="title">You're Invited to Coach!</h1>
              <p class="subtitle">Join ${organizationName} as a ${sport} coach</p>
            </div>

            <div class="invitation-box">
              <p><strong>${inviterName}</strong> from <strong>${organizationName}</strong> has invited you to join their coaching team!</p>
              ${customMessage ? `<p><em>"${customMessage}"</em></p>` : ''}
            </div>

            <div style="text-align: center;">
              <a href="${invitationUrl}" class="cta-button">
                🚀 Start Your Coach Application
              </a>
            </div>

            <div class="qr-section">
              <h3>Or scan this QR code:</h3>
              <img src="${qrCodeUrl}" alt="Coach Invitation QR Code" style="max-width: 200px; height: auto;">
              <p style="font-size: 12px; color: #64748b; margin-top: 10px;">
                Scan with your phone camera to open the invitation
              </p>
            </div>

            <div class="expiry-notice">
              ⏰ <strong>Important:</strong> This invitation expires on ${expiryDate}
            </div>

            <div style="margin: 30px 0; padding: 20px; background: #f0f9ff; border-radius: 8px;">
              <h3 style="color: #0369a1; margin-top: 0;">What happens next?</h3>
              <ol style="color: #075985; margin: 0;">
                <li>Click the button above to access your personalized application</li>
                <li>Fill out your coaching profile (takes about 5 minutes)</li>
                <li>Submit your application for review</li>
                <li>Get approved and start coaching on GamePlan!</li>
              </ol>
            </div>

            <div class="footer">
              <p>This invitation was sent by ${inviterName} (${organizationName})</p>
              <p style="margin-top: 10px;">
                <strong>GamePlan</strong> - Empowering coaches and athletes everywhere
              </p>
            </div>
          </div>
        </body>
        </html>
      `
    })

    if (error) {
      console.error('Failed to send coach invitation email:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Email service error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

interface ApplicationStatusEmailProps {
  to: string
  applicantName: string
  organizationName: string
  status: 'approved' | 'rejected'
  loginUrl?: string
}

export async function sendApplicationStatusEmail({
  to,
  applicantName,
  organizationName,
  status,
  loginUrl = 'https://gameplan.com/dashboard'
}: ApplicationStatusEmailProps) {
  try {
    const isApproved = status === 'approved'

    const { data, error } = await resend.emails.send({
      from: 'GamePlan <onboarding@resend.dev>',
      to: [to],
      subject: isApproved
        ? `🎉 Welcome to ${organizationName} - Coach Application Approved!`
        : `Coach Application Update - ${organizationName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Application ${isApproved ? 'Approved' : 'Update'}</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f8fafc;
            }
            .container {
              background: white;
              border-radius: 8px;
              padding: 40px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
            }
            .logo {
              font-size: 24px;
              font-weight: bold;
              color: #2563eb;
              margin-bottom: 10px;
            }
            .status-approved {
              background: #dcfce7;
              border: 2px solid #16a34a;
              color: #15803d;
              padding: 20px;
              border-radius: 8px;
              text-align: center;
              margin: 20px 0;
            }
            .status-rejected {
              background: #fef2f2;
              border: 2px solid #dc2626;
              color: #dc2626;
              padding: 20px;
              border-radius: 8px;
              text-align: center;
              margin: 20px 0;
            }
            .cta-button {
              display: inline-block;
              background: #2563eb;
              color: white;
              padding: 16px 32px;
              text-decoration: none;
              border-radius: 8px;
              font-weight: 600;
              font-size: 16px;
              margin: 20px 0;
              text-align: center;
            }
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #e2e8f0;
              font-size: 14px;
              color: #64748b;
              text-align: center;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">🏆 GamePlan</div>
              <h1>Application ${isApproved ? 'Approved!' : 'Update'}</h1>
            </div>

            <p>Hi ${applicantName},</p>

            ${isApproved ? `
              <div class="status-approved">
                <h2 style="margin-top: 0;">🎉 Congratulations!</h2>
                <p>Your coach application has been approved by ${organizationName}!</p>
                <p>You can now access your coach dashboard and start working with athletes.</p>
              </div>

              <div style="text-align: center;">
                <a href="${loginUrl}" class="cta-button">
                  🚀 Access Your Coach Dashboard
                </a>
              </div>

              <div style="margin: 30px 0; padding: 20px; background: #f0f9ff; border-radius: 8px;">
                <h3 style="color: #0369a1; margin-top: 0;">Getting Started as a Coach:</h3>
                <ul style="color: #075985;">
                  <li>Complete your coach profile</li>
                  <li>Set your availability and schedule</li>
                  <li>Start connecting with athletes</li>
                  <li>Create your first coaching sessions</li>
                </ul>
              </div>
            ` : `
              <div class="status-rejected">
                <h2 style="margin-top: 0;">Application Status Update</h2>
                <p>Thank you for your interest in coaching with ${organizationName}.</p>
                <p>Unfortunately, we are unable to move forward with your application at this time.</p>
              </div>

              <p>We appreciate the time you took to apply and encourage you to apply again in the future.</p>
            `}

            <div class="footer">
              <p><strong>GamePlan</strong> - Empowering coaches and athletes everywhere</p>
              <p>If you have any questions, please contact the ${organizationName} team.</p>
            </div>
          </div>
        </body>
        </html>
      `
    })

    if (error) {
      console.error('Failed to send application status email:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Email service error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}