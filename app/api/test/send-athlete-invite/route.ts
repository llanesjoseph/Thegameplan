import { NextRequest, NextResponse } from 'next/server'
import { sendAthleteInvitationEmail } from '@/lib/email-service'
import { nanoid } from 'nanoid'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const { to, athleteName, coachName, sport } = await request.json()

    if (!to) {
      return NextResponse.json({ success: false, error: 'Missing recipient email' }, { status: 400 })
    }

    // Lightweight guard: require a header key, but allow 'dev' key on the *.crucibleanalytics.dev host
    const host = request.headers.get('host') || ''
    const providedKey = request.headers.get('x-email-test-key') || ''
    const requiredKey = process.env.EMAIL_TEST_KEY || 'dev'
    const isDevHost = host.includes('crucibleanalytics.dev') || host.includes('localhost')

    if (!(isDevHost && providedKey === requiredKey)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      `https://${host}` ||
      'https://athleap.crucibleanalytics.dev'

    const invitationId = `test-${nanoid(10)}`
    const invitationUrl = `${baseUrl}/invite/athlete/${invitationId}`

    const result = await sendAthleteInvitationEmail({
      to,
      athleteName: athleteName || 'Athlete',
      coachName: coachName || 'AthLeap Coach',
      sport: sport || '',
      invitationUrl,
      // legacy/unused in simplified template, passed for signature compatibility
      qrCodeUrl: '',
      customMessage: '',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    })

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error || 'Failed to send' }, { status: 500 })
    }

    return NextResponse.json({ success: true, invitationUrl })
  } catch (error) {
    console.error('Test invite send error:', error)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}


