// Quick test to verify Firebase Admin credentials
const { initializeApp, getApps, cert } = require('firebase-admin/app');

console.log('\n🔍 Testing Firebase Admin Credentials...\n');

console.log('FIREBASE_CLIENT_EMAIL:', process.env.FIREBASE_CLIENT_EMAIL ? '✅ SET' : '❌ NOT SET');
console.log('FIREBASE_PRIVATE_KEY:', process.env.FIREBASE_PRIVATE_KEY ? '✅ SET (length: ' + process.env.FIREBASE_PRIVATE_KEY.length + ')' : '❌ NOT SET');

if (getApps().length === 0) {
  try {
    if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
      const app = initializeApp({
        credential: cert({
          projectId: 'gameplan-787a2',
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
        projectId: 'gameplan-787a2',
      });
      console.log('\n✅ Firebase Admin initialized successfully!');
      console.log('App name:', app.name);
      process.exit(0);
    } else {
      console.log('\n❌ Missing credentials in environment');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Firebase Admin initialization failed:', error.message);
    process.exit(1);
  }
}
