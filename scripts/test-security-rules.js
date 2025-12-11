const { initializeApp } = require('firebase/app');
const { getFirestore, connectFirestoreEmulator, doc, getDoc, setDoc, collection, addDoc } = require('firebase/firestore');
const { getAuth, connectAuthEmulator, signInWithEmailAndPassword, createUserWithEmailAndPassword } = require('firebase/auth');

// Firebase config
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

console.log('🔍 Testing Firebase Security Rules...\n');

async function testSecurityRules() {
  try {
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    const auth = getAuth(app);

    console.log('✅ Firebase initialized successfully');

    // Test 1: Anonymous access (should be denied for most operations)
    console.log('\n🧪 Test 1: Anonymous Access');
    try {
      const testDoc = doc(db, 'users', 'test-user');
      await getDoc(testDoc);
      console.log('❌ ERROR: Anonymous access should be denied');
    } catch (error) {
      if (error.code === 'permission-denied') {
        console.log('✅ Anonymous access properly denied');
      } else {
        console.log('⚠️  Unexpected error:', error.message);
      }
    }

    // Test 2: Test user creation (should work)
    console.log('\n🧪 Test 2: User Creation');
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, 'test@example.com', 'testpassword123');
      console.log('✅ Test user created successfully');
      
      // Test 3: Authenticated user reading their own data
      console.log('\n🧪 Test 3: Authenticated User Access');
      const userDoc = doc(db, 'users', userCredential.user.uid);
      await setDoc(userDoc, {
        uid: userCredential.user.uid,
        email: 'test@example.com',
        role: 'user',
        createdAt: new Date()
      });
      console.log('✅ User document created successfully');

      const userData = await getDoc(userDoc);
      if (userData.exists()) {
        console.log('✅ User can read their own data');
      } else {
        console.log('❌ User cannot read their own data');
      }

      // Test 4: Test contributor application creation
      console.log('\n🧪 Test 4: Contributor Application');
      try {
        const applicationRef = await addDoc(collection(db, 'contributorApplications'), {
          userId: userCredential.user.uid,
          email: 'test@example.com',
          status: 'pending',
          createdAt: new Date()
        });
        console.log('✅ Contributor application created successfully');
      } catch (error) {
        console.log('❌ Contributor application failed:', error.message);
      }

      // Cleanup
      await userCredential.user.delete();
      console.log('✅ Test user cleaned up');

    } catch (error) {
      console.log('❌ User creation failed:', error.message);
    }

    console.log('\n🎉 Security rules testing completed!');

  } catch (error) {
    console.error('❌ Firebase initialization failed:', error.message);
  }
}

// Load environment variables
require('dotenv').config({ path: '.env.local' });

testSecurityRules();
