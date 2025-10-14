import { NextRequest, NextResponse } from 'next/server'
import { nanoid } from 'nanoid'
import { auth, adminDb } from '@/lib/firebase.admin'
import { sendCoachNotificationEmail, sendAthleteWelcomeEmail } from '@/lib/email-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      invitationId,
      athleteProfile
    } = body

    // Validate required fields
    if (!invitationId || !athleteProfile) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get the invitation from Firestore
    const invitationDoc = await adminDb.collection('invitations').doc(invitationId).get()

    if (!invitationDoc.exists) {
      return NextResponse.json(
        { error: 'Invalid or expired invitation' },
        { status: 400 }
      )
    }

    const invitationData = invitationDoc.data()

    if (invitationData?.used) {
      return NextResponse.json(
        { error: 'This invitation has already been used' },
        { status: 400 }
      )
    }

    // Verify this is an athlete invitation
    const targetRole = invitationData?.role || 'athlete'
    if (targetRole !== 'athlete') {
      return NextResponse.json(
        { error: 'Invalid invitation type for athlete onboarding' },
        { status: 400 }
      )
    }

    console.log(`Processing athlete profile for ${athleteProfile.email}`)

    const now = new Date()

    // Store profile temporarily in the invitation document
    // The account will be created during the authentication step
    await adminDb.collection('invitations').doc(invitationId).update({
      athleteProfile: athleteProfile,
      profileSubmittedAt: now,
      status: 'profile_submitted'
    })
    console.log(`Saved athlete profile to invitation: ${invitationId}`)

    console.log(`Profile submitted successfully - ready for authentication step`)

    return NextResponse.json({
      success: true,
      data: {
        invitationId,
        email: athleteProfile.email,
        displayName: athleteProfile.displayName,
        message: 'Profile submitted successfully! Please complete the authentication step to create your account.'
      }
    })

  } catch (error) {
    console.error('Submit athlete profile error:', error)
    return NextResponse.json(
      { error: 'Failed to create athlete profile' },
      { status: 500 }
    )
  }
}