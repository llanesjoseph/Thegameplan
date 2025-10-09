import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebaseAdmin'
import { adminAuth } from '@/lib/firebaseAdmin'

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
      decodedToken = await adminAuth.verifyIdToken(token)
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      )
    }

    const uid = decodedToken.uid

    // 2. Verify user has coach role
    const userDoc = await adminDb.collection('users').doc(uid).get()
    if (!userDoc.exists) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const userData = userDoc.data()
    const userRole = userData?.role || userData?.roles?.[0] || 'user'

    if (!['coach', 'creator', 'admin', 'superadmin'].includes(userRole)) {
      return NextResponse.json(
        { error: 'Only coaches can create lessons' },
        { status: 403 }
      )
    }

    // 3. Parse request body
    const body = await request.json()
    const {
      title,
      sport,
      level,
      duration,
      objectives,
      sections,
      tags,
      visibility,
      coachId,
      coachName
    } = body

    // 4. Validate required fields
    if (!title || !sport || !level) {
      return NextResponse.json(
        { error: 'Missing required fields: title, sport, level' },
        { status: 400 }
      )
    }

    // 5. Create lesson document
    const lessonData = {
      // Basic info
      title: title.trim(),
      sport: sport.toLowerCase(),
      level,
      duration: duration || 60,

      // Content
      objectives: objectives || [],
      sections: sections || [],
      tags: tags || [],

      // Visibility
      visibility: visibility || 'athletes_only',

      // Coach info
      coachId: coachId || uid,
      coachName: coachName || userData?.displayName || 'Unknown Coach',
      coachEmail: userData?.email || '',

      // Metadata
      status: 'published',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      publishedAt: new Date().toISOString(),

      // Analytics
      viewCount: 0,
      completionCount: 0,
      averageRating: 0,
      ratingCount: 0
    }

    // 6. Save to Firestore
    const lessonRef = await adminDb.collection('lessons').add(lessonData)

    // 7. Update coach's lesson count
    const coachRef = adminDb.collection('users').doc(uid)
    await coachRef.update({
      lessonCount: (userData?.lessonCount || 0) + 1,
      lastLessonCreatedAt: new Date().toISOString()
    })

    // 8. Return success
    return NextResponse.json({
      success: true,
      lessonId: lessonRef.id,
      message: 'Lesson created successfully'
    })

  } catch (error: any) {
    console.error('Error creating lesson:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
