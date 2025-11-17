import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, hasRole } from '@/lib/auth-utils'
import { adminDb } from '@/lib/firebase.admin'
import { setStripeConfigViaVercelEnv } from '@/lib/config/setStripeConfig'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface SaveStripeConfigBody {
  secretKey: string
  publishableKey: string
  webhookSecret: string
  priceIds?: string[] | string
  portalReturnUrl: string
}

export async function POST(request: NextRequest) {
  try {
    // Step 1: Auth – must be signed in
    const authResult = await requireAuth(request)
    if (!authResult.success) {
      return NextResponse.json({ success: false, error: authResult.error }, { status: authResult.status })
    }

    const { user } = authResult
    const userId = user.uid
    const userEmail = (user.email || '').toLowerCase()

    // Step 2: Authorization – only superadmin OR a single configured admin email
    const isSuperadmin = await hasRole(userId, 'superadmin')
    const allowedEmail = (process.env.STRIPE_CONFIG_ADMIN_EMAIL || '').toLowerCase()
    const isExplicitlyAllowed = allowedEmail && userEmail === allowedEmail

    if (!isSuperadmin && !isExplicitlyAllowed) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Step 3: Parse and validate payload
    const body = (await request.json()) as SaveStripeConfigBody
    const {
      secretKey,
      publishableKey,
      webhookSecret,
      priceIds,
      portalReturnUrl
    } = body

    if (!secretKey || !publishableKey || !webhookSecret || !portalReturnUrl) {
      return NextResponse.json(
        { success: false, error: 'Missing required Stripe configuration fields.' },
        { status: 400 }
      )
    }

    const normalizedPriceIds =
      Array.isArray(priceIds) ? priceIds : priceIds ? [priceIds] : []

    // Step 4: Persist to provider env vars (never to Firestore)
    await setStripeConfigViaVercelEnv(
      {
        secretKey,
        publishableKey,
        webhookSecret,
        priceIds: normalizedPriceIds,
        portalReturnUrl
      },
      userId
    )

    // Step 5: Write non-sensitive audit log
    await adminDb.collection('admin_config_logs').add({
      type: 'stripe_config_update',
      configUpdatedAt: new Date().toISOString(),
      updatedBy: userId,
      updatedByEmail: userEmail || null,
      source: 'secure_admin_portal'
    })

    return NextResponse.json({
      success: true,
      message: 'Stripe configuration saved securely. Updates will be active within a few minutes.'
    })
  } catch (error: any) {
    // Make sure we never log the raw keys
    console.error('Error saving Stripe configuration (keys not logged):', error?.message || error)

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to save Stripe configuration. Please contact support or try again later.'
      },
      { status: 500 }
    )
  }
}


