import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/firebase.admin';
import { getSubmission } from '@/lib/data/submissions';
import {
  createComment,
  getSubmissionComments,
  updateComment,
  deleteComment,
} from '@/lib/data/comments';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('cookie');
    const sessionCookie = authHeader
      ?.split('; ')
      .find((row) => row.startsWith('session='))
      ?.split('=')[1];

    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decodedToken = await auth.verifyIdToken(sessionCookie);
    const userId = decodedToken.uid;

    // Fetch submission to verify access
    const submission = await getSubmission(params.id);

    if (!submission) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      );
    }

    // Check permissions - only athlete or assigned/claimed coach can view
    const canView =
      submission.athleteUid === userId ||
      submission.claimedBy === userId ||
      submission.coachId === userId;

    if (!canView) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Get comments
    const { comments } = await getSubmissionComments(params.id, 100); // Get up to 100 comments

    return NextResponse.json({ comments });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('cookie');
    const sessionCookie = authHeader
      ?.split('; ')
      .find((row) => row.startsWith('session='))
      ?.split('=')[1];

    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decodedToken = await auth.verifyIdToken(sessionCookie);
    const userId = decodedToken.uid;
    const userEmail = decodedToken.email;

    // Parse request body
    const {
      content,
      authorRole,
      authorName,
      authorPhotoUrl,
      timestamp,
      parentCommentId,
    } = await request.json();

    if (!content || !authorRole || !authorName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Fetch submission to verify access
    const submission = await getSubmission(params.id);

    if (!submission) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      );
    }

    // Check permissions - only athlete or assigned/claimed coach can comment
    const canComment =
      submission.athleteUid === userId ||
      submission.claimedBy === userId ||
      submission.coachId === userId;

    if (!canComment) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Create comment
    const commentId = await createComment(
      params.id,
      userId,
      authorName,
      authorPhotoUrl,
      authorRole,
      content,
      timestamp,
      parentCommentId
    );

    return NextResponse.json({
      success: true,
      commentId,
    });
  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json(
      { error: 'Failed to create comment' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('cookie');
    const sessionCookie = authHeader
      ?.split('; ')
      .find((row) => row.startsWith('session='))
      ?.split('=')[1];

    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decodedToken = await auth.verifyIdToken(sessionCookie);
    const userId = decodedToken.uid;

    // Parse request body
    const { commentId, content } = await request.json();

    if (!commentId || !content) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify comment ownership
    const { getComment } = await import('@/lib/data/comments');
    const comment = await getComment(commentId);

    if (!comment) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      );
    }

    if (comment.authorUid !== userId) {
      return NextResponse.json(
        { error: 'You can only edit your own comments' },
        { status: 403 }
      );
    }

    // Update comment
    await updateComment(commentId, content);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating comment:', error);
    return NextResponse.json(
      { error: 'Failed to update comment' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('cookie');
    const sessionCookie = authHeader
      ?.split('; ')
      .find((row) => row.startsWith('session='))
      ?.split('=')[1];

    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decodedToken = await auth.verifyIdToken(sessionCookie);
    const userId = decodedToken.uid;

    // Parse request body
    const { commentId } = await request.json();

    if (!commentId) {
      return NextResponse.json(
        { error: 'Missing comment ID' },
        { status: 400 }
      );
    }

    // Verify comment ownership
    const { getComment } = await import('@/lib/data/comments');
    const comment = await getComment(commentId);

    if (!comment) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      );
    }

    if (comment.authorUid !== userId) {
      return NextResponse.json(
        { error: 'You can only delete your own comments' },
        { status: 403 }
      );
    }

    // Delete comment
    await deleteComment(commentId, params.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting comment:', error);
    return NextResponse.json(
      { error: 'Failed to delete comment' },
      { status: 500 }
    );
  }
}