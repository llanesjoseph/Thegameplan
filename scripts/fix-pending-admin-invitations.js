/**
 * Fix Pending Admin Invitations
 *
 * This script updates all admin invitations with status 'pending' to 'active'
 * since admin invitations have autoApprove: true and should be immediately active.
 *
 * Usage:
 *   node scripts/fix-pending-admin-invitations.js
 */

const admin = require('firebase-admin')
const path = require('path')

// Initialize Firebase Admin
if (!admin.apps.length) {
  const serviceAccount = require(path.join(__dirname, '..', 'firebase-admin-key.json'))

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  })
}

const db = admin.firestore()

async function fixPendingInvitations() {
  try {
    console.log('🔍 Finding pending admin invitations...')

    // Find all admin invitations with status 'pending'
    const pendingInvitations = await db
      .collection('admin_invitations')
      .where('status', '==', 'pending')
      .get()

    if (pendingInvitations.empty) {
      console.log('✅ No pending admin invitations found - all good!')
      return
    }

    console.log(`📝 Found ${pendingInvitations.size} pending admin invitation(s)`)

    // Update each invitation to active status
    const batch = db.batch()
    let updateCount = 0

    pendingInvitations.forEach(doc => {
      const data = doc.data()
      console.log(`   - ${data.recipientEmail} (${data.role})`)

      batch.update(doc.ref, {
        status: 'active',
        updatedAt: admin.firestore.Timestamp.now()
      })
      updateCount++
    })

    // Commit the batch update
    await batch.commit()

    console.log(`✅ Successfully updated ${updateCount} admin invitation(s) to active status`)
    console.log('🎉 All admin invitations are now active and ready to use!')

  } catch (error) {
    console.error('❌ Error fixing pending invitations:', error)
    throw error
  }
}

// Run the fix
fixPendingInvitations()
  .then(() => {
    console.log('\n✨ Script completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error)
    process.exit(1)
  })
