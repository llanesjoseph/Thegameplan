/**
 * AIRTIGHT: Sync coach profile to creators_index for Browse Coaches
 * This ensures any coach profile change is immediately reflected in Browse Coaches
 */

import { adminDb as db } from '@/lib/firebase.admin'

export interface CoachProfileData {
  uid: string
  displayName?: string
  firstName?: string
  lastName?: string
  email?: string
  sport?: string
  location?: string
  bio?: string
  tagline?: string
  credentials?: string
  philosophy?: string
  profileImageUrl?: string
  headshotUrl?: string
  heroImageUrl?: string
  showcasePhoto1?: string
  showcasePhoto2?: string
  galleryPhotos?: string[]
  instagram?: string
  facebook?: string
  twitter?: string
  linkedin?: string
  youtube?: string
  socialLinks?: {
    instagram?: string
    facebook?: string
    twitter?: string
    linkedin?: string
    youtube?: string
  }
  isActive?: boolean
  profileComplete?: boolean
  status?: string
  [key: string]: any
}

/**
 * Sync coach profile to creators_index for Browse Coaches
 * This is called whenever a coach updates their profile
 */
export async function syncCoachToBrowseCoaches(
  uid: string,
  profileData: CoachProfileData
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get current profile data from creator_profiles to ensure we have all fields
    const creatorRef = db.collection('creator_profiles').doc(uid)
    const creatorDoc = await creatorRef.get()
    
    let fullProfileData: any = {}
    
    if (creatorDoc.exists) {
      fullProfileData = creatorDoc.data() || {}
    }
    
    // Merge with provided profileData (provided data takes precedence)
    fullProfileData = {
      ...fullProfileData,
      ...profileData,
      uid // Ensure uid is always set
    }
    
    // Only sync if profile is active and complete
    const isActive = fullProfileData.isActive !== false
    const isComplete = fullProfileData.profileComplete !== false
    const status = fullProfileData.status || 'approved'
    
    // If profile is not active/complete, remove from creators_index
    if (!isActive || !isComplete || status !== 'approved') {
      const creatorsIndexRef = db.collection('creators_index').doc(uid)
      await creatorsIndexRef.delete()
      console.log(`[SYNC-BROWSE] Removed inactive/incomplete profile ${uid} from creators_index`)
      return { success: true }
    }
    
    // Prepare data for creators_index
    // This is what Browse Coaches reads from
    const indexData: any = {
      uid: uid,
      displayName: fullProfileData.displayName || '',
      name: fullProfileData.displayName || '', // Also set 'name' for compatibility
      email: fullProfileData.email || '',
      sport: fullProfileData.sport || '',
      location: fullProfileData.location || '',
      bio: fullProfileData.bio || '',
      description: fullProfileData.bio || '', // Also set 'description' for compatibility
      tagline: fullProfileData.tagline || '',
      credentials: fullProfileData.credentials || '',
      philosophy: fullProfileData.philosophy || '',
      
      // Images - check multiple field names for maximum compatibility
      profileImageUrl: fullProfileData.profileImageUrl || fullProfileData.headshotUrl || '',
      headshotUrl: fullProfileData.headshotUrl || fullProfileData.profileImageUrl || '',
      photoURL: fullProfileData.profileImageUrl || fullProfileData.headshotUrl || '',
      bannerUrl: fullProfileData.heroImageUrl || fullProfileData.bannerUrl || '',
      heroImageUrl: fullProfileData.heroImageUrl || '',
      coverImageUrl: fullProfileData.coverImageUrl || '',
      
      // Showcase and gallery photos
      showcasePhoto1: fullProfileData.showcasePhoto1 || '',
      showcasePhoto2: fullProfileData.showcasePhoto2 || '',
      galleryPhotos: Array.isArray(fullProfileData.galleryPhotos) 
        ? fullProfileData.galleryPhotos.filter((url: any) => typeof url === 'string' && url.trim().length > 0)
        : [],
      
      // Social links - support both individual fields and socialLinks object
      instagram: fullProfileData.instagram || fullProfileData.socialLinks?.instagram || '',
      facebook: fullProfileData.facebook || fullProfileData.socialLinks?.facebook || '',
      twitter: fullProfileData.twitter || fullProfileData.socialLinks?.twitter || '',
      linkedin: fullProfileData.linkedin || fullProfileData.socialLinks?.linkedin || '',
      youtube: fullProfileData.youtube || fullProfileData.socialLinks?.youtube || '',
      socialLinks: fullProfileData.socialLinks || {
        instagram: fullProfileData.instagram || '',
        facebook: fullProfileData.facebook || '',
        twitter: fullProfileData.twitter || '',
        linkedin: fullProfileData.linkedin || '',
        youtube: fullProfileData.youtube || ''
      },
      
      // Metadata
      isActive: true,
      profileComplete: true,
      status: 'approved',
      lastUpdated: new Date(),
      
      // Additional fields for compatibility
      role: fullProfileData.role || 'coach',
      isVerified: fullProfileData.isVerified || false,
      isPlatformCoach: fullProfileData.isPlatformCoach || false
    }
    
    // Sync to creators_index atomically
    const creatorsIndexRef = db.collection('creators_index').doc(uid)
    await creatorsIndexRef.set(indexData, { merge: true })
    
    console.log(`✅ [SYNC-BROWSE] Synced coach profile ${uid} to creators_index for Browse Coaches`)
    
    return { success: true }
  } catch (error: any) {
    console.error(`❌ [SYNC-BROWSE] Failed to sync coach ${uid} to creators_index:`, error)
    return {
      success: false,
      error: error.message || 'Failed to sync to Browse Coaches'
    }
  }
}

/**
 * Remove coach from creators_index (when profile is deactivated)
 */
export async function removeCoachFromBrowseCoaches(uid: string): Promise<void> {
  try {
    const creatorsIndexRef = db.collection('creators_index').doc(uid)
    await creatorsIndexRef.delete()
    console.log(`✅ [SYNC-BROWSE] Removed coach ${uid} from creators_index`)
  } catch (error: any) {
    console.error(`❌ [SYNC-BROWSE] Failed to remove coach ${uid} from creators_index:`, error)
  }
}

