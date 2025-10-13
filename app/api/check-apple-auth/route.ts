/**
 * API Route: Check Apple Sign-In Configuration
 *
 * Diagnostic endpoint to verify Apple Sign-In setup in Firebase
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAuth } from 'firebase-admin/auth'
import { initializeApp, getApps, cert } from 'firebase-admin/app'

export const dynamic = 'force-dynamic'

// Initialize Firebase Admin if not already initialized
if (!getApps().length) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}')
    initializeApp({
      credential: cert(serviceAccount)
    })
  } catch (error) {
    console.error('Failed to initialize Firebase Admin:', error)
  }
}

export async function GET(request: NextRequest) {
  try {
    const auth = getAuth()

    // Check if we can access Firebase Auth
    const configCheck = {
      firebaseInitialized: true,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      timestamp: new Date().toISOString()
    }

    // Try to list auth providers (this will help identify if Apple is configured)
    let providerConfigs: any[] = []
    try {
      // Note: Firebase Admin SDK doesn't have a direct method to list OAuth providers
      // We'll provide configuration instructions instead
      providerConfigs = [
        {
          note: 'Cannot programmatically check OAuth providers via Admin SDK',
          recommendation: 'Check Firebase Console manually'
        }
      ]
    } catch (error) {
      console.error('Error checking providers:', error)
    }

    return NextResponse.json({
      success: true,
      config: configCheck,
      providers: providerConfigs,
      instructions: {
        step1: 'Go to Firebase Console > Authentication > Sign-in method',
        step2: 'Ensure "Apple" provider is ENABLED',
        step3: 'Configure Service ID from Apple Developer Console',
        step4: 'Add OAuth redirect URI: https://gameplan-787a2.firebaseapp.com/__/auth/handler',
        step5: 'Add authorized domains including your production domain',
        appleDevConsole: 'https://developer.apple.com/account/resources/identifiers/list/serviceId',
        firebaseConsole: 'https://console.firebase.google.com/project/gameplan-787a2/authentication/providers'
      },
      commonIssues: [
        {
          error: 'auth/operation-not-allowed',
          solution: 'Apple Sign-In is not enabled in Firebase Console. Go to Authentication > Sign-in method and enable Apple provider.'
        },
        {
          error: 'auth/unauthorized-domain',
          solution: 'Your domain is not authorized. Go to Authentication > Settings > Authorized domains and add your domain.'
        },
        {
          error: 'auth/auth-domain-config-required',
          solution: 'Auth domain not properly configured. Check that authDomain in Firebase config matches your Firebase project.'
        },
        {
          error: 'auth/popup-blocked',
          solution: 'Browser is blocking the popup. User needs to allow popups or use redirect method instead.'
        }
      ]
    })

  } catch (error) {
    console.error('Apple Auth config check error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: 'Failed to check Apple Sign-In configuration'
    }, { status: 500 })
  }
}
