/**
 * CREATE SUPERADMIN + COACH VIA FIREBASE CLI
 * Run with: node scripts/create-coach-cli.js
 *
 * Make sure you have the service account key at the project root!
 */

const admin = require('firebase-admin');

const SUPERADMIN_EMAIL = 'joseph@crucibleanalytics.dev';
const JOSEPH_COACH_EMAIL = 'llanes.joseph.m@gmail.com';
const COACH_ID = 'joseph-coach-account';
const PHOTO_URL = 'https://res.cloudinary.com/dr0jtjwlh/image/upload/v1759857380/DSC_0989_s9kw3x.jpg';

async function seedDatabase() {
  console.log('🚀 Seeding database with superadmin + coach...\n');

  try {
    // Initialize Firebase Admin with service account
    const serviceAccount = require('../serviceAccountKey.json');
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: 'https://gameplan-787a2.firebaseio.com'
    });

    const db = admin.firestore();
    const auth = admin.auth();
    const now = admin.firestore.Timestamp.now();

    // ===== CREATE SUPERADMIN =====
    console.log('👑 Step 1: Creating superadmin in Auth...');
    let superadminUser;
    try {
      superadminUser = await auth.getUserByEmail(SUPERADMIN_EMAIL);
      console.log('   ✓ Auth user already exists:', SUPERADMIN_EMAIL);
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        superadminUser = await auth.createUser({
          email: SUPERADMIN_EMAIL,
          displayName: 'Joseph Llanes',
          emailVerified: true
        });
        console.log('   ✓ Created auth user:', SUPERADMIN_EMAIL);
      } else {
        throw error;
      }
    }

    console.log('👑 Step 2: Creating users/' + superadminUser.uid);
    await db.collection('users').doc(superadminUser.uid).set({
      uid: superadminUser.uid,
      email: SUPERADMIN_EMAIL,
      displayName: 'Joseph Llanes',
      photoURL: superadminUser.photoURL || null,
      role: 'superadmin',
      onboardingComplete: true,
      emailVerified: true,
      createdAt: now,
      updatedAt: now
    });
    console.log('   ✓ Superadmin document created\n');

    // ===== CREATE COACH =====
    console.log('🥋 Step 3: Creating users/' + COACH_ID);
    await db.collection('users').doc(COACH_ID).set({
      uid: COACH_ID,
      email: JOSEPH_COACH_EMAIL,
      displayName: 'Joseph Llanes',
      photoURL: PHOTO_URL,
      role: 'coach',
      onboardingComplete: true,
      emailVerified: true,
      createdAt: now,
      updatedAt: now
    });
    console.log('   ✓ Coach user document created');

    console.log('🥋 Step 4: Creating coaches/' + COACH_ID);
    await db.collection('coaches').doc(COACH_ID).set({
      uid: COACH_ID,
      email: JOSEPH_COACH_EMAIL,
      displayName: 'Joseph Llanes',
      slug: 'joseph-llanes-bjj',
      sport: 'BJJ',
      bio: 'BJJ Blue Belt with 3 years of experience specializing in ground game and self-defense. Passionate about teaching fundamental techniques and building strong foundations for students of all levels.',
      tagline: 'Blue Belt BJJ Coach - Building Strong Foundations',
      certifications: ['BJJ Blue Belt'],
      specialties: ['Brazilian Jiu-Jitsu', 'Ground Game', 'Self-Defense', 'Fundamentals'],
      experience: '3 years of coaching experience',
      headshotUrl: PHOTO_URL,
      profileImageUrl: PHOTO_URL,
      verified: true,
      status: 'approved',
      isActive: true,
      stats: { totalAthletes: 0, totalContent: 0 },
      createdAt: now,
      approvedBy: superadminUser.uid
    });
    console.log('   ✓ Coach profile created\n');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ SUCCESS! Database seeded:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('👑 Superadmin:', SUPERADMIN_EMAIL);
    console.log('🥋 Coach:', JOSEPH_COACH_EMAIL);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('🔄 Now deploy the fixed security rules:');
    console.log('   firebase deploy --only firestore:rules\n');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  }

  process.exit(0);
}

seedDatabase();
