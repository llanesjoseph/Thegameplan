import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { adminDb } from '@/lib/firebase.admin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// Access limits per tier
const TIER_ACCESS = {
  basic: {
    maxVideoSubmissions: 2,
    hasAIAssistant: false,
    hasCoachFeed: false,
    hasPriorityQueue: false,
  },
  elite: {
    maxVideoSubmissions: -1, // -1 means unlimited
    hasAIAssistant: true,
    hasCoachFeed: true,
    hasPriorityQueue: true,
  },
  none: {
    maxVideoSubmissions: 0,
    hasAIAssistant: false,
    hasCoachFeed: false,
    hasPriorityQueue: false,
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
  const tier = session.metadata?.tier as 'basic' | 'elite';

  if (!firebaseUID || !tier) {
    console.error('Missing metadata in checkout session:', session.id);
    return;
  }

  console.log(`Checkout completed for user ${firebaseUID}, tier: ${tier}`);

  // Update will happen in subscription.created event
  // This just logs the checkout completion
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  const firebaseUID = subscription.metadata?.firebaseUID;
  const tier = subscription.metadata?.tier as 'basic' | 'elite';

  if (!firebaseUID || !tier) {
    console.error('Missing metadata in subscription:', subscription.id);
    return;
  }

  const access = TIER_ACCESS[tier];

  await adminDb.collection('users').doc(firebaseUID).update({
    'subscription.tier': tier,
    'subscription.stripeSubscriptionId': subscription.id,
    'subscription.status': subscription.status,
    'subscription.currentPeriodEnd': new Date(subscription.current_period_end * 1000),
    'subscription.cancelAtPeriodEnd': subscription.cancel_at_period_end,
    'access.maxVideoSubmissions': access.maxVideoSubmissions,
    'access.hasAIAssistant': access.hasAIAssistant,
    'access.hasCoachFeed': access.hasCoachFeed,
    'access.hasPriorityQueue': access.hasPriorityQueue,
    updatedAt: new Date(),
  });

  console.log(`Subscription created for user ${firebaseUID}: ${tier} tier`);
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const firebaseUID = subscription.metadata?.firebaseUID;
  let tier = subscription.metadata?.tier as 'basic' | 'elite';

  if (!firebaseUID) {
    console.error('Missing firebaseUID in subscription metadata:', subscription.id);
    return;
  }

  // If tier is not in metadata, try to determine from price ID
  if (!tier) {
    const priceId = subscription.items.data[0]?.price.id;
    if (priceId === process.env.STRIPE_ATHLETE_BASIC_PRICE_ID) {
      tier = 'basic';
    } else if (priceId === process.env.STRIPE_ATHLETE_ELITE_PRICE_ID) {
      tier = 'elite';
    }
  }

  if (!tier) {
    console.error('Could not determine tier for subscription:', subscription.id);
    return;
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

  console.log(`Subscription updated for user ${firebaseUID}: ${tier} tier, status: ${subscription.status}`);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const firebaseUID = subscription.metadata?.firebaseUID;

  if (!firebaseUID) {
    console.error('Missing firebaseUID in subscription metadata:', subscription.id);
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

  console.log(`Subscription canceled for user ${firebaseUID}`);
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
