import { NextRequest, NextResponse } from 'next/server'
import { adminDb as db } from '@/lib/firebase.admin'

export async function GET(
  request: NextRequest,
  { params }: { params: { creatorId: string } }
) {
  try {
    const { creatorId } = params

    // First try to find coach profile by ID or slug
    let coachProfile = null

    // Try to find by document ID in creator_profiles (the correct collection)
    const coachProfileDoc = await db.collection('creator_profiles').doc(creatorId).get()
    if (coachProfileDoc.exists) {
      coachProfile = coachProfileDoc.data()
    } else {
      // Try to find in creators_index (where the contributors page queries from)
      const creatorIndexDoc = await db.collection('creators_index').doc(creatorId).get()
      if (creatorIndexDoc.exists) {
        // Found in creators_index, now get the full profile from creator_profiles
        const fullProfile = await db.collection('creator_profiles').doc(creatorId).get()
        if (fullProfile.exists) {
          coachProfile = fullProfile.data()
        } else {
          // Use the basic data from creators_index if full profile doesn't exist
          coachProfile = creatorIndexDoc.data()
        }
      } else {
        // Try to find by a slug/identifier field
        const coachQuery = await db.collection('creator_profiles')
          .where('slug', '==', creatorId)
          .limit(1)
          .get()

        if (!coachQuery.empty) {
          coachProfile = coachQuery.docs[0].data()
        } else {
          // Try to find by firstName-lastName pattern
          const nameParts = creatorId.split('-')
          if (nameParts.length >= 2) {
            const firstName = nameParts[0]
            const lastName = nameParts[nameParts.length - 1]

            const nameQuery = await db.collection('creator_profiles')
              .where('firstName', '==', firstName)
              .where('lastName', '==', lastName)
              .limit(1)
              .get()

            if (!nameQuery.empty) {
              coachProfile = nameQuery.docs[0].data()
            }
          }
        }
      }
    }

    // If no coach profile found, return 404 error
    if (!coachProfile) {
      return NextResponse.json(
        { error: 'Coach not found', success: false },
        { status: 404 }
      )
    }

    // Transform coach profile to creator format
    const creatorData = {
      id: coachProfile.uid || creatorId,
      name: coachProfile.displayName?.toUpperCase() || `${coachProfile.firstName?.toUpperCase()} ${coachProfile.lastName?.toUpperCase()}`,
      firstName: coachProfile.firstName || 'Coach',
      lastName: coachProfile.lastName || '',
      sport: coachProfile.sport || 'Sports',
      tagline: coachProfile.tagline || 'Professional coach and athlete',
      credentials: coachProfile.credentials || 'Certified Coach',
      description: coachProfile.bio || 'I can help you with training, technique, and mental preparation.',
      heroImageUrl: coachProfile.heroImageUrl || '/api/placeholder/800/400',
      headshotUrl: coachProfile.headshotUrl || '/api/placeholder/200/200',
      actionPhotos: coachProfile.actionPhotos || ['/api/placeholder/300/300'],
      highlightVideo: coachProfile.highlightVideo || undefined,
      socialLinks: {
        facebook: undefined,
        twitter: undefined,
        instagram: undefined,
        linkedin: undefined
      },
      trainingLibrary: [
        {
          id: '1',
          title: `${coachProfile.sport} Training Fundamentals`,
          status: 'Available',
          thumbnail: '/api/placeholder/120/80'
        }
      ],
      profileCompleteness: coachProfile.profileCompleteness || 0,
      specialties: coachProfile.specialties || [],
      achievements: coachProfile.achievements || []
    }

    return NextResponse.json({
      success: true,
      data: creatorData
    })

  } catch (error) {
    console.error('Error fetching creator data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch creator data' },
      { status: 500 }
    )
  }
}