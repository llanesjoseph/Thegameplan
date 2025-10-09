/**
 * PRODUCTION SEED SCRIPT - CLEAN SLATE (Fixed for existing Firebase instance)
 *
 * Run this AFTER manually deleting database in Firebase Console
 * Run on: https://playbookd.crucibleanalytics.dev/dashboard
 * Must be logged in as: joseph@crucibleanalytics.dev
 *
 * What this creates:
 * 1. joseph@crucibleanalytics.dev (superadmin)
 * 2. llanes.joseph.m@gmail.com (BJJ coach with complete profile)
 * 3. NO MOCK DATA - ready for real users
 */

(async function() {
  console.log('🌱 SEEDING PRODUCTION DATABASE')
  console.log('='.repeat(60))
  console.log('Creating clean production data...')
  console.log('='.repeat(60))

  const SUPERADMIN_EMAIL = 'joseph@crucibleanalytics.dev'
  const JOSEPH_COACH_EMAIL = 'llanes.joseph.m@gmail.com'

  try {
    // Import Firebase modules from CDN
    const { getAuth } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js')
    const {
      getFirestore,
      doc,
      setDoc,
      serverTimestamp
    } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js')

    // Get the EXISTING Firebase app instance from the window
    const app = window.__app || (window.firebase && window.firebase.apps && window.firebase.apps[0])

    if (!app) {
      throw new Error('Firebase app not found. Make sure you are on the dashboard page.')
    }

    const auth = getAuth(app)
    const db = getFirestore(app)

    console.log('✅ Using existing Firebase instance')

    // STEP 1: Verify logged in as Joseph
    console.log('\n📋 STEP 1: Verifying access...')
    const currentUser = auth.currentUser

    if (!currentUser) {
      throw new Error('Not logged in! Please sign in as joseph@crucibleanalytics.dev')
    }

    if (currentUser.email !== SUPERADMIN_EMAIL) {
      throw new Error(`Must be logged in as ${SUPERADMIN_EMAIL}. You are: ${currentUser.email}`)
    }

    console.log(`✅ Logged in as: ${currentUser.email}`)
    console.log(`   UID: ${currentUser.uid}`)

    // STEP 2: Create Joseph superadmin account
    console.log('\n👑 STEP 2: Creating superadmin account...')

    const josephDocId = currentUser.uid

    await setDoc(doc(db, 'users', josephDocId), {
      uid: josephDocId,
      email: SUPERADMIN_EMAIL,
      displayName: currentUser.displayName || 'Joseph Llanes',
      photoURL: currentUser.photoURL || null,
      role: 'superadmin',
      onboardingComplete: true,
      emailVerified: currentUser.emailVerified || false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastLoginAt: serverTimestamp()
    })

    console.log('✅ Joseph superadmin account created')
    console.log(`   Email: ${SUPERADMIN_EMAIL}`)
    console.log(`   Role: superadmin`)
    console.log(`   UID: ${josephDocId}`)

    // STEP 3: Create Joseph coach account with complete BJJ profile
    console.log('\n🥋 STEP 3: Creating BJJ coach account...')

    const coachDocId = 'joseph-coach-account'
    const coachPhotoURL = 'https://res.cloudinary.com/dr0jtjwlh/image/upload/v1759857380/DSC_0989_s9kw3x.jpg'

    // Create user account
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

    // Create detailed coach profile
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
        linkedin: null
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      approvedAt: serverTimestamp(),
      approvedBy: josephDocId
    })

    console.log('✅ Joseph coach account created')
    console.log(`   Email: ${JOSEPH_COACH_EMAIL}`)
    console.log(`   Sport: BJJ`)
    console.log(`   Belt: Blue Belt`)
    console.log(`   Experience: 3 years`)
    console.log(`   Profile Photo: ✓ Set`)
    console.log(`   Status: Approved & Active`)
    console.log(`   Can now: Create lessons, send invites, manage athletes`)

    // STEP 4: Summary
    console.log('\n📊 PRODUCTION DATABASE SEEDED')
    console.log('='.repeat(60))
    console.log('✅ Clean production database ready')
    console.log('\nAccounts created:')
    console.log('  👑 joseph@crucibleanalytics.dev (superadmin)')
    console.log('  🥋 llanes.joseph.m@gmail.com (BJJ Blue Belt coach)')
    console.log('\nDatabase state:')
    console.log('  ✓ No mock data')
    console.log('  ✓ No test accounts')
    console.log('  ✓ Ready for real users')
    console.log('\n5-Role System Active:')
    console.log('  - athlete')
    console.log('  - coach')
    console.log('  - assistant')
    console.log('  - admin')
    console.log('  - superadmin')
    console.log('='.repeat(60))

    console.log('\n🎉 SUCCESS!')
    console.log('\n📝 Next Steps:')
    console.log('  1. Refresh the page')
    console.log('  2. Sign in as llanes.joseph.m@gmail.com to test coach features')
    console.log('  3. Create first lesson')
    console.log('  4. Send athlete invitations')
    console.log('  5. Real users can now sign up!')
    console.log('\n🚀 Your app is ready for production!')

  } catch (error) {
    console.error('\n❌ ERROR')
    console.error(error)
    console.error('\nTroubleshooting:')
    console.error('  - Make sure you are on: https://playbookd.crucibleanalytics.dev/dashboard')
    console.error('  - Ensure you are logged in as: joseph@crucibleanalytics.dev')
    console.error('  - Verify you manually deleted the database in Firebase Console')
  }
})();
