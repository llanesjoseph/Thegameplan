import { NextRequest, NextResponse } from 'next/server'
import { nanoid } from 'nanoid'
import { auth, adminDb } from '@/lib/firebase.admin'
import { sendCoachNotificationEmail } from '@/lib/email-service'
import { generateSlug } from '@/lib/slug-utils'

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
    const {
      invitationId,
      email,
      coachId: requestCoachId,
      firstName,
      lastName,
      primarySport,
      secondarySport,
      goals
    } = body

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

    // Support both old flow (athleteProfile in invitation) and new simplified flow (fields in request)
    const athleteProfile = invitationData?.athleteProfile || {
      email: email,
      displayName: `${firstName || ''} ${lastName || ''}`.trim(),
      firstName: firstName || '',
      lastName: lastName || '',
      primarySport: primarySport || '',
      secondarySports: secondarySport ? [secondarySport] : [],
      trainingGoals: goals || [],
      skillLevel: '', // Not collected in new flow
      achievements: '',
      availability: [],
      learningStyle: '',
      specialNotes: ''
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

    console.log(`✅ [COMPLETE-PROFILE] FINAL Coach assigned: ${coachUid || 'NONE (bulk invite)'}`)

    // CRITICAL: Validate coach UID exists - every athlete MUST have a coach
    // EXCEPTION: Bulk invitations can be created without a coach (admin will assign later)
    const isBulkInvitation = invitationData?.type === 'bulk_invitation'

    if (!coachUid || coachUid.trim() === '') {
      if (isBulkInvitation) {
        console.log(`⚠️ [COMPLETE-PROFILE] Bulk invitation has no coach - will be assigned by admin later`)
        coachUid = '' // Set to empty string for now
      } else {
        console.error(`❌ [COMPLETE-PROFILE] CRITICAL ERROR: No coach UID in invitation ${invitationId}`)
        return NextResponse.json(
          {
            error: 'Critical error: No coach found in invitation. Please contact support.',
            details: 'Invitation is missing creatorUid - athlete cannot be assigned to coach'
          },
          { status: 500 }
        )
      }
    }

    // Create the athlete document
    const athleteData = {
      id: athleteId,
      uid: userRecord.uid,
      invitationId,
      creatorUid: invitationData?.creatorUid || '',
      coachId: coachUid || '', // Add coach ID to athlete document (empty for bulk invites)
      assignedCoachId: coachUid || '', // Add assigned coach ID to athlete document (empty for bulk invites)
      needsCoachAssignment: isBulkInvitation && !coachUid, // Flag for admin to assign coach
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
    console.log(`✅ [COMPLETE-PROFILE] Created athlete document: [ATHLETE_ID]`)

    // Generate and store slug mapping for secure URLs
    const displayName = `${athleteProfile.firstName || ''} ${athleteProfile.lastName || ''}`.trim() || athleteProfile.displayName
    const slug = generateSlug(displayName, userRecord.uid)

    try {
      await adminDb.collection('slug_mappings').doc(slug).set({
        slug,
        targetId: userRecord.uid,
        displayName,
        entityType: 'athlete',
        createdAt: now,
        lastUsed: now
      })
      console.log(`✅ [COMPLETE-PROFILE] Created slug mapping: ${slug} -> ${userRecord.uid}`)
    } catch (slugError) {
      console.error('❌ [COMPLETE-PROFILE] Failed to create slug mapping:', slugError)
      // Don't fail the whole request if slug creation fails
    }

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
      coachId: coachUid || '', // Use the coach UID we extracted earlier (empty for bulk invites)
      assignedCoachId: coachUid || '', // Use the coach UID we extracted earlier (empty for bulk invites)
      needsCoachAssignment: isBulkInvitation && !coachUid, // Flag for admin to assign coach
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
    console.log(`✅ [COMPLETE-PROFILE] Created user document - role: ${finalRole}, assignedCoachId: assigned`)

    // CRITICAL: Set custom claims for Firebase Auth so Storage rules work
    try {
      await auth.setCustomUserClaims(userRecord.uid, {
        role: finalRole,
        athleteId: athleteId,
      })
      console.log(`✅ [COMPLETE-PROFILE] Set custom claims - role: ${finalRole}`)
    } catch (error) {
      console.error(`❌ [COMPLETE-PROFILE] Failed to set custom claims:`, error)
      // Don't fail the whole request if custom claims fail - we can fix manually
    }

    // Mark invitation as used
    await adminDb.collection('invitations').doc(invitationId).update({
      used: true,
      status: 'accepted',
      usedAt: now,
      usedBy: userRecord.uid,
      athleteId
    })
    console.log(`✅ [COMPLETE-PROFILE] Marked invitation as used`)

    // Add athlete to coach's list (skip if no coach assigned yet for bulk invites)
    if (invitationData?.creatorUid || coachUid) {
      const assignedCoachUid = invitationData?.creatorUid || coachUid
      const coachRef = adminDb.collection('users').doc(assignedCoachUid)
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
          console.log(`✅ [COMPLETE-PROFILE] Added athlete to coach's athlete list`)
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

        // Note: Athlete welcome email is skipped for Google sign-in flow
        // Athletes get the welcome popup in the dashboard instead
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
      // For bulk invitations without a coach, this is expected
      if (isBulkInvitation && !coachUid) {
        console.log(`⚠️ [COMPLETE-PROFILE] Bulk invitation - no coach assigned yet (admin will assign later)`)
      } else {
        console.error(`❌ [COMPLETE-PROFILE] VERIFICATION FAILED! Coach assignment missing!`)
        console.error(`   - Athlete doc coachId: ${athleteCoach}`)
        console.error(`   - User doc coachId: ${userCoach}`)
        console.error(`   - Expected coachId: ${coachUid}`)

        // EMERGENCY FIX: Try to assign coach one more time
        if (!athleteCoach && coachUid) {
          await adminDb.collection('athletes').doc(athleteId).update({
            coachId: coachUid,
            assignedCoachId: coachUid,
            updatedAt: new Date()
          })
          console.log(`🔧 [COMPLETE-PROFILE] EMERGENCY: Fixed athlete coach assignment`)
        }

        if (!userCoach && coachUid) {
          await adminDb.collection('users').doc(userRecord.uid).update({
            coachId: coachUid,
            assignedCoachId: coachUid,
            updatedAt: new Date()
          })
          console.log(`🔧 [COMPLETE-PROFILE] EMERGENCY: Fixed user coach assignment`)
        }
      }
    } else {
      console.log(`✅ [COMPLETE-PROFILE] VERIFICATION PASSED!`)
      console.log(`   - Athlete has coach assigned`)
      console.log(`   - User has coach assigned`)
    }

    return NextResponse.json({
      success: true,
      data: {
        athleteId,
        userId: userRecord.uid,
        role: finalRole,
        coachId: coachUid || null,
        needsCoachAssignment: isBulkInvitation && !coachUid,
        message: isBulkInvitation && !coachUid
          ? 'Profile completed successfully! An admin will assign you to a coach shortly.'
          : 'Profile completed successfully!'
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
