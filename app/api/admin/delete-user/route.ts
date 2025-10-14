import { NextRequest, NextResponse } from 'next/server'
import { auth as adminAuth, adminDb } from '@/lib/firebase.admin'

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

    // Optional: Clean up related data (invitations, sessions, etc.)
    try {
      // Delete any invitations created by this user
      const invitationsQuery = adminDb.collection('invitations')
        .where('creatorUid', '==', uid)

      const invitationsSnapshot = await invitationsQuery.get()

      if (!invitationsSnapshot.empty) {
        const batch = adminDb.batch()
        invitationsSnapshot.docs.forEach(doc => {
          batch.delete(doc.ref)
        })
        await batch.commit()
        console.log(`✅ [DELETE-USER] Deleted ${invitationsSnapshot.size} invitations`)
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
