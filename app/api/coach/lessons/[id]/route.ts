import { NextRequest, NextResponse } from 'next/server'
import { auth, adminDb } from '@/lib/firebase.admin'

// GET - Fetch a single lesson by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
        { error: 'Only coaches can view lessons' },
        { status: 403 }
      )
    }

    // 3. Get lesson
    const lessonId = params.id
    const lessonDoc = await adminDb.collection('lessons').doc(lessonId).get()

    if (!lessonDoc.exists) {
      return NextResponse.json(
        { error: 'Lesson not found' },
        { status: 404 }
      )
    }

    const lessonData = lessonDoc.data()

    // 4. Verify ownership (or admin)
    if (lessonData?.coachId !== uid && !['admin', 'superadmin'].includes(userRole)) {
      return NextResponse.json(
        { error: 'You can only view your own lessons' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      success: true,
      lesson: {
        id: lessonDoc.id,
        ...lessonData
      }
    })

  } catch (error: any) {
    console.error('Error fetching lesson:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT - Update a lesson
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
        { error: 'Only coaches can update lessons' },
        { status: 403 }
      )
    }

    // 3. Get existing lesson
    const lessonId = params.id
    const lessonDoc = await adminDb.collection('lessons').doc(lessonId).get()

    if (!lessonDoc.exists) {
      return NextResponse.json(
        { error: 'Lesson not found' },
        { status: 404 }
      )
    }

    const existingLesson = lessonDoc.data()

    // 4. Verify ownership
    if (existingLesson?.coachId !== uid && !['admin', 'superadmin'].includes(userRole)) {
      return NextResponse.json(
        { error: 'You can only update your own lessons' },
        { status: 403 }
      )
    }

    // 5. Parse request body
    const body = await request.json()
    const {
      title,
      sport,
      level,
      duration,
      objectives,
      sections,
      tags,
      visibility
    } = body

    // 6. Validate required fields
    if (!title || !sport || !level) {
      return NextResponse.json(
        { error: 'Missing required fields: title, sport, level' },
        { status: 400 }
      )
    }

    // 7. Update lesson document
    const updateData = {
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

      // Metadata
      updatedAt: new Date().toISOString(),

      // Preserve original metadata
      coachId: existingLesson?.coachId,
      coachName: existingLesson?.coachName,
      coachEmail: existingLesson?.coachEmail,
      status: existingLesson?.status || 'published',
      createdAt: existingLesson?.createdAt,
      publishedAt: existingLesson?.publishedAt,
      viewCount: existingLesson?.viewCount || 0,
      completionCount: existingLesson?.completionCount || 0,
      averageRating: existingLesson?.averageRating || 0,
      ratingCount: existingLesson?.ratingCount || 0
    }

    // 8. Save to Firestore
    await adminDb.collection('lessons').doc(lessonId).update(updateData)

    // 9. Return success
    return NextResponse.json({
      success: true,
      lessonId,
      message: 'Lesson updated successfully'
    })

  } catch (error: any) {
    console.error('Error updating lesson:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
