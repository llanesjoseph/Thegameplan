/**
 * Comprehensive Secure Slug Utilities
 * Replaces all exposed IDs with secure, human-readable slugs
 */

import { adminDb } from '@/lib/firebase.admin'

export interface SecureSlugData {
  slug: string
  originalId: string
  entityType: 'athlete' | 'submission' | 'review' | 'invitation'
  displayName: string
  createdAt: Date
  lastUsed: Date
}

/**
 * Generate a secure, URL-friendly slug for any entity
 */
export function generateSecureSlug(
  displayName: string, 
  originalId: string, 
  entityType: 'athlete' | 'submission' | 'review' | 'invitation'
): string {
  // Clean the display name
  const cleanName = displayName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, '') // Remove leading/trailing hyphens

  // Add entity type prefix for uniqueness
  const typePrefix = {
    'athlete': 'athlete',
    'submission': 'submission', 
    'review': 'review',
    'invitation': 'invite'
  }[entityType]

  // Add short random string for uniqueness
  const randomSuffix = originalId.slice(-6)
  
  return `${typePrefix}-${cleanName}-${randomSuffix}`
}

/**
 * Create or update a secure slug mapping for any entity
 */
export async function createSecureSlugMapping(
  originalId: string,
  displayName: string,
  entityType: 'athlete' | 'submission' | 'review' | 'invitation'
): Promise<{ success: boolean; slug: string; error?: string }> {
  try {
    const slug = generateSecureSlug(displayName, originalId, entityType)
    
    // Check if slug already exists
    const existingSlug = await adminDb.collection('secure_slug_mappings').doc(slug).get()
    
    if (existingSlug.exists) {
      const existingData = existingSlug.data()
      if (existingData?.originalId !== originalId) {
        // Slug exists for different entity, generate new one
        const newSlug = generateSecureSlug(displayName, originalId + Date.now().toString(), entityType)
        return await createSecureSlugMapping(originalId, displayName, entityType)
      }
    }
    
    // Create or update slug mapping
    await adminDb.collection('secure_slug_mappings').doc(slug).set({
      slug,
      originalId,
      entityType,
      displayName,
      createdAt: new Date(),
      lastUsed: new Date()
    }, { merge: true })
    
    // Update the entity's collection with the slug
    const collectionName = getCollectionName(entityType)
    await adminDb.collection(collectionName).doc(originalId).update({
      slug,
      lastUpdated: new Date()
    })
    
    console.log(`✅ Created secure slug mapping: ${slug} -> ${originalId} (${entityType})`)
    
    return { success: true, slug }
  } catch (error) {
    console.error('❌ Error creating secure slug mapping:', error)
    return { success: false, slug: '', error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Get the original ID from a secure slug
 */
export async function getOriginalIdFromSecureSlug(slug: string): Promise<{ success: boolean; originalId?: string; entityType?: string; error?: string }> {
  try {
    const slugDoc = await adminDb.collection('secure_slug_mappings').doc(slug).get()
    
    if (!slugDoc.exists) {
      return { success: false, error: 'Slug not found' }
    }
    
    const slugData = slugDoc.data() as SecureSlugData
    
    // Update last used timestamp
    await adminDb.collection('secure_slug_mappings').doc(slug).update({
      lastUsed: new Date()
    })
    
    return { 
      success: true, 
      originalId: slugData.originalId,
      entityType: slugData.entityType
    }
  } catch (error) {
    console.error('❌ Error getting original ID from secure slug:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Get the secure slug for an entity
 */
export async function getSecureSlugFromOriginalId(
  originalId: string, 
  entityType: 'athlete' | 'submission' | 'review' | 'invitation'
): Promise<{ success: boolean; slug?: string; error?: string }> {
  try {
    const slugQuery = await adminDb.collection('secure_slug_mappings')
      .where('originalId', '==', originalId)
      .where('entityType', '==', entityType)
      .limit(1)
      .get()
    
    if (slugQuery.empty) {
      return { success: false, error: 'No slug found for this entity' }
    }
    
    const slugData = slugQuery.docs[0].data() as SecureSlugData
    return { success: true, slug: slugData.slug }
  } catch (error) {
    console.error('❌ Error getting secure slug from original ID:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Delete secure slug mapping when entity is removed
 */
export async function deleteSecureSlugMapping(originalId: string, entityType: string): Promise<{ success: boolean; error?: string }> {
  try {
    const slugResult = await getSecureSlugFromOriginalId(originalId, entityType as any)
    
    if (slugResult.success && slugResult.slug) {
      await adminDb.collection('secure_slug_mappings').doc(slugResult.slug).delete()
      console.log(`✅ Deleted secure slug mapping for ${entityType}: ${originalId}`)
    }
    
    return { success: true }
  } catch (error) {
    console.error('❌ Error deleting secure slug mapping:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Get collection name for entity type
 */
function getCollectionName(entityType: string): string {
  const collectionMap: Record<string, string> = {
    'athlete': 'athletes',
    'submission': 'submissions', 
    'review': 'reviews',
    'invitation': 'invitations'
  }
  return collectionMap[entityType] || 'users'
}

/**
 * Migrate existing entities to use secure slugs
 */
export async function migrateEntitiesToSecureSlugs(): Promise<{ success: boolean; migrated: number; errors: string[] }> {
  try {
    console.log('🔄 Starting secure slug migration for all entities...')
    
    const errors: string[] = []
    let migrated = 0
    
    // Migrate athletes
    try {
      const athletesSnapshot = await adminDb.collection('athletes').get()
      for (const doc of athletesSnapshot.docs) {
        try {
          const athleteData = doc.data()
          const originalId = doc.id
          const displayName = athleteData.displayName || athleteData.name || 'Unknown Athlete'
          
          const slugResult = await createSecureSlugMapping(originalId, displayName, 'athlete')
          if (slugResult.success) {
            migrated++
            console.log(`✅ Migrated athlete: ${displayName} -> ${slugResult.slug}`)
          } else {
            errors.push(`Failed to migrate athlete ${displayName}: ${slugResult.error}`)
          }
        } catch (error) {
          errors.push(`Error migrating athlete ${doc.id}: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      }
    } catch (error) {
      console.warn('Could not migrate athletes:', error)
    }
    
    // Migrate submissions
    try {
      const submissionsSnapshot = await adminDb.collection('submissions').get()
      for (const doc of submissionsSnapshot.docs) {
        try {
          const submissionData = doc.data()
          const originalId = doc.id
          const displayName = `Video Submission ${originalId.slice(-6)}`
          
          const slugResult = await createSecureSlugMapping(originalId, displayName, 'submission')
          if (slugResult.success) {
            migrated++
            console.log(`✅ Migrated submission: ${displayName} -> ${slugResult.slug}`)
          } else {
            errors.push(`Failed to migrate submission ${displayName}: ${slugResult.error}`)
          }
        } catch (error) {
          errors.push(`Error migrating submission ${doc.id}: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      }
    } catch (error) {
      console.warn('Could not migrate submissions:', error)
    }
    
    // Migrate reviews
    try {
      const reviewsSnapshot = await adminDb.collection('reviews').get()
      for (const doc of reviewsSnapshot.docs) {
        try {
          const reviewData = doc.data()
          const originalId = doc.id
          const displayName = `Review ${originalId.slice(-6)}`
          
          const slugResult = await createSecureSlugMapping(originalId, displayName, 'review')
          if (slugResult.success) {
            migrated++
            console.log(`✅ Migrated review: ${displayName} -> ${slugResult.slug}`)
          } else {
            errors.push(`Failed to migrate review ${displayName}: ${slugResult.error}`)
          }
        } catch (error) {
          errors.push(`Error migrating review ${doc.id}: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      }
    } catch (error) {
      console.warn('Could not migrate reviews:', error)
    }
    
    console.log(`✅ Secure slug migration complete: ${migrated} migrated, ${errors.length} errors`)
    
    return { success: true, migrated, errors }
  } catch (error) {
    console.error('❌ Error during secure slug migration:', error)
    return { success: false, migrated: 0, errors: [error instanceof Error ? error.message : 'Unknown error'] }
  }
}
