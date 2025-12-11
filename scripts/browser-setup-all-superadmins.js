/**
 * Browser Console Script for All Three Superadmin Setup
 * 
 * Instructions:
 * 1. Have all three users sign in at least once to create Firebase Auth records
 * 2. Get their UIDs from Firebase Console > Authentication
 * 3. Open browser console (F12) on your Game Plan app
 * 4. Paste this entire script and press Enter
 * 5. Run: setupAllSuperadmins(josephUID, lonaUID, merlineUID)
 */

async function setupAllSuperadmins(josephUID, lonaUID, merlineUID) {
  const users = [
    {
      uid: josephUID,
      firstName: 'Joseph',
      lastName: 'Admin',
      email: 'joseph@crucibleanalytics.dev',
      bio: 'Platform Administrator and Content Creator',
      expertise: ['platform-management', 'content-strategy', 'user-experience', 'analytics'],
      contentDescription: 'Educational content focused on platform usage, content creation best practices, and system optimization.',
      achievements: ['Platform Development', 'Content Strategy', 'User Experience Design'],
      certifications: ['Firebase Certified', 'Web Development']
    },
    {
      uid: lonaUID,
      firstName: 'Lona',
      lastName: 'Vincent',
      email: 'LonaLorraine.Vincent@gmail.com',
      bio: 'Platform Administrator and Content Strategist',
      expertise: ['content-strategy', 'user-management', 'platform-operations', 'community-building'],
      contentDescription: 'Strategic content focused on user engagement, community building, and platform optimization.',
      achievements: ['Content Strategy', 'User Management', 'Community Building'],
      certifications: ['Digital Marketing', 'Community Management']
    },
    {
      uid: merlineUID,
      firstName: 'Merline',
      lastName: 'Saintil',
      email: 'merlinesaintil@gmail.com',
      bio: 'Platform Administrator and Operations Manager',
      expertise: ['operations-management', 'user-experience', 'content-moderation', 'quality-assurance'],
      contentDescription: 'Operational content focused on platform efficiency, user experience, and quality standards.',
      achievements: ['Operations Management', 'UX Optimization', 'Quality Assurance'],
      certifications: ['Operations Management', 'UX Design']
    }
  ];

  // Validate UIDs
  const missingUIDs = [];
  if (!josephUID || josephUID.includes('UID')) missingUIDs.push('Joseph');
  if (!lonaUID || lonaUID.includes('UID')) missingUIDs.push('Lona');
  if (!merlineUID || merlineUID.includes('UID')) missingUIDs.push('Merline');

  if (missingUIDs.length > 0) {
    console.error(`❌ Missing UIDs for: ${missingUIDs.join(', ')}`);
    console.log('💡 Get UIDs from Firebase Console > Authentication after users sign in');
    return;
  }

  try {
    // Import Firebase from your app
    const { db } = await import('/lib/firebase.client.js');
    const { serverTimestamp, addDoc, collection, doc, setDoc } = await import('firebase/firestore');

    console.log('🚀 Setting up all three superadmins...');

    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      console.log(`\n👤 Setting up ${user.firstName} ${user.lastName}...`);

      // Step 1: Set superadmin role
      await setDoc(doc(db, 'users', user.uid), {
        role: 'superadmin',
        email: user.email,
        lastUpdatedAt: serverTimestamp(),
        creatorStatus: 'approved',
        permissions: {
          canCreateContent: true,
          canManageContent: true,
          canAccessAnalytics: true,
          canReceivePayments: true,
          canSwitchRoles: true,
          canManageUsers: true
        }
      }, { merge: true });

      console.log(`  ✅ Superadmin role set for ${user.firstName}`);

      // Step 2: Create profile
      await setDoc(doc(db, 'profiles', user.uid), {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        bio: user.bio,
        expertise: user.expertise,
        sports: ['general-athletics'],
        role: 'superadmin',
        isPublic: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }, { merge: true });

      console.log(`  ✅ Profile created for ${user.firstName}`);

      // Step 3: Create pre-approved contributor application
      await addDoc(collection(db, 'contributorApplications'), {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        primarySport: 'other',
        experience: 'admin',
        experienceDetails: `Platform administrator specializing in ${user.expertise.join(', ')}.`,
        specialties: user.expertise,
        contentTypes: ['platform-tutorials', 'best-practices', 'system-guides', 'analytics-insights'],
        targetAudience: ['creators', 'coaches', 'administrators', 'all-users'],
        contentDescription: user.contentDescription,
        achievements: user.achievements,
        certifications: user.certifications,
        status: 'approved',
        userId: user.uid,
        userEmail: user.email,
        submittedAt: serverTimestamp(),
        reviewedAt: serverTimestamp(),
        reviewerNotes: 'Auto-approved as platform administrator',
        reviewerId: user.uid
      });

      console.log(`  ✅ Contributor application created for ${user.firstName}`);
    }

    console.log(`
🎉 SUCCESS! All three superadmins are now set up:
============================================

👤 Joseph (joseph@crucibleanalytics.dev)
👤 Lona Vincent (LonaLorraine.Vincent@gmail.com)  
👤 Merline Saintil (merlinesaintil@gmail.com)

✅ All have superadmin role with complete access
✅ All have approved creator status
✅ All have complete profiles ready
✅ All have pre-approved contributor applications
✅ All can switch roles and test different user experiences

🎯 They can now access:
• Role switcher in top-right corner
• /dashboard/admin/creator-applications (admin panel)
• /dashboard/creator (creator dashboard)  
• All analytics and management features
• Complete content creation capabilities
• User and application management
• Role switching between all 5 roles (guest, user, creator, admin, superadmin)

🔄 Role Switching:
Each user can now switch between any role to test different parts of the platform:
- Guest: Public-only access
- User: Standard user experience  
- Creator: Content creation dashboard
- Admin: Platform administration
- Superadmin: Complete system access

All three users have TOTAL ACCESS to everything! 🚀
    `);

  } catch (error) {
    console.error('❌ Error setting up superadmins:', error);
    console.log('💡 Make sure you\'re signed in and have the correct UIDs');
  }
}

// Instructions
console.log(`
🚀 All Superadmins Setup Ready!
==============================

Required Steps:
1. Have all three users sign in to the platform first:
   • joseph@crucibleanalytics.dev
   • LonaLorraine.Vincent@gmail.com  
   • merlinesaintil@gmail.com

2. Get their UIDs from Firebase Console > Authentication

3. Run: setupAllSuperadmins(josephUID, lonaUID, merlineUID)

Example:
setupAllSuperadmins(
  'abc123joseph...',
  'def456lona...',
  'ghi789merline...'
)

This will give all three users:
✅ Complete superadmin access
✅ Role switching capabilities  
✅ Total platform control
✅ Content creation access
✅ Admin panel access
✅ Analytics access
✅ User management access
`);

// Make function globally available
window.setupAllSuperadmins = setupAllSuperadmins;
