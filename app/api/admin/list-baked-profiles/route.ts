import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-utils'
import { getAllBakedProfiles } from '@/lib/baked-profile-manager'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * GET /api/admin/list-baked-profiles
 * 
 * Get all baked profiles (admin only)
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
    
    const bakedProfiles = await getAllBakedProfiles()
    
    return NextResponse.json({
      success: true,
      bakedProfiles
    })
    
  } catch (error) {
    console.error('Error listing baked profiles:', error)
    return NextResponse.json(
      { error: 'Failed to list baked profiles' },
      { status: 500 }
    )
  }
}

