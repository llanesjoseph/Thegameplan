import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-utils'
import { adminDb as db } from '@/lib/firebase.admin'

// Force dynamic rendering for API route
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    // Require admin or superadmin role
    const authResult = await requireAuth(request, ['admin', 'superadmin'])

    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const body = await request.json()
    const { athleteEmail } = body

    if (!athleteEmail) {
      return NextResponse.json(
        { error: 'athleteEmail is required' },
        { status: 400 }
      )
    }

    console.log(`🔧 [FIX-SINGLE-ATHLETE] Fixing coach assignment for: ${athleteEmail}`)

    // Find athlete by email
    const athletesSnapshot = await db
      .collection('athletes')
      .where('email', '==', athleteEmail.toLowerCase())
      .limit(1)
      .get()

    if (athletesSnapshot.empty) {
      return NextResponse.json(
        { error: `No athlete found with email: ${athleteEmail}` },
        { status: 404 }
      )
    }

    const athleteDoc = athletesSnapshot.docs[0]
    const athleteData = athleteDoc.data()
    const athleteId = athleteDoc.id

    // Check if already has coach
    if (athleteData.coachId || athleteData.assignedCoachId) {
      return NextResponse.json({
        success: true,
        message: 'Athlete already has coach assigned',
        data: {
          athleteEmail,
          coachId: athleteData.coachId || athleteData.assignedCoachId,
          alreadyAssigned: true
        }
      })
    }

    // Get invitation ID
    const invitationId = athleteData.invitationId

    if (!invitationId) {
      return NextResponse.json(
        { error: 'Athlete has no invitation ID' },
        { status: 400 }
      )
    }

    // Get invitation to find coach
    const invitationDoc = await db.collection('invitations').doc(invitationId).get()

    if (!invitationDoc.exists) {
      return NextResponse.json(
        { error: `Invitation ${invitationId} not found` },
        { status: 404 }
      )
    }

    const invitationData = invitationDoc.data()
    const coachUid = invitationData?.creatorUid || invitationData?.coachId

    if (!coachUid) {
      return NextResponse.json(
        { error: 'No coach UID found in invitation' },
        { status: 400 }
      )
    }

    // Update athlete document
    await db.collection('athletes').doc(athleteId).update({
      coachId: coachUid,
      assignedCoachId: coachUid,
      updatedAt: new Date()
    })

    console.log(`✅ Updated athlete document for ${athleteEmail}`)

    // Update user document
    const userUid = athleteData.uid

    if (userUid) {
      await db.collection('users').doc(userUid).update({
        coachId: coachUid,
        assignedCoachId: coachUid,
        updatedAt: new Date()
      })

      console.log(`✅ Updated user document for ${athleteEmail}`)
    }

    // Get coach name for response
    const coachDoc = await db.collection('users').doc(coachUid).get()
    const coachName = coachDoc.exists ? coachDoc.data()?.displayName || coachDoc.data()?.email : 'Unknown Coach'

    console.log(`🎯 Successfully fixed coach assignment for ${athleteEmail} -> ${coachName}`)

    return NextResponse.json({
      success: true,
      message: `Coach successfully assigned to ${athleteEmail}`,
      data: {
        athleteEmail,
        coachUid,
        coachName,
        athleteId,
        userUid
      }
    })

  } catch (error) {
    console.error('Fix single athlete coach assignment error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to fix coach assignment'
    return NextResponse.json(
      {
        error: errorMessage,
        details: error instanceof Error ? error.stack : String(error)
      },
      { status: 500 }
    )
  }
}
