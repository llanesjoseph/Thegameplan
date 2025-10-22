"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import ReviewForm from './ReviewForm';
import { useRouter, useSearchParams } from 'next/navigation';

export default function CoachReviewPage({ params }: { params: { submissionId: string } }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isEmbedded = searchParams?.get('embedded') === 'true';
  const [submission, setSubmission] = useState<any>(null);
  const [existingReview, setExistingReview] = useState<any>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      try {
        const token = await user.getIdToken();
        // Fetch submission via Admin API to bypass client rule edge cases
        const resp = await fetch(`/api/submissions/${params.submissionId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        let sub: any = null;
        if (resp.ok) {
          sub = await resp.json();
        }
        if (!sub) {
          router.push('/dashboard/coach/queue');
          return;
        }

        // If unclaimed and this coach is assigned, claim via API
        if (!sub.claimedBy && sub.coachId === user.uid) {
          try {
            await fetch(`/api/submissions/${params.submissionId}/claim`, {
              method: 'POST',
              headers: { Authorization: `Bearer ${token}` },
            });
            const refetch = await fetch(`/api/submissions/${params.submissionId}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (refetch.ok) sub = await refetch.json();
          } catch (e) {
            console.warn('Claim API failed:', e);
          }
        }

        setSubmission(sub);
        // Fetch existing review via API to avoid client permission issues
        try {
          const reviewResp = await fetch(`/api/reviews?submissionId=${params.submissionId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (reviewResp.ok) {
            const reviewData = await reviewResp.json();
            setExistingReview(reviewData.review || null);
          }
        } catch (reviewErr) {
          console.warn('Failed to fetch existing review:', reviewErr);
          setExistingReview(null);
        }
      } finally {
        setInitializing(false);
      }
    };
    if (!loading) load();
  }, [user, loading, params.submissionId, router]);

  if (loading || initializing) {
    return (
      <div className={`flex items-center justify-center ${isEmbedded ? 'h-full' : 'min-h-screen'}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className={`${isEmbedded ? 'h-full p-4' : 'container mx-auto p-6'}`}>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-semibold">Please sign in</h3>
          <p className="text-red-600 mt-2">You must be signed in as a coach to review submissions.</p>
        </div>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className={`${isEmbedded ? 'h-full p-4' : 'container mx-auto p-6'}`}>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-semibold">Submission not found</h3>
        </div>
      </div>
    );
  }

  if (submission.claimedBy && submission.claimedBy !== user.uid) {
    return (
      <div className={`${isEmbedded ? 'h-full p-4' : 'container mx-auto p-6'}`}>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-semibold">Access Denied</h3>
          <p className="text-red-600 mt-2">This submission is claimed by another coach.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${isEmbedded ? 'h-full overflow-y-auto w-full' : 'container mx-auto p-6 max-w-7xl'}`} style={{ backgroundColor: isEmbedded ? 'white' : undefined }}>
      <ReviewForm
        submission={submission}
        rubric={null}
        existingReview={existingReview}
        coachId={user.uid}
        coachName={user.displayName || 'Coach'}
        coachPhotoUrl={user.photoURL || undefined}
        isEmbedded={isEmbedded}
      />
    </div>
  );
}