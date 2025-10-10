/**
 * BROWSER CONSOLE - Check Login Status
 *
 * Copy and paste this into your browser console (F12) while on the dashboard
 * to see exactly what's happening with your login
 */

(async function checkLogin() {
  console.log('\n🔐 LOGIN STATUS CHECK\n' + '='.repeat(60));

  try {
    // Import Firebase
    const { auth, db } = await import('/lib/firebase.client');
    const { getDoc, doc } = await import('firebase/firestore');

    // Check current user
    const currentUser = auth.currentUser;

    if (!currentUser) {
      console.log('❌ NOT SIGNED IN');
      console.log('   Please sign in first');
      return;
    }

    console.log('\n✅ SIGNED IN');
    console.log('='.repeat(60));
    console.log('UID:', currentUser.uid);
    console.log('Email:', currentUser.email);
    console.log('Display Name:', currentUser.displayName);

    // Check Firestore document
    console.log('\n📄 CHECKING FIRESTORE ROLE...');
    console.log('='.repeat(60));

    const userDocRef = doc(db, 'users', currentUser.uid);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      console.log('❌ NO FIRESTORE DOCUMENT FOUND!');
      console.log('   Path checked: users/' + currentUser.uid);
      console.log('   This user needs a Firestore document created');
      return;
    }

    const userData = userDoc.data();
    console.log('✅ Firestore document exists');
    console.log('Role:', userData.role || 'NOT SET');
    console.log('Email:', userData.email || 'NOT SET');
    console.log('Display Name:', userData.displayName || 'NOT SET');

    // Check what URL we're on
    console.log('\n🌐 CURRENT PAGE');
    console.log('='.repeat(60));
    console.log('URL:', window.location.href);
    console.log('Path:', window.location.pathname);

    // Show where they SHOULD be redirected
    console.log('\n🎯 EXPECTED REDIRECT');
    console.log('='.repeat(60));
    const role = userData.role;
    if (role === 'superadmin' || role === 'admin') {
      console.log('✅ Should redirect to: /dashboard/admin');
    } else if (role === 'coach' || role === 'creator' || role === 'assistant' || role === 'user') {
      console.log('✅ Should redirect to: /dashboard/coach-unified');
    } else if (role === 'athlete') {
      console.log('✅ Should redirect to: /dashboard/progress');
    } else {
      console.log('⚠️ Unknown role:', role);
    }

    // Check localStorage/sessionStorage for any redirect blocks
    console.log('\n💾 CHECKING STORAGE');
    console.log('='.repeat(60));
    const redirectKey = `dashboard_redirect_${currentUser.uid}`;
    const lastRedirect = sessionStorage.getItem(redirectKey);
    if (lastRedirect) {
      const timeSince = Date.now() - parseInt(lastRedirect);
      console.log('Last redirect:', new Date(parseInt(lastRedirect)).toLocaleTimeString());
      console.log('Time since:', Math.floor(timeSince / 1000), 'seconds ago');
      if (timeSince < 5000) {
        console.log('⚠️ REDIRECT BLOCKED - less than 5 seconds since last redirect');
        console.log('   This might be preventing proper navigation');
      }
    } else {
      console.log('No redirect block found');
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ CHECK COMPLETE');
    console.log('='.repeat(60));
    console.log('\nIf you see any ❌ errors above, that\'s the problem.');
    console.log('Copy this entire output for debugging.\n');

  } catch (error) {
    console.error('❌ ERROR:', error);
    console.error('Full error:', error);
  }
})();
