/**
 * BROWSER CONSOLE MIGRATION SCRIPT
 *
 * Copy and paste this entire script into the browser console at:
 * https://playbookd.crucibleanalytics.dev
 *
 * Make sure you're logged in as joseph@crucibleanalytics.dev
 */

(async function() {
  console.log('🚀 Starting 5-Role System Migration...\n')

  // Configuration
  const SUPERADMIN_EMAIL = 'joseph@crucibleanalytics.dev'
  const ROLE_MAP = {
    'guest': null,
    'user': 'athlete',
    'creator': 'coach',
    'coach': 'coach',
    'athlete': 'athlete',
    'assistant': 'assistant',
    'admin': 'admin',
    'superadmin': 'superadmin'
  }

  try {
    // Get Firebase instances from window (already loaded on the page)
    const { db, auth } = window

    if (!db || !auth) {
      throw new Error('Firebase not loaded. Make sure you\'re on the app page.')
    }

    // Import Firestore functions
    const {
      collection,
      getDocs,
      doc,
      updateDoc,
      serverTimestamp,
      query,
      where
    } = await import('firebase/firestore')

    // STEP 1: Verify access
    console.log('STEP 1: Verifying access...')
    const currentUser = auth.currentUser
    if (!currentUser) {
      throw new Error('Not logged in!')
    }

    console.log(`Logged in as: ${currentUser.email}`)

    if (currentUser.email !== SUPERADMIN_EMAIL) {
      throw new Error(`Must be logged in as ${SUPERADMIN_EMAIL}`)
    }

    console.log('✅ Super admin verified\n')

    // STEP 2: Backup warning
    console.log('STEP 2: Backup check')
    console.log('⚠️  IMPORTANT: Have you backed up the database?')
    console.log('Firebase Console → Firestore Database → Import/Export\n')

    const proceed = confirm('Have you created a backup? Click OK to continue.')
    if (!proceed) {
      console.log('❌ Migration cancelled')
      return
    }

    // STEP 3: Analyze current state
    console.log('STEP 3: Analyzing database...')
    const usersSnapshot = await getDocs(collection(db, 'users'))

    const stats = {
      total: 0,
      toMigrate: [],
      byRole: {}
    }

    usersSnapshot.forEach(docSnap => {
      const data = docSnap.data()
      const currentRole = data.role || 'unknown'

      stats.total++
      stats.byRole[currentRole] = (stats.byRole[currentRole] || 0) + 1

      const newRole = ROLE_MAP[currentRole]
      if (newRole && newRole !== currentRole) {
        stats.toMigrate.push({
          uid: docSnap.id,
          email: data.email,
          oldRole: currentRole,
          newRole
        })
      }
    })

    console.log('\nCurrent roles:')
    Object.entries(stats.byRole).forEach(([role, count]) => {
      const arrow = ROLE_MAP[role] ? ` → ${ROLE_MAP[role]}` : ' (DELETE)'
      console.log(`  ${role}: ${count}${arrow}`)
    })

    console.log(`\nTotal users: ${stats.total}`)
    console.log(`To migrate: ${stats.toMigrate.length}\n`)

    if (stats.toMigrate.length === 0) {
      console.log('✅ No migrations needed!')
      return
    }

    // STEP 4: Confirm migration
    const confirmMigrate = confirm(
      `Migrate ${stats.toMigrate.length} users?\n\n` +
      stats.toMigrate.map(u => `${u.email}: ${u.oldRole} → ${u.newRole}`).join('\n')
    )

    if (!confirmMigrate) {
      console.log('❌ Migration cancelled')
      return
    }

    // STEP 5: Ensure Joseph is superadmin
    console.log('STEP 4: Ensuring Joseph is superadmin...')
    const josephQuery = query(
      collection(db, 'users'),
      where('email', '==', SUPERADMIN_EMAIL)
    )
    const josephSnapshot = await getDocs(josephQuery)

    if (!josephSnapshot.empty) {
      const josephDoc = josephSnapshot.docs[0]
      const josephData = josephDoc.data()

      if (josephData.role !== 'superadmin') {
        await updateDoc(doc(db, 'users', josephDoc.id), {
          role: 'superadmin',
          updatedAt: serverTimestamp()
        })
        console.log('✅ Joseph set as superadmin')
      } else {
        console.log('✅ Joseph already superadmin')
      }
    }

    // STEP 6: Migrate users
    console.log('\nSTEP 5: Migrating users...')
    let success = 0
    let failed = 0

    for (const user of stats.toMigrate) {
      try {
        await updateDoc(doc(db, 'users', user.uid), {
          role: user.newRole,
          updatedAt: serverTimestamp()
        })

        console.log(`✅ ${user.email}: ${user.oldRole} → ${user.newRole}`)
        success++
      } catch (error) {
        console.error(`❌ ${user.email}: ${error.message}`)
        failed++
      }
    }

    console.log(`\n✅ Success: ${success}`)
    console.log(`❌ Failed: ${failed}`)

    // STEP 7: Verify
    console.log('\nSTEP 6: Verifying migration...')
    const verifySnapshot = await getDocs(collection(db, 'users'))
    const newStats = {}
    const validRoles = ['athlete', 'coach', 'assistant', 'admin', 'superadmin']
    let invalidCount = 0

    verifySnapshot.forEach(docSnap => {
      const role = docSnap.data().role
      newStats[role] = (newStats[role] || 0) + 1

      if (!validRoles.includes(role)) {
        invalidCount++
      }
    })

    console.log('\nNew role distribution:')
    Object.entries(newStats).forEach(([role, count]) => {
      const valid = validRoles.includes(role) ? '✅' : '❌'
      console.log(`  ${valid} ${role}: ${count}`)
    })

    if (invalidCount === 0) {
      console.log('\n🎉 MIGRATION SUCCESSFUL!')
      console.log('All users now have valid roles.')
    } else {
      console.log(`\n⚠️  ${invalidCount} users still have invalid roles`)
    }

    // STEP 8: Next steps
    console.log('\n📝 NEXT STEPS:')
    console.log('1. Test athlete dashboard access')
    console.log('2. Test coach dashboard access')
    console.log('3. Verify role-based permissions')
    console.log('4. Update Firestore security rules if needed')
    console.log('5. Deploy code changes for 5-role system')

  } catch (error) {
    console.error('\n❌ MIGRATION FAILED')
    console.error(error)
    console.log('\nIf you have a backup, you can restore it from Firebase Console.')
  }
})();
