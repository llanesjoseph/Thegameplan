import { NextRequest, NextResponse } from 'next/server'
import { auth, adminDb } from '@/lib/firebase.admin'

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify admin
    const token = authHeader.replace('Bearer ', '')
    const decodedToken = await auth.verifyIdToken(token)
    const adminUser = await adminDb.collection('users').doc(decodedToken.uid).get()
    const role = adminUser.data()?.role

    if (role !== 'admin' && role !== 'superadmin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { invitationId, applicationId } = await request.json()

    if (!invitationId || !applicationId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Get the application
    const applicationDoc = await adminDb.collection('coach_applications').doc(applicationId).get()
    if (!applicationDoc.exists) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }

    const application = applicationDoc.data()
    if (!application) {
      return NextResponse.json({ error: 'Application data not found' }, { status: 404 })
    }

    const now = new Date()

    // Create Firebase Auth account (no password - they'll use Google/Apple/Email)
    let userRecord
    try {
      // Try to get existing user
      try {
        userRecord = await auth.getUserByEmail(application.email.toLowerCase())
        console.log(`ℹ️  User already exists: ${userRecord.uid}`)
      } catch (error: any) {
        if (error.code === 'auth/user-not-found') {
          // Create new user WITHOUT password
          userRecord = await auth.createUser({
            email: application.email.toLowerCase(),
            emailVerified: false,
            displayName: application.displayName || `${application.firstName} ${application.lastName}`,
            disabled: false
            // NO PASSWORD - they'll sign in with Google/Apple/Email provider
          })
          console.log(`✅ Created Firebase user without password: ${userRecord.uid}`)
        } else {
          throw error
        }
      }
    } catch (error) {
      console.error('Error creating user:', error)
      return NextResponse.json({ error: 'Failed to create user account' }, { status: 500 })
    }

    // Create user document
    await adminDb.collection('users').doc(userRecord.uid).set({
      uid: userRecord.uid,
      email: application.email.toLowerCase(),
      displayName: application.displayName || `${application.firstName} ${application.lastName}`,
      firstName: application.firstName,
      lastName: application.lastName,
      phone: application.phone || '',
      role: application.role || 'coach',
      createdAt: now,
      lastLoginAt: now,
      applicationId,
      invitationId,
      manuallySetRole: true,
      roleProtected: true,
      roleSource: 'admin_approval'
    }, { merge: true })

    // Create coach profile
    await adminDb.collection('creator_profiles').doc(userRecord.uid).set({
      uid: userRecord.uid,
      email: application.email.toLowerCase(),
      displayName: application.displayName || `${application.firstName} ${application.lastName}`,
      firstName: application.firstName,
      lastName: application.lastName,
      phone: application.phone || '',
      sport: application.sport || '',
      experience: application.experience || '',
      credentials: application.credentials || '',
      tagline: application.tagline || '',
      philosophy: application.philosophy || '',
      specialties: application.specialties || [],
      achievements: application.achievements || [],
      bio: application.bio || '',
      isActive: true,
      profileCompleteness: 40,
      createdAt: now,
      updatedAt: now
    })

    // Create creators_index entry for discoverability
    await adminDb.collection('creators_index').doc(userRecord.uid).set({
      id: userRecord.uid,
      displayName: application.displayName || `${application.firstName} ${application.lastName}`,
      sport: application.sport || '',
      specialties: application.specialties || [],
      experience: 'coach',
      verified: true,
      featured: false,
      isActive: true,
      createdAt: now,
      updatedAt: now
    })

    // Mark application as approved
    await adminDb.collection('coach_applications').doc(applicationId).update({
      status: 'approved',
      approvedAt: now.toISOString(),
      approvedBy: decodedToken.uid,
      userId: userRecord.uid
    })

    // Mark invitation as used
    await adminDb.collection('invitations').doc(invitationId).update({
      used: true,
      usedAt: now,
      usedBy: userRecord.uid,
      status: 'approved'
    })

    // Send welcome email with sign-in instructions
    try {
      const { Resend } = await import('resend')
      const resend = new Resend(process.env.RESEND_API_KEY)

      await resend.emails.send({
        from: 'AthLeap <noreply@mail.crucibleanalytics.dev>',
        to: application.email.toLowerCase(),
        subject: `Welcome to AthLeap - Your Coach Account is Ready!`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #000000;">Welcome to AthLeap, ${application.firstName}!</h2>
            <p>Your coach application has been approved! 🎉</p>
            <p>You can now sign in to your account using any of these methods:</p>
            <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <ul style="list-style: none; padding: 0;">
                <li style="margin: 10px 0;">✓ Sign in with Google</li>
                <li style="margin: 10px 0;">✓ Sign in with Apple</li>
                <li style="margin: 10px 0;">✓ Sign in with Email/Password</li>
              </ul>
            </div>
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://playbookd.crucibleanalytics.dev"
                 style="background: linear-gradient(to right, #20B2AA, #91A6EB);
                        color: white;
                        padding: 12px 30px;
                        text-decoration: none;
                        border-radius: 8px;
                        display: inline-block;
                        font-weight: 600;">
                Go to Dashboard
              </a>
            </div>
            <p style="color: #666; font-size: 14px;">Use the email address <strong>${application.email}</strong> to sign in.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="color: #999; font-size: 12px;">AthLeap - Empowering Athletes Through Expert Coaching</p>
          </div>
        `
      })

      console.log(`✅ Welcome email sent to ${application.email}`)
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError)
      // Don't fail the whole process
    }

    return NextResponse.json({
      success: true,
      userId: userRecord.uid,
      message: 'Coach approved and account created successfully'
    })

  } catch (error) {
    console.error('Error approving coach invitation:', error)
    return NextResponse.json(
      { error: 'Failed to approve coach invitation' },
      { status: 500 }
    )
  }
}
