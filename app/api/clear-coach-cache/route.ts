import { NextRequest, NextResponse } from 'next/server'
import { clearCoachContextCache } from '@/lib/dynamic-coach-context'

/**
 * Simple API endpoint to clear coach context cache
 * Usage: POST /api/clear-coach-cache
 * Optional body: { "coachId": "specific-coach-id" }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const { coachId } = body

    clearCoachContextCache(coachId)

    // Also clear the AI response cache
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
