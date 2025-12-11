/**
 * Set Joseph as Superadmin
 */

const admin = require('firebase-admin')

// Initialize Firebase Admin
if (!admin.apps.length) {
  try {
    const serviceAccount = require('./firebase-admin-key.json')
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    })
    console.log('✅ Firebase Admin initialized')
  } catch (error) {
    console.error('❌ Failed to initialize Firebase Admin:', error)
    process.exit(1)
  }
}

const db = admin.firestore()

async function setJosephAsSuperadmin() {
  try {
    console.log('🔧 Setting Joseph as Superadmin...\n')

    const email = 'llanes.joseph.m@gmail.com'

    // Find user
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

    console.log('📋 Current data:')
    console.log(`   Email: ${userData.email}`)
    console.log(`   UID: ${userId}`)
    console.log(`   Current Role: ${userData.role || 'none'}`)
    console.log('')

    // Update to superadmin role
    await db.collection('users').doc(userId).update({
      role: 'superadmin',
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    })

    console.log('✅ Role updated successfully!\n')
    console.log('📊 New settings:')
    console.log(`   Role: superadmin`)
    console.log('')
    console.log('✅ Joseph now has:')
    console.log('   • Full superadmin access')
    console.log('   • Default redirect to /dashboard/admin')
    console.log('   • Can create admins and manage all platform features')
    console.log('   • Can still access creator dashboard at /dashboard/creator')
    console.log('')
    console.log('🔄 Sign out and sign back in to see the changes')

  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

setJosephAsSuperadmin()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
