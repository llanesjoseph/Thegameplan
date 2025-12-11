import { NextRequest, NextResponse } from 'next/server'
import { auth, adminDb } from '@/lib/firebase.admin'
import type { Play, PlayCreateInput, SetPlaysAPIResponse, PlayListResponse } from '@/types/set-plays'

// Force dynamic rendering for API route
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * GET /api/set-plays/teams/[teamId]/plays
 * List all plays for a specific team
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { teamId: string } }
) {
  try {
    const { teamId } = params

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

    // Get the team to verify access
    const teamDoc = await adminDb.collection('teams').doc(teamId).get()

    if (!teamDoc.exists) {
      return NextResponse.json(
        { success: false, error: 'Team not found' },
        { status: 404 }
      )
    }

    const teamData = teamDoc.data()!

    // Check if user has access to this team
    const hasAccess =
      teamData.coachId === userId ||
      teamData.assistantIds?.includes(userId) ||
      teamData.athleteIds?.includes(userId)

    if (!hasAccess) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - you do not have access to this team' },
        { status: 403 }
      )
    }

    // Query plays for this team
    const playsSnapshot = await adminDb
      .collection('plays')
      .where('teamId', '==', teamId)
      .orderBy('createdAt', 'desc')
      .get()

    const plays = playsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || null,
      updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || null
    }))

    console.log(`✅ Fetched ${plays.length} plays for team ${teamId}`)

    const response: SetPlaysAPIResponse<PlayListResponse> = {
      success: true,
      data: {
        plays: plays as Play[],
        count: plays.length
      }
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('❌ Error fetching plays:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch plays' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/set-plays/teams/[teamId]/plays
 * Create a new play for a team
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { teamId: string } }
) {
  try {
    const { teamId } = params

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

    // Get the team to verify access
    const teamDoc = await adminDb.collection('teams').doc(teamId).get()

    if (!teamDoc.exists) {
      return NextResponse.json(
        { success: false, error: 'Team not found' },
        { status: 404 }
      )
    }

    const teamData = teamDoc.data()!

    // Only coach and assistants can create plays
    const canCreate = teamData.coachId === userId || teamData.assistantIds?.includes(userId)

    if (!canCreate) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - only coaches and assistants can create plays' },
        { status: 403 }
      )
    }

    // Parse request body
    const body: PlayCreateInput = await request.json()
    const { title, description, notes, tags = [], visibility = 'team', media = [] } = body

    // Validate required fields
    if (!title || !title.trim()) {
      return NextResponse.json(
        { success: false, error: 'Play title is required' },
        { status: 400 }
      )
    }

    // Create play object
    const newPlay: Omit<Play, 'id'> = {
      teamId,
      title: title.trim(),
      description: description?.trim() || '',
      notes: notes?.trim() || '',
      tags: tags || [],
      visibility: visibility || 'team',
      media: media || [],
      createdBy: userId,
      views: 0,
      completions: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    // Save to Firestore
    const playRef = await adminDb.collection('plays').add(newPlay)

    const createdPlay: Play = {
      id: playRef.id,
      ...newPlay,
      createdAt: newPlay.createdAt,
      updatedAt: newPlay.updatedAt
    }

    console.log(`✅ Created play ${playRef.id} for team ${teamId}`)

    const response: SetPlaysAPIResponse<Play> = {
      success: true,
      data: createdPlay,
      message: 'Play created successfully'
    }

    return NextResponse.json(response, { status: 201 })

  } catch (error) {
    console.error('❌ Error creating play:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create play' },
      { status: 500 }
    )
  }
}
