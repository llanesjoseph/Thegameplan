/**
 * Browser Console Script to Change Joseph's Role to Coach/Creator
 *
 * Instructions:
 * 1. Open your Game Plan app in browser while signed in as llanes.joseph.m@gmail.com
 * 2. Open browser console (F12)
 * 3. Paste this entire script and press Enter
 * 4. The script will automatically detect your UID and set role to 'creator'
 */

async function setJosephAsCoach() {
  try {
    console.log('🚀 Setting Joseph\'s role to coach/creator...');

    // Check if user is signed in
    if (!window.firebase || !firebase.auth().currentUser) {
      console.error('❌ Please sign in to the platform first');
      return;
    }

    const currentUser = firebase.auth().currentUser;
    const userEmail = currentUser.email;
    const userId = currentUser.uid;

    // Verify this is Joseph's account
    if (userEmail !== 'llanes.joseph.m@gmail.com') {
      console.error('❌ This script is only for llanes.joseph.m@gmail.com');
      console.log(`Current user: ${userEmail}`);
      return;
    }

    console.log(`✅ Authenticated as ${userEmail} (${userId})`);

    // Get Firestore reference
    const db = firebase.firestore();

    // Update user role to creator (coach)
    await db.collection('users').doc(userId).set({
      role: 'creator',
      email: userEmail,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      creatorStatus: 'approved',
      permissions: {
        canCreateContent: true,
        canManageContent: true,
        canAccessAnalytics: true,
        canReceivePayments: true
      }
    }, { merge: true });

    console.log('✅ Role updated to creator (coach)');

    // Also update in creator_profiles collection if it exists
    try {
      await db.collection('creator_profiles').doc(userId).set({
        displayName: currentUser.displayName || 'Joseph Llanes',
        email: userEmail,
        role: 'creator',
        isActive: true,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

      console.log('✅ Creator profile updated');
    } catch (error) {
      console.log('ℹ️ Creator profile update optional:', error.message);
    }

    console.log(`
🎉 SUCCESS! Joseph is now set up as a Coach/Creator!
================================================
✅ Role: creator (coach)
✅ Email: ${userEmail}
✅ UID: ${userId}
✅ Creator permissions enabled

You can now access:
• Coach dashboard features
• Content creation tools
• Student management
• All creator capabilities

Please refresh the page to see the changes!
    `);

    // Optional: Refresh the page after 3 seconds
    setTimeout(() => {
      console.log('🔄 Refreshing page to apply changes...');
      window.location.reload();
    }, 3000);

  } catch (error) {
    console.error('❌ Error setting coach role:', error);
    console.log('💡 Make sure you\'re signed in as llanes.joseph.m@gmail.com');
  }
}

// Instructions
console.log(`
🚀 Joseph Coach Role Setup Ready!
===============================

This script will change your role from 'user' to 'creator' (coach).

To run: setJosephAsCoach()

Requirements:
• Must be signed in as llanes.joseph.m@gmail.com
• Must have internet connection
• Page will refresh automatically after update
`);

// Make function globally available
window.setJosephAsCoach = setJosephAsCoach;

// Auto-run if user wants
console.log('To run automatically now, type: setJosephAsCoach()');