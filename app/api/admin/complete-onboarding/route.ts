/**
 * API endpoint for completing admin onboarding
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth, adminDb } from '@/lib/firebase.admin'
import { Timestamp } from 'firebase-admin/firestore'

// Force dynamic rendering for API route
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split('Bearer ')[1]
    const decodedToken = await auth.verifyIdToken(token)

    // Parse request body
    const { invitationCode, displayName } = await request.json()

    if (!invitationCode || !displayName) {
      return NextResponse.json(
        { error: 'Missing required fields: invitationCode, displayName' },
        { status: 400 }
      )
    }

    // Find invitation by code
    const invitationsSnapshot = await adminDb
      .collection('admin_invitations')
      .where('code', '==', invitationCode)
      .limit(1)
      .get()

    if (invitationsSnapshot.empty) {
      return NextResponse.json(
        { error: 'Invitation not found' },
        { status: 404 }
      )
    }

    const invitationDoc = invitationsSnapshot.docs[0]
    const invitation = invitationDoc.data()

    // Verify invitation is for this user
    const userRecord = await auth.getUser(decodedToken.uid)
    if (userRecord.email?.toLowerCase() !== invitation.recipientEmail.toLowerCase()) {
      return NextResponse.json(
        { error: 'Invitation email does not match authenticated user' },
        { status: 403 }
      )
    }

    // Check if already used
    if (invitation.status === 'used') {
      return NextResponse.json(
        { error: 'This invitation has already been used' },
        { status: 400 }
      )
    }

    // Check if expired
    const now = Timestamp.now()
    if (invitation.expiresAt && invitation.expiresAt.seconds < now.seconds) {
      return NextResponse.json(
        { error: 'This invitation has expired' },
        { status: 400 }
      )
    }

    // CRITICAL: Delete any existing user document first to ensure clean state
    // This prevents race conditions where useAuth creates a user doc with wrong role
    try {
      await adminDb.collection('users').doc(decodedToken.uid).delete()
      console.log(`🗑️ Deleted existing user document for ${invitation.recipientEmail}`)
    } catch (deleteError) {
      // Document might not exist yet - that's fine
      console.log(`ℹ️ No existing user document to delete for ${invitation.recipientEmail}`)
    }

    // Create user document with admin role (INVITATION CONTROLS EVERYTHING)
    const userData = {
      email: invitation.recipientEmail.toLowerCase(),
      displayName,
      role: invitation.role, // 'admin' or 'superadmin' - INVITATION IS SOURCE OF TRUTH
      onboardedAt: Timestamp.now(),
      invitationCode,
      invitedBy: invitation.createdBy,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      lastLoginAt: Timestamp.now(),
      // CRITICAL: Protect admin roles from auto-correction
      manuallySetRole: true,
      roleProtected: true,
      roleSource: 'admin_invitation',
      invitationRole: invitation.role // Store invitation role for enforcement
    }

    await adminDb.collection('users').doc(decodedToken.uid).set(userData)
    console.log(`✅ Admin user document created with role: ${invitation.role}`)

    // Mark invitation as used
    await invitationDoc.ref.update({
      status: 'used',
      usedAt: Timestamp.now(),
      usedBy: decodedToken.uid
    })

    console.log(`✅ Admin onboarding completed for ${invitation.recipientEmail} (${invitation.role})`)

    return NextResponse.json({
      success: true,
      message: 'Admin onboarding completed successfully',
      data: {
        userId: decodedToken.uid,
        role: invitation.role
      }
    })
  } catch (error: any) {
    console.error('Error completing admin onboarding:', error)
    return NextResponse.json(
      { error: 'Failed to complete admin onboarding', details: error.message },
      { status: 500 }
    )
  }
}
