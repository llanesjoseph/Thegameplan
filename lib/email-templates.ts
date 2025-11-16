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

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>You're Invited to ATHLEAP</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600;700&display=swap" rel="stylesheet">
    <style>
        body {
            font-family: "Open Sans", sans-serif;
            background-color: #f5f5f5;
            margin: 0;
            padding: 0;
        }

        /* Brand Colors */
        .brand-black { color: #000000; }
        .bg-brand-black { background-color: #000000; }
        .brand-red { color: #FC0105; }
        .bg-brand-red { background-color: #FC0105; }
        .border-brand-red { border-color: #FC0105; }

        .cta-button {
            background-color: #000000;
            color: white;
            font-weight: 700;
            padding: 16px 40px;
            border-radius: 8px;
            text-decoration: none;
            text-transform: uppercase;
            letter-spacing: 1px;
            font-size: 16px;
            display: inline-block;
            transition: all 0.3s ease;
        }

        .cta-button:hover {
            background-color: #333333;
            transform: translateY(-2px);
        }

        .invitation-card {
            background: #ffffff;
            border-left: 4px solid #FC0105;
            padding: 24px;
            margin: 24px 0;
            border-radius: 0 8px 8px 0;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .qr-section {
            background: #f9f9f9;
            border: 2px dashed #000000;
            border-radius: 12px;
            padding: 24px;
            margin: 24px 0;
            text-align: center;
        }

        .expiry-notice {
            background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
            border: 2px solid #FC0105;
            color: #92400e;
            padding: 16px;
            border-radius: 8px;
            margin: 24px 0;
            text-align: center;
            font-weight: 600;
        }

        .info-section {
            margin: 32px 0;
            padding: 24px;
            background: #f9f9f9;
            border-radius: 8px;
            border: 2px solid #000000;
        }

        @media (max-width: 640px) {
            .cta-button {
                padding: 12px 24px;
                font-size: 14px;
            }
            h1 {
                font-size: 2rem !important;
            }
            h2 {
                font-size: 1.5rem !important;
            }
        }
    </style>
</head>
<body style="font-family: 'Open Sans', sans-serif; background-color: #f5f5f5; margin: 0; padding: 16px;">

    <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); overflow: hidden;">

        <!-- Header with Logo -->
        <header style="background-color: #FFFFFF; padding: 32px 24px; text-align: center; border-bottom: 3px solid #000000;">
            <h1 style="font-family: 'Open Sans', sans-serif; font-size: 2.5rem; color: #440102; margin: 0; font-weight: 700; letter-spacing: 2px;">ATHLEAP</h1>
            <p style="color: #666666; font-size: 12px; margin: 8px 0 0 0; letter-spacing: 2px; font-weight: 600;">THE WORK BEFORE THE WIN</p>
        </header>

        <main>
            <!-- Hero Image -->
            <div>
                <img src="https://res.cloudinary.com/dr0jtjwlh/image/upload/v1758865671/2023_11_2_ze5r3n.jpg"
                     alt="Coach Training"
                     style="width: 100%; height: auto; display: block;">
            </div>

            <div style="padding: 40px 24px;">
                <!-- Personalized Headline -->
                <h2 style="font-family: 'Open Sans', sans-serif; font-size: 2rem; color: #000000; line-height: 1.2; margin: 0 0 8px 0; text-align: center; font-weight: 700;">
                    ${recipientName ? `WELCOME ${recipientName.toUpperCase()}` : 'YOU\'RE INVITED'}
                </h2>
                <h3 style="font-family: 'Open Sans', sans-serif; font-size: 1.25rem; color: #FC0105; margin: 0 0 24px 0; text-align: center; font-weight: 700;">
                    JOIN ${organizationName.toUpperCase()} AS A ${sport.toUpperCase()} COACH
                </h3>

                <!-- Invitation Message -->
                <div style="background: #ffffff; border-left: 4px solid #FC0105; padding: 24px; margin: 24px 0; border-radius: 0 8px 8px 0; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <p style="margin: 0; color: #000000; font-size: 16px; line-height: 1.6; font-family: 'Open Sans', sans-serif;">
                        <strong>${inviterName}</strong> from <strong>${organizationName}</strong> has invited you to join our elite coaching community!
                    </p>
                    ${customMessage ? `
                    <p style="margin: 16px 0 0 0; color: #666666; font-style: italic; font-size: 15px; font-family: 'Open Sans', sans-serif;">
                        "${customMessage}"
                    </p>
                    ` : ''}
                </div>

                <!-- Body Text -->
                <p style="color: #333333; margin: 24px auto; max-width: 500px; line-height: 1.6; font-size: 16px; text-align: center; font-family: 'Open Sans', sans-serif;">
                    Join the future of sports coaching. Share your expertise, build your reputation, and help athletes reach their full potential on the ATHLEAP platform.
                </p>

                <!-- Call to Action Button -->
                <div style="margin: 32px 0; text-align: center;">
                    <a href="${invitationUrl}" style="background-color: #000000; color: white; font-weight: 700; padding: 16px 40px; border-radius: 8px; text-decoration: none; text-transform: uppercase; letter-spacing: 1px; font-size: 16px; display: inline-block; font-family: 'Open Sans', sans-serif;">
                        Start Your Journey
                    </a>
                </div>

                ${qrCodeUrl ? `
                <!-- QR Code Section -->
                <div style="background: #f9f9f9; border: 2px dashed #000000; border-radius: 12px; padding: 24px; margin: 24px 0; text-align: center;">
                    <h4 style="color: #000000; margin: 0 0 12px 0; font-size: 18px; font-weight: 700; font-family: 'Open Sans', sans-serif;">
                        Or scan this QR code:
                    </h4>
                    <img src="${qrCodeUrl}" alt="Coach Invitation QR Code" style="max-width: 180px; height: auto; margin: 0 auto; display: block;">
                    <p style="font-size: 12px; color: #666666; margin: 12px 0 0 0; font-family: 'Open Sans', sans-serif;">
                        Scan with your phone camera to open the invitation
                    </p>
                </div>
                ` : ''}

                <!-- Expiry Notice -->
                <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border: 2px solid #FC0105; color: #92400e; padding: 16px; border-radius: 8px; margin: 24px 0; text-align: center; font-weight: 600; font-family: 'Open Sans', sans-serif;">
                    ⏰ <strong>Important:</strong> This invitation expires on ${expiryDate}
                </div>

                <!-- What's Next Section -->
                <div style="margin: 32px 0; padding: 24px; background: #f9f9f9; border-radius: 8px; border: 2px solid #000000;">
                    <h3 style="color: #000000; margin: 0 0 16px 0; font-size: 20px; font-weight: 700; text-align: center; font-family: 'Open Sans', sans-serif;">What happens next?</h3>
                    <ol style="color: #333333; margin: 0; text-align: left; max-width: 400px; margin: 0 auto; line-height: 1.8; font-family: 'Open Sans', sans-serif;">
                        <li style="margin: 8px 0;">Click the button above to access your personalized application</li>
                        <li style="margin: 8px 0;">Complete your coaching profile (takes about 10 minutes)</li>
                        <li style="margin: 8px 0;">Submit your application for review</li>
                        <li style="margin: 8px 0;">Get approved and start coaching on ATHLEAP!</li>
                    </ol>
                </div>
            </div>
        </main>

        <!-- Footer -->
        <footer style="background-color: #f9f9f9; text-align: center; padding: 24px; border-top: 2px solid #000000;">
            <p style="color: #666666; font-size: 14px; margin: 0 0 8px 0; font-family: 'Open Sans', sans-serif;">
                This invitation was sent by ${inviterName} (${organizationName})
            </p>
            <p style="margin: 0; font-weight: 700; color: #440102; font-size: 16px; letter-spacing: 1px; font-family: 'Open Sans', sans-serif;">
                ATHLEAP - The Work Before the Win
            </p>
            <p style="color: #999999; font-size: 12px; margin: 16px 0 0 0; font-family: 'Open Sans', sans-serif;">
                <a href="#" style="color: #666666; text-decoration: underline;">Unsubscribe</a> |
                <a href="#" style="color: #666666; text-decoration: underline;">Privacy Policy</a>
            </p>
        </footer>

    </div>

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
