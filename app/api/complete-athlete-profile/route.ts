import { NextRequest, NextResponse } from 'next/server'
import { nanoid } from 'nanoid'
import { auth, adminDb } from '@/lib/firebase.admin'
import { sendCoachNotificationEmail, sendAthleteWelcomeEmail } from '@/lib/email-service'

// Force dynamic rendering for API route
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * COMPLETE ATHLETE PROFILE
 * Called after athlete creates their Firebase Auth account
 * Links the profile data to the new account and creates user/athlete documents
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { invitationId, email, coachId: requestCoachId } = body

    if (!invitationId || !email) {
      return NextResponse.json(
        { error: 'Missing required fields: invitationId and email' },
        { status: 400 }
      )
    }

    console.log(`🔗 [COMPLETE-PROFILE] Completing profile for ${email}`)
    console.log(`🔒 [COMPLETE-PROFILE] Coach ID from request: ${requestCoachId || 'NOT PROVIDED'}`)

    // Get the invitation with the stored profile data
    const invitationDoc = await adminDb.collection('invitations').doc(invitationId).get()

    if (!invitationDoc.exists) {
      return NextResponse.json(
        { error: 'Invalid invitation' },
        { status: 400 }
      )
    }

    const invitationData = invitationDoc.data()
    const athleteProfile = invitationData?.athleteProfile

    if (!athleteProfile) {
      return NextResponse.json(
        { error: 'No profile data found. Please complete the onboarding questionnaire first.' },
        { status: 400 }
      )
    }

    // Get the user's Firebase Auth record
    let userRecord
    try {
      userRecord = await auth.getUserByEmail(email.toLowerCase())
      console.log(`✅ [COMPLETE-PROFILE] Found Firebase Auth user: ${userRecord.uid}`)
    } catch (error: any) {
      return NextResponse.json(
        { error: 'No account found. Please create your account first.' },
        { status: 400 }
      )
    }

    const now = new Date()
    const athleteId = nanoid()
    const targetRole = invitationData?.role || 'athlete'

    // 🔒 MULTI-SOURCE COACH UID EXTRACTION with validation
    const invitationCoachUid = invitationData?.creatorUid || invitationData?.coachId || ''
    console.log(`🏃 [COMPLETE-PROFILE] Coach UID from invitation: ${invitationCoachUid}`)

    // Use request coach ID if provided, otherwise fall back to invitation
    let coachUid = requestCoachId || invitationCoachUid

    // 🛡️ BELT AND SUSPENDERS: If both exist, validate they match
    if (requestCoachId && invitationCoachUid && requestCoachId !== invitationCoachUid) {
      console.error(`⚠️ [COMPLETE-PROFILE] WARNING: Coach UID mismatch!`)
      console.error(`   - Request coachId: ${requestCoachId}`)
      console.error(`   - Invitation coachId: ${invitationCoachUid}`)
      console.error(`   - Using invitation coachId for safety`)
      coachUid = invitationCoachUid // Use invitation as source of truth
    }

    console.log(`✅ [COMPLETE-PROFILE] FINAL Coach UID: ${coachUid}`)

    // CRITICAL: Validate coach UID exists - every athlete MUST have a coach
    if (!coachUid || coachUid.trim() === '') {
      console.error(`❌ [COMPLETE-PROFILE] CRITICAL ERROR: No coach UID in invitation ${invitationId}`)
      return NextResponse.json(
        {
          error: 'Critical error: No coach found in invitation. Please contact support.',
          details: 'Invitation is missing creatorUid - athlete cannot be assigned to coach'
        },
        { status: 500 }
      )
    }

    // Create the athlete document
    const athleteData = {
      id: athleteId,
      uid: userRecord.uid,
      invitationId,
      creatorUid: invitationData?.creatorUid || '',
      coachId: coachUid, // Add coach ID to athlete document
      assignedCoachId: coachUid, // Add assigned coach ID to athlete document
      status: 'active',
      createdAt: now,
      updatedAt: now,
      email: athleteProfile.email?.toLowerCase(),
      displayName: athleteProfile.displayName,
      firstName: athleteProfile.firstName,
      lastName: athleteProfile.lastName,
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

    await adminDb.collection('athletes').doc(athleteId).set(athleteData)
    console.log(`✅ [COMPLETE-PROFILE] Created athlete document: ${athleteId} with coach: ${coachUid}`)

    // Check if user document already exists (in case they're also a coach)
    const existingUserDoc = await adminDb.collection('users').doc(userRecord.uid).get()
    const existingUserData = existingUserDoc.data()

    const shouldPreserveRole = existingUserData?.role &&
                               ['creator', 'coach', 'assistant', 'admin', 'superadmin'].includes(existingUserData.role)

    const finalRole = shouldPreserveRole ? existingUserData.role : targetRole

    // Create/update user document
    const userDocData: any = {
      uid: userRecord.uid,
      email: athleteProfile.email?.toLowerCase(),
      displayName: athleteProfile.displayName,
      role: finalRole,
      firstName: athleteProfile.firstName,
      lastName: athleteProfile.lastName,
      athleteId,
      creatorUid: invitationData?.creatorUid || '',
      coachId: coachUid, // Use the coach UID we extracted earlier
      assignedCoachId: coachUid, // Use the coach UID we extracted earlier
      lastLoginAt: now,
      invitationId,
      invitationRole: targetRole,
      invitationType: 'athlete_invitation',
      manuallySetRole: true,
      roleProtected: true,
      roleSource: 'invitation',
      roleLockedByInvitation: true
    }

    if (!existingUserDoc.exists || !existingUserData?.createdAt) {
      userDocData.createdAt = now
    }

    await adminDb.collection('users').doc(userRecord.uid).set(userDocData, { merge: true })
    console.log(`✅ [COMPLETE-PROFILE] Created user document - role: ${finalRole}, coachId: ${coachUid}, assignedCoachId: ${coachUid}`)

    // Mark invitation as used
    await adminDb.collection('invitations').doc(invitationId).update({
      used: true,
      status: 'accepted',
      usedAt: now,
      usedBy: userRecord.uid,
      athleteId
    })
    console.log(`✅ [COMPLETE-PROFILE] Marked invitation as used`)

    // Add athlete to coach's list
    if (invitationData?.creatorUid) {
      const coachRef = adminDb.collection('users').doc(invitationData.creatorUid)
      const coachDoc = await coachRef.get()

      if (coachDoc.exists) {
        const coachData = coachDoc.data()
        const athletesList = coachData?.athletes || []

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
          console.log(`✅ [COMPLETE-PROFILE] Added athlete to coach's list`)
        }

        // Send coach notification
        try {
          const coachEmail = coachData?.email
          let coachName = coachData?.displayName || 'Coach'

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
            console.log(`✅ [COMPLETE-PROFILE] Coach notification sent`)
          }
        } catch (error) {
          console.error('Failed to send coach notification:', error)
        }
      }
    }

    console.log(`✅ [COMPLETE-PROFILE] Profile complete for ${email}`)

    // 🛡️ FINAL VERIFICATION: Confirm coach assignment was successful
    console.log(`🔍 [COMPLETE-PROFILE] FINAL VERIFICATION - Confirming coach assignment...`)
    const verifyAthleteDoc = await adminDb.collection('athletes').doc(athleteId).get()
    const verifyUserDoc = await adminDb.collection('users').doc(userRecord.uid).get()

    const athleteCoach = verifyAthleteDoc.data()?.coachId || verifyAthleteDoc.data()?.assignedCoachId
    const userCoach = verifyUserDoc.data()?.coachId || verifyUserDoc.data()?.assignedCoachId

    if (!athleteCoach || !userCoach) {
      console.error(`❌ [COMPLETE-PROFILE] VERIFICATION FAILED! Coach assignment missing!`)
      console.error(`   - Athlete doc coachId: ${athleteCoach}`)
      console.error(`   - User doc coachId: ${userCoach}`)
      console.error(`   - Expected coachId: ${coachUid}`)

      // EMERGENCY FIX: Try to assign coach one more time
      if (!athleteCoach) {
        await adminDb.collection('athletes').doc(athleteId).update({
          coachId: coachUid,
          assignedCoachId: coachUid,
          updatedAt: new Date()
        })
        console.log(`🔧 [COMPLETE-PROFILE] EMERGENCY: Fixed athlete coach assignment`)
      }

      if (!userCoach) {
        await adminDb.collection('users').doc(userRecord.uid).update({
          coachId: coachUid,
          assignedCoachId: coachUid,
          updatedAt: new Date()
        })
        console.log(`🔧 [COMPLETE-PROFILE] EMERGENCY: Fixed user coach assignment`)
      }
    } else {
      console.log(`✅ [COMPLETE-PROFILE] VERIFICATION PASSED!`)
      console.log(`   - Athlete ${athleteId} has coachId: ${athleteCoach}`)
      console.log(`   - User ${userRecord.uid} has coachId: ${userCoach}`)
    }

    return NextResponse.json({
      success: true,
      data: {
        athleteId,
        userId: userRecord.uid,
        role: finalRole,
        coachId: coachUid,
        message: 'Profile completed successfully!'
      }
    })

  } catch (error: any) {
    console.error('❌ [COMPLETE-PROFILE] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to complete profile' },
      { status: 500 }
    )
  }
}
