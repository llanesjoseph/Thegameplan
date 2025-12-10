import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-utils'
import { createBakedProfile } from '@/lib/baked-profile-manager'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * POST /api/admin/create-baked-profile
 * 
 * Create a baked profile that will transfer ownership to a user when they sign in.
 * Admin only.
 */
export async function POST(request: NextRequest) {
  try {
    // Require admin authentication
    const authResult = await requireAuth(request, ['admin', 'superadmin'])
    
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      )
    }
    
    const { user } = authResult
    const body = await request.json()
    
    // Validate required fields
    const { targetEmail, displayName, firstName, lastName, sport } = body
    
    if (!targetEmail || !displayName || !firstName || !lastName || !sport) {
      return NextResponse.json(
        { error: 'Missing required fields: targetEmail, displayName, firstName, lastName, sport' },
        { status: 400 }
      )
    }
    
    // Create the baked profile
    const result = await createBakedProfile(user.uid, {
      targetEmail: targetEmail.toLowerCase().trim(),
      targetUid: body.targetUid || null,
      displayName,
      firstName,
      lastName,
      email: targetEmail.toLowerCase().trim(),
      sport,
      tagline: body.tagline || '',
      credentials: body.credentials || '',
      bio: body.bio || '',
      philosophy: body.philosophy || '',
      specialties: body.specialties || [],
      achievements: body.achievements || [],
      experience: body.experience || '',
      headshotUrl: body.headshotUrl || '',
      heroImageUrl: body.heroImageUrl || '',
      actionPhotos: body.actionPhotos || [],
      highlightVideo: body.highlightVideo || '',
      socialLinks: body.socialLinks || {},
      profileCompleteness: body.profileCompleteness || 100,
      isVerified: body.isVerified ?? true,
      isPlatformCoach: body.isPlatformCoach ?? true
    })
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to create baked profile' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      bakedProfileId: result.bakedProfileId,
      message: 'Baked profile created successfully. It will transfer ownership when the user signs in.'
    })
    
  } catch (error) {
    console.error('Error creating baked profile:', error)
    return NextResponse.json(
      { error: 'Failed to create baked profile' },
      { status: 500 }
    )
  }
}

