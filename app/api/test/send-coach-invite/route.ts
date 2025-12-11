import { NextRequest, NextResponse } from 'next/server'
import { sendCoachInvitationEmail } from '@/lib/email-service'
import { nanoid } from 'nanoid'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const { to, coachName, sport } = await request.json()

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

    const ingestionId = `test-${nanoid(10)}`
    const invitationUrl = `${baseUrl}/invite/coach/${ingestionId}`

    const result = await sendCoachInvitationEmail({
      to,
      organizationName: 'Athleap',
      inviterName: 'The Athleap Team',
      sport: sport || 'Basketball',
      invitationUrl,
      qrCodeUrl: '',
      customMessage: '',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    })

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error || 'Failed to send' }, { status: 500 })
    }

    return NextResponse.json({ success: true, invitationUrl })
  } catch (error) {
    console.error('Test coach invite send error:', error)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}

// Convenience GET handler so you can click a URL to trigger a test send.
// Usage:
//   /api/test/send-coach-invite?to=you@example.com&name=Lona&sport=Basketball&key=dev
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const to = searchParams.get('to') || ''
    const coachName = searchParams.get('name') || 'Coach'
    const sport = searchParams.get('sport') || 'Basketball'

    if (!to) {
      return NextResponse.json({ success: false, error: 'Missing recipient email' }, { status: 400 })
    }

    const host = request.headers.get('host') || ''
    const providedKey = request.headers.get('x-email-test-key') || searchParams.get('key') || ''
    const requiredKey = process.env.EMAIL_TEST_KEY || 'dev'
    const isDevHost = host.includes('crucibleanalytics.dev') || host.includes('localhost')

    if (!(isDevHost && providedKey === requiredKey)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      `https://${host}` ||
      'https://athleap.crucibleanalytics.dev'

    const ingestionId = `test-${nanoid(10)}`
    const invitationUrl = `${baseUrl}/invite/coach/${ingestionId}`

    const result = await sendCoachInvitationEmail({
      to,
      organizationName: 'Athleap',
      inviterName: 'The Athleap Team',
      sport,
      invitationUrl,
      qrCodeUrl: '',
      customMessage: '',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    })

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error || 'Failed to send' }, { status: 500 })
    }

    return NextResponse.json({ success: true, invitationUrl })
  } catch (error) {
    console.error('Test coach invite GET error:', error)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}
