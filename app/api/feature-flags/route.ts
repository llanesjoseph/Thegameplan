/**
 * Public API endpoint for reading feature flags
 * All authenticated users can read
 */

import { NextRequest, NextResponse } from 'next/server'
import { adminAuth } from '@/lib/firebase.admin'
import { getFeatureFlags } from '@/lib/feature-flags'

/**
 * GET - Fetch all feature flags (read-only for authenticated users)
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split('Bearer ')[1]
    await adminAuth.verifyIdToken(token)

    // Get feature flags
    const flags = await getFeatureFlags()

    // Return only the enabled status (no admin metadata)
    const publicFlags = {
      direct_messaging: flags.direct_messaging?.enabled || false
    }

    return NextResponse.json(publicFlags, { status: 200 })
  } catch (error: any) {
    console.error('Error fetching feature flags:', error)
    return NextResponse.json(
      { error: 'Failed to fetch feature flags', details: error.message },
      { status: 500 }
    )
  }
}
