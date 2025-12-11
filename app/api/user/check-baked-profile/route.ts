import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-utils'
import { checkAndTransferBakedProfile } from '@/lib/baked-profile-manager'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * POST /api/user/check-baked-profile
 * 
 * Check if there's a baked profile waiting for the user and transfer it.
 * This is called after user sign-in to handle baked profile transfers.
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request)
    
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      )
    }
    
    const { user } = authResult
    const userEmail = user.email || ''
    
    if (!userEmail) {
      return NextResponse.json(
        { error: 'User email is required' },
        { status: 400 }
      )
    }
    
    // Check and transfer baked profile
    const result = await checkAndTransferBakedProfile(user.uid, userEmail)
    
    if (result.transferred) {
      return NextResponse.json({
        success: true,
        transferred: true,
        bakedProfileId: result.bakedProfileId,
        message: 'Baked profile transferred successfully'
      })
    }
    
    return NextResponse.json({
      success: true,
      transferred: false,
      message: 'No baked profile found for this user'
    })
    
  } catch (error) {
    console.error('Error checking baked profile:', error)
    return NextResponse.json(
      { error: 'Failed to check baked profile' },
      { status: 500 }
    )
  }
}

