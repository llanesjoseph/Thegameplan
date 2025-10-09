/**
 * FIREBASE CLI SEED SCRIPT (TOKEN-BASED)
 * Run with: node scripts/seed-with-token.js
 */

const { initializeApp } = require('firebase/app');
const { getAuth, signInWithCustomToken } = require('firebase/auth');
const { getFirestore, doc, setDoc, serverTimestamp } = require('firebase/firestore');

const SUPERADMIN_EMAIL = 'joseph@crucibleanalytics.dev';
const JOSEPH_COACH_EMAIL = 'llanes.joseph.m@gmail.com';

const firebaseConfig = {
  apiKey: "AIzaSyDKgnOZaAZIBSR8e1OilhW-cp5TxY3ewxE",
  authDomain: "gameplan-787a2.firebaseapp.com",
  projectId: "gameplan-787a2",
  storageBucket: "gameplan-787a2.firebasestorage.app",
  messagingSenderId: "301349049756",
  appId: "1:301349049756:web:c3091e3966de56117ae459"
};

async function seed() {
  console.log('🌱 Starting seed process...');

  try {
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    console.log('📝 Creating BJJ coach...');
    const coachId = 'joseph-coach-account';
    const photo = 'https://res.cloudinary.com/dr0jtjwlh/image/upload/v1759857380/DSC_0989_s9kw3x.jpg';

    // Create coach user document
    await setDoc(doc(db, 'users', coachId), {
      uid: coachId,
      email: JOSEPH_COACH_EMAIL,
      displayName: 'Joseph Llanes',
      photoURL: photo,
      role: 'coach',
      onboardingComplete: true,
      emailVerified: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    // Create coach profile
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
      createdAt: serverTimestamp()
    });

    console.log('\n✅ SEED COMPLETED SUCCESSFULLY!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🥋 BJJ Coach:', JOSEPH_COACH_EMAIL);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n🔄 Refresh your app to see the changes!');

  } catch (error) {
    console.error('\n❌ SEED FAILED:', error.message);
    console.error(error);
    process.exit(1);
  }

  process.exit(0);
}

seed();
