/**
 * Browser Console Script to Add Missing Superadmins
 *
 * Instructions:
 * 1. Have Lona and Merline sign in first to create Firebase Auth records
 * 2. Get their UIDs from Firebase Console > Authentication
 * 3. Open browser console (F12) on your Game Plan app
 * 4. Paste this script and run: setupMissingSuperadmins(lonaUID, merlineUID)
 */

async function setupMissingSuperadmins(lonaUID, merlineUID) {
  const users = [
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
  if (!lonaUID || lonaUID.includes('UID')) missingUIDs.push('Lona');
  if (!merlineUID || merlineUID.includes('UID')) missingUIDs.push('Merline');

  if (missingUIDs.length > 0) {
    console.error(`❌ Missing UIDs for: ${missingUIDs.join(', ')}`);
    console.log('💡 Get UIDs from Firebase Console > Authentication after users sign in');
    return;
  }

  try {
    const { db } = await import('/lib/firebase.client.js');
    const { serverTimestamp, addDoc, collection, doc, setDoc } = await import('firebase/firestore');

    console.log('🚀 Setting up missing superadmins...');

    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      console.log(`\n👤 Setting up ${user.firstName} ${user.lastName}...`);

      // Step 1: Set superadmin role
      await setDoc(doc(db, 'users', user.uid), {
        role: 'superadmin',
        email: user.email,
        displayName: `${user.firstName} ${user.lastName}`,
        firstName: user.firstName,
        lastName: user.lastName,
        lastUpdatedAt: serverTimestamp(),
        creatorStatus: 'approved',
        permissions: {
          canCreateContent: true,
          canManageContent: true,
          canAccessAnalytics: true,
          canReceivePayments: true,
          canSwitchRoles: true,
          canManageUsers: true
        },
        joinedAt: serverTimestamp(),
        lastActive: serverTimestamp()
      }, { merge: true });

      console.log(`  ✅ Superadmin role set for ${user.firstName}`);

      // Step 2: Create profile
      await setDoc(doc(db, 'profiles', user.uid), {
        uid: user.uid,
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

    console.log(`\n🎉 SUCCESS! Missing superadmins are now set up:\n============================================\n\n👤 Lona Vincent (LonaLorraine.Vincent@gmail.com)\n👤 Merline Saintil (merlinesaintil@gmail.com)\n\n✅ Both have superadmin role with complete access\n✅ Both have approved creator status\n✅ Both have complete profiles ready\n✅ Both have pre-approved contributor applications\n✅ Both can switch roles and test different user experiences\n\n🎯 They can now access everything Joseph can access!\n`);

  } catch (error) {
    console.error('❌ Error setting up superadmins:', error);
    console.log('💡 Make sure you\\'re signed in and have the correct UIDs');
  }
}

// Instructions
console.log(`\n🚀 Missing Superadmins Setup Ready!\n==============================\n\nRequired Steps:\n1. Have both users sign in to the platform first:\n   • LonaLorraine.Vincent@gmail.com\n   • merlinesaintil@gmail.com\n\n2. Get their UIDs from Firebase Console > Authentication\n\n3. Run: [ID](lonaUID, merlineUID)\n\nExample:\nsetupMissingSuperadmins(\n  'def456lona...',\n  'ghi789merline...'\n)\n`);

// Make function globally available
window.setupMissingSuperadmins = setupMissingSuperadmins;