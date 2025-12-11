import Stripe from 'stripe'

const secretKey = process.env.STRIPE_SECRET_KEY

// Export a singleton Stripe client configured from server-side env vars.
// This file must only be imported in server / route handlers (never in client components).
export const stripe =
  secretKey && secretKey.length > 0
    ? new Stripe(secretKey, {
        // Use the Stripe SDK's default API version configured on the account
      })
    : null

export function ensureStripe() {
  if (!stripe) {
    throw new Error('Stripe is not configured. STRIPE_SECRET_KEY is missing.')
  }
  return stripe
}

export interface StripeEnvStatus {
  hasSecretKey: boolean
  hasPublishableKey: boolean
  hasWebhookSecret: boolean
  hasPortalReturnUrl: boolean
  hasAnyPriceIds: boolean
}

export function getStripeEnvStatus(): StripeEnvStatus {
  const priceIdsRaw = process.env.STRIPE_PRICE_IDS || ''
  const priceIds = priceIdsRaw
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean)

  return {
    hasSecretKey: !!process.env.STRIPE_SECRET_KEY,
    hasPublishableKey: !!process.env.STRIPE_PUBLISHABLE_KEY,
    hasWebhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
    hasPortalReturnUrl: !!process.env.STRIPE_PORTAL_RETURN_URL,
    hasAnyPriceIds: priceIds.length > 0
  }
}


