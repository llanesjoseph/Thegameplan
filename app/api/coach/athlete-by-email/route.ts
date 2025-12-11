import { NextRequest, NextResponse } from 'next/server'
import { auth, adminDb } from '@/lib/firebase.admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized - no token provided' }, { status: 401 })
    }

    const token = authHeader.split('Bearer ')[1]

    // Verify the token
    const decodedToken = await auth.verifyIdToken(token)
    const requestingUserId = decodedToken.uid

    // Get requester role
    const requesterDoc = await adminDb.collection('users').doc(requestingUserId).get()
    const requesterData = requesterDoc.data()
    const requesterRole = requesterData?.role || requesterData?.roles?.[0] || 'athlete'

    if (!['coach', 'admin', 'superadmin'].includes(requesterRole)) {
      return NextResponse.json(
        { error: 'Forbidden - coach or admin access required' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')

    if (!email) {
      return NextResponse.json({ error: 'Missing email query parameter' }, { status: 400 })
    }

    // Look up athlete by email in users collection
    const emailLower = email.toLowerCase()
    const athleteQuery = await adminDb
      .collection('users')
      .where('email', '==', emailLower)
      .limit(1)
      .get()

    if (athleteQuery.empty) {
      return NextResponse.json({ error: 'Athlete not found for this email' }, { status: 404 })
    }

    const athleteDoc = athleteQuery.docs[0]
    const athleteId = athleteDoc.id
    const athleteData = athleteDoc.data()

    // Verify this athlete belongs to this coach (or requester is admin)
    const coachId = athleteData?.coachId || athleteData?.assignedCoachId || athleteData?.creatorUid
    if (coachId !== requestingUserId && !['admin', 'superadmin'].includes(requesterRole)) {
      return NextResponse.json(
        { error: 'You do not have access to this athlete' },
        { status: 403 }
      )
    }

    // Map profile-style fields similar to /api/secure-athlete/[slug]
    const mappedLocation =
      (athleteData?.location as string) ||
      [athleteData?.city, athleteData?.state].filter(Boolean).join(', ') ||
      ''

    const mappedBio =
      (athleteData?.bio as string) ||
      (athleteData?.about as string) ||
      ''

    const mappedTrainingGoals =
      (Array.isArray(athleteData?.trainingGoals)
        ? athleteData.trainingGoals.join(', ')
        : (athleteData?.trainingGoals as string)) ||
      (Array.isArray(athleteData?.goals)
        ? athleteData.goals.join(', ')
        : (athleteData?.goals as string)) ||
      ''

    const athleteProfile = {
      uid: athleteId,
      displayName: athleteData?.displayName || athleteData?.firstName || 'Unknown',
      email: athleteData?.email || '',
      sport: athleteData?.sport || 'Not specified',
      level: athleteData?.level || 'Not specified',
      coachId,
      assignedCoachId: athleteData?.assignedCoachId || coachId,
      profileImageUrl: athleteData?.photoURL || athleteData?.profileImageUrl || null,
      location: mappedLocation,
      bio: mappedBio,
      trainingGoals: mappedTrainingGoals
    }

    return NextResponse.json({
      success: true,
      data: athleteProfile
    })
  } catch (error: any) {
    console.error('Error fetching athlete by email:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch athlete by email',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}


