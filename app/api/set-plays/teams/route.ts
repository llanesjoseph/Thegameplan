import { NextRequest, NextResponse } from 'next/server'
import { auth, adminDb } from '@/lib/firebase.admin'
import type { Team, TeamCreateInput, SetPlaysAPIResponse, TeamListResponse } from '@/types/set-plays'

/**
 * GET /api/set-plays/teams
 * List all teams for the authenticated coach
 */
export async function GET(request: NextRequest) {
  try {
    // Get auth token from request
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - no token provided' },
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
        { success: false, error: 'Unauthorized - invalid token' },
        { status: 401 }
      )
    }

    const userId = decodedToken.uid

    // Get the user's role to ensure they're a coach
    const userDoc = await adminDb.collection('users').doc(userId).get()
    const userData = userDoc.data()
    const userRole = userData?.role || userData?.roles?.[0] || 'athlete'

    if (!['coach', 'admin', 'superadmin'].includes(userRole)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - coach access required' },
        { status: 403 }
      )
    }

    // Query teams where user is the coach or assistant
    const coachTeamsSnapshot = await adminDb
      .collection('teams')
      .where('coachId', '==', userId)
      .where('isArchived', '==', false)
      .orderBy('createdAt', 'desc')
      .get()

    const assistantTeamsSnapshot = await adminDb
      .collection('teams')
      .where('assistantIds', 'array-contains', userId)
      .where('isArchived', '==', false)
      .orderBy('createdAt', 'desc')
      .get()

    // Combine and deduplicate teams
    const teamMap = new Map()

    coachTeamsSnapshot.docs.forEach(doc => {
      teamMap.set(doc.id, {
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || null,
        updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || null,
        archivedAt: doc.data().archivedAt?.toDate?.()?.toISOString() || null
      })
    })

    assistantTeamsSnapshot.docs.forEach(doc => {
      if (!teamMap.has(doc.id)) {
        teamMap.set(doc.id, {
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || null,
          updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || null,
          archivedAt: doc.data().archivedAt?.toDate?.()?.toISOString() || null
        })
      }
    })

    const teams = Array.from(teamMap.values())

    console.log(`✅ Fetched ${teams.length} teams for user ${userId}`)

    const response: SetPlaysAPIResponse<TeamListResponse> = {
      success: true,
      data: {
        teams,
        count: teams.length
      }
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('❌ Error fetching teams:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch teams' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/set-plays/teams
 * Create a new team
 */
export async function POST(request: NextRequest) {
  try {
    // Get auth token from request
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - no token provided' },
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
        { success: false, error: 'Unauthorized - invalid token' },
        { status: 401 }
      )
    }

    const userId = decodedToken.uid

    // Get the user's role to ensure they're a coach
    const userDoc = await adminDb.collection('users').doc(userId).get()
    const userData = userDoc.data()
    const userRole = userData?.role || userData?.roles?.[0] || 'athlete'

    if (!['coach', 'admin', 'superadmin'].includes(userRole)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - coach access required' },
        { status: 403 }
      )
    }

    // Parse request body
    const body: TeamCreateInput = await request.json()
    const { name, sport, description, logo, athleteIds = [], assistantIds = [] } = body

    // Validate required fields
    if (!name || !sport) {
      return NextResponse.json(
        { success: false, error: 'Team name and sport are required' },
        { status: 400 }
      )
    }

    // Create team object
    const newTeam: Omit<Team, 'id'> = {
      name: name.trim(),
      sport: sport.trim(),
      description: description?.trim() || '',
      logo: logo || '',
      coachId: userId,
      assistantIds: assistantIds || [],
      athleteIds: athleteIds || [],
      isArchived: false,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    // Save to Firestore
    const teamRef = await adminDb.collection('teams').add(newTeam)

    const createdTeam: Team = {
      id: teamRef.id,
      ...newTeam,
      createdAt: newTeam.createdAt,
      updatedAt: newTeam.updatedAt
    }

    console.log(`✅ Created team ${teamRef.id} for coach ${userId}`)

    const response: SetPlaysAPIResponse<Team> = {
      success: true,
      data: createdTeam,
      message: 'Team created successfully'
    }

    return NextResponse.json(response, { status: 201 })

  } catch (error) {
    console.error('❌ Error creating team:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create team' },
      { status: 500 }
    )
  }
}
