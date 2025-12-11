/**
 * Browser Console Script for Joseph Admin Setup
 * 
 * Instructions:
 * 1. Open your Game Plan app in browser
 * 2. Have Joseph sign in first to create his Firebase Auth record
 * 3. Open browser console (F12)
 * 4. Paste this entire script and press Enter
 * 5. Run: setupJosephAsAdmin('JOSEPH_UID_HERE') - replace with his actual UID
 */

async function setupJosephAsAdmin(josephUID) {
  if (!josephUID || josephUID === 'JOSEPH_UID_HERE') {
    console.error('❌ Please provide Joseph\'s actual Firebase UID');
    console.log('💡 Get the UID from Firebase Console > Authentication after Joseph signs in');
    return;
  }

  try {
    // Import Firebase from your app
    const { db } = await import('/lib/firebase.client.js');
    const { serverTimestamp } = await import('firebase/firestore');

    console.log('🚀 Setting up Joseph as superadmin...');

    // Step 1: Set superadmin role
    await db.collection('users').doc(josephUID).set({
      role: 'superadmin',
      email: 'joseph@crucibleanalytics.dev',
      lastUpdatedAt: serverTimestamp(),
      creatorStatus: 'approved',
      permissions: {
        canCreateContent: true,
        canManageContent: true,
        canAccessAnalytics: true,
        canReceivePayments: true
      }
    }, { merge: true });

    console.log('✅ Step 1: Superadmin role set');

    // Step 2: Create profile
    await db.collection('profiles').doc(josephUID).set({
      firstName: 'Joseph',
      lastName: 'Admin',
      email: 'joseph@crucibleanalytics.dev',
      bio: 'Platform Administrator and Content Creator',
      expertise: ['platform-management', 'content-strategy', 'user-experience'],
      sports: ['general-athletics'],
      role: 'superadmin',
      isPublic: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }, { merge: true });

    console.log('✅ Step 2: Profile created');

    // Step 3: Create pre-approved contributor application
    await db.collection('contributorApplications').add({
      firstName: 'Joseph',
      lastName: 'Admin',
      email: 'joseph@crucibleanalytics.dev',
      primarySport: 'other',
      experience: 'admin',
      experienceDetails: 'Platform administrator with comprehensive knowledge of all sports and content creation processes.',
      specialties: ['platform-management', 'content-strategy', 'user-experience', 'analytics', 'system-administration'],
      contentTypes: ['platform-tutorials', 'best-practices', 'system-guides', 'analytics-insights'],
      targetAudience: ['creators', 'coaches', 'administrators', 'all-users'],
      contentDescription: 'Educational content focused on platform usage, content creation best practices, and system optimization.',
      achievements: ['Platform Development', 'Content Strategy', 'User Experience Design'],
      certifications: ['Firebase Certified', 'Web Development'],
      status: 'approved',
      userId: josephUID,
      userEmail: 'joseph@crucibleanalytics.dev',
      submittedAt: serverTimestamp(),
      reviewedAt: serverTimestamp(),
      reviewerNotes: 'Auto-approved as platform administrator',
      reviewerId: josephUID
    });

    console.log('✅ Step 3: Contributor application created');

    console.log(`
🎉 SUCCESS! Joseph is now set up as:
================================
✅ Superadmin with full platform access
✅ Approved content creator
✅ Complete profile ready
✅ Pre-approved contributor application

Joseph can now access:
• /dashboard/admin/creator-applications (admin panel)
• /dashboard/creator (creator dashboard)  
• All analytics and management features
• Full content creation capabilities
    `);

  } catch (error) {
    console.error('❌ Error setting up Joseph:', error);
    console.log('💡 Make sure you\'re signed in and have the correct UID');
  }
}

// Instructions
console.log(`
🚀 Joseph Admin Setup Ready!
============================

Steps:
1. Have Joseph sign in to the platform first
2. Get his UID from Firebase Console > Authentication
3. Run: setupJosephAsAdmin('HIS_ACTUAL_UID_HERE')

Example:
setupJosephAsAdmin('abc123xyz789...')
`);

// Make function globally available
window.setupJosephAsAdmin = setupJosephAsAdmin;
