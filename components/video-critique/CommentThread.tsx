'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Clock,
  Edit2,
  Trash2,
  Reply,
  MoreVertical,
  ChevronDown,
  ChevronUp,
  PlayCircle,
  Loader2,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Comment, CommentAuthorRole } from '@/types/video-critique';
import { formatTimecode } from '@/lib/data/reviews';
import { formatDistanceToNow } from 'date-fns';

interface CommentThreadProps {
  comment: Comment;
  replies: Comment[];
  currentUserId: string;
  currentUserRole: CommentAuthorRole;
  currentUserName: string;
  currentUserPhotoUrl?: string;
  onReply: (commentId: string) => void;
  onEdit: (commentId: string, content: string) => void;
  onDelete: (commentId: string) => void;
  onTimestampClick?: (timestamp: number) => void;
  editingComment: string | null;
  editContent: string;
  setEditContent: (content: string) => void;
  onSaveEdit: (commentId: string) => void;
  onCancelEdit: () => void;
  getRoleBadgeColor: (role: CommentAuthorRole) => string;
  submitting: boolean;
  depth?: number;
}

export default function CommentThread({
  comment,
  replies,
  currentUserId,
  currentUserRole,
  currentUserName,
  currentUserPhotoUrl,
  onReply,
  onEdit,
  onDelete,
  onTimestampClick,
  editingComment,
  editContent,
  setEditContent,
  onSaveEdit,
  onCancelEdit,
  getRoleBadgeColor,
  submitting,
  depth = 0,
}: CommentThreadProps) {
  const [showReplies, setShowReplies] = useState(true);
  const isAuthor = comment.authorUid === currentUserId;
  const isEditing = editingComment === comment.id;

  // Format the comment date
  const getCommentDate = () => {
    if (!comment.createdAt) return '';

    const date = comment.createdAt instanceof Date
      ? comment.createdAt
      : (comment.createdAt as any).toDate?.() || new Date(comment.createdAt as any);

    return formatDistanceToNow(date, { addSuffix: true });
  };

  // Get author initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className={`${depth > 0 ? 'ml-12' : ''}`}>
      <div className="flex gap-3">
        {/* Avatar */}
        <Avatar className="h-10 w-10 flex-shrink-0">
          <AvatarImage src={comment.authorPhotoUrl} alt={comment.authorName} />
          <AvatarFallback>{getInitials(comment.authorName)}</AvatarFallback>
        </Avatar>

        {/* Comment Content */}
        <div className="flex-1">
          {/* Header */}
          <div className="flex items-start justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className="font-medium">{comment.authorName}</span>
              <span
                className={`px-2 py-0.5 text-xs rounded-full ${getRoleBadgeColor(
                  comment.authorRole
                )}`}
              >
                {comment.authorRole}
              </span>
              <span className="text-sm text-gray-500">
                {getCommentDate()}
              </span>
              {comment.edited && (
                <span className="text-xs text-gray-400">(edited)</span>
              )}
            </div>

            {/* Actions Menu */}
            {isAuthor && !isEditing && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => onEdit(comment.id, comment.content)}
                  >
                    <Edit2 className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onDelete(comment.id)}
                    className="text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Video Timestamp */}
          {comment.timestamp !== undefined && comment.timestamp !== null && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onTimestampClick?.(comment.timestamp!)}
              className="mb-2 text-xs flex items-center gap-1"
            >
              <PlayCircle className="h-3 w-3" />
              <Clock className="h-3 w-3" />
              {formatTimecode(comment.timestamp)}
            </Button>
          )}

          {/* Comment Body */}
          {isEditing ? (
            <div className="space-y-2">
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="min-h-[60px]"
                disabled={submitting}
              />
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => onSaveEdit(comment.id)}
                  disabled={submitting || !editContent.trim()}
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Save'
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onCancelEdit}
                  disabled={submitting}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-gray-700 whitespace-pre-wrap">{comment.content}</p>
          )}

          {/* Actions */}
          {!isEditing && (
            <div className="flex items-center gap-3 mt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onReply(comment.id)}
                className="text-gray-600 hover:text-gray-900 h-auto py-1 px-2"
              >
                <Reply className="h-3 w-3 mr-1" />
                Reply
              </Button>

              {replies.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowReplies(!showReplies)}
                  className="text-gray-600 hover:text-gray-900 h-auto py-1 px-2"
                >
                  {showReplies ? (
                    <>
                      <ChevronUp className="h-3 w-3 mr-1" />
                      Hide {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-3 w-3 mr-1" />
                      Show {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
                    </>
                  )}
                </Button>
              )}
            </div>
          )}

          {/* Replies */}
          {showReplies && replies.length > 0 && (
            <div className="mt-4 space-y-4">
              {replies.map((reply) => (
                <CommentThread
                  key={reply.id}
                  comment={reply}
                  replies={[]} // Replies don't have nested replies in this implementation
                  currentUserId={currentUserId}
                  currentUserRole={currentUserRole}
                  currentUserName={currentUserName}
                  currentUserPhotoUrl={currentUserPhotoUrl}
                  onReply={onReply}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onTimestampClick={onTimestampClick}
                  editingComment={editingComment}
                  editContent={editContent}
                  setEditContent={setEditContent}
                  onSaveEdit={onSaveEdit}
                  onCancelEdit={onCancelEdit}
                  getRoleBadgeColor={getRoleBadgeColor}
                  submitting={submitting}
                  depth={depth + 1}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}