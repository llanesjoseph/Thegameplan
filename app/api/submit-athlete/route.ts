import { NextRequest, NextResponse } from 'next/server'
import { nanoid } from 'nanoid'
import { auth, adminDb } from '@/lib/firebase.admin'
import { sendCoachNotificationEmail } from '@/lib/email-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      invitationId,
      athleteData,
      userInfo
    } = body

    // Validate required fields
    if (!invitationId || !userInfo) {
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

    console.log(`🎯 Processing athlete application for ${userInfo.email}`)

    // Generate application ID
    const applicationId = nanoid()
    const now = new Date()

    // Create athlete application data
    const applicationData = {
      id: applicationId,
      invitationId,
      role: 'athlete',
      coachId: invitationData?.coachId || '',
      sport: invitationData?.sport || '',
      // User info
      email: userInfo.email?.toLowerCase(),
      displayName: `${userInfo.firstName} ${userInfo.lastName}`,
      firstName: userInfo.firstName,
      lastName: userInfo.lastName,
      phone: userInfo.phone || '',
      dateOfBirth: athleteData?.dateOfBirth || '',
      // Athletic info
      experience: athleteData?.experience || '',
      goals: athleteData?.goals || '',
      medicalConditions: athleteData?.medicalConditions || '',
      emergencyContact: athleteData?.emergencyContact || '',
      emergencyPhone: athleteData?.emergencyPhone || '',
      // Application metadata
      status: 'approved',
      submittedAt: now,
      submittedVia: 'athlete_invitation',
      createdAt: now,
      updatedAt: now
    }

    // Save application to Firestore
    await adminDb.collection('athlete_applications').doc(applicationId).set(applicationData)
    console.log(`💾 Saved athlete application to Firestore:`, applicationId)

    // Create Firebase user account with temporary password
    let userRecord
    const temporaryPassword = Math.random().toString(36).slice(-12) + 'A1!' // Meets Firebase requirements

    try {
      // Try to create user
      userRecord = await auth.createUser({
        email: userInfo.email?.toLowerCase(),
        emailVerified: false,
        password: temporaryPassword,
        displayName: `${userInfo.firstName} ${userInfo.lastName}`,
        disabled: false
      })
      console.log(`✅ Created Firebase user:`, userRecord.uid)
    } catch (error: any) {
      if (error.code === 'auth/email-already-exists') {
        // User already exists, get their record
        userRecord = await auth.getUserByEmail(userInfo.email?.toLowerCase())
        console.log(`ℹ️ User already exists:`, userRecord.uid)
      } else {
        throw error
      }
    }

    // Create user document in Firestore with athlete role
    const userDocData = {
      uid: userRecord.uid,
      email: userInfo.email?.toLowerCase(),
      displayName: `${userInfo.firstName} ${userInfo.lastName}`,
      role: 'athlete', // CRITICAL: Set athlete role
      firstName: userInfo.firstName,
      lastName: userInfo.lastName,
      phone: userInfo.phone || '',
      createdAt: now,
      lastLoginAt: now,
      applicationId,
      invitationId,
      coachId: invitationData?.coachId || ''
    }

    await adminDb.collection('users').doc(userRecord.uid).set(userDocData, { merge: true })
    console.log(`✅ Created user document with role: athlete`)

    // Create athlete profile
    const athleteProfile = {
      uid: userRecord.uid,
      email: userInfo.email?.toLowerCase(),
      displayName: `${userInfo.firstName} ${userInfo.lastName}`,
      firstName: userInfo.firstName,
      lastName: userInfo.lastName,
      phone: userInfo.phone || '',
      sport: invitationData?.sport || '',
      coachId: invitationData?.coachId || '',
      dateOfBirth: athleteData?.dateOfBirth || '',
      experience: athleteData?.experience || '',
      goals: athleteData?.goals || '',
      medicalConditions: athleteData?.medicalConditions || '',
      emergencyContact: athleteData?.emergencyContact || '',
      emergencyPhone: athleteData?.emergencyPhone || '',
      isActive: true,
      profileCompleteness: 60,
      createdAt: now,
      updatedAt: now
    }

    await adminDb.collection('athlete_profiles').doc(userRecord.uid).set(athleteProfile)
    console.log(`✅ Created athlete profile`)

    // Mark invitation as used
    await adminDb.collection('invitations').doc(invitationId).update({
      used: true,
      status: 'accepted',
      usedAt: now.toISOString(),
      usedBy: userRecord.uid
    })
    console.log(`✅ Marked invitation as used:`, invitationId)

    // Send notification to coach
    if (invitationData?.coachId) {
      try {
        // Get coach information
        const coachDoc = await adminDb.collection('users').doc(invitationData.coachId).get()
        if (coachDoc.exists) {
          const coachData = coachDoc.data()
          const coachEmail = coachData?.email
          let coachName = coachData?.displayName || 'Coach'

          // If no display name, check creator_profiles
          if (coachName === 'Coach') {
            const creatorDoc = await adminDb.collection('creator_profiles').doc(invitationData.coachId).get()
            if (creatorDoc.exists) {
              const creatorData = creatorDoc.data()
              coachName = creatorData?.displayName || 'Coach'
            }
          }

          if (coachEmail) {
            await sendCoachNotificationEmail({
              to: coachEmail,
              coachName,
              type: 'invitation_accepted',
              athleteInfo: {
                name: `${userInfo.firstName} ${userInfo.lastName}`,
                email: userInfo.email,
                sport: invitationData?.sport
              }
            })
            console.log(`📧 Coach notification sent to ${coachEmail} about athlete acceptance`)
          }
        }
      } catch (error) {
        console.error('Failed to send coach notification:', error)
        // Don't fail the request if notification fails
      }
    }

    // Send password reset email so user can set their own password
    try {
      const resetLink = await auth.generatePasswordResetLink(userInfo.email?.toLowerCase())
      console.log(`📧 Password reset link generated for ${userInfo.email}`)
      // TODO: Send this link via email service
    } catch (error) {
      console.error('Failed to generate password reset link:', error)
    }

    return NextResponse.json({
      success: true,
      data: {
        applicationId,
        userId: userRecord.uid,
        status: 'approved',
        role: 'athlete',
        message: 'Your athlete profile has been created! Check your email for instructions to set your password.'
      }
    })

  } catch (error) {
    console.error('Submit athlete application error:', error)
    return NextResponse.json(
      { error: 'Failed to submit athlete application' },
      { status: 500 }
    )
  }
}