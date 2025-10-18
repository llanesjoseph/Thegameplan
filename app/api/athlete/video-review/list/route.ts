/**
 * API endpoint to fetch all video review requests for an athlete
 * Returns requests with status and details
 */

import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase.admin'

// Force dynamic rendering for API route
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    // Get athleteId from query params
    const searchParams = request.nextUrl.searchParams
    const athleteId = searchParams.get('athleteId')

    if (!athleteId) {
      return NextResponse.json(
        { error: 'Missing athleteId parameter' },
        { status: 400 }
      )
    }

    // Fetch all video review requests for this athlete
    let requestsSnapshot
    try {
      // Try with orderBy first
      requestsSnapshot = await adminDb
        .collection('videoReviewRequests')
        .where('athleteId', '==', athleteId)
        .orderBy('createdAt', 'desc')
        .get()
    } catch (indexError: any) {
      // If index not found, fetch without orderBy
      console.log('Index not found, fetching without orderBy:', indexError.message)
      requestsSnapshot = await adminDb
        .collection('videoReviewRequests')
        .where('athleteId', '==', athleteId)
        .get()
    }

    const requests = requestsSnapshot.docs.map(doc => {
      const data = doc.data()
      return {
        id: doc.id,
        title: data.title,
        description: data.description,
        specificQuestions: data.specificQuestions || null,
        videoUrl: data.videoUrl,
        status: data.status || 'pending',
        createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || null,
        completedAt: data.completedAt?.toDate?.()?.toISOString() || null,
        viewedByCoach: data.viewedByCoach || false,
        coachResponse: data.coachResponse || null,
        assignedCoachUid: data.assignedCoachUid || null,
        athleteName: data.athleteName,
        athleteEmail: data.athleteEmail
      }
    })

    // Sort by createdAt if not already sorted
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
      { error: 'Failed to fetch video review requests', details: error.message },
      { status: 500 }
    )
  }
}
