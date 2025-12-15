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

    // CRITICAL: Check maxCoaches limit based on subscription tier
    const subscription = athleteData?.subscription || {}
    const access = athleteData?.access || {}
    const tier = subscription.tier || 'none'
    const isActive = subscription.isActive !== false && (subscription.status === 'active' || subscription.status === 'trialing')
    
    // Determine maxCoaches based on tier
    let maxCoaches = 1 // Default to free tier (1 coach)
    if (tier === 'basic' && isActive) {
      maxCoaches = 3
    } else if (tier === 'elite' && isActive) {
      maxCoaches = -1 // Unlimited
    } else {
      // Use access.maxCoaches if set, otherwise default to 1
      maxCoaches = access.maxCoaches ?? 1
    }

    // Count current coaches (assigned + followed)
    const assignedCoachId = athleteData?.coachId || athleteData?.assignedCoachId
    const followingSnapshot = await adminDb
      .collection('coach_followers')
      .where('athleteId', '==', athleteId)
      .get()
    
    const followedCoachIds = new Set(followingSnapshot.docs.map(doc => doc.data().coachId))
    
    // Count unique coaches (assigned coach counts as 1, followed coaches count separately)
    let currentCoachCount = 0
    if (assignedCoachId) {
      currentCoachCount++ // Assigned coach counts as 1
    }
    // Count followed coaches (excluding assigned coach if they're also followed)
    followedCoachIds.forEach(followedId => {
      if (followedId !== assignedCoachId) {
        currentCoachCount++
      }
    })

    // Check if adding this coach would exceed the limit
    const wouldExceedLimit = maxCoaches !== -1 && currentCoachCount >= maxCoaches
    
    if (wouldExceedLimit) {
      const tierName = tier === 'none' ? 'Free (Tier 1)' : tier === 'basic' ? 'Tier 2' : 'Tier 3'
      
      // Determine upgrade message based on current tier
      let upgradeMessage = ''
      let requiredTier = ''
      if (tier === 'none' || !isActive) {
        upgradeMessage = 'Upgrade to Tier 2 ($9.99/month) to follow up to 3 coaches, or Tier 3 ($19.99/month) for unlimited coaches.'
        requiredTier = 'basic'
      } else if (tier === 'basic') {
        upgradeMessage = 'Upgrade to Tier 3 ($19.99/month) to follow unlimited coaches and unlock 1:1 coaching sessions.'
        requiredTier = 'elite'
      }
      
      return NextResponse.json({
        success: false,
        error: `You've reached your ${tierName} limit of ${maxCoaches} coach${maxCoaches === 1 ? '' : 'es'}. ${upgradeMessage}`,
        limitReached: true,
        currentCount: currentCoachCount,
        maxCoaches: maxCoaches,
        currentTier: tier,
        requiredTier: requiredTier,
        upgradeUrl: '/dashboard/athlete/pricing'
      }, { status: 403 })
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
