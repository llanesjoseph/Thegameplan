/**
 * Subscription Tier Access Control
 * Strict enforcement of feature availability based on subscription tier
 */

export type SubscriptionTier = 'free' | 'basic' | 'elite' | 'none'

export interface SubscriptionStatus {
  tier?: SubscriptionTier
  status?: string
  isActive?: boolean
}

/**
 * Feature access definitions per tier
 */
export const TIER_FEATURES = {
  free: {
    canRequestCoachingSession: false, // Tier 3 only
    canAskQuestion: false, // Tier 2+
    canSubmitVideo: false, // Tier 2+
    maxCoaches: 1,
    maxVideoSubmissions: 0,
    hasAIAssistant: false,
    hasCoachFeed: false,
  },
  none: {
    canRequestCoachingSession: false,
    canAskQuestion: false,
    canSubmitVideo: false,
    maxCoaches: 1,
    maxVideoSubmissions: 0,
    hasAIAssistant: false,
    hasCoachFeed: false,
  },
  basic: {
    canRequestCoachingSession: false, // Tier 3 only
    canAskQuestion: true, // Tier 2+
    canSubmitVideo: true, // Tier 2+ (2 per month)
    maxCoaches: 3,
    maxVideoSubmissions: 2,
    hasAIAssistant: false,
    hasCoachFeed: false,
  },
  elite: {
    canRequestCoachingSession: true, // Tier 3 only
    canAskQuestion: true, // Tier 2+
    canSubmitVideo: true, // Tier 2+ (unlimited)
    maxCoaches: -1, // unlimited
    maxVideoSubmissions: -1, // unlimited
    hasAIAssistant: true,
    hasCoachFeed: true,
  },
} as const

/**
 * Check if user can request a coaching session (1:1 live session)
 * REQUIRES: Tier 3 (Elite) only
 */
export function canRequestCoachingSession(subscription: SubscriptionStatus | null | undefined): boolean {
  if (!subscription?.isActive) return false
  const tier = subscription.tier || 'none'
  return TIER_FEATURES[tier]?.canRequestCoachingSession || false
}

/**
 * Check if user can ask questions (Ask Me Anything / AI Assistant)
 * REQUIRES: Tier 2+ (Basic or Elite)
 */
export function canAskQuestion(subscription: SubscriptionStatus | null | undefined): boolean {
  if (!subscription?.isActive) return false
  const tier = subscription.tier || 'none'
  return TIER_FEATURES[tier]?.canAskQuestion || false
}

/**
 * Check if user can submit training videos
 * REQUIRES: Tier 2+ (Basic or Elite)
 */
export function canSubmitVideo(subscription: SubscriptionStatus | null | undefined): boolean {
  if (!subscription?.isActive) return false
  const tier = subscription.tier || 'none'
  return TIER_FEATURES[tier]?.canSubmitVideo || false
}

/**
 * Get the minimum tier required for a feature
 */
export function getRequiredTierForFeature(feature: 'coachingSession' | 'askQuestion' | 'submitVideo'): SubscriptionTier {
  switch (feature) {
    case 'coachingSession':
      return 'elite' // Tier 3 only
    case 'askQuestion':
    case 'submitVideo':
      return 'basic' // Tier 2+
    default:
      return 'elite'
  }
}

/**
 * Get feature name for upgrade messaging
 */
export function getFeatureName(feature: 'coachingSession' | 'askQuestion' | 'submitVideo'): string {
  switch (feature) {
    case 'coachingSession':
      return 'Request Coaching Session'
    case 'askQuestion':
      return 'Ask A Question'
    case 'submitVideo':
      return 'Submit Training Video'
    default:
      return 'Premium Feature'
  }
}

/**
 * Get upgrade message for locked features
 */
export function getUpgradeMessage(feature: 'coachingSession' | 'askQuestion' | 'submitVideo'): string {
  const requiredTier = getRequiredTierForFeature(feature)
  const featureName = getFeatureName(feature)
  
  if (requiredTier === 'elite') {
    return `${featureName} is available with Tier 3 (Elite) subscription. Upgrade to unlock 1:1 coaching sessions and unlimited features.`
  } else {
    return `${featureName} is available with Tier 2+ subscription. Upgrade to unlock video submissions and coach communication.`
  }
}

/**
 * Get maximum coaches allowed for a subscription tier
 */
export function getMaxCoaches(tier: SubscriptionTier): number {
  return TIER_FEATURES[tier]?.maxCoaches || 1
}

/**
 * Check if user can add more coaches
 */
export function canAddCoach(
  subscription: SubscriptionStatus | null | undefined,
  currentCoachCount: number
): { allowed: boolean; maxCoaches: number; message?: string } {
  if (!subscription?.isActive) {
    return {
      allowed: false,
      maxCoaches: 1,
      message: 'Active subscription required. Upgrade to follow more coaches.'
    }
  }

  const tier = subscription.tier || 'none'
  const maxCoaches = getMaxCoaches(tier)
  
  if (maxCoaches === -1) {
    return { allowed: true, maxCoaches: -1 } // Unlimited
  }

  if (currentCoachCount >= maxCoaches) {
    let message = ''
    if (tier === 'none' || tier === 'free') {
      message = 'You\'ve reached your Free tier limit of 1 coach. Upgrade to Tier 2 ($9.99/month) to follow up to 3 coaches, or Tier 3 ($19.99/month) for unlimited coaches.'
    } else if (tier === 'basic') {
      message = 'You\'ve reached your Tier 2 limit of 3 coaches. Upgrade to Tier 3 ($19.99/month) to follow unlimited coaches and unlock 1:1 coaching sessions.'
    }
    
    return {
      allowed: false,
      maxCoaches,
      message
    }
  }

  return { allowed: true, maxCoaches }
}

