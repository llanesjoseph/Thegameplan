import { NextRequest, NextResponse } from 'next/server'
import { auth, adminDb } from '@/lib/firebase.admin'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    // Get auth token
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const token = authHeader.split('Bearer ')[1]
    const decodedToken = await auth.verifyIdToken(token)
    const userId = decodedToken.uid

    // Verify coach access
    const userDoc = await adminDb.collection('users').doc(userId).get()
    const userData = userDoc.data()
    const userRole = userData?.role || 'athlete'

    if (!['coach', 'admin', 'superadmin'].includes(userRole)) {
      return NextResponse.json(
        { error: 'Forbidden - coach access required' },
        { status: 403 }
      )
    }

    // Fetch all video review requests assigned to this coach
    const requestsSnapshot = await adminDb
      .collection('videoReviewRequests')
      .where('assignedCoachUid', '==', userId)
      .get()

    const requests = requestsSnapshot.docs.map(doc => {
      const data = doc.data()
      return {
        id: doc.id,
        athleteId: data.athleteId,
        athleteName: data.athleteName,
        athleteEmail: data.athleteEmail,
        videoUrl: data.videoUrl,
        title: data.title,
        description: data.description,
        specificQuestions: data.specificQuestions || null,
        status: data.status || 'pending',
        createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || null,
        completedAt: data.completedAt?.toDate?.()?.toISOString() || null,
        viewedByCoach: data.viewedByCoach || false,
        coachResponse: data.coachResponse || null,
        rating: data.rating || null
      }
    })

    // Sort by createdAt descending (newest first)
    requests.sort((a, b) => {
      if (!a.createdAt) return 1
      if (!b.createdAt) return -1
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

    return NextResponse.json({
      success: true,
      requests,
      count: requests.length
    })

  } catch (error: any) {
    console.error('Error fetching video review requests:', error)

    return NextResponse.json(
      {
        error: 'Failed to fetch video review requests',
        details: error.message
      },
      { status: 500 }
    )
  }
}
