import { NextRequest, NextResponse } from 'next/server'
import { auth, adminDb } from '@/lib/firebase.admin'
import { FieldValue } from 'firebase-admin/firestore'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * POST /api/athlete/progress/sync-all
 * Force re-aggregation of ALL lessons from ALL coaches
 * This ensures athlete_feed is completely in sync
 * Use this when metrics appear incorrect
 */
export async function POST(request: NextRequest) {
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

    console.log(`🔄 Force syncing all lessons for athlete ${athleteId}`)

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

    console.log(`  👥 Found ${allCoachIds.size} coaches:`, Array.from(allCoachIds))

    // 4. Get current feed data to preserve progress
    const feedRef = adminDb.collection('athlete_feed').doc(athleteId)
    const feedDoc = await feedRef.get()
    const existingData = feedDoc.exists ? feedDoc.data() : {}
    const existingCompletedLessons = existingData?.completedLessons || []
    const existingStartedLessons = existingData?.startedLessons || []
    const existingCompletionDates = existingData?.completionDates || {}

    console.log(`  📊 Preserving: ${existingCompletedLessons.length} completed, ${existingStartedLessons.length} started`)

    // 5. Fetch ALL lessons from ALL coaches
    const allAvailableLessons = new Set<string>()
    const lessonsByCoach: Record<string, string[]> = {}

    for (const coachId of allCoachIds) {
      try {
        const lessonsSnapshot = await adminDb
          .collection('content')
          .where('creatorUid', '==', coachId)
          .where('status', '==', 'published')
          .get()

        const coachLessonIds = lessonsSnapshot.docs.map(doc => doc.id)
        lessonsByCoach[coachId] = coachLessonIds
        coachLessonIds.forEach(lessonId => allAvailableLessons.add(lessonId))
        
        console.log(`  📚 Coach ${coachId}: ${coachLessonIds.length} lessons`)
      } catch (error: any) {
        console.error(`  ❌ Error fetching lessons for coach ${coachId}:`, error.message)
        // Continue with other coaches even if one fails
      }
    }

    const allLessonsArray = Array.from(allAvailableLessons)
    console.log(`  ✅ Total lessons aggregated: ${allLessonsArray.length}`)

    // 6. Update athlete_feed with ALL lessons (preserve progress)
    await adminDb.runTransaction(async (transaction) => {
      const currentFeedDoc = await transaction.get(feedRef)
      
      if (currentFeedDoc.exists) {
        // Preserve existing progress arrays
        const currentData = currentFeedDoc.data()
        const preservedCompletedLessons = currentData?.completedLessons || []
        const preservedStartedLessons = currentData?.startedLessons || []
        const preservedCompletionDates = currentData?.completionDates || {}
        
        // Filter out completed/started lessons that are no longer available
        const validCompletedLessons = preservedCompletedLessons.filter(
          (lessonId: string) => allLessonsArray.includes(lessonId)
        )
        const validStartedLessons = preservedStartedLessons.filter(
          (lessonId: string) => allLessonsArray.includes(lessonId)
        )
        
        // Update availableLessons and totalLessons, preserve valid progress
        transaction.update(feedRef, {
          availableLessons: allLessonsArray,
          totalLessons: allLessonsArray.length,
          completedLessons: validCompletedLessons,
          startedLessons: validStartedLessons,
          completionRate: allLessonsArray.length > 0
            ? Math.round((validCompletedLessons.length / allLessonsArray.length) * 100)
            : 0,
          updatedAt: FieldValue.serverTimestamp()
        })
      } else {
        // Create new feed if it doesn't exist
        transaction.set(feedRef, {
          athleteId,
          availableLessons: allLessonsArray,
          completedLessons: [],
          startedLessons: [],
          completionDates: {},
          totalLessons: allLessonsArray.length,
          completionRate: 0,
          lastActivity: FieldValue.serverTimestamp(),
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp()
        })
      }
    })

    // 7. Calculate final metrics
    const feedDocAfter = await feedRef.get()
    const feedDataAfter = feedDocAfter.exists ? feedDocAfter.data() : {}
    const completedCount = (feedDataAfter?.completedLessons || []).length
    const startedCount = (feedDataAfter?.startedLessons || []).length
    const inProgressCount = startedCount - completedCount

    console.log(`✅ Sync complete: ${completedCount}/${allLessonsArray.length} complete, ${inProgressCount} in progress`)

    return NextResponse.json({
      success: true,
      message: `Successfully synced ${allLessonsArray.length} lessons from ${allCoachIds.size} coaches`,
      progress: {
        totalLessons: allLessonsArray.length,
        completedLessons: completedCount,
        inProgressLessons: Math.max(0, inProgressCount),
        totalCoaches: allCoachIds.size,
        coachIds: Array.from(allCoachIds),
        syncedAt: new Date().toISOString()
      }
    })

  } catch (error: any) {
    console.error('❌ Error syncing all lessons:', {
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

