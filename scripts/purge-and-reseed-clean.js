/**
 * PURGE AND RESEED DATABASE - 5 ROLE SYSTEM
 *
 * ⚠️  WARNING: This will DELETE ALL DATA except joseph@crucibleanalytics.dev
 *
 * What this does:
 * 1. Saves joseph@crucibleanalytics.dev account
 * 2. DELETES ALL COLLECTIONS
 * 3. Recreates joseph as superadmin
 * 4. Creates clean sample data with 5 roles only
 *
 * Run this in browser console at: https://playbookd.crucibleanalytics.dev
 * Must be logged in as: joseph@crucibleanalytics.dev
 */

(async function() {
  console.log('🔥 DATABASE PURGE AND RESEED SCRIPT')
  console.log('=' .repeat(60))
  console.log('⚠️  THIS WILL DELETE ALL DATA EXCEPT JOSEPH!')
  console.log('=' .repeat(60))

  const SUPERADMIN_EMAIL = 'joseph@crucibleanalytics.dev'

  try {
    // Get Firebase instances
    const { db, auth } = window

    if (!db || !auth) {
      throw new Error('Firebase not loaded. Are you on the app page?')
    }

    const {
      collection,
      getDocs,
      doc,
      deleteDoc,
      setDoc,
      query,
      where,
      serverTimestamp,
      writeBatch
    } = await import('firebase/firestore')

    // STEP 1: Verify logged in as Joseph
    console.log('\n📋 STEP 1: Verifying access...')
    const currentUser = auth.currentUser

    if (!currentUser) {
      throw new Error('Not logged in!')
    }

    if (currentUser.email !== SUPERADMIN_EMAIL) {
      throw new Error(`Must be logged in as ${SUPERADMIN_EMAIL}`)
    }

    console.log(`✅ Logged in as: ${currentUser.email}`)
    console.log(`   UID: ${currentUser.uid}`)

    // STEP 2: Final confirmation
    console.log('\n⚠️  FINAL WARNING')
    console.log('=' .repeat(60))
    console.log('This will DELETE ALL DATA except joseph@crucibleanalytics.dev')
    console.log('=' .repeat(60))

    const confirm1 = confirm('⚠️  DELETE ALL DATA? This cannot be undone!')
    if (!confirm1) {
      console.log('❌ Cancelled')
      return
    }

    const confirm2 = confirm('Are you ABSOLUTELY SURE? Type OK if yes.')
    if (!confirm2) {
      console.log('❌ Cancelled')
      return
    }

    // STEP 3: Save Joseph's data
    console.log('\n💾 STEP 2: Saving Joseph\'s account...')
    const josephQuery = query(
      collection(db, 'users'),
      where('email', '==', SUPERADMIN_EMAIL)
    )
    const josephSnapshot = await getDocs(josephQuery)

    let josephData = null
    let josephDocId = null

    if (!josephSnapshot.empty) {
      josephDocId = josephSnapshot.docs[0].id
      josephData = josephSnapshot.docs[0].data()
      console.log('✅ Joseph\'s account saved')
      console.log('   ID:', josephDocId)
      console.log('   Email:', josephData.email)
      console.log('   Current Role:', josephData.role)
    } else {
      console.log('⚠️  Joseph not found in users collection')
      josephDocId = currentUser.uid
      josephData = {
        uid: currentUser.uid,
        email: currentUser.email,
        displayName: currentUser.displayName || 'Joseph',
        photoURL: currentUser.photoURL || null,
        emailVerified: currentUser.emailVerified || false
      }
    }

    // STEP 4: Delete all collections
    console.log('\n🗑️  STEP 3: Purging database...')

    const collectionsToDelete = [
      'users',
      'athletes',
      'coaches',
      'assistants',
      'admins',
      'profiles',
      'coach_profiles',
      'creator_profiles',
      'contributor_profiles',
      'creatorPublic',
      'creator_index',
      'coaching_requests',
      'coach_applications',
      'content',
      'lessonAnalytics',
      'sessions',
      'notifications',
      'invitations',
      'feature_flags',
      'savedResponses'
    ]

    let totalDeleted = 0

    for (const collectionName of collectionsToDelete) {
      try {
        const snapshot = await getDocs(collection(db, collectionName))
        const deleteCount = snapshot.docs.length

        if (deleteCount > 0) {
          console.log(`Deleting ${collectionName}: ${deleteCount} documents...`)

          // Delete in batches
          for (const docSnap of snapshot.docs) {
            await deleteDoc(doc(db, collectionName, docSnap.id))
          }

          totalDeleted += deleteCount
          console.log(`✅ Deleted ${collectionName}`)
        }
      } catch (error) {
        console.log(`⚠️  Error deleting ${collectionName}:`, error.message)
      }
    }

    console.log(`\n✅ Purged ${totalDeleted} documents from ${collectionsToDelete.length} collections`)

    // STEP 5: Recreate Joseph as superadmin
    console.log('\n👑 STEP 4: Recreating Joseph as superadmin...')

    await setDoc(doc(db, 'users', josephDocId), {
      uid: josephDocId,
      email: SUPERADMIN_EMAIL,
      displayName: josephData.displayName || 'Joseph Llanes',
      photoURL: josephData.photoURL || null,
      role: 'superadmin',
      onboardingComplete: true,
      emailVerified: josephData.emailVerified || false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastLoginAt: serverTimestamp()
    })

    console.log('✅ Joseph recreated as superadmin')

    // STEP 6: Create sample data
    console.log('\n📦 STEP 5: Creating sample data...')

    // Sample Athletes
    const sampleAthletes = [
      {
        id: 'athlete1',
        email: 'sarah.athlete@test.com',
        displayName: 'Sarah Johnson',
        sport: 'Soccer',
        skillLevel: 'intermediate',
        age: 16
      },
      {
        id: 'athlete2',
        email: 'mike.athlete@test.com',
        displayName: 'Mike Chen',
        sport: 'Basketball',
        skillLevel: 'beginner',
        age: 14
      },
      {
        id: 'athlete3',
        email: 'emma.athlete@test.com',
        displayName: 'Emma Davis',
        sport: 'Soccer',
        skillLevel: 'advanced',
        age: 17
      }
    ]

    for (const athlete of sampleAthletes) {
      // Create user document
      await setDoc(doc(db, 'users', athlete.id), {
        uid: athlete.id,
        email: athlete.email,
        displayName: athlete.displayName,
        role: 'athlete',
        photoURL: null,
        onboardingComplete: true,
        emailVerified: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastLoginAt: serverTimestamp()
      })

      // Create athlete profile
      await setDoc(doc(db, 'athletes', athlete.id), {
        uid: athlete.id,
        email: athlete.email,
        displayName: athlete.displayName,
        sport: athlete.sport,
        skillLevel: athlete.skillLevel,
        age: athlete.age,
        coachId: 'coach1',
        onboardingComplete: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })

      console.log(`✅ Created athlete: ${athlete.displayName}`)
    }

    // Sample Coaches
    const sampleCoaches = [
      {
        id: 'coach1',
        email: 'alex.coach@test.com',
        displayName: 'Coach Alex Rivera',
        sport: 'Soccer',
        bio: 'Professional soccer coach with 10 years experience',
        verified: true
      },
      {
        id: 'coach2',
        email: 'jordan.coach@test.com',
        displayName: 'Coach Jordan Smith',
        sport: 'Basketball',
        bio: 'Former pro player, now coaching youth basketball',
        verified: true
      }
    ]

    for (const coach of sampleCoaches) {
      // Create user document
      await setDoc(doc(db, 'users', coach.id), {
        uid: coach.id,
        email: coach.email,
        displayName: coach.displayName,
        role: 'coach',
        photoURL: null,
        onboardingComplete: true,
        emailVerified: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastLoginAt: serverTimestamp()
      })

      // Create coach profile
      await setDoc(doc(db, 'coaches', coach.id), {
        uid: coach.id,
        email: coach.email,
        displayName: coach.displayName,
        sport: coach.sport,
        bio: coach.bio,
        certifications: ['Level 1 Coaching License'],
        specialties: ['Youth Development', 'Technical Skills'],
        verified: coach.verified,
        status: 'approved',
        onboardingComplete: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })

      console.log(`✅ Created coach: ${coach.displayName}`)
    }

    // Sample Assistant
    await setDoc(doc(db, 'users', 'assistant1'), {
      uid: 'assistant1',
      email: 'taylor.assistant@test.com',
      displayName: 'Taylor Martinez',
      role: 'assistant',
      photoURL: null,
      onboardingComplete: true,
      emailVerified: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastLoginAt: serverTimestamp()
    })

    await setDoc(doc(db, 'assistants', 'assistant1'), {
      uid: 'assistant1',
      email: 'taylor.assistant@test.com',
      displayName: 'Taylor Martinez',
      coachId: 'coach1',
      permissions: ['view_athletes', 'create_content'],
      createdAt: serverTimestamp()
    })

    console.log('✅ Created assistant: Taylor Martinez')

    // Sample Admin
    await setDoc(doc(db, 'users', 'admin1'), {
      uid: 'admin1',
      email: 'admin@test.com',
      displayName: 'Admin User',
      role: 'admin',
      photoURL: null,
      onboardingComplete: true,
      emailVerified: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastLoginAt: serverTimestamp()
    })

    await setDoc(doc(db, 'admins', 'admin1'), {
      uid: 'admin1',
      email: 'admin@test.com',
      displayName: 'Admin User',
      permissions: ['manage_users', 'manage_content', 'view_analytics'],
      createdAt: serverTimestamp()
    })

    console.log('✅ Created admin: Admin User')

    // STEP 7: Summary
    console.log('\n📊 SUMMARY')
    console.log('=' .repeat(60))
    console.log('✅ Database purged and reseeded')
    console.log('\nAccounts created:')
    console.log('  👑 1 Superadmin: joseph@crucibleanalytics.dev')
    console.log('  🏃 3 Athletes')
    console.log('  🎓 2 Coaches')
    console.log('  🤝 1 Assistant')
    console.log('  ⚙️  1 Admin')
    console.log('\n5-Role System Active:')
    console.log('  - athlete')
    console.log('  - coach')
    console.log('  - assistant')
    console.log('  - admin')
    console.log('  - superadmin')
    console.log('=' .repeat(60))

    console.log('\n🎉 SUCCESS!')
    console.log('\n📝 Test Accounts:')
    console.log('  Athletes:')
    console.log('    - sarah.athlete@test.com')
    console.log('    - mike.athlete@test.com')
    console.log('    - emma.athlete@test.com')
    console.log('  Coaches:')
    console.log('    - alex.coach@test.com')
    console.log('    - jordan.coach@test.com')
    console.log('  Assistant:')
    console.log('    - taylor.assistant@test.com')
    console.log('  Admin:')
    console.log('    - admin@test.com')
    console.log('\n⚠️  Note: Test accounts need passwords set in Firebase Auth')

  } catch (error) {
    console.error('\n❌ ERROR')
    console.error(error)
  }
})();
