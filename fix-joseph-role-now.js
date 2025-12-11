/**
 * Quick script to fix Joseph's role to creator/coach
 * Run with: node fix-joseph-role-now.js
 */

const admin = require('firebase-admin')

// Initialize Firebase Admin
if (!admin.apps.length) {
  try {
    // Try to load service account from file
    const serviceAccount = require('./firebase-admin-key.json')
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    })
    console.log('✅ Firebase Admin initialized with service account')
  } catch (error) {
    // Fallback to environment variable
    const serviceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
    if (!serviceAccountBase64) {
      console.error('❌ No Firebase credentials found')
      process.exit(1)
    }
    const serviceAccount = JSON.parse(
      Buffer.from(serviceAccountBase64, 'base64').toString('utf8')
    )
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    })
    console.log('✅ Firebase Admin initialized from environment variable')
  }
}

const db = admin.firestore()

async function fixJosephRole() {
  try {
    console.log('🔧 Fixing Joseph\'s role...\n')

    const email = 'llanes.joseph.m@gmail.com'

    // Find user by email
    const usersSnapshot = await db.collection('users')
      .where('email', '==', email)
      .limit(1)
      .get()

    if (usersSnapshot.empty) {
      console.error(`❌ User not found: ${email}`)
      process.exit(1)
    }

    const userDoc = usersSnapshot.docs[0]
    const userData = userDoc.data()
    const userId = userDoc.id

    console.log('📋 Current user data:')
    console.log(`   Email: ${userData.email}`)
    console.log(`   UID: ${userId}`)
    console.log(`   Current Role: ${userData.role || 'none'}`)
    console.log(`   Display Name: ${userData.displayName || 'Not set'}`)
    console.log('')

    // Update to creator role
    const updateData = {
      role: 'creator',
      creatorStatus: 'approved',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      permissions: {
        canCreateContent: true,
        canManageContent: true,
        canAccessAnalytics: true,
        canReceivePayments: true
      }
    }

    await db.collection('users').doc(userId).update(updateData)

    console.log('✅ Role updated successfully!\n')
    console.log('📊 New settings:')
    console.log(`   Role: creator (coach)`)
    console.log(`   Creator Status: approved`)
    console.log(`   Permissions: Full creator access`)
    console.log('')
    console.log('✅ Joseph can now access:')
    console.log('   • Creator/Coach Dashboard (/dashboard/creator)')
    console.log('   • Content creation tools')
    console.log('   • Student management')
    console.log('   • Analytics and reporting')
    console.log('')
    console.log('🔄 Please have Joseph sign out and sign back in to see the changes')

  } catch (error) {
    console.error('❌ Error fixing role:', error)
    process.exit(1)
  }
}

// Run the fix
fixJosephRole()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
