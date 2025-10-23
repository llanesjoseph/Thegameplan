'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Loader2, Plus, Trash2, Clock, Save, Send, X, CheckCircle, ArrowLeft } from 'lucide-react';
import {
  Submission,
  Review,
  Rubric,
  RubricScore,
  Timecode,
  DrillRecommendation,
  TimecodeType,
} from '@/types/video-critique';
// Removed client-side review functions - now using server-side APIs
import VideoPlayer from '@/components/video-critique/VideoPlayer';
import RubricScoring from '@/components/video-critique/RubricScoring';
import TimecodeEditor from '@/components/video-critique/TimecodeEditor';
import DrillSelector from '@/components/video-critique/DrillSelector';
// Removed createNotification import - using server-side APIs for notifications

interface ReviewFormProps {
  submission: Submission;
  rubric: Rubric | null;
  existingReview: Review | null;
  coachId: string;
  coachName: string;
  coachPhotoUrl?: string;
  isEmbedded?: boolean;
}

export default function ReviewForm({
  submission,
  rubric,
  existingReview,
  coachId,
  coachName,
  coachPhotoUrl,
  isEmbedded = false,
}: ReviewFormProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Review state
  const [reviewId, setReviewId] = useState<string>(existingReview?.id || '');
  const [rubricScores, setRubricScores] = useState<RubricScore[]>(existingReview?.rubricScores || []);
  const [timecodes, setTimecodes] = useState<Timecode[]>(existingReview?.timecodes || []);
  const [drillRecommendations, setDrillRecommendations] = useState<DrillRecommendation[]>(
    existingReview?.drillRecommendations || []
  );
  const [overallFeedback, setOverallFeedback] = useState(existingReview?.overallFeedback || '');
  const [nextSteps, setNextSteps] = useState(existingReview?.nextSteps || '');
  const [strengths, setStrengths] = useState<string[]>(existingReview?.strengths || []);
  const [areasForImprovement, setAreasForImprovement] = useState<string[]>(
    existingReview?.areasForImprovement || []
  );

  // Video player state
  const [currentTime, setCurrentTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);

  // Create or load review on mount
  useEffect(() => {
    const initializeReview = async () => {
      if (!existingReview && user) {
        // Create new review using server-side API
        try {
          const token = await user.getIdToken();
          const response = await fetch('/api/reviews/create', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
              submissionId: submission.id,
              coachUid: coachId,
              coachName: coachName,
              coachPhotoUrl: coachPhotoUrl,
              teamId: submission.teamId || '',
              skillId: submission.skillId || '',
              overallFeedback: '',
              status: 'draft',
            }),
          });

          if (!response.ok) {
            throw new Error('Failed to create review');
          }

          const data = await response.json();
          setReviewId(data.reviewId);
        } catch (error) {
          console.error('Error creating review:', error);
          toast.error('Failed to initialize review');
        }
      }
    };

    initializeReview();
  }, [existingReview, submission, coachId, coachName, coachPhotoUrl, user]);

  // Auto-save functionality
  const performAutoSave = useCallback(async () => {
    if (!reviewId || !overallFeedback.trim() || !user) return;

    setAutoSaving(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/reviews/${reviewId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          overallFeedback,
          nextSteps,
          strengths: strengths.filter(s => s.trim()),
          areasForImprovement: areasForImprovement.filter(a => a.trim()),
          status: 'draft',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to auto-save');
      }

      console.log('Auto-saved review draft');
    } catch (error) {
      console.error('Error auto-saving:', error);
    } finally {
      setAutoSaving(false);
    }
  }, [
    reviewId,
    overallFeedback,
    nextSteps,
    strengths,
    areasForImprovement,
    user,
  ]);

  // Set up auto-save timer
  useEffect(() => {
    // Clear existing timer
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    // Set new timer for auto-save (30 seconds)
    autoSaveTimerRef.current = setTimeout(() => {
      performAutoSave();
    }, 30000);

    // Cleanup on unmount
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [performAutoSave]);

  // Timecode management
  const handleAddTimecode = useCallback(() => {
    const newTimecode: Timecode = {
      id: Date.now().toString(),
      timestamp: currentTime,
      type: 'correction' as TimecodeType,
      comment: '',
    };
    setTimecodes(prev => [...prev, newTimecode].sort((a, b) => a.timestamp - b.timestamp));
  }, [currentTime]);

  const handleUpdateTimecode = useCallback((id: string, updates: Partial<Timecode>) => {
    setTimecodes(prev =>
      prev.map(tc => (tc.id === id ? { ...tc, ...updates } : tc))
    );
  }, []);

  const handleDeleteTimecode = useCallback((id: string) => {
    setTimecodes(prev => prev.filter(tc => tc.id !== id));
  }, []);

  const handleSeekToTimecode = useCallback((timestamp: number) => {
    const videoElement = document.querySelector('video') as HTMLVideoElement;
    if (videoElement) {
      videoElement.currentTime = timestamp;
    }
  }, []);

  // Drill management
  const handleAddDrill = useCallback((drill: DrillRecommendation) => {
    setDrillRecommendations(prev => [...prev, drill]);
  }, []);

  const handleUpdateDrill = useCallback((index: number, updates: Partial<DrillRecommendation>) => {
    setDrillRecommendations(prev =>
      prev.map((drill, i) => (i === index ? { ...drill, ...updates } : drill))
    );
  }, []);

  const handleRemoveDrill = useCallback((index: number) => {
    setDrillRecommendations(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Strengths and areas management
  const handleAddStrength = useCallback(() => {
    setStrengths(prev => [...prev, '']);
  }, []);

  const handleUpdateStrength = useCallback((index: number, value: string) => {
    setStrengths(prev => prev.map((s, i) => (i === index ? value : s)));
  }, []);

  const handleRemoveStrength = useCallback((index: number) => {
    setStrengths(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleAddAreaForImprovement = useCallback(() => {
    setAreasForImprovement(prev => [...prev, '']);
  }, []);

  const handleUpdateAreaForImprovement = useCallback((index: number, value: string) => {
    setAreasForImprovement(prev => prev.map((a, i) => (i === index ? value : a)));
  }, []);

  const handleRemoveAreaForImprovement = useCallback((index: number) => {
    setAreasForImprovement(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Save and publish handlers
  const handleSaveDraft = async () => {
    if (!reviewId || !user) return;

    setLoading(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/reviews/${reviewId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          overallFeedback,
          nextSteps,
          strengths: strengths.filter(s => s.trim()),
          areasForImprovement: areasForImprovement.filter(a => a.trim()),
          status: 'draft',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save draft');
      }

      toast.success('Review draft saved');
    } catch (error) {
      console.error('Error saving draft:', error);
      toast.error('Failed to save draft');
    } finally {
      setLoading(false);
    }
  };

  const handlePublishReview = async () => {
    if (!reviewId || !user) return;

    // Validate required fields
    if (!overallFeedback.trim()) {
      toast.error('Overall feedback is required');
      return;
    }

    setLoading(true);
    try {
      const token = await user.getIdToken();

      // Save final version first
      const saveResponse = await fetch(`/api/reviews/${reviewId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          overallFeedback,
          nextSteps,
          strengths: strengths.filter(s => s.trim()),
          areasForImprovement: areasForImprovement.filter(a => a.trim()),
          status: 'draft',
        }),
      });

      if (!saveResponse.ok) {
        throw new Error('Failed to save review');
      }

      // Publish review
      console.log('[REVIEW-FORM] Publishing review:', reviewId);
      const publishResponse = await fetch(`/api/reviews/${reviewId}/publish`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!publishResponse.ok) {
        const errorData = await publishResponse.json().catch(() => ({}));
        console.error('[REVIEW-FORM] Publish failed:', publishResponse.status, errorData);
        throw new Error(`Failed to publish review: ${errorData.error || publishResponse.statusText}`);
      }

      const publishData = await publishResponse.json();
      console.log('[REVIEW-FORM] Publish successful:', publishData);

      // Send email notification to athlete via API
      try {
        await fetch('/api/notifications/review-published', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            submissionId: submission.id,
            athleteUid: submission.athleteUid,
            skillName: submission.skillName || 'Video Submission'
          }),
        });
      } catch (emailErr) {
        console.warn('Failed to send athlete notification:', emailErr);
      }

      // Notification is handled by the server-side API

      console.log('[REVIEW-FORM] Review published successfully');
      
      // Show success modal instead of just toast
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Error publishing review:', error);
      toast.error('Failed to publish review');
    } finally {
      setLoading(false);
    }
  };

  // Calculate average rubric score
  const averageScore = useMemo(() => {
    if (rubricScores.length === 0) return 0;
    const sum = rubricScores.reduce((acc, score) => acc + score.score, 0);
    return (sum / rubricScores.length).toFixed(1);
  }, [rubricScores]);

  return (
    <div className={`space-y-6 ${isEmbedded ? 'py-4' : ''}`}>
      {/* Video Player Section */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4">Video Review</h2>
        <VideoPlayer
          videoUrl={submission.videoDownloadUrl || ''}
          thumbnailUrl={submission.thumbnailUrl}
          onTimeUpdate={setCurrentTime}
          onDurationChange={setVideoDuration}
          timecodes={timecodes}
        />
      </div>


      {/* Overall Feedback Section */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4">Overall Feedback</h2>

        <div className={`space-y-4 ${isEmbedded ? 'grid grid-cols-1 lg:grid-cols-2 gap-6' : ''}`}>
          <div>
            <label className="block text-sm font-medium mb-2">
              Summary Feedback <span className="text-red-500">*</span>
            </label>
            <Textarea
              value={overallFeedback}
              onChange={(e) => setOverallFeedback(e.target.value)}
              placeholder="Provide overall feedback on the athlete's performance..."
              className="min-h-[120px]"
              maxLength={2000}
            />
            <p className="text-xs text-gray-500 mt-1">
              {overallFeedback.length}/2000 characters
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Next Steps <span className="text-red-500">*</span>
            </label>
            <Textarea
              value={nextSteps}
              onChange={(e) => setNextSteps(e.target.value)}
              placeholder="What should the athlete focus on next?"
              className="min-h-[100px]"
              maxLength={1000}
            />
            <p className="text-xs text-gray-500 mt-1">
              {nextSteps.length}/1000 characters
            </p>
          </div>

          {/* Strengths */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Strengths (optional)
            </label>
            {strengths.map((strength, index) => (
              <div key={index} className="flex items-center gap-2 mb-2">
                <input
                  type="text"
                  value={strength}
                  onChange={(e) => handleUpdateStrength(index, e.target.value)}
                  placeholder="Enter a strength..."
                  className="flex-1 px-3 py-2 border rounded-md"
                />
                <Button
                  onClick={() => handleRemoveStrength(index)}
                  size="sm"
                  variant="ghost"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              onClick={handleAddStrength}
              variant="outline"
              size="sm"
              className="mt-2"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Strength
            </Button>
          </div>

          {/* Areas for Improvement */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Areas for Improvement (optional)
            </label>
            {areasForImprovement.map((area, index) => (
              <div key={index} className="flex items-center gap-2 mb-2">
                <input
                  type="text"
                  value={area}
                  onChange={(e) => handleUpdateAreaForImprovement(index, e.target.value)}
                  placeholder="Enter an area for improvement..."
                  className="flex-1 px-3 py-2 border rounded-md"
                />
                <Button
                  onClick={() => handleRemoveAreaForImprovement(index)}
                  size="sm"
                  variant="ghost"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              onClick={handleAddAreaForImprovement}
              variant="outline"
              size="sm"
              className="mt-2"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Area for Improvement
            </Button>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className={`flex items-center justify-between bg-white rounded-lg shadow-sm p-6 ${isEmbedded ? 'flex-col sm:flex-row gap-4' : ''}`}>
        <div className="flex items-center gap-2">
          {autoSaving && (
            <span className="text-sm text-gray-500 flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Auto-saving...
            </span>
          )}
        </div>
        <div className={`flex items-center gap-3 ${isEmbedded ? 'w-full sm:w-auto justify-end' : ''}`}>
          <Button
            onClick={() => router.push('/dashboard/coach/queue')}
            variant="outline"
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveDraft}
            variant="outline"
            disabled={loading || autoSaving}
            className="flex items-center gap-2"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save Draft
          </Button>
          <Button
            onClick={handlePublishReview}
            disabled={loading}
            className="flex items-center gap-2"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Publish Review
          </Button>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Review Published Successfully!
              </h3>
              <p className="text-gray-600 mb-6">
                Your review has been published and the athlete has been notified. 
                They can now view your feedback and recommendations.
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => {
                    setShowSuccessModal(false);
                    if (isEmbedded) {
                      // If embedded, send message to parent to refresh or navigate
                      if (window.parent !== window) {
                        window.parent.postMessage({ type: 'REVIEW_PUBLISHED' }, '*');
                      }
                    } else {
                      // If not embedded, navigate normally
                      router.push('/dashboard/coach/queue');
                    }
                  }}
                  className="px-6 py-3 bg-gradient-to-r from-teal-600 to-blue-600 text-white rounded-lg hover:from-teal-700 hover:to-blue-700 transition-all duration-200 font-medium shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                >
                  Back to Queue
                </button>
                <button
                  onClick={() => {
                    setShowSuccessModal(false);
                    // Close the review form
                    if (isEmbedded) {
                      if (window.parent !== window) {
                        window.parent.postMessage({ type: 'CLOSE_REVIEW' }, '*');
                      }
                    } else {
                      router.push('/dashboard/coach/queue');
                    }
                  }}
                  className="px-6 py-3 bg-white border-2 border-teal-600 text-teal-600 rounded-lg hover:bg-teal-50 transition-all duration-200 font-medium shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                >
                  Close Review
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}