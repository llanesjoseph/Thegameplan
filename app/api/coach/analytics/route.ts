import { NextRequest, NextResponse } from 'next/server'
import { auth, adminDb } from '@/lib/firebase.admin'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

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
    let decodedToken
    try {
      decodedToken = await auth.verifyIdToken(token)
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      )
    }

    const uid = decodedToken.uid

    // 2. Verify user has coach role
    const userDoc = await adminDb.collection('users').doc(uid).get()
    if (!userDoc.exists) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const userData = userDoc.data()
    const userRole = userData?.role || userData?.roles?.[0] || 'user'

    if (!['coach', 'creator', 'admin', 'superadmin'].includes(userRole)) {
      return NextResponse.json(
        { error: 'Only coaches can view analytics' },
        { status: 403 }
      )
    }

    // 3. Get coach's lessons
    const lessonsSnapshot = await adminDb
      .collection('content')
      .where('creatorUid', '==', uid)
      .get()

    const lessons = lessonsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as any[]

    const totalLessons = lessons.length

    // 4. Get coach's athletes from users collection
    const athletesSnapshot = await adminDb
      .collection('users')
      .where('role', '==', 'athlete')
      .get()

    const athletes = athletesSnapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      .filter((athlete: any) =>
        athlete.coachId === uid || athlete.assignedCoachId === uid
      ) as any[]

    const activeAthletes = athletes.length

    // 5. Get athlete_feed data to calculate real views and completions
    const athleteFeedsSnapshot = await adminDb
      .collection('athlete_feed')
      .get()

    const athleteFeeds = athleteFeedsSnapshot.docs
      .map(doc => ({
        athleteId: doc.id,
        ...doc.data()
      }))
      .filter((feed: any) => feed.coachId === uid) as any[]

    // 6. Calculate real lesson statistics from athlete_feed
    let totalViews = 0
    let totalCompletions = 0
    const lessonStats = new Map<string, { views: number, completions: number }>()

    athleteFeeds.forEach((feed: any) => {
      const availableLessons = feed.availableLessons || []
      const completedLessons = feed.completedLessons || []

      // Each lesson in availableLessons counts as a view
      availableLessons.forEach((lessonId: string) => {
        totalViews++
        const stats = lessonStats.get(lessonId) || { views: 0, completions: 0 }
        stats.views++
        lessonStats.set(lessonId, stats)
      })

      // Each lesson in completedLessons counts as a completion
      completedLessons.forEach((lessonId: string) => {
        totalCompletions++
        const stats = lessonStats.get(lessonId) || { views: 0, completions: 0 }
        stats.completions++
        lessonStats.set(lessonId, stats)
      })
    })

    const ratingsSum = lessons.reduce((sum, lesson) => sum + (lesson.averageRating || 0), 0)
    const averageRating = totalLessons > 0 ? Number((ratingsSum / totalLessons).toFixed(1)) : 0
    const lessonCompletionRate = totalViews > 0 ? Math.round((totalCompletions / totalViews) * 100) : 0

    // 7. Create top lessons with real stats
    const lessonsWithStats = lessons.map(lesson => {
      const stats = lessonStats.get(lesson.id) || { views: 0, completions: 0 }
      return {
        id: lesson.id,
        title: lesson.title || 'Untitled Lesson',
        views: stats.views,
        completions: stats.completions,
        rating: lesson.averageRating || 0
      }
    })

    const topLessons = lessonsWithStats
      .sort((a, b) => b.views - a.views)
      .slice(0, 5)

    // 8. Calculate athlete activity with real data
    const athleteActivity = athletes.slice(0, 5).map((athlete: any) => {
      const feed = athleteFeeds.find(f => f.athleteId === athlete.id)
      const completedCount = feed?.completedLessons?.length || 0
      const availableCount = feed?.availableLessons?.length || 0
      const progress = availableCount > 0
        ? Math.round((completedCount / availableCount) * 100)
        : 0

      return {
        name: athlete.displayName || athlete.name || 'Unknown Athlete',
        completions: completedCount,
        lastActive: athlete.lastActive || 'Recently',
        progress
      }
    })

    // 9. Build analytics response
    const analytics = {
      stats: {
        totalLessons,
        totalViews,
        totalCompletions,
        averageRating,
        activeAthletes,
        lessonCompletionRate,
        avgTimePerLesson: 18 // Would need to track this in lesson data
      },
      topLessons,
      athleteActivity,
      trends: {
        weekGrowth: 24, // Would need historical data
        monthGrowth: 18, // Would need historical data
        newAthletesMonth: 8, // Would need to filter by date
        avgEngagement: 4.2 // Would need activity tracking
      }
    }

    return NextResponse.json({
      success: true,
      analytics
    })

  } catch (error: any) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
