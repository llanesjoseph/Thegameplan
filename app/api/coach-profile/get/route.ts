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

    // Get coach profile with robust fallbacks:
    // 1) creator_profiles (primary source)
    // 2) creatorPublic
    // 3) users document
    const creatorProfileRef = db.collection('creator_profiles').doc(authUser.uid)
    const creatorProfileSnap = await creatorProfileRef.get()

    let profileData: any = creatorProfileSnap.exists ? creatorProfileSnap.data() : null

    if (!profileData) {
      // Fallback to creatorPublic (used by public coach pages)
      const publicRef = db.collection('creatorPublic').doc(authUser.uid)
      const publicSnap = await publicRef.get()
      if (publicSnap.exists) {
        profileData = publicSnap.data()
      }
    }

    if (!profileData) {
      // Final fallback to users collection
      const userRef = db.collection('users').doc(authUser.uid)
      const userSnap = await userRef.get()
      if (userSnap.exists) {
        profileData = userSnap.data()
      }
    }

    if (!profileData) {
      return NextResponse.json(
        { error: 'Coach profile not found. Only approved coaches can access profile data.' },
        { status: 404 }
      )
    }

    // Normalize sport from profile data (handles different schemas)
    const sport =
      profileData.sport ||
      profileData.primarySport ||
      (Array.isArray(profileData.specialties) && profileData.specialties.length > 0
        ? profileData.specialties[0]
        : undefined)

    // Return profile data (excluding sensitive fields)
    const publicProfile = {
      uid: profileData?.uid || authUser.uid,
      email: profileData?.email || authUser.email,
      displayName: profileData?.displayName,
      firstName: profileData?.firstName,
      lastName: profileData?.lastName,
      sport,
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