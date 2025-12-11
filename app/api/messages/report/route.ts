import { NextRequest, NextResponse } from 'next/server'
import { reportMessage } from '@/lib/message-audit-logger'
import { requireAuth } from '@/lib/auth-utils'

// Force dynamic rendering for API route
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Report Message API
 *
 * Allows users to report inappropriate messages
 */
export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const authResult = await requireAuth(request)
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { messageId, reportReason, reportDetails } = body

    if (!messageId || !reportReason) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create report
    const reportId = await reportMessage({
      messageId,
      reportedBy: authResult.user.uid,
      reportedByRole: authResult.user.role || 'user',
      reportReason,
      reportDetails: reportDetails || ''
    })

    return NextResponse.json({
      success: true,
      reportId,
      message: 'Message reported successfully. Our team will review it shortly.'
    })

  } catch (error) {
    console.error('Error reporting message:', error)
    return NextResponse.json(
      { error: 'Failed to report message' },
      { status: 500 }
    )
  }
}
