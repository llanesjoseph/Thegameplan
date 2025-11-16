import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase.admin'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * GET /api/coaches/public
 * Fetches all active, published coaches from the public coach pool
 * No authentication required - this is public data
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sport = searchParams.get('sport')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Query creators_index for all active coaches
    let query = adminDb
      .collection('creators_index')
      .where('isActive', '==', true)
      .where('profileComplete', '==', true)

    // Optional: Filter by sport
    if (sport && sport !== 'all') {
      query = query.where('specialties', 'array-contains', sport)
    }

    // Order by display name for consistent results
    query = query.orderBy('displayName')

    // Get all coaches first, then paginate
    const snapshot = await query.get()

    // Apply offset and limit
    const allCoaches = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))

    const paginatedCoaches = allCoaches.slice(offset, offset + limit)
    const totalCount = allCoaches.length

    return NextResponse.json({
      success: true,
      coaches: paginatedCoaches,
      pagination: {
        total: totalCount,
        offset,
        limit,
        hasMore: (offset + limit) < totalCount
      }
    })

  } catch (error) {
    console.error('[API/COACHES/PUBLIC] Error fetching coaches:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch coaches',
        coaches: [],
        pagination: { total: 0, offset: 0, limit: 0, hasMore: false }
      },
      { status: 500 }
    )
  }
}
