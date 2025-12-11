/**
 * FIREBASE CLI SEED SCRIPT
 * Run with: node scripts/seed-cli.js
 * Requires: Firebase Admin SDK credentials
 */

const admin = require('firebase-admin');

const SUPERADMIN_EMAIL = 'joseph@crucibleanalytics.dev';
const JOSEPH_COACH_EMAIL = 'llanes.joseph.m@gmail.com';

async function seed() {
  console.log('🌱 Starting seed process...');

  try {
    // Initialize Firebase Admin with service account
    if (!admin.apps.length) {
      const serviceAccount = require('../serviceAccountKey.json');
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: 'gameplan-787a2'
      });
    }

    const db = admin.firestore();
    db.settings({ ignoreUndefinedProperties: true });
    const auth = admin.auth();

    // Get or create superadmin user in Auth
    console.log('👑 Setting up superadmin user...');
    let superadminAuthUser;
    try {
      superadminAuthUser = await auth.getUserByEmail(SUPERADMIN_EMAIL);
      console.log(`✅ Found existing auth user: ${SUPERADMIN_EMAIL}`);
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        console.log(`Creating auth user: ${SUPERADMIN_EMAIL}`);
        superadminAuthUser = await auth.createUser({
          email: SUPERADMIN_EMAIL,
          displayName: 'Joseph Llanes',
          emailVerified: true
        });
      } else {
        throw error;
      }
    }

    // Create superadmin Firestore document
    console.log('📝 Creating superadmin Firestore document...');
    await db.collection('users').doc(superadminAuthUser.uid).set({
      uid: superadminAuthUser.uid,
      email: SUPERADMIN_EMAIL,
      displayName: 'Joseph Llanes',
      photoURL: superadminAuthUser.photoURL || null,
      role: 'superadmin',
      onboardingComplete: true,
      emailVerified: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    // Create BJJ coach
    console.log('🥋 Setting up BJJ coach...');
    const coachId = 'joseph-coach-account';
    const photo = 'https://res.cloudinary.com/dr0jtjwlh/image/upload/v1759857380/DSC_0989_s9kw3x.jpg';

    // Create coach user document
    await db.collection('users').doc(coachId).set({
      uid: coachId,
      email: JOSEPH_COACH_EMAIL,
      displayName: 'Joseph Llanes',
      photoURL: photo,
      role: 'coach',
      onboardingComplete: true,
      emailVerified: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    // Create coach profile
    await db.collection('coaches').doc(coachId).set({
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
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      approvedBy: superadminAuthUser.uid
    }, { merge: true });

    console.log('\n✅ SEED COMPLETED SUCCESSFULLY!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('👑 Superadmin:', SUPERADMIN_EMAIL);
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
