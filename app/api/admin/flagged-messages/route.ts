import { NextRequest, NextResponse } from 'next/server'
import { getFlaggedMessages } from '@/lib/message-audit-logger'
import { requireAuth } from '@/lib/auth-utils'

export async function GET(request: NextRequest) {
  try {
    // Require admin auth
    const authResult = await requireAuth(request, ['admin', 'superadmin'])
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const messages = await getFlaggedMessages(100)

    return NextResponse.json({
      success: true,
      messages,
      count: messages.length
    })
  } catch (error) {
    console.error('Error fetching flagged messages:', error)
    return NextResponse.json(
      { error: 'Failed to fetch flagged messages' },
      { status: 500 }
    )
  }
}
