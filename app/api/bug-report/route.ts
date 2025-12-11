import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

// Force dynamic rendering for API route
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const resend = new Resend(process.env.RESEND_API_KEY)

interface BugReportRequest {
  description: string
  consoleLogs: Array<{
    type: 'log' | 'error' | 'warn' | 'info'
    message: string
    timestamp: string
  }>
  pageInfo: {
    url: string
    userAgent: string
    timestamp: string
    userId: string
    userEmail: string
  }
  screenshot?: string // Base64 encoded image
}

export async function POST(request: NextRequest) {
  try {
    const body: BugReportRequest = await request.json()
    const { description, consoleLogs, pageInfo, screenshot } = body

    if (!description) {
      return NextResponse.json(
        { error: 'Description is required' },
        { status: 400 }
      )
    }

    // Format console logs for email
    const consoleLogsHtml = consoleLogs.length > 0
      ? `
        <div style="background: #1e1e1e; color: #d4d4d4; padding: 20px; border-radius: 8px; font-family: 'Courier New', monospace; font-size: 13px; margin: 20px 0; max-height: 500px; overflow-y: auto;">
          <h3 style="color: #4fc3f7; margin-top: 0;">Console Logs (Last ${consoleLogs.length} entries):</h3>
          ${consoleLogs.map(log => {
            const color =
              log.type === 'error' ? '#f44336' :
              log.type === 'warn' ? '#ff9800' :
              log.type === 'info' ? '#2196f3' :
              '#4caf50'

            const time = new Date(log.timestamp).toLocaleTimeString()
            return `<div style="margin: 8px 0; padding: 8px; background: rgba(255,255,255,0.05); border-left: 3px solid ${color};">
              <span style="color: #888;">[${time}]</span>
              <span style="color: ${color}; font-weight: bold;">[${log.type.toUpperCase()}]</span>
              <span style="color: #d4d4d4;">${escapeHtml(log.message)}</span>
            </div>`
          }).join('')}
        </div>
      `
      : '<p style="color: #666;">No console logs captured.</p>'

    // Create email HTML
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Bug Report - Athleap</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f8fafc;">
        <div style="max-width: 800px; margin: 0 auto; background: white; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); overflow: hidden;">

          <!-- Header -->
          <div style="background: linear-gradient(135deg, #13367A 0%, #A01C21 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px; letter-spacing: 2px;">🐛 BUG REPORT</h1>
            <p style="color: #87ceeb; margin: 8px 0 0 0; font-size: 14px;">Athleap Live Testing</p>
          </div>

          <!-- Content -->
          <div style="padding: 40px;">

            <!-- User Info -->
            <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border-left: 4px solid #13367A; padding: 20px; margin-bottom: 30px; border-radius: 0 8px 8px 0;">
              <h2 style="color: #13367A; margin-top: 0; font-size: 20px;">Reporter Information</h2>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #666; font-weight: 600;">User ID:</td>
                  <td style="padding: 8px 0; color: #333;">${pageInfo.userId}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666; font-weight: 600;">Email:</td>
                  <td style="padding: 8px 0; color: #333;">${pageInfo.userEmail}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666; font-weight: 600;">Page URL:</td>
                  <td style="padding: 8px 0; color: #333; word-break: break-all;">${pageInfo.url}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666; font-weight: 600;">Timestamp:</td>
                  <td style="padding: 8px 0; color: #333;">${new Date(pageInfo.timestamp).toLocaleString()}</td>
                </tr>
              </table>
            </div>

            <!-- Bug Description -->
            <div style="background: #fef2f2; border-left: 4px solid #A01C21; padding: 20px; margin-bottom: 30px; border-radius: 0 8px 8px 0;">
              <h2 style="color: #A01C21; margin-top: 0; font-size: 20px;">Bug Description</h2>
              <p style="color: #333; white-space: pre-wrap; line-height: 1.6; margin: 0;">${escapeHtml(description)}</p>
            </div>

            ${screenshot ? `
            <!-- Screenshot -->
            <div style="margin-bottom: 30px;">
              <h2 style="color: #333; font-size: 20px; margin-bottom: 15px;">📸 Screenshot</h2>
              <div style="background: #f9fafb; border: 2px solid #e5e7eb; border-radius: 8px; padding: 10px;">
                <img src="${screenshot}" alt="Bug screenshot" style="max-width: 100%; height: auto; border-radius: 4px;" />
              </div>
            </div>
            ` : ''}

            <!-- Console Logs -->
            <div style="margin-bottom: 30px;">
              <h2 style="color: #333; font-size: 20px; margin-bottom: 15px;">📝 Console Logs</h2>
              ${consoleLogsHtml}
            </div>

            <!-- Browser Info -->
            <div style="background: #f9fafb; border: 1px solid #e5e7eb; padding: 20px; border-radius: 8px;">
              <h3 style="color: #666; margin-top: 0; font-size: 16px;">Browser Information</h3>
              <p style="color: #666; font-size: 13px; font-family: monospace; margin: 0; word-break: break-all;">${escapeHtml(pageInfo.userAgent)}</p>
            </div>

          </div>

          <!-- Footer -->
          <div style="background: #f9fafb; text-align: center; padding: 24px; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0; font-weight: 700; color: #13367A; font-size: 16px;">Athleap</p>
            <p style="color: #6b7280; font-size: 14px; margin: 8px 0 0 0;">For The Future of Sports</p>
          </div>

        </div>
      </body>
      </html>
    `

    // Send email using Resend
    const { data, error } = await resend.emails.send({
      from: 'Athleap Bug Reports <noreply@mail.crucibleanalytics.dev>',
      to: ['joseph@crucibleanalytics.dev'], // Your email
      replyTo: pageInfo.userEmail !== 'anonymous' ? pageInfo.userEmail : undefined,
      subject: `🐛 Bug Report - ${pageInfo.url.split('/').pop() || 'Athleap'}`,
      html: emailHtml
    })

    if (error) {
      console.error('Failed to send bug report email:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    console.log('✅ Bug report email sent successfully:', data?.id)

    return NextResponse.json({
      success: true,
      message: 'Bug report sent successfully',
      emailId: data?.id
    })

  } catch (error) {
    console.error('Bug report API error:', error)
    return NextResponse.json(
      { error: 'Failed to process bug report' },
      { status: 500 }
    )
  }
}

// Helper function to escape HTML
function escapeHtml(text: string): string {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }
  return text.replace(/[&<>"']/g, (m) => map[m])
}