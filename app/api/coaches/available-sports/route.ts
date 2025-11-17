import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase.admin'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * GET /api/coaches/available-sports
 * Get list of sports that have active coaches
 */
export async function GET() {
  try {
    // Get all active coaches from creators_index
    const coachesSnapshot = await adminDb
      .collection('creators_index')
      .where('isActive', '==', true)
      .get()

    // Collect unique sports
    const sportsSet = new Set<string>()
    coachesSnapshot.docs.forEach(doc => {
      const sport = doc.data().sport
      if (sport && typeof sport === 'string') {
        sportsSet.add(sport)
      }
    })

    // Convert to sorted array
    const sports = Array.from(sportsSet).sort()

    return NextResponse.json({
      success: true,
      sports,
      count: sports.length
    })
  } catch (error) {
    console.error('Error fetching available sports:', error)
    return NextResponse.json(
      { error: 'Failed to fetch available sports' },
      { status: 500 }
    )
  }
}
