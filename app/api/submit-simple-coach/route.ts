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

    // Update invitation status to show it's been completed (ready for admin approval)
    await adminDb.collection('invitations').doc(ingestionId).update({
      status: 'completed', // Changed from 'pending' to 'completed'
      completedAt: now,
      applicationId
    })

    // IMPORTANT: Don't create Firebase account here
    // Let admin approve first, then coach can sign in with Google/Apple/Email
    // This prevents the "can't login" issue

    // Only create user account and profiles if auto-approve is enabled
    let userRecord = null
    const shouldAutoApprove = false // DISABLED: Always require admin approval

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

        // Import Resend dynamically
        const { Resend } = await import('resend')
        const resend = new Resend(process.env.RESEND_API_KEY)

        // Send welcome email with password setup link
        await resend.emails.send({
          from: 'AthLeap <noreply@mail.crucibleanalytics.dev>',
          to: userInfo.email?.toLowerCase(),
          subject: `Welcome to AthLeap - Set Your Password`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #000000;">Welcome to AthLeap, ${userInfo.firstName}!</h2>
              <p>Your ${targetRole} account has been created successfully.</p>
              <p>To complete your setup and access your dashboard, please set your password by clicking the button below:</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetLink}"
                   style="background: linear-gradient(to right, #20B2AA, #91A6EB);
                          color: white;
                          padding: 12px 30px;
                          text-decoration: none;
                          border-radius: 8px;
                          display: inline-block;
                          font-weight: 600;">
                  Set Your Password
                </a>
              </div>
              <p style="color: #666; font-size: 14px;">This link will expire in 1 hour.</p>
              <p style="color: #666; font-size: 14px;">If you didn't request this, please ignore this email.</p>
              <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
              <p style="color: #999; font-size: 12px;">AthLeap - Empowering Athletes Through Expert Coaching</p>
            </div>
          `
        })

        console.log(`✅ Password setup email sent to ${userInfo.email}`)
      } catch (error) {
        console.error('Failed to send password setup email:', error)
        // Don't fail the whole process if email fails
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