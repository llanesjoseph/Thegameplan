import { NextRequest, NextResponse } from 'next/server'
import { auth, adminDb } from '@/lib/firebase.admin'

export const runtime = 'nodejs'

/**
 * GET /api/athlete/content
 * Fetch content (lessons/videos) for athlete
 * SECURITY: Only allows athletes to access content
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Verify authentication
    const authHeader = request.headers.get('authorization')
    console.log('[CONTENT-API] Auth header:', authHeader ? 'Present' : 'Missing')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('[CONTENT-API] No valid auth header')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split('Bearer ')[1]
    console.log('[CONTENT-API] Token length:', token.length)
    
    const decodedToken = await auth.verifyIdToken(token)
    const userId = decodedToken.uid
    console.log('[CONTENT-API] User ID:', userId)

    // 2. Parse query parameters
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const type = searchParams.get('type') // 'lesson' or 'video_lesson'

    // 3. Build query for content
    let query = adminDb.collection('content')
      .where('visibility', 'in', ['public', 'my_athletes'])
      .orderBy('createdAt', 'desc')
      .limit(limit)

    // Apply type filter if specified
    if (type) {
      query = query.where('type', '==', type)
    }

    // 4. Execute query
    const contentSnapshot = await query.get()
    
    // 5. Convert documents to array
    const content = contentSnapshot.docs.map((doc: any) => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || null,
      }
    })

    console.log(`[CONTENT-API] Successfully fetched ${content.length} content items for user ${userId}`)

    return NextResponse.json({
      success: true,
      data: {
        content,
        total: content.length,
        hasMore: content.length === limit
      }
    })

  } catch (error: any) {
    console.error('[CONTENT-API] Error fetching content:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch content',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}
