import { NextRequest, NextResponse } from 'next/server'
import { nanoid } from 'nanoid'
import { auth, adminDb } from '@/lib/firebase.admin'

// Admin notification function
async function notifyAdminsOfNewApplication(data: {
  applicationId: string
  applicantName: string
  applicantEmail: string
  role: string
  sport: string
  submittedAt: Date
}) {
  try {
    // Get all admin and superadmin users
    const adminsSnapshot = await adminDb.collection('users')
      .where('role', 'in', ['admin', 'superadmin'])
      .get()

    if (adminsSnapshot.empty) {
      console.log('⚠️ No admins found to notify')
      return
    }

    const adminEmails = adminsSnapshot.docs
      .map(doc => doc.data().email)
      .filter(email => email && typeof email === 'string')

    if (adminEmails.length === 0) {
      console.log('⚠️ No admin emails found')
      return
    }

    console.log(`📧 Notifying ${adminEmails.length} admins about new ${data.role} application`)

    // Import Resend
    const { Resend } = await import('resend')
    const resend = new Resend(process.env.RESEND_API_KEY)

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://playbookd.crucibleanalytics.dev'
    const reviewUrl = `${baseUrl}/dashboard/admin/invitations-approvals?tab=applications`

    // Send email to each admin
    const emailPromises = adminEmails.map(adminEmail =>
      resend.emails.send({
        from: 'AthLeap Notifications <noreply@mail.crucibleanalytics.dev>',
        to: adminEmail,
        subject: `🔔 New ${data.role.charAt(0).toUpperCase() + data.role.slice(1)} Application - ${data.applicantName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(to right, #20B2AA, #91A6EB); padding: 20px; border-radius: 8px 8px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 24px;">New Application Submitted</h1>
            </div>

            <div style="background: #f9f9f9; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 8px 8px;">
              <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
                A new <strong>${data.role}</strong> has submitted an application and is awaiting your review.
              </p>

              <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #20B2AA;">
                <h2 style="margin: 0 0 15px 0; color: #000; font-size: 18px;">Application Details</h2>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #666; font-weight: 600;">Name:</td>
                    <td style="padding: 8px 0; color: #000;">${data.applicantName}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #666; font-weight: 600;">Email:</td>
                    <td style="padding: 8px 0; color: #000;">${data.applicantEmail}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #666; font-weight: 600;">Role:</td>
                    <td style="padding: 8px 0; color: #000;">${data.role.charAt(0).toUpperCase() + data.role.slice(1)}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #666; font-weight: 600;">Sport:</td>
                    <td style="padding: 8px 0; color: #000;">${data.sport}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #666; font-weight: 600;">Submitted:</td>
                    <td style="padding: 8px 0; color: #000;">${data.submittedAt.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}</td>
                  </tr>
                </table>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${reviewUrl}"
                   style="background: linear-gradient(to right, #20B2AA, #91A6EB);
                          color: white;
                          padding: 14px 32px;
                          text-decoration: none;
                          border-radius: 8px;
                          display: inline-block;
                          font-weight: 600;
                          font-size: 16px;
                          box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                  Review Application
                </a>
              </div>

              <div style="background: #fff3cd; border: 1px solid #ffc107; border-radius: 8px; padding: 15px; margin-top: 20px;">
                <p style="margin: 0; color: #856404; font-size: 14px;">
                  ⏰ <strong>Action Required:</strong> Please review and approve/reject this application as soon as possible.
                  The applicant is waiting to get started!
                </p>
              </div>
            </div>

            <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
              <p style="margin: 0;">AthLeap Admin Notifications</p>
              <p style="margin: 5px 0 0 0;">This is an automated notification for platform administrators</p>
            </div>
          </div>
        `
      })
    )

    await Promise.all(emailPromises)
    console.log(`✅ Successfully notified ${adminEmails.length} admins`)
  } catch (error) {
    console.error('❌ Error notifying admins:', error)
    throw error
  }
}

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
    console.log(`🎯 Storing ${targetRole} profile for ${userInfo.email}`)

    const now = new Date()

    // Combine user info and coach data into complete profile
    const coachProfile = {
      // User info
      email: userInfo.email?.toLowerCase(),
      displayName: userInfo.displayName || `${userInfo.firstName} ${userInfo.lastName}`,
      firstName: userInfo.firstName,
      lastName: userInfo.lastName,
      phone: userInfo.phone || '',
      // Coach profile data
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
      voiceCaptureData: coachData.voiceCaptureData || null
    }

    // Store profile temporarily in the invitation document
    // The account will be created during the authentication step
    await adminDb.collection('invitations').doc(ingestionId).update({
      coachProfile: coachProfile,
      profileSubmittedAt: now,
      status: 'profile_submitted'
    })
    console.log(`✅ Saved ${targetRole} profile to invitation: ${ingestionId}`)

    console.log(`✅ Profile submitted successfully - ready for authentication step`)

    return NextResponse.json({
      success: true,
      data: {
        invitationId: ingestionId,
        email: userInfo.email,
        displayName: coachProfile.displayName,
        role: targetRole,
        message: `Profile submitted successfully! Please complete the authentication step to create your ${targetRole} account.`
      }
    })

    // OLD CODE BELOW - Everything below this comment is removed
    // We no longer create applications, send notifications, or create user accounts here
    // That all happens in the complete-coach-profile API after auth creation

    if (false) { // Keep old code for reference but never execute
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
        // BULLETPROOF PROTECTION: Store invitation role as source of truth
        invitationRole: targetRole,
        invitationType: targetRole === 'coach' ? 'coach_invitation' : 'assistant_invitation',
        // Multiple layers of protection from auto-corrections
        manuallySetRole: true,
        roleProtected: true,
        roleSource: 'invitation',
        roleLockedByInvitation: true
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