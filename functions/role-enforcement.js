/**
 * BULLETPROOF ROLE ENFORCEMENT
 *
 * This module ensures that user roles ALWAYS match their invitation roles.
 * Multiple layers of defense:
 * 1. Firestore trigger on user document changes
 * 2. Scheduled job runs daily to check all users
 * 3. Server-side enforcement that cannot be bypassed
 */

const functions = require('firebase-functions')
const admin = require('firebase-admin')

// Initialize Admin SDK if not already initialized
if (!admin.apps.length) {
  admin.initializeApp()
}

const db = admin.firestore()

/**
 * LAYER 1: Real-time enforcement on user document changes
 *
 * Runs every time a user document is created or updated.
 * If invitationRole exists and doesn't match role, immediately fix it.
 */
exports.enforceInvitationRole = functions.firestore
  .document('users/{userId}')
  .onWrite(async (change, context) => {
    try {
      const userId = context.params.userId

      // If document was deleted, nothing to do
      if (!change.after.exists) {
        return null
      }

      const userData = change.after.data()
      const currentRole = userData.role
      const invitationRole = userData.invitationRole

      // CRITICAL: If invitationRole exists and doesn't match role, FIX IT NOW
      if (invitationRole && currentRole !== invitationRole) {
        console.log(`🚨 ROLE MISMATCH DETECTED:`)
        console.log(`   User: ${userData.email || userId}`)
        console.log(`   Current role: ${currentRole}`)
        console.log(`   Invitation role: ${invitationRole}`)
        console.log(`   FIXING NOW...`)

        await change.after.ref.update({
          role: invitationRole,
          roleUpdatedAt: admin.firestore.Timestamp.now(),
          roleUpdateReason: 'Auto-enforced from invitationRole by Cloud Function',
          roleEnforcedByCloudFunction: true,
          lastEnforcementTimestamp: admin.firestore.Timestamp.now()
        })

        console.log(`   ✅ FIXED: Role updated to ${invitationRole}`)

        // Log to a separate audit collection for monitoring
        await db.collection('role_enforcement_audit').add({
          userId,
          email: userData.email,
          incorrectRole: currentRole,
          correctedRole: invitationRole,
          timestamp: admin.firestore.Timestamp.now(),
          trigger: 'firestore_trigger'
        })
      }

      return null
    } catch (error) {
      console.error('Error in enforceInvitationRole:', error)
      // Don't throw - we don't want to fail the entire operation
      return null
    }
  })

/**
 * LAYER 2: Scheduled daily check for role consistency
 *
 * Runs every day at 2 AM UTC to scan all users and fix any mismatches.
 * This catches any edge cases that might slip through.
 */
exports.dailyRoleConsistencyCheck = functions.pubsub
  .schedule('0 2 * * *') // Every day at 2 AM UTC
  .timeZone('UTC')
  .onRun(async (context) => {
    try {
      console.log('\n🔍 Starting daily role consistency check...')

      const usersSnapshot = await db.collection('users').get()
      let fixedCount = 0
      let skippedCount = 0
      const fixes = []

      for (const doc of usersSnapshot.docs) {
        const data = doc.data()
        const currentRole = data.role
        const invitationRole = data.invitationRole

        // If invitationRole exists and doesn't match current role, fix it
        if (invitationRole && currentRole !== invitationRole) {
          console.log(`❌ MISMATCH: ${data.email}: ${currentRole} → ${invitationRole}`)

          await doc.ref.update({
            role: invitationRole,
            roleUpdatedAt: admin.firestore.Timestamp.now(),
            roleUpdateReason: 'Daily consistency check - enforced from invitationRole',
            lastScheduledCheckTimestamp: admin.firestore.Timestamp.now()
          })

          fixedCount++
          fixes.push({
            uid: doc.id,
            email: data.email,
            from: currentRole,
            to: invitationRole
          })

          // Log to audit collection
          await db.collection('role_enforcement_audit').add({
            userId: doc.id,
            email: data.email,
            incorrectRole: currentRole,
            correctedRole: invitationRole,
            timestamp: admin.firestore.Timestamp.now(),
            trigger: 'scheduled_check'
          })
        } else {
          skippedCount++
        }
      }

      console.log('\n========================================')
      console.log(`✅ Fixed: ${fixedCount} users`)
      console.log(`⏭️  Skipped: ${skippedCount} users (no mismatch)`)
      console.log('========================================')

      if (fixes.length > 0) {
        console.log('📋 Fixed users:')
        fixes.forEach(fix => {
          console.log(`   ${fix.email}: ${fix.from} → ${fix.to}`)
        })
      }

      // Store summary in Firestore for monitoring
      await db.collection('role_enforcement_reports').add({
        timestamp: admin.firestore.Timestamp.now(),
        fixedCount,
        skippedCount,
        fixes,
        trigger: 'scheduled_check'
      })

      return null
    } catch (error) {
      console.error('Error in dailyRoleConsistencyCheck:', error)
      throw error
    }
  })

/**
 * LAYER 3: Manual enforcement endpoint (admin only)
 *
 * Allows admins to manually trigger a full role consistency check.
 */
exports.manualRoleEnforcement = functions.https.onCall(async (data, context) => {
  try {
    // Verify admin authentication
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated')
    }

    // Check if user is admin or superadmin
    const userDoc = await db.collection('users').doc(context.auth.uid).get()
    const userData = userDoc.data()

    if (!userData || !['admin', 'superadmin'].includes(userData.role)) {
      throw new functions.https.HttpsError('permission-denied', 'Must be admin or superadmin')
    }

    console.log(`\n🔧 Manual role enforcement triggered by ${userData.email}`)

    const usersSnapshot = await db.collection('users').get()
    let fixedCount = 0
    const fixes = []

    for (const doc of usersSnapshot.docs) {
      const data = doc.data()
      const currentRole = data.role
      const invitationRole = data.invitationRole

      if (invitationRole && currentRole !== invitationRole) {
        await doc.ref.update({
          role: invitationRole,
          roleUpdatedAt: admin.firestore.Timestamp.now(),
          roleUpdateReason: `Manual enforcement by ${userData.email}`,
          lastManualEnforcementTimestamp: admin.firestore.Timestamp.now()
        })

        fixedCount++
        fixes.push({
          uid: doc.id,
          email: data.email,
          from: currentRole,
          to: invitationRole
        })

        // Log to audit collection
        await db.collection('role_enforcement_audit').add({
          userId: doc.id,
          email: data.email,
          incorrectRole: currentRole,
          correctedRole: invitationRole,
          timestamp: admin.firestore.Timestamp.now(),
          trigger: 'manual_enforcement',
          triggeredBy: context.auth.uid
        })
      }
    }

    // Store report
    await db.collection('role_enforcement_reports').add({
      timestamp: admin.firestore.Timestamp.now(),
      fixedCount,
      fixes,
      trigger: 'manual_enforcement',
      triggeredBy: context.auth.uid
    })

    return {
      success: true,
      fixedCount,
      fixes
    }
  } catch (error) {
    console.error('Error in manualRoleEnforcement:', error)
    throw new functions.https.HttpsError('internal', error.message)
  }
})
