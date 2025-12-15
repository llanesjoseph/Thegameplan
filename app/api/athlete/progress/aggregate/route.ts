import { NextRequest, NextResponse } from 'next/server'
import { auth, adminDb } from '@/lib/firebase.admin'
import { FieldValue } from 'firebase-admin/firestore'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * GET /api/athlete/progress/aggregate
 * Get aggregated progress from ALL followed coaches
 * This ensures metrics are accurate when athlete has multiple coaches
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Verify authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      )
    }

    const token = authHeader.split('Bearer ')[1]
    const decodedToken = await auth.verifyIdToken(token)
    const athleteId = decodedToken.uid

    // 2. Get all followed coaches
    const followsSnapshot = await adminDb
      .collection('coach_followers')
      .where('athleteId', '==', athleteId)
      .get()

    const followedCoachIds = followsSnapshot.docs.map(doc => doc.data().coachId)

    // 3. Get assigned coach if exists
    const userDoc = await adminDb.collection('users').doc(athleteId).get()
    const userData = userDoc.data()
    const assignedCoachId = userData?.coachId || userData?.assignedCoachId

    // Combine all coach IDs (assigned + followed, no duplicates)
    const allCoachIds = new Set<string>()
    if (assignedCoachId) {
      allCoachIds.add(assignedCoachId)
    }
    followedCoachIds.forEach(coachId => allCoachIds.add(coachId))

    console.log(`📊 Aggregating progress for athlete ${athleteId} from ${allCoachIds.size} coaches`)

    // 4. Fetch athlete feed for completion tracking
    const feedDoc = await adminDb.collection('athlete_feed').doc(athleteId).get()
    const feedData = feedDoc.exists ? feedDoc.data() : {}
    const completedLessons = new Set<string>(feedData?.completedLessons || [])
    const startedLessons = new Set<string>(feedData?.startedLessons || [])

    // 5. Aggregate ALL lessons from ALL coaches
    const allAvailableLessons = new Set<string>()

    // Get lessons from athlete_feed (already aggregated from all coaches)
    const feedAvailableLessons = feedData?.availableLessons || feedData?.lessons || []
    feedAvailableLessons.forEach((lessonId: string) => allAvailableLessons.add(lessonId))

    // Also fetch directly from all coaches to ensure we have everything
    for (const coachId of allCoachIds) {
      try {
        const lessonsSnapshot = await adminDb
          .collection('content')
          .where('creatorUid', '==', coachId)
          .where('status', '==', 'published')
          .get()

        lessonsSnapshot.docs.forEach(doc => {
          allAvailableLessons.add(doc.id)
        })
      } catch (error) {
        console.warn(`⚠️ Could not fetch lessons for coach ${coachId}:`, error)
      }
    }

    // 6. Update athlete_feed with ALL lessons from ALL coaches (if needed)
    const allLessonsArray = Array.from(allAvailableLessons)
    if (feedAvailableLessons.length !== allLessonsArray.length) {
      console.log(`🔄 Syncing athlete_feed: ${feedAvailableLessons.length} -> ${allLessonsArray.length} lessons`)
      await adminDb.collection('athlete_feed').doc(athleteId).update({
        availableLessons: allLessonsArray,
        totalLessons: allLessonsArray.length,
        updatedAt: FieldValue.serverTimestamp()
      })
    }

    // 7. Calculate metrics from aggregated data
    const totalLessons = allAvailableLessons.size
    const completedCount = Array.from(completedLessons).filter(id => allAvailableLessons.has(id)).length

    // In progress = lessons that are started but NOT completed
    const startedButNotCompleted = Array.from(startedLessons).filter(
      (lessonId: string) => allAvailableLessons.has(lessonId) && !completedLessons.has(lessonId)
    )
    const inProgressCount = startedButNotCompleted.length

    // Calculate completion rate
    const completionRate = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0

    console.log(`✅ Aggregated progress: ${completedCount}/${totalLessons} complete, ${inProgressCount} in progress`)

    return NextResponse.json({
      success: true,
      progress: {
        totalLessons,
        completedLessons: completedCount,
        inProgressLessons: inProgressCount,
        completionRate,
        totalCoaches: allCoachIds.size,
        coachIds: Array.from(allCoachIds),
        lastActivity: feedData?.lastActivity?.toDate?.()?.toISOString() || null
      }
    })

  } catch (error: any) {
    console.error('❌ Error aggregating athlete progress:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    })
    return NextResponse.json(
      {
        error: error.message || 'Internal server error',
        details: error.code || error.name
      },
      { status: 500 }
    )
  }
}

