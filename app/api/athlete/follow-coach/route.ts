import { NextRequest, NextResponse } from 'next/server'
import { auth as adminAuth, adminDb } from '@/lib/firebase.admin'
import { auditLog } from '@/lib/audit-logger'
import { FieldValue } from 'firebase-admin/firestore'

// Force dynamic rendering for API route
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * POST /api/athlete/follow-coach
 * Follow a coach
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split('Bearer ')[1]
    const decodedToken = await adminAuth.verifyIdToken(token)
    const athleteId = decodedToken.uid

    // Parse request body
    const body = await request.json()
    const { coachId } = body

    if (!coachId) {
      return NextResponse.json({ error: 'Coach ID is required' }, { status: 400 })
    }

    // Get athlete and coach data
    const athleteDoc = await adminDb.collection('users').doc(athleteId).get()
    const coachDoc = await adminDb.collection('users').doc(coachId).get()

    if (!athleteDoc.exists) {
      return NextResponse.json({ error: 'Athlete not found' }, { status: 404 })
    }

    if (!coachDoc.exists) {
      return NextResponse.json({ error: 'Coach not found' }, { status: 404 })
    }

    const athleteData = athleteDoc.data()
    const coachData = coachDoc.data()

    const athleteName = athleteData?.displayName || athleteData?.email || 'Athlete'
    const coachName = coachData?.displayName || coachData?.email || 'Coach'

    // Check if already following
    const followId = `${athleteId}_${coachId}`
    const existingFollow = await adminDb.collection('coach_followers').doc(followId).get()

    if (existingFollow.exists) {
      return NextResponse.json({
        success: true,
        message: 'Already following this coach',
        alreadyFollowing: true
      })
    }

    // Create follow relationship
    await adminDb.collection('coach_followers').doc(followId).set({
      athleteId,
      coachId,
      athleteName,
      coachName,
      followedAt: FieldValue.serverTimestamp(),
      notificationsEnabled: true
    })

    // Update follower count on coach profile (optional analytics)
    const coachProfileRef = adminDb.collection('coach_profiles').doc(coachId)
    const coachProfile = await coachProfileRef.get()

    if (coachProfile.exists) {
      await coachProfileRef.update({
        followerCount: FieldValue.increment(1),
        updatedAt: FieldValue.serverTimestamp()
      })
    }

    // Audit log
    await auditLog('coach_followed', {
      athleteId,
      coachId,
      coachName,
      athleteName
    })

    return NextResponse.json({
      success: true,
      message: `You are now following ${coachName}`,
      alreadyFollowing: false
    })
  } catch (error) {
    console.error('Error following coach:', error)
    return NextResponse.json(
      { error: 'Failed to follow coach', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/athlete/follow-coach
 * Unfollow a coach
 */
export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split('Bearer ')[1]
    const decodedToken = await adminAuth.verifyIdToken(token)
    const athleteId = decodedToken.uid

    // Parse request body
    const body = await request.json()
    const { coachId } = body

    if (!coachId) {
      return NextResponse.json({ error: 'Coach ID is required' }, { status: 400 })
    }

    // Check if following
    const followId = `${athleteId}_${coachId}`
    const existingFollow = await adminDb.collection('coach_followers').doc(followId).get()

    if (!existingFollow.exists) {
      return NextResponse.json({
        success: true,
        message: 'Not following this coach',
        wasFollowing: false
      })
    }

    // Delete follow relationship
    await adminDb.collection('coach_followers').doc(followId).delete()

    // Update follower count on coach profile
    const coachProfileRef = adminDb.collection('coach_profiles').doc(coachId)
    const coachProfile = await coachProfileRef.get()

    if (coachProfile.exists) {
      await coachProfileRef.update({
        followerCount: FieldValue.increment(-1),
        updatedAt: FieldValue.serverTimestamp()
      })
    }

    // Get coach name for response
    const coachDoc = await adminDb.collection('users').doc(coachId).get()
    const coachName = coachDoc.exists
      ? (coachDoc.data()?.displayName || 'Coach')
      : 'Coach'

    // Audit log
    await auditLog('coach_unfollowed', {
      athleteId,
      coachId,
      coachName
    })

    return NextResponse.json({
      success: true,
      message: `You have unfollowed ${coachName}`,
      wasFollowing: true
    })
  } catch (error) {
    console.error('Error unfollowing coach:', error)
    return NextResponse.json(
      { error: 'Failed to unfollow coach', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/athlete/follow-coach?coachId=xxx
 * Check if athlete is following a specific coach
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split('Bearer ')[1]
    const decodedToken = await adminAuth.verifyIdToken(token)
    const athleteId = decodedToken.uid

    // Get coachId from query params
    const { searchParams } = new URL(request.url)
    const coachId = searchParams.get('coachId')

    if (!coachId) {
      return NextResponse.json({ error: 'Coach ID is required' }, { status: 400 })
    }

    // Check if following
    const followId = `${athleteId}_${coachId}`
    const existingFollow = await adminDb.collection('coach_followers').doc(followId).get()

    return NextResponse.json({
      success: true,
      isFollowing: existingFollow.exists
    })
  } catch (error) {
    console.error('Error checking follow status:', error)
    return NextResponse.json(
      { error: 'Failed to check follow status', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
