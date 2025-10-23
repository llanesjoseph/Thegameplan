/**
 * Slug Utilities for Secure URL Generation
 * Replaces exposed creator IDs with human-readable, secure slugs
 */

import { adminDb } from '@/lib/firebase.admin'

export interface SlugData {
  slug: string
  originalId: string
  displayName: string
  createdAt: Date
  lastUsed: Date
}

/**
 * Generate a secure, URL-friendly slug from a display name
 * Format: firstname-lastname-randomstring
 * Example: "jasmine-aikey-abc123"
 */
export function generateSlug(displayName: string, originalId: string): string {
  // Clean the display name
  const cleanName = displayName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, '') // Remove leading/trailing hyphens

  // Split into parts
  const nameParts = cleanName.split('-')
  
  if (nameParts.length >= 2) {
    // Use first and last name parts
    const firstName = nameParts[0]
    const lastName = nameParts[nameParts.length - 1]
    
    // Add a short random string for uniqueness
    const randomSuffix = originalId.slice(-6) // Use last 6 chars of original ID
    
    return `${firstName}-${lastName}-${randomSuffix}`
  } else {
    // Fallback for single name
    const randomSuffix = originalId.slice(-8) // Use last 8 chars for uniqueness
    return `${cleanName}-${randomSuffix}`
  }
}

/**
 * Create or update a slug mapping for a creator
 */
export async function createSlugMapping(
  originalId: string, 
  displayName: string
): Promise<{ success: boolean; slug: string; error?: string }> {
  try {
    const slug = generateSlug(displayName, originalId)
    
    // Check if slug already exists
    const existingSlug = await adminDb.collection('slug_mappings').doc(slug).get()
    
    if (existingSlug.exists()) {
      const existingData = existingSlug.data()
      if (existingData?.originalId !== originalId) {
        // Slug exists for different creator, generate new one
        const newSlug = generateSlug(displayName, originalId + Date.now().toString())
        return await createSlugMapping(originalId, displayName)
      }
    }
    
    // Create or update slug mapping
    await adminDb.collection('slug_mappings').doc(slug).set({
      slug,
      originalId,
      displayName,
      createdAt: new Date(),
      lastUsed: new Date()
    }, { merge: true })
    
    // Also update the creator's profile with the slug
    await adminDb.collection('creators_index').doc(originalId).update({
      slug,
      lastUpdated: new Date()
    })
    
    console.log(`✅ Created slug mapping: ${slug} -> ${originalId} (${displayName})`)
    
    return { success: true, slug }
  } catch (error) {
    console.error('❌ Error creating slug mapping:', error)
    return { success: false, slug: '', error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Get the original ID from a slug
 */
export async function getOriginalIdFromSlug(slug: string): Promise<{ success: boolean; originalId?: string; error?: string }> {
  try {
    const slugDoc = await adminDb.collection('slug_mappings').doc(slug).get()
    
    if (!slugDoc.exists()) {
      return { success: false, error: 'Slug not found' }
    }
    
    const slugData = slugDoc.data() as SlugData
    
    // Update last used timestamp
    await adminDb.collection('slug_mappings').doc(slug).update({
      lastUsed: new Date()
    })
    
    return { success: true, originalId: slugData.originalId }
  } catch (error) {
    console.error('❌ Error getting original ID from slug:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Get the slug for a creator ID
 */
export async function getSlugFromOriginalId(originalId: string): Promise<{ success: boolean; slug?: string; error?: string }> {
  try {
    const slugQuery = await adminDb.collection('slug_mappings')
      .where('originalId', '==', originalId)
      .limit(1)
      .get()
    
    if (slugQuery.empty) {
      return { success: false, error: 'No slug found for this creator' }
    }
    
    const slugData = slugQuery.docs[0].data() as SlugData
    return { success: true, slug: slugData.slug }
  } catch (error) {
    console.error('❌ Error getting slug from original ID:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Update slug mapping when creator name changes
 */
export async function updateSlugMapping(
  originalId: string, 
  newDisplayName: string
): Promise<{ success: boolean; slug: string; error?: string }> {
  try {
    // Get existing slug
    const existingSlug = await getSlugFromOriginalId(originalId)
    
    if (existingSlug.success && existingSlug.slug) {
      // Update existing slug mapping
      const newSlug = generateSlug(newDisplayName, originalId)
      
      await adminDb.collection('slug_mappings').doc(existingSlug.slug).update({
        displayName: newDisplayName,
        lastUsed: new Date()
      })
      
      // Update creator profile
      await adminDb.collection('creators_index').doc(originalId).update({
        slug: existingSlug.slug,
        displayName: newDisplayName,
        lastUpdated: new Date()
      })
      
      return { success: true, slug: existingSlug.slug }
    } else {
      // Create new slug mapping
      return await createSlugMapping(originalId, newDisplayName)
    }
  } catch (error) {
    console.error('❌ Error updating slug mapping:', error)
    return { success: false, slug: '', error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Delete slug mapping when creator is removed
 */
export async function deleteSlugMapping(originalId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const slugResult = await getSlugFromOriginalId(originalId)
    
    if (slugResult.success && slugResult.slug) {
      await adminDb.collection('slug_mappings').doc(slugResult.slug).delete()
      console.log(`✅ Deleted slug mapping for creator: ${originalId}`)
    }
    
    return { success: true }
  } catch (error) {
    console.error('❌ Error deleting slug mapping:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Migrate existing creators to use slugs
 */
export async function migrateCreatorsToSlugs(): Promise<{ success: boolean; migrated: number; errors: string[] }> {
  try {
    console.log('🔄 Starting creator slug migration...')
    
    const creatorsSnapshot = await adminDb.collection('creators_index').get()
    const errors: string[] = []
    let migrated = 0
    
    for (const doc of creatorsSnapshot.docs) {
      try {
        const creatorData = doc.data()
        const originalId = doc.id
        const displayName = creatorData.displayName || creatorData.name || 'Unknown Creator'
        
        const slugResult = await createSlugMapping(originalId, displayName)
        
        if (slugResult.success) {
          migrated++
          console.log(`✅ Migrated: ${displayName} -> ${slugResult.slug}`)
        } else {
          errors.push(`Failed to migrate ${displayName}: ${slugResult.error}`)
        }
      } catch (error) {
        const errorMsg = `Error migrating creator ${doc.id}: ${error instanceof Error ? error.message : 'Unknown error'}`
        errors.push(errorMsg)
        console.error(`❌ ${errorMsg}`)
      }
    }
    
    console.log(`✅ Slug migration complete: ${migrated} migrated, ${errors.length} errors`)
    
    return { success: true, migrated, errors }
  } catch (error) {
    console.error('❌ Error during slug migration:', error)
    return { success: false, migrated: 0, errors: [error instanceof Error ? error.message : 'Unknown error'] }
  }
}
