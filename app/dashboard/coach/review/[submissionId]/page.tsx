"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import ReviewForm from './ReviewForm';
import { useRouter, useSearchParams } from 'next/navigation';

export default function CoachReviewPage({ params }: { params: { submissionId: string } }) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isEmbedded = searchParams?.get('embedded') === 'true';

  // ALL state at top level
  const [submission, setSubmission] = useState<any>(null);
  const [existingReview, setExistingReview] = useState<any>(null);
  const [initializing, setInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // BULLETPROOF useEffect - no early returns before cleanup
  useEffect(() => {
    let isMounted = true;
    let abortController: AbortController | null = null;

    const loadSubmissionAndReview = async () => {
      try {
        // Wait for auth
        if (authLoading) {
          console.log('[COACH-REVIEW] Waiting for auth...');
          return;
        }

        // Check user
        if (!user) {
          console.log('[COACH-REVIEW] No user found');
          if (isMounted) {
            setError('Please sign in as a coach');
            setInitializing(false);
          }
          return;
        }

        console.log('[COACH-REVIEW] Loading submission:', params.submissionId);
        abortController = new AbortController();

        const token = await user.getIdToken();
        if (!isMounted) return;

        // Fetch submission
        const resp = await fetch(`/api/submissions/${params.submissionId}`, {
          headers: { 'Authorization': `Bearer ${token}` },
          signal: abortController.signal
        });

        if (!isMounted) return;

        if (!resp.ok) {
          console.error('[COACH-REVIEW] Failed to load submission:', resp.status);
          if (isMounted) {
            setError('Submission not found');
            setInitializing(false);
          }
          return;
        }

        const data = await resp.json();
        const sub = data.data?.submission || data.submission || data;
        
        if (!sub || !sub.id) {
          console.error('[COACH-REVIEW] Invalid submission data:', data);
          if (isMounted) {
            setError('Invalid submission data');
            setInitializing(false);
          }
          return;
        }

        console.log('[COACH-REVIEW] Submission loaded:', sub);

        // Auto-claim if unclaimed and assigned to this coach
        if (!sub.claimedBy && (sub.assignedCoachId === user.uid || sub.coachId === user.uid)) {
          try {
            console.log('[COACH-REVIEW] Auto-claiming submission...');
            const claimResp = await fetch(`/api/submissions/${params.submissionId}/claim`, {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${token}` },
              signal: abortController.signal
            });

            if (claimResp.ok) {
              console.log('[COACH-REVIEW] Submission claimed successfully');
              // Refetch to get updated data
              const refetchResp = await fetch(`/api/submissions/${params.submissionId}`, {
                headers: { 'Authorization': `Bearer ${token}` },
                signal: abortController.signal
              });
              if (refetchResp.ok) {
                const refetchData = await refetchResp.json();
                sub.claimedBy = user.uid;
                sub.claimedAt = new Date().toISOString();
                sub.status = 'claimed';
              }
            }
          } catch (claimErr: any) {
            if (claimErr.name !== 'AbortError') {
              console.warn('[COACH-REVIEW] Auto-claim failed:', claimErr);
            }
          }
        }

        if (!isMounted) return;
        setSubmission(sub);

        // Fetch existing review
        try {
          const reviewResp = await fetch(`/api/reviews?submissionId=${params.submissionId}`, {
            headers: { 'Authorization': `Bearer ${token}` },
            signal: abortController.signal
          });

          if (!isMounted) return;

          if (reviewResp.ok) {
            const reviewData = await reviewResp.json();
            if (isMounted) {
              setExistingReview(reviewData.review || null);
            }
          }
        } catch (reviewErr: any) {
          if (reviewErr.name !== 'AbortError') {
            console.warn('[COACH-REVIEW] Failed to fetch existing review:', reviewErr);
          }
          if (isMounted) setExistingReview(null);
        }

      } catch (err: any) {
        if (!isMounted) return;
        if (err.name === 'AbortError') {
          console.log('[COACH-REVIEW] Request aborted');
          return;
        }
        console.error('[COACH-REVIEW] Load error:', err);
        if (isMounted) {
          setError('Failed to load submission');
        }
      } finally {
        if (isMounted) {
          setInitializing(false);
        }
      }
    };

    loadSubmissionAndReview();

    return () => {
      isMounted = false;
      if (abortController) {
        abortController.abort();
      }
    };
  }, [user, authLoading, params.submissionId, router]);

  // Loading state
  if (authLoading || initializing) {
    return (
      <div className={`flex items-center justify-center ${isEmbedded ? 'h-full' : 'min-h-screen'}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4" />
          <p className="text-gray-600">Loading submission...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !user) {
    return (
      <div className={`${isEmbedded ? 'h-full p-4' : 'container mx-auto p-6'}`}>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-semibold">{error || 'Please sign in'}</h3>
          <p className="text-red-600 mt-2">{error || 'You must be signed in as a coach to review submissions.'}</p>
          {!isEmbedded && (
            <button
              onClick={() => router.push('/dashboard/coach-unified')}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Back to Dashboard
            </button>
          )}
        </div>
      </div>
    );
  }

  // No submission found
  if (!submission) {
    return (
      <div className={`${isEmbedded ? 'h-full p-4' : 'container mx-auto p-6'}`}>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-semibold">Submission not found</h3>
          <p className="text-red-600 mt-2">This submission may have been deleted or you don't have access to it.</p>
          {!isEmbedded && (
            <button
              onClick={() => router.push('/dashboard/coach-unified')}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Back to Dashboard
            </button>
          )}
        </div>
      </div>
    );
  }

  // Main review interface
  return (
    <div className={isEmbedded ? 'h-full' : 'min-h-screen bg-gray-50'}>
      <ReviewForm
        submissionId={params.submissionId}
        submission={submission}
        existingReview={existingReview}
        isEmbedded={isEmbedded}
      />
    </div>
  );
}
