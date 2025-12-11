import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase.admin'

export const runtime = 'nodejs'

/**
 * GET /api/lessons/[id]/preview
 * Public preview endpoint for non-authenticated users
 * Returns limited lesson data for preview purposes only
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const lessonId = params.id

    if (!lessonId) {
      return NextResponse.json(
        { error: 'Lesson ID is required' },
        { status: 400 }
      )
    }

    // Get lesson data
    const lessonDoc = await adminDb.collection('content').doc(lessonId).get()

    if (!lessonDoc.exists) {
      return NextResponse.json(
        { error: 'Lesson not found' },
        { status: 404 }
      )
    }

    const lessonData = lessonDoc.data()

    // Check if lesson is published
    if (lessonData?.status !== 'published') {
      return NextResponse.json(
        { error: 'This lesson is not available for preview' },
        { status: 404 }
      )
    }

    // Return only preview-safe data (no full content, videos, or sensitive info)
    const previewData = {
      id: lessonDoc.id,
      title: lessonData.title || 'Untitled Lesson',
      description: lessonData.description || '',
      sport: lessonData.sport || '',
      level: lessonData.level || 'beginner',
      duration: lessonData.duration || 0,
      tags: lessonData.tags || [],
      createdAt: lessonData.createdAt,
      views: lessonData.views || 0,
      // Limited creator info
      creatorName: lessonData.creatorName || 'Anonymous Coach',
      // No full content, videos, or detailed creator info
      isPreview: true,
      requiresAuth: true
    }

    return NextResponse.json({
      success: true,
      lesson: previewData,
      message: 'This is a preview. Sign in to access the full lesson.'
    })

  } catch (error: any) {
    console.error('Error fetching lesson preview:', error)
    return NextResponse.json(
      { error: 'Failed to load lesson preview' },
      { status: 500 }
    )
  }
}
