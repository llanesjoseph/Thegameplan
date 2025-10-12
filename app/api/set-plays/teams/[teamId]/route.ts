import { NextRequest, NextResponse } from 'next/server'
import { auth, adminDb } from '@/lib/firebase.admin'
import type { Team, TeamUpdateInput, SetPlaysAPIResponse } from '@/types/set-plays'

/**
 * GET /api/set-plays/teams/[teamId]
 * Get a specific team by ID
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

    // Get the team
    const teamDoc = await adminDb.collection('teams').doc(teamId).get()

    if (!teamDoc.exists) {
      return NextResponse.json(
        { success: false, error: 'Team not found' },
        { status: 404 }
      )
    }

    const teamData = teamDoc.data()!

    // Check if user has access to this team (coach, assistant, or athlete)
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

    const team: Team = {
      id: teamDoc.id,
      ...teamData,
      createdAt: teamData.createdAt?.toDate?.()?.toISOString() || null,
      updatedAt: teamData.updatedAt?.toDate?.()?.toISOString() || null,
      archivedAt: teamData.archivedAt?.toDate?.()?.toISOString() || null
    } as Team

    console.log(`✅ Fetched team ${teamId}`)

    const response: SetPlaysAPIResponse<Team> = {
      success: true,
      data: team
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('❌ Error fetching team:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch team' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/set-plays/teams/[teamId]
 * Update a specific team
 */
export async function PUT(
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

    // Get the team
    const teamDoc = await adminDb.collection('teams').doc(teamId).get()

    if (!teamDoc.exists) {
      return NextResponse.json(
        { success: false, error: 'Team not found' },
        { status: 404 }
      )
    }

    const teamData = teamDoc.data()!

    // Only coach can update team
    if (teamData.coachId !== userId) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - only team coach can update team' },
        { status: 403 }
      )
    }

    // Parse request body
    const body: TeamUpdateInput = await request.json()
    const { name, sport, description, logo, athleteIds, assistantIds, isArchived } = body

    // Build update object
    const updates: Partial<Team> = {
      updatedAt: new Date()
    }

    if (name !== undefined) updates.name = name.trim()
    if (sport !== undefined) updates.sport = sport.trim()
    if (description !== undefined) updates.description = description.trim()
    if (logo !== undefined) updates.logo = logo
    if (athleteIds !== undefined) updates.athleteIds = athleteIds
    if (assistantIds !== undefined) updates.assistantIds = assistantIds
    if (isArchived !== undefined) {
      updates.isArchived = isArchived
      if (isArchived) {
        updates.archivedAt = new Date()
      }
    }

    // Update in Firestore
    await adminDb.collection('teams').doc(teamId).update(updates)

    // Fetch updated team
    const updatedTeamDoc = await adminDb.collection('teams').doc(teamId).get()
    const updatedTeamData = updatedTeamDoc.data()!

    const updatedTeam: Team = {
      id: updatedTeamDoc.id,
      ...updatedTeamData,
      createdAt: updatedTeamData.createdAt?.toDate?.()?.toISOString() || null,
      updatedAt: updatedTeamData.updatedAt?.toDate?.()?.toISOString() || null,
      archivedAt: updatedTeamData.archivedAt?.toDate?.()?.toISOString() || null
    } as Team

    console.log(`✅ Updated team ${teamId}`)

    const response: SetPlaysAPIResponse<Team> = {
      success: true,
      data: updatedTeam,
      message: 'Team updated successfully'
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('❌ Error updating team:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update team' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/set-plays/teams/[teamId]
 * Delete (archive) a specific team
 */
export async function DELETE(
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

    // Get the team
    const teamDoc = await adminDb.collection('teams').doc(teamId).get()

    if (!teamDoc.exists) {
      return NextResponse.json(
        { success: false, error: 'Team not found' },
        { status: 404 }
      )
    }

    const teamData = teamDoc.data()!

    // Only coach can delete team
    if (teamData.coachId !== userId) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - only team coach can delete team' },
        { status: 403 }
      )
    }

    // Soft delete - archive the team
    await adminDb.collection('teams').doc(teamId).update({
      isArchived: true,
      archivedAt: new Date(),
      updatedAt: new Date()
    })

    console.log(`✅ Archived team ${teamId}`)

    const response: SetPlaysAPIResponse<{ teamId: string }> = {
      success: true,
      data: { teamId },
      message: 'Team archived successfully'
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('❌ Error deleting team:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete team' },
      { status: 500 }
    )
  }
}
