import { NextRequest, NextResponse } from 'next/server'
import { auth, adminDb } from '@/lib/firebase.admin'
import { FieldValue } from 'firebase-admin/firestore'

// Force dynamic rendering for API route
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * POST /api/athlete/progress/start
 * Mark a lesson as started (when athlete first opens/views it)
 *
 * Request body: { lessonId: string }
 */
export async function POST(request: NextRequest) {
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

    const athleteId = decodedToken.uid

    // 2. Verify user has athlete role
    const userDoc = await adminDb.collection('users').doc(athleteId).get()
    if (!userDoc.exists) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const userData = userDoc.data()
    const userRole = userData?.role || 'athlete'

    if (userRole !== 'athlete' && !['admin', 'superadmin'].includes(userRole)) {
      return NextResponse.json(
        { error: 'Only athletes can update progress' },
        { status: 403 }
      )
    }

    // 3. Parse request body
    const body = await request.json()
    const { lessonId } = body

    if (!lessonId) {
      return NextResponse.json(
        { error: 'lessonId is required' },
        { status: 400 }
      )
    }

    // 4. Verify lesson exists
    const lessonDoc = await adminDb.collection('content').doc(lessonId).get()
    if (!lessonDoc.exists) {
      return NextResponse.json(
        { error: 'Lesson not found' },
        { status: 404 }
      )
    }

    // 5. Get or create athlete feed
    const feedRef = adminDb.collection('athlete_feed').doc(athleteId)
    const feedDoc = await feedRef.get()
    
    if (!feedDoc.exists) {
      // Create feed if it doesn't exist
      await feedRef.set({
        athleteId,
        availableLessons: [lessonId],
        startedLessons: [lessonId],
        completedLessons: [],
        totalLessons: 1,
        completionRate: 0,
        lastActivity: FieldValue.serverTimestamp(),
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      })
      
      return NextResponse.json({
        success: true,
        message: 'Lesson marked as started',
        lessonId,
        wasNew: true
      })
    }

    const feedData = feedDoc.data()
    const startedLessons = feedData?.startedLessons || []

    // Only add if not already started (idempotent)
    if (!startedLessons.includes(lessonId)) {
      // CRITICAL FIX: Also add to availableLessons to ensure it's counted in aggregation
      // This fixes the issue where "in progress" count shows 0 even when lessons are started
      await feedRef.update({
        startedLessons: FieldValue.arrayUnion(lessonId),
        availableLessons: FieldValue.arrayUnion(lessonId), // Ensure lesson is in available list
        [`startDates.${lessonId}`]: FieldValue.serverTimestamp(),
        lastActivity: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      })

      console.log(`✅ Athlete ${athleteId} started lesson ${lessonId} (also added to availableLessons)`)
    }

    return NextResponse.json({
      success: true,
      message: 'Lesson marked as started',
      lessonId,
      wasNew: !startedLessons.includes(lessonId)
    })

  } catch (error: any) {
    console.error('❌ Error marking lesson as started:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    })
    return NextResponse.json(
      {
        error: error.message || 'Internal server error',
        details: error.code || error.name
      },
      { status: 500 }
    )
  }
}

