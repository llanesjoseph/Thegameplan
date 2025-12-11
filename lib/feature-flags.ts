/**
 * Feature Flags System
 *
 * Allows admins to enable/disable features without code changes
 */

import { adminDb } from './firebase.admin'
import { Timestamp } from 'firebase-admin/firestore'

export interface FeatureFlag {
  enabled: boolean
  enabledAt?: Timestamp
  enabledBy?: string
  disabledAt?: Timestamp
  disabledBy?: string
  description?: string
}

export interface FeatureFlags {
  direct_messaging: FeatureFlag
  // Add more feature flags as needed
}

/**
 * Get all feature flags
 */
export async function getFeatureFlags(): Promise<FeatureFlags> {
  try {
    const doc = await adminDb.collection('feature_flags').doc('global').get()

    if (!doc.exists) {
      // Initialize with defaults if doesn't exist
      const defaults: FeatureFlags = {
        direct_messaging: {
          enabled: false,
          description: 'Direct messaging between athletes and coaches'
        }
      }
      await adminDb.collection('feature_flags').doc('global').set(defaults)
      return defaults
    }

    return doc.data() as FeatureFlags
  } catch (error) {
    console.error('Error fetching feature flags:', error)
    // Return safe defaults on error
    return {
      direct_messaging: { enabled: false }
    }
  }
}

/**
 * Update a specific feature flag
 */
export async function updateFeatureFlag(
  featureName: keyof FeatureFlags,
  enabled: boolean,
  adminUserId: string
): Promise<void> {
  try {
    const now = Timestamp.now()
    const updateData: any = {}

    if (enabled) {
      updateData[`${featureName}.enabled`] = true
      updateData[`${featureName}.enabledAt`] = now
      updateData[`${featureName}.enabledBy`] = adminUserId
    } else {
      updateData[`${featureName}.enabled`] = false
      updateData[`${featureName}.disabledAt`] = now
      updateData[`${featureName}.disabledBy`] = adminUserId
    }

    await adminDb.collection('feature_flags').doc('global').update(updateData)

    console.log(`✅ Feature flag '${featureName}' ${enabled ? 'enabled' : 'disabled'} by ${adminUserId}`)
  } catch (error) {
    console.error('Error updating feature flag:', error)
    throw new Error('Failed to update feature flag')
  }
}

/**
 * Check if a specific feature is enabled
 */
export async function isFeatureEnabled(featureName: keyof FeatureFlags): Promise<boolean> {
  try {
    const flags = await getFeatureFlags()
    return flags[featureName]?.enabled || false
  } catch (error) {
    console.error('Error checking feature flag:', error)
    return false // Safe default: disabled
  }
}
