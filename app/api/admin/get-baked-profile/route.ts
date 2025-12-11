import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-utils'
import { adminDb as db } from '@/lib/firebase.admin'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * GET /api/admin/get-baked-profile?bakedProfileId=xxx
 * 
 * Get a baked profile for preview/editing.
 * Admin only.
 */
export async function GET(request: NextRequest) {
  try {
    // Require admin authentication
    const authResult = await requireAuth(request, ['admin', 'superadmin'])
    
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      )
    }
    
    const { searchParams } = new URL(request.url)
    const bakedProfileId = searchParams.get('bakedProfileId')
    
    if (!bakedProfileId) {
      return NextResponse.json(
        { error: 'Missing bakedProfileId parameter' },
        { status: 400 }
      )
    }
    
    // Get baked profile
    const bakedProfileDoc = await db.collection('baked_profiles').doc(bakedProfileId).get()
    
    if (!bakedProfileDoc.exists) {
      return NextResponse.json(
        { error: 'Baked profile not found' },
        { status: 404 }
      )
    }
    
    const data = bakedProfileDoc.data()
    
    return NextResponse.json({
      success: true,
      bakedProfile: {
        bakedProfileId: bakedProfileDoc.id,
        ...data
      }
    })
    
  } catch (error) {
    console.error('Error getting baked profile:', error)
    return NextResponse.json(
      { error: 'Failed to get baked profile' },
      { status: 500 }
    )
  }
}

