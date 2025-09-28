/**
 * Client-side Jasmine Aikey utilities
 *
 * Handles Jasmine profile provisioning from the client side
 */

// Jasmine's specific email patterns for client-side identification
const JASMINE_EMAIL = 'jasmine.aikey@gameplan.ai'
const JASMINE_ALT_EMAILS = [
  'jasmine@gameplan.ai',
  'jaikey@stanford.edu',
  'jasmine.aikey@stanford.edu',
  'jaaikey1@gmail.com'
]

/**
 * Check if user is Jasmine Aikey based on email (client-side)
 */
export function isJasmineAikey(email: string): boolean {
  const normalizedEmail = email.toLowerCase().trim()
  return normalizedEmail === JASMINE_EMAIL.toLowerCase() ||
         JASMINE_ALT_EMAILS.some(alt => alt.toLowerCase() === normalizedEmail)
}

/**
 * Check Jasmine's provisioning status via API
 */
export async function checkJasmineProvisioningStatus(uid: string, email: string): Promise<{
  isJasmine: boolean
  isProvisioned: boolean
  needsProvisioning: boolean
}> {
  try {
    const response = await fetch(`/api/provision-jasmine?uid=${uid}&email=${encodeURIComponent(email)}`)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Failed to check Jasmine provisioning status:', error)
    return {
      isJasmine: false,
      isProvisioned: false,
      needsProvisioning: false
    }
  }
}

/**
 * Create onboarding invitation for Jasmine via API
 */
export async function createJasmineOnboarding(uid: string, email: string): Promise<{
  success: boolean
  message: string
  onboardingUrl?: string
  needsOnboarding?: boolean
  alreadyProvisioned?: boolean
}> {
  try {
    const response = await fetch('/api/provision-jasmine', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ uid, email })
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const result = await response.json()
    return result
  } catch (error) {
    console.error('Failed to create Jasmine onboarding:', error)
    return {
      success: false,
      message: 'Failed to create onboarding invitation. Please contact support.'
    }
  }
}

/**
 * Handle Jasmine onboarding during user initialization
 */
export async function handleJasmineProvisioning(uid: string, email: string): Promise<{
  shouldRedirect: boolean
  onboardingUrl?: string
}> {
  if (!isJasmineAikey(email)) {
    return { shouldRedirect: false } // Not Jasmine, nothing to do
  }

  console.log('🎯 Detected Jasmine Aikey - checking onboarding status...')

  try {
    // Check if onboarding is needed
    const status = await checkJasmineProvisioningStatus(uid, email)

    if (status.needsProvisioning) {
      console.log('🎯 Creating Jasmine onboarding invitation...')
      const result = await createJasmineOnboarding(uid, email)

      if (result.success) {
        console.log('✅ Jasmine onboarding invitation created:', result.message)
        return {
          shouldRedirect: true,
          onboardingUrl: result.onboardingUrl
        }
      } else {
        console.error('❌ Jasmine onboarding creation failed:', result.message)
        return { shouldRedirect: false }
      }
    } else if (status.isProvisioned) {
      console.log('✅ Jasmine profile already completed')
      return { shouldRedirect: false }
    }

    return { shouldRedirect: false }
  } catch (error) {
    console.error('❌ Error handling Jasmine onboarding:', error)
    return { shouldRedirect: false }
  }
}