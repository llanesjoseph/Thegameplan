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

    // 2. Verify user is a coach
    const userDoc = await adminDb.collection('users').doc(uid).get()
    if (!userDoc.exists) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const userData = userDoc.data()
    const userRole = userData?.role || userData?.roles?.[0] || 'user'
    
    if (!['coach', 'admin', 'superadmin'].includes(userRole)) {
      return NextResponse.json(
        { error: 'Only coaches can access submissions' },
        { status: 403 }
      )
    }

    // 3. Fetch all submissions using Admin SDK
    const submissionsQuery = adminDb.collection('submissions').orderBy('createdAt', 'desc')
    const snapshot = await submissionsQuery.get()

    const allSubmissions = snapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        // Convert Firestore timestamps to ISO strings for JSON serialization
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
        submittedAt: data.submittedAt?.toDate?.()?.toISOString() || data.submittedAt,
        reviewedAt: data.reviewedAt?.toDate?.()?.toISOString() || data.reviewedAt,
      }
    })

    // 4. Filter submissions
    const awaitingCoach = allSubmissions.filter((sub: any) =>
      sub.status === 'awaiting_coach' || sub.status === 'uploading'
    )
    
    const completedByCoach = allSubmissions.filter((sub: any) =>
      (sub.status === 'complete' || sub.status === 'reviewed') && 
      sub.claimedBy === uid
    )

    return NextResponse.json({
      success: true,
      submissions: allSubmissions,
      awaitingCoach: awaitingCoach,
      completedByCoach: completedByCoach,
      total: allSubmissions.length
    })

  } catch (error) {
    console.error('Error fetching coach submissions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch submissions' },
      { status: 500 }
    )
  }
}
