import { NextRequest, NextResponse } from 'next/server'
import { auth, adminDb } from '@/lib/firebase.admin'

export const runtime = 'nodejs'

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    // Get auth token from request
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized - no token provided' },
        { status: 401 }
      )
    }

    const token = authHeader.split('Bearer ')[1]

    // Verify the token
    let decodedToken
    try {
      decodedToken = await auth.verifyIdToken(token)
    } catch (error) {
      console.error('Token verification failed:', error)
      return NextResponse.json(
        { error: 'Unauthorized - invalid token' },
        { status: 401 }
      )
    }

    const userId = decodedToken.uid
    const slug = params.slug

    // Get the user's role to ensure they're a coach
    const userDoc = await adminDb.collection('users').doc(userId).get()
    const userData = userDoc.data()
    const userRole = userData?.role || userData?.roles?.[0] || 'athlete'

    if (!['coach', 'admin', 'superadmin'].includes(userRole)) {
      return NextResponse.json(
        { error: 'Forbidden - coach access required' },
        { status: 403 }
      )
    }

    // First, try to find the athlete by slug in slug_mappings
    let athleteId = null
    try {
      const slugDoc = await adminDb.collection('slug_mappings').doc(slug).get()
      if (slugDoc.exists) {
        const slugData = slugDoc.data()
        athleteId = slugData?.targetId
        console.log('Found athlete by slug:', slug, '->', athleteId)
      }
    } catch (slugError) {
      console.log('Error looking up slug:', slugError)
    }

    // If no slug mapping found, try to use the slug as a direct ID (fallback)
    if (!athleteId) {
      athleteId = slug
      console.log('Using slug as direct ID:', athleteId)
    }

    // Get athlete data
    const athleteDoc = await adminDb.collection('users').doc(athleteId).get()

    if (!athleteDoc.exists) {
      return NextResponse.json(
        { error: 'Athlete not found' },
        { status: 404 }
      )
    }

    const athleteData = athleteDoc.data()

    // Verify this athlete belongs to this coach
    const coachId = athleteData?.coachId || athleteData?.assignedCoachId || athleteData?.creatorUid
    if (coachId !== userId && !['admin', 'superadmin'].includes(userRole)) {
      return NextResponse.json(
        { error: 'You do not have access to this athlete' },
        { status: 403 }
      )
    }

    // Map profile-style fields so coaches can see what athletes see on their dashboard
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

    // Return athlete profile data
    const athleteProfile = {
      uid: athleteId,
      slug: slug,
      displayName: athleteData?.displayName || athleteData?.firstName || 'Unknown',
      email: athleteData?.email || '',
      sport: athleteData?.sport || 'Not specified',
      level: athleteData?.level || 'Not specified',
      coachId: coachId,
      assignedCoachId: athleteData?.assignedCoachId || coachId,
      profileImageUrl: athleteData?.photoURL || athleteData?.profileImageUrl || null,
      isActive: athleteData?.isActive !== false, // Default to true if not specified
      createdAt: athleteData?.createdAt,
      lastUpdated: athleteData?.updatedAt || athleteData?.createdAt,
      location: mappedLocation,
      bio: mappedBio,
      trainingGoals: mappedTrainingGoals
    }

    console.log('Returning athlete profile for:', athleteProfile.displayName)

    return NextResponse.json({
      success: true,
      data: athleteProfile
    })

  } catch (error: any) {
    console.error('Error fetching athlete by slug:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch athlete',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}