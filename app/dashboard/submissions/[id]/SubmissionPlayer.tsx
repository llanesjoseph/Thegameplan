'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import {
  Submission,
  Review,
  Comment,
} from '@/types/video-critique';
import {
  getReviewsForSubmission,
  listenToComments,
  addComment,
} from '@/lib/data/video-critique';
import { useSubmission } from '@/lib/hooks/use-submission';
import toast from 'react-hot-toast';

interface SubmissionPlayerProps {
  submission: Submission;
  currentUser: {
    uid: string;
    email?: string;
    displayName: string;
    photoURL?: string | null;
    role: string;
  };
}

export default function SubmissionPlayer({
  submission: initialSubmission,
  currentUser,
}: SubmissionPlayerProps) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [review, setReview] = useState<Review | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // Use real-time submission data
  const { submission, isListening } = useSubmission(initialSubmission.id);

  const displaySubmission = submission || initialSubmission;

  // Fetch review if exists
  useEffect(() => {
    if (displaySubmission.reviewId) {
      getReviewsForSubmission(displaySubmission.id).then((reviews) => {
        if (reviews.length > 0) {
          setReview(reviews[0]);
        }
      });
    }
  }, [displaySubmission.id, displaySubmission.reviewId]);

  // Listen to comments
  useEffect(() => {
    const unsubscribe = listenToComments(displaySubmission.id, setComments);
    return () => unsubscribe();
  }, [displaySubmission.id]);

  // Handle video playback
  const togglePlayback = useCallback(() => {
    if (!videoRef.current) return;

    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  // Handle time update
  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  }, []);

  // Submit comment
  const handleSubmitComment = useCallback(async () => {
    if (!newComment.trim()) return;

    setIsSubmittingComment(true);
    try {
      await addComment(displaySubmission.id, {
        authorUid: currentUser.uid,
        authorName: currentUser.displayName,
        authorPhotoUrl: currentUser.photoURL || undefined,
        authorRole: currentUser.role === 'coach' ? 'coach' : 'athlete',
        content: newComment.trim(),
        timestamp: currentTime,
      });
      setNewComment('');
      toast.success('Comment added');
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    } finally {
      setIsSubmittingComment(false);
    }
  }, [newComment, currentTime, displaySubmission.id, currentUser]);

  // Format date
  const formatDate = (date: Date | any) => {
    if (!date) return 'N/A';
    const d = date instanceof Date ? date : date.toDate();
    return formatDistanceToNow(d, { addSuffix: true });
  };

  // Check if user is the coach who claimed this submission
  const isMyReview = displaySubmission.claimedBy === currentUser.uid;
  const isAthlete = displaySubmission.athleteUid === currentUser.uid;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {displaySubmission.skillName}
            </h1>
            <div className="flex items-center space-x-4 mt-2">
              <div className="flex items-center text-sm text-gray-600">
                {displaySubmission.athletePhotoUrl ? (
                  <img
                    src={displaySubmission.athletePhotoUrl}
                    alt={displaySubmission.athleteName}
                    className="w-6 h-6 rounded-full mr-2"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-gray-300 mr-2" />
                )}
                {displaySubmission.athleteName}
              </div>
              <span className="text-sm text-gray-500">
                Submitted {formatDate(displaySubmission.createdAt)}
              </span>
              {isListening && (
                <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                  Live
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Status Badge */}
            <span
              className={`px-3 py-1 text-sm font-medium rounded-full ${
                displaySubmission.status === 'awaiting_coach'
                  ? 'bg-blue-100 text-blue-800'
                  : displaySubmission.status === 'claimed'
                  ? 'bg-indigo-100 text-indigo-800'
                  : displaySubmission.status === 'in_review'
                  ? 'bg-yellow-100 text-yellow-800'
                  : displaySubmission.status === 'complete'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {displaySubmission.status.replace(/_/g, ' ').toUpperCase()}
            </span>

            {/* Actions */}
            {currentUser.role === 'coach' && isMyReview && displaySubmission.status === 'claimed' && (
              <button
                onClick={() => router.push(`/dashboard/coach/review/${displaySubmission.id}`)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Start Review
              </button>
            )}
          </div>
        </div>

        {/* Athlete Context */}
        <div className="border-t pt-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Context</h3>
          <p className="text-gray-700">{displaySubmission.athleteContext}</p>

          {displaySubmission.athleteGoals && (
            <div className="mt-3">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Goals</h3>
              <p className="text-gray-700">{displaySubmission.athleteGoals}</p>
            </div>
          )}

          {displaySubmission.specificQuestions && (
            <div className="mt-3">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">
                Specific Questions
              </h3>
              <p className="text-gray-700">{displaySubmission.specificQuestions}</p>
            </div>
          )}
        </div>
      </div>

      {/* Video Player */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Video</h2>
        <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
          {displaySubmission.videoDownloadUrl ? (
            <>
              <video
                ref={videoRef}
                src={displaySubmission.videoDownloadUrl}
                className="w-full h-full"
                controls
                onTimeUpdate={handleTimeUpdate}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
              >
                Your browser does not support the video tag.
              </video>
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <svg
                  className="w-16 h-16 text-gray-400 mx-auto mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
                <p className="text-gray-500">
                  {displaySubmission.status === 'uploading'
                    ? 'Video is uploading...'
                    : 'Video not available'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Video Info */}
        {displaySubmission.videoDuration && (
          <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
            <span>Duration: {Math.round(displaySubmission.videoDuration)}s</span>
            <span>
              Current: {Math.round(currentTime)}s / {Math.round(displaySubmission.videoDuration)}s
            </span>
          </div>
        )}
      </div>

      {/* Review Section (if published) */}
      {review && displaySubmission.status === 'complete' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Coach Review</h2>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              {review.coachPhotoUrl ? (
                <img
                  src={review.coachPhotoUrl}
                  alt={review.coachName}
                  className="w-10 h-10 rounded-full"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-300" />
              )}
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <span className="font-medium">{review.coachName}</span>
                  <span className="text-sm text-gray-500">
                    {formatDate(review.publishedAt)}
                  </span>
                </div>
                <div className="mt-2 space-y-3">
                  <div>
                    <h4 className="font-medium text-gray-900">Overall Feedback</h4>
                    <p className="mt-1 text-gray-700">{review.overallFeedback}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Next Steps</h4>
                    <p className="mt-1 text-gray-700">{review.nextSteps}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Comments Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">
          Discussion ({comments.length})
        </h2>

        {/* Comment List */}
        <div className="space-y-4 mb-6">
          {comments.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No comments yet</p>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="flex items-start space-x-3">
                {comment.authorPhotoUrl ? (
                  <img
                    src={comment.authorPhotoUrl}
                    alt={comment.authorName}
                    className="w-8 h-8 rounded-full"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gray-300" />
                )}
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-sm">{comment.authorName}</span>
                    <span className="text-xs text-gray-500">
                      {comment.authorRole === 'coach' && (
                        <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-700 rounded">
                          Coach
                        </span>
                      )}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatDate(comment.createdAt)}
                    </span>
                    {comment.timestamp && (
                      <button
                        onClick={() => {
                          if (videoRef.current) {
                            videoRef.current.currentTime = comment.timestamp || 0;
                          }
                        }}
                        className="text-xs text-indigo-600 hover:text-indigo-700"
                      >
                        @{Math.round(comment.timestamp)}s
                      </button>
                    )}
                  </div>
                  <p className="mt-1 text-gray-700 text-sm">{comment.content}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Add Comment */}
        <div className="border-t pt-4">
          <div className="flex items-start space-x-3">
            {currentUser.photoURL ? (
              <img
                src={currentUser.photoURL}
                alt={currentUser.displayName}
                className="w-8 h-8 rounded-full"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gray-300" />
            )}
            <div className="flex-1">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                rows={3}
              />
              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  Commenting at {Math.round(currentTime)}s
                </span>
                <button
                  onClick={handleSubmitComment}
                  disabled={!newComment.trim() || isSubmittingComment}
                  className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmittingComment ? 'Posting...' : 'Post Comment'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}