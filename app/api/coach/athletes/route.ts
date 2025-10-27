import { NextRequest, NextResponse } from 'next/server'
import { auth, adminDb } from '@/lib/firebase.admin'

// Force dynamic rendering for API route
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    // Get auth token from request
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized - no token provided' },
        { status: 401 }
      )
    }

    const token = authHeader.split('Bearer ')[1]

    // Verify the token
    let decodedToken
    try {
      decodedToken = await auth.verifyIdToken(token)
    } catch (error) {
      console.error('Token verification failed:', error)
      return NextResponse.json(
        { error: 'Unauthorized - invalid token' },
        { status: 401 }
      )
    }

    const userId = decodedToken.uid

    // Get the user's role to ensure they're a coach
    const userDoc = await adminDb.collection('users').doc(userId).get()
    const userData = userDoc.data()
    const userRole = userData?.role || userData?.roles?.[0] || 'athlete'

    if (!['coach', 'admin', 'superadmin'].includes(userRole)) {
      return NextResponse.json(
        { error: 'Forbidden - coach access required' },
        { status: 403 }
      )
    }

    // Query athletes for this coach from users collection
    // Check coachId, assignedCoachId, and creatorUid fields for compatibility
    const athletesSnapshot1 = await adminDb
      .collection('users')
      .where('role', '==', 'athlete')
      .where('coachId', '==', userId)
      .get()

    const athletesSnapshot2 = await adminDb
      .collection('users')
      .where('role', '==', 'athlete')
      .where('assignedCoachId', '==', userId)
      .get()

    const athletesSnapshot3 = await adminDb
      .collection('users')
      .where('role', '==', 'athlete')
      .where('creatorUid', '==', userId)
      .get()

    // Combine results and deduplicate
    const athleteMap = new Map()

    athletesSnapshot1.docs.forEach(doc => {
      const data = doc.data()
      athleteMap.set(doc.id, {
        id: doc.id,
        ...data,
        // Ensure availability is always an array
        availability: Array.isArray(data.availability) ? data.availability : [],
        createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || null,
        lastLoginAt: data.lastLoginAt?.toDate?.()?.toISOString() || null
      })
    })

    athletesSnapshot2.docs.forEach(doc => {
      const data = doc.data()
      athleteMap.set(doc.id, {
        id: doc.id,
        ...data,
        // Ensure availability is always an array
        availability: Array.isArray(data.availability) ? data.availability : [],
        createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || null,
        lastLoginAt: data.lastLoginAt?.toDate?.()?.toISOString() || null
      })
    })

    athletesSnapshot3.docs.forEach(doc => {
      const data = doc.data()
      athleteMap.set(doc.id, {
        id: doc.id,
        ...data,
        // Ensure availability is always an array
        availability: Array.isArray(data.availability) ? data.availability : [],
        createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || null,
        lastLoginAt: data.lastLoginAt?.toDate?.()?.toISOString() || null
      })
    })

    const athletes = Array.from(athleteMap.values())

    // Look up slugs for all athletes
    const athletesWithSlugs = await Promise.all(
      athletes.map(async (athlete) => {
        try {
          // Query slug_mappings to find a slug that maps to this athlete ID
          const slugQuery = await adminDb
            .collection('slug_mappings')
            .where('targetId', '==', athlete.id)
            .limit(1)
            .get()

          let slug = athlete.id // Default to ID if no slug found

          if (!slugQuery.empty) {
            slug = slugQuery.docs[0].id // The document ID is the slug
          }

          return {
            ...athlete,
            slug
          }
        } catch (error) {
          console.error(`Error looking up slug for athlete ${athlete.id}:`, error)
          return {
            ...athlete,
            slug: athlete.id // Fallback to ID
          }
        }
      })
    )

    console.log(`Fetched ${athletesWithSlugs.length} athletes for coach ${userId}`)

    return NextResponse.json({
      success: true,
      athletes: athletesWithSlugs,
      count: athletesWithSlugs.length
    })

  } catch (error) {
    console.error('Error fetching coach athletes:', error)
    return NextResponse.json(
      { error: 'Failed to fetch athletes' },
      { status: 500 }
    )
  }
}

// Create a new athlete invitation
export async function POST(request: NextRequest) {
  try {
    // Get auth token from request
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized - no token provided' },
        { status: 401 }
      )
    }

    const token = authHeader.split('Bearer ')[1]

    // Verify the token
    let decodedToken
    try {
      decodedToken = await auth.verifyIdToken(token)
    } catch (error) {
      console.error('Token verification failed:', error)
      return NextResponse.json(
        { error: 'Unauthorized - invalid token' },
        { status: 401 }
      )
    }

    const userId = decodedToken.uid

    // Get the user's role to ensure they're a coach
    const userDoc = await adminDb.collection('users').doc(userId).get()
    const userData = userDoc.data()
    const userRole = userData?.role || userData?.roles?.[0] || 'athlete'

    if (!['coach', 'admin', 'superadmin'].includes(userRole)) {
      return NextResponse.json(
        { error: 'Forbidden - coach access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { athleteEmail, athleteName, sport, customMessage } = body

    // Create invitation
    const invitation = {
      creatorUid: userId,
      coachName: userData?.displayName || userData?.email || 'Coach',
      athleteEmail: athleteEmail.toLowerCase(),
      athleteName,
      sport,
      customMessage,
      role: 'athlete',
      status: 'pending',
      used: false,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
    }

    const invitationRef = await adminDb.collection('invitations').add(invitation)

    // TODO: Send email invitation to athlete

    return NextResponse.json({
      success: true,
      invitationId: invitationRef.id,
      message: 'Invitation sent successfully'
    })

  } catch (error) {
    console.error('Error creating athlete invitation:', error)
    return NextResponse.json(
      { error: 'Failed to create invitation' },
      { status: 500 }
    )
  }
}