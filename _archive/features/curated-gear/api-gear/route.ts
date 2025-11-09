import { NextRequest, NextResponse } from 'next/server'
import { auth, adminDb } from '@/lib/firebase.admin'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    // 1. Verify authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      )
    }

    const token = authHeader.split('Bearer ')[1]
    let decodedToken
    try {
      decodedToken = await auth.verifyIdToken(token)
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      )
    }

    const uid = decodedToken.uid

    // 2. Fetch gear items using Admin SDK
    const gearQuery = adminDb.collection('gear').orderBy('createdAt', 'desc')
    const snapshot = await gearQuery.get()

    const gearItems = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      // Convert Firestore timestamps to ISO strings for JSON serialization
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
    }))

    return NextResponse.json({
      success: true,
      gearItems: gearItems,
      total: gearItems.length
    })

  } catch (error) {
    console.error('Error fetching gear items:', error)
    return NextResponse.json(
      { error: 'Failed to fetch gear items' },
      { status: 500 }
    )
  }
}
