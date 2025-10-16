import { NextRequest, NextResponse } from 'next/server'
import { auth as adminAuth, adminDb } from '@/lib/firebase.admin'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Health check endpoint to verify Firebase Admin is working
 */
export async function GET(request: NextRequest) {
  try {
    const checks = {
      timestamp: new Date().toISOString(),
      firebaseAdmin: {
        initialized: false,
        authAvailable: false,
        firestoreAvailable: false,
        hasServiceAccount: false
      },
      environment: {
        hasServiceAccountKey: !!process.env.FIREBASE_SERVICE_ACCOUNT_KEY,
        hasPrivateKey: !!process.env.FIREBASE_PRIVATE_KEY,
        hasClientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
        nodeEnv: process.env.NODE_ENV
      }
    }

    // Check if Firebase Admin Auth is available
    try {
      checks.firebaseAdmin.authAvailable = !!adminAuth
      checks.firebaseAdmin.initialized = true
    } catch (error) {
      console.error('Firebase Admin Auth check failed:', error)
    }

    // Check if Firestore is available
    try {
      checks.firebaseAdmin.firestoreAvailable = !!adminDb
    } catch (error) {
      console.error('Firestore check failed:', error)
    }

    // Check if service account is configured
    checks.firebaseAdmin.hasServiceAccount =
      checks.environment.hasServiceAccountKey ||
      (checks.environment.hasPrivateKey && checks.environment.hasClientEmail)

    return NextResponse.json({
      status: 'ok',
      checks
    })
  } catch (error) {
    console.error('Health check failed:', error)
    return NextResponse.json(
      {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}
