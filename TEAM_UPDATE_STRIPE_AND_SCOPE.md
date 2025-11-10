# Team Update: Feature Scope & Stripe Subscriptions

**Date:** November 9, 2025
**From:** Development Team
**Subject:** Feature Cleanup Complete + Stripe Ready to Launch

---

## Feature Creep Reduction ✅ DONE

We removed 8 features from the athlete and coach dashboards to focus on what actually matters: video feedback and coaching.

**What we cut:**
- All live session/scheduling features (wasn't being used, adds weeks of dev time)
- Day streak gamification (made athletes feel bad when they broke it)
- Gear recommendations (distraction from coaching)
- Assistant coaches (too complex, coaches work solo)
- Recruit features (not ready for growth yet)

**What we kept:**
- Video reviews (core feature)
- Lessons
- Coach-athlete messaging
- Analytics
- Progress tracking

**Result:** Simpler, faster app focused on video coaching. See `FEATURES_BY_ROLE.txt` for the full list.

---

## Stripe Subscriptions 🎯 READY TO LAUNCH

We've built the complete subscription system. Athletes will pay monthly, coaches use the platform free.

### Pricing Tiers:
- **Basic:** $19.99/month - 2 video submissions, basic features
- **Elite:** $29.99/month - Unlimited videos, AI assistant, coach feed, priority queue
- **Free trial:** 7 days on all plans

### What's Built (Code Complete ✅):
- Checkout flow with Stripe
- Pricing page (dark theme, comparison table)
- Webhook handler (keeps database in sync)
- Subscription management portal
- Feature access control (limits enforced automatically)

### What We Need to Go Live (30 minutes of setup):

**Step 1: Get Stripe API Keys** (5 min)
- Login to Stripe Dashboard: https://dashboard.stripe.com
- Go to Developers → API keys
- Copy Publishable key and Secret key
- Add to environment variables

**Step 2: Create Products in Stripe** (10 min)
- Go to Products → Add product
- Create "Athleap Basic" at $19.99/month recurring
- Create "Athleap Elite" at $29.99/month recurring
- Copy both Price IDs
- Add to environment variables

**Step 3: Set Up Webhooks** (10 min)
- Go to Developers → Webhooks
- Add endpoint: `https://yourdomain.com/api/webhooks/stripe`
- Select events: subscription created, updated, deleted, payment failed
- Copy webhook secret
- Add to environment variables

**Step 4: Deploy** (5 min)
- Add all env vars to Vercel
- Deploy
- Test with Stripe test card: `4242 4242 4242 4242`

### Environment Variables Needed:
```
STRIPE_PUBLIC_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_ATHLETE_BASIC_PRICE_ID=price_...
STRIPE_ATHLETE_ELITE_PRICE_ID=price_...
NEXT_PUBLIC_BASE_URL=https://yourdomain.com
```

### Testing:
Full setup guide is in `STRIPE_SETUP_GUIDE.md` with screenshots and troubleshooting.

---

## Next Steps

**Immediate (This Week):**
1. Create Stripe products (30 min)
2. Set up webhooks (10 min)
3. Test checkout flow (15 min)
4. Deploy to production

**After Launch:**
- Monitor subscription signups in Stripe Dashboard
- Watch for webhook errors
- Track MRR (monthly recurring revenue)

---

## Questions?

- Stripe setup: See `STRIPE_SETUP_GUIDE.md`
- Feature decisions: See `SCOPE_REDUCTION_ANALYSIS.txt`
- Technical: Check code in `app/api/athlete/subscriptions/`

Ready to launch! 🚀
