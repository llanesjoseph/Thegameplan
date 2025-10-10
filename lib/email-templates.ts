/**
 * AthLeap Email Templates
 *
 * Professional email templates with brand styling and dynamic content
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
    <title>You're Invited to AthLeap</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap" rel="stylesheet">
    <style>
        @font-face {
            font-family: 'Sports World';
            src: url(data:font/truetype;charset=utf-8;base64,YOUR_BASE64_FONT_STRING_HERE) format('truetype');
            font-weight: normal;
            font-style: normal;
        }

        .font-sports-world {
            font-family: 'Sports World', sans-serif;
        }

        body {
            font-family: 'Inter', sans-serif;
            background-color: #E8E6D8;
        }

        .brand-deep-sea { color: #13367A; }
        .bg-brand-deep-sea { background-color: #13367A; }
        .brand-red { color: #A01C21; }
        .bg-brand-red { background-color: #A01C21; }
        .brand-cream { color: #E8E6D8; }
        .bg-brand-cream { background-color: #E8E6D8; }
        .border-brand-red { border-color: #A01C21; }

        .cta-button {
            background-color: #A01C21;
            color: white;
            font-weight: bold;
            padding: 16px 40px;
            border-radius: 8px;
            text-decoration: none;
            text-transform: uppercase;
            letter-spacing: 2px;
            font-size: 18px;
            display: inline-block;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(160, 28, 33, 0.3);
        }

        .cta-button:hover {
            background-color: #8a1116;
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(160, 28, 33, 0.4);
        }

        .invitation-card {
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
            border-left: 4px solid #A01C21;
            padding: 20px;
            margin: 20px 0;
            border-radius: 0 8px 8px 0;
        }

        .qr-section {
            background: #f1f5f9;
            border: 2px dashed #13367A;
            border-radius: 12px;
            padding: 20px;
            margin: 20px 0;
            text-align: center;
        }

        .expiry-notice {
            background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
            border: 1px solid #f59e0b;
            color: #92400e;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
            text-align: center;
            font-weight: 600;
        }

        @media (max-width: 640px) {
            .font-sports-world {
                font-size: 2.5rem !important;
            }

            .cta-button {
                padding: 12px 24px;
                font-size: 16px;
            }
        }
    </style>
</head>
<body class="bg-brand-cream" style="background-color: #E8E6D8; margin: 0; padding: 16px;">

    <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; box-shadow: 0 20px 40px rgba(0,0,0,0.1); overflow: hidden;">

        <!-- Header with Logo -->
        <header style="background-color: #13367A; padding: 24px; text-align: center;">
            <h1 style="font-family: 'Permanent Marker', cursive; font-size: 3rem; color: white; margin: 0;">AthLeap</h1>
            <p style="color: #87ceeb; font-size: 14px; margin: 4px 0 0 0; letter-spacing: 3px;">THE WORK BEFORE THE WIN</p>
        </header>

        <main>
            <!-- Hero Image -->
            <div>
                <img src="https://res.cloudinary.com/dr0jtjwlh/image/upload/v1758865671/2023_11_2_ze5r3n.jpg"
                     alt="Coach Training"
                     style="width: 100%; height: auto; display: block;">
            </div>

            <div style="padding: 40px 24px; text-align: center;">
                <!-- Personalized Headline -->
                <h2 style="font-family: 'Sports World', sans-serif; font-size: 2.5rem; color: #13367A; line-height: 1.2; margin: 0 0 8px 0;">
                    ${recipientName ? `WELCOME ${recipientName.toUpperCase()}` : 'YOU\'RE INVITED'}
                </h2>
                <h3 style="font-family: 'Sports World', sans-serif; font-size: 1.5rem; color: #A01C21; margin: 0 0 24px 0;">
                    JOIN ${organizationName.toUpperCase()} AS A ${sport.toUpperCase()} COACH
                </h3>

                <!-- Invitation Message -->
                <div class="invitation-card" style="background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); border-left: 4px solid #A01C21; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
                    <p style="margin: 0; color: #374151; font-size: 16px; line-height: 1.6;">
                        <strong>${inviterName}</strong> from <strong>${organizationName}</strong> has invited you to join our elite coaching community!
                    </p>
                    ${customMessage ? `
                    <p style="margin: 16px 0 0 0; color: #6366f1; font-style: italic; font-size: 15px;">
                        "${customMessage}"
                    </p>
                    ` : ''}
                </div>

                <!-- Body Text -->
                <p style="color: #4b5563; margin: 24px auto; max-width: 500px; line-height: 1.6; font-size: 16px;">
                    Join the future of sports coaching. Share your expertise, build your reputation, and help athletes reach their full potential on the AthLeap platform.
                </p>

                <!-- Call to Action Button -->
                <div style="margin: 32px 0;">
                    <a href="${invitationUrl}" class="cta-button" style="background-color: #A01C21; color: white; font-weight: bold; padding: 16px 40px; border-radius: 8px; text-decoration: none; text-transform: uppercase; letter-spacing: 2px; font-size: 18px; display: inline-block;">
                        Start Your Journey
                    </a>
                </div>

                ${qrCodeUrl ? `
                <!-- QR Code Section -->
                <div class="qr-section" style="background: #f1f5f9; border: 2px dashed #13367A; border-radius: 12px; padding: 20px; margin: 20px 0; text-align: center;">
                    <h4 style="color: #13367A; margin: 0 0 12px 0; font-size: 18px; font-weight: 600;">
                        Or scan this QR code:
                    </h4>
                    <img src="${qrCodeUrl}" alt="Coach Invitation QR Code" style="max-width: 180px; height: auto; margin: 0 auto; display: block;">
                    <p style="font-size: 12px; color: #6b7280; margin: 12px 0 0 0;">
                        Scan with your phone camera to open the invitation
                    </p>
                </div>
                ` : ''}

                <!-- Expiry Notice -->
                <div class="expiry-notice" style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border: 1px solid #f59e0b; color: #92400e; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center; font-weight: 600;">
                    ⏰ <strong>Important:</strong> This invitation expires on ${expiryDate}
                </div>

                <!-- What's Next Section -->
                <div style="margin: 32px 0; padding: 24px; background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border-radius: 12px; border: 1px solid #3b82f6;">
                    <h3 style="color: #1e40af; margin: 0 0 16px 0; font-size: 20px; font-weight: 700;">What happens next?</h3>
                    <ol style="color: #1e3a8a; margin: 0; text-align: left; max-width: 400px; margin: 0 auto; line-height: 1.8;">
                        <li style="margin: 8px 0;">Click the button above to access your personalized application</li>
                        <li style="margin: 8px 0;">Complete your coaching profile (takes about 10 minutes)</li>
                        <li style="margin: 8px 0;">Submit your application for review</li>
                        <li style="margin: 8px 0;">Get approved and start coaching on AthLeap!</li>
                    </ol>
                </div>
            </div>
        </main>

        <!-- Footer -->
        <footer style="background-color: #f9fafb; text-align: center; padding: 24px; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 14px; margin: 0 0 8px 0;">
                This invitation was sent by ${inviterName} (${organizationName})
            </p>
            <p style="margin: 0; font-weight: 700; color: #13367A; font-size: 16px;">
                AthLeap - The Work Before the Win
            </p>
            <p style="color: #9ca3af; font-size: 12px; margin: 16px 0 0 0;">
                <a href="#" style="color: #6b7280; text-decoration: underline;">Unsubscribe</a> |
                <a href="#" style="color: #6b7280; text-decoration: underline;">Privacy Policy</a>
            </p>
        </footer>

    </div>

</body>
</html>
  `
}

export function getSimpleCoachInvitationTemplate(props: EmailTemplateProps): string {
  // Fallback to a simpler template if needed
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