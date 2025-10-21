'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { ArrowLeft, Clock, CheckCircle, Video, MessageCircle } from 'lucide-react';
import Link from 'next/link';

export default function AthleteReviewDetailPage({
  params,
}: {
  params: { submissionId: string };
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [submission, setSubmission] = useState<any>(null);
  const [review, setReview] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  useEffect(() => {
    if (!user && !loading) {
      router.push('/login');
      return;
    }

    if (!user) return;

    const fetchData = async () => {
      try {
        const { getSubmission, getReviewBySubmission, getCommentsByReview } = await import('@/lib/data/video-critique');

        const submissionData = await getSubmission(params.submissionId);
        if (!submissionData || submissionData.athleteId !== user.uid) {
          throw new Error('Unauthorized');
        }

        setSubmission(submissionData);

        if (submissionData.status === 'complete') {
          const reviewData = await getReviewBySubmission(params.submissionId);
          setReview(reviewData);

          if (reviewData) {
            const commentsData = await getCommentsByReview(reviewData.id);
            setComments(commentsData);
          }
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user, loading, router, params.submissionId]);

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !review || !user) return;

    setIsSubmittingComment(true);
    try {
      const { addComment, getCommentsByReview } = await import('@/lib/data/video-critique');
      await addComment({
        reviewId: review.id,
        content: newComment.trim(),
        authorRole: 'athlete',
      });

      setNewComment('');
      const updatedComments = await getCommentsByReview(review.id);
      setComments(updatedComments);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mb-4"></div>
          <p className="text-gray-600">Loading review...</p>
        </div>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-red-900 mb-2">Review Not Found</h2>
            <p className="text-red-800">This review could not be found or you do not have permission to view it.</p>
            <Link href="/dashboard/athlete/reviews" className="inline-flex items-center mt-4 text-red-600 hover:text-red-700">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Reviews
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <Link href="/dashboard/athlete/reviews" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Reviews
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Video Review</h1>
          <div className="mt-2 flex items-center gap-4 text-sm text-gray-600">
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              Submitted {formatDate(submission.submittedAt)}
            </span>
            {submission.reviewedAt && (
              <span className="flex items-center gap-1 text-green-600">
                <CheckCircle className="w-4 h-4" />
                Reviewed {formatDate(submission.reviewedAt)}
              </span>
            )}
          </div>
        </div>

        {submission.status !== 'complete' && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-1">
              {submission.status === 'awaiting_coach' && 'Waiting for Coach Review'}
              {submission.status === 'claimed' && 'Coach is Reviewing'}
              {submission.status === 'in_review' && 'Review in Progress'}
            </h3>
            <p className="text-blue-800 text-sm">Your coach will review this video soon. You will be notified when the review is complete.</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            {submission.videoDownloadUrl && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="aspect-video bg-black">
                  <video controls className="w-full h-full" src={submission.videoDownloadUrl} poster={submission.thumbnailUrl}>
                    Your browser does not support the video tag.
                  </video>
                </div>
              </div>
            )}

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold mb-4">Your Submission</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Context</h3>
                  <p className="text-gray-700">{submission.athleteContext}</p>
                </div>
                {submission.athleteGoals && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Goals</h3>
                    <p className="text-gray-700">{submission.athleteGoals}</p>
                  </div>
                )}
                {submission.specificQuestions && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Specific Questions</h3>
                    <p className="text-gray-700">{submission.specificQuestions}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {review ? (
              <>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h2 className="text-xl font-semibold mb-4">Coach Feedback</h2>
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Overall Feedback</h3>
                      <p className="text-gray-700 whitespace-pre-wrap">{review.overallFeedback}</p>
                    </div>
                    {review.strengths && review.strengths.length > 0 && (
                      <div>
                        <h3 className="font-semibold text-green-800 mb-2">Strengths</h3>
                        <ul className="list-disc list-inside space-y-1">
                          {review.strengths.map((strength: string, idx: number) => (
                            <li key={idx} className="text-gray-700">{strength}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {review.areasForImprovement && review.areasForImprovement.length > 0 && (
                      <div>
                        <h3 className="font-semibold text-orange-800 mb-2">Areas for Improvement</h3>
                        <ul className="list-disc list-inside space-y-1">
                          {review.areasForImprovement.map((area: string, idx: number) => (
                            <li key={idx} className="text-gray-700">{area}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <MessageCircle className="w-5 h-5" />
                    Discussion
                  </h2>
                  <div className="space-y-4 mb-6">
                    {comments.length === 0 ? (
                      <p className="text-gray-500 text-sm">No comments yet. Start the conversation!</p>
                    ) : (
                      comments.map((comment: any) => (
                        <div key={comment.id} className={`p-4 rounded-lg ${comment.authorRole === 'coach' ? 'bg-blue-50 border border-blue-100' : 'bg-gray-50 border border-gray-100'}`}>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-semibold text-sm">{comment.authorName}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${comment.authorRole === 'coach' ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-700'}`}>
                              {comment.authorRole === 'coach' ? 'Coach' : 'You'}
                            </span>
                            <span className="text-xs text-gray-500">{formatDate(comment.createdAt)}</span>
                          </div>
                          <p className="text-gray-700 text-sm">{comment.content}</p>
                        </div>
                      ))
                    )}
                  </div>
                  <form onSubmit={handleCommentSubmit} className="space-y-3">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Ask a follow-up question or add a comment..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      rows={3}
                      disabled={isSubmittingComment}
                    />
                    <button type="submit" disabled={!newComment.trim() || isSubmittingComment} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                      {isSubmittingComment ? 'Posting...' : 'Post Comment'}
                    </button>
                  </form>
                </div>
              </>
            ) : (
              <div className="bg-gray-50 rounded-lg border border-gray-200 p-12 text-center">
                <Video className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Review Pending</h3>
                <p className="text-gray-600">Your coach has not completed the review yet. Check back soon!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
