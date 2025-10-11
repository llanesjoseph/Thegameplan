import { NextRequest, NextResponse } from 'next/server'
import { nanoid } from 'nanoid'
import { auth, adminDb } from '@/lib/firebase.admin'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      ingestionId,
      coachData,
      userInfo
    } = body

    // Validate required fields
    if (!ingestionId || !coachData || !userInfo) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate that this is a simple invitation
    if (!ingestionId.startsWith('inv_')) {
      return NextResponse.json(
        { error: 'Invalid simple invitation ID' },
        { status: 400 }
      )
    }

    // Get the invitation from Firestore
    const invitationDoc = await adminDb.collection('invitations').doc(ingestionId).get()

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

    // Get the target role from the invitation
    const targetRole = invitationData?.role || 'coach'
    console.log(`🎯 Processing ${targetRole} application for ${userInfo.email}`)

    // Generate application ID
    const applicationId = nanoid()
    const now = new Date()

    // Create a simplified coach/assistant application data structure
    const applicationData = {
      id: applicationId,
      invitationId: ingestionId,
      invitationType: 'simple',
      role: targetRole, // Store the target role
      // Invitation context
      organizationName: invitationData?.organizationName || 'PLAYBOOKD',
      inviterName: invitationData?.inviterName || 'PLAYBOOKD Team',
      sport: invitationData?.sport || coachData.sport,
      autoApprove: invitationData?.autoApprove || false, // Respect invitation settings
      // User info
      email: userInfo.email?.toLowerCase(),
      displayName: userInfo.displayName || `${userInfo.firstName} ${userInfo.lastName}`,
      firstName: userInfo.firstName,
      lastName: userInfo.lastName,
      phone: userInfo.phone || '',
      // Coach profile data
      experience: coachData.experience || '',
      credentials: coachData.credentials || '',
      tagline: coachData.tagline || '',
      philosophy: coachData.philosophy || '',
      specialties: coachData.specialties || [],
      achievements: coachData.achievements || [],
      references: coachData.references || [],
      sampleQuestions: coachData.sampleQuestions || [],
      bio: coachData.bio || '',
      voiceCaptureData: coachData.voiceCaptureData || null,
      // Application metadata
      status: invitationData?.autoApprove ? 'approved' : 'pending',
      submittedAt: now,
      submittedVia: 'simple_invitation',
      source: 'simple_coach_invitation',
      createdAt: now,
      updatedAt: now
    }

    // Save application to Firestore
    await adminDb.collection('coach_applications').doc(applicationId).set(applicationData)
    console.log(`💾 Saved ${targetRole} application to Firestore:`, applicationId)

    // Only create user account and profiles if auto-approve is enabled
    let userRecord = null
    const shouldAutoApprove = invitationData?.autoApprove === true

    if (shouldAutoApprove) {
      // Create Firebase user account with temporary password
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

      // Create user document in Firestore with proper role
      const userDocData = {
        uid: userRecord.uid,
        email: userInfo.email?.toLowerCase(),
        displayName: `${userInfo.firstName} ${userInfo.lastName}`,
        role: targetRole, // CRITICAL: Set the correct role from invitation
        firstName: userInfo.firstName,
        lastName: userInfo.lastName,
        phone: userInfo.phone || '',
        createdAt: now,
        lastLoginAt: now,
        applicationId,
        invitationId: ingestionId,
        // CRITICAL: Protect role from auto-corrections (role comes from invitation)
        manuallySetRole: true,
        roleProtected: true,
        roleSource: 'invitation'
      }

      await adminDb.collection('users').doc(userRecord.uid).set(userDocData, { merge: true })
      console.log(`✅ Created user document with role: ${targetRole}`)

      // Create coach or assistant profile
      // FIXED: Coaches should use creator_profiles collection, same as creators
      const profileCollection = (targetRole === 'coach' || targetRole === 'creator') ? 'creator_profiles' : 'creator_profiles'
      const profileData = {
        uid: userRecord.uid,
        email: userInfo.email?.toLowerCase(),
        displayName: `${userInfo.firstName} ${userInfo.lastName}`,
        firstName: userInfo.firstName,
        lastName: userInfo.lastName,
        phone: userInfo.phone || '',
        sport: coachData.sport || invitationData?.sport || '',
        experience: coachData.experience || '',
        credentials: coachData.credentials || '',
        tagline: coachData.tagline || '',
        philosophy: coachData.philosophy || '',
        specialties: coachData.specialties || [],
        achievements: coachData.achievements || [],
        references: coachData.references || [],
        sampleQuestions: coachData.sampleQuestions || [],
        bio: coachData.bio || '',
        voiceCaptureData: coachData.voiceCaptureData || null,
        isActive: true,
        profileCompleteness: 40,
        createdAt: now,
        updatedAt: now
      }

      await adminDb.collection(profileCollection).doc(userRecord.uid).set(profileData)
      console.log(`✅ Created ${targetRole} profile in ${profileCollection}`)

      // Create public creator profile for contributors page
      const creatorPublicData = {
        id: userRecord.uid,
        name: `${userInfo.firstName} ${userInfo.lastName}`,
        firstName: userInfo.firstName,
        sport: (coachData.sport || invitationData?.sport || '').toLowerCase(),
        tagline: coachData.tagline || '',
        heroImageUrl: '',
        headshotUrl: '',
        badges: [],
        lessonCount: 0,
        specialties: coachData.specialties || [],
        experience: 'coach' as const,
        verified: true,
        featured: false,
        createdAt: now,
        updatedAt: now
      }

      await adminDb.collection('creatorPublic').doc(userRecord.uid).set(creatorPublicData)
      console.log(`✅ Created creatorPublic profile for ${targetRole}`)

      // Mark invitation as used
      await adminDb.collection('invitations').doc(ingestionId).update({
        used: true,
        usedAt: now.toISOString(),
        usedBy: userRecord.uid
      })
      console.log(`✅ Marked invitation as used:`, ingestionId)

      // Send password reset email so user can set their own password
      try {
        const resetLink = await auth.generatePasswordResetLink(userInfo.email?.toLowerCase())
        console.log(`📧 Password reset link generated for ${userInfo.email}`)
        // TODO: Send this link via email
      } catch (error) {
        console.error('Failed to generate password reset link:', error)
      }

      return NextResponse.json({
        success: true,
        data: {
          applicationId,
          userId: userRecord.uid,
          status: 'approved',
          role: targetRole,
          autoApproved: true,
          organizationName: invitationData?.organizationName || 'PLAYBOOKD',
          message: `Your ${targetRole} application has been automatically approved! Check your email for instructions to set your password.`
        }
      })
    } else {
      // Application submitted for manual review
      return NextResponse.json({
        success: true,
        data: {
          applicationId,
          status: 'pending',
          role: targetRole,
          autoApproved: false,
          organizationName: invitationData?.organizationName || 'PLAYBOOKD',
          message: `Your ${targetRole} application has been submitted successfully! You will receive an email when it has been reviewed.`
        }
      })
    }

  } catch (error) {
    console.error('Submit simple coach application error:', error)
    return NextResponse.json(
      { error: 'Failed to submit coach application' },
      { status: 500 }
    )
  }
}