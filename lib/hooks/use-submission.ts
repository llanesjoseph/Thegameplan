import { useEffect, useState, useCallback } from 'react';
import useSWR, { mutate } from 'swr';
import {
  getSubmission,
  listenToSubmission,
  updateSubmission as updateSubmissionData,
  claimSubmission as claimSubmissionData
} from '@/lib/data/video-critique';
import { Submission } from '@/types/video-critique';
import { useAuth } from '@/hooks/use-auth';

/**
 * Hook to fetch and manage a single submission
 */
export function useSubmission(submissionId: string | null | undefined) {
  const { user } = useAuth();
  const [realtimeSubmission, setRealtimeSubmission] = useState<Submission | null>(null);
  const [isListening, setIsListening] = useState(false);

  // SWR for initial data and caching
  const { data, error, isLoading, mutate: mutateSubmission } = useSWR(
    submissionId ? `submission-${submissionId}` : null,
    () => getSubmission(submissionId!),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  );

  // Set up real-time listener
  useEffect(() => {
    if (!submissionId || !user) return;

    setIsListening(true);
    const unsubscribe = listenToSubmission(submissionId, (submission) => {
      setRealtimeSubmission(submission);
      // Update SWR cache
      mutate(`submission-${submissionId}`, submission, false);
    });

    return () => {
      unsubscribe();
      setIsListening(false);
    };
  }, [submissionId, user]);

  // Update submission
  const updateSubmission = useCallback(
    async (updates: Partial<Submission>) => {
      if (!submissionId) return;

      try {
        // Optimistic update
        const optimisticData = { ...data, ...updates } as Submission;
        mutateSubmission(optimisticData, false);

        // Update in Firestore
        await updateSubmissionData(submissionId, updates);

        // Revalidate
        mutateSubmission();
      } catch (error) {
        console.error('Error updating submission:', error);
        // Revert optimistic update
        mutateSubmission();
        throw error;
      }
    },
    [submissionId, data, mutateSubmission]
  );

  // Claim submission (for coaches)
  const claimSubmission = useCallback(
    async () => {
      if (!submissionId || !user) {
        throw new Error('Cannot claim submission without authentication');
      }

      try {
        // Optimistic update
        const optimisticData = {
          ...data,
          claimedBy: user.uid,
          claimedByName: user.displayName || 'Coach',
          claimedAt: new Date(),
          status: 'claimed',
        } as Submission;
        mutateSubmission(optimisticData, false);

        // Claim in Firestore
        await claimSubmissionData(
          submissionId,
          user.uid,
          user.displayName || 'Coach'
        );

        // Revalidate
        mutateSubmission();
      } catch (error) {
        console.error('Error claiming submission:', error);
        // Revert optimistic update
        mutateSubmission();
        throw error;
      }
    },
    [submissionId, user, data, mutateSubmission]
  );

  // Check if user can access this submission
  const canAccess = useCallback(
    (submission: Submission | null | undefined): boolean => {
      if (!submission || !user) return false;

      // Athlete can access their own submissions
      if (submission.athleteUid === user.uid) return true;

      // Coach can access if they've claimed it or it's in their team
      if (user.role === 'coach') {
        if (submission.claimedBy === user.uid) return true;
        // TODO: Check if coach is in the same team
        return true; // For now, allow all coaches
      }

      // Superadmin can access all
      if (user.role === 'superadmin') return true;

      return false;
    },
    [user]
  );

  const submission = realtimeSubmission || data;

  return {
    submission,
    loading: isLoading && !submission,
    error,
    isListening,
    updateSubmission,
    claimSubmission,
    canAccess: canAccess(submission),
    refresh: mutateSubmission,
  };
}