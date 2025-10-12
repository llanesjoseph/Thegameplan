import { NextRequest, NextResponse } from 'next/server'
import { auth, adminDb } from '@/lib/firebase.admin'
import type { Play, PlayUpdateInput, SetPlaysAPIResponse } from '@/types/set-plays'

/**
 * GET /api/set-plays/plays/[playId]
 * Get a specific play by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { playId: string } }
) {
  try {
    const { playId } = params

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

    // Get the play
    const playDoc = await adminDb.collection('plays').doc(playId).get()

    if (!playDoc.exists) {
      return NextResponse.json(
        { success: false, error: 'Play not found' },
        { status: 404 }
      )
    }

    const playData = playDoc.data()!

    // Get the team to verify access
    const teamDoc = await adminDb.collection('teams').doc(playData.teamId).get()

    if (!teamDoc.exists) {
      return NextResponse.json(
        { success: false, error: 'Team not found' },
        { status: 404 }
      )
    }

    const teamData = teamDoc.data()!

    // Check visibility permissions
    const isCoach = teamData.coachId === userId
    const isAssistant = teamData.assistantIds?.includes(userId)
    const isAthlete = teamData.athleteIds?.includes(userId)

    let hasAccess = false

    if (playData.visibility === 'coach') {
      hasAccess = isCoach
    } else if (playData.visibility === 'assistant') {
      hasAccess = isCoach || isAssistant
    } else if (playData.visibility === 'team') {
      hasAccess = isCoach || isAssistant || isAthlete
    }

    if (!hasAccess) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - you do not have access to this play' },
        { status: 403 }
      )
    }

    // Increment view count (fire and forget)
    adminDb.collection('plays').doc(playId).update({
      views: (playData.views || 0) + 1
    }).catch(err => console.warn('Failed to increment view count:', err))

    const play: Play = {
      id: playDoc.id,
      ...playData,
      createdAt: playData.createdAt?.toDate?.()?.toISOString() || null,
      updatedAt: playData.updatedAt?.toDate?.()?.toISOString() || null
    } as Play

    console.log(`✅ Fetched play ${playId}`)

    const response: SetPlaysAPIResponse<Play> = {
      success: true,
      data: play
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('❌ Error fetching play:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch play' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/set-plays/plays/[playId]
 * Update a specific play
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { playId: string } }
) {
  try {
    const { playId } = params

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

    // Get the play
    const playDoc = await adminDb.collection('plays').doc(playId).get()

    if (!playDoc.exists) {
      return NextResponse.json(
        { success: false, error: 'Play not found' },
        { status: 404 }
      )
    }

    const playData = playDoc.data()!

    // Get the team to verify access
    const teamDoc = await adminDb.collection('teams').doc(playData.teamId).get()

    if (!teamDoc.exists) {
      return NextResponse.json(
        { success: false, error: 'Team not found' },
        { status: 404 }
      )
    }

    const teamData = teamDoc.data()!

    // Only coach and assistants can update plays
    const canUpdate = teamData.coachId === userId || teamData.assistantIds?.includes(userId)

    if (!canUpdate) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - only coaches and assistants can update plays' },
        { status: 403 }
      )
    }

    // Parse request body
    const body: PlayUpdateInput = await request.json()
    const { title, description, notes, tags, visibility, media } = body

    // Build update object
    const updates: Partial<Play> = {
      updatedAt: new Date()
    }

    if (title !== undefined) updates.title = title.trim()
    if (description !== undefined) updates.description = description.trim()
    if (notes !== undefined) updates.notes = notes.trim()
    if (tags !== undefined) updates.tags = tags
    if (visibility !== undefined) updates.visibility = visibility
    if (media !== undefined) updates.media = media

    // Update in Firestore
    await adminDb.collection('plays').doc(playId).update(updates)

    // Fetch updated play
    const updatedPlayDoc = await adminDb.collection('plays').doc(playId).get()
    const updatedPlayData = updatedPlayDoc.data()!

    const updatedPlay: Play = {
      id: updatedPlayDoc.id,
      ...updatedPlayData,
      createdAt: updatedPlayData.createdAt?.toDate?.()?.toISOString() || null,
      updatedAt: updatedPlayData.updatedAt?.toDate?.()?.toISOString() || null
    } as Play

    console.log(`✅ Updated play ${playId}`)

    const response: SetPlaysAPIResponse<Play> = {
      success: true,
      data: updatedPlay,
      message: 'Play updated successfully'
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('❌ Error updating play:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update play' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/set-plays/plays/[playId]
 * Delete a specific play
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { playId: string } }
) {
  try {
    const { playId } = params

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

    // Get the play
    const playDoc = await adminDb.collection('plays').doc(playId).get()

    if (!playDoc.exists) {
      return NextResponse.json(
        { success: false, error: 'Play not found' },
        { status: 404 }
      )
    }

    const playData = playDoc.data()!

    // Get the team to verify access
    const teamDoc = await adminDb.collection('teams').doc(playData.teamId).get()

    if (!teamDoc.exists) {
      return NextResponse.json(
        { success: false, error: 'Team not found' },
        { status: 404 }
      )
    }

    const teamData = teamDoc.data()!

    // Only coach can delete plays
    if (teamData.coachId !== userId) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - only team coach can delete plays' },
        { status: 403 }
      )
    }

    // Delete the play
    await adminDb.collection('plays').doc(playId).delete()

    console.log(`✅ Deleted play ${playId}`)

    const response: SetPlaysAPIResponse<{ playId: string }> = {
      success: true,
      data: { playId },
      message: 'Play deleted successfully'
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('❌ Error deleting play:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete play' },
      { status: 500 }
    )
  }
}
