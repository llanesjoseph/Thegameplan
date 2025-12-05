import { auditLog } from '@/lib/audit-logger'

export interface StripeConfigPayload {
  secretKey: string
  publishableKey: string
  webhookSecret: string
  priceIds?: string[]
  portalReturnUrl: string
}

/**
 * Write Stripe configuration to Vercel environment variables.
 * This runs server-side only and never logs or returns the raw keys.
 */
export async function setStripeConfigViaVercelEnv(config: StripeConfigPayload, updatedByUserId: string) {
  const vercelToken = process.env.VERCEL_AUTH_TOKEN
  const projectId = process.env.VERCEL_PROJECT_ID
  const targetEnv = process.env.VERCEL_ENV_TARGET || 'production'

  if (!vercelToken || !projectId) {
    throw new Error('Vercel environment management is not configured (VERCEL_AUTH_TOKEN / VERCEL_PROJECT_ID missing).')
  }

  const headers = {
    Authorization: `Bearer ${vercelToken}`,
    'Content-Type': 'application/json'
  }

  const envUrl = `https://api.vercel.com/v10/projects/${projectId}/env`

  const priceIdValue = Array.isArray(config.priceIds) ? config.priceIds.join(',') : (config.priceIds || '').toString()
  const firstPriceId = Array.isArray(config.priceIds) ? (config.priceIds[0] || '') : (config.priceIds || '').toString()
  const secondPriceId = Array.isArray(config.priceIds) ? (config.priceIds[1] || config.priceIds[0] || '') : (config.priceIds || '').toString()

  const envEntries: { key: string; value: string }[] = [
    { key: 'STRIPE_SECRET_KEY', value: config.secretKey },
    { key: 'STRIPE_PUBLISHABLE_KEY', value: config.publishableKey },
    { key: 'STRIPE_WEBHOOK_SECRET', value: config.webhookSecret },
    { key: 'STRIPE_PRICE_IDS', value: priceIdValue },
    { key: 'STRIPE_PORTAL_RETURN_URL', value: config.portalReturnUrl }
  ]

  // If price IDs are provided, also map them to our tier-specific env vars
  // so the subscription APIs and webhooks work without extra manual setup.
  if (firstPriceId) {
    envEntries.push({ key: 'STRIPE_ATHLETE_BASIC_PRICE_ID', value: firstPriceId })
  }
  if (secondPriceId) {
    envEntries.push({ key: 'STRIPE_ATHLETE_ELITE_PRICE_ID', value: secondPriceId })
  }

  for (const entry of envEntries) {
    // Do not log the value – only the key name
    const body = JSON.stringify({
      key: entry.key,
      value: entry.value,
      target: [targetEnv],
      type: 'encrypted'
    })

    const res = await fetch(envUrl, {
      method: 'POST',
      headers,
      body
    })

    if (!res.ok) {
      const errorBody = await res.json().catch(() => ({}))
      // Never include secret value in logs
      await auditLog('stripe_config_env_error', {
        key: entry.key,
        status: res.status,
        errorMessage: errorBody.error || errorBody.message || 'Unknown Vercel API error',
        timestamp: new Date().toISOString()
      }, { userId: updatedByUserId, severity: 'high' })

      throw new Error(`Failed to set environment variable ${entry.key} via Vercel API.`)
    }
  }

  // Optional: trigger redeploy via webhook so new env vars become active
  const redeployHookUrl = process.env.VERCEL_REDEPLOY_HOOK_URL
  if (redeployHookUrl) {
    try {
      await fetch(redeployHookUrl, { method: 'POST' })
      await auditLog('stripe_config_redeploy_triggered', {
        timestamp: new Date().toISOString()
      }, { userId: updatedByUserId, severity: 'low' })
    } catch (error: any) {
      await auditLog('stripe_config_redeploy_error', {
        error: error?.message || 'Unknown error',
        timestamp: new Date().toISOString()
      }, { userId: updatedByUserId, severity: 'medium' })
    }
  }
}


