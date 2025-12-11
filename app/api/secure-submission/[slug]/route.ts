import { NextRequest, NextResponse } from 'next/server'
import { adminDb as db } from '@/lib/firebase.admin'
import { getOriginalIdFromSecureSlug } from '@/lib/secure-slug-utils'

// Force dynamic rendering for API route
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params

    // SECURITY: Resolve slug to original ID to prevent ID exposure
    const slugResult = await getOriginalIdFromSecureSlug(slug)
    
    if (!slugResult.success || !slugResult.originalId) {
      return NextResponse.json(
        { error: 'Submission not found', success: false },
        { status: 404 }
      )
    }

    const originalId = slugResult.originalId
    console.log(`[SECURE-SUBMISSION-API] Resolved slug ${slug} to submission ID`)

    // Try submissions collection first
    let submissionDoc = await db.collection('submissions').doc(originalId).get()
    let collectionName = 'submissions'
    
    // If not found, try feedback_requests collection
    if (!submissionDoc.exists) {
      submissionDoc = await db.collection('feedback_requests').doc(originalId).get()
      collectionName = 'feedback_requests'
    }
    
    if (!submissionDoc.exists) {
      return NextResponse.json(
        { error: 'Submission not found', success: false },
        { status: 404 }
      )
    }

    const submissionData = submissionDoc.data()

    if (!submissionData) {
      return NextResponse.json(
        { error: 'Submission data not found', success: false },
        { status: 404 }
      )
    }

    // Get athlete info
    const athleteId = submissionData.athleteId || submissionData.userId
    let athleteInfo: { displayName?: string; email?: string; sport?: string } = {}
    if (athleteId) {
      try {
        const athleteDoc = await db.collection('users').doc(athleteId).get()
        if (athleteDoc.exists) {
          const athleteData = athleteDoc.data()
          if (athleteData) {
            athleteInfo = {
              displayName: athleteData.displayName || 'Unknown Athlete',
              email: athleteData.email || '',
              sport: athleteData.sport || 'General'
            }
          }
        }
      } catch (error) {
        console.warn('Could not fetch athlete info:', error)
      }
    }

    // Build secure submission response
    const submissionProfile = {
      id: originalId,
      slug: slug, // Return the slug for frontend use
      title: submissionData.title || 'Video Submission',
      description: submissionData.description || '',
      videoUrl: submissionData.videoUrl || '',
      thumbnailUrl: submissionData.thumbnailUrl || '',
      status: submissionData.status || 'pending',
      sport: submissionData.sport || athleteInfo.sport || 'General',
      level: submissionData.level || 'All Levels',
      athleteId: athleteId,
      athleteInfo: athleteInfo,
      coachId: submissionData.coachId || '',
      createdAt: submissionData.createdAt,
      lastUpdated: submissionData.lastUpdated,
      collectionName: collectionName
    }

    return NextResponse.json({
      success: true,
      data: submissionProfile
    })

  } catch (error) {
    console.error('Error fetching secure submission profile:', error)
    return NextResponse.json(
      { error: 'Failed to fetch submission profile' },
      { status: 500 }
    )
  }
}
