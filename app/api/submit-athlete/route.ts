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

    // Generate athlete ID
    const athleteId = nanoid()
    const now = new Date()

    // Create the athlete document with new structure
    const athleteData = {
      // Document metadata
      id: athleteId,
      uid: '', // Will be set after user creation
      invitationId,
      creatorUid: invitationData?.creatorUid || '',
      status: 'active',
      createdAt: now,
      updatedAt: now,

      // Basic info (minimal PII)
      email: athleteProfile.email?.toLowerCase(), // For auth only
      displayName: athleteProfile.displayName,
      firstName: athleteProfile.firstName,
      lastName: athleteProfile.lastName,

      // Athletic profile (training-relevant information)
      athleticProfile: {
        primarySport: athleteProfile.primarySport,
        secondarySports: athleteProfile.secondarySports || [],
        skillLevel: athleteProfile.skillLevel,
        trainingGoals: athleteProfile.trainingGoals,
        achievements: athleteProfile.achievements || '',
        availability: athleteProfile.availability || [],
        learningStyle: athleteProfile.learningStyle,
        specialNotes: athleteProfile.specialNotes || ''
      }
    }

    // Create Firebase user account with temporary password
    let userRecord
    const temporaryPassword = Math.random().toString(36).slice(-12) + 'A1!' // Meets Firebase requirements

    try {
      // Try to create user
      userRecord = await auth.createUser({
        email: athleteProfile.email?.toLowerCase(),
        emailVerified: false,
        password: temporaryPassword,
        displayName: athleteProfile.displayName,
        disabled: false
      })
      console.log(`Created Firebase user: ${userRecord.uid}`)
    } catch (error: any) {
      if (error.code === 'auth/email-already-exists') {
        // User already exists, get their record
        userRecord = await auth.getUserByEmail(athleteProfile.email?.toLowerCase())
        console.log(`User already exists: ${userRecord.uid}`)
      } else {
        throw error
      }
    }

    // Update athlete data with uid
    athleteData.uid = userRecord.uid

    // Save athlete document with new structure
    await adminDb.collection('athletes').doc(athleteId).set(athleteData)
    console.log(`Saved athlete profile to Firestore: ${athleteId}`)

    // Check if user already exists and has a role
    const existingUserDoc = await adminDb.collection('users').doc(userRecord.uid).get()
    const existingUserData = existingUserDoc.data()

    // IMPORTANT: Preserve elevated roles (coach, creator, admin, superadmin)
    // This allows coaches to also be athletes without losing coach permissions
    // Only set to 'athlete' if they're a regular user or don't have a role
    const shouldPreserveRole = existingUserData?.role &&
                               ['creator', 'coach', 'assistant', 'admin', 'superadmin'].includes(existingUserData.role)

    // Create/update user document
    // If user is already a coach/creator/admin, preserve their role but still create athlete profile
    // If user is regular user/athlete, set to athlete
    const finalRole = shouldPreserveRole ? existingUserData.role : targetRole
    const userDocData: any = {
      uid: userRecord.uid,
      email: athleteProfile.email?.toLowerCase(),
      displayName: athleteProfile.displayName,
      role: finalRole,
      firstName: athleteProfile.firstName,
      lastName: athleteProfile.lastName,
      athleteId, // Reference to athlete document
      creatorUid: invitationData?.creatorUid || '',
      // CRITICAL: Set coach assignment fields for analytics and data queries
      coachId: invitationData?.creatorUid || invitationData?.coachId || '',
      assignedCoachId: invitationData?.creatorUid || invitationData?.coachId || '',
      lastLoginAt: now,
      invitationId,
      // BULLETPROOF PROTECTION: Store invitation role as source of truth
      invitationRole: targetRole,
      invitationType: 'athlete_invitation',
      // Multiple layers of protection from auto-corrections
      manuallySetRole: true,
      roleProtected: true,
      roleSource: 'invitation',
      roleLockedByInvitation: true
    }

    console.log(`Setting user role: ${userDocData.role} (existing: ${existingUserData?.role}, shouldPreserve: ${shouldPreserveRole})`)

    // Set createdAt if this is a new user OR if it doesn't exist
    // This ensures all users appear in admin panel queries that order by createdAt
    if (!existingUserDoc.exists || !existingUserData?.createdAt) {
      userDocData.createdAt = now
    }

    await adminDb.collection('users').doc(userRecord.uid).set(userDocData, { merge: true })
    console.log(`Created/updated user document - role: ${userDocData.role} (preserved: ${shouldPreserveRole})`)

    // Mark invitation as used
    await adminDb.collection('invitations').doc(invitationId).update({
      used: true,
      status: 'accepted',
      usedAt: now.toISOString(),
      usedBy: userRecord.uid,
      athleteId
    })
    console.log(`Marked invitation as used: ${invitationId}`)

    // Add athlete to coach's athlete list
    if (invitationData?.creatorUid) {
      // Update coach's athlete list
      const coachRef = adminDb.collection('users').doc(invitationData.creatorUid)
      const coachDoc = await coachRef.get()

      if (coachDoc.exists) {
        const coachData = coachDoc.data()
        const athletesList = coachData?.athletes || []

        // Add new athlete to list if not already there
        if (!athletesList.some((a: any) => a.id === athleteId)) {
          athletesList.push({
            id: athleteId,
            uid: userRecord.uid,
            name: athleteProfile.displayName,
            email: athleteProfile.email,
            sport: athleteProfile.primarySport,
            skillLevel: athleteProfile.skillLevel,
            joinedAt: now
          })

          await coachRef.update({
            athletes: athletesList,
            athleteCount: athletesList.length
          })
          console.log(`Added athlete to coach's list`)
        }
      }

      // Send notification to coach
      try {
        const coachData = coachDoc.data()
        const coachEmail = coachData?.email
        let coachName = coachData?.displayName || 'Coach'

        // If no display name, check creator_profiles
        if (coachName === 'Coach' && invitationData.creatorUid) {
          const creatorDoc = await adminDb.collection('creator_profiles').doc(invitationData.creatorUid).get()
          if (creatorDoc.exists) {
            const creatorData = creatorDoc.data()
            coachName = creatorData?.displayName || 'Coach'
          }
        }

        if (coachEmail) {
          await sendCoachNotificationEmail({
            to: coachEmail,
            coachName,
            type: 'athlete_profile_created',
            athleteInfo: {
              name: athleteProfile.displayName,
              email: athleteProfile.email,
              sport: athleteProfile.primarySport,
              skillLevel: athleteProfile.skillLevel,
              goals: athleteProfile.trainingGoals
            }
          })
          console.log(`Coach notification sent to ${coachEmail} about new athlete profile`)
        }
      } catch (error) {
        console.error('Failed to send coach notification:', error)
        // Don't fail the request if notification fails
      }
    }

    // Send password reset email so user can set their own password
    try {
      const resetLink = await auth.generatePasswordResetLink(athleteProfile.email?.toLowerCase())
      console.log(`Password reset link generated for ${athleteProfile.email}`)

      // Send welcome email with password reset link
      const emailResult = await sendAthleteWelcomeEmail({
        to: athleteProfile.email,
        athleteName: athleteProfile.displayName,
        coachName: invitationData?.coachName || 'Your Coach',
        sport: athleteProfile.primarySport,
        passwordResetLink: resetLink
      })

      if (emailResult.success) {
        console.log(`✅ Welcome email sent to ${athleteProfile.email}`)
      } else {
        console.error(`❌ Failed to send welcome email: ${emailResult.error}`)
      }
    } catch (error) {
      console.error('Failed to generate password reset link:', error)
    }

    return NextResponse.json({
      success: true,
      data: {
        athleteId,
        userId: userRecord.uid,
        status: 'active',
        role: 'athlete',
        message: 'Your athlete profile has been created successfully! Check your email for instructions to set your password.'
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