import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const { email, name } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Send approval email
    const { data, error } = await resend.emails.send({
      from: 'PLAYBOOKD <noreply@playbookd.com>',
      to: email,
      subject: '🎉 Welcome to PLAYBOOKD - Your Coach Application is Approved!',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Application Approved</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
            <table role="presentation" style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 40px 20px;">
                  <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">

                    <!-- Header -->
                    <tr>
                      <td style="background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); padding: 40px 20px; text-align: center;">
                        <h1 style="margin: 0 0 10px; color: #ffffff; font-size: 32px; font-weight: bold; letter-spacing: 2px;">
                          PLAYBOOKD
                        </h1>
                        <p style="margin: 0; color: rgba(255, 255, 255, 0.9); font-size: 18px;">
                          🎉 Congratulations!
                        </p>
                      </td>
                    </tr>

                    <!-- Success Icon -->
                    <tr>
                      <td style="padding: 40px 20px 20px; text-align: center;">
                        <div style="width: 100px; height: 100px; background-color: #dcfce7; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center;">
                          <svg width="60" height="60" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M5 13l4 4L19 7" stroke="#16a34a" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
                          </svg>
                        </div>
                      </td>
                    </tr>

                    <!-- Main Content -->
                    <tr>
                      <td style="padding: 0 40px 40px;">
                        <h2 style="margin: 0 0 20px; color: #111827; font-size: 28px; text-align: center;">
                          You're Approved!
                        </h2>

                        <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                          Hi ${name || 'Coach'},
                        </p>

                        <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                          We're thrilled to welcome you to the PLAYBOOKD coaching community! Your application has been approved, and you now have full access to your coach dashboard.
                        </p>

                        <div style="background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%); border-left: 4px solid #16a34a; padding: 25px; margin: 30px 0; border-radius: 8px;">
                          <h3 style="margin: 0 0 20px; color: #111827; font-size: 20px;">
                            🚀 Get Started as a Coach
                          </h3>

                          <div style="margin-bottom: 20px;">
                            <strong style="color: #111827; font-size: 16px;">1. Access Your Dashboard</strong>
                            <p style="margin: 8px 0 0; color: #374151; font-size: 14px; line-height: 1.5;">
                              Click the button below to access your coach dashboard and start creating content.
                            </p>
                          </div>

                          <div style="margin-bottom: 20px;">
                            <strong style="color: #111827; font-size: 16px;">2. Complete Your Profile</strong>
                            <p style="margin: 8px 0 0; color: #374151; font-size: 14px; line-height: 1.5;">
                              Upload professional photos, add your credentials, and customize your coach profile to attract athletes.
                            </p>
                          </div>

                          <div style="margin-bottom: 20px;">
                            <strong style="color: #111827; font-size: 16px;">3. Create Your First Lesson</strong>
                            <p style="margin: 8px 0 0; color: #374151; font-size: 14px; line-height: 1.5;">
                              Share your expertise by creating training videos, drills, and lessons for athletes around the world.
                            </p>
                          </div>

                          <div>
                            <strong style="color: #111827; font-size: 16px;">4. Build Your Audience</strong>
                            <p style="margin: 8px 0 0; color: #374151; font-size: 14px; line-height: 1.5;">
                              Connect with athletes, build your following, and monetize your knowledge and experience.
                            </p>
                          </div>
                        </div>

                        <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 30px 0; border-radius: 4px;">
                          <h4 style="margin: 0 0 10px; color: #111827; font-size: 16px;">
                            💡 Pro Tip
                          </h4>
                          <p style="margin: 0; color: #78350f; font-size: 14px; line-height: 1.5;">
                            Start by creating 3-5 high-quality lessons to showcase your coaching style. Athletes are more likely to follow coaches with engaging content!
                          </p>
                        </div>

                        <div style="text-align: center; margin: 40px 0;">
                          <a href="https://playbookd.com/dashboard/creator"
                             style="display: inline-block; padding: 16px 40px; background-color: #16a34a; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 18px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                            Access Coach Dashboard →
                          </a>
                        </div>

                        <p style="margin: 30px 0 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                          If you have any questions or need help getting started, our support team is here to assist you every step of the way.
                        </p>

                        <p style="margin: 20px 0 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                          Welcome to the team! 🏆
                        </p>

                        <p style="margin: 15px 0 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                          The PLAYBOOKD Team
                        </p>
                      </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                      <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                        <p style="margin: 0 0 15px; color: #6b7280; font-size: 14px;">
                          Need help? Contact us at <a href="mailto:support@playbookd.com" style="color: #16a34a; text-decoration: none; font-weight: 600;">support@playbookd.com</a>
                        </p>
                        <div style="margin: 20px 0;">
                          <a href="https://playbookd.com/coach/guide" style="margin: 0 10px; color: #6b7280; text-decoration: none; font-size: 14px;">Coach Guide</a>
                          <span style="color: #d1d5db;">|</span>
                          <a href="https://playbookd.com/help" style="margin: 0 10px; color: #6b7280; text-decoration: none; font-size: 14px;">Help Center</a>
                          <span style="color: #d1d5db;">|</span>
                          <a href="https://playbookd.com/community" style="margin: 0 10px; color: #6b7280; text-decoration: none; font-size: 14px;">Community</a>
                        </div>
                        <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                          © 2024 PLAYBOOKD. All rights reserved.
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
      console.error('Error sending approval email:', error)
      return NextResponse.json(
        { error: 'Failed to send approval email' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error in approval email API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
