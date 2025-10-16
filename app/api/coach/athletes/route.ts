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
      athleteMap.set(doc.id, {
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || null,
        updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || null,
        lastLoginAt: doc.data().lastLoginAt?.toDate?.()?.toISOString() || null
      })
    })

    athletesSnapshot2.docs.forEach(doc => {
      athleteMap.set(doc.id, {
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || null,
        updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || null,
        lastLoginAt: doc.data().lastLoginAt?.toDate?.()?.toISOString() || null
      })
    })

    athletesSnapshot3.docs.forEach(doc => {
      athleteMap.set(doc.id, {
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || null,
        updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || null,
        lastLoginAt: doc.data().lastLoginAt?.toDate?.()?.toISOString() || null
      })
    })

    const athletes = Array.from(athleteMap.values())

    console.log(`Fetched ${athletes.length} athletes for coach ${userId}`)

    return NextResponse.json({
      success: true,
      athletes,
      count: athletes.length
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