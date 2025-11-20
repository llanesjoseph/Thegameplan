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

    return NextResponse.json({
      success: true,
      totalLessons,
      totalAthletes,
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
