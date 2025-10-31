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

    // Get athlete count - check both coachId and assignedCoachId fields
    const [athletesByCoachId, athletesByAssignedCoachId] = await Promise.all([
      adminDb
        .collection('users')
        .where('coachId', '==', coachId)
        .get(),
      adminDb
        .collection('users')
        .where('assignedCoachId', '==', coachId)
        .get()
    ])

    // Use Set to deduplicate athletes who might have both fields set
    const athleteIds = new Set([
      ...athletesByCoachId.docs.map(doc => doc.id),
      ...athletesByAssignedCoachId.docs.map(doc => doc.id)
    ])

    const totalAthletes = athleteIds.size

    // Get recent lessons (up to 6)
    const recentLessonsSnapshot = await adminDb
      .collection('content')
      .where('creatorUid', '==', coachId)
      .where('status', '==', 'published')
      .orderBy('createdAt', 'desc')
      .limit(6)
      .get()

    const lessons = recentLessonsSnapshot.docs.map(doc => ({
      id: doc.id,
      title: doc.data().title || 'Untitled Lesson',
      description: doc.data().description,
      sport: doc.data().sport,
      level: doc.data().level,
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
    return NextResponse.json(
      { error: 'Failed to fetch coach stats' },
      { status: 500 }
    )
  }
}
