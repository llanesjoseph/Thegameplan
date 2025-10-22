'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Loader2, Plus, Trash2, Clock, Save, Send, X } from 'lucide-react';
import {
  Submission,
  Review,
  Rubric,
  RubricScore,
  Timecode,
  DrillRecommendation,
  TimecodeType,
} from '@/types/video-critique';
import { createReview, updateReview, saveDraftReview, publishReview } from '@/lib/data/reviews';
import VideoPlayer from '@/components/video-critique/VideoPlayer';
import RubricScoring from '@/components/video-critique/RubricScoring';
import TimecodeEditor from '@/components/video-critique/TimecodeEditor';
import DrillSelector from '@/components/video-critique/DrillSelector';
import { createNotification } from '@/lib/data/notifications';

interface ReviewFormProps {
  submission: Submission;
  rubric: Rubric | null;
  existingReview: Review | null;
  coachId: string;
  coachName: string;
  coachPhotoUrl?: string;
}

export default function ReviewForm({
  submission,
  rubric,
  existingReview,
  coachId,
  coachName,
  coachPhotoUrl,
}: ReviewFormProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);
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
      if (!existingReview) {
        // Create new review
        try {
          const newReviewId = await createReview({
            submissionId: submission.id,
            coachUid: coachId,
            coachName: coachName,
            coachPhotoUrl: coachPhotoUrl,
            teamId: submission.teamId || '',
            skillId: submission.skillId || '',
            overallFeedback: '',
            status: 'draft',
          });
          setReviewId(newReviewId);
        } catch (error) {
          console.error('Error creating review:', error);
          toast.error('Failed to initialize review');
        }
      }
    };

    initializeReview();
  }, [existingReview, submission, coachId, coachName, coachPhotoUrl]);

  // Auto-save functionality
  const performAutoSave = useCallback(async () => {
    if (!reviewId || !overallFeedback.trim()) return;

    setAutoSaving(true);
    try {
      await saveDraftReview(
        reviewId,
        overallFeedback,
        undefined, // rubricScores
        undefined, // timecodes
        undefined, // drillRecommendations
        nextSteps,
        strengths,
        areasForImprovement
      );
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
      const publishResponse = await fetch(`/api/reviews/${reviewId}/publish`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!publishResponse.ok) {
        throw new Error('Failed to publish review');
      }

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

      // Create notification for athlete
      await createNotification(
        submission.athleteUid,
        'review_published',
        'Review Published',
        `Your ${submission.skillName} video has been reviewed by ${coachName}`,
        `/dashboard/athlete/reviews/${submission.id}`,
        {
          submissionId: submission.id,
          reviewId: reviewId,
        }
      );

      toast.success('Review published successfully');
      router.push('/dashboard/coach/queue');
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
    <div className="space-y-6">
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

        <div className="space-y-4">
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
      <div className="flex items-center justify-between bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center gap-2">
          {autoSaving && (
            <span className="text-sm text-gray-500 flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Auto-saving...
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
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
    </div>
  );
}