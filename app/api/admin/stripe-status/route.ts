import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, hasRole } from '@/lib/auth-utils'
import { getStripeEnvStatus } from '@/lib/stripe'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  // Auth – must be signed in
  const authResult = await requireAuth(request)
  if (!authResult.success) {
    return NextResponse.json({ success: false, error: authResult.error }, { status: authResult.status })
  }

  const { user } = authResult
  const userId = user.uid
  const userEmail = (user.email || '').toLowerCase()

  // Only superadmin or the configured Stripe config admin email can view status
  const isSuperadmin = await hasRole(userId, 'superadmin')
  const allowedEmail = (process.env.STRIPE_CONFIG_ADMIN_EMAIL || '').toLowerCase()
  const isExplicitlyAllowed = allowedEmail && userEmail === allowedEmail

  if (!isSuperadmin && !isExplicitlyAllowed) {
    return NextResponse.json(
      { success: false, error: 'Insufficient permissions' },
      { status: 403 }
    )
  }

  const status = getStripeEnvStatus()

  const allRequiredPresent =
    status.hasSecretKey &&
    status.hasPublishableKey &&
    status.hasWebhookSecret &&
    status.hasPortalReturnUrl

  const configured = allRequiredPresent && status.hasAnyPriceIds

  return NextResponse.json({
    success: true,
    data: {
      configured,
      details: status
    }
  })
}


