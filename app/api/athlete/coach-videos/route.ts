import { NextRequest, NextResponse } from 'next/server'
import { auth, adminDb } from '@/lib/firebase.admin'

export const runtime = 'nodejs'

/**
 * GET /api/athlete/coach-videos
 * Fetch videos posted by the athlete's assigned coach
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Verify authentication
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split('Bearer ')[1]
    const decodedToken = await auth.verifyIdToken(token)
    const userId = decodedToken.uid

    // 2. Get athlete's assigned coach ID
    const userDoc = await adminDb.collection('users').doc(userId).get()
    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const userData = userDoc.data()
    const assignedCoachId = userData?.coachId || userData?.assignedCoachId

    if (!assignedCoachId) {
      return NextResponse.json({ 
        success: true, 
        videos: [], 
        message: 'No assigned coach found' 
      })
    }

    // 3. Fetch videos from the content collection (where coach videos are stored)
    const videosSnapshot = await adminDb
      .collection('content')
      .where('creatorUid', '==', assignedCoachId)
      .where('type', '==', 'video_lesson')
      .get()

    const videos = videosSnapshot.docs.map(doc => {
      const data = doc.data()
      return {
        id: doc.id,
        title: data.title || 'Untitled Video',
        description: data.description || '',
        source: data.source || 'youtube',
        url: data.url || '',
        thumbnail: data.thumbnail || '',
        duration: data.duration || 0,
        sport: data.sport || 'other',
        tags: data.tags || [],
        views: data.views || data.viewCount || 0,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
        createdDate: data.createdAt?.toDate?.()?.toLocaleDateString() || 'Recently'
      }
    })

    // Sort by creation date (newest first)
    videos.sort((a, b) => {
      const dateA = new Date(a.createdAt || 0).getTime()
      const dateB = new Date(b.createdAt || 0).getTime()
      return dateB - dateA
    })

    console.log(`Found ${videos.length} videos for athlete from coach`)

    return NextResponse.json({
      success: true,
      videos,
      count: videos.length,
      coachId: assignedCoachId
    })

  } catch (error: any) {
    console.error('Error fetching coach videos:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch coach videos',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}
