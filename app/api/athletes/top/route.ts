import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase.admin'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * GET /api/athletes/top
 * Get top athletes based on activity and engagement
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '3')

    // Get athletes sorted by last activity
    const athletesSnapshot = await adminDb
      .collection('users')
      .where('role', '==', 'athlete')
      .orderBy('lastLoginAt', 'desc')
      .limit(limit)
      .get()

    const athletes = athletesSnapshot.docs.map(doc => {
      const data = doc.data()
      return {
        id: doc.id,
        displayName: data.displayName || 'Unknown Athlete',
        photoURL: data.photoURL || null,
        sport: data.sport || data.primarySport || data.preferredSports?.[0] || null,
        lastLoginAt: data.lastLoginAt?.toDate?.()?.toISOString() || null
      }
    })

    return NextResponse.json({
      success: true,
      athletes,
      count: athletes.length
    })
  } catch (error) {
    console.error('Error fetching top athletes:', error)
    return NextResponse.json(
      { error: 'Failed to fetch top athletes', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
