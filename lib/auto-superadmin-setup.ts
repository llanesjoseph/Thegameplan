import { db } from './firebase.client'
import { doc, setDoc, collection, addDoc, serverTimestamp, getDoc } from 'firebase/firestore'

// Predefined superadmin users (all emails in lowercase for case-insensitive matching)
const SUPERADMIN_USERS = {
  'joseph@crucibleanalytics.dev': {
    firstName: 'Joseph',
    lastName: 'Admin',
    bio: 'Platform Administrator and Content Creator',
    expertise: ['platform-management', 'content-strategy', 'user-experience', 'analytics'],
    contentDescription: 'Educational content focused on platform usage, content creation best practices, and system optimization.',
    achievements: ['Platform Development', 'Content Strategy', 'User Experience Design'],
    certifications: ['Firebase Certified', 'Web Development']
  },
  'lonaloraine.vincent@gmail.com': {
    firstName: 'Lona',
    lastName: 'Vincent',
    bio: 'Platform Administrator and Content Strategist',
    expertise: ['content-strategy', 'user-management', 'platform-operations', 'community-building'],
    contentDescription: 'Strategic content focused on user engagement, community building, and platform optimization.',
    achievements: ['Content Strategy', 'User Management', 'Community Building'],
    certifications: ['Digital Marketing', 'Community Management']
  },
  'merlinesaintil@gmail.com': {
    firstName: 'Merline',
    lastName: 'Saintil',
    bio: 'Platform Administrator and Operations Manager',
    expertise: ['operations-management', 'user-experience', 'content-moderation', 'quality-assurance'],
    contentDescription: 'Operational content focused on platform efficiency, user experience, and quality standards.',
    achievements: ['Operations Management', 'UX Optimization', 'Quality Assurance'],
    certifications: ['Operations Management', 'UX Design']
  }
}

export async function autoProvisionSuperadmin(uid: string, email: string, displayName?: string) {
  try {
    // Normalize email to lowercase for case-insensitive comparison
    const normalizedEmail = email.toLowerCase()

    // Check if this email is in our superadmin list (case-insensitive)
    const superadminData = SUPERADMIN_USERS[normalizedEmail as keyof typeof SUPERADMIN_USERS]
    if (!superadminData) {
      return false
    }

    // Check if user is already set up
    const userDoc = await getDoc(doc(db, 'users', uid))
    if (userDoc.exists() && userDoc.data().role === 'superadmin') {
      return true // Already set up, no need to log
    }

    console.log(`🚀 Auto-provisioning superadmin: ${email}`)

    // Step 1: Set superadmin role in users collection
    await setDoc(doc(db, 'users', uid), {
      role: 'superadmin',
      email: email,
      displayName: displayName || `${superadminData.firstName} ${superadminData.lastName}`,
      firstName: superadminData.firstName,
      lastName: superadminData.lastName,
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
      lastActive: serverTimestamp(),
      autoProvisioned: true,
      provisionedAt: serverTimestamp()
    }, { merge: true })

    // Step 2: Create/update profile
    await setDoc(doc(db, 'profiles', uid), {
      uid: uid,
      firstName: superadminData.firstName,
      lastName: superadminData.lastName,
      email: email,
      bio: superadminData.bio,
      expertise: superadminData.expertise,
      sports: ['general-athletics'],
      role: 'superadmin',
      isPublic: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      autoProvisioned: true
    }, { merge: true })

    // Step 3: Create pre-approved contributor application
    await addDoc(collection(db, 'contributorApplications'), {
      firstName: superadminData.firstName,
      lastName: superadminData.lastName,
      email: email,
      primarySport: 'other',
      experience: 'admin',
      experienceDetails: `Platform administrator specializing in ${superadminData.expertise.join(', ')}.`,
      specialties: superadminData.expertise,
      contentTypes: ['platform-tutorials', 'best-practices', 'system-guides', 'analytics-insights'],
      targetAudience: ['creators', 'coaches', 'administrators', 'all-users'],
      contentDescription: superadminData.contentDescription,
      achievements: superadminData.achievements,
      certifications: superadminData.certifications,
      status: 'approved',
      userId: uid,
      userEmail: email,
      submittedAt: serverTimestamp(),
      reviewedAt: serverTimestamp(),
      reviewerNotes: 'Auto-approved as platform administrator',
      reviewerId: 'system',
      autoProvisioned: true
    })

    console.log(`✅ Superadmin provisioned: ${superadminData.firstName} ${superadminData.lastName}`)

    return true

  } catch (error) {
    console.error('❌ Error auto-provisioning superadmin:', error)
    return false
  }
}

export function isSuperadminEmail(email: string): boolean {
  const normalizedEmail = email.toLowerCase()
  return normalizedEmail in SUPERADMIN_USERS
}