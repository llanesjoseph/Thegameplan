/**
 * Script to set up Joseph as superadmin and create his creator profile
 * Run this in the browser console while logged in as an admin
 */

// Step 1: Set Joseph's role to superadmin
async function setJosephAsSuperAdmin() {
  const { db, serverTimestamp } = await import('../lib/firebase.client.ts');
  
  // You'll need to get Joseph's UID first by having him sign in once
  const josephUID = 'JOSEPH_UID_HERE'; // Replace with actual UID after Joseph signs in
  
  try {
    // Set role in users collection
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
    
    console.log('✅ Joseph set as superadmin');
    
    // Create creator profile
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
    
    console.log('✅ Joseph creator profile created');
    
  } catch (error) {
    console.error('❌ Error setting up Joseph:', error);
  }
}

// Step 2: Create a contributor application for Joseph (already approved)
async function createJosephApplication() {
  const { db, serverTimestamp } = await import('../lib/firebase.client.ts');
  
  const josephUID = 'JOSEPH_UID_HERE'; // Replace with actual UID
  
  try {
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
    
    console.log('✅ Joseph contributor application created');
    
  } catch (error) {
    console.error('❌ Error creating Joseph application:', error);
  }
}

console.log(`
🚀 Joseph Admin Setup Script
============================

1. First, have Joseph sign in to the platform at least once to get his UID
2. Replace 'JOSEPH_UID_HERE' in this script with his actual Firebase UID
3. Run setJosephAsSuperAdmin() in the browser console while logged in as admin
4. Run createJosephApplication() to create his contributor profile

Steps:
- setJosephAsSuperAdmin()
- createJosephApplication()
`);

// Export functions for manual execution
window.setJosephAsSuperAdmin = setJosephAsSuperAdmin;
window.createJosephApplication = createJosephApplication;
