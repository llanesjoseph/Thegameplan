import { NextRequest, NextResponse } from 'next/server'
import { auth, adminDb } from '@/lib/firebase.admin'

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
      .collection('lessons')
      .where('coachId', '==', uid)
      .get()

    const lessons = lessonsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as any[]

    // 4. Calculate lesson statistics
    const totalLessons = lessons.length
    const totalViews = lessons.reduce((sum, lesson) => sum + (lesson.viewCount || 0), 0)
    const totalCompletions = lessons.reduce((sum, lesson) => sum + (lesson.completionCount || 0), 0)
    const ratingsSum = lessons.reduce((sum, lesson) => sum + (lesson.averageRating || 0), 0)
    const averageRating = totalLessons > 0 ? Number((ratingsSum / totalLessons).toFixed(1)) : 0
    const lessonCompletionRate = totalViews > 0 ? Math.round((totalCompletions / totalViews) * 100) : 0

    // 5. Sort lessons by views to get top performers
    const topLessons = [...lessons]
      .sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
      .slice(0, 5)
      .map(lesson => ({
        id: lesson.id,
        title: lesson.title || 'Untitled Lesson',
        views: lesson.viewCount || 0,
        completions: lesson.completionCount || 0,
        rating: lesson.averageRating || 0
      }))

    // 6. Get coach's athletes
    const athletesSnapshot = await adminDb
      .collection('athletes')
      .where('coachId', '==', uid)
      .get()

    const athletes = athletesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as any[]

    const activeAthletes = athletes.length

    // 7. Calculate athlete activity (mock data for now - would need activity tracking)
    const athleteActivity = athletes.slice(0, 5).map((athlete, index) => ({
      name: athlete.name || athlete.athleteName || 'Unknown Athlete',
      completions: Math.max(0, 8 - index),
      lastActive: index === 0 ? '2 hours ago' : index === 1 ? '5 hours ago' : '1 day ago',
      progress: Math.max(33, 67 - (index * 8))
    }))

    // 8. Build analytics response
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
