import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase.admin'

export const runtime = 'nodejs'

/**
 * GET /api/lessons/public
 * Public endpoint for browsing lesson previews
 * Returns limited lesson data for non-authenticated users
 */
export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const sport = searchParams.get('sport')
    const level = searchParams.get('level')

    // Build query
    let query = adminDb.collection('content')
      .where('status', '==', 'published')
      .orderBy('createdAt', 'desc')
      .limit(limit)

    // Apply filters
    if (sport && sport !== 'all') {
      query = query.where('sport', '==', sport)
    }

    if (level && level !== 'all') {
      query = query.where('level', '==', level)
    }

    const snapshot = await query.get()

    const lessons = []
    for (const doc of snapshot.docs) {
      const data = doc.data()
      
      // Return only preview-safe data
      lessons.push({
        id: doc.id,
        title: data.title || 'Untitled Lesson',
        description: data.description || '',
        sport: data.sport || '',
        level: data.level || 'beginner',
        duration: data.duration || 0,
        views: data.views || 0,
        creatorName: data.creatorName || 'Anonymous Coach',
        createdAt: data.createdAt,
        tags: data.tags || [],
        // No full content, videos, or sensitive info
        isPreview: true
      })
    }

    return NextResponse.json({
      success: true,
      lessons,
      count: lessons.length
    })

  } catch (error: any) {
    console.error('Error fetching public lessons:', error)
    return NextResponse.json(
      { error: 'Failed to load lessons' },
      { status: 500 }
    )
  }
}
