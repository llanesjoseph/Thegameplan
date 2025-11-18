import { NextRequest, NextResponse } from 'next/server'
import { auth, adminDb } from '@/lib/firebase.admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { athleteId: string } }
) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      )
    }

    const token = authHeader.split('Bearer ')[1]

    // Verify coach/admin token
    const decodedToken = await auth.verifyIdToken(token)
    const requesterId = decodedToken.uid

    const athleteId = params.athleteId

    // Fetch requester role
    const requesterDoc = await adminDb.collection('users').doc(requesterId).get()
    const requesterData = requesterDoc.data()
    const requesterRole = requesterData?.role || requesterData?.roles?.[0] || 'athlete'

    if (!['coach', 'admin', 'superadmin'].includes(requesterRole)) {
      return NextResponse.json(
        { error: 'Forbidden - coach or admin access required' },
        { status: 403 }
      )
    }

    // Verify athlete exists and belongs to this coach (unless admin)
    const athleteDoc = await adminDb.collection('users').doc(athleteId).get()
    if (!athleteDoc.exists) {
      return NextResponse.json({ error: 'Athlete not found' }, { status: 404 })
    }

    const athleteData = athleteDoc.data()
    const coachId = athleteData?.coachId || athleteData?.assignedCoachId || athleteData?.creatorUid

    if (coachId !== requesterId && !['admin', 'superadmin'].includes(requesterRole)) {
      return NextResponse.json(
        { error: 'You do not have access to this athlete' },
        { status: 403 }
      )
    }

    // Fetch athlete feed for progress data
    const feedDoc = await adminDb.collection('athlete_feed').doc(athleteId).get()

    if (!feedDoc.exists) {
      return NextResponse.json({
        success: true,
        progress: {
          totalLessons: 0,
          completedLessons: 0,
          completionRate: 0,
          inProgressLessons: 0,
          upcomingEvents: 0
        }
      })
    }

    const feedData = feedDoc.data()
    const totalLessons = feedData?.totalLessons || 0
    const completedLessons = (feedData?.completedLessons || []).length
    const completionRate = feedData?.completionRate || 0
    const inProgressLessons = Math.max(0, totalLessons - completedLessons)

    // Fetch upcoming events count for this coach
    let upcomingEvents = 0
    if (coachId) {
      const now = new Date()
      const eventsSnap = await adminDb
        .collection('coach_schedule')
        .where('coachId', '==', coachId)
        .get()

      upcomingEvents = eventsSnap.docs
        .map(doc => doc.data()?.eventDate?.toDate?.() as Date | undefined)
        .filter((date): date is Date => !!date && date >= now).length
    }

    return NextResponse.json({
      success: true,
      progress: {
        totalLessons,
        completedLessons,
        completionRate,
        inProgressLessons,
        upcomingEvents
      }
    })
  } catch (error: any) {
    console.error('Error fetching athlete progress for coach:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch athlete progress',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}


