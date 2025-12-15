import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

// Force dynamic rendering for API route
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Lazy initialization of Resend to avoid build-time errors when API key is missing
let resendInstance: Resend | null = null
function getResend(): Resend | null {
  if (!resendInstance) {
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      console.warn('⚠️ RESEND_API_KEY not set - email notifications will be disabled')
      return null
    }
    resendInstance = new Resend(apiKey)
  }
  return resendInstance
}

export async function POST(request: NextRequest) {
  try {
    const { email, name } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Send confirmation email
    const resend = getResend()
    if (!resend) {
      return NextResponse.json({ error: 'Email service not configured' }, { status: 500 })
    }

    const { data, error } = await resend.emails.send({
      from: 'Athleap <noreply@mail.crucibleanalytics.dev>',
      to: email,
      subject: 'Coach Application Received - Athleap',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Application Received</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
            <table role="presentation" style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 40px 20px;">
                  <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">

                    <!-- Header -->
                    <tr>
                      <td style="background: linear-gradient(135deg, #8D9440 0%, #624A41 100%); padding: 40px 20px; text-align: center;">
                        <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: bold; letter-spacing: 2px;">
                          Athleap
                        </h1>
                      </td>
                    </tr>

                    <!-- Success Icon -->
                    <tr>
                      <td style="padding: 40px 20px 20px; text-align: center;">
                        <div style="width: 80px; height: 80px; background-color: #dcfce7; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center;">
                          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M20 6L9 17L4 12" stroke="#16a34a" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
                          </svg>
                        </div>
                      </td>
                    </tr>

                    <!-- Main Content -->
                    <tr>
                      <td style="padding: 0 40px 40px;">
                        <h2 style="margin: 0 0 20px; color: #111827; font-size: 28px; text-align: center;">
                          Application Received!
                        </h2>

                        <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                          Hi ${name || 'there'},
                        </p>

                        <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                          Thank you for applying to become a coach on Athleap! We're excited to review your application and learn more about your coaching expertise.
                        </p>

                        <div style="background-color: #f3f4f6; border-left: 4px solid #8D9440; padding: 20px; margin: 30px 0; border-radius: 4px;">
                          <h3 style="margin: 0 0 15px; color: #111827; font-size: 18px;">
                            What Happens Next?
                          </h3>

                          <div style="margin-bottom: 15px;">
                            <strong style="color: #111827;">1. Review Process (2-3 Business Days)</strong>
                            <p style="margin: 5px 0 0; color: #6b7280; font-size: 14px;">
                              Our admin team will carefully review your credentials, experience, and application details.
                            </p>
                          </div>

                          <div style="margin-bottom: 15px;">
                            <strong style="color: #111827;">2. Approval Notification</strong>
                            <p style="margin: 5px 0 0; color: #6b7280; font-size: 14px;">
                              You'll receive an email notification once your application has been reviewed.
                            </p>
                          </div>

                          <div>
                            <strong style="color: #111827;">3. Get Started Creating</strong>
                            <p style="margin: 5px 0 0; color: #6b7280; font-size: 14px;">
                              Once approved, you'll have access to your coach dashboard where you can start creating training content.
                            </p>
                          </div>
                        </div>

                        <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                          We appreciate your patience during the review process. If you have any questions, please don't hesitate to reach out to our support team.
                        </p>

                        <div style="text-align: center; margin: 30px 0;">
                          <a href="https://athleap.com/dashboard"
                             style="display: inline-block; padding: 14px 32px; background-color: #8D9440; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                            Go to Dashboard
                          </a>
                        </div>
                      </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                      <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                        <p style="margin: 0 0 10px; color: #6b7280; font-size: 14px;">
                          Questions? Contact us at <a href="mailto:support@athleap.com" style="color: #8D9440; text-decoration: none;">support@athleap.com</a>
                        </p>
                        <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                          © 2024 Athleap. All rights reserved.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `
    })

    if (error) {
      console.error('Error sending confirmation email:', error)
      return NextResponse.json(
        { error: 'Failed to send confirmation email' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error in confirmation email API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
