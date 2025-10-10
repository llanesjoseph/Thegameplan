// Quick script to fix user role in Firestore
// Run this to update bigpenger@gmail.com from 'user' to 'coach'

const admin = require('firebase-admin');

// Initialize Firebase Admin using environment variables (same as lib/firebase.admin.ts)
if (!admin.apps.length) {
  try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: 'gameplan-787a2'
      });
    } else if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: 'gameplan-787a2',
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
        }),
        projectId: 'gameplan-787a2'
      });
    } else {
      admin.initializeApp({ projectId: 'gameplan-787a2' });
    }
    console.log('✅ Firebase Admin initialized');
  } catch (error) {
    console.error('❌ Failed to initialize Firebase Admin:', error.message);
    process.exit(1);
  }
}

const db = admin.firestore();

async function fixUserRole() {
  try {
    console.log('🔍 Searching for user: bigpenger@gmail.com');

    // Query users collection for this email
    const usersSnapshot = await db.collection('users')
      .where('email', '==', 'bigpenger@gmail.com')
      .limit(1)
      .get();

    if (usersSnapshot.empty) {
      console.log('❌ User not found');
      return;
    }

    const userDoc = usersSnapshot.docs[0];
    const userData = userDoc.data();

    console.log('📋 Current user data:', {
      uid: userDoc.id,
      email: userData.email,
      role: userData.role,
      displayName: userData.displayName
    });

    // Update role to 'coach'
    await db.collection('users').doc(userDoc.id).update({
      role: 'coach',
      roleUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
      roleUpdateReason: 'Manual fix - upgraded from user to coach'
    });

    console.log('✅ User role updated to: coach');
    console.log('🎉 Done! User should now be able to access the dashboard.');
    console.log('👉 Next step: Sign out and sign back in to see the changes');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code) {
      console.error('Error code:', error.code);
    }
    process.exit(1);
  }
}

fixUserRole();
