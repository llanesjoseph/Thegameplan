import { NextRequest, NextResponse } from 'next/server'
import { adminAuth, adminDb } from '@/lib/firebase.admin'
import { auditLog } from '@/lib/audit-logger'
import { FieldValue } from 'firebase-admin/firestore'

/**
 * GET /api/coach/posts
 * Fetch all posts for a specific coach
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split('Bearer ')[1]
    const decodedToken = await adminAuth.verifyIdToken(token)
    const userId = decodedToken.uid

    // Fetch all posts created by this coach
    const postsSnapshot = await adminDb
      .collection('coach_posts')
      .where('coachId', '==', userId)
      .orderBy('createdAt', 'desc')
      .get()

    const posts = postsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || null,
      updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || null
    }))

    return NextResponse.json({
      success: true,
      posts
    })
  } catch (error) {
    console.error('Error fetching coach posts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch posts', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/coach/posts
 * Create a new coach post
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split('Bearer ')[1]
    const decodedToken = await adminAuth.verifyIdToken(token)
    const userId = decodedToken.uid

    // Get user data to fetch coach name
    const userDoc = await adminDb.collection('users').doc(userId).get()
    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const userData = userDoc.data()
    const coachName = userData?.displayName || userData?.email || 'Coach'

    // Parse request body
    const body = await request.json()
    const { content, mediaType, mediaUrl, linkUrl, linkTitle, linkDescription, pinned, audience } = body

    // Validation
    if (!content || content.trim() === '') {
      return NextResponse.json({ error: 'Post content is required' }, { status: 400 })
    }

    // Validate audience
    const validAudiences = ['assigned', 'followers', 'public']
    const postAudience = audience && validAudiences.includes(audience) ? audience : 'assigned'

    // Create post document
    const postData = {
      coachId: userId,
      coachName,
      content: content.trim(),
      mediaType: mediaType || null,
      mediaUrl: mediaUrl || null,
      linkUrl: linkUrl || null,
      linkTitle: linkTitle || null,
      linkDescription: linkDescription || null,
      pinned: pinned || false,
      likes: 0,
      comments: 0,
      audience: postAudience,  // 'assigned', 'followers', or 'public'
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    }

    const postRef = await adminDb.collection('coach_posts').add(postData)

    // Audit log
    await auditLog('coach_post_created', {
      coachId: userId,
      coachName,
      postId: postRef.id,
      hasMedia: !!mediaType
    })

    return NextResponse.json({
      success: true,
      postId: postRef.id,
      message: 'Post created successfully'
    })
  } catch (error) {
    console.error('Error creating coach post:', error)
    return NextResponse.json(
      { error: 'Failed to create post', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/coach/posts
 * Update an existing coach post
 */
export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split('Bearer ')[1]
    const decodedToken = await adminAuth.verifyIdToken(token)
    const userId = decodedToken.uid

    // Parse request body
    const body = await request.json()
    const { postId, content, mediaType, mediaUrl, linkUrl, linkTitle, linkDescription, pinned, audience } = body

    if (!postId) {
      return NextResponse.json({ error: 'Post ID is required' }, { status: 400 })
    }

    // Verify ownership
    const postDoc = await adminDb.collection('coach_posts').doc(postId).get()
    if (!postDoc.exists) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    const postData = postDoc.data()
    if (postData?.coachId !== userId) {
      return NextResponse.json({ error: 'Unauthorized to edit this post' }, { status: 403 })
    }

    // Update post
    const updates: any = {
      updatedAt: FieldValue.serverTimestamp()
    }

    if (content !== undefined) updates.content = content.trim()
    if (mediaType !== undefined) updates.mediaType = mediaType
    if (mediaUrl !== undefined) updates.mediaUrl = mediaUrl
    if (linkUrl !== undefined) updates.linkUrl = linkUrl
    if (linkTitle !== undefined) updates.linkTitle = linkTitle
    if (linkDescription !== undefined) updates.linkDescription = linkDescription
    if (pinned !== undefined) updates.pinned = pinned

    // Validate and update audience if provided
    if (audience !== undefined) {
      const validAudiences = ['assigned', 'followers', 'public']
      if (validAudiences.includes(audience)) {
        updates.audience = audience
      }
    }

    await adminDb.collection('coach_posts').doc(postId).update(updates)

    // Audit log
    await auditLog('coach_post_updated', {
      coachId: userId,
      postId
    })

    return NextResponse.json({
      success: true,
      message: 'Post updated successfully'
    })
  } catch (error) {
    console.error('Error updating coach post:', error)
    return NextResponse.json(
      { error: 'Failed to update post', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/coach/posts
 * Delete a coach post
 */
export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split('Bearer ')[1]
    const decodedToken = await adminAuth.verifyIdToken(token)
    const userId = decodedToken.uid

    // Parse request body
    const body = await request.json()
    const { postId } = body

    if (!postId) {
      return NextResponse.json({ error: 'Post ID is required' }, { status: 400 })
    }

    // Verify ownership
    const postDoc = await adminDb.collection('coach_posts').doc(postId).get()
    if (!postDoc.exists) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    const postData = postDoc.data()
    if (postData?.coachId !== userId) {
      return NextResponse.json({ error: 'Unauthorized to delete this post' }, { status: 403 })
    }

    // Delete post
    await adminDb.collection('coach_posts').doc(postId).delete()

    // Audit log
    await auditLog('coach_post_deleted', {
      coachId: userId,
      postId
    })

    return NextResponse.json({
      success: true,
      message: 'Post deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting coach post:', error)
    return NextResponse.json(
      { error: 'Failed to delete post', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
