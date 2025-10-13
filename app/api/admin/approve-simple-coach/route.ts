import { NextRequest, NextResponse } from 'next/server'
import { auth, adminDb } from '@/lib/firebase.admin'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      applicationId,
      email,
      displayName,
      firstName,
      lastName,
      phone,
      role,
      sport,
      experience,
      credentials,
      tagline,
      philosophy,
      specialties,
      achievements,
      references,
      sampleQuestions,
      bio,
      voiceCaptureData,
      invitationId,
      reviewNotes,
      reviewedBy
    } = body

    // Validate required fields
    if (!applicationId || !email || !role) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const now = new Date()
    let userRecord

    // Create Firebase user account with temporary password
    const temporaryPassword = Math.random().toString(36).slice(-12) + 'A1!' // Meets Firebase requirements

    try {
      // Try to create user
      userRecord = await auth.createUser({
        email: email.toLowerCase(),
        emailVerified: false,
        password: temporaryPassword,
        displayName: displayName,
        disabled: false
      })
      console.log(`✅ Created Firebase user:`, userRecord.uid)
    } catch (error: any) {
      if (error.code === 'auth/email-already-exists') {
        // User already exists, get their record
        userRecord = await auth.getUserByEmail(email.toLowerCase())
        console.log(`ℹ️ User already exists:`, userRecord.uid)
      } else {
        throw error
      }
    }

    // Create user document in Firestore with proper role
    const userDocData = {
      uid: userRecord.uid,
      email: email.toLowerCase(),
      displayName: displayName,
      role: role, // CRITICAL: Set the correct role from application
      firstName: firstName,
      lastName: lastName,
      phone: phone || '',
      createdAt: now,
      lastLoginAt: now,
      applicationId,
      invitationId: invitationId,
      // BULLETPROOF PROTECTION: Store invitation role as source of truth
      invitationRole: role,
      invitationType: role === 'coach' ? 'coach_invitation' : 'assistant_invitation',
      // Multiple layers of protection from auto-corrections
      manuallySetRole: true,
      roleProtected: true,
      roleSource: 'admin_approval',
      roleLockedByInvitation: true
    }

    await adminDb.collection('users').doc(userRecord.uid).set(userDocData, { merge: true })
    console.log(`✅ Created user document with role: ${role}`)

    // Create coach or assistant profile
    // FIXED: Coaches should use creator_profiles collection, same as creators
    const profileCollection = (role === 'coach' || role === 'creator') ? 'creator_profiles' : 'creator_profiles'
    const profileData = {
      uid: userRecord.uid,
      email: email.toLowerCase(),
      displayName: displayName,
      firstName: firstName,
      lastName: lastName,
      phone: phone || '',
      sport: sport || '',
      experience: experience || '',
      credentials: credentials || '',
      tagline: tagline || '',
      philosophy: philosophy || '',
      specialties: specialties || [],
      achievements: achievements || [],
      references: references || [],
      sampleQuestions: sampleQuestions || [],
      bio: bio || '',
      voiceCaptureData: voiceCaptureData || null,
      isActive: true,
      profileCompleteness: 40,
      createdAt: now,
      updatedAt: now
    }

    await adminDb.collection(profileCollection).doc(userRecord.uid).set(profileData)
    console.log(`✅ Created ${role} profile in ${profileCollection}`)

    // Create public creator profile for contributors page
    const creatorPublicData = {
      id: userRecord.uid,
      name: displayName,
      firstName: firstName,
      sport: (sport || '').toLowerCase(),
      tagline: tagline || '',
      heroImageUrl: '',
      headshotUrl: '',
      badges: [],
      lessonCount: 0,
      specialties: specialties || [],
      experience: 'coach' as const,
      verified: true,
      featured: false,
      createdAt: now,
      updatedAt: now
    }

    await adminDb.collection('creatorPublic').doc(userRecord.uid).set(creatorPublicData)
    console.log(`✅ Created creatorPublic profile for ${role}`)

    // Update application status
    await adminDb.collection('coach_applications').doc(applicationId).update({
      status: 'approved',
      userId: userRecord.uid,
      reviewedAt: now.toISOString(),
      reviewedBy: reviewedBy,
      reviewNotes: reviewNotes || '',
      updatedAt: now
    })
    console.log(`✅ Updated application status to approved`)

    // Mark invitation as used
    if (invitationId) {
      await adminDb.collection('invitations').doc(invitationId).update({
        used: true,
        usedAt: now.toISOString(),
        usedBy: userRecord.uid
      })
      console.log(`✅ Marked invitation as used:`, invitationId)
    }

    // Send approval email
    try {
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/coach-application/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email,
          name: displayName
        })
      })
      console.log(`📧 Sent approval email to ${email}`)
    } catch (error) {
      console.error('Failed to send approval email:', error)
      // Don't fail the whole operation if email fails
    }

    // Send password reset email so user can set their own password
    try {
      const resetLink = await auth.generatePasswordResetLink(email.toLowerCase())
      console.log(`📧 Password reset link generated for ${email}`)
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
        role: role,
        message: `${role.charAt(0).toUpperCase() + role.slice(1)} application approved successfully!`
      }
    })

  } catch (error) {
    console.error('Approve simple coach application error:', error)
    return NextResponse.json(
      { error: 'Failed to approve coach application' },
      { status: 500 }
    )
  }
}
