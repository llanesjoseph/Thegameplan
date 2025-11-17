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

        <!-- Wide header image with logo -->
        <header>
            <img src="https://res.cloudinary.com/dr0jtjwlh/image/upload/v1763403661/Twitter_Header_Image_zzbred.png"
                 alt="AthLeap"
                 style="width: 100%; height: auto; display: block; border: 0; outline: none; text-decoration: none;">
        </header>

        <main>
            <div style="padding: 32px 24px;">
                <p style="margin: 0 0 16px 0; color: #000000; font-size: 16px; line-height: 1.6; font-family: 'Open Sans', sans-serif;">
                    Hi ${recipientName || 'there'} –
                </p>
                <p style="margin: 0 0 16px 0; color: #000000; font-size: 16px; line-height: 1.6; font-family: 'Open Sans', sans-serif;">
                    We are the founding team at Athleap, a new platform blending the power of AI with the thrill of sports, creating unforgettable fan experiences and coaching next-generation athletes. Our mission is simple: to help unlock athletic potential.
                </p>
                <p style="margin: 0 0 24px 0; color: #000000; font-size: 16px; line-height: 1.6; font-family: 'Open Sans', sans-serif;">
                    We are inviting a select group of elite athletes to join our early access community as coaches, shaping the tools that redefine how athletes train and compete.
                </p>
                <div style="margin: 28px 0; text-align: center;">
                    <a href="${invitationUrl}" style="background-color: #FC0105; color: #FFFFFF; font-weight: 700; padding: 14px 32px; border-radius: 8px; text-decoration: none; text-transform: uppercase; letter-spacing: 1px; font-size: 14px; display: inline-block; font-family: 'Open Sans', sans-serif;">
                        Join Our Community
                    </a>
                </div>
                <p style="margin: 0 0 16px 0; color: #000000; font-size: 16px; line-height: 1.6; font-family: 'Open Sans', sans-serif;">
                    You’ve earned your place at the top – this is your chance to help define what comes next.
                </p>
                <p style="margin: 0; color: #000000; font-size: 16px; line-height: 1.6; font-family: 'Open Sans', sans-serif;">
                    See you inside,<br/>
                    The Athleap Team
                </p>
            </div>
        </main>

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
