import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-utils'
import { adminDb as db } from '@/lib/firebase.admin'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Require coach role to get profile data
    const authResult = await requireAuth(request, ['creator', 'coach', 'admin', 'superadmin'])

    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const { user: authUser } = authResult

    // Get coach profile
    // FIXED: Coaches use creator_profiles collection, same as creators
    const coachProfileDoc = await db.collection('creator_profiles').doc(authUser.uid).get()

    if (!coachProfileDoc.exists) {
      return NextResponse.json(
        { error: 'Coach profile not found. Only approved coaches can access profile data.' },
        { status: 404 }
      )
    }

    const profileData = coachProfileDoc.data()

    // Return profile data (excluding sensitive fields)
    const publicProfile = {
      uid: profileData?.uid,
      email: profileData?.email,
      displayName: profileData?.displayName,
      firstName: profileData?.firstName,
      lastName: profileData?.lastName,
      sport: profileData?.sport,
      tagline: profileData?.tagline,
      credentials: profileData?.credentials,
      bio: profileData?.bio,
      headshotUrl: profileData?.headshotUrl,
      heroImageUrl: profileData?.heroImageUrl,
      actionPhotos: profileData?.actionPhotos || [],
      highlightVideo: profileData?.highlightVideo,
      specialties: profileData?.specialties || [],
      achievements: profileData?.achievements || [],
      sampleQuestions: profileData?.sampleQuestions || [],
      profileCompleteness: profileData?.profileCompleteness || 0,
      isActive: profileData?.isActive,
      createdAt: profileData?.createdAt,
      updatedAt: profileData?.updatedAt
    }

    return NextResponse.json({
      success: true,
      data: publicProfile
    })

  } catch (error) {
    console.error('Get coach profile error:', error)
    return NextResponse.json(
      { error: 'Failed to get profile data' },
      { status: 500 }
    )
  }
}