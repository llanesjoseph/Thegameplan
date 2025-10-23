import { NextRequest, NextResponse } from 'next/server'
import { auth, adminDb } from '@/lib/firebase.admin'

// Force dynamic rendering for API route
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET - List all videos for a coach
export async function GET(request: NextRequest) {
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
        { error: 'Only coaches can view videos' },
        { status: 403 }
      )
    }

    // 3. Query videos by creatorUid
    // Note: Removed orderBy to avoid composite index requirement
    // Videos will be sorted on client-side if needed
    const videosSnapshot = await adminDb
      .collection('videos')
      .where('creatorUid', '==', uid)
      .get()

    const videos = videosSnapshot.docs.map(doc => {
      const data = doc.data()
      return {
        id: doc.id,
        title: data.title || '',
        description: data.description || '',
        source: data.source || 'youtube',
        url: data.url || '',
        thumbnail: data.thumbnail || '',
        duration: data.duration || 0,
        sport: data.sport || 'other',
        tags: data.tags || [],
        views: data.views || 0,
        // Convert Firestore timestamps to ISO strings for display
        createdAt: data.createdAt?.toDate?.()?.toLocaleDateString() || 'Recently'
      }
    }).sort((a, b) => {
      // Sort by createdAt descending on client-side
      const dateA = videosSnapshot.docs.find(d => d.id === a.id)?.data().createdAt?.toDate?.()?.getTime() || 0
      const dateB = videosSnapshot.docs.find(d => d.id === b.id)?.data().createdAt?.toDate?.()?.getTime() || 0
      return dateB - dateA
    })

    return NextResponse.json({
      success: true,
      videos,
      count: videos.length
    })

  } catch (error: any) {
    console.error('Error listing videos:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    })
    return NextResponse.json(
      {
        error: error.message || 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

// POST - Create a new video
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
        { error: 'Only coaches can create videos' },
        { status: 403 }
      )
    }

    // 3. Parse request body
    const body = await request.json()
    const { title, description, source, url, thumbnail, duration, sport, tags } = body

    // 4. Validate required fields
    if (!title || !source || !url || !sport) {
      return NextResponse.json(
        { error: 'Missing required fields: title, source, url, sport' },
        { status: 400 }
      )
    }

    // 5. Create video document
    const now = new Date()
    const videoData = {
      creatorUid: uid,
      title,
      description: description || '',
      source,
      url,
      thumbnail: thumbnail || '',
      duration: typeof duration === 'number' ? duration : parseInt(duration) || 0, // Duration in minutes
      sport,
      tags: Array.isArray(tags) ? tags : [],
      views: 0,
      createdAt: now,
      updatedAt: now
    }

    console.log('Creating video:', {
      title,
      source,
      sport,
      duration: videoData.duration,
      creatorUid: uid
    })

    const videoRef = await adminDb.collection('videos').add(videoData)

    console.log('Video created successfully:', videoRef.id)

    return NextResponse.json({
      success: true,
      videoId: videoRef.id,
      video: {
        id: videoRef.id,
        ...videoData,
        createdAt: now.toISOString()
      },
      message: 'Video created successfully'
    })

  } catch (error: any) {
    console.error('Error creating video:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    })
    return NextResponse.json(
      {
        error: error.message || 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

// DELETE - Delete a video
export async function DELETE(request: NextRequest) {
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
        { error: 'Only coaches can delete videos' },
        { status: 403 }
      )
    }

    // 3. Parse request body
    const body = await request.json()
    const { videoId } = body

    if (!videoId) {
      return NextResponse.json(
        { error: 'Missing required field: videoId' },
        { status: 400 }
      )
    }

    // 4. Get video document
    const videoDoc = await adminDb.collection('videos').doc(videoId).get()

    if (!videoDoc.exists) {
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 }
      )
    }

    const videoData = videoDoc.data()

    // 5. Verify ownership (or admin)
    if (videoData?.creatorUid !== uid && !['admin', 'superadmin'].includes(userRole)) {
      return NextResponse.json(
        { error: 'You can only delete your own videos' },
        { status: 403 }
      )
    }

    // 6. Delete the video
    await adminDb.collection('videos').doc(videoId).delete()

    return NextResponse.json({
      success: true,
      message: 'Video deleted successfully'
    })

  } catch (error: any) {
    console.error('Error deleting video:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
