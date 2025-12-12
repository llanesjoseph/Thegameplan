/**
 * AIRTIGHT: Sync coach profile to creators_index for Browse Coaches
 * This ensures any coach profile change is immediately reflected in Browse Coaches
 * 
 * AGGRESSIVE FIX: This function reads the FULL profile from creator_profiles
 * and syncs ALL fields to creators_index to ensure nothing is missed.
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
  actionPhotos?: string[]
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
 * AGGRESSIVE SYNC: Sync coach profile to creators_index for Browse Coaches
 * This function reads the FULL profile from creator_profiles to ensure ALL fields are synced
 */
export async function syncCoachToBrowseCoaches(
  uid: string,
  partialProfileData?: CoachProfileData
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`🔄 [SYNC-BROWSE] Starting sync for coach ${uid}`)
    
    // AGGRESSIVE: Always read the FULL profile from creator_profiles first
    // This ensures we sync ALL fields, not just what was passed in
    const creatorRef = db.collection('creator_profiles').doc(uid)
    const creatorDoc = await creatorRef.get()
    
    let fullProfileData: any = {}
    
    if (creatorDoc.exists) {
      fullProfileData = creatorDoc.data() || {}
      console.log(`✅ [SYNC-BROWSE] Read full profile from creator_profiles for ${uid}`)
    } else {
      console.warn(`⚠️ [SYNC-BROWSE] No creator_profiles document found for ${uid}, using partial data only`)
    }
    
    // Merge with provided partialProfileData (provided data takes precedence for updates)
    if (partialProfileData) {
      fullProfileData = {
        ...fullProfileData,
        ...partialProfileData,
        uid // Ensure uid is always set
      }
    }
    
    // Ensure uid is always set
    if (!fullProfileData.uid) {
      fullProfileData.uid = uid
    }
    
    // CRITICAL: Check visibility fields - be more lenient
    // If isActive/profileComplete/status are explicitly set to false/null, remove from index
    // Otherwise, default to visible (true/approved)
    const isActive = fullProfileData.isActive !== false && fullProfileData.isActive !== null
    const isComplete = fullProfileData.profileComplete !== false && fullProfileData.profileComplete !== null
    const status = fullProfileData.status || 'approved'
    
    console.log(`🔍 [SYNC-BROWSE] Visibility check for ${uid}:`, {
      isActive,
      isComplete,
      status,
      rawIsActive: fullProfileData.isActive,
      rawProfileComplete: fullProfileData.profileComplete,
      rawStatus: fullProfileData.status
    })
    
    // If profile is explicitly marked as inactive/incomplete, remove from creators_index
    if (fullProfileData.isActive === false || 
        fullProfileData.profileComplete === false ||
        (fullProfileData.status && fullProfileData.status !== 'approved')) {
      const creatorsIndexRef = db.collection('creators_index').doc(uid)
      await creatorsIndexRef.delete()
      console.log(`🗑️ [SYNC-BROWSE] Removed inactive/incomplete profile ${uid} from creators_index`)
      return { success: true }
    }
    
    // AGGRESSIVE: Prepare COMPLETE data for creators_index with ALL fields
    // This is what Browse Coaches reads from
    const indexData: any = {
      uid: uid,
      
      // Name fields - check multiple sources
      displayName: fullProfileData.displayName || fullProfileData.name || '',
      name: fullProfileData.displayName || fullProfileData.name || '',
      firstName: fullProfileData.firstName || '',
      lastName: fullProfileData.lastName || '',
      
      // Contact
      email: fullProfileData.email || '',
      
      // Profile content
      sport: fullProfileData.sport || '',
      location: fullProfileData.location || '',
      bio: fullProfileData.bio || fullProfileData.description || '',
      description: fullProfileData.bio || fullProfileData.description || '',
      tagline: fullProfileData.tagline || '',
      credentials: fullProfileData.credentials || '',
      philosophy: fullProfileData.philosophy || '',
      experience: fullProfileData.experience || '',
      specialties: Array.isArray(fullProfileData.specialties) ? fullProfileData.specialties : [],
      achievements: Array.isArray(fullProfileData.achievements) ? fullProfileData.achievements : [],
      
      // Images - check multiple field names for maximum compatibility
      profileImageUrl: fullProfileData.profileImageUrl || 
                      fullProfileData.headshotUrl || 
                      fullProfileData.photoURL || '',
      headshotUrl: fullProfileData.headshotUrl || 
                   fullProfileData.profileImageUrl || 
                   fullProfileData.photoURL || '',
      photoURL: fullProfileData.profileImageUrl || 
                fullProfileData.headshotUrl || 
                fullProfileData.photoURL || '',
      bannerUrl: fullProfileData.heroImageUrl || 
                 fullProfileData.bannerUrl || 
                 fullProfileData.coverImageUrl || '',
      heroImageUrl: fullProfileData.heroImageUrl || '',
      coverImageUrl: fullProfileData.coverImageUrl || fullProfileData.heroImageUrl || '',
      
      // Showcase and gallery photos
      showcasePhoto1: fullProfileData.showcasePhoto1 || '',
      showcasePhoto2: fullProfileData.showcasePhoto2 || '',
      galleryPhotos: Array.isArray(fullProfileData.galleryPhotos) 
        ? fullProfileData.galleryPhotos.filter((url: any) => typeof url === 'string' && url.trim().length > 0)
        : Array.isArray(fullProfileData.actionPhotos)
        ? fullProfileData.actionPhotos.filter((url: any) => typeof url === 'string' && url.trim().length > 0)
        : [],
      actionPhotos: Array.isArray(fullProfileData.actionPhotos) 
        ? fullProfileData.actionPhotos.filter((url: any) => typeof url === 'string' && url.trim().length > 0)
        : [],
      highlightVideo: fullProfileData.highlightVideo || '',
      
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
      isVerified: fullProfileData.isVerified ?? false,
      isPlatformCoach: fullProfileData.isPlatformCoach ?? false,
      verified: fullProfileData.verified ?? fullProfileData.isVerified ?? false,
      featured: fullProfileData.featured ?? false,
      
      // Preserve slug if it exists
      slug: fullProfileData.slug || undefined
    }
    
    // AGGRESSIVE: Sync to creators_index atomically - use set with merge to ensure all fields are updated
    const creatorsIndexRef = db.collection('creators_index').doc(uid)
    await creatorsIndexRef.set(indexData, { merge: true })
    
    console.log(`✅ [SYNC-BROWSE] AGGRESSIVE SYNC COMPLETE: Synced ALL fields for coach ${uid} to creators_index`)
    console.log(`   - displayName: ${indexData.displayName}`)
    console.log(`   - sport: ${indexData.sport}`)
    console.log(`   - profileImageUrl: ${indexData.profileImageUrl ? 'SET' : 'MISSING'}`)
    console.log(`   - bio: ${indexData.bio ? 'SET' : 'MISSING'}`)
    
    return { success: true }
  } catch (error: any) {
    console.error(`❌ [SYNC-BROWSE] CRITICAL ERROR: Failed to sync coach ${uid} to creators_index:`, error)
    console.error(`   Error details:`, error.message)
    console.error(`   Stack:`, error.stack)
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

