/**
 * API endpoint for creating lessons
 * Features:
 * - Atomic transaction for lesson creation
 * - Immutable creatorUid attribution
 * - Server-side validation for all fields
 * - Audit logging
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth, adminDb } from '@/lib/firebase.admin'
import { auditLog } from '@/lib/audit-logger'
import { FieldValue } from 'firebase-admin/firestore'

// Force dynamic rendering for API route
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Validation constants
const MAX_TITLE_LENGTH = 200
const MIN_TITLE_LENGTH = 1
const MAX_OBJECTIVES = 20
const MAX_SECTIONS = 50
const MAX_TAGS = 15
const VALID_LEVELS = ['beginner', 'intermediate', 'advanced'] as const
const VALID_VISIBILITY = ['public', 'athletes_only', 'specific_athletes'] as const

export async function POST(request: NextRequest) {
  const requestId = `lesson-create-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`

  try {
    // 1. Verify authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      await auditLog('lesson_create_unauthorized', {
        requestId,
        error: 'Missing authorization header',
        timestamp: new Date().toISOString()
      }, { severity: 'high' })

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
      await auditLog('lesson_create_invalid_token', {
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }, { severity: 'high' })

      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      )
    }

    const uid = decodedToken.uid

    // 2. Verify user has coach role
    const userDoc = await adminDb.collection('users').doc(uid).get()
    if (!userDoc.exists) {
      await auditLog('lesson_create_user_not_found', {
        requestId,
        userId: uid,
        timestamp: new Date().toISOString()
      }, { userId: uid, severity: 'medium' })

      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const userData = userDoc.data()
    const userRole = userData?.role || userData?.roles?.[0] || 'user'

    if (!['coach', 'creator', 'admin', 'superadmin'].includes(userRole)) {
      await auditLog('lesson_create_forbidden', {
        requestId,
        userId: uid,
        userRole,
        timestamp: new Date().toISOString()
      }, { userId: uid, severity: 'medium' })

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
      content,
      videoUrl,
      thumbnailUrl
    } = body

    // 4. SERVER-SIDE VALIDATION - CRITICAL
    const validationErrors: string[] = []

    // Title validation
    if (!title || typeof title !== 'string') {
      validationErrors.push('Title is required and must be a string')
    } else if (title.trim().length < MIN_TITLE_LENGTH) {
      validationErrors.push(`Title must be at least ${MIN_TITLE_LENGTH} character`)
    } else if (title.trim().length > MAX_TITLE_LENGTH) {
      validationErrors.push(`Title must not exceed ${MAX_TITLE_LENGTH} characters`)
    }

    // Sport validation
    if (!sport || typeof sport !== 'string') {
      validationErrors.push('Sport is required and must be a string')
    }

    // Level validation
    if (!level || !VALID_LEVELS.includes(level)) {
      validationErrors.push(`Level must be one of: ${VALID_LEVELS.join(', ')}`)
    }

    // Duration validation
    if (duration !== undefined && (typeof duration !== 'number' || duration < 5 || duration > 240)) {
      validationErrors.push('Duration must be a number between 5 and 240 minutes')
    }

    // Objectives validation
    if (objectives !== undefined) {
      if (!Array.isArray(objectives)) {
        validationErrors.push('Objectives must be an array')
      } else if (objectives.length > MAX_OBJECTIVES) {
        validationErrors.push(`Maximum ${MAX_OBJECTIVES} objectives allowed`)
      } else if (objectives.some((obj: any) => typeof obj !== 'string')) {
        validationErrors.push('All objectives must be strings')
      }
    }

    // Sections validation
    if (sections !== undefined) {
      if (!Array.isArray(sections)) {
        validationErrors.push('Sections must be an array')
      } else if (sections.length > MAX_SECTIONS) {
        validationErrors.push(`Maximum ${MAX_SECTIONS} sections allowed`)
      }
    }

    // Tags validation
    if (tags !== undefined) {
      if (!Array.isArray(tags)) {
        validationErrors.push('Tags must be an array')
      } else if (tags.length > MAX_TAGS) {
        validationErrors.push(`Maximum ${MAX_TAGS} tags allowed`)
      } else if (tags.some((tag: any) => typeof tag !== 'string')) {
        validationErrors.push('All tags must be strings')
      }
    }

    // Visibility validation
    if (visibility !== undefined && !VALID_VISIBILITY.includes(visibility)) {
      validationErrors.push(`Visibility must be one of: ${VALID_VISIBILITY.join(', ')}`)
    }

    // Video URL validation (optional field)
    if (videoUrl !== undefined && videoUrl !== null && videoUrl !== '') {
      if (typeof videoUrl !== 'string') {
        validationErrors.push('Video URL must be a string')
      } else if (videoUrl.length > 2048) {
        validationErrors.push('Video URL must not exceed 2048 characters')
      }
      // Basic URL format validation
      try {
        new URL(videoUrl)
      } catch {
        validationErrors.push('Video URL must be a valid URL')
      }
    }

    // Thumbnail URL validation (optional field)
    if (thumbnailUrl !== undefined && thumbnailUrl !== null && thumbnailUrl !== '') {
      if (typeof thumbnailUrl !== 'string') {
        validationErrors.push('Thumbnail URL must be a string')
      } else if (thumbnailUrl.length > 2048) {
        validationErrors.push('Thumbnail URL must not exceed 2048 characters')
      }
      // Basic URL format validation
      try {
        new URL(thumbnailUrl)
      } catch {
        validationErrors.push('Thumbnail URL must be a valid URL')
      }
    }

    // Content validation (optional field for long-form content)
    if (content !== undefined && typeof content !== 'string') {
      validationErrors.push('Content must be a string')
    }

    if (validationErrors.length > 0) {
      await auditLog('lesson_create_validation_failed', {
        requestId,
        userId: uid,
        validationErrors,
        timestamp: new Date().toISOString()
      }, { userId: uid, severity: 'low' })

      return NextResponse.json(
        { error: 'Validation failed', details: validationErrors },
        { status: 400 }
      )
    }

    // 5. Create lesson document with IMMUTABLE creatorUid
    const lessonData: any = {
      // Basic info
      title: title.trim(),
      sport: sport.toLowerCase().trim(),
      level,
      duration: duration || 60,
      type: 'lesson', // Add type field for content categorization

      // Content
      objectives: objectives || [],
      sections: sections || [],
      tags: tags || [],

      // Visibility
      visibility: visibility || 'athletes_only',

      // CRITICAL: Use creatorUid (matches Firestore rules) and make it IMMUTABLE
      creatorUid: uid, // IMMUTABLE - Set once, never changed
      creatorName: userData?.displayName || 'Unknown Coach',
      creatorEmail: userData?.email || '',

      // Metadata
      status: 'published',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      publishedAt: FieldValue.serverTimestamp(),

      // Analytics
      viewCount: 0,
      completionCount: 0,
      averageRating: 0,
      ratingCount: 0
    }

    // Add optional fields only if they are provided
    if (content !== undefined && content !== null && content !== '') {
      lessonData.content = content
    }

    if (videoUrl !== undefined && videoUrl !== null && videoUrl !== '') {
      lessonData.videoUrl = videoUrl
    }

    if (thumbnailUrl !== undefined && thumbnailUrl !== null && thumbnailUrl !== '') {
      lessonData.thumbnailUrl = thumbnailUrl
    }

    // 6. ATOMIC TRANSACTION - Save lesson and update coach count
    let lessonId: string | null = null

    await adminDb.runTransaction(async (transaction) => {
      // Create lesson reference
      const lessonRef = adminDb.collection('content').doc()
      lessonId = lessonRef.id

      // Set lesson data
      transaction.set(lessonRef, lessonData)

      // Update coach's lesson count atomically
      const coachRef = adminDb.collection('users').doc(uid)
      transaction.update(coachRef, {
        lessonCount: FieldValue.increment(1),
        lastLessonCreatedAt: FieldValue.serverTimestamp()
      })
    })

    // 7. Audit logging
    await auditLog('lesson_created', {
      requestId,
      userId: uid,
      lessonId,
      title: lessonData.title,
      sport: lessonData.sport,
      level: lessonData.level,
      visibility: lessonData.visibility,
      timestamp: new Date().toISOString()
    }, { userId: uid, severity: 'low' })

    console.log(`✅ Lesson created by ${uid}: ${lessonId}`)

    // 8. Return success
    return NextResponse.json({
      success: true,
      lessonId,
      message: 'Lesson created successfully'
    })

  } catch (error: any) {
    console.error('Error creating lesson:', error)

    await auditLog('lesson_create_error', {
      requestId,
      error: error.message || 'Unknown error',
      stack: error.stack,
      timestamp: new Date().toISOString()
    }, { severity: 'high' })

    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
