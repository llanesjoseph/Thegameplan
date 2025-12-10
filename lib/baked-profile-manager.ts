/**
 * Baked Profile Manager
 * 
 * Allows admins to create pre-made profiles that transfer ownership
 * to a specific user when they sign in for the first time.
 */

import { adminDb as db } from '@/lib/firebase.admin'

export interface BakedProfile {
  // Profile identification
  bakedProfileId: string // Unique ID for the baked profile
  targetEmail: string // Email of the user who will take ownership
  targetUid?: string | null // UID if user already exists, null if waiting for sign-up
  
  // Profile data (same structure as creator_profiles)
  displayName: string
  firstName: string
  lastName: string
  email: string
  sport: string
  tagline?: string
  credentials?: string
  bio?: string
  philosophy?: string
  specialties?: string[]
  achievements?: string[]
  experience?: string
  
  // Images
  headshotUrl?: string
  heroImageUrl?: string
  actionPhotos?: string[]
  highlightVideo?: string
  
  // Social links
  socialLinks?: {
    instagram?: string
    facebook?: string
    twitter?: string
    linkedin?: string
    youtube?: string
  }
  
  // Metadata
  createdBy: string // Admin UID who created this
  createdAt: Date
  transferredAt?: Date
  transferredTo?: string // UID of user who took ownership
  status: 'pending' | 'transferred' | 'cancelled'
  
  // Additional profile fields
  profileCompleteness?: number
  isVerified?: boolean
  isPlatformCoach?: boolean
}

/**
 * Create a baked profile (admin only)
 */
export async function createBakedProfile(
  adminUid: string,
  profileData: Omit<BakedProfile, 'bakedProfileId' | 'createdBy' | 'createdAt' | 'status'>
): Promise<{ success: boolean; bakedProfileId?: string; error?: string }> {
  try {
    // Generate unique ID for baked profile
    const bakedProfileId = `baked-${Date.now()}-${Math.random().toString(36).substring(7)}`
    
    const bakedProfile: BakedProfile = {
      ...profileData,
      bakedProfileId,
      createdBy: adminUid,
      createdAt: new Date(),
      status: 'pending',
      targetUid: profileData.targetUid ?? null
    }
    
    // Save to baked_profiles collection
    await db.collection('baked_profiles').doc(bakedProfileId).set(bakedProfile)
    
    // If target user already exists, try to transfer immediately
    if (profileData.targetUid) {
      const transferResult = await transferBakedProfileToUser(bakedProfileId, profileData.targetUid)
      if (transferResult.success) {
        return {
          success: true,
          bakedProfileId,
        }
      }
    }
    
    console.log(`✅ Baked profile created: ${bakedProfileId} for ${profileData.targetEmail}`)
    
    return {
      success: true,
      bakedProfileId
    }
  } catch (error) {
    console.error('❌ Failed to create baked profile:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Check if there's a baked profile waiting for a user
 */
export async function findBakedProfileForUser(
  email: string,
  uid?: string
): Promise<BakedProfile | null> {
  try {
    const normalizedEmail = email.toLowerCase().trim()
    
    // First, try to find by email
    const emailQuery = await db.collection('baked_profiles')
      .where('targetEmail', '==', normalizedEmail)
      .where('status', '==', 'pending')
      .limit(1)
      .get()
    
    if (!emailQuery.empty) {
      const doc = emailQuery.docs[0]
      const data = doc.data()
      return { 
        bakedProfileId: doc.id,
        ...data 
      } as BakedProfile
    }
    
    // If UID provided, also check by UID
    if (uid) {
      const uidQuery = await db.collection('baked_profiles')
        .where('targetUid', '==', uid)
        .where('status', '==', 'pending')
        .limit(1)
        .get()
      
      if (!uidQuery.empty) {
        const doc = uidQuery.docs[0]
        const data = doc.data()
        return { 
          bakedProfileId: doc.id,
          ...data 
        } as BakedProfile
      }
    }
    
    return null
  } catch (error) {
    console.error('❌ Failed to find baked profile:', error)
    return null
  }
}

/**
 * Transfer baked profile ownership to a user
 */
export async function transferBakedProfileToUser(
  bakedProfileId: string,
  userUid: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get the baked profile
    const bakedProfileDoc = await db.collection('baked_profiles').doc(bakedProfileId).get()
    
    if (!bakedProfileDoc.exists) {
      return { success: false, error: 'Baked profile not found' }
    }
    
    const bakedProfile = bakedProfileDoc.data() as BakedProfile
    
    if (bakedProfile.status !== 'pending') {
      return { success: false, error: 'Baked profile already transferred or cancelled' }
    }
    
    // Prepare profile data for transfer
    const profileData = {
      uid: userUid,
      email: bakedProfile.email || bakedProfile.targetEmail,
      displayName: bakedProfile.displayName,
      firstName: bakedProfile.firstName,
      lastName: bakedProfile.lastName,
      sport: bakedProfile.sport,
      tagline: bakedProfile.tagline || '',
      credentials: bakedProfile.credentials || '',
      bio: bakedProfile.bio || '',
      philosophy: bakedProfile.philosophy || '',
      specialties: bakedProfile.specialties || [],
      achievements: bakedProfile.achievements || [],
      experience: bakedProfile.experience || '',
      headshotUrl: bakedProfile.headshotUrl || '',
      heroImageUrl: bakedProfile.heroImageUrl || '',
      actionPhotos: bakedProfile.actionPhotos || [],
      highlightVideo: bakedProfile.highlightVideo || '',
      socialLinks: bakedProfile.socialLinks || {},
      profileCompleteness: bakedProfile.profileCompleteness || 100,
      isVerified: bakedProfile.isVerified ?? true,
      isPlatformCoach: bakedProfile.isPlatformCoach ?? true,
      role: 'coach',
      isActive: true,
      createdAt: bakedProfile.createdAt,
      updatedAt: new Date(),
      // Mark as transferred from baked profile
      transferredFromBakedProfile: true,
      bakedProfileId: bakedProfileId
    }
    
    // Use batch to ensure atomicity
    const batch = db.batch()
    
    // Save to creator_profiles
    const creatorRef = db.collection('creator_profiles').doc(userUid)
    batch.set(creatorRef, profileData, { merge: true })
    
    // Save to coach_profiles (for consistency)
    const coachRef = db.collection('coach_profiles').doc(userUid)
    batch.set(coachRef, profileData, { merge: true })
    
    // Update users collection
    const userRef = db.collection('users').doc(userUid)
    batch.set(userRef, {
      displayName: profileData.displayName,
      role: 'coach',
      creatorStatus: 'approved',
      profileProvisioned: true,
      updatedAt: new Date()
    }, { merge: true })
    
    // Mark baked profile as transferred
    const bakedRef = db.collection('baked_profiles').doc(bakedProfileId)
    batch.update(bakedRef, {
      status: 'transferred',
      transferredAt: new Date(),
      transferredTo: userUid
    })
    
    // Commit all changes
    await batch.commit()
    
    console.log(`✅ Baked profile ${bakedProfileId} transferred to user ${userUid}`)
    
    return { success: true }
  } catch (error) {
    console.error('❌ Failed to transfer baked profile:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Check and transfer baked profile on user sign-in
 */
export async function checkAndTransferBakedProfile(
  userUid: string,
  userEmail: string
): Promise<{ transferred: boolean; bakedProfileId?: string }> {
  try {
    // Find baked profile for this user
    const bakedProfile = await findBakedProfileForUser(userEmail, userUid)
    
    if (!bakedProfile) {
      return { transferred: false }
    }
    
    // Transfer the profile
    const result = await transferBakedProfileToUser(bakedProfile.bakedProfileId, userUid)
    
    if (result.success) {
      return {
        transferred: true,
        bakedProfileId: bakedProfile.bakedProfileId
      }
    }
    
    return { transferred: false }
  } catch (error) {
    console.error('❌ Failed to check/transfer baked profile:', error)
    return { transferred: false }
  }
}

/**
 * Get all baked profiles (admin only)
 */
export async function getAllBakedProfiles(): Promise<BakedProfile[]> {
  try {
    const snapshot = await db.collection('baked_profiles')
      .orderBy('createdAt', 'desc')
      .get()
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as BakedProfile))
  } catch (error) {
    console.error('❌ Failed to get baked profiles:', error)
    return []
  }
}

/**
 * Cancel a baked profile (admin only)
 */
export async function cancelBakedProfile(
  bakedProfileId: string,
  adminUid: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const bakedRef = db.collection('baked_profiles').doc(bakedProfileId)
    const bakedDoc = await bakedRef.get()
    
    if (!bakedDoc.exists) {
      return { success: false, error: 'Baked profile not found' }
    }
    
    const bakedProfile = bakedDoc.data() as BakedProfile
    
    if (bakedProfile.status !== 'pending') {
      return { success: false, error: 'Cannot cancel - profile already transferred or cancelled' }
    }
    
    await bakedRef.update({
      status: 'cancelled',
      cancelledBy: adminUid,
      cancelledAt: new Date()
    })
    
    return { success: true }
  } catch (error) {
    console.error('❌ Failed to cancel baked profile:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

