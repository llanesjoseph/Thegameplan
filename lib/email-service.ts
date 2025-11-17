import { Resend } from 'resend'
import { getEmailTemplate } from './email-templates'
import { adminDb } from './firebase.admin'

const resend = new Resend(process.env.RESEND_API_KEY)
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://athleap.crucibleanalytics.dev'

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
  templateType?: 'athleap' | 'simple'
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
  templateType = 'athleap'
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
      from: 'AthLeap <noreply@mail.crucibleanalytics.dev>', // Use verified mail subdomain
      to: [to],
      subject: `🏆 You're Invited to Join ${organizationName} - AthLeap`,
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
  loginUrl = 'https://athleap.com/dashboard'
}: ApplicationStatusEmailProps) {
  try {
    const isApproved = status === 'approved'

    const { data, error } = await resend.emails.send({
      from: 'AthLeap <joseph@crucibleanalytics.dev>',
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
              <div class="logo">🏆 AthLeap</div>
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
              <p><strong>AthLeap</strong></p>
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
    const expiryDate = new Date(expiresAt).toLocaleDateString() // kept for compatibility; not displayed directly

    const { data, error } = await resend.emails.send({
      from: 'AthLeap <noreply@mail.crucibleanalytics.dev>',
      to: [to],
      subject: `AthLeap Athlete Invite`,
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>AthLeap Invitation</title>
            <style>
              .btn{
                background:#FC0105;
                color:#fff;
                font-weight:700;
                padding:12px 28px;
                border-radius:8px;
                text-decoration:none;
                display:inline-block
              }
              .container{
                max-width:600px;
                margin:0 auto;
                background:#ffffff;
                border-radius:12px;
                box-shadow:0 20px 40px rgba(0,0,0,0.08);
                overflow:hidden
              }
              .h1{
                font-family:Arial,Helvetica,sans-serif;
                font-size:28px;
                font-weight:800;
                color:#000;
                margin:0 0 12px 0
              }
              .p{
                font-family:Arial,Helvetica,sans-serif;
                font-size:15px;
                line-height:1.6;
                color:#374151;
                margin:0 0 16px 0
              }
            </style>
        </head>
        <body>
            <div class="container">
                <!-- Wide header image (Cloudinary) -->
                <header>
                  <img src="https://res.cloudinary.com/dr0jtjwlh/image/upload/v1763403661/Twitter_Header_Image_zzbred.png"
                       alt="AthLeap"
                       style="width:100%;height:auto;display:block;border:0;outline:none;text-decoration:none;">
                </header>
                <main style="padding:32px 24px;text-align:left;">
                    <p class="p">Hi ${athleteName || 'there'} –</p>

                    <p class="p">
                      <strong>${coachName || 'Your Coach'}</strong> has invited you to join ${coachName ? 'their' : 'our'} team on Athleap, a new platform blending the power of AI with the thrill of sports, creating unforgettable fan experiences and coaching next-generation athletes.
                    </p>

                    <div style="margin:20px 0 24px 0;text-align:center;">
                      <a href="${invitationUrl}" class="btn">Accept Invite</a>
                    </div>

                    <p class="p">
                      Join now and be a part of a company changing the future of sports. Once you are in, you can begin to train with ${coachName || 'your coach'}${sport ? ` in ${sport}` : ''} and follow other elite coaches.
                    </p>

                    <p class="p">We can’t wait to have you on board!</p>

                    <p class="p" style="margin-top:20px;">
                      See you inside,<br/>
                      <strong>The Athleap Team</strong>
                    </p>
                </main>
                <footer style="background-color:#f9fafb;text-align:center;padding:18px;border-top:1px solid #e5e7eb;">
                  <p style="margin:0;color:#6b7280;font-size:12px;">AthLeap</p>
                </footer>
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
          subject = `✅ ${invitationsSummary.totalSent} Athlete Invitation${invitationsSummary.totalSent > 1 ? 's' : ''} Sent Successfully - AthLeap`
          htmlContent = generateInvitationSentEmail(coachName, invitationsSummary)
        }
        break

      case 'invitation_accepted':
        if (athleteInfo) {
          subject = `🎉 ${athleteInfo.name} Accepted Your Invitation - AthLeap`
          htmlContent = generateInvitationAcceptedEmail(coachName, athleteInfo)
        }
        break

      case 'invitation_declined':
        if (athleteInfo) {
          subject = `📢 ${athleteInfo.name} Declined Your Invitation - AthLeap`
          htmlContent = generateInvitationDeclinedEmail(coachName, athleteInfo)
        }
        break

      case 'invitation_expired':
        if (athleteInfo) {
          subject = `⏰ Invitation to ${athleteInfo.name} Has Expired - AthLeap`
          htmlContent = generateInvitationExpiredEmail(coachName, athleteInfo)
        }
        break

      case 'athlete_profile_created':
        if (athleteInfo) {
          subject = `🎉 ${athleteInfo.name} Created Their Athlete Profile - AthLeap`
          htmlContent = generateAthleteProfileCreatedEmail(coachName, athleteInfo)
        }
        break

      default:
        throw new Error(`Unknown notification type: ${type}`)
    }

    const { data, error } = await resend.emails.send({
      from: 'AthLeap <noreply@mail.crucibleanalytics.dev>',
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
          <h1 style="font-family: 'Inter', sans-serif; color: #13367A; font-size: 32px; margin: 0; font-weight: 700;">AthLeap</h1>
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
            <li style="margin: 8px 0;">Start training together on AthLeap!</li>
          </ol>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${APP_URL}/dashboard/coach/athletes" style="background-color: #A01C21; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">View Your Athletes</a>
        </div>

        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; color: #64748b; font-size: 14px;">
          <p><strong>AthLeap</strong></p>
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
          <h1 style="font-family: 'Inter', sans-serif; color: #13367A; font-size: 32px; margin: 0; font-weight: 700;">AthLeap</h1>
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
          <p><strong>AthLeap</strong></p>
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
          <h1 style="font-family: 'Inter', sans-serif; color: #13367A; font-size: 32px; margin: 0; font-weight: 700;">AthLeap</h1>
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
          <p><strong>AthLeap</strong></p>
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
          <h1 style="font-family: 'Inter', sans-serif; color: #13367A; font-size: 32px; margin: 0; font-weight: 700;">AthLeap</h1>
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
          <p><strong>AthLeap</strong></p>
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
          <h1 style="font-family: 'Inter', sans-serif; color: #13367A; font-size: 32px; margin: 0; font-weight: 700;">AthLeap</h1>
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
          <p><strong>AthLeap</strong></p>
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

// Live session request notification email
interface LiveSessionRequestEmailProps {
  to: string
  coachName: string
  athleteName: string
  athleteEmail: string
  preferredDate: string
  preferredTime: string
  duration: number
  topic: string
  description: string
  specificGoals?: string
  sessionUrl: string
}

export async function sendLiveSessionRequestEmail({
  to,
  coachName,
  athleteName,
  athleteEmail,
  preferredDate,
  preferredTime,
  duration,
  topic,
  description,
  specificGoals,
  sessionUrl
}: LiveSessionRequestEmailProps) {
  try {
    // Format date for display
    const dateObj = new Date(preferredDate)
    const formattedDate = dateObj.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

    const { data, error } = await resend.emails.send({
      from: 'AthLeap <noreply@mail.crucibleanalytics.dev>',
      to: [to],
      subject: `📞 New Live 1-on-1 Session Request from ${athleteName} - AthLeap`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>New Live Session Request</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
          <div style="background: white; border-radius: 12px; padding: 40px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="font-family: 'Inter', sans-serif; color: #13367A; font-size: 32px; margin: 0; font-weight: 700;">AthLeap</h1>
            </div>

            <div style="background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%); border: 2px solid #16A34A; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
              <h2 style="color: #16A34A; margin: 0;">📞 New Live 1-on-1 Session Request</h2>
            </div>

            <p>Hi ${coachName},</p>

            <p><strong>${athleteName}</strong> has requested a live coaching session with you.</p>

            <div style="background: #f0f9ff; border-left: 4px solid #16A34A; padding: 20px; margin: 20px 0;">
              <h3 style="color: #0369a1; margin-top: 0;">📋 Session Details:</h3>
              <p style="margin: 5px 0;"><strong>Athlete:</strong> ${athleteName} (${athleteEmail})</p>
              <p style="margin: 5px 0;"><strong>Preferred Date:</strong> ${formattedDate}</p>
              <p style="margin: 5px 0;"><strong>Preferred Time:</strong> ${preferredTime}</p>
              <p style="margin: 5px 0;"><strong>Duration:</strong> ${duration} minutes</p>
              <p style="margin: 10px 0 5px 0;"><strong>Topic:</strong></p>
              <p style="margin: 5px 0; color: #4b5563; font-style: italic;">"${topic}"</p>
              <p style="margin: 10px 0 5px 0;"><strong>Description:</strong></p>
              <p style="margin: 5px 0; color: #4b5563; font-style: italic;">"${description}"</p>
              ${specificGoals ? `
                <p style="margin: 10px 0 5px 0;"><strong>Specific Goals:</strong></p>
                <p style="margin: 5px 0; color: #4b5563; font-style: italic;">"${specificGoals}"</p>
              ` : ''}
            </div>

            <div style="background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center;">
              <p style="margin: 0; color: #92400e; font-size: 14px;">
                <strong>⏰ Action Required:</strong> Please review and respond to this session request promptly!
              </p>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${sessionUrl}" style="background-color: #16A34A; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Review & Respond</a>
            </div>

            <div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h3 style="color: #1e40af; margin-top: 0;">💡 Next Steps:</h3>
              <ol style="margin: 0; padding-left: 20px; color: #4b5563;">
                <li style="margin: 8px 0;">Review the requested date and time</li>
                <li style="margin: 8px 0;">Confirm or suggest an alternative time</li>
                <li style="margin: 8px 0;">Prepare coaching materials for the session</li>
                <li style="margin: 8px 0;">Send the meeting link to ${athleteName}</li>
              </ol>
            </div>

        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; color: #64748b; font-size: 14px;">
          <p><strong>AthLeap</strong></p>
              <p style="font-size: 12px;">This is an automated notification. Reply directly to ${athleteEmail} or use the platform.</p>
            </div>
          </div>
        </body>
        </html>
      `
    })

    if (error) {
      console.error('Failed to send live session request email:', error)
      return { success: false, error: error.message }
    }

    console.log(`✅ Live session request email sent to coach ${to}`)
    return { success: true, data }
  } catch (error) {
    console.error('Live session request email service error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
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
      from: 'AthLeap <noreply@mail.crucibleanalytics.dev>',
      to: [to],
      subject: `🏆 Welcome to AthLeap - Set Your Password`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to AthLeap</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
          <div style="background: white; border-radius: 12px; padding: 40px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="font-family: 'Inter', sans-serif; color: #13367A; font-size: 32px; margin: 0; font-weight: 700;">AthLeap</h1>
            </div>

            <div style="background: #dcfce7; border: 2px solid #16a34a; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
              <h2 style="color: #15803d; margin: 0;">🎉 Welcome to Your Training Journey!</h2>
            </div>

            <p>Hi ${athleteName},</p>

            <p>Congratulations! Your athlete profile has been successfully created. You're now part of <strong>${coachName}'s ${sport}</strong> training program on AthLeap.</p>

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
          <p><strong>AthLeap</strong></p>
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

// Video submission notification interfaces
interface VideoSubmissionNotificationProps {
  to: string
  coachName: string
  athleteName: string
  skillName: string
  submissionId: string
  reviewUrl: string
  context?: string
}

interface ReviewPublishedNotificationProps {
  to: string
  athleteName: string
  coachName: string
  skillName: string
  submissionId: string
  reviewUrl: string
}

// Send notification to coach when athlete submits video
export async function sendVideoSubmissionNotification({
  to,
  coachName,
  athleteName,
  skillName,
  submissionId,
  reviewUrl,
  context
}: VideoSubmissionNotificationProps) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'AthLeap <noreply@mail.crucibleanalytics.dev>',
      to: [to],
      subject: `🎥 New Video Submission from ${athleteName} - ${skillName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>New Video Submission - AthLeap</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
          <div style="background: white; border-radius: 12px; padding: 40px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="font-family: 'Inter', sans-serif; color: #13367A; font-size: 32px; margin: 0; font-weight: 700;">AthLeap</h1>
            </div>

            <div style="background: #dbeafe; border: 2px solid #3b82f6; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
              <h2 style="color: #1e40af; margin: 0;">🎥 New Video Submission!</h2>
            </div>

            <p>Hi ${coachName},</p>

            <p><strong>${athleteName}</strong> has submitted a new video for <strong>${skillName}</strong> and is waiting for your review.</p>

            <div style="background: #f0f9ff; border-left: 4px solid #0284c7; padding: 20px; margin: 20px 0;">
              <h3 style="color: #0369a1; margin-top: 0;">📋 Submission Details</h3>
              <p style="margin: 5px 0; color: #1e3a8a;"><strong>Skill:</strong> ${skillName}</p>
              <p style="margin: 5px 0; color: #1e3a8a;"><strong>Submission ID:</strong> ${submissionId}</p>
              ${context ? `<p style="margin: 5px 0; color: #1e3a8a;"><strong>Context:</strong> ${context}</p>` : ''}
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${reviewUrl}" style="background-color: #A01C21; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Review Video Now</a>
            </div>

            <div style="background: #fef3c7; border: 2px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h3 style="color: #d97706; margin-top: 0;">⏰ Quick Review</h3>
              <p style="margin: 5px 0; color: #92400e;">The athlete is eagerly waiting for your feedback. A quick review helps maintain their momentum and motivation.</p>
            </div>

            <p style="margin-top: 30px;">Keep up the great coaching!</p>
            <p><strong>The AthLeap Team</strong></p>
          </div>
        </body>
        </html>
      `
    })

    if (error) {
      console.error('Failed to send video submission notification:', error)
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

// Send notification to athlete when coach publishes review
export async function sendReviewPublishedNotification({
  to,
  athleteName,
  coachName,
  skillName,
  submissionId,
  reviewUrl
}: ReviewPublishedNotificationProps) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'AthLeap <noreply@mail.crucibleanalytics.dev>',
      to: [to],
      subject: `✅ Your ${skillName} Review is Ready!`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Review Ready - AthLeap</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
          <div style="background: white; border-radius: 12px; padding: 40px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="font-family: 'Inter', sans-serif; color: #13367A; font-size: 32px; margin: 0; font-weight: 700;">AthLeap</h1>
            </div>

            <div style="background: #dcfce7; border: 2px solid #16a34a; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
              <h2 style="color: #15803d; margin: 0;">✅ Your Review is Ready!</h2>
            </div>

            <p>Hi ${athleteName},</p>

            <p><strong>${coachName}</strong> has completed your review for <strong>${skillName}</strong> and provided detailed feedback to help you improve.</p>

            <div style="background: #f0f9ff; border-left: 4px solid #0284c7; padding: 20px; margin: 20px 0;">
              <h3 style="color: #0369a1; margin-top: 0;">📋 Review Details</h3>
              <p style="margin: 5px 0; color: #1e3a8a;"><strong>Skill:</strong> ${skillName}</p>
              <p style="margin: 5px 0; color: #1e3a8a;"><strong>Submission ID:</strong> ${submissionId}</p>
              <p style="margin: 5px 0; color: #1e3a8a;"><strong>Reviewed by:</strong> ${coachName}</p>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${reviewUrl}" style="background-color: #A01C21; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">View Your Review</a>
            </div>

            <div style="background: #fef3c7; border: 2px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h3 style="color: #d97706; margin-top: 0;">💡 Pro Tip</h3>
              <p style="margin: 5px 0; color: #92400e;">Take time to read through the feedback carefully and practice the suggested improvements. This is how you level up your game!</p>
            </div>

            <p style="margin-top: 30px;">Keep pushing yourself to be better!</p>
            <p><strong>The AthLeap Team</strong></p>
          </div>
        </body>
        </html>
      `
    })

    if (error) {
      console.error('Failed to send review published notification:', error)
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

/**
 * Fetch all admin emails from Firestore
 * Returns emails of users with 'admin' or 'superadmin' role
 */
export async function getAdminEmails(): Promise<string[]> {
  try {
    const adminsSnapshot = await adminDb
      .collection('users')
      .where('role', 'in', ['admin', 'superadmin'])
      .get()

    const adminEmails = adminsSnapshot.docs
      .map(doc => doc.data().email)
      .filter(email => email && typeof email === 'string') as string[]

    console.log(`📧 Found ${adminEmails.length} admin email(s) for notifications`)
    return adminEmails
  } catch (error) {
    console.error('Error fetching admin emails:', error)
    return []
  }
}

// Admin notification for invitation activity
interface AdminNotificationEmailProps {
  adminEmails: string[]
  invitationType: 'coach' | 'athlete' | 'admin'
  recipientEmail: string
  recipientName: string
  senderName: string
  senderEmail: string
  sport?: string
  customMessage?: string
}

export async function sendAdminNotificationEmail({
  adminEmails,
  invitationType,
  recipientEmail,
  recipientName,
  senderName,
  senderEmail,
  sport,
  customMessage
}: AdminNotificationEmailProps) {
  try {
    const invitationTypeLabel = invitationType === 'coach' ? 'Coach' : invitationType === 'athlete' ? 'Athlete' : 'Admin'
    const subject = `🔔 New ${invitationTypeLabel} Invitation Sent - AthLeap`

    const { data, error } = await resend.emails.send({
      from: 'AthLeap Admin <noreply@mail.crucibleanalytics.dev>',
      to: adminEmails,
      subject,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Invitation Activity Alert</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
          <div style="background: white; border-radius: 12px; padding: 40px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="font-family: 'Inter', sans-serif; color: #13367A; font-size: 32px; margin: 0; font-weight: 700;">AthLeap</h1>
              <p style="color: #64748b; font-size: 14px; margin: 5px 0; letter-spacing: 2px;">ADMIN NOTIFICATION</p>
            </div>

            <div style="background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); border: 2px solid #2563eb; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
              <h2 style="color: #1e40af; margin: 0;">🔔 New ${invitationTypeLabel} Invitation Sent</h2>
            </div>

            <div style="background: #f0f9ff; border-left: 4px solid #0284c7; padding: 20px; margin: 20px 0;">
              <h3 style="color: #0369a1; margin-top: 0;">Invitation Details:</h3>
              <p style="margin: 8px 0;"><strong>Type:</strong> ${invitationTypeLabel} Invitation</p>
              <p style="margin: 8px 0;"><strong>Sent By:</strong> ${senderName} (${senderEmail})</p>
              <p style="margin: 8px 0;"><strong>Sent To:</strong> ${recipientName} (${recipientEmail})</p>
              ${sport ? `<p style="margin: 8px 0;"><strong>Sport:</strong> ${sport}</p>` : ''}
              ${customMessage ? `
                <div style="margin-top: 15px;">
                  <p style="margin: 5px 0;"><strong>Custom Message:</strong></p>
                  <p style="margin: 5px 0; color: #4b5563; font-style: italic; padding: 10px; background: white; border-radius: 4px;">"${customMessage}"</p>
                </div>
              ` : ''}
            </div>

            <div style="background: #fff3cd; border: 1px solid #f59e0b; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; color: #92400e; font-size: 14px; text-align: center;">
                <strong>ℹ️ Note:</strong> This is an automated notification to keep you informed of platform invitation activity.
              </p>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${APP_URL}/dashboard/admin/invitations-approvals" style="background-color: #8B5CF6; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">View Invitations Dashboard</a>
            </div>

            <div style="background: #f9fafb; border-radius: 8px; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; color: #6b7280; font-size: 13px; text-align: center;">
                Timestamp: ${new Date().toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' })}
              </p>
            </div>

            <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; color: #64748b; font-size: 14px;">
              <p><strong>AthLeap Admin System</strong></p>
              <p style="font-size: 12px;">This is an automated administrative notification. Do not reply to this email.</p>
            </div>
          </div>
        </body>
        </html>
      `
    })

    if (error) {
      console.error('Failed to send admin notification email:', error)
      return { success: false, error: error.message }
    }

    console.log(`✅ Admin notification sent to ${adminEmails.length} admin(s)`)
    return { success: true, data }
  } catch (error) {
    console.error('Admin notification email service error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Schedule event notification email
interface ScheduleEventNotificationEmailProps {
  to: string
  athleteName: string
  coachName: string
  eventType: string
  eventDate: string
  eventTime: string
  location?: string
  notes?: string
  dashboardUrl?: string
}

// Session confirmation email
interface SessionConfirmationEmailProps {
  to: string
  athleteName: string
  coachName: string
  topic: string
  requestedDate: string
  requestedTime: string
  confirmedDate: string
  confirmedTime: string
  duration: number
  notes?: string
  dashboardUrl?: string
}

export async function sendSessionConfirmationEmail({
  to,
  athleteName,
  coachName,
  topic,
  requestedDate,
  requestedTime,
  confirmedDate,
  confirmedTime,
  duration,
  notes,
  dashboardUrl = `${APP_URL}/dashboard/athlete`
}: SessionConfirmationEmailProps) {
  try {
    // Format dates for display
    const confirmedDateObj = new Date(confirmedDate)
    const formattedConfirmedDate = confirmedDateObj.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })

    // Check if coach changed the time from athlete's preference
    const timeChanged = requestedDate !== confirmedDate || requestedTime !== confirmedTime
    const requestedDateObj = new Date(requestedDate)
    const formattedRequestedDate = requestedDateObj.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })

    const { data, error } = await resend.emails.send({
      from: 'AthLeap <noreply@mail.crucibleanalytics.dev>',
      to: [to],
      subject: timeChanged
        ? `Session Confirmed (Time Adjusted) - ${coachName}`
        : `Session Confirmed - ${coachName}`,
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Session Confirmed - ATHLEAP</title>
            <link rel="preconnect" href="https://fonts.googleapis.com">
            <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
            <link href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600;700&display=swap" rel="stylesheet">
        </head>
        <body style="font-family: 'Open Sans', sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px;">
            <div style="max-width: 560px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">

                <!-- Header -->
                <header style="background-color: #000000; padding: 28px 24px; text-align: center;">
                    <h1 style="font-family: 'Open Sans', sans-serif; font-size: 2rem; color: #FFFFFF; margin: 0; font-weight: 700; letter-spacing: 2px;">ATHLEAP</h1>
                </header>

                <!-- Main Content -->
                <main style="padding: 32px 24px;">
                    <p style="color: #000000; line-height: 1.5; font-size: 15px; margin: 0 0 20px 0; font-weight: 600;">
                        Hi ${athleteName},
                    </p>

                    <p style="color: #333333; line-height: 1.6; font-size: 15px; margin: 0 0 24px 0;">
                        <strong>${coachName}</strong> has confirmed your 1-on-1 session for <strong>${topic}</strong>.
                    </p>

                    ${timeChanged ? `
                    <!-- Time Adjusted Notice -->
                    <div style="background: #FEF3C7; border-left: 4px solid #FC0105; padding: 14px 16px; margin: 0 0 24px 0; border-radius: 0 6px 6px 0;">
                        <p style="margin: 0; color: #92400E; font-size: 14px; font-weight: 600;">
                            ⏰ Your coach adjusted the time: ${formattedRequestedDate} at ${requestedTime} → ${formattedConfirmedDate} at ${confirmedTime}
                        </p>
                    </div>
                    ` : ''}

                    <!-- Session Details Card -->
                    <div style="background: #F9FAFB; border: 2px solid #E5E7EB; padding: 20px; margin: 0 0 28px 0; border-radius: 8px;">
                        <p style="margin: 0 0 12px 0; color: #6B7280; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Session Details</p>
                        <p style="margin: 6px 0; color: #000000; font-size: 15px;"><strong>Date:</strong> ${formattedConfirmedDate}</p>
                        <p style="margin: 6px 0; color: #000000; font-size: 15px;"><strong>Time:</strong> ${confirmedTime}</p>
                        <p style="margin: 6px 0; color: #000000; font-size: 15px;"><strong>Duration:</strong> ${duration} minutes</p>
                        <p style="margin: 6px 0; color: #000000; font-size: 15px;"><strong>Coach:</strong> ${coachName}</p>
                        ${notes ? `
                        <div style="margin-top: 14px; padding-top: 14px; border-top: 1px solid #E5E7EB;">
                            <p style="margin: 0 0 6px 0; color: #000000; font-weight: 600; font-size: 13px;">Notes from Coach:</p>
                            <p style="margin: 0; color: #4B5563; font-size: 14px; font-style: italic; white-space: pre-wrap;">${notes}</p>
                        </div>
                        ` : ''}
                    </div>

                    <!-- Single CTA Button -->
                    <div style="text-align: center; margin: 0 0 28px 0;">
                        <a href="${dashboardUrl}" style="display: inline-block; background-color: #FC0105; color: white; font-weight: 700; padding: 16px 48px; border-radius: 8px; text-decoration: none; font-size: 15px; letter-spacing: 0.5px;">
                            View Session
                        </a>
                    </div>

                    <p style="color: #6B7280; font-size: 13px; text-align: center; margin: 0; line-height: 1.5;">
                        Mark your calendar and join 5 minutes early to test your connection.
                    </p>
                </main>

                <!-- Footer -->
                <footer style="background-color: #F9FAFB; text-align: center; padding: 20px; border-top: 1px solid #E5E7EB;">
                    <p style="margin: 0; font-weight: 700; color: #000000; font-size: 14px; letter-spacing: 1px;">
                        ATHLEAP
                    </p>
                    <p style="color: #9CA3AF; font-size: 12px; margin: 4px 0 0 0;">
                        Questions? Reply to this email or contact ${coachName}.
                    </p>
                </footer>

            </div>
        </body>
        </html>
      `
    })

    if (error) {
      console.error('Failed to send session confirmation email:', error)
      return { success: false, error: error.message }
    }

    console.log(`✅ Session confirmation email sent to ${to} ${timeChanged ? '(time adjusted)' : ''}`)
    return { success: true, data }
  } catch (error) {
    console.error('Session confirmation email service error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

export async function sendScheduleEventNotificationEmail({
  to,
  athleteName,
  coachName,
  eventType,
  eventDate,
  eventTime,
  location,
  notes,
  dashboardUrl = `${APP_URL}/dashboard/athlete`
}: ScheduleEventNotificationEmailProps) {
  try {
    // Format the date for display
    const dateObj = new Date(`${eventDate}T${eventTime}`)
    const formattedDate = dateObj.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
    const formattedTime = dateObj.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })

    const { data, error } = await resend.emails.send({
      from: 'AthLeap <noreply@mail.crucibleanalytics.dev>',
      to: [to],
      subject: `📅 New Event Scheduled: ${eventType} - ${coachName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>New Event Scheduled</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
          <div style="background: white; border-radius: 12px; padding: 40px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="font-family: 'Inter', sans-serif; color: #13367A; font-size: 32px; margin: 0; font-weight: 700;">AthLeap</h1>
            </div>

            <div style="background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%); border: 2px solid #16A34A; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
              <h2 style="color: #16A34A; margin: 0;">📅 New Event Scheduled</h2>
            </div>

            <p>Hi ${athleteName},</p>

            <p><strong>${coachName}</strong> has scheduled a new event for you!</p>

            <div style="background: #f0f9ff; border-left: 4px solid #16A34A; padding: 20px; margin: 20px 0;">
              <h3 style="color: #0369a1; margin-top: 0;">📋 Event Details:</h3>
              <p style="margin: 8px 0;"><strong>Event Type:</strong> ${eventType}</p>
              <p style="margin: 8px 0;"><strong>Date:</strong> ${formattedDate}</p>
              <p style="margin: 8px 0;"><strong>Time:</strong> ${formattedTime}</p>
              ${location ? `<p style="margin: 8px 0;"><strong>Location:</strong> ${location}</p>` : ''}
              ${notes ? `
                <div style="margin-top: 15px;">
                  <p style="margin: 5px 0;"><strong>Notes from Coach:</strong></p>
                  <p style="margin: 5px 0; color: #4b5563; font-style: italic; padding: 10px; background: white; border-radius: 4px; white-space: pre-wrap;">"${notes}"</p>
                </div>
              ` : ''}
            </div>

            <div style="background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center;">
              <p style="margin: 0; color: #92400e; font-size: 14px;">
                <strong>📌 Mark Your Calendar:</strong> Don't forget to add this event to your schedule!
              </p>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${dashboardUrl}" style="background-color: #16A34A; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">View Full Schedule</a>
            </div>

            <div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h3 style="color: #1e40af; margin-top: 0;">💡 Get Ready:</h3>
              <ul style="margin: 0; padding-left: 20px; color: #4b5563;">
                <li style="margin: 8px 0;">Check your gear and equipment</li>
                <li style="margin: 8px 0;">Review any preparation notes from your coach</li>
                <li style="margin: 8px 0;">Plan your arrival time to be early</li>
                <li style="margin: 8px 0;">Bring a positive attitude and be ready to work!</li>
              </ul>
            </div>

        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; color: #64748b; font-size: 14px;">
          <p><strong>AthLeap</strong></p>
              <p style="font-size: 12px;">Questions about this event? Contact ${coachName} directly through the platform.</p>
            </div>
          </div>
        </body>
        </html>
      `
    })

    if (error) {
      console.error('Failed to send schedule event notification email:', error)
      return { success: false, error: error.message }
    }

    console.log(`✅ Schedule event notification sent to ${to}`)
    return { success: true, data }
  } catch (error) {
    console.error('Schedule event notification email service error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
