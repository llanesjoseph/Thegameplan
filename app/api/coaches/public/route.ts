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

    // Try creators_index first, then fallback to users collection
    let allCoaches: any[] = []

    try {
      // Query creators_index and only pull coaches that should be publicly visible
      // Visibility rules match ensure-coach-visibility.ts:
      // - isActive === true
      // - profileComplete === true
      // - status === 'approved' (or unset)
      let collectionRef = adminDb
        .collection('creators_index')
        .where('isActive', '==', true)

      const snapshot = sport && sport !== 'all'
        ? await collectionRef.where('sport', '==', sport).get()
        : await collectionRef.get()

      if (snapshot.docs.length > 0) {
        const rawCoaches = snapshot.docs.map(doc => {
          const data = doc.data()
          // Ensure we have image URLs - check multiple field names
          // Prioritize Firebase Storage URLs over external URLs (Google Photos) for reliability
          const imageUrl = data.headshotUrl ||
                          data.photoURL ||
                          data.profileImageUrl ||
                          data.profileImage ||
                          data.bannerUrl ||
                          data.heroImageUrl ||
                          data.coverImageUrl

          return {
            id: doc.id,
            ...data,
            // Ensure profileImageUrl is always set if any image exists
            profileImageUrl: imageUrl || data.profileImageUrl
          }
        })

        // Apply same visibility rules used elsewhere
        let visibleCoaches = rawCoaches.filter(coach =>
          coach.profileComplete === true &&
          (coach.status === 'approved' || !coach.status)
        )

        // Extra safety: only include users that currently have coach/creator roles
        // in the main users collection so test/dummy records don't bleed through.
        try {
          const usersSnapshot = await adminDb
            .collection('users')
            .where('role', 'in', ['coach', 'creator'])
            .get()

          const allowedIds = new Set(usersSnapshot.docs.map(doc => doc.id))
          visibleCoaches = visibleCoaches.filter(coach => allowedIds.has(coach.id))
        } catch (roleCheckError) {
          console.warn('[API/COACHES/PUBLIC] Role check for creators_index coaches failed:', roleCheckError)
        }

        allCoaches = visibleCoaches
      }
    } catch (indexError) {
      console.log('[API/COACHES/PUBLIC] creators_index query failed, trying users collection:', indexError)
    }

    // Fallback: If creators_index is empty or failed, try users collection
    if (allCoaches.length === 0) {
      try {
        let usersQuery = adminDb
          .collection('users')
          .where('role', 'in', ['coach', 'creator'])

        const usersSnapshot = await usersQuery.get()
        allCoaches = usersSnapshot.docs.map(doc => {
          const data = doc.data()
          // Ensure we have image URLs - check multiple field names
          // Prioritize Firebase Storage URLs over external URLs (Google Photos) for reliability
          const imageUrl = data.headshotUrl ||
                          data.photoURL ||
                          data.profileImageUrl ||
                          data.profileImage ||
                          data.bannerUrl ||
                          data.heroImageUrl ||
                          data.coverImageUrl

          return {
            id: doc.id,
            ...data,
            // Ensure profileImageUrl is always set if any image exists
            profileImageUrl: imageUrl || data.profileImageUrl
          }
        })
      } catch (usersError) {
        console.error('[API/COACHES/PUBLIC] users collection query also failed:', usersError)
      }
    }

    // Filter by sport in memory if needed (for users collection fallback)
    if (sport && sport !== 'all' && allCoaches.length > 0) {
      allCoaches = allCoaches.filter(coach =>
        coach.specialties?.includes(sport) || coach.sport === sport
      )
    }

    // Sort by displayName
    allCoaches.sort((a, b) => {
      const nameA = a.displayName || ''
      const nameB = b.displayName || ''
      return nameA.localeCompare(nameB)
    })

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
