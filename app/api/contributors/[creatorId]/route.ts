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

    // Try to find by document ID
    const coachProfileDoc = await db.collection('coach_profiles').doc(creatorId).get()
    if (coachProfileDoc.exists) {
      coachProfile = coachProfileDoc.data()
    } else {
      // Try to find by a slug/identifier field
      const coachQuery = await db.collection('coach_profiles')
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

          const nameQuery = await db.collection('coach_profiles')
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

    // If no coach profile found, return default Jasmine data for backwards compatibility
    if (!coachProfile) {
      const defaultProfile = {
        id: 'jasmine-aikey',
        name: 'JASMINE AIKEY',
        firstName: 'Jasmine',
        lastName: 'Aikey',
        sport: 'Soccer',
        tagline: 'Elite soccer player at Stanford University.',
        credentials: 'PAC-12 Champion and Midfielder of the Year',
        description: 'I can answer questions about my athletic journey, techniques and mental preparation.',
        heroImageUrl: 'https://res.cloudinary.com/dr0jtjwlh/image/upload/v1758865685/2025_05_2_graduation_vqvz1b.jpg',
        headshotUrl: 'https://res.cloudinary.com/dr0jtjwlh/image/upload/v1758865683/2023_11_1_i2bx0r.jpg',
        actionPhotos: [
          'https://res.cloudinary.com/dr0jtjwlh/image/upload/v1758865678/2022_08_1_ysqlha.jpg',
          'https://res.cloudinary.com/dr0jtjwlh/image/upload/v1758865678/2022_08_2_zhtbzx.jpg',
          'https://res.cloudinary.com/dr0jtjwlh/image/upload/v1758865680/2025_08_3_the_Rainbow_sbl5rl.jpg',
          'https://res.cloudinary.com/dr0jtjwlh/image/upload/v1758865677/2021_09_byctwr.jpg'
        ],
        highlightVideo: 'https://res.cloudinary.com/dr0jtjwlh/video/upload/v1758865568/Jasmine_Journey_Reel_odyfoj.mp4',
        socialLinks: {
          facebook: 'https://facebook.com/jasmineaikey',
          twitter: 'https://twitter.com/jasmineaikey',
          instagram: 'https://instagram.com/jasmineaikey',
          linkedin: 'https://linkedin.com/in/jasmineaikey'
        },
        trainingLibrary: [
          {
            id: '1',
            title: 'Footwork and Passing in Soccer',
            status: 'Ended',
            thumbnail: '/api/placeholder/120/80'
          },
          {
            id: '2',
            title: 'Soccer Drills for Beginners',
            status: 'Ended',
            thumbnail: '/api/placeholder/120/80'
          }
        ]
      }

      return NextResponse.json({
        success: true,
        data: defaultProfile
      })
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