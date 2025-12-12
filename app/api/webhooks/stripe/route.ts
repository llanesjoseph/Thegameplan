import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { adminDb } from '@/lib/firebase.admin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// Access limits per tier
const TIER_ACCESS = {
  free: {
    maxVideoSubmissions: 0,
    hasAIAssistant: false,
    hasCoachFeed: false,
    hasPriorityQueue: false,
    maxCoaches: 1,
  },
  basic: {
    maxVideoSubmissions: 2,
    hasAIAssistant: false,
    hasCoachFeed: false,
    hasPriorityQueue: false,
    maxCoaches: 3,
  },
  elite: {
    maxVideoSubmissions: -1, // -1 means unlimited
    hasAIAssistant: true,
    hasCoachFeed: true,
    hasPriorityQueue: true,
    maxCoaches: -1, // unlimited
  },
  none: {
    maxVideoSubmissions: 0,
    hasAIAssistant: false,
    hasCoachFeed: false,
    hasPriorityQueue: false,
    maxCoaches: 1, // FREE TIER: Allows 1 coach access
  },
};

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      // When checkout is completed
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }

      // When subscription is created (after checkout)
      case 'customer.subscription.created': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionCreated(subscription);
        break;
      }

      // When subscription is updated (e.g., plan change, renewal)
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription);
        break;
      }

      // When subscription is deleted/canceled
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      // When payment fails
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(invoice);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const firebaseUID = session.metadata?.firebaseUID;
  const tier = session.metadata?.tier as 'free' | 'basic' | 'elite';

  console.log(`[WEBHOOK] Processing checkout.session.completed: ${session.id}`);
  console.log(`[WEBHOOK] Session metadata:`, session.metadata);

  if (!firebaseUID) {
    console.error(`[WEBHOOK] ❌ Missing firebaseUID in checkout session: ${session.id}`);
    return;
  }

  const customerId = typeof session.customer === 'string' 
    ? session.customer 
    : (session.customer as any)?.id;

  console.log(`[WEBHOOK] Checkout completed for user ${firebaseUID}, tier: ${tier || 'unknown'}, customer: ${customerId}`);

  // Pre-emptively update the user with stripeCustomerId so webhook can find them
  // This helps the subscription.created event find the user if metadata is missing
  try {
    const updateData: any = {
      'subscription.stripeCustomerId': customerId,
      updatedAt: new Date(),
    };

    // If we have tier info, set it as pending so UI can show appropriate state
    if (tier) {
      updateData['subscription.pendingTier'] = tier;
    }

    await adminDb.collection('users').doc(firebaseUID).update(updateData);
    console.log(`[WEBHOOK] ✅ Pre-updated user ${firebaseUID} with stripeCustomerId: ${customerId}`);
  } catch (error) {
    console.error(`[WEBHOOK] ⚠️ Could not pre-update user ${firebaseUID}:`, error);
    // Non-fatal - the subscription.created event will still work via metadata
  }

  // Main subscription update will happen in subscription.created event
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  console.log(`[WEBHOOK] Processing subscription.created: ${subscription.id}`);
  console.log(`[WEBHOOK] Subscription metadata:`, subscription.metadata);
  
  let firebaseUID = subscription.metadata?.firebaseUID;
  let tier = subscription.metadata?.tier as 'free' | 'basic' | 'elite' | undefined;

  const customerId = typeof subscription.customer === 'string' 
    ? subscription.customer 
    : subscription.customer.id;

  // If metadata missing, try to find user by stripeCustomerId
  if (!firebaseUID && customerId) {
    console.log(`[WEBHOOK] No firebaseUID in metadata, looking up by stripeCustomerId: ${customerId}`);
    
    // Try multiple query patterns to find the user
    let usersQuery = await adminDb.collection('users')
      .where('subscription.stripeCustomerId', '==', customerId)
      .limit(1)
      .get();
    
    if (usersQuery.empty) {
      // Also try the legacy field location
      usersQuery = await adminDb.collection('users')
        .where('stripeCustomerId', '==', customerId)
        .limit(1)
        .get();
    }
    
    if (!usersQuery.empty) {
      firebaseUID = usersQuery.docs[0].id;
      console.log(`[WEBHOOK] Found user ${firebaseUID} by stripeCustomerId`);
    }
  }

  if (!firebaseUID) {
    console.error(`[WEBHOOK] ❌ Could not find firebaseUID for subscription: ${subscription.id}, customer: ${customerId}`);
    console.error(`[WEBHOOK] This subscription will need manual processing or will be picked up by verify-session endpoint`);
    return;
  }

  // Determine tier from price ID if not in metadata
  if (!tier) {
    const priceId = subscription.items.data[0]?.price.id;
    if (priceId === process.env.STRIPE_ATHLETE_FREE_PRICE_ID) {
      tier = 'free';
    } else if (priceId === process.env.STRIPE_ATHLETE_BASIC_PRICE_ID) {
      tier = 'basic';
    } else if (priceId === process.env.STRIPE_ATHLETE_ELITE_PRICE_ID) {
      tier = 'elite';
    } else {
      tier = 'free'; // Default to free
    }
    console.log(`[WEBHOOK] Determined tier from price ID: ${tier}`);
  }

  const access = TIER_ACCESS[tier];

  try {
    await adminDb.collection('users').doc(firebaseUID).update({
      'subscription.tier': tier,
      'subscription.stripeSubscriptionId': subscription.id,
      'subscription.stripeCustomerId': customerId,
      'subscription.status': subscription.status,
      'subscription.currentPeriodEnd': new Date(subscription.current_period_end * 1000),
      'subscription.cancelAtPeriodEnd': subscription.cancel_at_period_end,
      'access.maxVideoSubmissions': access.maxVideoSubmissions,
      'access.hasAIAssistant': access.hasAIAssistant,
      'access.hasCoachFeed': access.hasCoachFeed,
      'access.hasPriorityQueue': access.hasPriorityQueue,
      updatedAt: new Date(),
    });

    console.log(`[WEBHOOK] ✅ Subscription created for user ${firebaseUID}: ${tier} tier, status: ${subscription.status}`);
  } catch (updateError) {
    console.error(`[WEBHOOK] ❌ Failed to update user ${firebaseUID}:`, updateError);
    throw updateError;
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  let firebaseUID = subscription.metadata?.firebaseUID;
  let tier = subscription.metadata?.tier as 'free' | 'basic' | 'elite' | undefined;

  // If metadata missing, try to find user by stripeCustomerId
  if (!firebaseUID && subscription.customer) {
    const customerId = typeof subscription.customer === 'string' 
      ? subscription.customer 
      : subscription.customer.id;
    
    console.log(`[UPDATE] Looking up user by stripeCustomerId: ${customerId}`);
    
    const usersQuery = await adminDb.collection('users')
      .where('subscription.stripeCustomerId', '==', customerId)
      .limit(1)
      .get();
    
    if (!usersQuery.empty) {
      firebaseUID = usersQuery.docs[0].id;
      console.log(`[UPDATE] Found user ${firebaseUID} by stripeCustomerId`);
    }
  }

  if (!firebaseUID) {
    console.error('Could not find firebaseUID for subscription update:', subscription.id);
    return;
  }

  // If tier is not in metadata, try to determine from price ID
  if (!tier) {
    const priceId = subscription.items.data[0]?.price.id;
    if (priceId === process.env.STRIPE_ATHLETE_FREE_PRICE_ID) {
      tier = 'free';
    } else if (priceId === process.env.STRIPE_ATHLETE_BASIC_PRICE_ID) {
      tier = 'basic';
    } else if (priceId === process.env.STRIPE_ATHLETE_ELITE_PRICE_ID) {
      tier = 'elite';
    } else {
      tier = 'free'; // Default to free
    }
  }

  const access = TIER_ACCESS[tier];

  await adminDb.collection('users').doc(firebaseUID).update({
    'subscription.tier': tier,
    'subscription.status': subscription.status,
    'subscription.currentPeriodEnd': new Date(subscription.current_period_end * 1000),
    'subscription.cancelAtPeriodEnd': subscription.cancel_at_period_end,
    'access.maxVideoSubmissions': access.maxVideoSubmissions,
    'access.hasAIAssistant': access.hasAIAssistant,
    'access.hasCoachFeed': access.hasCoachFeed,
    'access.hasPriorityQueue': access.hasPriorityQueue,
    updatedAt: new Date(),
  });

  console.log(`✅ Subscription updated for user ${firebaseUID}: ${tier} tier, status: ${subscription.status}`);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  let firebaseUID = subscription.metadata?.firebaseUID;

  // If metadata missing, try to find user by stripeCustomerId
  if (!firebaseUID && subscription.customer) {
    const customerId = typeof subscription.customer === 'string' 
      ? subscription.customer 
      : subscription.customer.id;
    
    console.log(`[DELETE] Looking up user by stripeCustomerId: ${customerId}`);
    
    const usersQuery = await adminDb.collection('users')
      .where('subscription.stripeCustomerId', '==', customerId)
      .limit(1)
      .get();
    
    if (!usersQuery.empty) {
      firebaseUID = usersQuery.docs[0].id;
      console.log(`[DELETE] Found user ${firebaseUID} by stripeCustomerId`);
    }
  }

  if (!firebaseUID) {
    console.error('Could not find firebaseUID for subscription deletion:', subscription.id);
    return;
  }

  const access = TIER_ACCESS.none;

  await adminDb.collection('users').doc(firebaseUID).update({
    'subscription.tier': 'none',
    'subscription.status': 'canceled',
    'subscription.cancelAtPeriodEnd': false,
    'access.maxVideoSubmissions': access.maxVideoSubmissions,
    'access.hasAIAssistant': access.hasAIAssistant,
    'access.hasCoachFeed': access.hasCoachFeed,
    'access.hasPriorityQueue': access.hasPriorityQueue,
    updatedAt: new Date(),
  });

  console.log(`✅ Subscription canceled for user ${firebaseUID}`);
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const subscriptionId = invoice.subscription as string;

  if (!subscriptionId) {
    console.error('No subscription ID in failed invoice:', invoice.id);
    return;
  }

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const firebaseUID = subscription.metadata?.firebaseUID;

  if (!firebaseUID) {
    console.error('Missing firebaseUID in subscription metadata:', subscriptionId);
    return;
  }

  await adminDb.collection('users').doc(firebaseUID).update({
    'subscription.status': 'past_due',
    updatedAt: new Date(),
  });

  console.log(`Payment failed for user ${firebaseUID}, subscription: ${subscriptionId}`);
}
