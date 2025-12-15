import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase.admin'

export const runtime = 'nodejs'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const coachId = params.id

    if (!coachId) {
      return NextResponse.json(
        { error: 'Coach ID is required' },
        { status: 400 }
      )
    }

    // Get lesson count
    const lessonsSnapshot = await adminDb
      .collection('content')
      .where('creatorUid', '==', coachId)
      .where('status', '==', 'published')
      .get()

    const totalLessons = lessonsSnapshot.size

    // Get athlete count - use assignedCoachId (most reliable field)
    let totalAthletes = 0
    try {
      const athletesSnapshot = await adminDb
        .collection('users')
        .where('assignedCoachId', '==', coachId)
        .get()

      totalAthletes = athletesSnapshot.size
      console.log(`Found ${totalAthletes} athletes for coach ${coachId}`)
    } catch (error) {
      console.error('Error querying athletes:', error)
      totalAthletes = 0
    }

    // Get all published lessons
    const recentLessonsSnapshot = await adminDb
      .collection('content')
      .where('creatorUid', '==', coachId)
      .where('status', '==', 'published')
      .orderBy('createdAt', 'desc')
      .get()

    const lessons = recentLessonsSnapshot.docs.map(doc => ({
      id: doc.id,
      title: doc.data().title || 'Untitled Lesson',
      description: doc.data().description,
      sport: doc.data().sport,
      level: doc.data().level,
      status: doc.data().status,
      createdAt: doc.data().createdAt,
      videoUrl: doc.data().videoUrl,
      thumbnailUrl: doc.data().thumbnailUrl
    }))

    // VITAL: Calculate real-time lesson completion stats from athlete feeds
    let totalLessonsCompleted = 0
    let totalHoursWatched = 0
    let totalSessions = 0
    
    try {
      // Get all athletes assigned to this coach
      const athletesSnapshot = await adminDb
        .collection('users')
        .where('assignedCoachId', '==', coachId)
        .where('role', '==', 'athlete')
        .get()

      // Aggregate completion data from athlete feeds
      const athleteIds = athletesSnapshot.docs.map(doc => doc.id)
      
      for (const athleteId of athleteIds) {
        try {
          const feedDoc = await adminDb.collection('athlete_feed').doc(athleteId).get()
          if (feedDoc.exists) {
            const feedData = feedDoc.data()
            const completedLessons = feedData?.completedLessons || []
            totalLessonsCompleted += completedLessons.length
            
            // Get completion rate from feed
            const completionRate = feedData?.completionRate || 0
            // Estimate hours watched (if available in feed)
            const watchTime = feedData?.totalWatchTime || 0
            totalHoursWatched += watchTime / 3600 // Convert seconds to hours
          }
        } catch (feedError) {
          console.warn(`Error reading feed for athlete ${athleteId}:`, feedError)
        }
      }

      // Count coaching sessions
      try {
        const sessionsSnapshot = await adminDb
          .collection('sessions')
          .where('creatorUid', '==', coachId)
          .get()
        totalSessions = sessionsSnapshot.size
      } catch (sessionsError) {
        console.warn('Error counting sessions:', sessionsError)
      }

    } catch (statsError) {
      console.warn('Error calculating completion stats:', statsError)
      // Don't fail the request, just log the error
    }

    return NextResponse.json({
      success: true,
      totalLessons,
      totalAthletes,
      totalLessonsCompleted, // VITAL: Real-time completion count
      totalHoursWatched: Math.round(totalHoursWatched * 10) / 10, // Round to 1 decimal
      totalSessions, // Real-time session count
      lessons
    })

  } catch (error) {
    console.error('Error fetching coach stats:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorStack = error instanceof Error ? error.stack : ''

    return NextResponse.json(
      {
        error: 'Failed to fetch coach stats',
        details: errorMessage,
        stack: process.env.NODE_ENV === 'development' ? errorStack : undefined,
        coachId: params.id
      },
      { status: 500 }
    )
  }
}
