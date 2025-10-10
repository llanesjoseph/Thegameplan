import { NextRequest, NextResponse } from 'next/server'
import { getEmailTemplate } from '@/lib/email-templates'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const templateType = searchParams.get('type') as 'athleap' | 'simple' || 'athleap'
    const name = searchParams.get('name') || 'Coach Demo'
    const organizationName = searchParams.get('org') || 'AthLeap Demo'
    const sport = searchParams.get('sport') || 'Soccer'

    // Generate preview data
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const previewId = `preview-${Date.now()}`
    const invitationUrl = `${baseUrl}/coach-onboard/${previewId}`
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(invitationUrl)}`

    const htmlContent = getEmailTemplate(templateType, {
      organizationName,
      inviterName: 'AthLeap Team',
      sport,
      invitationUrl,
      qrCodeUrl,
      customMessage: `Welcome to ${organizationName}! This is a preview of how your coach invitation email will look with the AthLeap template.`,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      recipientName: name
    })

    return new NextResponse(htmlContent, {
      headers: {
        'Content-Type': 'text/html',
      },
    })

  } catch (error) {
    console.error('Preview email template error:', error)
    return NextResponse.json(
      { error: 'Failed to generate email template preview' },
      { status: 500 }
    )
  }
}