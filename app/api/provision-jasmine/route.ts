import { NextRequest, NextResponse } from 'next/server'
import { isJasmineAikey, createJasmineOnboardingInvitation, checkJasmineProvisioningStatus } from '@/lib/jasmine-provisioning'
import { auditLog } from '@/lib/audit-logger'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { uid, email } = body

    // Validate required fields
    if (!uid || !email) {
      return NextResponse.json(
        { error: 'UID and email are required' },
        { status: 400 }
      )
    }

    // Verify this is actually Jasmine
    if (!isJasmineAikey(email)) {
      return NextResponse.json(
        { error: 'Profile provisioning only available for Jasmine Aikey' },
        { status: 403 }
      )
    }

    // Check if already provisioned
    const isAlreadyProvisioned = await checkJasmineProvisioningStatus(uid)
    if (isAlreadyProvisioned) {
      return NextResponse.json({
        success: true,
        message: 'Profile already provisioned',
        alreadyProvisioned: true
      })
    }

    // Create onboarding invitation instead of auto-provisioning
    const result = await createJasmineOnboardingInvitation(uid, email)

    // Audit log the onboarding creation
    await auditLog('jasmine_onboarding_created', {
      uid,
      email,
      success: result.success,
      message: result.message,
      onboardingUrl: result.onboardingUrl
    })

    console.log(`🎉 Jasmine onboarding invitation result:`, result)

    return NextResponse.json({
      success: result.success,
      message: result.message,
      onboardingUrl: result.onboardingUrl,
      needsOnboarding: true
    })

  } catch (error) {
    console.error('Jasmine provisioning API error:', error)

    return NextResponse.json(
      { error: 'Failed to provision Jasmine profile' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const uid = searchParams.get('uid')
    const email = searchParams.get('email')

    if (!uid || !email) {
      return NextResponse.json(
        { error: 'UID and email are required' },
        { status: 400 }
      )
    }

    // Check if this is Jasmine and if provisioning is needed
    const isJasmine = isJasmineAikey(email)
    const isProvisioned = isJasmine ? await checkJasmineProvisioningStatus(uid) : false

    return NextResponse.json({
      isJasmine,
      isProvisioned,
      needsProvisioning: isJasmine && !isProvisioned
    })

  } catch (error) {
    console.error('Jasmine provisioning status check error:', error)

    return NextResponse.json(
      { error: 'Failed to check provisioning status' },
      { status: 500 }
    )
  }
}