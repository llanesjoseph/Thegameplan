/**
 * PURGE DATABASE - CLEAN SLATE FOR PRODUCTION
 *
 * ⚠️  WARNING: This will DELETE ALL DATA except joseph@crucibleanalytics.dev
 *
 * What this does:
 * 1. Saves joseph@crucibleanalytics.dev account (superadmin)
 * 2. DELETES ALL COLLECTIONS
 * 3. Recreates joseph as superadmin
 * 4. Creates llanes.joseph.m@gmail.com as coach (for testing)
 * 5. NO MOCK DATA - clean slate for real users
 *
 * Run this in browser console at: https://playbookd.crucibleanalytics.dev
 * Must be logged in as: joseph@crucibleanalytics.dev
 */

(async function() {
  console.log('🔥 DATABASE PURGE - PRODUCTION CLEAN SLATE')
  console.log('=' .repeat(60))
  console.log('⚠️  THIS WILL DELETE ALL DATA!')
  console.log('=' .repeat(60))

  const SUPERADMIN_EMAIL = 'joseph@crucibleanalytics.dev'
  const JOSEPH_COACH_EMAIL = 'llanes.joseph.m@gmail.com'

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
      serverTimestamp
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
    console.log('This will DELETE ALL DATA')
    console.log('Only keeping:')
    console.log('  - joseph@crucibleanalytics.dev (superadmin)')
    console.log('  - llanes.joseph.m@gmail.com (coach)')
    console.log('=' .repeat(60))

    const confirm1 = confirm('⚠️  DELETE ALL DATA? This cannot be undone!')
    if (!confirm1) {
      console.log('❌ Cancelled')
      return
    }

    const confirm2 = confirm('Are you ABSOLUTELY SURE? Click OK to proceed.')
    if (!confirm2) {
      console.log('❌ Cancelled')
      return
    }

    // STEP 3: Save Joseph's data
    console.log('\n💾 STEP 2: Saving Joseph\'s accounts...')
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
      console.log('✅ Joseph superadmin account saved')
      console.log('   ID:', josephDocId)
      console.log('   Email:', josephData.email)
    } else {
      console.log('⚠️  Joseph not found in users collection')
      josephDocId = currentUser.uid
      josephData = {
        uid: currentUser.uid,
        email: currentUser.email,
        displayName: currentUser.displayName || 'Joseph Llanes',
        photoURL: currentUser.photoURL || null,
        emailVerified: currentUser.emailVerified || false
      }
    }

    // Check if coach account exists
    const josephCoachQuery = query(
      collection(db, 'users'),
      where('email', '==', JOSEPH_COACH_EMAIL)
    )
    const josephCoachSnapshot = await getDocs(josephCoachQuery)

    let josephCoachData = null
    let josephCoachDocId = null

    if (!josephCoachSnapshot.empty) {
      josephCoachDocId = josephCoachSnapshot.docs[0].id
      josephCoachData = josephCoachSnapshot.docs[0].data()
      console.log('✅ Joseph coach account found')
      console.log('   ID:', josephCoachDocId)
      console.log('   Email:', josephCoachData.email)
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
      'savedResponses',
      'creatorAnalytics',
      'disclaimer_acknowledgments'
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
    console.log('\n👑 STEP 4: Recreating accounts...')

    // Create Joseph superadmin account
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

    console.log('✅ Joseph superadmin recreated')

    // Create Joseph coach account
    const coachDocId = josephCoachDocId || 'joseph-coach-account'
    const coachPhotoURL = 'https://res.cloudinary.com/dr0jtjwlh/image/upload/v1759857380/DSC_0989_s9kw3x.jpg'

    await setDoc(doc(db, 'users', coachDocId), {
      uid: coachDocId,
      email: JOSEPH_COACH_EMAIL,
      displayName: 'Joseph Llanes',
      photoURL: coachPhotoURL,
      role: 'coach',
      onboardingComplete: true,
      emailVerified: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastLoginAt: serverTimestamp()
    })

    // Create detailed BJJ coach profile
    await setDoc(doc(db, 'coaches', coachDocId), {
      uid: coachDocId,
      email: JOSEPH_COACH_EMAIL,
      displayName: 'Joseph Llanes',
      slug: 'joseph-llanes-bjj',
      sport: 'BJJ',
      bio: 'BJJ Blue Belt with 3 years of experience specializing in ground game and self-defense. Passionate about teaching fundamental techniques and building strong foundations for students of all levels.',
      tagline: 'Blue Belt BJJ Coach - Building Strong Foundations',
      certifications: ['BJJ Blue Belt'],
      specialties: ['Brazilian Jiu-Jitsu', 'Ground Game', 'Self-Defense', 'Fundamentals'],
      experience: '3 years of coaching experience',
      headshotUrl: coachPhotoURL,
      profileImageUrl: coachPhotoURL,
      heroImageUrl: null,
      verified: true,
      status: 'approved',
      isActive: true,
      featured: false,
      onboardingComplete: true,
      stats: {
        totalAthletes: 0,
        totalContent: 0,
        avgRating: 0,
        totalReviews: 0,
        totalLessons: 0,
        totalRevenue: 0
      },
      socialLinks: {
        website: null,
        instagram: null,
        youtube: null,
        tiktok: null,
        twitter: null,
        linkedin: null
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      approvedAt: serverTimestamp(),
      approvedBy: josephDocId
    })

    console.log('✅ Joseph coach account created')
    console.log('   Email:', JOSEPH_COACH_EMAIL)
    console.log('   Sport: BJJ (Blue Belt)')
    console.log('   Experience: 3 years')
    console.log('   Profile Photo: Set')
    console.log('   Can now send invites and create lessons')

    // STEP 6: Summary
    console.log('\n📊 SUMMARY')
    console.log('=' .repeat(60))
    console.log('✅ Database purged and reset')
    console.log('\nAccounts created:')
    console.log('  👑 joseph@crucibleanalytics.dev (superadmin)')
    console.log('  🎓 llanes.joseph.m@gmail.com (coach)')
    console.log('\nDatabase is now a CLEAN SLATE')
    console.log('  - No mock data')
    console.log('  - No test accounts')
    console.log('  - Ready for real users')
    console.log('\n5-Role System Active:')
    console.log('  - athlete')
    console.log('  - coach')
    console.log('  - assistant')
    console.log('  - admin')
    console.log('  - superadmin')
    console.log('=' .repeat(60))

    console.log('\n🎉 SUCCESS!')
    console.log('\n📝 Next Steps:')
    console.log('  1. Sign in as llanes.joseph.m@gmail.com to test coach features')
    console.log('  2. Create lessons and content')
    console.log('  3. Send athlete invitations')
    console.log('  4. Jasmine\'s coach card is hard-coded (shows even before signup)')
    console.log('  5. Real users can now sign up and get proper roles')

  } catch (error) {
    console.error('\n❌ ERROR')
    console.error(error)
  }
})();
