/**
 * BROWSER CONSOLE DIAGNOSTIC SCRIPT
 *
 * Run this in your browser console while logged in to diagnose auth/role issues
 *
 * Instructions:
 * 1. Open browser console (F12)
 * 2. Copy and paste this entire script
 * 3. Press Enter
 * 4. Share the output
 */

(async function diagnoseAuth() {
  console.log('\n🔍 AUTH & ROLE DIAGNOSTICS\n' + '='.repeat(60));

  try {
    // Get Firebase auth instance
    const { auth, db } = await import('/lib/firebase.client');
    const { getDoc, doc } = await import('firebase/firestore');

    // Check current auth state
    const currentUser = auth.currentUser;

    if (!currentUser) {
      console.log('❌ No user is currently signed in!');
      console.log('   Please sign in and run this script again.');
      return;
    }

    console.log('\n✅ AUTHENTICATED USER:');
    console.log('='.repeat(60));
    console.log('UID:', currentUser.uid);
    console.log('Email:', currentUser.email);
    console.log('Display Name:', currentUser.displayName || 'Not set');
    console.log('Email Verified:', currentUser.emailVerified);

    // Get ID token to check custom claims
    console.log('\n🎫 ID TOKEN CLAIMS:');
    console.log('='.repeat(60));
    try {
      const idTokenResult = await currentUser.getIdTokenResult();
      console.log('Token issued at:', new Date(idTokenResult.issuedAtTime));
      console.log('Token expires at:', new Date(idTokenResult.expirationTime));
      console.log('Custom claims:', idTokenResult.claims);
      if (idTokenResult.claims.role) {
        console.log('✅ Role in token:', idTokenResult.claims.role);
      } else {
        console.log('⚠️  No role claim in token');
      }
    } catch (error) {
      console.error('❌ Error getting ID token:', error);
    }

    // Check Firestore user document
    console.log('\n📄 FIRESTORE USER DOCUMENT:');
    console.log('='.repeat(60));
    console.log('Checking: users/' + currentUser.uid);

    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        console.log('✅ Document exists!');
        console.log('Data:', JSON.stringify(userData, null, 2));
        console.log('\nRole in Firestore:', userData.role || 'NOT SET');
      } else {
        console.log('❌ User document does NOT exist in Firestore!');
        console.log('   This is the problem - the document needs to be created.');
      }
    } catch (error) {
      console.error('❌ Error reading Firestore document:', error);
      console.error('   This might be a security rules issue or connection problem.');
      console.error('   Error details:', error.message);
    }

    // Check if useAuth hook has the role
    console.log('\n🪝 REACT HOOK STATE:');
    console.log('='.repeat(60));

    // Try to access the store
    try {
      const storeModule = await import('/lib/store');
      const store = storeModule.useAppStore.getState();
      console.log('Store user:', store.firebaseUser?.email || 'Not set');
      console.log('Store has user:', !!store.firebaseUser);
    } catch (error) {
      console.log('⚠️  Could not access app store:', error.message);
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ DIAGNOSTICS COMPLETE');
    console.log('='.repeat(60));
    console.log('\nIf you see any ❌ errors above, those indicate the problem.');
    console.log('Copy all the output above and share it for help.\n');

  } catch (error) {
    console.error('❌ FATAL ERROR running diagnostics:', error);
    console.error('Full error:', error);
  }
})();
