import { adminDb } from '@/lib/firebase.admin'
import { auditLog } from '@/lib/audit-logger'

/**
 * Immediately sync coach data to public-facing profile
 *
 * This function is called whenever coach data is ingested or updated
 * to ensure the public profile is always in sync with the latest information.
 *
 * Collections Updated:
 * - creators_index (used by Browse Coaches page)
 * - creatorPublic (legacy, for compatibility)
 */

interface CoachData {
  uid: string
  email: string
  displayName: string
  firstName?: string
  lastName?: string
  sport?: string
  tagline?: string
  bio?: string
  philosophy?: string
  experience?: string
  credentials?: string
  specialties?: string[]
  achievements?: string[]
  badges?: string[]
  heroImageUrl?: string
  headshotUrl?: string
  profileImageUrl?: string
  lessonCount?: number
  verified?: boolean
  featured?: boolean
  isActive?: boolean
  profileComplete?: boolean
  status?: string
  visibility?: {
    tagline?: boolean
    bio?: boolean
    philosophy?: boolean
    credentials?: boolean
    specialties?: boolean
    achievements?: boolean
    heroImage?: boolean
    headshot?: boolean
  }
}

/**
 * Sync coach data to public profile immediately
 */
export async function syncCoachToPublicProfile(coachData: CoachData): Promise<boolean> {
  try {
    const uid = coachData.uid

    // Determine what should be publicly visible
    const visibility = coachData.visibility || {}

    // Build public profile data (only include fields marked as public)
    const publicProfileData: any = {
      id: uid,
      uid: uid,
      name: coachData.displayName || `${coachData.firstName || ''} ${coachData.lastName || ''}`.trim(),
      displayName: coachData.displayName,
      firstName: coachData.firstName || '',
      sport: (coachData.sport || '').toLowerCase(),
      experience: coachData.experience || 'coach',

      // Conditionally include based on visibility settings
      tagline: visibility.tagline !== false ? (coachData.tagline || '') : '',
      bio: visibility.bio !== false ? (coachData.bio || '') : '',
      philosophy: visibility.philosophy !== false ? (coachData.philosophy || '') : '',
      credentials: visibility.credentials !== false ? (coachData.credentials || '') : '',
      specialties: visibility.specialties !== false ? (coachData.specialties || []) : [],
      achievements: visibility.achievements !== false ? (coachData.achievements || []) : [],

      // Images
      heroImageUrl: visibility.heroImage !== false ? (coachData.heroImageUrl || coachData.profileImageUrl || '') : '',
      headshotUrl: visibility.headshot !== false ? (coachData.headshotUrl || coachData.profileImageUrl || '') : '',

      // Stats and status
      badges: coachData.badges || [],
      lessonCount: coachData.lessonCount || 0,
      verified: coachData.verified !== false, // Default to true
      featured: coachData.featured || false,
      isActive: coachData.isActive !== false, // Default to true
      profileComplete: coachData.profileComplete || false,
      status: coachData.status || 'pending',

      // Metadata
      updatedAt: new Date(),
      lastSyncedAt: new Date(),
      syncSource: 'automatic'
    }

    // Update creators_index (primary collection for Browse Coaches)
    await adminDb.collection('creators_index').doc(uid).set(publicProfileData, { merge: true })
    console.log(`✅ Synced ${coachData.displayName} to creators_index`)

    // Also update creatorPublic for backward compatibility
    await adminDb.collection('creatorPublic').doc(uid).set(publicProfileData, { merge: true })
    console.log(`✅ Synced ${coachData.displayName} to creatorPublic`)

    // Trigger coach count update (non-blocking)
    updateCoachCountCache().catch(err => {
      console.warn('⚠️ Failed to update coach count cache:', err)
    })

    // Audit log
    await auditLog('coach_profile_synced_to_public', {
      coachId: uid,
      coachName: coachData.displayName,
      collections: ['creators_index', 'creatorPublic'],
      timestamp: new Date().toISOString()
    })

    return true

  } catch (error) {
    console.error('❌ Failed to sync coach to public profile:', error)

    // Audit log the failure
    await auditLog('coach_profile_sync_failed', {
      coachId: coachData.uid,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    })

    return false
  }
}

/**
 * Update the cached coach count immediately
 */
async function updateCoachCountCache(): Promise<void> {
  try {
    const snapshot = await adminDb
      .collection('creators_index')
      .where('isActive', '==', true)
      .get()

    // Filter for truly active coaches
    const activeCoaches = snapshot.docs.filter(doc => {
      const data = doc.data()
      return (
        data.profileComplete === true &&
        (!data.status || data.status === 'approved') &&
        (data.tagline || data.bio || (data.specialties && data.specialties.length > 0))
      )
    })

    const activeCount = activeCoaches.length

    // Update cache
    await adminDb.collection('system_cache').doc('coach_count').set({
      activeCoaches: activeCount,
      totalCoaches: snapshot.size,
      lastUpdated: new Date()
    }, { merge: true })

    console.log(`✅ Coach count cache updated: ${activeCount} active`)
  } catch (error) {
    console.error('⚠️ Failed to update coach count cache:', error)
  }
}

/**
 * Batch sync multiple coaches to public profiles
 */
export async function batchSyncCoachesToPublic(coaches: CoachData[]): Promise<{ success: number; failed: number }> {
  let success = 0
  let failed = 0

  for (const coach of coaches) {
    const result = await syncCoachToPublicProfile(coach)
    if (result) {
      success++
    } else {
      failed++
    }
  }

  console.log(`📊 Batch sync complete: ${success} successful, ${failed} failed`)

  return { success, failed }
}
