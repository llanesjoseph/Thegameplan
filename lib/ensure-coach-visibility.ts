import { adminDb } from '@/lib/firebase.admin'
import { createSlugMapping } from '@/lib/slug-utils'

export interface CoachData {
  uid: string
  email: string
  displayName: string
  firstName: string
  lastName: string
  sport: string
  tagline?: string
  bio?: string
  philosophy?: string
  experience?: string
  credentials?: string
  specialties?: string[]
  achievements?: string[]
  isActive?: boolean
  profileComplete?: boolean
  status?: string
  verified?: boolean
  featured?: boolean
}

/**
 * IRONCLAD COACH VISIBILITY SYSTEM
 * 
 * This function ensures that ANY coach who completes onboarding
 * is automatically visible in the Browse Coaches section.
 * 
 * It handles all edge cases and provides comprehensive logging.
 */
export async function ensureCoachVisibility(coachData: CoachData): Promise<{
  success: boolean
  message: string
  details: any
}> {
  try {
    console.log(`🔧 [ENSURE-COACH-VISIBILITY] Starting for ${coachData.displayName} (${coachData.email})`)

    // Validate required fields
    if (!coachData.uid || !coachData.email || !coachData.displayName) {
      throw new Error('Missing required fields: uid, email, or displayName')
    }

    // Prepare creators_index data with all required fields
    const creatorsIndexData = {
      uid: coachData.uid,
      email: coachData.email.toLowerCase(),
      displayName: coachData.displayName,
      firstName: coachData.firstName || '',
      lastName: coachData.lastName || '',
      sport: coachData.sport || '',
      tagline: coachData.tagline || '',
      bio: coachData.bio || '',
      philosophy: coachData.philosophy || '',
      experience: coachData.experience || '',
      credentials: coachData.credentials || '',
      specialties: coachData.specialties || [],
      achievements: coachData.achievements || [],
      isActive: coachData.isActive ?? true,
      profileComplete: coachData.profileComplete ?? true,
      status: coachData.status || 'approved',
      verified: coachData.verified ?? true,
      featured: coachData.featured ?? false,
      createdAt: new Date(),
      lastUpdated: new Date()
    }

    // Write to creators_index (this is what Browse Coaches queries)
    await adminDb.collection('creators_index').doc(coachData.uid).set(creatorsIndexData)
    console.log(`✅ [ENSURE-COACH-VISIBILITY] Added ${coachData.displayName} to creators_index`)

    // Create slug mapping for secure profile URLs
    try {
      const slugResult = await createSlugMapping(coachData.uid, coachData.displayName)
      if (slugResult.success) {
        console.log(`✅ [ENSURE-COACH-VISIBILITY] Created slug mapping: ${slugResult.slug}`)
      } else {
        console.warn(`⚠️ [ENSURE-COACH-VISIBILITY] Failed to create slug: ${slugResult.error}`)
        // Don't fail the entire process if slug creation fails
      }
    } catch (slugError: any) {
      console.error(`❌ [ENSURE-COACH-VISIBILITY] Error creating slug:`, slugError)
      // Don't fail the entire process if slug creation fails
    }

    // Update coach count cache
    await updateCoachCountCache()

    // Verify the coach is now visible
    const verification = await verifyCoachVisibility(coachData.uid)
    
    if (verification.success) {
      console.log(`🎯 [ENSURE-COACH-VISIBILITY] SUCCESS: ${coachData.displayName} is now visible in Browse Coaches`)
      
      return {
        success: true,
        message: `Coach ${coachData.displayName} is now visible in Browse Coaches`,
        details: {
          uid: coachData.uid,
          displayName: coachData.displayName,
          sport: coachData.sport,
          isActive: creatorsIndexData.isActive,
          profileComplete: creatorsIndexData.profileComplete,
          verified: verification.details
        }
      }
    } else {
      throw new Error(`Verification failed: ${verification.message}`)
    }

  } catch (error: any) {
    console.error(`❌ [ENSURE-COACH-VISIBILITY] Failed for ${coachData.displayName}:`, error)
    
    return {
      success: false,
      message: `Failed to ensure coach visibility: ${error.message}`,
      details: {
        error: error.message,
        coachData: {
          uid: coachData.uid,
          displayName: coachData.displayName,
          email: coachData.email
        }
      }
    }
  }
}

/**
 * Update the coach count cache to reflect current state
 */
async function updateCoachCountCache(): Promise<void> {
  try {
    // Count active coaches in creators_index
    const snapshot = await adminDb
      .collection('creators_index')
      .where('isActive', '==', true)
      .get()

    const activeCount = snapshot.docs.filter(doc => {
      const data = doc.data()
      return data.profileComplete === true && 
             (data.status === 'approved' || !data.status)
    }).length

    // Update cache
    await adminDb.collection('system_cache').doc('coach_count').set({
      activeCoaches: activeCount,
      totalCoaches: snapshot.size,
      lastUpdated: new Date(),
      criteria: {
        description: 'Active coaches with completed profiles',
        rules: [
          'isActive === true',
          'profileComplete === true',
          'status === approved'
        ]
      }
    })

    console.log(`📊 [ENSURE-COACH-VISIBILITY] Updated coach count cache: ${activeCount} active coaches`)
  } catch (error) {
    console.warn('⚠️ [ENSURE-COACH-VISIBILITY] Failed to update coach count cache:', error)
  }
}

/**
 * Verify that a coach is visible in Browse Coaches
 */
async function verifyCoachVisibility(uid: string): Promise<{
  success: boolean
  message: string
  details: any
}> {
  try {
    const doc = await adminDb.collection('creators_index').doc(uid).get()
    
    if (!doc.exists) {
      return {
        success: false,
        message: 'Coach not found in creators_index',
        details: { uid }
      }
    }

    const data = doc.data()
    
    if (!data) {
      return {
        success: false,
        message: 'Coach document exists but has no data',
        details: { uid }
      }
    }
    
    const isVisible = data.isActive === true && 
                     data.profileComplete === true && 
                     (data.status === 'approved' || !data.status)

    if (isVisible) {
      return {
        success: true,
        message: 'Coach is visible in Browse Coaches',
        details: {
          displayName: data.displayName,
          sport: data.sport,
          isActive: data.isActive,
          profileComplete: data.profileComplete,
          status: data.status
        }
      }
    } else {
      return {
        success: false,
        message: 'Coach exists but is not visible (inactive or incomplete)',
        details: {
          displayName: data.displayName,
          isActive: data.isActive,
          profileComplete: data.profileComplete,
          status: data.status
        }
      }
    }
  } catch (error: any) {
    return {
      success: false,
      message: `Verification error: ${error.message}`,
      details: { error: error.message }
    }
  }
}

/**
 * Batch ensure multiple coaches are visible
 */
export async function batchEnsureCoachVisibility(coaches: CoachData[]): Promise<{
  success: number
  failed: number
  results: any[]
}> {
  console.log(`🔧 [BATCH-ENSURE-COACH-VISIBILITY] Processing ${coaches.length} coaches`)
  
  const results = []
  let success = 0
  let failed = 0

  for (const coach of coaches) {
    const result = await ensureCoachVisibility(coach)
    results.push(result)
    
    if (result.success) {
      success++
    } else {
      failed++
    }
  }

  console.log(`📊 [BATCH-ENSURE-COACH-VISIBILITY] Complete: ${success} success, ${failed} failed`)
  
  return { success, failed, results }
}
