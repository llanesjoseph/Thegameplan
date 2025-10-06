/**
 * API endpoint for managing feature flags
 * Admin only
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth, adminDb } from '@/lib/firebase.admin'
import { getFeatureFlags, updateFeatureFlag, FeatureFlags } from '@/lib/feature-flags'

/**
 * GET - Fetch all feature flags
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split('Bearer ')[1]
    const decodedToken = await auth.verifyIdToken(token)

    // Verify admin role
    const userDoc = await adminDb.collection('users').doc(decodedToken.uid).get()
    const userData = userDoc.data()

    if (!userData || !['admin', 'superadmin'].includes(userData.role)) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    // Get feature flags
    const flags = await getFeatureFlags()

    return NextResponse.json(flags, { status: 200 })
  } catch (error: any) {
    console.error('Error fetching feature flags:', error)
    return NextResponse.json(
      { error: 'Failed to fetch feature flags', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * POST - Update a feature flag
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split('Bearer ')[1]
    const decodedToken = await auth.verifyIdToken(token)

    // Verify admin role
    const userDoc = await adminDb.collection('users').doc(decodedToken.uid).get()
    const userData = userDoc.data()

    if (!userData || !['admin', 'superadmin'].includes(userData.role)) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    // Parse request body
    const { featureName, enabled } = await request.json()

    if (!featureName || typeof enabled !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid request - featureName and enabled (boolean) required' },
        { status: 400 }
      )
    }

    // Update feature flag
    await updateFeatureFlag(featureName as keyof FeatureFlags, enabled, decodedToken.uid)

    return NextResponse.json(
      { message: `Feature '${featureName}' ${enabled ? 'enabled' : 'disabled'}`, success: true },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Error updating feature flag:', error)
    return NextResponse.json(
      { error: 'Failed to update feature flag', details: error.message },
      { status: 500 }
    )
  }
}
