import { Resend } from 'resend'
import { getEmailTemplate } from './email-templates'

const resend = new Resend(process.env.RESEND_API_KEY)
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://playbookd.crucibleanalytics.dev'

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

interface CoachNotificationEmailProps {
  to: string
  coachName: string
  type: 'invitation_sent' | 'invitation_accepted' | 'invitation_declined' | 'invitation_expired' | 'athlete_profile_created'
  athleteInfo?: {
    name: string
    email: string
    sport?: string
    skillLevel?: string
    goals?: string
  }
  invitationsSummary?: {
    totalSent: number
    athleteNames: string[]
    sport: string
  }
  timestamp?: string
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

export async function sendCoachNotificationEmail({
  to,
  coachName,
  type,
  athleteInfo,
  invitationsSummary,
  timestamp = new Date().toISOString()
}: CoachNotificationEmailProps) {
  try {
    let subject = ''
    let htmlContent = ''

    // Generate appropriate subject and content based on notification type
    switch (type) {
      case 'invitation_sent':
        if (invitationsSummary) {
          subject = `✅ ${invitationsSummary.totalSent} Athlete Invitation${invitationsSummary.totalSent > 1 ? 's' : ''} Sent Successfully - PLAYBOOKD`
          htmlContent = generateInvitationSentEmail(coachName, invitationsSummary)
        }
        break

      case 'invitation_accepted':
        if (athleteInfo) {
          subject = `🎉 ${athleteInfo.name} Accepted Your Invitation - PLAYBOOKD`
          htmlContent = generateInvitationAcceptedEmail(coachName, athleteInfo)
        }
        break

      case 'invitation_declined':
        if (athleteInfo) {
          subject = `📢 ${athleteInfo.name} Declined Your Invitation - PLAYBOOKD`
          htmlContent = generateInvitationDeclinedEmail(coachName, athleteInfo)
        }
        break

      case 'invitation_expired':
        if (athleteInfo) {
          subject = `⏰ Invitation to ${athleteInfo.name} Has Expired - PLAYBOOKD`
          htmlContent = generateInvitationExpiredEmail(coachName, athleteInfo)
        }
        break

      case 'athlete_profile_created':
        if (athleteInfo) {
          subject = `🎉 ${athleteInfo.name} Created Their Athlete Profile - PLAYBOOKD`
          htmlContent = generateAthleteProfileCreatedEmail(coachName, athleteInfo)
        }
        break

      default:
        throw new Error(`Unknown notification type: ${type}`)
    }

    const { data, error } = await resend.emails.send({
      from: 'PLAYBOOKD <noreply@mail.crucibleanalytics.dev>',
      to: [to],
      subject,
      html: htmlContent
    })

    if (error) {
      console.error(`Failed to send coach notification email (${type}):`, error)
      return { success: false, error: error.message }
    }

    console.log(`✅ Coach notification sent (${type}) to ${to}`)
    return { success: true, data }
  } catch (error) {
    console.error('Coach notification email service error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Helper functions to generate email HTML content for different notification types
function generateInvitationSentEmail(coachName: string, summary: { totalSent: number; athleteNames: string[]; sport: string }) {
  const athleteList = summary.athleteNames.slice(0, 10).map(name => `<li style="margin: 8px 0; color: #4b5563;">${name}</li>`).join('')
  const moreCount = summary.athleteNames.length > 10 ? summary.athleteNames.length - 10 : 0

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Invitations Sent Successfully</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
      <div style="background: white; border-radius: 12px; padding: 40px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #13367A; font-size: 32px; margin: 0; font-weight: bold;">PLAYBOOKD</h1>
          <p style="color: #64748b; font-size: 14px; margin: 5px 0; letter-spacing: 2px;">FOR THE FUTURE OF SPORTS</p>
        </div>

        <div style="background: #dcfce7; border: 2px solid #16a34a; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
          <h2 style="color: #15803d; margin: 0;">✅ Invitations Sent Successfully!</h2>
        </div>

        <p>Hi ${coachName},</p>

        <p>Great news! Your ${summary.sport} training invitations have been sent to the following athletes:</p>

        <div style="background: #f1f5f9; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h3 style="color: #1e40af; margin-top: 0;">📧 ${summary.totalSent} Invitation${summary.totalSent > 1 ? 's' : ''} Sent:</h3>
          <ul style="margin: 0; padding-left: 20px;">
            ${athleteList}
            ${moreCount > 0 ? `<li style="margin: 8px 0; color: #6b7280; font-style: italic;">...and ${moreCount} more</li>` : ''}
          </ul>
        </div>

        <div style="background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h3 style="color: #1e40af; margin-top: 0;">What happens next?</h3>
          <ol style="margin: 0; padding-left: 20px; color: #1e3a8a;">
            <li style="margin: 8px 0;">Athletes receive your personalized invitation email</li>
            <li style="margin: 8px 0;">They click the link to accept and join your program</li>
            <li style="margin: 8px 0;">You'll be notified when they accept</li>
            <li style="margin: 8px 0;">Start training together on PLAYBOOKD!</li>
          </ol>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${APP_URL}/dashboard/coach/athletes" style="background-color: #A01C21; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">View Your Athletes</a>
        </div>

        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; color: #64748b; font-size: 14px;">
          <p><strong>PLAYBOOKD</strong> - For The Future of Sports</p>
          <p style="font-size: 12px;">This is an automated notification. Please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `
}

function generateInvitationAcceptedEmail(coachName: string, athleteInfo: { name: string; email: string; sport?: string }) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Athlete Accepted Invitation</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
      <div style="background: white; border-radius: 12px; padding: 40px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #13367A; font-size: 32px; margin: 0; font-weight: bold;">PLAYBOOKD</h1>
          <p style="color: #64748b; font-size: 14px; margin: 5px 0; letter-spacing: 2px;">FOR THE FUTURE OF SPORTS</p>
        </div>

        <div style="background: #dcfce7; border: 2px solid #16a34a; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
          <h2 style="color: #15803d; margin: 0;">🎉 New Athlete Joined!</h2>
        </div>

        <p>Hi ${coachName},</p>

        <p>Great news! <strong>${athleteInfo.name}</strong> has accepted your invitation and joined your ${athleteInfo.sport || 'training'} program.</p>

        <div style="background: #f0f9ff; border-left: 4px solid #0284c7; padding: 20px; margin: 20px 0;">
          <h3 style="color: #0369a1; margin-top: 0;">Athlete Details:</h3>
          <p style="margin: 5px 0;"><strong>Name:</strong> ${athleteInfo.name}</p>
          <p style="margin: 5px 0;"><strong>Email:</strong> ${athleteInfo.email}</p>
          ${athleteInfo.sport ? `<p style="margin: 5px 0;"><strong>Sport:</strong> ${athleteInfo.sport}</p>` : ''}
        </div>

        <p>You can now:</p>
        <ul style="color: #4b5563;">
          <li>Create personalized training plans for ${athleteInfo.name}</li>
          <li>Share videos, drills, and coaching content</li>
          <li>Track their progress and performance</li>
          <li>Communicate directly through the platform</li>
        </ul>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${APP_URL}/dashboard/coach/athletes" style="background-color: #A01C21; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">View Your Athletes</a>
        </div>

        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; color: #64748b; font-size: 14px;">
          <p><strong>PLAYBOOKD</strong> - For The Future of Sports</p>
          <p style="font-size: 12px;">This is an automated notification. Please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `
}

function generateInvitationDeclinedEmail(coachName: string, athleteInfo: { name: string; email: string; sport?: string }) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Invitation Update</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
      <div style="background: white; border-radius: 12px; padding: 40px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #13367A; font-size: 32px; margin: 0; font-weight: bold;">PLAYBOOKD</h1>
          <p style="color: #64748b; font-size: 14px; margin: 5px 0; letter-spacing: 2px;">FOR THE FUTURE OF SPORTS</p>
        </div>

        <div style="background: #fef2f2; border: 2px solid #f87171; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
          <h2 style="color: #dc2626; margin: 0;">Invitation Update</h2>
        </div>

        <p>Hi ${coachName},</p>

        <p>We wanted to let you know that <strong>${athleteInfo.name}</strong> has declined your invitation to join your ${athleteInfo.sport || 'training'} program.</p>

        <div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Athlete:</strong> ${athleteInfo.name}</p>
          <p style="margin: 5px 0;"><strong>Email:</strong> ${athleteInfo.email}</p>
        </div>

        <p>Don't be discouraged! Athletes may decline invitations for various reasons. You can:</p>
        <ul style="color: #4b5563;">
          <li>Reach out directly to understand their decision</li>
          <li>Send invitations to other potential athletes</li>
          <li>Continue building your coaching program</li>
        </ul>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${APP_URL}/dashboard/coach/athletes" style="background-color: #A01C21; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Invite More Athletes</a>
        </div>

        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; color: #64748b; font-size: 14px;">
          <p><strong>PLAYBOOKD</strong> - For The Future of Sports</p>
          <p style="font-size: 12px;">This is an automated notification. Please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `
}

function generateInvitationExpiredEmail(coachName: string, athleteInfo: { name: string; email: string; sport?: string }) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Invitation Expired</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
      <div style="background: white; border-radius: 12px; padding: 40px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #13367A; font-size: 32px; margin: 0; font-weight: bold;">PLAYBOOKD</h1>
          <p style="color: #64748b; font-size: 14px; margin: 5px 0; letter-spacing: 2px;">FOR THE FUTURE OF SPORTS</p>
        </div>

        <div style="background: #fef3c7; border: 2px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
          <h2 style="color: #d97706; margin: 0;">⏰ Invitation Expired</h2>
        </div>

        <p>Hi ${coachName},</p>

        <p>The invitation you sent to <strong>${athleteInfo.name}</strong> has expired without being accepted.</p>

        <div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Athlete:</strong> ${athleteInfo.name}</p>
          <p style="margin: 5px 0;"><strong>Email:</strong> ${athleteInfo.email}</p>
          ${athleteInfo.sport ? `<p style="margin: 5px 0;"><strong>Sport:</strong> ${athleteInfo.sport}</p>` : ''}
        </div>

        <p>Would you like to send a new invitation? Athletes sometimes miss emails or need a reminder. You can:</p>
        <ul style="color: #4b5563;">
          <li>Send a new invitation to ${athleteInfo.name}</li>
          <li>Reach out directly via phone or text</li>
          <li>Invite other athletes to your program</li>
        </ul>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${APP_URL}/dashboard/coach/athletes" style="background-color: #A01C21; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Resend Invitation</a>
        </div>

        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; color: #64748b; font-size: 14px;">
          <p><strong>PLAYBOOKD</strong> - For The Future of Sports</p>
          <p style="font-size: 12px;">This is an automated notification. Please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `
}

function generateAthleteProfileCreatedEmail(coachName: string, athleteInfo: { name: string; email: string; sport?: string; skillLevel?: string; goals?: string }) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Athlete Profile Created</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
      <div style="background: white; border-radius: 12px; padding: 40px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #13367A; font-size: 32px; margin: 0; font-weight: bold;">PLAYBOOKD</h1>
          <p style="color: #64748b; font-size: 14px; margin: 5px 0; letter-spacing: 2px;">FOR THE FUTURE OF SPORTS</p>
        </div>

        <div style="background: #dcfce7; border: 2px solid #16a34a; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
          <h2 style="color: #15803d; margin: 0;">🎉 New Athlete Profile Created!</h2>
        </div>

        <p>Hi ${coachName},</p>

        <p>Great news! <strong>${athleteInfo.name}</strong> has completed their athlete profile and is ready to start training with you.</p>

        <div style="background: #f0f9ff; border-left: 4px solid #0284c7; padding: 20px; margin: 20px 0;">
          <h3 style="color: #0369a1; margin-top: 0;">Athlete Profile:</h3>
          <p style="margin: 5px 0;"><strong>Name:</strong> ${athleteInfo.name}</p>
          ${athleteInfo.sport ? `<p style="margin: 5px 0;"><strong>Primary Sport:</strong> ${athleteInfo.sport}</p>` : ''}
          ${athleteInfo.skillLevel ? `<p style="margin: 5px 0;"><strong>Skill Level:</strong> ${athleteInfo.skillLevel}</p>` : ''}
          ${athleteInfo.goals ? `<p style="margin: 5px 0;"><strong>Training Goals:</strong> ${athleteInfo.goals}</p>` : ''}
        </div>

        <p>You can now:</p>
        <ul style="color: #4b5563;">
          <li>View their complete athletic profile</li>
          <li>See their training goals and availability</li>
          <li>Create personalized training plans</li>
          <li>Start scheduling training sessions</li>
        </ul>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${APP_URL}/dashboard/coach/athletes" style="background-color: #A01C21; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">View Athlete Profile</a>
        </div>

        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; color: #64748b; font-size: 14px;">
          <p><strong>PLAYBOOKD</strong> - For The Future of Sports</p>
          <p style="font-size: 12px;">This is an automated notification. Please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `
}

// Athlete welcome email with password setup link
interface AthleteWelcomeEmailProps {
  to: string
  athleteName: string
  coachName: string
  sport: string
  passwordResetLink: string
}

export async function sendAthleteWelcomeEmail({
  to,
  athleteName,
  coachName,
  sport,
  passwordResetLink
}: AthleteWelcomeEmailProps) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'PLAYBOOKD <noreply@mail.crucibleanalytics.dev>',
      to: [to],
      subject: `🏆 Welcome to PLAYBOOKD - Set Your Password`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to PLAYBOOKD</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
          <div style="background: white; border-radius: 12px; padding: 40px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #13367A; font-size: 32px; margin: 0; font-weight: bold;">PLAYBOOKD</h1>
              <p style="color: #64748b; font-size: 14px; margin: 5px 0; letter-spacing: 2px;">FOR THE FUTURE OF SPORTS</p>
            </div>

            <div style="background: #dcfce7; border: 2px solid #16a34a; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
              <h2 style="color: #15803d; margin: 0;">🎉 Welcome to Your Training Journey!</h2>
            </div>

            <p>Hi ${athleteName},</p>

            <p>Congratulations! Your athlete profile has been successfully created. You're now part of <strong>${coachName}'s ${sport}</strong> training program on PLAYBOOKD.</p>

            <div style="background: #fff3cd; border: 2px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h3 style="color: #d97706; margin-top: 0;">🔐 Set Your Password</h3>
              <p style="margin: 5px 0; color: #92400e;">To access your athlete dashboard and start training, you need to create a password for your account.</p>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${passwordResetLink}" style="background-color: #A01C21; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Set Your Password</a>
            </div>

            <div style="background: #f0f9ff; border-left: 4px solid #0284c7; padding: 20px; margin: 20px 0;">
              <h3 style="color: #0369a1; margin-top: 0;">What's Next?</h3>
              <ol style="margin: 0; padding-left: 20px; color: #1e3a8a;">
                <li style="margin: 8px 0;">Click the button above to set your password</li>
                <li style="margin: 8px 0;">Sign in to your athlete dashboard</li>
                <li style="margin: 8px 0;">Access training content from ${coachName}</li>
                <li style="margin: 8px 0;">Track your progress and performance</li>
              </ol>
            </div>

            <div style="background: #fef2f2; border: 1px solid #fecaca; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; color: #991b1b; font-size: 14px;">
                <strong>⏰ Important:</strong> This password setup link will expire in 1 hour. If it expires, please contact ${coachName} for a new invitation.
              </p>
            </div>

            <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; color: #64748b; font-size: 14px;">
              <p><strong>PLAYBOOKD</strong> - For The Future of Sports</p>
              <p style="font-size: 12px;">If you didn't request this account, please ignore this email.</p>
            </div>
          </div>
        </body>
        </html>
      `
    })

    if (error) {
      console.error('Failed to send athlete welcome email:', error)
      return { success: false, error: error.message }
    }

    console.log(`✅ Athlete welcome email sent to ${to}`)
    return { success: true, data }
  } catch (error) {
    console.error('Athlete welcome email service error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
