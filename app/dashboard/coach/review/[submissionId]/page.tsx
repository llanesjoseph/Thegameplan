"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import ReviewForm from './ReviewForm';
import { useRouter } from 'next/navigation';

export default function CoachReviewPage({ params }: { params: { submissionId: string } }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [submission, setSubmission] = useState<any>(null);
  const [existingReview, setExistingReview] = useState<any>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      try {
        const { getSubmission, getReviewBySubmission } = await import('@/lib/data/video-critique');
        let sub = await getSubmission(params.submissionId);
        if (!sub) {
          router.push('/dashboard/coach/queue');
          return;
        }

        // If unclaimed and this coach is assigned, claim via API
        if (!sub.claimedBy && sub.coachId === user.uid) {
          try {
            const token = await user.getIdToken();
            await fetch(`/api/submissions/${params.submissionId}/claim`, {
              method: 'POST',
              headers: { Authorization: `Bearer ${token}` },
            });
            sub = await getSubmission(params.submissionId);
          } catch (e) {
            console.warn('Claim API failed:', e);
          }
        }

        setSubmission(sub);
        const rev = await getReviewBySubmission(params.submissionId);
        setExistingReview(rev);
      } finally {
        setInitializing(false);
      }
    };
    if (!loading) load();
  }, [user, loading, params.submissionId, router]);

  if (loading || initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-semibold">Please sign in</h3>
          <p className="text-red-600 mt-2">You must be signed in as a coach to review submissions.</p>
        </div>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-semibold">Submission not found</h3>
        </div>
      </div>
    );
  }

  if (submission.claimedBy && submission.claimedBy !== user.uid) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-semibold">Access Denied</h3>
          <p className="text-red-600 mt-2">This submission is claimed by another coach.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <ReviewForm
        submission={submission}
        rubric={null}
        existingReview={existingReview}
        coachId={user.uid}
        coachName={user.displayName || 'Coach'}
        coachPhotoUrl={user.photoURL || undefined}
      />
    </div>
  );
}