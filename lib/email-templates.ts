/**
 * ATHLEAP Email Templates
 *
 * Professional email templates with new brand styling (2025 Rebrand)
 * Brand Colors: Black (#000000), Red (#FC0105), White (#FFFFFF)
 * Brand Font: Open Sans
 */

interface EmailTemplateProps {
  organizationName: string
  inviterName: string
  sport: string
  invitationUrl: string
  qrCodeUrl: string | null
  customMessage?: string
  expiresAt: string
  recipientName?: string
}

export function getAthLeapCoachInvitationTemplate({
  organizationName,
  inviterName,
  sport,
  invitationUrl,
  qrCodeUrl,
  customMessage,
  expiresAt,
  recipientName
}: EmailTemplateProps): string {
  const expiryDate = new Date(expiresAt).toLocaleDateString()
  const firstName = recipientName?.split(' ')[0] || 'there'

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
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
</html>
  `
}

export function getSimpleCoachInvitationTemplate(props: EmailTemplateProps): string {
  // Fallback to the main template
  return getAthLeapCoachInvitationTemplate(props)
}

// Template selector function
export function getEmailTemplate(templateType: 'athleap' | 'simple' = 'athleap', props: EmailTemplateProps): string {
  switch (templateType) {
    case 'athleap':
      return getAthLeapCoachInvitationTemplate(props)
    case 'simple':
      return getSimpleCoachInvitationTemplate(props)
    default:
      return getAthLeapCoachInvitationTemplate(props)
  }
}
