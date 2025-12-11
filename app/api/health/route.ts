import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Health check endpoint to verify Firebase Admin is working
 */
export async function GET(request: NextRequest) {
  const checks: any = {
    timestamp: new Date().toISOString(),
    firebaseAdmin: {
      initialized: false,
      authAvailable: false,
      firestoreAvailable: false,
      hasServiceAccount: false,
      initError: null,
      testResult: null
    },
    environment: {
      hasServiceAccountKey: !!process.env.FIREBASE_SERVICE_ACCOUNT_KEY,
      serviceAccountKeyLength: process.env.FIREBASE_SERVICE_ACCOUNT_KEY?.length || 0,
      serviceAccountKeyPreview: process.env.FIREBASE_SERVICE_ACCOUNT_KEY?.substring(0, 50) + '...',
      hasPrivateKey: !!process.env.FIREBASE_PRIVATE_KEY,
      hasClientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
      nodeEnv: process.env.NODE_ENV
    }
  }

  // Try to import and use Firebase Admin
  try {
    const { auth: adminAuth, adminDb } = await import('@/lib/firebase.admin')
    
    checks.firebaseAdmin.initialized = true
    checks.firebaseAdmin.authAvailable = !!adminAuth
    checks.firebaseAdmin.firestoreAvailable = !!adminDb

    // Actually test Firestore connectivity
    try {
      const testDoc = await adminDb.collection('_health_check').doc('test').get()
      checks.firebaseAdmin.testResult = 'Firestore connection successful'
    } catch (firestoreError: any) {
      checks.firebaseAdmin.testResult = `Firestore test failed: ${firestoreError.message}`
    }

  } catch (initError: any) {
    checks.firebaseAdmin.initError = initError.message
    checks.firebaseAdmin.initStack = initError.stack?.split('\n').slice(0, 5)
  }

  // Check if service account is configured
  checks.firebaseAdmin.hasServiceAccount =
    checks.environment.hasServiceAccountKey ||
    (checks.environment.hasPrivateKey && checks.environment.hasClientEmail)

  const status = checks.firebaseAdmin.initialized && !checks.firebaseAdmin.initError ? 'ok' : 'error'

  return NextResponse.json({
    status,
    checks
  }, { status: status === 'ok' ? 200 : 500 })
}
