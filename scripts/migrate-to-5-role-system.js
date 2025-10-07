/**
 * Database Migration Script: 5-Role System
 *
 * This script migrates the database from the old multi-role system to the new simplified 5-role system:
 * - athlete
 * - coach
 * - assistant
 * - admin
 * - superadmin
 *
 * IMPORTANT: Run this in the browser console on https://playbookd.crucibleanalytics.dev
 * while logged in as joseph@crucibleanalytics.dev
 */

// Role mapping configuration
const ROLE_MIGRATION_MAP = {
  'guest': null,      // Will be deleted - guests should sign in
  'user': 'athlete',  // Legacy athlete role
  'creator': 'coach', // Legacy coach role
  'coach': 'coach',   // Already correct
  'athlete': 'athlete', // Already correct
  'assistant': 'assistant', // Already correct
  'admin': 'admin',   // Already correct
  'superadmin': 'superadmin' // Already correct
}

const SUPERADMIN_EMAIL = 'joseph@crucibleanalytics.dev'

// Import required Firebase modules
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  setDoc,
  query,
  where,
  writeBatch,
  serverTimestamp
} from 'firebase/firestore'

import { getAuth } from 'firebase/auth'

const db = getFirestore()
const auth = getAuth()

/**
 * STEP 1: Verify Super Admin Access
 */
async function verifySuperAdminAccess() {
  const currentUser = auth.currentUser

  if (!currentUser) {
    throw new Error('❌ Not logged in. Please sign in as joseph@crucibleanalytics.dev')
  }

  if (currentUser.email !== SUPERADMIN_EMAIL) {
    throw new Error(`❌ Must be logged in as ${SUPERADMIN_EMAIL}. Current user: ${currentUser.email}`)
  }

  console.log('✅ Verified super admin access:', currentUser.email)
  return currentUser
}

/**
 * STEP 2: Create Database Backup Info
 */
async function logBackupInfo() {
  const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0]
  console.log('\n📋 BACKUP INFORMATION')
  console.log('='.repeat(60))
  console.log(`Timestamp: ${timestamp}`)
  console.log(`Backup name: backup-${timestamp}`)
  console.log('\n⚠️  IMPORTANT: Create a backup before proceeding!')
  console.log('Firebase Console → Firestore Database → Import/Export')
  console.log('='.repeat(60))

  const proceed = confirm('Have you created a database backup? Click OK to continue.')
  if (!proceed) {
    throw new Error('Migration cancelled - create backup first')
  }
}

/**
 * STEP 3: Analyze Current Database State
 */
async function analyzeDatabase() {
  console.log('\n🔍 ANALYZING DATABASE')
  console.log('='.repeat(60))

  const usersSnapshot = await getDocs(collection(db, 'users'))
  const roleCounts = {}
  const usersToMigrate = []

  usersSnapshot.forEach(doc => {
    const data = doc.data()
    const currentRole = data.role || 'unknown'

    roleCounts[currentRole] = (roleCounts[currentRole] || 0) + 1

    const newRole = ROLE_MIGRATION_MAP[currentRole]
    if (newRole && newRole !== currentRole) {
      usersToMigrate.push({
        uid: doc.id,
        email: data.email,
        currentRole,
        newRole
      })
    }
  })

  console.log('\nCurrent Role Distribution:')
  Object.entries(roleCounts).forEach(([role, count]) => {
    const newRole = ROLE_MIGRATION_MAP[role]
    const arrow = newRole ? ` → ${newRole}` : ' (DELETE)'
    console.log(`  ${role}: ${count}${arrow}`)
  })

  console.log(`\nTotal users to migrate: ${usersToMigrate.length}`)
  console.log('='.repeat(60))

  return { roleCounts, usersToMigrate }
}

/**
 * STEP 4: Ensure Joseph is Superadmin
 */
async function ensureSuperAdmin() {
  console.log('\n🔒 ENSURING SUPER ADMIN')
  console.log('='.repeat(60))

  const usersRef = collection(db, 'users')
  const josephQuery = query(usersRef, where('email', '==', SUPERADMIN_EMAIL))
  const josephSnapshot = await getDocs(josephQuery)

  if (josephSnapshot.empty) {
    throw new Error(`❌ Super admin user not found: ${SUPERADMIN_EMAIL}`)
  }

  const josephDoc = josephSnapshot.docs[0]
  const josephData = josephDoc.data()

  if (josephData.role !== 'superadmin') {
    console.log(`Updating ${SUPERADMIN_EMAIL} to superadmin...`)
    await updateDoc(doc(db, 'users', josephDoc.id), {
      role: 'superadmin',
      updatedAt: serverTimestamp()
    })
    console.log('✅ Joseph set as superadmin')
  } else {
    console.log('✅ Joseph already superadmin')
  }

  console.log('='.repeat(60))
}

/**
 * STEP 5: Migrate User Roles
 */
async function migrateUserRoles(usersToMigrate) {
  console.log('\n📝 MIGRATING USER ROLES')
  console.log('='.repeat(60))

  let successCount = 0
  let errorCount = 0
  const errors = []

  for (const user of usersToMigrate) {
    try {
      console.log(`Migrating: ${user.email} (${user.currentRole} → ${user.newRole})`)

      await updateDoc(doc(db, 'users', user.uid), {
        role: user.newRole,
        updatedAt: serverTimestamp()
      })

      successCount++
    } catch (error) {
      errorCount++
      errors.push({ user, error: error.message })
      console.error(`❌ Error migrating ${user.email}:`, error.message)
    }
  }

  console.log(`\n✅ Successfully migrated: ${successCount}`)
  console.log(`❌ Errors: ${errorCount}`)

  if (errors.length > 0) {
    console.log('\nErrors:', errors)
  }

  console.log('='.repeat(60))

  return { successCount, errorCount, errors }
}

/**
 * STEP 6: Clean Up Old Collections
 */
async function cleanUpCollections() {
  console.log('\n🧹 CLEANING UP COLLECTIONS')
  console.log('='.repeat(60))

  const collectionsToArchive = [
    'contributor_profiles',
    'creator_index',
    'creatorAnalytics'
  ]

  console.log('\nCollections that should be manually archived/migrated:')
  collectionsToArchive.forEach(name => {
    console.log(`  - ${name}`)
  })

  console.log('\n⚠️  Manual steps required:')
  console.log('  1. Export contributor_profiles → migrate to coaches/')
  console.log('  2. Export creator_profiles → migrate to coaches/')
  console.log('  3. Archive creator_index (will be rebuilt)')
  console.log('  4. Archive creatorAnalytics → migrate to coaches/{id}/analytics/')
  console.log('  5. Rebuild creatorPublic from coaches/ collection')

  console.log('='.repeat(60))
}

/**
 * STEP 7: Verify Migration Results
 */
async function verifyMigration() {
  console.log('\n✅ VERIFYING MIGRATION')
  console.log('='.repeat(60))

  const usersSnapshot = await getDocs(collection(db, 'users'))
  const newRoleCounts = {}
  const invalidUsers = []

  const validRoles = ['athlete', 'coach', 'assistant', 'admin', 'superadmin']

  usersSnapshot.forEach(doc => {
    const data = doc.data()
    const role = data.role

    newRoleCounts[role] = (newRoleCounts[role] || 0) + 1

    if (!validRoles.includes(role)) {
      invalidUsers.push({
        uid: doc.id,
        email: data.email,
        role
      })
    }
  })

  console.log('\nNew Role Distribution:')
  Object.entries(newRoleCounts).forEach(([role, count]) => {
    const icon = validRoles.includes(role) ? '✅' : '❌'
    console.log(`  ${icon} ${role}: ${count}`)
  })

  if (invalidUsers.length > 0) {
    console.log(`\n❌ Found ${invalidUsers.length} users with invalid roles:`)
    invalidUsers.forEach(user => {
      console.log(`  - ${user.email}: ${user.role}`)
    })
  } else {
    console.log('\n✅ All users have valid roles!')
  }

  console.log('='.repeat(60))

  return { newRoleCounts, invalidUsers }
}

/**
 * STEP 8: Generate Migration Report
 */
function generateReport(results) {
  console.log('\n📊 MIGRATION REPORT')
  console.log('='.repeat(60))
  console.log('\nPre-Migration:')
  Object.entries(results.preMigration.roleCounts).forEach(([role, count]) => {
    console.log(`  ${role}: ${count}`)
  })

  console.log('\nPost-Migration:')
  Object.entries(results.postMigration.newRoleCounts).forEach(([role, count]) => {
    console.log(`  ${role}: ${count}`)
  })

  console.log(`\nUsers Migrated: ${results.migration.successCount}`)
  console.log(`Errors: ${results.migration.errorCount}`)
  console.log(`Invalid Users Remaining: ${results.postMigration.invalidUsers.length}`)

  if (results.postMigration.invalidUsers.length === 0 && results.migration.errorCount === 0) {
    console.log('\n🎉 MIGRATION SUCCESSFUL!')
  } else {
    console.log('\n⚠️  Migration completed with warnings')
  }

  console.log('='.repeat(60))
}

/**
 * MAIN MIGRATION FUNCTION
 */
export async function runMigration() {
  console.log('\n🚀 STARTING DATABASE MIGRATION TO 5-ROLE SYSTEM')
  console.log('='.repeat(60))

  try {
    // Step 1: Verify access
    await verifySuperAdminAccess()

    // Step 2: Backup reminder
    await logBackupInfo()

    // Step 3: Analyze database
    const preMigration = await analyzeDatabase()

    // Ask for confirmation
    const confirm = window.confirm(
      `About to migrate ${preMigration.usersToMigrate.length} users. Continue?`
    )

    if (!confirm) {
      console.log('❌ Migration cancelled by user')
      return
    }

    // Step 4: Ensure Joseph is superadmin
    await ensureSuperAdmin()

    // Step 5: Migrate roles
    const migration = await migrateUserRoles(preMigration.usersToMigrate)

    // Step 6: Clean up info
    await cleanUpCollections()

    // Step 7: Verify results
    const postMigration = await verifyMigration()

    // Step 8: Generate report
    generateReport({
      preMigration,
      migration,
      postMigration
    })

    console.log('\n✅ MIGRATION COMPLETE')

  } catch (error) {
    console.error('\n❌ MIGRATION FAILED')
    console.error(error)
    console.log('\nPlease restore from backup if needed.')
  }
}

// Auto-run if this script is loaded directly
if (typeof window !== 'undefined') {
  console.log('\n📝 Migration script loaded!')
  console.log('To run migration, execute: runMigration()')

  // Make function available globally
  window.runMigration = runMigration
}
