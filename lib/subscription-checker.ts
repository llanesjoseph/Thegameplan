/**
 * CENTRALIZED SUBSCRIPTION CHECKER
 * Single source of truth for subscription validation across all API endpoints
 * Ensures 100% consistent tier checking and error handling
 */

import { adminDb } from '@/lib/firebase.admin'
import { Timestamp } from 'firebase-admin/firestore'
import type { SubscriptionTier } from './subscription-access'

export interface SubscriptionCheckResult {
  isValid: boolean
  tier: SubscriptionTier
  status: string
  isActive: boolean
  error?: string
  errorCode?: string
  upgradeUrl?: string
  requiredTier?: SubscriptionTier
}

/**
 * Get and validate user subscription from Firestore
 * This is the SINGLE SOURCE OF TRUTH for subscription checking
 */
export async function checkUserSubscription(
  userId: string
): Promise<SubscriptionCheckResult> {
  try {
    const userDoc = await adminDb.collection('users').doc(userId).get()

    if (!userDoc.exists) {
      return {
        isValid: false,
        tier: 'none',
        status: 'not_found',
        isActive: false,
        error: 'User not found',
        errorCode: 'USER_NOT_FOUND'
      }
    }

    const userData = userDoc.data()
    const subscription = userData?.subscription || {}
    const tier = (subscription.tier || 'none') as SubscriptionTier
    const status = subscription.status || 'canceled'
    
    // CRITICAL: Consistent active status check across all endpoints
    const isActive = status === 'active' || status === 'trialing'

    return {
      isValid: true,
      tier,
      status,
      isActive
    }
  } catch (error: any) {
    console.error('[SUBSCRIPTION-CHECKER] Error checking subscription:', error)
    return {
      isValid: false,
      tier: 'none',
      status: 'error',
      isActive: false,
      error: error.message || 'Failed to check subscription',
      errorCode: 'CHECK_ERROR'
    }
  }
}

/**
 * Check if user has required tier for a feature
 */
export async function checkFeatureAccess(
  userId: string,
  requiredTier: SubscriptionTier,
  featureName: string
): Promise<SubscriptionCheckResult> {
  const check = await checkUserSubscription(userId)

  if (!check.isValid) {
    return check
  }

  // Map tier hierarchy for comparison
  const tierHierarchy: Record<SubscriptionTier, number> = {
    'none': 0,
    'free': 0,
    'basic': 1,
    'elite': 2
  }

  const userTierLevel = tierHierarchy[check.tier] || 0
  const requiredTierLevel = tierHierarchy[requiredTier] || 0

  if (!check.isActive) {
    return {
      ...check,
      isValid: false,
      error: `${featureName} requires an active ${requiredTier === 'elite' ? 'Tier 3 (Elite)' : 'Tier 2+'} subscription.`,
      requiredTier,
      upgradeUrl: '/dashboard/athlete/pricing'
    }
  }

  if (userTierLevel < requiredTierLevel) {
    let upgradeMessage = ''
    if (requiredTier === 'elite') {
      upgradeMessage = `${featureName} requires Tier 3 (Elite) subscription. Upgrade to unlock 1:1 coaching sessions and unlimited features.`
    } else {
      upgradeMessage = `${featureName} requires Tier 2+ subscription. Upgrade to unlock video submissions and coach communication.`
    }

    return {
      ...check,
      isValid: false,
      error: upgradeMessage,
      requiredTier,
      upgradeUrl: '/dashboard/athlete/pricing'
    }
  }

  return check
}

/**
 * Check coach limit with detailed error message
 */
export async function checkCoachLimit(
  userId: string,
  currentCoachCount: number
): Promise<{ allowed: boolean; maxCoaches: number; error?: string; upgradeUrl?: string }> {
  const check = await checkUserSubscription(userId)

  if (!check.isValid || !check.isActive) {
    return {
      allowed: false,
      maxCoaches: 1,
      error: 'Active subscription required. Upgrade to follow more coaches.',
      upgradeUrl: '/dashboard/athlete/pricing'
    }
  }

  // Get max coaches for tier
  const maxCoachesMap: Record<SubscriptionTier, number> = {
    'none': 1,
    'free': 1,
    'basic': 3,
    'elite': -1 // unlimited
  }

  const maxCoaches = maxCoachesMap[check.tier] || 1

  if (maxCoaches === -1) {
    return { allowed: true, maxCoaches: -1 }
  }

  if (currentCoachCount >= maxCoaches) {
    let error = ''
    if (check.tier === 'none' || check.tier === 'free') {
      error = `You've reached your Free tier limit of 1 coach. Upgrade to Tier 2 ($9.99/month) to follow up to 3 coaches, or Tier 3 ($19.99/month) for unlimited coaches.`
    } else if (check.tier === 'basic') {
      error = `You've reached your Tier 2 limit of 3 coaches. Upgrade to Tier 3 ($19.99/month) to follow unlimited coaches and unlock 1:1 coaching sessions.`
    }

    return {
      allowed: false,
      maxCoaches,
      error,
      upgradeUrl: '/dashboard/athlete/pricing'
    }
  }

  return { allowed: true, maxCoaches }
}

/**
 * Check video submission limit for Basic tier
 */
export async function checkVideoSubmissionLimit(
  userId: string
): Promise<{ allowed: boolean; used: number; limit: number; remaining: number; error?: string }> {
  const check = await checkUserSubscription(userId)

  if (!check.isValid || !check.isActive) {
    return {
      allowed: false,
      used: 0,
      limit: 0,
      remaining: 0,
      error: 'Active subscription required for video submissions.'
    }
  }

  // Only Basic tier has limits (Elite is unlimited)
  if (check.tier !== 'basic') {
    if (check.tier === 'elite') {
      return { allowed: true, used: 0, limit: -1, remaining: -1 } // unlimited
    }
    return {
      allowed: false,
      used: 0,
      limit: 0,
      remaining: 0,
      error: 'Video submissions require Tier 2+ subscription.'
    }
  }

  // Count submissions this month for Basic tier
  try {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfMonthTimestamp = Timestamp.fromDate(startOfMonth)

    // Query by submittedAt (primary) or createdAt (fallback for older submissions)
    const submissionsSnapshot = await adminDb
      .collection('submissions')
      .where('athleteUid', '==', userId)
      .where('submittedAt', '>=', startOfMonthTimestamp)
      .get()

    // Also check createdAt for submissions that might not have submittedAt set
    const createdAtSnapshot = await adminDb
      .collection('submissions')
      .where('athleteUid', '==', userId)
      .where('createdAt', '>=', startOfMonthTimestamp)
      .get()

    // Merge and deduplicate by document ID
    const submissionIds = new Set<string>()
    submissionsSnapshot.docs.forEach(doc => submissionIds.add(doc.id))
    createdAtSnapshot.docs.forEach(doc => submissionIds.add(doc.id))

    const used = submissionIds.size
    const limit = 2 // Basic tier limit
    const remaining = Math.max(0, limit - used)

    if (used >= limit) {
      return {
        allowed: false,
        used,
        limit,
        remaining: 0,
        error: `You've reached your monthly limit of ${limit} video submissions. Upgrade to Elite for unlimited submissions.`
      }
    }

    return { allowed: true, used, limit, remaining }
  } catch (error: any) {
    console.error('[SUBSCRIPTION-CHECKER] Error checking video limit:', error)
    // Fail closed - deny submission if check fails (safer for limits)
    return {
      allowed: false,
      used: 0,
      limit: 2,
      remaining: 0,
      error: 'Unable to verify submission limit. Please try again or contact support.'
    }
  }
}

