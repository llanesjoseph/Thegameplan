import { NextRequest, NextResponse } from 'next/server'

// Force dynamic rendering for API route
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Legacy API endpoint for cache clearing
 *
 * Note: The new AI system (QA Agent) doesn't use client-side caching,
 * so this endpoint is now a no-op for backwards compatibility.
 *
 * Usage: POST /api/clear-coach-cache
 * Optional body: { "coachId": "specific-coach-id" }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const { coachId } = body

    // Clear AI cache if it exists (legacy support)
    if (typeof globalThis !== 'undefined') {
      ;(globalThis as any).__aiCache = new Map()
    }

    return NextResponse.json({
      success: true,
      message: coachId
        ? `Cache cleared for coach: ${coachId}`
        : 'All coach caches cleared'
    })
  } catch (error) {
    console.error('Error clearing cache:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to clear cache' },
      { status: 500 }
    )
  }
}
