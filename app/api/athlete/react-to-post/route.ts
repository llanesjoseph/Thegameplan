import { NextRequest, NextResponse } from 'next/server'
import { auth as adminAuth, adminDb } from '@/lib/firebase.admin'
import { FieldValue } from 'firebase-admin/firestore'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * POST /api/athlete/react-to-post
 * Save or toggle an athlete's reaction to a coach post
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

    const body = await request.json()
    const { postId, emoji } = body

    if (!postId) {
      return NextResponse.json({ error: 'Post ID required' }, { status: 400 })
    }

    if (!emoji) {
      return NextResponse.json({ error: 'Emoji required' }, { status: 400 })
    }

    // Document ID format: {postId}_{userId}
    const reactionDocId = `${postId}_${userId}`
    const reactionRef = adminDb.collection('post_reactions').doc(reactionDocId)
    const reactionDoc = await reactionRef.get()

    let action = 'added'

    if (reactionDoc.exists()) {
      const existingEmoji = reactionDoc.data()?.emoji

      if (existingEmoji === emoji) {
        // Same emoji clicked - remove reaction
        await reactionRef.delete()
        action = 'removed'
      } else {
        // Different emoji - update reaction
        await reactionRef.update({
          emoji,
          updatedAt: FieldValue.serverTimestamp()
        })
        action = 'updated'
      }
    } else {
      // New reaction - create it
      await reactionRef.set({
        postId,
        userId,
        emoji,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      })
      action = 'added'
    }

    // Get all reactions for this post to calculate counts
    const allReactionsSnap = await adminDb
      .collection('post_reactions')
      .where('postId', '==', postId)
      .get()

    const reactionCounts: Record<string, number> = {}
    allReactionsSnap.forEach(doc => {
      const data = doc.data()
      const emoji = data.emoji
      reactionCounts[emoji] = (reactionCounts[emoji] || 0) + 1
    })

    return NextResponse.json({
      success: true,
      action,
      reactionCounts,
      userReaction: action === 'removed' ? null : emoji
    })
  } catch (error) {
    console.error('Error handling reaction:', error)
    return NextResponse.json(
      { error: 'Failed to save reaction', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/athlete/react-to-post?postId={postId}
 * Get reaction counts and user's reaction for a post
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

    const { searchParams } = new URL(request.url)
    const postId = searchParams.get('postId')

    if (!postId) {
      return NextResponse.json({ error: 'Post ID required' }, { status: 400 })
    }

    // Get all reactions for this post
    const reactionsSnap = await adminDb
      .collection('post_reactions')
      .where('postId', '==', postId)
      .get()

    const reactionCounts: Record<string, number> = {}
    let userReaction: string | null = null

    reactionsSnap.forEach(doc => {
      const data = doc.data()
      const emoji = data.emoji
      reactionCounts[emoji] = (reactionCounts[emoji] || 0) + 1

      // Check if this is the current user's reaction
      if (data.userId === userId) {
        userReaction = emoji
      }
    })

    return NextResponse.json({
      success: true,
      reactionCounts,
      userReaction
    })
  } catch (error) {
    console.error('Error fetching reactions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reactions', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
