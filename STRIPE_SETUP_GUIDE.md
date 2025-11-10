# Stripe Subscription Setup Guide

This guide will walk you through setting up Stripe subscriptions for Athleap with the Basic ($19.99/month) and Elite ($29.99/month) tiers.

## Overview

- **Basic Tier**: $19.99/month - 2 video submissions, basic features
- **Elite Tier**: $29.99/month - Unlimited videos, AI assistant, coach feed, priority queue
- **Free Trial**: 7 days for all new subscriptions
- **Target**: Athletes pay subscriptions, coaches use platform free

## Step 1: Create Stripe Account & Get API Keys

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Create an account or log in
3. Navigate to **Developers** → **API keys**
4. Copy your **Publishable key** and **Secret key**
5. Add to your `.env.local`:
   ```
   STRIPE_PUBLIC_KEY=pk_test_...
   STRIPE_SECRET_KEY=sk_test_...
   ```

## Step 2: Create Subscription Products

### Create Basic Tier Product

1. In Stripe Dashboard, go to **Products** → **Add product**
2. Fill in:
   - **Name**: Athleap Basic
   - **Description**: Perfect for athletes starting their journey - 2 video submissions per month, progress tracking, direct coach messaging
   - **Pricing model**: Standard pricing
   - **Price**: $19.99 USD
   - **Billing period**: Monthly
   - **Currency**: USD
3. Click **Add product**
4. Copy the **Price ID** (starts with `price_...`)
5. Add to `.env.local`:
   ```
   STRIPE_ATHLETE_BASIC_PRICE_ID=price_...
   ```

### Create Elite Tier Product

1. Click **Add product** again
2. Fill in:
   - **Name**: Athleap Elite
   - **Description**: For serious athletes - unlimited video submissions, AI assistant, coach feed access, priority review queue
   - **Pricing model**: Standard pricing
   - **Price**: $29.99 USD
   - **Billing period**: Monthly
   - **Currency**: USD
3. Click **Add product**
4. Copy the **Price ID** (starts with `price_...`)
5. Add to `.env.local`:
   ```
   STRIPE_ATHLETE_ELITE_PRICE_ID=price_...
   ```

## Step 3: Set Up Webhooks

Webhooks keep your database in sync with Stripe subscription events.

### Local Development (using Stripe CLI)

1. Install Stripe CLI:
   ```bash
   # Windows
   scoop bucket add stripe https://github.com/stripe/scoop-stripe-cli.git
   scoop install stripe

   # macOS
   brew install stripe/stripe-cli/stripe

   # Linux
   # Download from https://github.com/stripe/stripe-cli/releases
   ```

2. Login to Stripe CLI:
   ```bash
   stripe login
   ```

3. Forward webhooks to your local server:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

4. Copy the webhook signing secret (starts with `whsec_...`)
5. Add to `.env.local`:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

### Production (Vercel/Production URL)

1. In Stripe Dashboard, go to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Enter your webhook URL:
   ```
   https://yourdomain.com/api/webhooks/stripe
   ```
4. Select events to listen to:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
5. Click **Add endpoint**
6. Copy the **Signing secret** (starts with `whsec_...`)
7. Add to your production environment variables in Vercel:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

## Step 4: Enable Stripe Customer Portal

The Customer Portal allows users to manage their subscriptions.

1. In Stripe Dashboard, go to **Settings** → **Billing** → **Customer portal**
2. Click **Activate**
3. Configure settings:
   - **Allow customers to**:
     - ✅ Update subscriptions (upgrade/downgrade)
     - ✅ Cancel subscriptions
     - ✅ Update payment methods
     - ✅ View invoices
   - **Cancellation behavior**: End subscription at end of billing period
   - **Proration**: Prorate plan changes
4. Click **Save changes**

## Step 5: Test the Integration

### Test with Stripe Test Cards

Use these test card numbers:

- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **3D Secure**: `4000 0025 0000 3155`

For all cards:
- **Expiry**: Any future date
- **CVC**: Any 3 digits
- **ZIP**: Any 5 digits

### Testing Flow

1. Start your dev server:
   ```bash
   npm run dev
   ```

2. Start Stripe webhook forwarding (in another terminal):
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

3. Navigate to pricing page:
   ```
   http://localhost:3000/dashboard/athlete/pricing
   ```

4. Click **Start Free Trial** on either tier

5. Complete checkout with test card `4242 4242 4242 4242`

6. Verify in Stripe Dashboard:
   - Go to **Customers** → See new customer
   - Go to **Subscriptions** → See active subscription with 7-day trial
   - Go to **Events** → See webhook events processed

7. Verify in your app:
   - Check Firestore `users/{athleteUid}` document
   - Should have `subscription.tier`, `subscription.status = 'trialing'`
   - Should have `access` object with correct permissions

### Test Subscription Lifecycle

1. **Create subscription** - Use test card, verify trial starts
2. **Check subscription status** - Call `/api/athlete/subscriptions/status`
3. **Access customer portal** - Call `/api/athlete/subscriptions/customer-portal`
4. **Cancel subscription** - Use customer portal to cancel
5. **Verify cancellation** - Check webhook fires and database updates

## Step 6: Deploy to Production

### Update Environment Variables

In your Vercel dashboard (or hosting platform):

1. Go to **Settings** → **Environment Variables**
2. Add all Stripe variables:
   ```
   STRIPE_PUBLIC_KEY=pk_live_...
   STRIPE_SECRET_KEY=sk_live_...
   STRIPE_WEBHOOK_SECRET=whsec_... (from production webhook)
   STRIPE_ATHLETE_BASIC_PRICE_ID=price_...
   STRIPE_ATHLETE_ELITE_PRICE_ID=price_...
   NEXT_PUBLIC_BASE_URL=https://yourdomain.com
   ```

### Switch to Live Mode

1. In Stripe Dashboard, toggle from **Test mode** to **Live mode** (top right)
2. Create **live mode** products (same as test mode products)
3. Copy **live mode** Price IDs
4. Update production environment variables with live keys

## Troubleshooting

### Webhook Events Not Firing

- Check Stripe CLI is running: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
- Check webhook secret matches in `.env.local`
- Check webhook endpoint URL is correct
- View webhook logs in Stripe Dashboard → Developers → Webhooks

### Subscription Not Creating

- Check Stripe API keys are correct
- Check Price IDs match your products
- Check Firebase Admin is initialized correctly
- View server logs for error messages
- Check Stripe Dashboard → Developers → Logs

### Customer Portal Not Working

- Ensure Customer Portal is activated in Stripe Dashboard
- Check `stripeCustomerId` exists in Firestore user document
- Verify return URL is correct

## File Structure

```
app/
├── api/
│   ├── athlete/
│   │   └── subscriptions/
│   │       ├── create-checkout/route.ts  # Create checkout session
│   │       ├── customer-portal/route.ts  # Manage subscription
│   │       └── status/route.ts           # Get subscription status
│   └── webhooks/
│       └── stripe/route.ts               # Process webhook events
├── dashboard/
│   └── athlete/
│       └── pricing/page.tsx              # Pricing page UI
lib/
└── stripe/
    └── subscriptionUtils.ts              # Helper functions
```

## Next Steps

1. ✅ Set up Stripe account and get API keys
2. ✅ Create Basic and Elite products
3. ✅ Set up webhooks (local and production)
4. ✅ Enable Customer Portal
5. ✅ Test with test cards
6. ✅ Deploy to production with live keys
7. 🔄 Monitor subscriptions in Stripe Dashboard
8. 🔄 Set up email notifications (optional)
9. 🔄 Add subscription badge/indicator to athlete UI
10. 🔄 Implement feature gating in other parts of app

## Revenue Tracking

With 100 athletes (60% Basic, 40% Elite):
- 60 × $19.99 = $1,199.40
- 40 × $29.99 = $1,199.60
- **Total MRR**: $2,399/month
- **Annual run rate**: $28,788/year
- **After Stripe fees (2.9% + $0.30)**: ~$2,304/month net

## Support

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe API Reference](https://stripe.com/docs/api)
- [Stripe Testing](https://stripe.com/docs/testing)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
