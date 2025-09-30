import { Resend } from 'resend'
import { getEmailTemplate } from './email-templates'

const resend = new Resend(process.env.RESEND_API_KEY)

interface CoachInvitationEmailProps {
  to: string
  organizationName: string
  inviterName: string
  sport: string
  invitationUrl: string
  qrCodeUrl: string | null
  customMessage?: string
  expiresAt: string
  recipientName?: string
  templateType?: 'playbookd' | 'simple'
}

export async function sendCoachInvitationEmail({
  to,
  organizationName,
  inviterName,
  sport,
  invitationUrl,
  qrCodeUrl,
  customMessage,
  expiresAt,
  recipientName,
  templateType = 'playbookd'
}: CoachInvitationEmailProps) {
  try {
    // Generate the HTML using the new template system
    const htmlContent = getEmailTemplate(templateType, {
      organizationName,
      inviterName,
      sport,
      invitationUrl,
      qrCodeUrl,
      customMessage,
      expiresAt,
      recipientName
    })

    const { data, error } = await resend.emails.send({
      from: 'PLAYBOOKD <noreply@mail.crucibleanalytics.dev>', // Use verified mail subdomain
      to: [to],
      subject: `🏆 You're Invited to Join ${organizationName} - PLAYBOOKD`,
      html: htmlContent
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
  loginUrl = 'https://playbookd.com/dashboard'
}: ApplicationStatusEmailProps) {
  try {
    const isApproved = status === 'approved'

    const { data, error } = await resend.emails.send({
      from: 'PLAYBOOKD <joseph@crucibleanalytics.dev>',
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
              <div class="logo">🏆 PLAYBOOKD</div>
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
              <p><strong>PLAYBOOKD</strong> - For The Future of Sports</p>
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
interface AthleteInvitationEmailProps {
  to: string
  athleteName: string
  coachName: string
  sport: string
  invitationUrl: string
  qrCodeUrl: string
  customMessage?: string
  expiresAt: string
}

export async function sendAthleteInvitationEmail({
  to,
  athleteName,
  coachName,
  sport,
  invitationUrl,
  qrCodeUrl,
  customMessage,
  expiresAt
}: AthleteInvitationEmailProps) {
  try {
    const expiryDate = new Date(expiresAt).toLocaleDateString()

    const { data, error } = await resend.emails.send({
      from: 'PLAYBOOKD <noreply@mail.crucibleanalytics.dev>',
      to: [to],
      subject: `🏆 You're Invited to Train with ${coachName} - PLAYBOOKD`,
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Athletic Training Invitation - PLAYBOOKD</title>
            <style>
                body { font-family: 'Inter', sans-serif; background-color: #E8E6D8; margin: 0; padding: 16px; }
                .cta-button { background-color: #A01C21; color: white; font-weight: bold; padding: 16px 40px; border-radius: 8px; text-decoration: none; text-transform: uppercase; letter-spacing: 2px; font-size: 18px; display: inline-block; }
                .invitation-card { background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); border-left: 4px solid #A01C21; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0; }
                .qr-section { background: #f1f5f9; border: 2px dashed #13367A; border-radius: 12px; padding: 20px; margin: 20px 0; text-align: center; }
                .expiry-notice { background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border: 1px solid #f59e0b; color: #92400e; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center; font-weight: 600; }
            </style>
        </head>
        <body>
            <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; box-shadow: 0 20px 40px rgba(0,0,0,0.1); overflow: hidden;">
                <header style="background-color: #13367A; padding: 24px; text-align: center;">
                    <h1 style="font-size: 3rem; color: white; letter-spacing: 3px; margin: 0; font-weight: bold;">PLAYBOOKD</h1>
                    <p style="color: #87ceeb; font-size: 14px; margin: 4px 0 0 0; letter-spacing: 3px;">FOR THE FUTURE OF SPORTS</p>
                </header>
                <div><img src="https://res.cloudinary.com/dr0jtjwlh/image/upload/v1758865671/2023_11_2_ze5r3n.jpg" alt="Athletic Training" style="width: 100%; height: auto; display: block;"></div>
                <main style="padding: 40px 24px; text-align: center;">
                    <h2 style="font-size: 2.5rem; color: #13367A; line-height: 1.2; margin: 0 0 8px 0; font-weight: bold;">WELCOME ${athleteName.toUpperCase()}</h2>
                    <h3 style="font-size: 1.5rem; color: #A01C21; margin: 0 0 24px 0; font-weight: bold;">JOIN ${coachName.toUpperCase()}'S ${sport.toUpperCase()} TRAINING</h3>
                    <div class="invitation-card"><p style="margin: 0; color: #374151; font-size: 16px; line-height: 1.6;"><strong>${coachName}</strong> has invited you to join their elite ${sport} training program!</p>${customMessage ? `<p style="margin: 16px 0 0 0; color: #6366f1; font-style: italic; font-size: 15px;">"${customMessage}"</p>` : ''}</div>
                    <p style="color: #4b5563; margin: 24px auto; max-width: 500px; line-height: 1.6; font-size: 16px;">Take your ${sport} skills to the next level with personalized coaching, advanced training techniques, and performance tracking on the PLAYBOOKD platform.</p>
                    <div style="margin: 32px 0;"><a href="${invitationUrl}" class="cta-button">Join Training Program</a></div>
                    <div class="qr-section"><h4 style="color: #13367A; margin: 0 0 12px 0; font-size: 18px; font-weight: 600;">Or scan this QR code:</h4><img src="${qrCodeUrl}" alt="Training Invitation QR Code" style="max-width: 180px; height: auto; margin: 0 auto; display: block;"><p style="font-size: 12px; color: #6b7280; margin: 12px 0 0 0;">Scan with your phone camera to open the invitation</p></div>
                    <div class="expiry-notice">⏰ <strong>Important:</strong> This invitation expires on ${expiryDate}</div>
                </main>
                <footer style="background-color: #f9fafb; text-align: center; padding: 24px; border-top: 1px solid #e5e7eb;"><p style="color: #6b7280; font-size: 14px; margin: 0 0 8px 0;">This invitation was sent by ${coachName}</p><p style="margin: 0; font-weight: 700; color: #13367A; font-size: 16px;">PLAYBOOKD - FOR THE FUTURE OF SPORTS</p></footer>
            </div>
        </body>
        </html>
      `
    })

    if (error) {
      console.error('Failed to send athlete invitation email:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Athlete invitation email service error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
