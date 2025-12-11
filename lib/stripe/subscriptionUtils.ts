import { adminDb } from '@/lib/firebase.admin';

export type SubscriptionTier = 'none' | 'basic' | 'elite';
export type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete';

export interface SubscriptionData {
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  currentPeriodEnd?: Date;
  cancelAtPeriodEnd?: boolean;
}

export interface AccessData {
  maxVideoSubmissions: number; // -1 for unlimited
  hasAIAssistant: boolean;
  hasCoachFeed: boolean;
  hasPriorityQueue: boolean;
}

/**
 * Check if a user has an active subscription
 */
export function hasActiveSubscription(subscription: SubscriptionData): boolean {
  return subscription.status === 'active' || subscription.status === 'trialing';
}

/**
 * Check if a user can submit videos based on their tier and usage
 */
export async function canSubmitVideo(athleteUid: string): Promise<{ allowed: boolean; reason?: string }> {
  try {
    const userDoc = await adminDb.collection('users').doc(athleteUid).get();

    if (!userDoc.exists) {
      return { allowed: false, reason: 'User not found' };
    }

    const userData = userDoc.data();
    const subscription = userData?.subscription as SubscriptionData;
    const access = userData?.access as AccessData;

    // Check if subscription is active
    if (!hasActiveSubscription(subscription)) {
      return {
        allowed: false,
        reason: 'Active subscription required. Please upgrade your plan.'
      };
    }

    // Unlimited submissions for elite
    if (access.maxVideoSubmissions === -1) {
      return { allowed: true };
    }

    // Check monthly usage for basic tier
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const videosThisMonth = await adminDb
      .collection('videos')
      .where('athleteUid', '==', athleteUid)
      .where('submittedAt', '>=', startOfMonth)
      .count()
      .get();

    const count = videosThisMonth.data().count;

    if (count >= access.maxVideoSubmissions) {
      return {
        allowed: false,
        reason: `You've reached your monthly limit of ${access.maxVideoSubmissions} video submissions. Upgrade to Elite for unlimited submissions.`
      };
    }

    return { allowed: true };
  } catch (error) {
    console.error('Error checking video submission access:', error);
    return { allowed: false, reason: 'Error checking subscription access' };
  }
}

/**
 * Check if user has access to AI assistant
 */
export async function hasAIAssistantAccess(athleteUid: string): Promise<boolean> {
  try {
    const userDoc = await adminDb.collection('users').doc(athleteUid).get();

    if (!userDoc.exists) {
      return false;
    }

    const userData = userDoc.data();
    const subscription = userData?.subscription as SubscriptionData;
    const access = userData?.access as AccessData;

    return hasActiveSubscription(subscription) && access.hasAIAssistant;
  } catch (error) {
    console.error('Error checking AI assistant access:', error);
    return false;
  }
}

/**
 * Check if user has access to coach feed
 */
export async function hasCoachFeedAccess(athleteUid: string): Promise<boolean> {
  try {
    const userDoc = await adminDb.collection('users').doc(athleteUid).get();

    if (!userDoc.exists) {
      return false;
    }

    const userData = userDoc.data();
    const subscription = userData?.subscription as SubscriptionData;
    const access = userData?.access as AccessData;

    return hasActiveSubscription(subscription) && access.hasCoachFeed;
  } catch (error) {
    console.error('Error checking coach feed access:', error);
    return false;
  }
}

/**
 * Get user's current video submission count for the month
 */
export async function getMonthlyVideoCount(athleteUid: string): Promise<number> {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const videosThisMonth = await adminDb
      .collection('videos')
      .where('athleteUid', '==', athleteUid)
      .where('submittedAt', '>=', startOfMonth)
      .count()
      .get();

    return videosThisMonth.data().count;
  } catch (error) {
    console.error('Error getting monthly video count:', error);
    return 0;
  }
}

/**
 * Get user's subscription summary
 */
export async function getSubscriptionSummary(athleteUid: string): Promise<{
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  isActive: boolean;
  videoSubmissions: {
    used: number;
    limit: number; // -1 for unlimited
    remaining: number; // -1 for unlimited
  };
  features: {
    hasAIAssistant: boolean;
    hasCoachFeed: boolean;
    hasPriorityQueue: boolean;
  };
  billing?: {
    currentPeriodEnd: Date;
    cancelAtPeriodEnd: boolean;
  };
}> {
  try {
    const userDoc = await adminDb.collection('users').doc(athleteUid).get();

    if (!userDoc.exists) {
      // Return default "no subscription" state for missing users
      return {
        tier: 'none',
        status: 'canceled',
        isActive: false,
        videoSubmissions: { used: 0, limit: 0, remaining: 0 },
        features: { hasAIAssistant: false, hasCoachFeed: false, hasPriorityQueue: false },
      };
    }

    const userData = userDoc.data();
    
    // Handle missing subscription/access objects gracefully
    const subscription: SubscriptionData = userData?.subscription || {
      tier: 'none',
      status: 'canceled',
    };
    
    const access: AccessData = userData?.access || {
      maxVideoSubmissions: 0,
      hasAIAssistant: false,
      hasCoachFeed: false,
      hasPriorityQueue: false,
    };

    const monthlyCount = await getMonthlyVideoCount(athleteUid);
    const limit = access.maxVideoSubmissions ?? 0;
    const remaining = limit === -1 ? -1 : Math.max(0, limit - monthlyCount);

    const isActive = subscription.status === 'active' || subscription.status === 'trialing';

    return {
      tier: subscription.tier || 'none',
      status: subscription.status || 'canceled',
      isActive,
      videoSubmissions: {
        used: monthlyCount,
        limit,
        remaining,
      },
      features: {
        hasAIAssistant: access.hasAIAssistant || false,
        hasCoachFeed: access.hasCoachFeed || false,
        hasPriorityQueue: access.hasPriorityQueue || false,
      },
      billing: subscription.currentPeriodEnd ? {
        currentPeriodEnd: subscription.currentPeriodEnd,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd || false,
      } : undefined,
    };
  } catch (error) {
    console.error('Error getting subscription summary:', error);
    // Return safe default instead of throwing
    return {
      tier: 'none',
      status: 'canceled',
      isActive: false,
      videoSubmissions: { used: 0, limit: 0, remaining: 0 },
      features: { hasAIAssistant: false, hasCoachFeed: false, hasPriorityQueue: false },
    };
  }
}

/**
 * Initialize subscription data for new athletes
 */
export async function initializeAthleteSubscription(athleteUid: string): Promise<void> {
  try {
    await adminDb.collection('users').doc(athleteUid).update({
      subscription: {
        tier: 'none',
        status: 'canceled',
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
      },
      access: {
        maxVideoSubmissions: 0,
        hasAIAssistant: false,
        hasCoachFeed: false,
        hasPriorityQueue: false,
      },
      updatedAt: new Date(),
    });
  } catch (error) {
    console.error('Error initializing athlete subscription:', error);
    throw error;
  }
}
