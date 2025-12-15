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
  // Declare variables at function scope for catch block access
  let athleteId: string | undefined
  let coachId: string | undefined
  let currentCoachCount = 0
  
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split('Bearer ')[1]
    const decodedToken = await adminAuth.verifyIdToken(token)
    athleteId = decodedToken.uid

    // Parse request body
    const body = await request.json()
    coachId = body.coachId

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

    // CRITICAL: HARD LIMIT CHECK - Must happen BEFORE creating follow relationship
    // Use centralized subscription checker for 100% consistency
    const { checkCoachLimit } = await import('@/lib/subscription-checker')
    
    // Count current coaches (assigned + followed)
    const assignedCoachId = athleteData?.coachId || athleteData?.assignedCoachId
    const followingSnapshot = await adminDb
      .collection('coach_followers')
      .where('athleteId', '==', athleteId)
      .get()
    
    const followedCoachIds = new Set(followingSnapshot.docs.map(doc => doc.data().coachId))
    
    // Count unique coaches (assigned coach counts as 1, followed coaches count separately)
    currentCoachCount = 0
    if (assignedCoachId) {
      currentCoachCount++ // Assigned coach counts as 1
    }
    // Count followed coaches (excluding assigned coach if they're also followed)
    followedCoachIds.forEach(followedId => {
      if (followedId !== assignedCoachId) {
        currentCoachCount++
      }
    })

    // CRITICAL: Use TRANSACTION to prevent race conditions and enforce hard limits
    // This ensures the limit check and follow creation are atomic
    await adminDb.runTransaction(async (transaction) => {
      // Ensure athleteId is defined (should always be at this point, but TypeScript needs this)
      if (!athleteId) {
        throw new Error('Athlete ID is required')
      }
      
      // Re-count coaches in transaction to prevent race conditions
      const followingSnapshot = await transaction.get(
        adminDb.collection('coach_followers')
          .where('athleteId', '==', athleteId)
      )
      
      const followedCoachIds = new Set(followingSnapshot.docs.map(doc => doc.data().coachId))
      
      // Re-count in transaction
      let transactionCoachCount = 0
      if (assignedCoachId) {
        transactionCoachCount++
      }
      followedCoachIds.forEach(followedId => {
        if (followedId !== assignedCoachId) {
          transactionCoachCount++
        }
      })
      
      // HARD LIMIT CHECK in transaction (bulletproof)
      const limitCheck = await checkCoachLimit(athleteId, transactionCoachCount)
      
      if (!limitCheck.allowed) {
        throw new Error(`LIMIT_REACHED: ${limitCheck.error || 'Coach limit reached'}`)
      }
      
      // DOUBLE CHECK in transaction
      if (limitCheck.maxCoaches !== -1 && transactionCoachCount >= limitCheck.maxCoaches) {
        throw new Error(`LIMIT_REACHED: ${limitCheck.error || 'Coach limit reached'}`)
      }
      
      // Create follow relationship in transaction
      const followRef = adminDb.collection('coach_followers').doc(followId)
      transaction.set(followRef, {
        athleteId,
        coachId,
        athleteName,
        coachName,
        followedAt: FieldValue.serverTimestamp(),
        notificationsEnabled: true
      })
    })

    console.log(`✅ Athlete ${athleteId} followed coach ${coachId} (transaction committed)`)

    // CRITICAL: Sync coach's lessons to athlete_feed
    // Get all published lessons from this coach
    const lessonsSnapshot = await adminDb
      .collection('content')
      .where('creatorUid', '==', coachId)
      .where('status', '==', 'published')
      .get()
    
    const newLessonIds = lessonsSnapshot.docs.map(doc => doc.id)
    
    // Update athlete feed with new lessons (merge, don't overwrite)
    const feedRef = adminDb.collection('athlete_feed').doc(athleteId)
    const feedDoc = await feedRef.get()
    
    if (feedDoc.exists) {
      const feedData = feedDoc.data()
      const existingLessons = feedData?.availableLessons || []
      const startedLessons = feedData?.startedLessons || []
      const completedLessons = feedData?.completedLessons || []
      
      // Merge new lessons (avoid duplicates)
      const allLessons = [...new Set([...existingLessons, ...newLessonIds])]
      
      // CRITICAL: Only update availableLessons and totalLessons
      // DO NOT touch startedLessons or completedLessons - they preserve progress
      await feedRef.update({
        availableLessons: allLessons,
        totalLessons: allLessons.length,
        updatedAt: FieldValue.serverTimestamp()
      })
      
      // Note: startedLessons and completedLessons are NOT updated here
      // This ensures completion status persists when following new coaches
    } else {
      // Create new feed if it doesn't exist
      await feedRef.set({
        athleteId,
        coachId: assignedCoachId || coachId, // Use assigned coach if exists, otherwise this coach
        availableLessons: newLessonIds,
        startedLessons: [],
        completedLessons: [],
        totalLessons: newLessonIds.length,
        completionRate: 0,
        lastActivity: FieldValue.serverTimestamp(),
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      })
    }

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
  } catch (error: any) {
    console.error('Error following coach:', error)
    
    // Check if it's a limit error from transaction
    if (error.message && error.message.includes('LIMIT_REACHED') && athleteId) {
      const { checkCoachLimit } = await import('@/lib/subscription-checker')
      const limitCheck = await checkCoachLimit(athleteId, currentCoachCount)
      
      console.log(`🚫 BLOCKED: Athlete ${athleteId} attempted to follow coach ${coachId || 'unknown'} but reached limit (${currentCoachCount}/${limitCheck.maxCoaches})`)
      return NextResponse.json({
        success: false,
        error: limitCheck.error || `You've reached your coach limit. Upgrade to follow more coaches.`,
        limitReached: true,
        currentCount: currentCoachCount,
        maxCoaches: limitCheck.maxCoaches,
        upgradeUrl: limitCheck.upgradeUrl || '/dashboard/athlete/pricing'
      }, { status: 403 })
    }
    
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
