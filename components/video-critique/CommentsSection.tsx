'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  MessageCircle,
  Send,
  Clock,
  Edit2,
  Trash2,
  MoreVertical,
  Reply,
  Loader2,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Comment, CommentAuthorRole } from '@/types/video-critique';
import {
  subscribeToSubmissionComments,
  createComment,
  updateComment,
  deleteComment,
  organizeCommentsIntoThreads,
} from '@/lib/data/comments';
import CommentThread from './CommentThread';
import { formatTimecode } from '@/lib/data/reviews';
import { createNotification } from '@/lib/data/notifications';

interface CommentsSectionProps {
  submissionId: string;
  currentUserId: string;
  currentUserRole: CommentAuthorRole;
  currentUserName: string;
  currentUserPhotoUrl?: string;
  onTimestampClick?: (timestamp: number) => void;
}

export default function CommentsSection({
  submissionId,
  currentUserId,
  currentUserRole,
  currentUserName,
  currentUserPhotoUrl,
  onTimestampClick,
}: CommentsSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [includeTimestamp, setIncludeTimestamp] = useState(false);
  const [currentVideoTime, setCurrentVideoTime] = useState<number | null>(null);

  // Subscribe to real-time comments
  useEffect(() => {
    const unsubscribe = subscribeToSubmissionComments(submissionId, (updatedComments) => {
      setComments(updatedComments);
      setLoading(false);
    });

    setLoading(true);
    return () => unsubscribe();
  }, [submissionId]);

  // Get current video time if available
  useEffect(() => {
    const interval = setInterval(() => {
      const videoElement = document.querySelector('video') as HTMLVideoElement;
      if (videoElement) {
        setCurrentVideoTime(videoElement.currentTime);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Organize comments into threads
  const { topLevel, replies } = useMemo(() => {
    return organizeCommentsIntoThreads(comments);
  }, [comments]);

  // Handle new comment submission
  const handleSubmitComment = async () => {
    if (!newComment.trim()) {
      toast.error('Please enter a comment');
      return;
    }

    setSubmitting(true);
    try {
      const timestamp = includeTimestamp ? currentVideoTime || undefined : undefined;

      await createComment(
        submissionId,
        currentUserId,
        currentUserName,
        currentUserPhotoUrl,
        currentUserRole,
        newComment,
        timestamp,
        replyingTo || undefined
      );

      // Create notification for relevant parties
      // This would be better handled in a Cloud Function in production
      if (currentUserRole === 'coach') {
        // Notify athlete
        const submission = await fetch(`/api/submissions/${submissionId}`).then(r => r.json());
        if (submission.athleteUid !== currentUserId) {
          await createNotification(
            submission.athleteUid,
            'comment_added',
            'New Comment',
            `${currentUserName} commented on your ${submission.skillName} submission`,
            `/dashboard/athlete/reviews/${submissionId}`,
            {
              submissionId,
              commentId: '',
            }
          );
        }
      }

      setNewComment('');
      setReplyingTo(null);
      setIncludeTimestamp(false);
      toast.success('Comment posted');
    } catch (error) {
      console.error('Error posting comment:', error);
      toast.error('Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle comment edit
  const handleEditComment = async (commentId: string) => {
    if (!editContent.trim()) {
      toast.error('Comment cannot be empty');
      return;
    }

    setSubmitting(true);
    try {
      await updateComment(commentId, editContent);
      setEditingComment(null);
      setEditContent('');
      toast.success('Comment updated');
    } catch (error) {
      console.error('Error updating comment:', error);
      toast.error('Failed to update comment');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle comment delete
  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment and all its replies?')) {
      return;
    }

    setSubmitting(true);
    try {
      await deleteComment(commentId, submissionId);
      toast.success('Comment deleted');
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error('Failed to delete comment');
    } finally {
      setSubmitting(false);
    }
  };

  // Get role badge color
  const getRoleBadgeColor = (role: CommentAuthorRole) => {
    switch (role) {
      case 'coach':
        return 'bg-blue-100 text-blue-700';
      case 'athlete':
        return 'bg-green-100 text-green-700';
      case 'parent':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* New Comment Form */}
      <div className="border rounded-lg p-4">
        {replyingTo && (
          <div className="mb-2 text-sm text-gray-600 flex items-center justify-between">
            <span>Replying to comment...</span>
            <button
              onClick={() => setReplyingTo(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              Cancel
            </button>
          </div>
        )}

        <Textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          className="min-h-[80px] mb-3"
          disabled={submitting}
        />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {currentVideoTime !== null && (
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={includeTimestamp}
                  onChange={(e) => setIncludeTimestamp(e.target.checked)}
                  disabled={submitting}
                />
                <Clock className="h-4 w-4" />
                Add timestamp ({formatTimecode(currentVideoTime)})
              </label>
            )}
          </div>

          <Button
            onClick={handleSubmitComment}
            disabled={submitting || !newComment.trim()}
            size="sm"
            className="flex items-center gap-2"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Post Comment
          </Button>
        </div>
      </div>

      {/* Comments List */}
      {comments.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <MessageCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p>No comments yet</p>
          <p className="text-sm mt-1">Be the first to start the discussion!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {topLevel.map((comment) => (
            <CommentThread
              key={comment.id}
              comment={comment}
              replies={replies.get(comment.id) || []}
              currentUserId={currentUserId}
              currentUserRole={currentUserRole}
              currentUserName={currentUserName}
              currentUserPhotoUrl={currentUserPhotoUrl}
              onReply={(commentId) => {
                setReplyingTo(commentId);
                setNewComment('');
              }}
              onEdit={(commentId, content) => {
                setEditingComment(commentId);
                setEditContent(content);
              }}
              onDelete={handleDeleteComment}
              onTimestampClick={onTimestampClick}
              editingComment={editingComment}
              editContent={editContent}
              setEditContent={setEditContent}
              onSaveEdit={handleEditComment}
              onCancelEdit={() => {
                setEditingComment(null);
                setEditContent('');
              }}
              getRoleBadgeColor={getRoleBadgeColor}
              submitting={submitting}
            />
          ))}
        </div>
      )}

      {/* Comment Stats */}
      <div className="pt-4 border-t text-sm text-gray-600">
        <div className="flex items-center justify-between">
          <span>{comments.length} {comments.length === 1 ? 'comment' : 'comments'}</span>
          <div className="flex items-center gap-4">
            <span>
              {comments.filter(c => c.authorRole === 'coach').length} from coaches
            </span>
            <span>
              {comments.filter(c => c.authorRole === 'athlete').length} from athlete
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}