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

    // 3. Fetch submissions assigned to THIS coach using Admin SDK
    console.log('[API] Fetching submissions assigned to this coach...')
    const submissionsSnapshot = await adminDb
      .collection('submissions')
      .where('coachId', '==', uid)
      .get()

    const allSubmissions = submissionsSnapshot.docs.map((doc) => {
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

    console.log(`[API] Found ${allSubmissions.length} submissions assigned to this coach`)

    // Sort by createdAt in memory (newest first)
    allSubmissions.sort((a: any, b: any) => {
      const aTime = new Date(a.createdAt || 0).getTime()
      const bTime = new Date(b.createdAt || 0).getTime()
      return bTime - aTime
    })

    // 4. Use only submissions collection (single source of truth)
    console.log('[API] Using submissions collection as single source of truth')
    const combinedSubmissions = allSubmissions
    console.log(`[API] Total submissions for this coach: ${combinedSubmissions.length}`)

    // 5. Filter submissions - let's be more inclusive to catch all possible statuses
    const awaitingCoach = combinedSubmissions.filter((sub: any) => {
      // Include any submission that's not completed/reviewed
      const isNotCompleted = !['complete', 'reviewed'].includes(sub.status)
      console.log(`[API] Submission ${sub.id}: status=${sub.status}, isNotCompleted=${isNotCompleted}`)
      return isNotCompleted
    })
    
    const completedByCoach = combinedSubmissions.filter((sub: any) =>
      (sub.status === 'complete' || sub.status === 'reviewed') && 
      sub.claimedBy === uid
    )

    console.log(`[API] Total submissions: ${combinedSubmissions.length}`)
    console.log(`[API] Awaiting coach: ${awaitingCoach.length}`)
    console.log(`[API] Completed by coach: ${completedByCoach.length}`)
    console.log(`[API] All statuses found:`, [...new Set(combinedSubmissions.map((s: any) => s.status))])

    return NextResponse.json({
      success: true,
      submissions: combinedSubmissions,
      awaitingCoach: awaitingCoach,
      completedByCoach: completedByCoach,
      total: combinedSubmissions.length
    })

  } catch (error) {
    console.error('Error fetching coach submissions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch submissions' },
      { status: 500 }
    )
  }
}
