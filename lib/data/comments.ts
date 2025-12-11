import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
  onSnapshot,
  QueryDocumentSnapshot,
  runTransaction,
} from 'firebase/firestore';
import { db } from '@/lib/firebase.client';
import { Comment, CommentAuthorRole } from '@/types/video-critique';

const COLLECTION_NAME = 'comments';

// ============================================================================
// CREATE
// ============================================================================

export async function createComment(
  submissionId: string,
  authorUid: string,
  authorName: string,
  authorPhotoUrl: string | undefined,
  authorRole: CommentAuthorRole,
  content: string,
  timestamp?: number,
  parentCommentId?: string
): Promise<string> {
  return runTransaction(db, async (transaction) => {
    const commentRef = doc(collection(db, COLLECTION_NAME));

    const newComment: Comment = {
      id: commentRef.id,
      submissionId,
      authorUid,
      authorName,
      authorPhotoUrl,
      authorRole,
      content,
      timestamp,
      parentCommentId,
      edited: false,
      createdAt: serverTimestamp() as any,
    };

    transaction.set(commentRef, newComment);

    // Update comment count on submission
    const submissionRef = doc(db, 'submissions', submissionId);
    const submissionDoc = await transaction.get(submissionRef);

    if (submissionDoc.exists()) {
      const currentCount = submissionDoc.data().commentCount || 0;
      transaction.update(submissionRef, {
        commentCount: currentCount + 1,
        updatedAt: serverTimestamp(),
      });
    }

    return commentRef.id;
  });
}

// ============================================================================
// READ
// ============================================================================

export async function getComment(commentId: string): Promise<Comment | null> {
  const commentRef = doc(db, COLLECTION_NAME, commentId);
  const commentDoc = await getDoc(commentRef);

  if (!commentDoc.exists()) {
    return null;
  }

  return commentDoc.data() as Comment;
}

export async function getSubmissionComments(
  submissionId: string,
  limitCount: number = 20,
  lastDoc?: QueryDocumentSnapshot
): Promise<{ comments: Comment[]; lastDoc: QueryDocumentSnapshot | null }> {
  let q = query(
    collection(db, COLLECTION_NAME),
    where('submissionId', '==', submissionId),
    orderBy('createdAt', 'asc'),
    limit(limitCount)
  );

  if (lastDoc) {
    q = query(q, startAfter(lastDoc));
  }

  const snapshot = await getDocs(q);
  const comments = snapshot.docs.map(doc => doc.data() as Comment);
  const newLastDoc = snapshot.docs[snapshot.docs.length - 1] || null;

  return { comments, lastDoc: newLastDoc };
}

export async function getCommentReplies(parentCommentId: string): Promise<Comment[]> {
  const q = query(
    collection(db, COLLECTION_NAME),
    where('parentCommentId', '==', parentCommentId),
    orderBy('createdAt', 'asc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data() as Comment);
}

export async function getAllSubmissionComments(submissionId: string): Promise<Comment[]> {
  const q = query(
    collection(db, COLLECTION_NAME),
    where('submissionId', '==', submissionId),
    orderBy('createdAt', 'asc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data() as Comment);
}

// ============================================================================
// UPDATE
// ============================================================================

export async function updateComment(
  commentId: string,
  content: string
): Promise<void> {
  const commentRef = doc(db, COLLECTION_NAME, commentId);

  await updateDoc(commentRef, {
    content,
    edited: true,
    editedAt: serverTimestamp(),
  });
}

// ============================================================================
// DELETE
// ============================================================================

export async function deleteComment(commentId: string, submissionId: string): Promise<void> {
  return runTransaction(db, async (transaction) => {
    const commentRef = doc(db, COLLECTION_NAME, commentId);

    // Delete the comment
    transaction.delete(commentRef);

    // Check for and delete replies
    const repliesQuery = query(
      collection(db, COLLECTION_NAME),
      where('parentCommentId', '==', commentId)
    );
    const repliesSnapshot = await getDocs(repliesQuery);

    repliesSnapshot.docs.forEach(doc => {
      transaction.delete(doc.ref);
    });

    // Update comment count on submission
    const submissionRef = doc(db, 'submissions', submissionId);
    const submissionDoc = await transaction.get(submissionRef);

    if (submissionDoc.exists()) {
      const currentCount = submissionDoc.data().commentCount || 0;
      const deletedCount = 1 + repliesSnapshot.size; // Original comment + replies
      transaction.update(submissionRef, {
        commentCount: Math.max(0, currentCount - deletedCount),
        updatedAt: serverTimestamp(),
      });
    }
  });
}

// ============================================================================
// REAL-TIME SUBSCRIPTIONS
// ============================================================================

export function subscribeToSubmissionComments(
  submissionId: string,
  callback: (comments: Comment[]) => void
): () => void {
  const q = query(
    collection(db, COLLECTION_NAME),
    where('submissionId', '==', submissionId),
    orderBy('createdAt', 'asc')
  );

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const comments = snapshot.docs.map(doc => doc.data() as Comment);
    callback(comments);
  });

  return unsubscribe;
}

export function subscribeToCommentReplies(
  parentCommentId: string,
  callback: (replies: Comment[]) => void
): () => void {
  const q = query(
    collection(db, COLLECTION_NAME),
    where('parentCommentId', '==', parentCommentId),
    orderBy('createdAt', 'asc')
  );

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const replies = snapshot.docs.map(doc => doc.data() as Comment);
    callback(replies);
  });

  return unsubscribe;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function organizeCommentsIntoThreads(comments: Comment[]): {
  topLevel: Comment[];
  replies: Map<string, Comment[]>;
} {
  const topLevel: Comment[] = [];
  const replies = new Map<string, Comment[]>();

  comments.forEach(comment => {
    if (!comment.parentCommentId) {
      topLevel.push(comment);
    } else {
      const parentReplies = replies.get(comment.parentCommentId) || [];
      parentReplies.push(comment);
      replies.set(comment.parentCommentId, parentReplies);
    }
  });

  return { topLevel, replies };
}

export function countTotalComments(comments: Comment[]): number {
  return comments.length;
}

export function getCommentsByAuthor(
  comments: Comment[],
  authorUid: string
): Comment[] {
  return comments.filter(comment => comment.authorUid === authorUid);
}

export function getCommentsByRole(
  comments: Comment[],
  role: CommentAuthorRole
): Comment[] {
  return comments.filter(comment => comment.authorRole === role);
}

export function hasVideoTimestamp(comment: Comment): boolean {
  return comment.timestamp !== undefined && comment.timestamp !== null;
}

export function sanitizeCommentContent(content: string): string {
  // Basic HTML sanitization - in production, use a library like DOMPurify
  return content
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}