/**
 * SIMPLE SEED SCRIPT
 * Just paste and run - will keep trying to find your auth
 */

(async function() {
  console.log('🌱 SEEDING...')

  const SUPERADMIN_EMAIL = 'joseph@crucibleanalytics.dev'
  const JOSEPH_COACH_EMAIL = 'llanes.joseph.m@gmail.com'

  try {
    const { initializeApp, getApps } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js')
    const { getAuth } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js')
    const { getFirestore, doc, setDoc, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js')

    const config = {
      apiKey: "AIzaSyDKsNX2gTjjx2bXYzVaKG-S_aME-LIQ8E4",
      authDomain: "playbookd.crucibleanalytics.dev",
      projectId: "gameplan-787a2",
      storageBucket: "gameplan-db782.firebasestorage.app",
      messagingSenderId: "433718828016",
      appId: "1:433718828016:web:2f76f6f3c3179c91e0aa7c"
    }

    let app = getApps()[0] || initializeApp(config)
    const auth = getAuth(app)
    const db = getFirestore(app)

    // Wait up to 30 seconds for auth
    console.log('⏳ Looking for your authentication...')
    let user = null
    for (let i = 0; i < 60; i++) {
      user = auth.currentUser
      if (user) {
        console.log(`✅ Found you: ${user.email}`)
        break
      }
      console.log(`⏳ Waiting... (${i + 1}/60)`)
      await new Promise(r => setTimeout(r, 500))
    }

    if (!user) {
      throw new Error('Could not find authenticated user. Make sure you see your profile in top-right corner.')
    }

    console.log('👑 Creating superadmin...')
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || 'Joseph Llanes',
      photoURL: user.photoURL,
      role: 'superadmin',
      onboardingComplete: true,
      emailVerified: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })

    console.log('🥋 Creating BJJ coach...')
    const coachId = 'joseph-coach-account'
    const photo = 'https://res.cloudinary.com/dr0jtjwlh/image/upload/v1759857380/DSC_0989_s9kw3x.jpg'

    await setDoc(doc(db, 'users', coachId), {
      uid: coachId,
      email: JOSEPH_COACH_EMAIL,
      displayName: 'Joseph Llanes',
      photoURL: photo,
      role: 'coach',
      onboardingComplete: true,
      emailVerified: true,
      createdAt: serverTimestamp()
    })

    await setDoc(doc(db, 'coaches', coachId), {
      uid: coachId,
      email: JOSEPH_COACH_EMAIL,
      displayName: 'Joseph Llanes',
      slug: 'joseph-llanes-bjj',
      sport: 'BJJ',
      bio: 'BJJ Blue Belt with 3 years of experience specializing in ground game and self-defense. Passionate about teaching fundamental techniques and building strong foundations for students of all levels.',
      tagline: 'Blue Belt BJJ Coach - Building Strong Foundations',
      certifications: ['BJJ Blue Belt'],
      specialties: ['Brazilian Jiu-Jitsu', 'Ground Game', 'Self-Defense', 'Fundamentals'],
      experience: '3 years of coaching experience',
      headshotUrl: photo,
      profileImageUrl: photo,
      verified: true,
      status: 'approved',
      isActive: true,
      stats: { totalAthletes: 0, totalContent: 0 },
      createdAt: serverTimestamp(),
      approvedBy: user.uid
    })

    console.log('\n✅ DONE!')
    console.log('👑 joseph@crucibleanalytics.dev (superadmin)')
    console.log('🥋 llanes.joseph.m@gmail.com (BJJ coach)')
    console.log('\n🔄 REFRESH THE PAGE NOW')

  } catch (error) {
    console.error('❌', error.message)
  }
})();
