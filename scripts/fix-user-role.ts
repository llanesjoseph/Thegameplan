/**
 * Script to fix user role when athlete onboarding overwrote coach/creator role
 *
 * Usage:
 * npx tsx scripts/fix-user-role.ts <email> <correct-role>
 *
 * Example:
 * npx tsx scripts/fix-user-role.ts ammphotostudiosf@gmail.com creator
 */

import { adminDb, auth } from '../lib/firebase.admin'

async function fixUserRole() {
  const email = process.argv[2]
  const correctRole = process.argv[3]

  if (!email || !correctRole) {
    console.error('❌ Usage: npx tsx scripts/fix-user-role.ts <email> <correct-role>')
    console.error('   Valid roles: user, creator, coach, assistant, admin, superadmin')
    process.exit(1)
  }

  const validRoles = ['user', 'creator', 'coach', 'assistant', 'admin', 'superadmin']
  if (!validRoles.includes(correctRole)) {
    console.error(`❌ Invalid role: ${correctRole}`)
    console.error(`   Valid roles: ${validRoles.join(', ')}`)
    process.exit(1)
  }

  try {
    // Get user by email
    console.log(`🔍 Finding user with email: ${email}`)
    const userRecord = await auth.getUserByEmail(email.toLowerCase())
    console.log(`✅ Found user: ${userRecord.uid}`)

    // Get current user document
    const userDoc = await adminDb.collection('users').doc(userRecord.uid).get()
    if (!userDoc.exists) {
      console.error('❌ User document not found in Firestore')
      process.exit(1)
    }

    const userData = userDoc.data()
    console.log(`📋 Current role: ${userData?.role}`)
    console.log(`📋 Has athleteId: ${userData?.athleteId ? 'Yes' : 'No'}`)

    // Update role
    console.log(`🔄 Updating role to: ${correctRole}`)
    await adminDb.collection('users').doc(userRecord.uid).update({
      role: correctRole,
      updatedAt: new Date()
    })

    console.log(`✅ Successfully updated role to: ${correctRole}`)
    console.log(`ℹ️  User can now access both coach and athlete features`)
    console.log(`   - Coach role: ${correctRole}`)
    console.log(`   - Athlete profile: ${userData?.athleteId || 'linked'}`)

  } catch (error) {
    console.error('❌ Error fixing user role:', error)
    process.exit(1)
  }
}

fixUserRole()
  .then(() => {
    console.log('✅ Done!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Fatal error:', error)
    process.exit(1)
  })
