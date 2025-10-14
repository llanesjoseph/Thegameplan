import { NextRequest, NextResponse } from 'next/server'
import { auth as adminAuth, adminDb } from '@/lib/firebase.admin'

/**
 * GET /api/athlete/coach-feed
 * Fetch aggregated feed from assigned coach + followed coaches
 *
 * Feed Logic:
 * - Assigned coach: ALL posts (assigned, followers, public)
 * - Followed coaches: ONLY followers + public posts
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split('Bearer ')[1]
    const decodedToken = await adminAuth.verifyIdToken(token)
    const userId = decodedToken.uid

    // Get athlete's assigned coach ID
    const userDoc = await adminDb.collection('users').doc(userId).get()
    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const userData = userDoc.data()
    const assignedCoachId = userData?.coachId || userData?.assignedCoachId

    // Get list of followed coaches
    const followsSnapshot = await adminDb
      .collection('coach_followers')
      .where('athleteId', '==', userId)
      .get()

    const followedCoachIds = followsSnapshot.docs.map(doc => doc.data().coachId)

    let allPosts: any[] = []

    // Fetch ALL posts from assigned coach
    if (assignedCoachId) {
      const assignedPostsSnapshot = await adminDb
        .collection('coach_posts')
        .where('coachId', '==', assignedCoachId)
        .get()

      const assignedPosts = assignedPostsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        source: 'assigned',
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || null,
        updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || null
      }))

      allPosts = [...allPosts, ...assignedPosts]
    }

    // Fetch followers + public posts from followed coaches
    if (followedCoachIds.length > 0) {
      // Firestore 'in' query has a limit of 10 items, so we need to batch
      const batchSize = 10
      for (let i = 0; i < followedCoachIds.length; i += batchSize) {
        const batch = followedCoachIds.slice(i, i + batchSize)

        const followedPostsSnapshot = await adminDb
          .collection('coach_posts')
          .where('coachId', 'in', batch)
          .where('audience', 'in', ['followers', 'public'])
          .get()

        const followedPosts = followedPostsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          source: 'following',
          createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || null,
          updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || null
        }))

        allPosts = [...allPosts, ...followedPosts]
      }
    }

    // Sort by pinned first, then by date
    allPosts.sort((a, b) => {
      // Pinned posts first
      if (a.pinned && !b.pinned) return -1
      if (!a.pinned && b.pinned) return 1

      // Then by date (newest first)
      const dateA = new Date(a.createdAt || 0).getTime()
      const dateB = new Date(b.createdAt || 0).getTime()
      return dateB - dateA
    })

    // Limit to most recent 50 posts total
    const posts = allPosts.slice(0, 50)

    return NextResponse.json({
      success: true,
      posts,
      sources: {
        assignedCoach: assignedCoachId || null,
        followedCoaches: followedCoachIds
      },
      stats: {
        total: posts.length,
        fromAssigned: posts.filter(p => p.source === 'assigned').length,
        fromFollowing: posts.filter(p => p.source === 'following').length
      }
    })
  } catch (error) {
    console.error('Error fetching coach feed:', error)
    return NextResponse.json(
      { error: 'Failed to fetch coach feed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
