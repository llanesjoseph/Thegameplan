'use client';

import { useState, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  Star,
  MessageCircle,
  Clock,
  ThumbsUp,
  AlertCircle,
  HelpCircle,
  Dumbbell,
  Target,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Send,
  Calendar
} from 'lucide-react';
import {
  Submission,
  Review,
  Rubric,
  RubricScore,
} from '@/types/video-critique';
import { submitAthleteFeedback } from '@/lib/data/reviews';
import { createNotification } from '@/lib/data/notifications';
import VideoPlayer from '@/components/video-critique/VideoPlayer';
import RubricScoring from '@/components/video-critique/RubricScoring';
import TimecodeEditor from '@/components/video-critique/TimecodeEditor';
import CommentsSection from '@/components/video-critique/CommentsSection';
import { formatTimecode, calculateAverageRubricScore } from '@/lib/data/reviews';

interface ReviewDetailProps {
  submission: Submission;
  review: Review;
  rubric: Rubric | null;
  athleteId: string;
}

export default function ReviewDetail({
  submission,
  review,
  rubric,
  athleteId,
}: ReviewDetailProps) {
  const [satisfactionRating, setSatisfactionRating] = useState(review.athleteSatisfactionScore || 0);
  const [feedbackText, setFeedbackText] = useState(review.athleteFeedback || '');
  const [hasRated, setHasRated] = useState(!!review.athleteSatisfactionScore);
  const [submittingRating, setSubmittingRating] = useState(false);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [requestingFollowup, setRequestingFollowup] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    timecodes: true,
    rubric: true,
    drills: true,
    feedback: true,
  });

  // Calculate average rubric score
  const averageScore = useMemo(() => {
    return calculateAverageRubricScore(review.rubricScores);
  }, [review.rubricScores]);

  // Check if follow-up can be requested (within 7 days)
  const canRequestFollowup = useMemo(() => {
    if (!review.publishedAt || submission.followupRequested) return false;

    const publishedDate = review.publishedAt instanceof Date
      ? review.publishedAt
      : (review.publishedAt as any).toDate();

    const daysSincePublished = Math.floor(
      (Date.now() - publishedDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    return daysSincePublished <= 7;
  }, [review.publishedAt, submission.followupRequested]);

  // Handle satisfaction rating submission
  const handleSubmitRating = async () => {
    if (satisfactionRating === 0) {
      toast.error('Please select a satisfaction rating');
      return;
    }

    setSubmittingRating(true);
    try {
      await submitAthleteFeedback(review.id, satisfactionRating, feedbackText);
      setHasRated(true);
      toast.success('Thank you for your feedback!');
    } catch (error) {
      console.error('Error submitting rating:', error);
      toast.error('Failed to submit feedback');
    } finally {
      setSubmittingRating(false);
    }
  };

  // Handle follow-up request
  const handleRequestFollowup = async () => {
    setRequestingFollowup(true);
    try {
      // Update submission with follow-up request
      const response = await fetch(`/api/submissions/${submission.id}/request-followup`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Failed to request follow-up');

      // Create notification for coach
      await createNotification(
        review.coachUid,
        'followup_requested',
        'Follow-up Requested',
        `${submission.athleteName} has requested a follow-up on their ${submission.skillName} review`,
        `/dashboard/coach/review/${submission.id}`,
        {
          submissionId: submission.id,
          reviewId: review.id,
        }
      );

      toast.success('Follow-up request sent to your coach');
    } catch (error) {
      console.error('Error requesting follow-up:', error);
      toast.error('Failed to request follow-up');
    } finally {
      setRequestingFollowup(false);
    }
  };

  // Toggle section expansion
  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  return (
    <div className="space-y-6">
      {/* Video Player with Timecodes */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4">Your Video</h2>
        <VideoPlayer
          videoUrl={submission.videoDownloadUrl || ''}
          thumbnailUrl={submission.thumbnailUrl}
          timecodes={review.timecodes}
        />
      </div>

      {/* Overall Feedback Summary */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Overall Feedback</h2>
          <button
            onClick={() => toggleSection('feedback')}
            className="text-gray-500 hover:text-gray-700"
          >
            {expandedSections.feedback ? <ChevronUp /> : <ChevronDown />}
          </button>
        </div>

        {expandedSections.feedback && (
          <div className="space-y-4">
            {/* Overall Score */}
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-lg font-medium">Overall Performance Score</span>
                <div className="text-3xl font-bold text-blue-600">
                  {averageScore.toFixed(1)}/5.0
                </div>
              </div>
            </div>

            {/* Summary Feedback */}
            <div>
              <h3 className="font-medium mb-2">Summary</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{review.overallFeedback}</p>
            </div>

            {/* Next Steps */}
            <div>
              <h3 className="font-medium mb-2 flex items-center gap-2">
                <Target className="h-4 w-4" />
                Next Steps
              </h3>
              <p className="text-gray-700 whitespace-pre-wrap">{review.nextSteps}</p>
            </div>

            {/* Strengths and Areas for Improvement */}
            {((review.strengths?.length ?? 0) > 0 || (review.areasForImprovement?.length ?? 0) > 0) && (
              <div className="grid md:grid-cols-2 gap-4">
                {(review.strengths?.length ?? 0) > 0 && (
                  <div className="bg-green-50 rounded-lg p-4">
                    <h3 className="font-medium mb-2 flex items-center gap-2 text-green-800">
                      <ThumbsUp className="h-4 w-4" />
                      Strengths
                    </h3>
                    <ul className="list-disc list-inside space-y-1">
                      {review.strengths?.map((strength, index) => (
                        <li key={index} className="text-green-700">{strength}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {(review.areasForImprovement?.length ?? 0) > 0 && (
                  <div className="bg-orange-50 rounded-lg p-4">
                    <h3 className="font-medium mb-2 flex items-center gap-2 text-orange-800">
                      <TrendingUp className="h-4 w-4" />
                      Areas for Improvement
                    </h3>
                    <ul className="list-disc list-inside space-y-1">
                      {review.areasForImprovement?.map((area, index) => (
                        <li key={index} className="text-orange-700">{area}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Timecoded Feedback */}
      {review.timecodes.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">
              Timecoded Feedback ({review.timecodes.length})
            </h2>
            <button
              onClick={() => toggleSection('timecodes')}
              className="text-gray-500 hover:text-gray-700"
            >
              {expandedSections.timecodes ? <ChevronUp /> : <ChevronDown />}
            </button>
          </div>

          {expandedSections.timecodes && (
            <TimecodeEditor
              timecodes={review.timecodes}
              onUpdate={() => {}} // Read-only
              onDelete={() => {}} // Read-only
              onSeek={(timestamp) => {
                const videoElement = document.querySelector('video') as HTMLVideoElement;
                if (videoElement) {
                  videoElement.currentTime = timestamp;
                }
              }}
              readOnly={true}
            />
          )}
        </div>
      )}

      {/* Rubric Scores */}
      {rubric && review.rubricScores.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Skill Assessment</h2>
            <button
              onClick={() => toggleSection('rubric')}
              className="text-gray-500 hover:text-gray-700"
            >
              {expandedSections.rubric ? <ChevronUp /> : <ChevronDown />}
            </button>
          </div>

          {expandedSections.rubric && (
            <RubricScoring
              rubric={rubric}
              scores={review.rubricScores}
              onChange={() => {}} // Read-only
              readOnly={true}
            />
          )}
        </div>
      )}

      {/* Drill Recommendations */}
      {review.drillRecommendations.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Dumbbell className="h-5 w-5" />
              Recommended Drills ({review.drillRecommendations.length})
            </h2>
            <button
              onClick={() => toggleSection('drills')}
              className="text-gray-500 hover:text-gray-700"
            >
              {expandedSections.drills ? <ChevronUp /> : <ChevronDown />}
            </button>
          </div>

          {expandedSections.drills && (
            <div className="space-y-3">
              {review.drillRecommendations.map((drill, index) => (
                <div
                  key={index}
                  className={`border rounded-lg p-4 ${
                    drill.priority === 'high'
                      ? 'border-red-200 bg-red-50'
                      : drill.priority === 'medium'
                      ? 'border-yellow-200 bg-yellow-50'
                      : 'border-green-200 bg-green-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium">{drill.drillName}</h4>
                      <div className="flex items-center gap-3 mt-2 text-sm">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          drill.priority === 'high'
                            ? 'bg-red-100 text-red-700'
                            : drill.priority === 'medium'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-green-100 text-green-700'
                        }`}>
                          {drill.priority} priority
                        </span>
                        {drill.reps && drill.sets && (
                          <span className="text-gray-600">
                            {drill.reps} reps × {drill.sets} sets
                          </span>
                        )}
                      </div>
                      {drill.notes && (
                        <p className="mt-2 text-sm text-gray-700">{drill.notes}</p>
                      )}
                    </div>
                    {drill.videoUrl && (
                      <a
                        href={drill.videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-sm"
                      >
                        View video →
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Satisfaction Rating */}
      {!hasRated && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">Rate This Review</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                How helpful was this review?
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    onClick={() => setSatisfactionRating(rating)}
                    onMouseEnter={() => setHoveredRating(rating)}
                    onMouseLeave={() => setHoveredRating(0)}
                    className="p-1"
                  >
                    <Star
                      className={`h-8 w-8 transition-colors ${
                        rating <= (hoveredRating || satisfactionRating)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
                <span className="ml-2 text-sm text-gray-600">
                  {satisfactionRating > 0 && `${satisfactionRating}/5`}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Additional feedback for your coach (optional)
              </label>
              <Textarea
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="Let your coach know what was most helpful or what could be improved..."
                className="min-h-[100px]"
              />
            </div>

            <Button
              onClick={handleSubmitRating}
              disabled={submittingRating || satisfactionRating === 0}
            >
              {submittingRating ? 'Submitting...' : 'Submit Feedback'}
            </Button>
          </div>
        </div>
      )}

      {/* Follow-up Request */}
      {canRequestFollowup && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-blue-900">Need clarification?</h3>
              <p className="text-sm text-blue-700 mt-1">
                You can request a follow-up from your coach within 7 days of receiving this review.
              </p>
            </div>
            <Button
              onClick={handleRequestFollowup}
              disabled={requestingFollowup}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Send className="h-4 w-4" />
              {requestingFollowup ? 'Requesting...' : 'Request Follow-up'}
            </Button>
          </div>
        </div>
      )}

      {/* Comments Section */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center justify-between w-full mb-4"
        >
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Discussion
          </h2>
          {showComments ? <ChevronUp /> : <ChevronDown />}
        </button>

        {showComments && (
          <CommentsSection
            submissionId={submission.id}
            currentUserId={athleteId}
            currentUserRole="athlete"
            currentUserName={submission.athleteName}
            currentUserPhotoUrl={submission.athletePhotoUrl}
          />
        )}
      </div>
    </div>
  );
}