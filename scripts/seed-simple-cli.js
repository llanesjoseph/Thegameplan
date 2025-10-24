/**
 * SIMPLE CLI SEED - Just creates the coach profile
 */

const admin = require('firebase-admin');

const JOSEPH_COACH_EMAIL = 'llanes.joseph.m@gmail.com';

async function seed() {
  console.log('🌱 Starting simple seed...');

  try {
    // Initialize Firebase Admin
    const serviceAccount = require('../serviceAccountKey.json');
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });

    const db = admin.firestore();

    console.log('🥋 Creating BJJ coach profile...');
    const coachId = 'joseph-coach-account';
    const photo = 'https://res.cloudinary.com/dr0jtjwlh/image/upload/v1759857380/DSC_0989_s9kw3x.jpg';
    const now = admin.firestore.Timestamp.now();

    // Create coach user document
    console.log('  → Writing to users/' + '[COACH_ID]');
    await db.collection('users').doc(coachId).set({
      uid: coachId,
      email: JOSEPH_COACH_EMAIL,
      displayName: 'Joseph Llanes',
      photoURL: photo,
      role: 'coach',
      onboardingComplete: true,
      emailVerified: true,
      createdAt: now,
      updatedAt: now
    });
    console.log('  ✓ User document created');

    // Create coach profile
    console.log('  → Writing to coaches/' + '[COACH_ID]');
    await db.collection('coaches').doc(coachId).set({
      uid: coachId,
      email: JOSEPH_COACH_EMAIL,
      displayName: 'Joseph Llanes',
      slug: 'joseph-llanes-bjj',
      sport: 'BJJ',
      bio: 'BJJ Blue Belt with 3 years of experience specializing in ground game and self-defense.',
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
      createdAt: now
    });
    console.log('  ✓ Coach profile created');

    console.log('\n✅ SEED COMPLETED!');
    console.log('🥋 BJJ Coach: ' + JOSEPH_COACH_EMAIL);
    console.log('\n🔄 Refresh your app now!');

  } catch (error) {
    console.error('\n❌ FAILED:', error.message);
    if (error.details) console.error('Details:', error.details);
    process.exit(1);
  }

  process.exit(0);
}

seed();
