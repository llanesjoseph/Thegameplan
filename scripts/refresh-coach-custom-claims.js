/**
 * Refresh Custom Claims for All Coaches
 *
 * This script ensures all coaches have their role properly set in Firebase custom claims.
 * Custom claims are required for Storage rules to work properly.
 *
 * Run with: node scripts/refresh-coach-custom-claims.js
 */

const admin = require('firebase-admin')
const serviceAccount = require('../service-account.json')

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  })
}

const db = admin.firestore()
const auth = admin.auth()

async function refreshCoachCustomClaims() {
  try {
    console.log('🔄 Starting custom claims refresh for all coaches...\n')

    // Get all users with coach or creator role from Firestore
    const usersSnapshot = await db.collection('users')
      .where('role', 'in', ['coach', 'creator', 'assistant_coach'])
      .get()

    if (usersSnapshot.empty) {
      console.log('ℹ️ No coaches found')
      return
    }

    console.log(`📊 Found ${usersSnapshot.docs.length} coaches to process\n`)

    let successCount = 0
    let errorCount = 0
    const errors = []

    for (const doc of usersSnapshot.docs) {
      const userData = doc.data()
      const userId = doc.id
      const role = userData.role
      const email = userData.email || 'unknown'

      try {
        // Get current custom claims
        const userRecord = await auth.getUser(userId)
        const currentClaims = userRecord.customClaims || {}

        // Check if claims need updating
        if (currentClaims.role === role && currentClaims[role] === true) {
          console.log(`✓ ${email} - Already has correct claims (${role})`)
          successCount++
          continue
        }

        // Set/update custom claims
        await auth.setCustomUserClaims(userId, {
          role: role,
          [role]: true
        })

        console.log(`✅ ${email} - Set custom claims: { role: '${role}', ${role}: true }`)
        successCount++

      } catch (error) {
        console.error(`❌ ${email} - Error: ${error.message}`)
        errorCount++
        errors.push({ email, userId, error: error.message })
      }
    }

    console.log('\n' + '='.repeat(80))
    console.log('📊 SUMMARY')
    console.log('='.repeat(80))
    console.log(`✅ Success: ${successCount}`)
    console.log(`❌ Errors: ${errorCount}`)

    if (errors.length > 0) {
      console.log('\n❌ Failed users:')
      errors.forEach(err => {
        console.log(`  - ${err.email} (${err.userId}): ${err.error}`)
      })
    }

    console.log('\n✅ Custom claims refresh complete!')
    console.log('\n💡 IMPORTANT: Affected users must sign out and sign back in for changes to take effect.')

  } catch (error) {
    console.error('💥 Fatal error:', error)
    process.exit(1)
  }
}

// Run the script
refreshCoachCustomClaims()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('💥 Script failed:', error)
    process.exit(1)
  })
