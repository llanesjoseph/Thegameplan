import { NextRequest, NextResponse } from 'next/server'
import { nanoid } from 'nanoid'
import { auth, adminDb } from '@/lib/firebase.admin'
import { syncCoachToPublicProfile } from '@/lib/sync-coach-to-public-profile'
import { ensureCoachVisibility } from '@/lib/ensure-coach-visibility'

// Force dynamic rendering for API route
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * COMPLETE COACH PROFILE
 * Called after coach creates their Firebase Auth account
 * Links the profile data to the new account and creates user/coach documents
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { invitationId, email } = body

    if (!invitationId || !email) {
      return NextResponse.json(
        { error: 'Missing required fields: invitationId and email' },
        { status: 400 }
      )
    }

    console.log(`🔗 [COMPLETE-COACH-PROFILE] Completing profile for ${email}`)

    // Get the invitation with the stored profile data
    const invitationDoc = await adminDb.collection('invitations').doc(invitationId).get()

    if (!invitationDoc.exists) {
      return NextResponse.json(
        { error: 'Invalid invitation' },
        { status: 400 }
      )
    }

    const invitationData = invitationDoc.data()
    const coachProfile = invitationData?.coachProfile

    if (!coachProfile) {
      return NextResponse.json(
        { error: 'No profile data found. Please complete the onboarding questionnaire first.' },
        { status: 400 }
      )
    }

    // Get the user's Firebase Auth record
    let userRecord
    try {
      userRecord = await auth.getUserByEmail(email.toLowerCase())
      console.log(`✅ [COMPLETE-COACH-PROFILE] Found Firebase Auth user: ${userRecord.uid}`)
    } catch (error: any) {
      return NextResponse.json(
        { error: 'No account found. Please create your account first.' },
        { status: 400 }
      )
    }

    const now = new Date()
    const targetRole = invitationData?.role || 'coach'

    // Check if user document already exists (in case they have multiple roles)
    const existingUserDoc = await adminDb.collection('users').doc(userRecord.uid).get()
    const existingUserData = existingUserDoc.data()

    // Preserve higher-level roles if they exist
    const shouldPreserveRole = existingUserData?.role &&
                               ['superadmin', 'admin'].includes(existingUserData.role)

    const finalRole = shouldPreserveRole ? existingUserData.role : targetRole

    // Process voice capture data into voice traits for AI
    let voiceTraits: string[] = []
    if (coachProfile.voiceCaptureData) {
      const vcData = coachProfile.voiceCaptureData
      // Extract key traits from voice capture data
      if (vcData.communicationStyle) voiceTraits.push(vcData.communicationStyle)
      if (vcData.motivationApproach) voiceTraits.push(vcData.motivationApproach)
      if (vcData.catchphrases && Array.isArray(vcData.catchphrases)) {
        voiceTraits = voiceTraits.concat(vcData.catchphrases)
      }
      if (vcData.personalityTraits && Array.isArray(vcData.personalityTraits)) {
        voiceTraits = voiceTraits.concat(vcData.personalityTraits)
      }
      console.log(`✅ [COMPLETE-COACH-PROFILE] Processed ${voiceTraits.length} voice traits for AI`)
    }

    // Create/update user document
    const userDocData: any = {
      uid: userRecord.uid,
      email: coachProfile.email?.toLowerCase(),
      displayName: coachProfile.displayName,
      role: finalRole,
      firstName: coachProfile.firstName,
      lastName: coachProfile.lastName,
      phone: coachProfile.phone || '',
      location: coachProfile.location || '',
      sport: coachProfile.sport || '',  // Add sport to user document for AI
      lastLoginAt: now,
      invitationId,
      invitationRole: targetRole,
      invitationType: targetRole === 'coach' ? 'coach_invitation' : 'assistant_invitation',
      manuallySetRole: true,
      roleProtected: true,
      roleSource: 'invitation',
      roleLockedByInvitation: true,
      voiceTraits: voiceTraits,  // Add processed voice traits for AI (legacy support)
      voiceCaptureData: coachProfile.voiceCaptureData || null,  // CRITICAL: Store full voice capture data for AI
      voiceCaptureCompleteness: coachProfile.voiceCaptureCompleteness || 'none'
    }

    if (!existingUserDoc.exists || !existingUserData?.createdAt) {
      userDocData.createdAt = now
    }

    await adminDb.collection('users').doc(userRecord.uid).set(userDocData, { merge: true })
    console.log(`✅ [COMPLETE-COACH-PROFILE] Created user document - role: ${finalRole}`)

    // Set custom claims for role
    await auth.setCustomUserClaims(userRecord.uid, {
      role: finalRole,
      [finalRole]: true
    })
    console.log(`✅ [COMPLETE-COACH-PROFILE] Set custom claims: { role: '${finalRole}', ${finalRole}: true }`)

    // Create coach/creator profile in creator_profiles collection
    const profileData = {
      uid: userRecord.uid,
      email: coachProfile.email?.toLowerCase(),
      displayName: coachProfile.displayName,
      firstName: coachProfile.firstName,
      lastName: coachProfile.lastName,
      phone: coachProfile.phone || '',
      location: coachProfile.location || '',
      sport: coachProfile.sport || '',
      experience: coachProfile.experience || '',
      credentials: coachProfile.credentials || '',
      tagline: coachProfile.tagline || '',
      philosophy: coachProfile.philosophy || '',
      specialties: coachProfile.specialties || [],
      achievements: coachProfile.achievements || [],
      references: coachProfile.references || [],
      sampleQuestions: coachProfile.sampleQuestions || [],
      bio: coachProfile.bio || '',
      voiceCaptureData: coachProfile.voiceCaptureData || null,
      voiceCaptureCompleteness: coachProfile.voiceCaptureCompleteness || 'none',
      isActive: true,
      profileCompleteness: 60,
      createdAt: now,
      updatedAt: now
    }

    await adminDb.collection('creator_profiles').doc(userRecord.uid).set(profileData, { merge: true })
    console.log(`✅ [COMPLETE-COACH-PROFILE] Created creator profile`)

    // Create public creator profile for contributors page
    const creatorPublicData = {
      id: userRecord.uid,
      name: coachProfile.displayName,
      firstName: coachProfile.firstName,
      sport: (coachProfile.sport || '').toLowerCase(),
      tagline: coachProfile.tagline || '',
      heroImageUrl: '',
      headshotUrl: '',
      badges: [],
      lessonCount: 0,
      specialties: coachProfile.specialties || [],
      experience: 'coach' as const,
      verified: true,
      featured: false,
      createdAt: now,
      updatedAt: now
    }

    await adminDb.collection('creatorPublic').doc(userRecord.uid).set(creatorPublicData, { merge: true })
    console.log(`✅ [COMPLETE-COACH-PROFILE] Created creatorPublic profile`)

    // IRONCLAD: Ensure coach is visible in Browse Coaches
    try {
      const visibilityResult = await ensureCoachVisibility({
        uid: userRecord.uid,
        email: coachProfile.email?.toLowerCase() || '',
        displayName: coachProfile.displayName,
        firstName: coachProfile.firstName,
        lastName: coachProfile.lastName,
        sport: coachProfile.sport || '',
        tagline: coachProfile.tagline || '',
        bio: coachProfile.bio || '',
        specialties: coachProfile.specialties || [],
        achievements: coachProfile.achievements || [],
        experience: coachProfile.experience || '',
        credentials: coachProfile.credentials || '',
        isActive: true,
        profileComplete: true,
        status: 'approved',
        verified: true,
        featured: false
      })
      
      if (visibilityResult.success) {
        console.log(`✅ [COMPLETE-COACH-PROFILE] IRONCLAD: Coach is now visible in Browse Coaches`)
      } else {
        console.error(`❌ [COMPLETE-COACH-PROFILE] IRONCLAD FAILED:`, visibilityResult.message)
        // Don't fail the entire process, but log the issue
      }
    } catch (visibilityError) {
      console.error(`❌ [COMPLETE-COACH-PROFILE] IRONCLAD ERROR:`, visibilityError)
    }

    // Mark invitation as used
    await adminDb.collection('invitations').doc(invitationId).update({
      used: true,
      status: 'accepted',
      usedAt: now,
      usedBy: userRecord.uid
    })
    console.log(`✅ [COMPLETE-COACH-PROFILE] Marked invitation as used`)

    console.log(`✅ [COMPLETE-COACH-PROFILE] Profile complete for ${email}`)

    return NextResponse.json({
      success: true,
      data: {
        userId: userRecord.uid,
        role: finalRole,
        message: 'Profile completed successfully!'
      }
    })

  } catch (error: any) {
    console.error('❌ [COMPLETE-COACH-PROFILE] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to complete profile' },
      { status: 500 }
    )
  }
}
