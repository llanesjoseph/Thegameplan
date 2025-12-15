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
    console.log(`  👥 Coach IDs:`, Array.from(allCoachIds))
    console.log(`  📋 Assigned coach: ${assignedCoachId || 'none'}`)
    console.log(`  📋 Followed coaches: ${followedCoachIds.length}`)

    // 4. Fetch athlete feed for completion tracking (after sync)
    const feedDoc = await adminDb.collection('athlete_feed').doc(athleteId).get()
    const feedData = feedDoc.exists ? feedDoc.data() : {}
    const completedLessons = new Set<string>(feedData?.completedLessons || [])
    const startedLessons = new Set<string>(feedData?.startedLessons || [])
    
    console.log(`  ✅ Feed data: ${completedLessons.size} completed, ${startedLessons.size} started`)

    // 5. Aggregate ALL lessons from ALL coaches - CRITICAL: Fetch directly from each coach
    // NO TIER FILTERING - All athletes see all lessons from their coaches regardless of tier
    const allAvailableLessons = new Set<string>()
    const lessonsByCoach: Record<string, string[]> = {}
    let totalLessonsFetched = 0

    // Fetch directly from ALL coaches to ensure we have EVERYTHING
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
        totalLessonsFetched += coachLessonIds.length
        
        console.log(`  📚 Coach ${coachId}: ${coachLessonIds.length} published lessons`)
        if (coachLessonIds.length > 0) {
          console.log(`     Lesson IDs: ${coachLessonIds.slice(0, 5).join(', ')}${coachLessonIds.length > 5 ? '...' : ''}`)
        }
      } catch (error: any) {
        console.error(`❌ Error fetching lessons for coach ${coachId}:`, error.message)
        // Continue with other coaches even if one fails
      }
    }
    
    console.log(`  📊 Total lessons fetched from all coaches: ${totalLessonsFetched}`)

    // Also check athlete_feed for any lessons that might have been added manually
    const feedAvailableLessons = feedData?.availableLessons || feedData?.lessons || []
    feedAvailableLessons.forEach((lessonId: string) => allAvailableLessons.add(lessonId))

    // 6. CRITICAL: Update athlete_feed with ALL lessons from ALL coaches
    // This ensures the feed is always in sync with all followed coaches
    const allLessonsArray = Array.from(allAvailableLessons)
    const currentFeedLessons = Array.from(new Set(feedAvailableLessons))
    
    // Check if sync is needed (different length or missing lessons)
    const needsSync = currentFeedLessons.length !== allLessonsArray.length ||
      !allLessonsArray.every(lessonId => currentFeedLessons.includes(lessonId))
    
    if (needsSync || allCoachIds.size > 0) {
      console.log(`🔄 Syncing athlete_feed: ${currentFeedLessons.length} -> ${allLessonsArray.length} lessons from ${allCoachIds.size} coaches`)
      
      // Use transaction to ensure atomic update
      await adminDb.runTransaction(async (transaction) => {
        const feedRef = adminDb.collection('athlete_feed').doc(athleteId)
        const currentFeedDoc = await transaction.get(feedRef)
        
        if (currentFeedDoc.exists) {
          // Preserve existing progress arrays
          const existingData = currentFeedDoc.data()
          const existingCompletedLessons = existingData?.completedLessons || []
          const existingStartedLessons = existingData?.startedLessons || []
          const existingCompletionDates = existingData?.completionDates || {}
          
          // Update only availableLessons and totalLessons, preserve progress
          transaction.update(feedRef, {
            availableLessons: allLessonsArray,
            totalLessons: allLessonsArray.length,
            completionRate: allLessonsArray.length > 0
              ? Math.round((existingCompletedLessons.length / allLessonsArray.length) * 100)
              : 0,
            updatedAt: FieldValue.serverTimestamp()
            // Note: completedLessons, startedLessons, and completionDates are preserved automatically
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
      
      console.log(`✅ Synced ${allLessonsArray.length} lessons to athlete_feed`)
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
    console.log(`  📈 Completion rate: ${completionRate}%`)
    console.log(`  📋 Breakdown: ${completedCount} complete, ${inProgressCount} in progress, ${totalLessons - completedCount - inProgressCount} not started`)
    console.log(`  📚 Lessons by coach:`, Object.entries(lessonsByCoach).map(([coachId, lessons]) => `${coachId}: ${lessons.length}`).join(', '))
    console.log(`  🔢 Total unique lessons: ${allAvailableLessons.size}`)

    return NextResponse.json({
      success: true,
      progress: {
        totalLessons,
        completedLessons: completedCount,
        inProgressLessons: inProgressCount,
        completionRate,
        totalCoaches: allCoachIds.size,
        coachIds: Array.from(allCoachIds),
        lastActivity: feedData?.lastActivity?.toDate?.()?.toISOString() || null,
        syncedAt: new Date().toISOString()
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

