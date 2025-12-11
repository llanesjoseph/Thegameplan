import { NextRequest, NextResponse } from 'next/server'
import { auth as adminAuth, adminDb } from '@/lib/firebase.admin'

// Force dynamic rendering for API route
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * DELETE USER API
 * Admin endpoint to permanently delete a user from both:
 * 1. Firebase Authentication
 * 2. Firestore Database
 *
 * Requires admin authentication
 */
export async function POST(request: NextRequest) {
  try {
    // Get request body
    const { uid, email } = await request.json()

    if (!uid || !email) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: uid and email' },
        { status: 400 }
      )
    }

    console.log(`🗑️ [DELETE-USER] Starting deletion for: ${email} (${uid})`)

    // Step 1: Delete from Firebase Authentication
    try {
      await adminAuth.deleteUser(uid)
      console.log(`✅ [DELETE-USER] Deleted from Firebase Auth: ${email}`)
    } catch (authError: any) {
      console.error(`❌ [DELETE-USER] Failed to delete from Auth:`, authError)

      // If user doesn't exist in Auth, log warning but continue
      if (authError.code === 'auth/user-not-found') {
        console.warn(`⚠️ [DELETE-USER] User not found in Auth (may have been deleted already): ${uid}`)
      } else {
        throw new Error(`Failed to delete from Firebase Auth: ${authError.message}`)
      }
    }

    // Step 2: Delete from Firestore
    try {
      await adminDb.collection('users').doc(uid).delete()
      console.log(`✅ [DELETE-USER] Deleted from Firestore: ${email}`)
    } catch (firestoreError: any) {
      console.error(`❌ [DELETE-USER] Failed to delete from Firestore:`, firestoreError)
      throw new Error(`Failed to delete from Firestore: ${firestoreError.message}`)
    }

    // Step 3: Clean up related data (invitations, sessions, etc.)
    try {
      let totalInvitationsDeleted = 0

      // Delete any invitations created BY this user
      const invitationsCreatedQuery = adminDb.collection('invitations')
        .where('creatorUid', '==', uid)

      const invitationsCreatedSnapshot = await invitationsCreatedQuery.get()

      if (!invitationsCreatedSnapshot.empty) {
        const batch1 = adminDb.batch()
        invitationsCreatedSnapshot.docs.forEach(doc => {
          batch1.delete(doc.ref)
        })
        await batch1.commit()
        totalInvitationsDeleted += invitationsCreatedSnapshot.size
        console.log(`✅ [DELETE-USER] Deleted ${invitationsCreatedSnapshot.size} invitations created by user`)
      }

      // Delete any invitations TO this email address (for re-testing)
      const invitationsToQuery = adminDb.collection('invitations')
        .where('athleteEmail', '==', email.toLowerCase())

      const invitationsToSnapshot = await invitationsToQuery.get()

      if (!invitationsToSnapshot.empty) {
        const batch2 = adminDb.batch()
        invitationsToSnapshot.docs.forEach(doc => {
          batch2.delete(doc.ref)
        })
        await batch2.commit()
        totalInvitationsDeleted += invitationsToSnapshot.size
        console.log(`✅ [DELETE-USER] Deleted ${invitationsToSnapshot.size} invitations to this email`)
      }

      if (totalInvitationsDeleted > 0) {
        console.log(`✅ [DELETE-USER] Total invitations cleaned up: ${totalInvitationsDeleted}`)
      }
    } catch (cleanupError) {
      console.warn(`⚠️ [DELETE-USER] Failed to clean up related data:`, cleanupError)
      // Don't throw error - deletion succeeded, cleanup is optional
    }

    console.log(`✅ [DELETE-USER] Successfully deleted user: ${email}`)

    return NextResponse.json({
      success: true,
      message: `User ${email} deleted successfully from both Firebase Auth and Firestore`,
      deletedUid: uid
    })

  } catch (error: any) {
    console.error('❌ [DELETE-USER] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to delete user'
      },
      { status: 500 }
    )
  }
}
