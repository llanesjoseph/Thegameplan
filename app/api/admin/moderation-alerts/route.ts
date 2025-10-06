import { NextRequest, NextResponse } from 'next/server'
import { getModerationAlerts } from '@/lib/message-audit-logger'
import { requireAuth } from '@/lib/auth-utils'

export async function GET(request: NextRequest) {
  try {
    // Require admin auth
    const authResult = await requireAuth(request, ['admin', 'superadmin'])
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') as any

    const alerts = await getModerationAlerts(status)

    return NextResponse.json({
      success: true,
      alerts,
      count: alerts.length
    })
  } catch (error) {
    console.error('Error fetching moderation alerts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch moderation alerts' },
      { status: 500 }
    )
  }
}
